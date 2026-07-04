/**
 * AIO + Creative Credit Pack — One-time checkout route
 *
 * POST /api/billing/credit-pack-aio
 *
 * Creates a Stripe one-time payment checkout for the "Pack AIO Sync & Creative Studio" (29€ HT).
 * On successful payment, the webhook handler grants:
 *   - 50 Luma AI video generation credits
 *   - 500 SerpApi analysis credits
 *
 * These are stored in the `user_credit_quotas` table alongside the monthly plan quotas.
 */

import { Hono } from 'hono';
import type { Env } from '../../lib/types';
import { getBlink, getUserMeta, patchUserMeta } from '../../lib/stripeHelpers';

export const router = new Hono();

// ── Pack definition ──────────────────────────────────────────────────────────

const AIO_CREATIVE_PACK = {
  priceHT: 29,           // 29 € HT
  priceCents: 2900,      // Stripe uses cents
  lumaCredits: 50,       // 50 générations vidéo Luma AI
  serpapiCredits: 500,   // 500 requêtes SerpApi
  label: 'Pack AIO Sync & Creative Studio',
  description: '50 générations vidéo Luma AI + 500 requêtes SerpApi — crédits sans limite de durée',
};

// ── POST /api/billing/credit-pack-aio ────────────────────────────────────────

router.post('/api/billing/credit-pack-aio', async (c) => {
  const env       = c.env as unknown as Env;
  const rawEnv    = c.env as any;
  const blink     = getBlink(env);
  const stripeKey = rawEnv.STRIPE_SECRET_KEY as string | undefined;

  // 1. Auth
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  // 2. Stripe configured?
  if (!stripeKey) {
    return c.json({ error: 'Stripe not configured', code: 'NO_STRIPE_KEY' }, 503);
  }

  // 3. Get or create Stripe customer
  const meta = await getUserMeta(blink, auth.userId);
  let customerId = meta.stripe_customer_id as string | undefined;

  if (!customerId) {
    const usersResult = await blink.db.users.list({ where: { id: auth.userId } });
    const user = usersResult?.[0];
    const email = (user as any)?.email || '';

    const custRes = await fetch('https://api.stripe.com/v1/customers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email,
        'metadata[userId]': auth.userId,
        'metadata[source]': 'credit_pack_aio',
      }).toString(),
    });

    if (custRes.ok) {
      const cust = await custRes.json() as { id: string };
      customerId = cust.id;
      await patchUserMeta(blink, auth.userId, { stripe_customer_id: cust.id });
    }
  }

  // 4. Create one-time checkout session
  const baseUrl = 'https://kompilot.blinkpowered.com';
  const sessionParams = new URLSearchParams({
    mode: 'payment',
    'line_items[0][price_data][currency]': 'eur',
    'line_items[0][price_data][product_data][name]': AIO_CREATIVE_PACK.label,
    'line_items[0][price_data][product_data][description]': AIO_CREATIVE_PACK.description,
    'line_items[0][price_data][unit_amount]': String(AIO_CREATIVE_PACK.priceCents),
    'line_items[0][quantity]': '1',
    success_url: `${baseUrl}/dashboard?checkout=credit_pack_aio&luma=${AIO_CREATIVE_PACK.lumaCredits}&serpapi=${AIO_CREATIVE_PACK.serpapiCredits}`,
    cancel_url: `${baseUrl}/account?tab=billing`,
    'metadata[userId]': auth.userId,
    'metadata[creditPack]': 'true',
    'metadata[packType]': 'aio_creative',
    'metadata[lumaCredits]': String(AIO_CREATIVE_PACK.lumaCredits),
    'metadata[serpapiCredits]': String(AIO_CREATIVE_PACK.serpapiCredits),
  });

  if (customerId) {
    sessionParams.set('customer', customerId);
  }

  const sessRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: sessionParams.toString(),
  });

  if (!sessRes.ok) {
    const detail = await sessRes.text();
    console.error('[billing/credit-pack-aio] Stripe error:', detail);
    return c.json({ error: 'Checkout creation failed', detail }, 502);
  }

  const session = await sessRes.json() as { url: string };

  // 5. Log the purchase attempt
  try {
    const logId = `cpaio_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await blink.db.complianceConsentLog.create({
      id:               logId,
      userId:           auth.userId,
      cgvVersion:       'CREDIT_PACK_AIO',
      cgvAccepted:      1,
      retractionWaived: 0,
      acceptedAt:       new Date().toISOString(),
      serverTimestamp:  new Date().toISOString(),
      ip:               c.req.header('cf-connecting-ip') || 'unknown',
      userAgent:        c.req.header('user-agent') || 'unknown',
      planId:           'credit_pack_aio_29',
      checkoutType:     'credit_pack_aio',
      renouncedTrial:   0,
    });
  } catch (logErr) {
    console.error('[billing/credit-pack-aio] Log failed (non-fatal):', logErr);
  }

  return c.json({
    url: session.url,
    pack: {
      priceHT: AIO_CREATIVE_PACK.priceHT,
      lumaCredits: AIO_CREATIVE_PACK.lumaCredits,
      serpapiCredits: AIO_CREATIVE_PACK.serpapiCredits,
    },
  });
});
