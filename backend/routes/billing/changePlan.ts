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
  normalizeLegacyPlanForDisplay,
  resolveStripePrice,
  type BillingInterval,
} from '../../lib/stripeHelpers';
import { liveBillingConfig, isLiveBillingEnabled, liveBillingDisabledResponse, isDemoBillingRequest, demoBillingResponse } from '../../lib/liveBilling';
import { resolveSubscriptionPlan, type SubscriptionPlanId } from '../../../shared/pricingCatalog';

export const router = new Hono();

// ── POST /api/billing/change-plan ─────────────────────────────────────────────

router.post('/api/billing/change-plan', async (c) => {
  const rawEnv = c.env as Record<string, unknown>;
  const env = c.env as unknown as Env;
  const blink = getBlink(env);

  // 1. Auth
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);
  if (isDemoBillingRequest(c, rawEnv)) return demoBillingResponse(c);
  if (!isLiveBillingEnabled(rawEnv)) return liveBillingDisabledResponse(c);

  // 2. Use only the canonical restricted Live Stripe configuration.
  const live = liveBillingConfig(rawEnv);
  if (!live.config) return c.json({ error: live.error ?? 'Stripe Live is not configured', code: live.error ? 'INVALID_LIVE_BILLING_CONFIG' : 'LIVE_BILLING_NOT_CONFIGURED', missing: live.missing }, 503);
  const { stripeKey } = live.config;

  // 3. Parse body
  const body = await c.req.json<{
    newPlanId: PlanId;
    newBilling: BillingInterval;
  }>();

  const { newPlanId, newBilling } = body;
  const resolvedPlan = resolveSubscriptionPlan(newPlanId, newBilling);
  if (!resolvedPlan) {
    return c.json({ error: 'Invalid plan. Choose Pro, Multi, or Agency.', code: 'INVALID_PLAN' }, 400);
  }
  if (!newBilling || !['monthly', 'yearly'].includes(newBilling)) {
    return c.json({ error: 'Invalid billing. Must be monthly or yearly.', code: 'INVALID_BILLING' }, 400);
  }

  // 4. Get current user subscription info. Legacy values are normalized for display only.
  const meta       = await getUserMeta(blink, auth.userId);
  const customerId = meta.stripe_customer_id as string | undefined;
  const subId      = meta.stripe_subscription_id as string | undefined;
  const currentPlanId = normalizeLegacyPlanForDisplay(meta.plan_id) ?? 'pro';
  const currentBilling: BillingInterval = meta.billing_interval === 'yearly' ? 'yearly' : 'monthly';

  if (!customerId || !subId) {
    return c.json({ error: 'No active subscription found', code: 'NO_SUBSCRIPTION' }, 404);
  }

  // 5. Check if it's actually a change
  if (currentPlanId === newPlanId && currentBilling === newBilling) {
    return c.json({ error: 'Already on this plan and billing interval', code: 'NO_CHANGE' }, 400);
  }

  // 6. Resolve the server-owned Stripe price from the canonical lookup key.
  let newPriceId: string;
  try {
    newPriceId = (await resolveStripePrice(stripeKey, resolvedPlan.lookupKey, {
      recurring: true,
      testMode: false,
      currency: 'eur',
      expectedAmount: (resolvedPlan.billing === 'monthly' ? resolvedPlan.plan.monthlyPriceEurHt : resolvedPlan.plan.annualPriceEurHt) * 100,
      expectedInterval: resolvedPlan.billing === 'monthly' ? 'month' : 'year',
    })).id;
  } catch (error) {
    console.error('[billing/change-plan] price resolution failed', error);
    return c.json({ error: 'Price not configured for this plan', code: 'MISSING_PRICE' }, 503);
  }

  // 7. Fetch current subscription to get the subscription item ID
  const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subId}`, {
    method: 'GET',
    signal: AbortSignal.timeout(8000),
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
  const planTiers: Record<string, number> = { pro: 1, multi: 2, agency: 3, enterprise: 4 };
  const canonicalNewPlanId = resolvedPlan.plan.id;
  const isUpgrade = planTiers[canonicalNewPlanId] > planTiers[currentPlanId]
    || (canonicalNewPlanId === currentPlanId && newBilling === 'yearly' && currentBilling === 'monthly');
  const prorationBehavior = isUpgrade ? 'always_invoice' : 'create_prorations';

  // 9. Update the subscription
  const updateParams = new URLSearchParams();
  updateParams.set('items[0][id]', currentItemId);
  updateParams.set('items[0][price]', newPriceId);
  updateParams.set('proration_behavior', prorationBehavior);
  // Keep Stripe Tax on the subscription so proration invoices (always_invoice) and
  // every following renewal are taxed, never billed on the bare HT amount.
  updateParams.set('automatic_tax[enabled]', 'true');
  updateParams.set('metadata[planId]', canonicalNewPlanId);
  updateParams.set('metadata[billing]', newBilling);
  updateParams.set('metadata[user_id]', auth.userId);
  // Cancel at period end is NOT set → subscription continues

  const updateRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subId}`, {
    method: 'POST',
    signal: AbortSignal.timeout(8000),
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
    plan_id:           canonicalNewPlanId,
    billing_interval:  newBilling,
    stripe_sub_status: updatedSub.status,
    current_period_end: new Date(updatedSub.current_period_end * 1000).toISOString(),
  });

  console.warn(`[billing/change-plan] user ${auth.userId}: ${currentPlanId}/${currentBilling} → ${canonicalNewPlanId}/${newBilling} (${prorationBehavior})`);

  return c.json({
    success: true,
    subscription: {
      id: updatedSub.id,
      status: updatedSub.status,
      planId: canonicalNewPlanId,
      billing: newBilling,
      prorationBehavior,
      isUpgrade,
      currentPeriodEnd: new Date(updatedSub.current_period_end * 1000).toISOString(),
    },
  });
});
