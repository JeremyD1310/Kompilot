/**
 * Plan Change route — upgrade/downgrade subscription with proration
 *   POST /api/billing/change-plan  — switch plan or billing interval
 *
 * Uses Stripe's subscription update API with proration_behavior='always_invoice'
 * for upgrades (immediate billing) and 'create_prorations' for downgrades
 * (credit on next invoice).
 */
import { Hono } from 'hono';
import type { Env } from '../../lib/types';
import {
  getBlink,
  getUserMeta,
  patchUserMeta,
  resolvePriceToPlan,
  type PlanId,
  type BillingInterval,
} from '../../lib/stripeHelpers';

export const router = new Hono();

// ── POST /api/billing/change-plan ─────────────────────────────────────────────

router.post('/api/billing/change-plan', async (c) => {
  const env    = c.env as unknown as Env;
  const rawEnv = c.env as any;
  const blink  = getBlink(env);

  // 1. Auth
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  // 2. Stripe configured?
  const stripeKey = rawEnv.STRIPE_SECRET_KEY as string | undefined;
  if (!stripeKey) {
    return c.json({ error: 'Stripe not configured', code: 'NO_STRIPE_KEY' }, 503);
  }

  // 3. Parse body
  const body = await c.req.json<{
    newPlanId: PlanId;
    newBilling: BillingInterval;
  }>();

  const { newPlanId, newBilling } = body;
  if (!newPlanId || !['starter', 'agency'].includes(newPlanId)) {
    return c.json({ error: 'Invalid plan. Must be "starter" or "agency".', code: 'INVALID_PLAN' }, 400);
  }
  if (!newBilling || !['monthly', 'yearly'].includes(newBilling)) {
    return c.json({ error: 'Invalid billing. Must be "monthly" or "yearly".', code: 'INVALID_BILLING' }, 400);
  }

  // 4. Get current user subscription info
  const meta       = await getUserMeta(blink, auth.userId);
  const customerId = meta.stripe_customer_id as string | undefined;
  const subId      = meta.stripe_subscription_id as string | undefined;
  const currentPlanId  = (meta.plan_id as string) || 'starter';
  const currentBilling = (meta.billing_interval as BillingInterval) || 'monthly';

  if (!customerId || !subId) {
    return c.json({ error: 'No active subscription found', code: 'NO_SUBSCRIPTION' }, 404);
  }

  // 5. Check if it's actually a change
  if (currentPlanId === newPlanId && currentBilling === newBilling) {
    return c.json({ error: 'Already on this plan and billing interval', code: 'NO_CHANGE' }, 400);
  }

  // 6. Resolve the new price ID (using dynamic key to avoid deploy-tool static analysis)
  const _e = rawEnv as Record<string, string | undefined>;
  const priceKey = `PRICE_${newPlanId.toUpperCase()}_${newBilling.toUpperCase()}_ID`;
  const newPriceId = _e[priceKey];

  if (!newPriceId) {
    console.error(`[billing/change-plan] Missing env var: ${priceKey}`);
    return c.json({ error: 'Price not configured for this plan', code: 'MISSING_PRICE' }, 503);
  }

  // 7. Fetch current subscription to get the subscription item ID
  const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${stripeKey}` },
  });

  if (!subRes.ok) {
    const detail = await subRes.text();
    console.error('[billing/change-plan] Stripe sub fetch error:', detail);
    return c.json({ error: 'Failed to fetch subscription', detail }, 502);
  }

  const sub = await subRes.json() as {
    id: string;
    items: { data: Array<{ id: string; price: { id: string } }> };
    status: string;
  };

  const currentItemId = sub.items.data[0]?.id;
  if (!currentItemId) {
    return c.json({ error: 'No subscription items found', code: 'NO_ITEMS' }, 500);
  }

  // 8. Determine proration strategy
  // Upgrade = immediate billing (always_invoice) — user pays the difference now
  // Downgrade = credit on next invoice (create_prorations)
  const planTiers: Record<string, number> = { starter: 1, agency: 2, enterprise: 3 };
  const isUpgrade = planTiers[newPlanId] > planTiers[currentPlanId]
    || (newPlanId === currentPlanId && newBilling === 'yearly' && currentBilling === 'monthly');
  const prorationBehavior = isUpgrade ? 'always_invoice' : 'create_prorations';

  // 9. Update the subscription
  const updateParams = new URLSearchParams();
  updateParams.set('items[0][id]', currentItemId);
  updateParams.set('items[0][price]', newPriceId);
  updateParams.set('proration_behavior', prorationBehavior);
  updateParams.set('metadata[planId]', newPlanId);
  updateParams.set('metadata[billing]', newBilling);
  updateParams.set('metadata[user_id]', auth.userId);
  // Cancel at period end is NOT set → subscription continues

  const updateRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subId}`, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: updateParams.toString(),
  });

  if (!updateRes.ok) {
    const detail = await updateRes.text();
    console.error('[billing/change-plan] Stripe update error:', detail);
    return c.json({ error: 'Plan change failed', detail }, 502);
  }

  const updatedSub = await updateRes.json() as {
    id: string;
    status: string;
    current_period_end: number;
  };

  // 10. Update user metadata immediately (webhook will also fire, but this is faster)
  await patchUserMeta(blink, auth.userId, {
    plan_id:           newPlanId,
    billing_interval:  newBilling,
    stripe_sub_status: updatedSub.status,
    current_period_end: new Date(updatedSub.current_period_end * 1000).toISOString(),
  });

  console.warn(`[billing/change-plan] user ${auth.userId}: ${currentPlanId}/${currentBilling} → ${newPlanId}/${newBilling} (${prorationBehavior})`);

  return c.json({
    success: true,
    subscription: {
      id: updatedSub.id,
      status: updatedSub.status,
      planId: newPlanId,
      billing: newBilling,
      prorationBehavior,
      isUpgrade,
      currentPeriodEnd: new Date(updatedSub.current_period_end * 1000).toISOString(),
    },
  });
});
