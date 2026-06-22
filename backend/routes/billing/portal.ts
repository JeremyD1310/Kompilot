/**
 * Billing Portal & Status routes
 *   POST /api/billing/portal  — Create a Stripe customer portal session
 *   GET  /api/billing/status  — Return current subscription status (live + cached)
 */
import { Hono } from 'hono';
import type { Env } from '../../lib/types';
import { getBlink, getUserMeta, patchUserMeta } from '../../lib/stripeHelpers';

export const router = new Hono();

// ── Customer Portal session ───────────────────────────────────────────────────

router.post('/api/billing/portal', async (c) => {
  const env        = c.env as unknown as Env;
  const rawEnv     = c.env as any;
  const blink      = getBlink(env);
  const stripeKey  = rawEnv.STRIPE_SECRET_KEY as string | undefined;

  // 1. Auth
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  // 2. Stripe configured?
  if (!stripeKey) {
    return c.json({ error: 'Stripe not configured', code: 'NO_STRIPE_KEY' }, 503);
  }

  // 3. Get customer ID
  const meta       = await getUserMeta(blink, auth.userId);
  const customerId = meta.stripe_customer_id as string | undefined;
  if (!customerId) {
    return c.json({ error: 'No Stripe customer', code: 'NO_STRIPE_CUSTOMER' }, 404);
  }

  // 4. Create portal session
  const returnUrl = 'https://kompilot.blinkpowered.com/account';
  const body      = new URLSearchParams({ customer: customerId, return_url: returnUrl });
  const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error('[billing/portal] Stripe error:', detail);
    return c.json({ error: 'Portal creation failed', detail }, 502);
  }

  const session = await res.json() as { url: string };
  return c.json({ url: session.url });
});

// ── Billing status ────────────────────────────────────────────────────────────

router.get('/api/billing/status', async (c) => {
  const env    = c.env as unknown as Env;
  const rawEnv = c.env as any;
  const blink  = getBlink(env);

  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const meta       = await getUserMeta(blink, auth.userId);
  const stripeKey  = rawEnv.STRIPE_SECRET_KEY as string | undefined;
  const subId      = meta.stripe_subscription_id as string | undefined;

  // Try to enrich with live Stripe subscription data (currentPeriodEnd, cancelAtPeriodEnd, trialEnd)
  let currentPeriodEnd:    string | null = (meta.current_period_end    as string | null) ?? null;
  let cancelAtPeriodEnd:   boolean       = (meta.cancel_at_period_end  as boolean)       ?? false;
  let trialEnd:            string | null = (meta.trial_end             as string | null) ?? null;
  let stripeStatus:        string | null = (meta.stripe_sub_status     as string | null) ?? null;

  if (stripeKey && subId) {
    try {
      const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subId}`, {
        headers: { Authorization: `Bearer ${stripeKey}` },
        signal: AbortSignal.timeout(5000),
      });
      if (subRes.ok) {
        const sub = await subRes.json() as any;
        currentPeriodEnd  = sub.current_period_end  ? new Date(sub.current_period_end * 1000).toISOString()  : null;
        cancelAtPeriodEnd = sub.cancel_at_period_end === true;
        trialEnd          = sub.trial_end            ? new Date(sub.trial_end          * 1000).toISOString()  : null;
        stripeStatus      = sub.status               ?? null;

        // Keep meta in sync (async, non-blocking)
        patchUserMeta(blink, auth.userId, {
          current_period_end:   currentPeriodEnd,
          cancel_at_period_end: cancelAtPeriodEnd,
          trial_end:            trialEnd,
          stripe_sub_status:    stripeStatus,
        }).catch(() => {/* non-fatal */});
      }
    } catch {
      // Non-fatal — fall back to cached values from meta
    }
  }

  // Normalise status: map Stripe status values to our internal ones
  const rawStatus = stripeStatus || (meta.subscription_status as string | null) || 'none';
  const statusMap: Record<string, string> = {
    active:              'active',
    trialing:            'trialing',
    past_due:            'past_due',
    canceled:            'canceled',
    cancelled:           'canceled',
    unpaid:              'past_due',
    payment_failed:      'past_due',
    incomplete:          'past_due',
    incomplete_expired:  'canceled',
  };
  const normalisedStatus = statusMap[rawStatus] ?? rawStatus;

  return c.json({
    status:               normalisedStatus,
    gracePeriodEnd:       meta.grace_period_end      || null,
    hasStripeCustomer:    !!meta.stripe_customer_id,
    planId:               meta.plan_id               || null,
    stripeSubscriptionId: subId                      || null,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    trialEnd,
  });
});
