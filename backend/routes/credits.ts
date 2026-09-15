/**
 * Credits management routes
 *
 *   GET  /api/credits/balance   — current credit balance + plan info
 *   GET  /api/credits/history   — paginated credit transaction history
 *   POST /api/credits/consume   — deduct credits for an AI action
 *   POST /api/credits/refund    — refund credits for a prior transaction
 */

import { Hono } from 'hono';
import type { Env } from '../lib/types';
import { getBlink, getUserMeta } from '../lib/stripeHelpers';
import { consumeCredits as consumeCreditsAtomically, consumeSms, estimateCredits, getCreditCost, getPlanIncludedCredits, getCurrentBalances, getCurrentBalance as getLedgerBalance, refundCredits as refundCreditsAtomically } from '../lib/creditService';
import { SUBSCRIPTION_PLANS, type SubscriptionPlanId } from '../../shared/pricingCatalog';

export const router = new Hono();

// ── Types ──────────────────────────────────────────────────────────────────────

interface CreditTransaction {
  id: string;
  userId: string;
  type: string;
  actionType: string;
  creditsDelta: number;
  balanceAfter: number;
  description: string;
  referenceId: string;
  metadata: string;
  createdAt: string;
}

// Plan limits and action costs are intentionally imported from the shared catalog/service.

// ── Helper: compute current balance ────────────────────────────────────────────

async function getCurrentBalance(
  blink: ReturnType<typeof getBlink>,
  userId: string,
): Promise<number> {
  try {
    const txTable = blink.db.table<CreditTransaction>('credit_transactions');
    const lastTx = await txTable.list({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      limit: 1,
    });
    if (lastTx.length > 0) {
      return Number(lastTx[0].balanceAfter) || 0;
    }
  } catch {
    // Fall through to plan-based default
  }
  return -1; // Signal: no transactions found
}

// ── Helper: resolve plan initial credits ───────────────────────────────────────

async function getPlanInitialCredits(
  blink: ReturnType<typeof getBlink>,
  userId: string,
): Promise<{ planName: string; initialCredits: number }> {
  try {
    const meta = await getUserMeta(blink, userId);
    const planId = (meta.plan_id as SubscriptionPlanId) || 'pro';
    const plan = SUBSCRIPTION_PLANS.find(item => item.id === planId);
    return { planName: plan?.name ?? 'Kompilot Pro', initialCredits: getPlanIncludedCredits(planId) };
  } catch {
    return { planName: 'Kompilot Pro', initialCredits: getPlanIncludedCredits('pro') };
  }
}

// ── Helper: compute used this month ────────────────────────────────────────────

async function getUsedThisMonth(
  blink: ReturnType<typeof getBlink>,
  userId: string,
): Promise<number> {
  try {
    const txTable = blink.db.table<CreditTransaction>('credit_transactions');
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const txs = await txTable.list({
      where: {
        AND: [
          { userId },
          { type: 'consumption' },
        ],
      },
      orderBy: { createdAt: 'desc' },
      limit: 500,
    });
    // Filter to current month (SDK doesn't support >= comparisons)
    let total = 0;
    for (const tx of txs) {
      if (tx.createdAt >= monthStart) {
        total += Math.abs(Number(tx.creditsDelta) || 0);
      }
    }
    return total;
  } catch {
    return 0;
  }
}

// ── GET /api/credits/balance ───────────────────────────────────────────────────

router.get('/api/credits/balance', async (c) => {
  const env   = c.env as unknown as Env;
  const blink = getBlink(env);

  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const { planName, initialCredits } = await getPlanInitialCredits(blink, auth.userId);
    const monthlyQuota = initialCredits;

    const balances = await getCurrentBalances(blink, auth.userId);
    const balance = balances.ai;
    const smsBalance = balances.sms;
    const usedThisMonth = await getUsedThisMonth(blink, auth.userId);
    const remaining = Math.max(0, balance);
    const percentage = monthlyQuota > 0
      ? Math.round((remaining / monthlyQuota) * 100)
      : 0;

    return c.json({
      balance,
      aiBalance: balance,
      smsBalance,
      resetAt: balances.account.periodEndsAt,
      planName,
      monthlyQuota,
      usedThisMonth,
      remaining,
      percentage,
    });
  } catch (err: any) {
    console.error('[credits/balance] Error:', err.message);
    return c.json({ error: 'Failed to fetch balance' }, 500);
  }
});

router.get('/api/credits/estimate', async (c) => {
  const estimate = estimateCredits(c.req.query('actionType') || '', Number(c.req.query('quantity') || 1));
  return estimate ? c.json(estimate) : c.json({ error: 'Unknown action or invalid quantity' }, 400);
});

router.post('/api/credits/estimate', async (c) => {
  const body = await c.req.json<{ actionType?: string; quantity?: number }>();
  const estimate = estimateCredits(body.actionType || '', body.quantity || 1);
  return estimate ? c.json(estimate) : c.json({ error: 'Unknown action or invalid quantity' }, 400);
});

// ── GET /api/credits/history ───────────────────────────────────────────────────

router.get('/api/credits/history', async (c) => {
  const env   = c.env as unknown as Env;
  const blink = getBlink(env);

  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const limit  = Math.min(Number(c.req.query('limit')) || 50, 200);
  const offset = Number(c.req.query('offset')) || 0;

  try {
    const txTable = blink.db.table<CreditTransaction>('credit_transactions');
    const transactions = await txTable.list({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
      limit,
      offset,
    });

    return c.json({
      transactions,
      limit,
      offset,
      count: transactions.length,
    });
  } catch (err: any) {
    console.error('[credits/history] Error:', err.message);
    return c.json({ error: 'Failed to fetch history' }, 500);
  }
});

// ── POST /api/credits/consume ──────────────────────────────────────────────────

router.post('/api/credits/consume', async (c) => {
  const env   = c.env as unknown as Env;
  const blink = getBlink(env);

  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json<{
    actionType: string;
    description?: string;
    referenceId?: string;
  }>();

  const { actionType, description, referenceId } = body;
  if (!actionType) {
    return c.json({ error: 'actionType is required' }, 400);
  }

  const cost = getCreditCost(actionType);
  if (cost === null) {
    return c.json({ error: `Unknown action type: ${actionType}` }, 400);
  }

  try {
    const result = await consumeCreditsAtomically(
      blink,
      auth.userId,
      actionType,
      description || `Consommation de ${cost} crédit(s) pour ${actionType}`,
      referenceId || crypto.randomUUID(),
    );
    if (!result.success) {
      return c.json({ error: result.error || 'Insufficient credits', currentBalance: result.balanceAfter, required: cost }, 402);
    }
    return c.json({ success: true, creditsCharged: result.cost, balanceAfter: result.balanceAfter });
  } catch (err: any) {
    console.error('[credits/consume] Error:', err.message);
    return c.json({ error: 'Failed to consume credits' }, 500);
  }
});

router.post('/api/credits/sms/consume', async (c) => {
  const env = c.env as unknown as Env;
  const blink = getBlink(env);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json<{ referenceId?: string; humanValidated?: boolean }>();
  const result = await consumeSms(blink, auth.userId, body.referenceId || crypto.randomUUID(), body.humanValidated === true);
  return result.success ? c.json(result) : c.json({ error: result.error }, result.status as 400 | 402);
});

// ── POST /api/credits/refund ───────────────────────────────────────────────────

router.post('/api/credits/refund', async (c) => {
  const env   = c.env as unknown as Env;
  const blink = getBlink(env);

  const trusted = c.req.header('X-Internal-Credit-Refund') === env.BLINK_SECRET_KEY;
  if (!trusted) return c.json({ error: 'Server-only endpoint' }, 403);

  const body = await c.req.json<{
    transactionId: string;
    userId: string;
    reason: string;
  }>();

  const { transactionId, userId, reason } = body;
  if (!transactionId || !reason) {
    return c.json({ error: 'transactionId and reason are required' }, 400);
  }

  try {
    const txTable = blink.db.table<CreditTransaction>('credit_transactions');
    const original = await txTable.get(transactionId);
    if (!original) return c.json({ error: 'Transaction not found' }, 404);
    if (original.userId !== userId) return c.json({ error: 'Transaction does not belong to this user' }, 403);
    if (original.type !== 'consumption' || Number(original.creditsDelta) >= 0) return c.json({ error: 'Only consumption transactions can be refunded' }, 400);

    const refundAmount = Math.abs(Number(original.creditsDelta) || 0);
    const alreadyRefunded = await txTable.list({ where: { userId, type: 'refund', referenceId: transactionId }, limit: 1 });
    if (alreadyRefunded.length > 0) return c.json({ success: true, refundAmount: 0, balanceAfter: Number(alreadyRefunded[0].balanceAfter) || 0, alreadyRefunded: true });

    await refundCreditsAtomically(blink, userId, refundAmount, reason, transactionId);
    const balanceAfter = await getLedgerBalance(blink, userId);
    return c.json({ success: true, refundAmount, balanceAfter });
  } catch (err: any) {
    console.error('[credits/refund] Error:', err.message);
    return c.json({ error: 'Failed to process refund' }, 500);
  }
});
