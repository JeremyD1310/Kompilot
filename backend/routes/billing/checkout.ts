/**
 * Billing Checkout routes
 *   POST /api/billing/checkout       — Create a Stripe checkout session (with legal consent enforcement)
 *   POST /api/billing/create-checkout — alias (unused — kept for forward-compat if needed)
 */
import { Hono } from 'hono';
import type { Env } from '../../lib/types';
import { getBlink, getUserMeta, patchUserMeta, resolveStripePrice } from '../../lib/stripeHelpers';
import { resolveSubscriptionPlan, TRIAL_DAYS } from '../../../shared/pricingCatalog';
import { resolveOneTimeProduct } from '../../lib/pricingCatalog';

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

  // 2. Stripe configured and safe for the current environment.
  if (!stripeKey) return c.json({ error: 'Stripe not configured', code: 'NO_STRIPE_KEY' }, 503);
  const appUrl = String(rawEnv.APP_URL ?? rawEnv.PUBLIC_APP_URL ?? '').trim();
  let validatedAppUrl: URL;
  try {
    validatedAppUrl = new URL(appUrl);
    if (validatedAppUrl.protocol !== 'https:') throw new Error('https required');
  } catch {
    return c.json({ error: 'APP_URL must be a valid https URL', code: 'INVALID_APP_URL' }, 503);
  }
  if (rawEnv.STRIPE_TEST_MODE === 'true' && !stripeKey.startsWith('sk_test_')) {
    return c.json({ error: 'Test mode requires a Stripe test key', code: 'TEST_KEY_REQUIRED' }, 503);
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
  const billing: 'monthly' | 'yearly' = body?.billing === 'yearly' ? 'yearly' : 'monthly';

  const resolvedPlan = resolveSubscriptionPlan(planId, billing);
  if (!resolvedPlan) return c.json({ error: 'Offre invalide', code: 'INVALID_PLAN' }, 400);

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

  // Resolve the server-owned catalog lookup key in Stripe; clients never provide prices.
  let priceId: string;
  try {
    priceId = (await resolveStripePrice(stripeKey, resolvedPlan.lookupKey, {
      recurring: true,
      testMode: rawEnv.STRIPE_TEST_MODE === 'true',
    })).id;
  } catch (error) {
    console.error('[billing/checkout] price resolution failed', error);
    return c.json({ error: 'Prix Stripe non configuré côté serveur', code: 'PRICE_NOT_CONFIGURED' }, 503);
  }

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
  const baseUrl = validatedAppUrl.origin;
  const sessionParams = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    success_url: `${baseUrl}/dashboard?checkout=success&plan=${planId}${renouncedTrial ? '&trial_skipped=1' : ''}`,
    cancel_url:  `${baseUrl}/account?tab=billing`,
    'allow_promotion_codes': 'true',
    'metadata[user_id]': auth.userId,
    'metadata[plan_id]': planId,
    'metadata[billing_interval]': billing,
    'metadata[checkout_type]': 'subscription',
    'subscription_data[metadata][user_id]': auth.userId,
    'subscription_data[metadata][plan_id]': planId,
    'subscription_data[metadata][billing_interval]': billing,
  });

  // If user renounces trial → no trial period (immediate billing from first minute).
  // Otherwise apply the standard 7-day trial.
  if (renouncedTrial) {
    // Do NOT set trial_period_days → Stripe bills immediately
    sessionParams.set('subscription_data[metadata][trial_renounced]', 'true');
  } else {
    sessionParams.set('subscription_data[trial_period_days]', String(TRIAL_DAYS));
  }

  // Enable Stripe Tax if customer exists and VAT info is available
  if (customerId) {
    sessionParams.set('customer', customerId);

    // Tax is intentionally configured outside checkout.

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
  20:  { credits: 100,  label: 'Pack Starter — 100 crédits' },
  50:  { credits: 250,  label: 'Pack Boost — 250 crédits' },
  100: { credits: 500,  label: 'Pack Pro — 500 crédits' },
  200: { credits: 1250, label: 'Pack Enterprise — 1250 crédits' },
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

  // 3. Parse body
  const body = await c.req.json<{ productId?: string }>();
  const product = resolveOneTimeProduct(body?.productId);
  if (!product || product.definition.productType !== 'topup' || !product.definition.creditAmount || product.definition.amount <= 0) {
    return c.json({ error: 'Produit de recharge invalide', code: 'INVALID_PRODUCT' }, 400);
  }
  const credits = product.definition.creditAmount;
  let priceId: string;
  try {
    priceId = (await resolveStripePrice(stripeKey, product.definition.lookupKey, {
      recurring: false,
      testMode: rawEnv.STRIPE_TEST_MODE === 'true',
    })).id;
  } catch (error) {
    console.error('[billing/credit-pack] price resolution failed', error);
    return c.json({ error: 'Prix Stripe non configuré côté serveur', code: 'PRICE_NOT_CONFIGURED' }, 503);
  }

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
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    success_url: `${baseUrl}/dashboard?checkout=credit_pack&product=${product.productId}`,
    cancel_url: `${baseUrl}/account?tab=billing`,
    'metadata[user_id]': auth.userId,
    'metadata[product_id]': product.productId,
    'metadata[product_type]': product.definition.productType,
    'metadata[credit_eligible]': 'true',
    'metadata[credit_type]': String(product.definition.creditType),
    'metadata[credit_amount]': String(credits),
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
