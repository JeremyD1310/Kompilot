/**
 * Billing Checkout routes
 *   POST /api/billing/checkout       — Create a Stripe checkout session (with legal consent enforcement)
 *   POST /api/billing/create-checkout — alias (unused — kept for forward-compat if needed)
 */
import { Hono } from 'hono';
import type { Env } from '../../lib/types';
import { getBlink, getUserMeta, patchUserMeta } from '../../lib/stripeHelpers';
import { resolveNewPlan } from '../../lib/pricingCatalog';

export const router = new Hono();

// ── Checkout session ──────────────────────────────────────────────────────────

router.post('/api/billing/checkout', async (c) => {
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
  if (rawEnv.KOMPILOT_DEMO_MODE === 'true') {
    return c.json({ error: 'Les achats sont désactivés dans le mode démo.', code: 'DEMO_BILLING_BLOCKED' }, 403);
  }

  // 3. Parse body
  const body = await c.req.json<{
    planId: string;
    /** 'monthly' | 'yearly' — defaults to 'monthly' if missing */
    billing?: string;
    // Clickwrap compliance payload (required before Stripe session creation)
    legalConsent?: {
      cgvAccepted: boolean;
      retractionWaived: boolean;
      cgvVersion: string;       // e.g. "CGV_V1.0_2026-06"
      acceptedAt: string;       // ISO8601 client timestamp
      userAgent?: string;
      /** When true, skip the 14-day trial → immediate billing from first minute */
      renouncedTrial?: boolean;
    };
  }>();
  const planId = body?.planId;
  const billing = body?.billing;
  const resolvedPlan = resolveNewPlan(planId, billing);

  // This endpoint intentionally accepts only the canonical new catalog IDs.
  // Legacy subscriptions and legacy price secrets remain untouched and are handled by webhooks/status.
  if (!resolvedPlan) {
    return c.json({ error: 'Offre invalide', code: 'INVALID_PLAN' }, 400);
  }

  // 3b. Enforce clickwrap — both boxes must be ticked
  const consent = body?.legalConsent;
  if (!consent?.cgvAccepted || !consent?.retractionWaived) {
    return c.json({
      error: 'Consentement légal requis',
      code: 'MISSING_LEGAL_CONSENT',
      detail: 'Veuillez accepter les CGV et renoncer au droit de rétractation avant de procéder au paiement.',
    }, 422);
  }

  const currentCgvVersion = 'CGV_V1.0_2026-06';
  if (consent.cgvVersion !== currentCgvVersion) {
    return c.json({ error: 'Version des CGV obsolète', code: 'STALE_LEGAL_CONSENT' }, 422);
  }

  // ── Map planId + billing → Stripe price IDs ──────────────────────────────────
  // Price IDs are read dynamically from env and are never accepted from the browser.
  const priceId = (rawEnv as Record<string, string | undefined>)[resolvedPlan.envKey];
  if (!priceId) {
    console.warn(`[billing/checkout] Aucun price Stripe configuré pour planId="${planId}". Ajoutez les PRICE_ secrets.`);
    return c.json({ error: 'Prix Stripe non configuré côté serveur.', code: 'PRICE_NOT_CONFIGURED' }, 503);
  }

  // Persist the legal consent before any Stripe customer/session side effect.
  // The immutable audit row below is retained as a second, detailed audit record.
  const consentAt = new Date().toISOString();
  await patchUserMeta(blink, auth.userId, {
    legal_consent_at: consentAt,
    legal_consent_version: consent.cgvVersion,
    legal_consent_log: JSON.stringify({ cgvVersion: consent.cgvVersion, acceptedAt: consentAt, planId, cgvAccepted: true, retractionWaived: true, renouncedTrial: consent.renouncedTrial === true }),
  });

  // 4. Get or create Stripe customer
  const meta = await getUserMeta(blink, auth.userId);
  let customerId = meta.stripe_customer_id as string | undefined;

  if (!customerId) {
    // Get user email from auth
    const usersResult = await blink.db.users.list({ where: { id: auth.userId } });
    const user = usersResult?.[0];
    const email = String((user as any)?.email || '').trim();
    if (!email || !(user as any)?.emailVerified) {
      return c.json({ error: 'Un email de compte vérifié est requis avant le paiement.', code: 'VERIFIED_EMAIL_REQUIRED' }, 422);
    }

    const custRes = await fetch('https://api.stripe.com/v1/customers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ email, 'metadata[userId]': auth.userId }).toString(),
    });
    if (!custRes.ok) {
      return c.json({ error: 'Impossible de créer le client Stripe.' }, 502);
    }
    if (custRes.ok) {
      const cust = await custRes.json() as { id: string };
      customerId = cust.id;
      // Save customer ID in user metadata
      await blink.db.users.update(auth.userId, { metadata: JSON.stringify({ ...((meta as any) || {}), stripe_customer_id: cust.id }) });
    }
  }

  // 5. Create checkout session
  const renouncedTrial = consent!.renouncedTrial === true;
  const baseUrl = 'https://kompilot.blinkpowered.com';
  const sessionParams = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    // Canonical catalog trials do not collect a card; Stripe will request one only when required.
    ...(renouncedTrial ? {} : { payment_method_collection: 'if_required' }),
    'metadata[user_id]': auth.userId,
    'metadata[planId]': planId,
    'metadata[billing]': billing,
    'metadata[product_type]': 'subscription',
    success_url: `${baseUrl}/dashboard?checkout=success&plan=${planId}${renouncedTrial ? '&trial_skipped=1' : ''}`,
    cancel_url:  `${baseUrl}/account?tab=billing`,
    'allow_promotion_codes': 'true',
    'subscription_data[metadata][planId]': planId,
    'subscription_data[metadata][billing]': billing,
    'subscription_data[metadata][product_type]': 'subscription',
    'subscription_data[metadata][legal_consent_version]': consent!.cgvVersion,
    'subscription_data[metadata][legal_consent]': 'accepted',
  });

  // If user renounces trial → no trial period (immediate billing from first minute).
  // Otherwise apply the new catalog's standard 14-day trial.
  if (renouncedTrial) {
    // Do NOT set trial_period_days → Stripe bills immediately
    sessionParams.set('subscription_data[metadata][trial_renounced]', 'true');
  } else {
    sessionParams.set('subscription_data[trial_period_days]', '14');
  }

  // Enable Stripe Tax if customer exists and VAT info is available
  if (customerId) {
    sessionParams.set('customer', customerId);
    sessionParams.set('automatic_tax[enabled]', 'true');

    // If customer has VAT info, use it for tax calculation
    const vatNumber = meta.vat_number as string | undefined;
    const vatCountry = meta.vat_country as string | undefined;
    if (vatNumber && vatCountry) {
      sessionParams.set('customer_update[shipping]', 'auto'); // Auto-update shipping address if provided
      sessionParams.set('customer_update[billing]', 'auto'); // Auto-update billing address if provided
      sessionParams.set('tax_id_collection[enabled]', 'true'); // Collect tax ID if not present
      sessionParams.set('tax_id_collection[fallback_behavior]', 'auto'); // Auto-apply tax ID if available
    }
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
    console.error('[billing/checkout] Stripe error:', detail);
    return c.json({ error: 'Checkout creation failed', detail }, 502);
  }

  const session = await sessRes.json() as { url: string };

  // ── Persist clickwrap compliance log (immuable, anti-chargeback) ─────────────
  // Stored in: (1) user metadata for quick access, (2) compliance_consent_log table for immutable audit trail.
  try {
    const clientIp =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      c.req.header('x-real-ip') ||
      'unknown';
    const serverTs = new Date().toISOString();

    // 1. Patch user metadata (fast read access for billing status)
    await patchUserMeta(blink, auth.userId, {
      legal_consent_log: JSON.stringify({
        cgvVersion:        consent!.cgvVersion,
        acceptedAt:        serverTs,
        serverTimestamp:   serverTs,
        ip:                clientIp,
        userAgent:         consent!.userAgent || c.req.header('user-agent') || 'unknown',
        planId,
        cgvAccepted:       true,
        retractionWaived:  true,
        renouncedTrial:    renouncedTrial,
      }),
      legal_consent_at:      serverTs,
      legal_consent_version: consent!.cgvVersion,
      legal_consent_ip:      clientIp,
      ...(renouncedTrial ? {
        renounced_trial:    true,
        trial_renounced_at: serverTs,
        trial_renounced_ip: clientIp,
      } : {}),
    });

    // 2. Write immutable row to compliance_consent_log (anti-chargeback audit trail)
    const logId = `ccl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await blink.db.complianceConsentLog.create({
      id:                logId,
      userId:            auth.userId,
      cgvVersion:        consent!.cgvVersion,
      cgvAccepted:       1,
      retractionWaived:  1,
      acceptedAt:        serverTs,
      serverTimestamp:   serverTs,
      ip:                clientIp,
      userAgent:         consent!.userAgent || c.req.header('user-agent') || 'unknown',
      planId,
      checkoutType:      'subscription',
      renouncedTrial:    renouncedTrial ? 1 : 0,
      trialRenouncedAt:  renouncedTrial ? serverTs : null,
    });

    console.log(`[billing/checkout] Compliance log saved → user ${auth.userId} / logId ${logId} / IP ${clientIp} / CGV ${consent!.cgvVersion}`);
  } catch (logErr) {
    console.error('[billing/checkout] Failed to save compliance log:', logErr);
    return c.json({ error: 'Impossible d’enregistrer le consentement légal. Aucun paiement n’a été lancé.', code: 'LEGAL_AUDIT_UNAVAILABLE' }, 503);
  }

  return c.json({ url: session.url });
});

// ── Credit Pack Checkout (one-time payment) ─────────────────────────────────

const CREDIT_PACK_PRICES: Record<number, { credits: number; label: string }> = {
  19: { credits: 250, label: 'Recharge — 250 crédits IA' },
  49: { credits: 750, label: 'Recharge — 750 crédits IA' },
  99: { credits: 2000, label: 'Recharge — 2 000 crédits IA' },
};

router.post('/api/billing/credit-pack', async (c) => {
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
  if (rawEnv.KOMPILOT_DEMO_MODE === 'true') {
    return c.json({ error: 'Les achats sont désactivés dans le mode démo.', code: 'DEMO_BILLING_BLOCKED' }, 403);
  }

  // 3. Parse body
  const body = await c.req.json<{ amount?: number }>();
  const amount = body?.amount;

  if (!amount || amount < 5) {
    return c.json({ error: 'Montant invalide. Minimum : 5 €.' }, 400);
  }

  // 4. Determine pack credits (or custom amount at 0.20€/credit)
  const pack = CREDIT_PACK_PRICES[amount];
  const credits = pack?.credits ?? Math.floor(amount / 0.2);
  const label = pack?.label ?? `Recharge libre — ${credits} crédits`;

  // 5. Get or create Stripe customer
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
      body: new URLSearchParams({ email, 'metadata[userId]': auth.userId }).toString(),
    });
    if (custRes.ok) {
      const cust = await custRes.json() as { id: string };
      customerId = cust.id;
      await blink.db.users.update(auth.userId, {
        metadata: JSON.stringify({ ...((meta as any) || {}), stripe_customer_id: cust.id }),
      });
    }
  }

  // 6. Create one-time checkout session
  const baseUrl = 'https://kompilot.blinkpowered.com';
  const sessionParams = new URLSearchParams({
    mode: 'payment',
    'line_items[0][price_data][currency]': 'eur',
    'line_items[0][price_data][product_data][name]': label,
    'line_items[0][price_data][product_data][description]': `${credits} crédits IA pour Kompilot`,
    'line_items[0][price_data][unit_amount]': String(amount * 100), // Stripe uses cents
    'line_items[0][quantity]': '1',
    success_url: `${baseUrl}/dashboard?checkout=credit_pack&credits=${credits}`,
    cancel_url: `${baseUrl}/account?tab=billing`,
    'metadata[userId]': auth.userId,
    'metadata[creditPack]': 'true',
    'metadata[credits]': String(credits),
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
    console.error('[billing/credit-pack] Stripe error:', detail);
    return c.json({ error: 'Checkout creation failed', detail }, 502);
  }

  const session = await sessRes.json() as { url: string };

  // 7. Log the credit pack purchase attempt
  try {
    const logId = `cp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await blink.db.complianceConsentLog.create({
      id:               logId,
      userId:           auth.userId,
      cgvVersion:       'CREDIT_PACK',
      cgvAccepted:      1,
      retractionWaived: 0,
      acceptedAt:       new Date().toISOString(),
      serverTimestamp:  new Date().toISOString(),
      ip:               c.req.header('cf-connecting-ip') || 'unknown',
      userAgent:        c.req.header('user-agent') || 'unknown',
      planId:           `credit_pack_${credits}`,
      checkoutType:     'credit_pack',
      renouncedTrial:   0,
    });
  } catch (logErr) {
    console.error('[billing/credit-pack] Log failed (non-fatal):', logErr);
  }

  return c.json({ url: session.url });
});
