/**
 * Credit Packs — One-time checkout route (new pricing)
 *
 *   POST /api/billing/credit-packs — Create a Stripe checkout for one of 3 credit packs
 *
 * Packs:
 *   small  → +15 credits for 4.99 €
 *   medium → +30 credits for 7.99 €
 *   large  → +80 credits for 14.99 €
 */

import { Hono } from 'hono';
import type { Env } from '../lib/types';
import { getBlink, getUserMeta, patchUserMeta } from '../lib/stripeHelpers';
import { fetchWithTimeout } from '../lib/http';
import { ONE_TIME_PRODUCTS, getOneTimePriceEnvKey, resolveOneTimeProduct } from '../../shared/pricingCatalog';

export const router = new Hono();

// ── Pack definitions ───────────────────────────────────────────────────────────

interface PackDef {
  credits: number;
  priceCents: number;
  priceHT: number;
  label: string;
  description: string;
}

const CREDIT_PACKS: Record<string, PackDef> = {
  small: {
    credits: 15,
    priceCents: 499,
    priceHT: 4.99,
    label: 'Small — 15 crédits',
    description: '+15 crédits Machine à Contenu pour Kompilot',
  },
  medium: {
    credits: 30,
    priceCents: 799,
    priceHT: 7.99,
    label: 'Medium — 30 crédits',
    description: '+30 crédits Machine à Contenu pour Kompilot',
  },
  large: {
    credits: 80,
    priceCents: 1499,
    priceHT: 14.99,
    label: 'Large — 80 crédits',
    description: '+80 crédits Machine à Contenu pour Kompilot',
  },
};

const PACK_PRICE_KEYS: Record<string, string> = {
  small: 'PRICE_CONTENT_PACK_SMALL_ID',
  medium: 'PRICE_CONTENT_PACK_MEDIUM_ID',
  large: 'PRICE_CONTENT_PACK_LARGE_ID',
};

// ── POST /api/billing/credit-packs ─────────────────────────────────────────────

router.post('/api/billing/credit-packs', async (c) => {
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

  // 3. Parse body
  const body = await c.req.json<{ packId?: string }>();
  const packId = body?.packId;

  const product = resolveOneTimeProduct(packId);
  if (!product || product.productType !== 'topup' || product.creditType !== 'ai') {
    return c.json({ error: 'Invalid AI top-up product.', availablePacks: ONE_TIME_PRODUCTS.filter(p => p.productType === 'topup' && p.creditType === 'ai').map(p => p.id) }, 400);
  }
  const pack: PackDef = { credits: product.creditAmount ?? 0, priceCents: (product.amountEurHt ?? 0) * 100, priceHT: product.amountEurHt ?? 0, label: product.name, description: product.description };
  const priceId = rawEnv[getOneTimePriceEnvKey(product.id)] as string | undefined;
  if (!priceId) return c.json({ error: 'Credit pack price is not configured.', code: 'MISSING_PRICE' }, 503);

  // 4. Get or create Stripe customer
  const meta = await getUserMeta(blink, auth.userId);
  let customerId = meta.stripe_customer_id as string | undefined;

  if (!customerId) {
    const usersResult = await blink.db.users.list({ where: { id: auth.userId } });
    const user = usersResult?.[0];
    const email = (user as any)?.email || '';

    const custRes = await fetchWithTimeout('https://api.stripe.com/v1/customers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email,
        'metadata[userId]': auth.userId,
        'metadata[source]': 'credit_packs',
      }).toString(),
    }, 10000);

    if (custRes.ok) {
      const cust = await custRes.json() as { id: string };
      customerId = cust.id;
      await patchUserMeta(blink, auth.userId, { stripe_customer_id: cust.id });
    }
  }

  // 5. Create one-time checkout session
  const baseUrl = 'https://kompilot.fr';
  const sessionParams = new URLSearchParams({
    mode: 'payment',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    client_reference_id: auth.userId,
    success_url: `${baseUrl}/settings?tab=contenu&checkout=success&pack=${packId}`,
    cancel_url: `${baseUrl}/settings?tab=contenu&checkout=cancelled`,
    'metadata[user_id]': auth.userId,
    'metadata[type]': 'content_credit_pack',
    'metadata[creditPack]': 'true',
    'metadata[packId]': packId,
    'metadata[credits]': String(pack.credits),
    'metadata[priceId]': priceId,
  });

  if (customerId) {
    sessionParams.set('customer', customerId);
  }

  const sessRes = await fetchWithTimeout('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: sessionParams.toString(),
  }, 12000);

  if (!sessRes.ok) {
    const detail = await sessRes.text();
    console.error('[billing/credit-packs] Stripe error:', detail);
    return c.json({ error: 'Checkout creation failed', detail }, 502);
  }

  const session = await sessRes.json() as { id: string; url: string };
  if (!session.id || !session.url) return c.json({ error: 'Stripe did not return a checkout session', code: 'CHECKOUT_SESSION_MISSING' }, 502);

  // 6. Log the purchase attempt (non-blocking)
  try {
    const logId = `cpk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await blink.db.complianceConsentLog.create({
      id:               logId,
      userId:           auth.userId,
      cgvVersion:       `CREDIT_PACK_${packId.toUpperCase()}`,
      cgvAccepted:      1,
      retractionWaived: 0,
      acceptedAt:       new Date().toISOString(),
      serverTimestamp:  new Date().toISOString(),
      ip:               c.req.header('cf-connecting-ip') || 'unknown',
      userAgent:        c.req.header('user-agent') || 'unknown',
      planId:           `credit_pack_${packId}_${pack.credits}`,
      checkoutType:     'credit_pack',
      renouncedTrial:   0,
    });
  } catch (logErr) {
    console.error('[billing/credit-packs] Log failed (non-fatal):', logErr);
  }

  return c.json({
    success: true,
    checkoutUrl: session.url,
    sessionId: session.id,
    pack: {
      id: packId,
      credits: pack.credits,
      priceHT: pack.priceHT,
      priceCents: pack.priceCents,
    },
  });
});
