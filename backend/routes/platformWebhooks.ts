/**
 * Unified Inbox Webhooks — Platform review ingestion.
 *
 * Centralizes reviews from Planity, Doctolib, Booking.com, Airbnb,
 * Vroomly, iDGarages, TheFork, etc. into the messages table.
 *
 * Extracted from webhooks.ts for single-responsibility.
 */
import { Hono } from 'hono';
import type { Env } from '../lib/types';
import { getBlink } from '../lib/stripeHelpers';

export const platformWebhooksRouter = new Hono();

interface PlatformReviewPayload {
  externalId?: string;
  authorName?: string;
  rating?: number;
  text?: string;
  publishedAt?: string;
  reviewUrl?: string;
  businessId?: string;
  platformToken?: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  planity:         'Planity',
  treatwell:       'Treatwell',
  fresha:          'Fresha',
  salonkee:        'Salonkee',
  doctolib:        'Doctolib',
  ameli:           'Ameli Pro',
  livi:            'Livi / Qare',
  thefork:         'TheFork',
  ubereats:        'Uber Eats',
  deliveroo:       'Deliveroo',
  tripadvisor:     'TripAdvisor',
  booking:         'Booking.com',
  airbnb:          'Airbnb',
  vroomly:         'Vroomly',
  idgarages:       'iDGarages',
  automobiles:     'Automobiles.com',
  google_business: 'Google Business',
};

platformWebhooksRouter.post('/api/webhooks/platform/:slug', async (c) => {
  const env   = c.env as unknown as Env;
  const slug  = c.req.param('slug');
  const blink = getBlink(env);

  if (!PLATFORM_LABELS[slug]) {
    return c.json({ error: `Unknown platform slug: ${slug}` }, 400);
  }

  let payload: PlatformReviewPayload;
  try {
    payload = await c.req.json<PlatformReviewPayload>();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  // Resolve userId from businessId
  let targetUserId: string | null = null;
  if (payload.businessId) {
    try {
      const rows = await blink.db.establishments.list({
        where: { siret: payload.businessId },
        limit: 1,
      });
      if (rows.length > 0) targetUserId = rows[0].userId;
    } catch { /* non-blocking */ }
  }

  // Normalize into unified inbox message
  const platformLabel = PLATFORM_LABELS[slug] ?? slug;
  const stars = payload.rating ? '⭐'.repeat(Math.min(5, Math.max(1, Math.round(payload.rating)))) : '';
  const subject = `${stars} Nouvel avis ${platformLabel}${payload.authorName ? ` — ${payload.authorName}` : ''}`;
  const body = [
    payload.text ? `"${payload.text}"` : '',
    payload.rating ? `Note : ${payload.rating}/5` : '',
    payload.publishedAt ? `Publié le : ${new Date(payload.publishedAt).toLocaleDateString('fr-FR')}` : '',
    payload.reviewUrl ? `Voir l'avis : ${payload.reviewUrl}` : '',
  ].filter(Boolean).join('\n\n');

  try {
    await blink.db.messages.create({
      id:          crypto.randomUUID(),
      userId:      targetUserId ?? 'system',
      senderName:  payload.authorName ?? `${platformLabel} User`,
      senderEmail: `noreply@${slug}.webhook.kompilot`,
      subject,
      body:        body || `Avis reçu via ${platformLabel}`,
      isRead:      false,
      createdAt:   payload.publishedAt ?? new Date().toISOString(),
      isArchived:  0,
      isStarred:   payload.rating && payload.rating >= 4 ? 1 : 0,
    });

    console.warn(`[webhook/${slug}] Review stored → userId: ${targetUserId}, rating: ${payload.rating}`);
    return c.json({ success: true, platform: platformLabel, stored: true, userId: targetUserId ?? 'system' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[webhook/${slug}] DB error:`, msg);
    return c.json({ error: 'Storage failed', detail: msg }, 500);
  }
});

// GET endpoint for webhook registration verification
platformWebhooksRouter.get('/api/webhooks/platform/:slug', (c) => {
  const slug = c.req.param('slug');
  const challenge = c.req.query('hub.challenge') ?? c.req.query('challenge');
  if (challenge) return c.text(challenge);
  return c.json({
    ok: true,
    platform: PLATFORM_LABELS[slug] ?? slug,
    endpoint: `/api/webhooks/platform/${slug}`,
    description: 'Kompilot Unified Inbox Webhook — POST to receive platform reviews',
  });
});
