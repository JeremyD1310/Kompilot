/**
 * leadCapture.ts — Lead capture routes
 *
 * POST /api/leads/capture         — save captured lead + trigger SMS
 * GET  /api/leads/captured        — list captured leads for the authenticated pro
 * GET  /api/leads/agency/search   — Google Places proxy (agency lead maps scraper)
 */
import { Hono } from 'hono';
import { getBlink } from '../lib/stripeHelpers';
import type { Env } from '../lib/types';

export const router = new Hono();

// ── POST /api/leads/capture — Widget lead capture + auto SMS ──────────────────

router.post('/api/leads/capture', async (c) => {
  const env    = c.env as unknown as Env;
  const rawEnv = c.env as any;
  const blink  = getBlink(env);

  // Auth — widget can submit as authenticated or with a pro API key header
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json<{
    firstName:        string;
    lastName:         string;
    phone:            string;
    email?:           string;
    offerLabel?:      string;
    couponCode?:      string;
    establishmentId?: string;
    campaignId?:      string;
    source?:          string;
  }>();

  if (!body?.firstName || !body?.lastName || !body?.phone) {
    return c.json({ error: 'firstName, lastName and phone are required' }, 400);
  }

  // Sanitise phone
  const phone = body.phone.replace(/\s/g, '').replace(/^00/, '+');

  // 1. Save to captured_leads
  const leadId = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    await blink.db.capturedLeads.create({
      id:              leadId,
      userId:          auth.userId,
      establishmentId: body.establishmentId ?? null,
      campaignId:      body.campaignId ?? null,
      firstName:       body.firstName.trim(),
      lastName:        body.lastName.trim(),
      phone,
      email:           body.email ?? null,
      source:          body.source ?? 'widget',
      offerLabel:      body.couponCode
        ? `${body.offerLabel ?? 'Offre'} [CODE: ${body.couponCode.toUpperCase()}]`
        : (body.offerLabel ?? null),
      smsSent:         0,
    });
  } catch (dbErr) {
    console.error('[leadCapture] DB error:', dbErr);
    return c.json({ error: 'Failed to save lead' }, 500);
  }

  // 2. Send Smart SMS via Twilio / SMS provider if configured
  let smsSent = false;
  let smsMessage = '';
  const twilioSid    = rawEnv.TWILIO_ACCOUNT_SID as string | undefined;
  const twilioToken  = rawEnv.TWILIO_AUTH_TOKEN  as string | undefined;
  const twilioFrom   = rawEnv.TWILIO_PHONE_FROM  as string | undefined;

  if (twilioSid && twilioToken && twilioFrom) {
    const offerText = body.offerLabel
      ? body.offerLabel
      : 'Merci de votre intérêt !';

    // Include coupon code if provided
    const couponPart = body.couponCode
      ? ` 🎟️ Votre code : ${body.couponCode.toUpperCase()}`
      : '';

    smsMessage = `Bonjour ${body.firstName} 👋 ${offerText}${couponPart} — Retrouvez-nous bientôt. Propulsé par Kompilot.`;

    try {
      const twilioRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To:   phone,
            From: twilioFrom,
            Body: smsMessage,
          }).toString(),
          signal: AbortSignal.timeout(8000),
        },
      );
      if (twilioRes.ok) {
        smsSent = true;
        await blink.db.capturedLeads.update(leadId, {
          smsSent:   1,
          smsSentAt: new Date().toISOString(),
          smsMessage,
        });
      } else {
        console.warn('[leadCapture] Twilio response:', await twilioRes.text());
      }
    } catch (smsErr) {
      console.error('[leadCapture] SMS error (non-fatal):', smsErr);
    }
  }

  return c.json({
    success: true,
    leadId,
    smsSent,
    message: smsSent
      ? 'Lead enregistré et SMS envoyé avec succès.'
      : twilioSid
        ? 'Lead enregistré. SMS non envoyé (erreur SMS).'
        : 'Lead enregistré. SMS non configuré (ajoutez TWILIO_* dans les secrets).',
  });
});

// ── GET /api/leads/captured — list leads for the authenticated pro ─────────────

router.get('/api/leads/captured', async (c) => {
  const env   = c.env as unknown as Env;
  const blink = getBlink(env);

  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const limit = Math.min(Number(c.req.query('limit') ?? 100), 200);

  try {
    const leads = await blink.db.capturedLeads.list({
      where: { userId: auth.userId },
      limit,
      orderBy: { createdAt: 'desc' },
    });
    return c.json({ leads: leads ?? [] });
  } catch {
    return c.json({ leads: [] });
  }
});

// ── GET /api/leads/agency/search — Google Places proxy for agency lead scraper ─
// Query params: q (business type), location (city/postal), pagetoken (pagination)

router.get('/api/leads/agency/search', async (c) => {
  const env    = c.env as unknown as Env;
  const rawEnv = c.env as any;
  const blink  = getBlink(env);

  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const query    = c.req.query('q');
  const location = c.req.query('location');
  const pagetoken = c.req.query('pagetoken');

  if (!query || !location) {
    return c.json({ error: 'q and location are required' }, 400);
  }

  const googleKey = rawEnv.GOOGLE_PLACES_API_KEY as string | undefined;

  // ── No Google key: return realistic mock data so UI works without setup ───
  if (!googleKey) {
    const mockPlaces = generateMockPlaces(query, location);
    return c.json({
      places: mockPlaces,
      nextPageToken: null,
      totalFound: mockPlaces.length,
      isMock: true,
      hint: 'Ajoutez GOOGLE_PLACES_API_KEY dans vos secrets pour des données réelles.',
    });
  }

  // ── Real Google Places Text Search ───────────────────────────────────────
  try {
    const searchText = `${query} ${location}`;
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.set('query', searchText);
    url.searchParams.set('language', 'fr');
    url.searchParams.set('region', 'fr');
    url.searchParams.set('key', googleKey);
    if (pagetoken) url.searchParams.set('pagetoken', pagetoken);

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) {
      return c.json({ error: 'Google Places API error', status: res.status }, 502);
    }

    const data = await res.json() as {
      status: string;
      results: any[];
      next_page_token?: string;
      error_message?: string;
    };

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return c.json({ error: data.error_message ?? data.status }, 502);
    }

    // Fetch details (phone, website) for up to 20 results per page
    const places = await Promise.all(
      (data.results ?? []).slice(0, 20).map(async (place: any) => {
        let phone    = '';
        let website  = '';
        try {
          const detailUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
          detailUrl.searchParams.set('place_id', place.place_id);
          detailUrl.searchParams.set('fields', 'formatted_phone_number,website');
          detailUrl.searchParams.set('key', googleKey);
          const detailRes = await fetch(detailUrl.toString(), { signal: AbortSignal.timeout(5000) });
          if (detailRes.ok) {
            const detail = await detailRes.json() as { result: { formatted_phone_number?: string; website?: string } };
            phone   = detail.result?.formatted_phone_number ?? '';
            website = detail.result?.website ?? '';
          }
        } catch { /* non-fatal */ }

        const reviewCount = place.user_ratings_total ?? 0;
        const rating      = place.rating ?? 0;

        // Determine status flags
        const hasUnrespondedReviews = reviewCount > 5 && rating < 4.2;
        const isAiInvisible = !website || reviewCount < 10;

        return {
          placeId:        place.place_id,
          name:           place.name,
          address:        place.formatted_address ?? '',
          phone,
          website,
          reviewCount,
          rating,
          hasUnrespondedReviews,
          isAiInvisible,
          status:         hasUnrespondedReviews
            ? 'unresponded_reviews'
            : isAiInvisible
              ? 'ai_invisible'
              : 'ok',
        };
      }),
    );

    return c.json({
      places,
      nextPageToken: data.next_page_token ?? null,
      totalFound:    data.results?.length ?? 0,
      isMock:        false,
    });
  } catch (err) {
    console.error('[leadCapture/agency/search] Error:', err);
    return c.json({ error: 'Places API unavailable', detail: String(err) }, 502);
  }
});

// ── Mock data generator (when no API key configured) ─────────────────────────

function generateMockPlaces(query: string, location: string) {
  const names = [
    `${query} du Centre`, `${query} de la Place`, `${query} Saint-Michel`,
    `${query} Léon`, `${query} Martin`, `Les Experts ${query}`,
    `${query} Dupont & Fils`, `${query} Premium`, `${query} Express`,
    `Atelier ${query}`, `${query} Moderne`, `${query} & Co`,
    `Studio ${query}`, `${query} Pro`, `${query} Plus`,
  ];

  return names.map((name, i) => {
    const reviewCount   = Math.floor(Math.random() * 200) + 5;
    const rating        = +(3.2 + Math.random() * 1.8).toFixed(1);
    const hasWebsite    = Math.random() > 0.4;
    const hasPhone      = Math.random() > 0.2;
    const hasUnresponded = reviewCount > 20 && rating < 4.3;
    const isAiInvisible  = !hasWebsite || reviewCount < 15;

    return {
      placeId:              `mock_${i}_${Date.now()}`,
      name,
      address:              `${Math.floor(Math.random() * 100) + 1} Rue de la Paix, ${location}`,
      phone:                hasPhone ? `+33 ${Math.floor(Math.random() * 9) + 1} ${String(Math.floor(Math.random() * 90000000) + 10000000).replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4')}` : '',
      website:              hasWebsite ? `https://www.${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.fr` : '',
      reviewCount,
      rating,
      hasUnrespondedReviews: hasUnresponded,
      isAiInvisible,
      status:               hasUnresponded
        ? 'unresponded_reviews'
        : isAiInvisible
          ? 'ai_invisible'
          : 'ok',
    };
  });
}
