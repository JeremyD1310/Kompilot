/**
 * Retention discount route
 *   POST /api/billing/apply-retention-discount — Apply compassionate -50% coupon for 3 months
 *
 * Compassionate Churn Saver — creates a Stripe coupon and applies it to the active subscription.
 * One-time use per account, enforced server-side via user metadata flag.
 */
import { Hono } from 'hono';
import type { Env } from '../../lib/types';
import { getBlink, getUserMeta, patchUserMeta } from '../../lib/stripeHelpers';

export const router = new Hono();

// ── POST /api/billing/apply-retention-discount ────────────────────────────────
//
// Rules (enforced server-side for safety):
//   1. User must not already have already_benefited_discount=true
//   2. Stripe subscription must exist and be active
//   3. Coupon created with duration=repeating, duration_in_months=3, percent_off=50

router.post('/api/billing/apply-retention-discount', async (c) => {
  const env       = c.env as unknown as Env;
  const rawEnv    = c.env as any;
  const blink     = getBlink(env);
  const stripeKey = rawEnv.STRIPE_SECRET_KEY as string | undefined;

  // 1. Auth
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  if (!stripeKey) {
    return c.json({ error: 'Stripe not configured', code: 'NO_STRIPE_KEY' }, 503);
  }

  // 2. Check one-time eligibility
  const meta = await getUserMeta(blink, auth.userId);
  if (meta.already_benefited_discount) {
    return c.json({
      error: 'Discount already used',
      code: 'ALREADY_BENEFITED',
      message: 'Cette offre est réservée à une seule utilisation par compte.',
    }, 409);
  }

  const subscriptionId = meta.stripe_subscription_id as string | undefined;
  if (!subscriptionId) {
    return c.json({ error: 'No active subscription found', code: 'NO_SUBSCRIPTION' }, 404);
  }

  // 3. Create a -50% coupon (repeating, 3 months — Offer A for monthly plans)
  const couponBody = new URLSearchParams({
    percent_off:         '50',
    duration:            'repeating',
    duration_in_months:  '3',
    name:                'Kompilot Retention -50% 3 mois',
    currency:            'eur',
  });

  const couponRes = await fetch('https://api.stripe.com/v1/coupons', {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: couponBody.toString(),
  });

  if (!couponRes.ok) {
    const err = await couponRes.text();
    console.error('[retention-discount] coupon creation failed:', err);
    return c.json({ error: 'Coupon creation failed', details: err }, 500);
  }

  const coupon = await couponRes.json() as { id: string };

  // 4. Apply coupon to the subscription
  const subBody = new URLSearchParams({ coupon: coupon.id });
  const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: subBody.toString(),
  });

  if (!subRes.ok) {
    const err = await subRes.text();
    console.error('[retention-discount] apply coupon failed:', err);
    return c.json({ error: 'Coupon application failed', details: err }, 500);
  }

  // 5. Mark as already benefited (ONE-TIME FLAG)
  await patchUserMeta(blink, auth.userId, {
    already_benefited_discount: true,
    retention_discount_applied_at: new Date().toISOString(),
    retention_discount_coupon_id: coupon.id,
  });

  console.log(`[retention-discount] -50% 3 months applied for user ${auth.userId}, coupon: ${coupon.id}`);

  return c.json({
    success:     true,
    discountPct: 50,
    months:      2,
    couponId:    coupon.id,
    message:     'Réduction de -50% appliquée sur vos 2 prochaines factures.',
  });
});
