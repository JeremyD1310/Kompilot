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

// ── Plan → initial balance mapping ─────────────────────────────────────────────

const PLAN_INITIAL_CREDITS: Record<string, number> = {
  starter: 500,
  pro: 500,
  agency: 5000,
  expert: 5000,
  enterprise: 5000,
};

const PLAN_MONTHLY_QUOTA: Record<string, number> = {
  starter: 500,
  pro: 500,
  agency: 5000,
  expert: 5000,
  enterprise: 5000,
};

// ── Credit costs per action type ───────────────────────────────────────────────

const CREDIT_COSTS: Record<string, number> = {
  text_generation: 1,
  ai_analysis: 3,
  multi_channel_automation: 5,
  video_generation: 10,
};

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
    const planId = (meta.plan_id as string) || 'free';
    const planName = planId.charAt(0).toUpperCase() + planId.slice(1);
    const initialCredits = PLAN_INITIAL_CREDITS[planId] ?? 100;
    return { planName, initialCredits };
  } catch {
    return { planName: 'Free', initialCredits: 100 };
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
    const monthlyQuota = PLAN_MONTHLY_QUOTA[planName.toLowerCase()] ?? initialCredits;

    const rawBalance = await getCurrentBalance(blink, auth.userId);
    const balance = rawBalance === -1 ? initialCredits : rawBalance;
    const usedThisMonth = await getUsedThisMonth(blink, auth.userId);
    const remaining = Math.max(0, balance);
    const percentage = monthlyQuota > 0
      ? Math.round((remaining / monthlyQuota) * 100)
      : 0;

    return c.json({
      balance,
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

  const cost = CREDIT_COSTS[actionType];
  if (cost === undefined) {
    return c.json({
      error: `Unknown action type: ${actionType}`,
      validTypes: Object.keys(CREDIT_COSTS),
    }, 400);
  }

  try {
    // 1. Get current balance
    const rawBalance = await getCurrentBalance(blink, auth.userId);
    const { initialCredits } = await getPlanInitialCredits(blink, auth.userId);
    const currentBalance = rawBalance === -1 ? initialCredits : rawBalance;

    // 2. Check sufficient balance
    if (currentBalance < cost) {
      return c.json({
        error: 'Insufficient credits',
        currentBalance,
        required: cost,
      }, 402);
    }

    // 3. Create consumption transaction
    const balanceAfter = currentBalance - cost;
    const txId = `ctx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const txTable = blink.db.table<CreditTransaction>('credit_transactions');

    await txTable.create({
      id: txId,
      userId: auth.userId,
      type: 'consumption',
      actionType,
      creditsDelta: -cost,
      balanceAfter,
      description: description || `Consumed ${cost} credit(s) for ${actionType}`,
      referenceId: referenceId || '',
      metadata: '{}',
    });

    return c.json({
      success: true,
      creditsCharged: cost,
      balanceAfter,
    });
  } catch (err: any) {
    console.error('[credits/consume] Error:', err.message);
    return c.json({ error: 'Failed to consume credits' }, 500);
  }
});

// ── POST /api/credits/refund ───────────────────────────────────────────────────

router.post('/api/credits/refund', async (c) => {
  const env   = c.env as unknown as Env;
  const blink = getBlink(env);

  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json<{
    transactionId: string;
    reason: string;
  }>();

  const { transactionId, reason } = body;
  if (!transactionId || !reason) {
    return c.json({ error: 'transactionId and reason are required' }, 400);
  }

  try {
    const txTable = blink.db.table<CreditTransaction>('credit_transactions');

    // 1. Find the original transaction
    const original = await txTable.get(transactionId);
    if (!original) {
      return c.json({ error: 'Transaction not found' }, 404);
    }
    if (original.userId !== auth.userId) {
      return c.json({ error: 'Transaction does not belong to this user' }, 403);
    }

    // 2. Calculate refund amount (positive delta — reverse the consumption)
    const refundAmount = Math.abs(Number(original.creditsDelta) || 0);
    if (refundAmount === 0) {
      return c.json({ error: 'Nothing to refund — zero delta' }, 400);
    }

    // 3. Compute new balance
    const rawBalance = await getCurrentBalance(blink, auth.userId);
    const { initialCredits } = await getPlanInitialCredits(blink, auth.userId);
    const currentBalance = rawBalance === -1 ? initialCredits : rawBalance;
    const balanceAfter = currentBalance + refundAmount;

    // 4. Create refund transaction
    const refundId = `crefund_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await txTable.create({
      id: refundId,
      userId: auth.userId,
      type: 'refund',
      actionType: original.actionType,
      creditsDelta: refundAmount,
      balanceAfter,
      description: `Refund for ${transactionId}: ${reason}`,
      referenceId: transactionId,
      metadata: JSON.stringify({ reason, originalDelta: original.creditsDelta }),
    });

    return c.json({
      success: true,
      refundAmount,
      balanceAfter,
    });
  } catch (err: any) {
    console.error('[credits/refund] Error:', err.message);
    return c.json({ error: 'Failed to process refund' }, 500);
  }
});
