/**
 * Shared credit service — unified credit management via credit_transactions.
 *
 * Extracted from ugcVideoAd.ts so ugcScript.ts, voiceover.ts, urlToVideo.ts, etc.
 * can all use the same atomic consume-before-work pattern.
 */

import { createClient } from '@blinkdotnew/sdk';

// ── Types ───────────────────────────────────────────────────────────────────────

export interface CreditTransaction {
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

interface EstablishmentRow {
  id: string;
  userId: string;
  aiCreditsLimit: number;
  aiCreditsUsed: number;
}

export type BlinkClient = ReturnType<typeof createClient>;

// ── Constants ───────────────────────────────────────────────────────────────────

export const CREDIT_COSTS: Record<string, number> = {
  text_generation: 1,
  video_generation: 10,
  runway_video_generation: 5,
};

// ── Credit helpers ──────────────────────────────────────────────────────────────

/**
 * Get the user's current credit balance from the most recent transaction.
 * Returns -1 if no transaction history exists (meaning we fall back to plan initial).
 */
export async function getCurrentBalance(
  blink: BlinkClient,
  userId: string,
): Promise<number> {
  try {
    const lastTx = await blink.db
      .table<CreditTransaction>('credit_transactions')
      .list({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        limit: 1,
      });
    if (lastTx.length > 0) return Number(lastTx[0].balanceAfter) || 0;
  } catch {
    /* no transactions yet — caller falls back to plan initial */
  }
  return -1;
}

/**
 * Get the plan's initial credit allotment from the user's establishment record.
 * Used as a fallback when no credit_transactions exist yet.
 */
export async function getPlanInitialCredits(
  blink: BlinkClient,
  userId: string,
): Promise<number> {
  try {
    const establishments = await blink.db
      .table<EstablishmentRow>('establishments')
      .list({ where: { userId }, limit: 1 });
    const est = establishments[0];
    const limit = Number(est?.aiCreditsLimit);
    return Number.isFinite(limit) ? limit : 50;
  } catch {
    return 50;
  }
}

/**
 * Atomically consume credits before performing the paid action.
 * Deducts from the credit_transactions ledger and returns the new balance.
 *
 * Call BEFORE the AI / video generation so credits are never lost on failures.
 */
export async function consumeCredits(
  blink: BlinkClient,
  userId: string,
  actionType: string,
  description: string,
  referenceId: string,
): Promise<{ success: boolean; balanceAfter: number; cost: number; error?: string }> {
  const cost = CREDIT_COSTS[actionType] ?? 1;
  const initialCredits = await getPlanInitialCredits(blink, userId);
  const now = new Date().toISOString();
  const txId = `ctx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const safeReferenceId = referenceId || txId;

  const result = await blink.db.batch([
    {
      sql: `INSERT INTO credit_transactions
        (id, user_id, type, action_type, credits_delta, balance_after, description, reference_id, metadata, created_at)
        SELECT ?, ?, 'consumption', ?, ?,
          COALESCE((SELECT balance_after FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1), ? ) + ?,
          ?, ?, '{}', ?
        WHERE COALESCE((SELECT balance_after FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1), ?) >= ?
          AND NOT EXISTS (SELECT 1 FROM credit_transactions WHERE user_id = ? AND type = 'consumption' AND reference_id = ?)`,
      args: [
        txId, userId, actionType, -cost, userId, initialCredits, -cost,
        description || `Consumed ${cost} credit(s) for ${actionType}`, safeReferenceId, now,
        userId, initialCredits, cost, userId, safeReferenceId,
      ],
    },
  ], 'write');

  const inserted = Number((result.results?.[0] as { affectedRows?: number } | undefined)?.affectedRows ?? 0);
  if (inserted !== 1) {
    const existing = await blink.db.table<CreditTransaction>('credit_transactions').list({
      where: { userId, type: 'consumption', referenceId: safeReferenceId },
      limit: 1,
    });
    if (existing.length > 0) {
      return { success: true, balanceAfter: Number(existing[0].balanceAfter) || 0, cost };
    }
    const balance = await getCurrentBalance(blink, userId);
    return { success: false, balanceAfter: balance === -1 ? initialCredits : balance, cost, error: 'Insufficient credits' };
  }

  const created = await blink.db.table<CreditTransaction>('credit_transactions').get(txId);
  return { success: true, balanceAfter: Number(created?.balanceAfter) || 0, cost };
}

/** Refund a prior charge at most once for a stable reference id. */
export async function refundCredits(
  blink: BlinkClient,
  userId: string,
  amount: number,
  reason: string,
  referenceId: string,
): Promise<void> {
  if (amount <= 0 || !referenceId) return;
  const initialCredits = await getPlanInitialCredits(blink, userId);
  const now = new Date().toISOString();
  const refundId = `crefund_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await blink.db.batch([
    {
      sql: `INSERT INTO credit_transactions
        (id, user_id, type, action_type, credits_delta, balance_after, description, reference_id, metadata, created_at)
        SELECT ?, ?, 'refund', 'video_generation', ?,
          COALESCE((SELECT balance_after FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1), ?) + ?,
          ?, ?, '{}', ?
        WHERE NOT EXISTS (SELECT 1 FROM credit_transactions WHERE user_id = ? AND type = 'refund' AND reference_id = ?)`,
      args: [refundId, userId, amount, userId, initialCredits, amount, reason, referenceId, now, userId, referenceId],
    },
  ], 'write');
}
