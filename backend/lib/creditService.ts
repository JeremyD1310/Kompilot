/**
 * Shared credit service — unified credit management via credit_transactions.
 *
 * Extracted from ugcVideoAd.ts so ugcScript.ts, voiceover.ts, urlToVideo.ts, etc.
 * can all use the same atomic consume-before-work pattern.
 */

import { createClient } from '@blinkdotnew/sdk';
import { AI_CREDIT_COSTS, getPlanEntitlements, type CreditActionId } from '../../shared/pricingCatalog';

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
  creditType?: string;
  sourceType?: string;
  expiresAt?: string | null;
  periodKey?: string;
  createdAt: string;
}

export type BlinkClient = ReturnType<typeof createClient>;

export type LedgerCreditType = 'ai' | 'sms' | 'luma' | 'serpapi';

// ── Constants ───────────────────────────────────────────────────────────────────

export const CREDIT_COSTS: Record<string, number> = {
  ...AI_CREDIT_COSTS,
  text_generation: AI_CREDIT_COSTS.short_text,
  ai_analysis: AI_CREDIT_COSTS.full_ai_report,
  multi_channel_automation: AI_CREDIT_COSTS.full_post,
  video_generation: AI_CREDIT_COSTS.tavus_video_generation,
  sms_send: 1,
  serpapi_query: 1,
};

// ── Credit helpers ──────────────────────────────────────────────────────────────

/**
 * Get the user's current credit balance from the most recent transaction.
 * Returns -1 if no transaction history exists (meaning we fall back to plan initial).
 */
export async function getCurrentBalance(
  blink: BlinkClient,
  userId: string,
  creditType: LedgerCreditType = 'ai',
): Promise<number> {
  // Balance is derived from non-expired ledger lots, never from establishment counters
  // or the last historical balance_after (which can include expired purchases).
  try {
    const now = new Date().toISOString();
    const result = await blink.db.sql<{ total: number; count: number }>(
      `SELECT COALESCE(SUM(credits_delta), 0) AS total, COUNT(*) AS count
       FROM credit_transactions
       WHERE user_id = ? AND COALESCE(credit_type, 'ai') = ? AND (expires_at IS NULL OR expires_at > ?)
        AND NOT (type = 'consumption' AND expires_at IS NOT NULL AND expires_at <= ?)`,
      [userId, creditType, now, now],
    );
    if (result.rows.length > 0 && Number(result.rows[0].count) > 0) return Math.max(0, Number(result.rows[0].total) || 0);
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
  creditType: LedgerCreditType = 'ai',
): Promise<number> {
  try {
    const users = await blink.db.table<any>('users').list({ where: { id: userId }, limit: 1 });
    const metadata = typeof users[0]?.metadata === 'string' ? JSON.parse(users[0].metadata) : (users[0]?.metadata ?? {});
    const entitlements = getPlanEntitlements(metadata.plan_id ?? metadata.planId);
    if (creditType === 'sms') return Number(entitlements?.smsCredits ?? 0);
    if (creditType === 'luma') return Number(entitlements?.lumaCredits ?? 0);
    if (creditType === 'serpapi') return Number(entitlements?.serpapiCredits ?? 0);
    return Number(entitlements?.aiCredits ?? 0);
  } catch {
    return 0;
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
  creditType: LedgerCreditType = 'ai',
  metadata: Record<string, unknown> = {},
): Promise<{ success: boolean; balanceAfter: number; cost: number; error?: string }> {
  const cost = CREDIT_COSTS[actionType] ?? (AI_CREDIT_COSTS[actionType as CreditActionId] ?? 0);
  if (!Number.isFinite(cost) || cost <= 0) {
    return { success: false, balanceAfter: 0, cost: 0, error: 'Unknown credit action' };
  }
  const initialCredits = await getPlanInitialCredits(blink, userId, creditType);
  const now = new Date().toISOString();
  const safeReferenceId = referenceId.trim() || `consume:${userId}:${creditType}:${actionType}:${now.slice(0, 10)}`;
  const txId = `ctx:${creditType}:${safeReferenceId}`.slice(0, 255);

  const result = await blink.db.batch([
    {
      sql: `INSERT INTO credit_transactions
        (id, user_id, type, action_type, credits_delta, balance_after, description, reference_id, metadata, created_at, credit_type, source_type, expires_at, period_key)
        SELECT ?, ?, 'consumption', ?, ?,
          COALESCE((SELECT SUM(credits_delta) FROM credit_transactions
            WHERE user_id = ? AND COALESCE(credit_type, 'ai') = ? AND (expires_at IS NULL OR expires_at > ?)), ? ) + ?,
          ?, ?, ?, ?, ?, 'consumption', NULL, ''
        WHERE COALESCE((SELECT SUM(credits_delta) FROM credit_transactions
          WHERE user_id = ? AND COALESCE(credit_type, 'ai') = ? AND (expires_at IS NULL OR expires_at > ?)), ?) >= ?
          AND NOT EXISTS (SELECT 1 FROM credit_transactions WHERE user_id = ? AND type = 'consumption' AND reference_id = ? AND COALESCE(credit_type, 'ai') = ?)`,
      args: [
        txId, userId, actionType, -cost, userId, creditType, now, initialCredits, -cost,
        description || `Consumed ${cost} credit(s) for ${actionType}`, safeReferenceId, JSON.stringify(metadata), now, creditType,
        userId, creditType, now, initialCredits, cost, userId, safeReferenceId, creditType,
      ],
    },
  ], 'write');

  const inserted = Number((result.results?.[0] as { affectedRows?: number } | undefined)?.affectedRows ?? 0);
  if (inserted !== 1) {
    const existing = await blink.db.table<CreditTransaction>('credit_transactions').list({
      where: { userId, type: 'consumption', referenceId: safeReferenceId, creditType },
      limit: 1,
    });
    if (existing.length > 0) {
      return { success: true, balanceAfter: Number(existing[0].balanceAfter) || 0, cost };
    }
    const balance = await getCurrentBalance(blink, userId, creditType);
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
  const safeReferenceId = referenceId.trim();
  if (!safeReferenceId) throw new Error('A stable referenceId is required for refunds');
  const refundId = `crefund:${safeReferenceId}`.slice(0, 255);
  await blink.db.batch([
    {
      sql: `INSERT INTO credit_transactions
        (id, user_id, type, action_type, credits_delta, balance_after, description, reference_id, metadata, created_at, credit_type, source_type, expires_at, period_key)
        SELECT ?, ?, 'refund', c.action_type, MIN(?, ABS(c.credits_delta)),
          COALESCE((SELECT SUM(credits_delta) FROM credit_transactions WHERE user_id = ? AND COALESCE(credit_type, 'ai') = COALESCE(c.credit_type, 'ai') AND (expires_at IS NULL OR expires_at > ?)), ?) + MIN(?, ABS(c.credits_delta)),
          ?, ?, json_object('refundedTransactionId', c.id), ?, COALESCE(c.credit_type, 'ai'), 'refund', c.expires_at, c.period_key
        FROM credit_transactions c
        WHERE c.user_id = ? AND c.type = 'consumption' AND c.reference_id = ?
          AND c.credits_delta < 0
          AND NOT EXISTS (SELECT 1 FROM credit_transactions WHERE user_id = ? AND type = 'refund' AND reference_id = ?)
        GROUP BY c.id, c.action_type, c.credits_delta, c.credit_type, c.expires_at, c.period_key`,
      args: [refundId, userId, amount, userId, now, initialCredits, amount, reason, referenceId, now, userId, safeReferenceId, userId, safeReferenceId],
    },
  ], 'write');
}

/**
 * Standard paid-AI lifecycle: reserve before execution and refund exactly once
 * when the executor throws. Callers retain their existing response semantics.
 */
export async function consumeExecuteRefund<T>(
  blink: BlinkClient,
  userId: string,
  actionType: string,
  description: string,
  referenceId: string,
  execute: () => Promise<T>,
  creditType: LedgerCreditType = 'ai',
  metadata: Record<string, unknown> = {},
): Promise<{ result: T; cost: number; balanceAfter: number }> {
  const consumed = await consumeCredits(blink, userId, actionType, description, referenceId, creditType, metadata);
  if (!consumed.success) throw new Error(consumed.error || 'Insufficient credits');
  try {
    const result = await execute();
    return { result, cost: consumed.cost, balanceAfter: consumed.balanceAfter };
  } catch (error) {
    await refundCredits(blink, userId, consumed.cost, `Refund: ${description}`, referenceId);
    throw error;
  }
}
