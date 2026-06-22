/**
 * Refund & cancellation routes
 *   GET  /api/billing/refund-eligibility — Check B2B status + days since purchase
 *   POST /api/billing/process-refund     — Execute refund / cancellation / B2B action
 */
import { Hono } from 'hono';
import type { Env } from '../../lib/types';
import { getBlink, getUserMeta, patchUserMeta } from '../../lib/stripeHelpers';

export const router = new Hono();

// ── Refund Eligibility check ──────────────────────────────────────────────────
/**
 * GET /api/billing/refund-eligibility
 *
 * Returns whether the user is eligible for a refund:
 *  - isB2B: determined by user metadata (has SIRET / VAT) or agency plan
 *  - daysSincePurchase: computed from the subscription / invoice data
 *  - eligible: true if !isB2B && daysSincePurchase <= 14
 */
router.get('/api/billing/refund-eligibility', async (c) => {
  const env       = c.env as unknown as Env;
  const rawEnv    = c.env as any;
  const blinkSdk  = getBlink(env);
  const stripeKey = rawEnv.STRIPE_SECRET_KEY as string | undefined;

  const auth = await blinkSdk.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const meta = await getUserMeta(blinkSdk, auth.userId);

  // Determine B2B: SIRET present, or VAT number, or plan includes 'agency'
  const siret       = (meta.siret ?? meta.business_siret ?? '') as string;
  const vatNumber   = (meta.vat_number ?? '') as string;
  const planId      = (meta.plan_id ?? '') as string;
  const isB2B       = Boolean(siret.trim()) || Boolean(vatNumber.trim()) || planId.includes('agency');

  // Default fallback when Stripe not configured
  if (!stripeKey) {
    return c.json({
      isB2B,
      daysSincePurchase: 0,
      purchaseDate: null,
      subscriptionEndDate: null,
      amountPaid: 0,
      currency: 'EUR',
      eligible: !isB2B,
    });
  }

  const customerId = (meta.stripe_customer_id ?? '') as string;
  if (!customerId) {
    return c.json({
      isB2B,
      daysSincePurchase: 0,
      purchaseDate: null,
      subscriptionEndDate: null,
      amountPaid: 0,
      currency: 'EUR',
      eligible: !isB2B,
    });
  }

  // Fetch latest paid invoice to determine purchase date and amount
  const invoiceRes = await fetch(
    `https://api.stripe.com/v1/invoices?customer=${customerId}&status=paid&limit=1`,
    { headers: { Authorization: `Bearer ${stripeKey}` } },
  );

  let purchaseDate: string | null = null;
  let amountPaid  = 0;
  let currency    = 'EUR';
  let subscriptionEndDate: string | null = null;
  let subscriptionId: string | null = null;

  if (invoiceRes.ok) {
    const inv = await invoiceRes.json() as { data: Array<{
      created: number; amount_paid: number; currency: string;
      subscription: string | null; period_end: number;
    }> };
    const latest = inv.data[0];
    if (latest) {
      purchaseDate  = new Date(latest.created * 1000).toISOString();
      amountPaid    = latest.amount_paid;
      currency      = (latest.currency ?? 'eur').toUpperCase();
      subscriptionId = latest.subscription;
      subscriptionEndDate = new Date(latest.period_end * 1000).toISOString();
    }
  }

  // Fetch subscription period_end if not set from invoice
  if (subscriptionId && !subscriptionEndDate) {
    const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      headers: { Authorization: `Bearer ${stripeKey}` },
    });
    if (subRes.ok) {
      const sub = await subRes.json() as { current_period_end: number };
      subscriptionEndDate = new Date(sub.current_period_end * 1000).toISOString();
    }
  }

  // Calculate days since purchase
  const daysSincePurchase = purchaseDate
    ? Math.floor((Date.now() - new Date(purchaseDate).getTime()) / 86_400_000)
    : 0;

  const eligible = !isB2B && daysSincePurchase <= 14;

  return c.json({
    isB2B,
    daysSincePurchase,
    purchaseDate,
    subscriptionEndDate,
    amountPaid,
    currency,
    eligible,
  });
});

// ── Process refund / cancellation ────────────────────────────────────────────
/**
 * POST /api/billing/process-refund
 * body: { action: 'refund_now' | 'cancel_at_period_end' | 'b2b_freeze_request' | 'b2b_transfer_request' | 'b2b_escalate' }
 *
 * refund_now:             Stripe refund + immediate subscription cancellation (≤14j consumer)
 * cancel_at_period_end:   Set cancel_at_period_end=true (>14j consumer or B2B preference)
 * b2b_freeze_request:     Log request and notify team (B2B alternative)
 * b2b_transfer_request:   Log request and notify team (B2B alternative)
 * b2b_escalate:           Log escalation and notify responsible (B2B edge case)
 */
router.post('/api/billing/process-refund', async (c) => {
  const env       = c.env as unknown as Env;
  const rawEnv    = c.env as any;
  const blinkSdk  = getBlink(env);
  const stripeKey = rawEnv.STRIPE_SECRET_KEY as string | undefined;

  const auth = await blinkSdk.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json<{ action: string }>();
  const action = body?.action;

  // Non-Stripe actions: log and return success
  if (action === 'b2b_freeze_request' || action === 'b2b_transfer_request' || action === 'b2b_escalate') {
    await patchUserMeta(blinkSdk, auth.userId, {
      [`${action}_requested_at`]: new Date().toISOString(),
      [`${action}_status`]: 'pending',
    });
    console.log(`[process-refund] ${action} logged for user ${auth.userId}`);
    return c.json({ success: true, action });
  }

  if (!stripeKey) {
    return c.json({ success: true, code: 'NO_STRIPE_KEY', message: 'Stripe not configured — action simulated.' });
  }

  const meta       = await getUserMeta(blinkSdk, auth.userId);
  const customerId = (meta.stripe_customer_id ?? '') as string;
  if (!customerId) {
    return c.json({ success: true, code: 'NO_SUBSCRIPTION', message: 'No Stripe customer.' });
  }

  // Fetch active subscription
  const subsRes = await fetch(
    `https://api.stripe.com/v1/subscriptions?customer=${customerId}&status=active&limit=1`,
    { headers: { Authorization: `Bearer ${stripeKey}` } },
  );
  const subs = await subsRes.json() as { data: Array<{ id: string }> };
  const subscriptionId = subs.data[0]?.id;

  if (!subscriptionId) {
    return c.json({ success: true, code: 'NO_SUBSCRIPTION', message: 'No active subscription found.' });
  }

  // ── cancel_at_period_end ─────────────────────────────────────────────────
  if (action === 'cancel_at_period_end') {
    const cancelRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ cancel_at_period_end: 'true' }).toString(),
    });
    if (!cancelRes.ok) {
      const err = await cancelRes.text();
      return c.json({ error: 'Failed to schedule cancellation', details: err }, 502);
    }
    await patchUserMeta(blinkSdk, auth.userId, {
      cancel_scheduled_at: new Date().toISOString(),
      cancel_at_period_end: true,
    });
    console.log(`[process-refund] cancel_at_period_end set for user ${auth.userId}`);
    return c.json({ success: true, action });
  }

  // ── refund_now ───────────────────────────────────────────────────────────
  if (action === 'refund_now') {
    // 1. Get latest paid invoice charge
    const invoiceRes = await fetch(
      `https://api.stripe.com/v1/invoices?customer=${customerId}&status=paid&limit=1`,
      { headers: { Authorization: `Bearer ${stripeKey}` } },
    );
    if (!invoiceRes.ok) {
      return c.json({ error: 'Failed to fetch invoice' }, 502);
    }
    const inv = await invoiceRes.json() as { data: Array<{ charge: string | null; amount_paid: number }> };
    const chargeId = inv.data[0]?.charge;
    const amountPaid = inv.data[0]?.amount_paid ?? 0;

    // 2. Cancel subscription immediately
    const cancelRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    if (!cancelRes.ok) {
      const err = await cancelRes.text();
      return c.json({ error: 'Failed to cancel subscription', details: err }, 502);
    }

    // 3. Issue refund if charge exists
    if (chargeId && amountPaid > 0) {
      const refundBody = new URLSearchParams({ charge: chargeId });
      const refundRes = await fetch('https://api.stripe.com/v1/refunds', {
        method: 'POST',
        headers: { Authorization: `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: refundBody.toString(),
      });
      if (!refundRes.ok) {
        const err = await refundRes.text();
        console.error('[process-refund] Refund failed:', err);
        return c.json({ error: 'Refund failed', details: err }, 502);
      }
    }

    await patchUserMeta(blinkSdk, auth.userId, {
      refunded_at: new Date().toISOString(),
      retraction_used: true,
    });
    console.log(`[process-refund] Full refund processed for user ${auth.userId}, charge: ${chargeId}`);
    return c.json({ success: true, action, chargeId, amountPaid });
  }

  return c.json({ error: 'Unknown action', action }, 400);
});
