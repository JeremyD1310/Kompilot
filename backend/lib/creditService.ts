/**
 * Shared credit service — unified credit management via credit_transactions.
 *
 * Extracted from ugcVideoAd.ts so ugcScript.ts, voiceover.ts, urlToVideo.ts, etc.
 * can all use the same atomic consume-before-work pattern.
 */

import { createClient } from '@blinkdotnew/sdk';
import { AI_CREDIT_COSTS, type CreditActionId, SUBSCRIPTION_PLANS, getPlanEntitlements, CREDIT_TOPUP_VALIDITY_MONTHS } from '../../shared/pricingCatalog';

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
  creditType?: string;
  sourceType?: string;
  expiresAt?: string | null;
  periodKey?: string;
}

type CreditAccount = {
  id: string;
  userId: string;
  planId: string;
  periodKey: string;
  periodEndsAt: string;
  aiIncluded: number | string;
  aiRemaining: number | string;
  aiUsed: number | string;
  aiPurchasedRemaining: number | string;
  smsIncluded: number | string;
  smsRemaining: number | string;
  smsUsed: number | string;
  smsPurchasedRemaining: number | string;
  updatedAt: string;
};

export type BlinkClient = ReturnType<typeof createClient>;

// ── Constants ───────────────────────────────────────────────────────────────────

export const CREDIT_COSTS: Record<string, number> = {
  ...AI_CREDIT_COSTS,
  text_generation: AI_CREDIT_COSTS.short_text,
  video_generation: AI_CREDIT_COSTS.short_video,
  runway_video_generation: AI_CREDIT_COSTS.short_video,
  ai_analysis: AI_CREDIT_COSTS.full_ai_report,
  multi_channel_automation: AI_CREDIT_COSTS.full_post,
};

export function getCreditCost(actionType: string): number | null {
  return CREDIT_COSTS[actionType] ?? null;
}

export function getPlanIncludedCredits(planId: unknown): number {
  return getPlanEntitlements(planId)?.aiCredits ?? 0;
}

const monthKey = (date = new Date()) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
const nextMonth = (date = new Date()) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)).toISOString();
const safeNumber = (value: unknown) => Math.max(0, Number(value) || 0);

async function getPlanId(blink: BlinkClient, userId: string): Promise<string> {
  try {
    const users = await blink.db.table<{ id: string; metadata?: string }>('users').list({ where: { id: userId }, limit: 1 });
    const raw = users[0]?.metadata;
    const meta = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const planId = meta?.plan_id;
    if (!getPlanEntitlements(planId)) throw new Error('Unsupported or missing subscription plan');
    return planId;
  } catch (error) {
    throw new Error(`Unable to resolve subscription plan: ${error instanceof Error ? error.message : 'metadata unavailable'}`);
  }
}

async function ensureAccount(blink: BlinkClient, userId: string): Promise<CreditAccount> {
  const accounts = blink.db.table<CreditAccount>('credit_accounts');
  const existing = await accounts.list({ where: { userId }, limit: 1 });
  const now = new Date();
  const key = monthKey(now);
  const planId = await getPlanId(blink, userId);
  const monthly = getPlanIncludedCredits(planId);
  const periodEndsAt = nextMonth(now);

  if (!existing[0]) {
    try {
      return await accounts.create({
        id: `ca_${userId}`,
        userId,
        planId,
        periodKey: key,
        periodEndsAt,
        aiIncluded: monthly,
        aiRemaining: monthly,
        aiUsed: 0,
        aiPurchasedRemaining: 0,
        smsIncluded: getPlanEntitlements(planId)?.smsCredits ?? 0,
        smsRemaining: getPlanEntitlements(planId)?.smsCredits ?? 0,
        smsUsed: 0,
        smsPurchasedRemaining: 0,
        updatedAt: now.toISOString(),
      });
    } catch {
      const retried = await accounts.list({ where: { userId }, limit: 1 });
      if (!retried[0]) throw new Error('Unable to initialize credit account');
      return retried[0];
    }
  }

  const account = existing[0];
  if (account.periodKey !== key || account.planId !== planId) {
    return accounts.update(account.id, {
      planId,
      periodKey: key,
      periodEndsAt,
      aiIncluded: monthly,
      aiRemaining: monthly,
      aiUsed: 0,
      smsIncluded: getPlanEntitlements(planId)?.smsCredits ?? 0,
      smsRemaining: getPlanEntitlements(planId)?.smsCredits ?? 0,
      smsUsed: 0,
      updatedAt: now.toISOString(),
    });
  }
  return account;
}

/**
 * Get the user's current credit balance from the most recent transaction.
 * Returns -1 if no transaction history exists (meaning we fall back to plan initial).
 */
export async function getCurrentBalance(
  blink: BlinkClient,
  userId: string,
): Promise<number> {
  const account = await ensureAccount(blink, userId);
  return safeNumber(account.aiRemaining) + safeNumber(account.aiPurchasedRemaining);
}

export async function getCurrentBalances(blink: BlinkClient, userId: string) {
  const account = await ensureAccount(blink, userId);
  return {
    ai: safeNumber(account.aiRemaining) + safeNumber(account.aiPurchasedRemaining),
    sms: safeNumber(account.smsRemaining) + safeNumber(account.smsPurchasedRemaining),
    account,
  };
}

/**
 * Get the plan's initial credit allotment from the user's establishment record.
 * Used as a fallback when no credit_transactions exist yet.
 */
export async function getPlanInitialCredits(blink: BlinkClient, userId: string): Promise<number> {
  return getPlanIncludedCredits(await getPlanId(blink, userId));
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
  const cost = getCreditCost(actionType);
  if (cost === null) return { success: false, balanceAfter: 0, cost: 0, error: `Unknown action type: ${actionType}` };
  const account = await ensureAccount(blink, userId);
  const safeReferenceId = referenceId || crypto.randomUUID();
  const transactions = blink.db.table<CreditTransaction>('credit_transactions');
  const duplicate = await transactions.list({ where: { userId, type: 'consumption', referenceId: safeReferenceId }, limit: 1 });
  if (duplicate[0]) return { success: true, balanceAfter: Number(duplicate[0].balanceAfter) || 0, cost };

  const result = await blink.db.batch([{
    sql: `UPDATE credit_accounts
      SET ai_remaining = ai_remaining - MIN(ai_remaining, ?),
          ai_purchased_remaining = ai_purchased_remaining - MAX(0, ? - ai_remaining),
          ai_used = ai_used + MIN(ai_remaining, ?),
          updated_at = ?
      WHERE id = ? AND (ai_remaining + ai_purchased_remaining) >= ?`,
    args: [cost, cost, cost, new Date().toISOString(), account.id, cost],
  }], 'write');
  const changed = Number((result.results?.[0] as { affectedRows?: number } | undefined)?.affectedRows ?? 0);
  if (changed !== 1) {
    return { success: false, balanceAfter: await getCurrentBalance(blink, userId), cost, error: 'Insufficient credits' };
  }

  const updated = await blink.db.table<CreditAccount>('credit_accounts').get(account.id);
  const balanceAfter = safeNumber(updated?.aiRemaining) + safeNumber(updated?.aiPurchasedRemaining);
  await transactions.create({
    id: `ctx_${crypto.randomUUID()}`,
    userId,
    type: 'consumption',
    actionType,
    creditsDelta: -cost,
    balanceAfter,
    description: description || `Consommation de ${cost} crédit(s) pour ${actionType}`,
    referenceId: safeReferenceId,
    metadata: '{}',
    createdAt: new Date().toISOString(),
    creditType: 'ai',
    sourceType: 'included_or_purchased',
    periodKey: account.periodKey,
  });
  return { success: true, balanceAfter, cost };
}

export async function grantCredits(
  blink: BlinkClient,
  userId: string,
  creditType: 'ai' | 'sms',
  amount: number,
  sourceType: 'topup' | 'pilot',
  referenceId: string,
  expiresAt: string,
): Promise<{ success: boolean; balanceAfter: number }> {
  if (!Number.isInteger(amount) || amount <= 0) throw new Error('Invalid credit grant');
  const account = await ensureAccount(blink, userId);
  const purchases = blink.db.table<{ id: string; userId: string; stripeSessionId: string; productId: string }>('credit_purchases');
  const prior = await purchases.list({ where: { userId, stripeSessionId: referenceId }, limit: 1 });
  if (prior[0]) return { success: true, balanceAfter: await getCurrentBalance(blink, userId) };
  const purchaseId = `cp_${crypto.randomUUID()}`;
  const updated = await blink.db.table<CreditAccount>('credit_accounts').update(account.id, {
    ...(creditType === 'ai' ? { aiPurchasedRemaining: safeNumber(account.aiPurchasedRemaining) + amount } : { smsPurchasedRemaining: safeNumber(account.smsPurchasedRemaining) + amount }),
    updatedAt: new Date().toISOString(),
  });
  await purchases.create({ id: purchaseId, userId, creditType, credits: amount, remaining: amount, expiresAt, stripeSessionId: referenceId, productId: sourceType });
  const balanceAfter = creditType === 'ai'
    ? safeNumber(updated.aiRemaining) + safeNumber(updated.aiPurchasedRemaining)
    : safeNumber(updated.smsRemaining) + safeNumber(updated.smsPurchasedRemaining);
  return { success: true, balanceAfter };
}

/** Refund a prior charge at most once for a stable reference id. */
export async function refundCredits(blink: BlinkClient, userId: string, amount: number, reason: string, referenceId: string): Promise<void> {
  if (amount <= 0 || !referenceId) return;
  const transactions = blink.db.table<CreditTransaction>('credit_transactions');
  const original = await transactions.list({ where: { userId, type: 'consumption', referenceId }, limit: 1 });
  if (!original[0]) throw new Error('Original consumption not found');
  const prior = await transactions.list({ where: { userId, type: 'refund', referenceId }, limit: 1 });
  if (prior[0]) return;
  const account = await ensureAccount(blink, userId);
  const updated = await blink.db.table<CreditAccount>('credit_accounts').update(account.id, {
    aiPurchasedRemaining: safeNumber(account.aiPurchasedRemaining) + amount,
    updatedAt: new Date().toISOString(),
  });
  await transactions.create({ id: `cr_${crypto.randomUUID()}`, userId, type: 'refund', actionType: original[0].actionType, creditsDelta: amount, balanceAfter: safeNumber(updated.aiRemaining) + safeNumber(updated.aiPurchasedRemaining), description: reason, referenceId, metadata: '{}', createdAt: new Date().toISOString(), creditType: 'ai', sourceType: 'refund', periodKey: account.periodKey });
}

export function estimateCredits(actionType: string, quantity = 1) {
  const unitCost = getCreditCost(actionType);
  if (unitCost === null || !Number.isInteger(quantity) || quantity < 1) return null;
  return { actionType, quantity, unitCost, totalCost: unitCost * quantity };
}

export async function consumeSms(blink: BlinkClient, userId: string, referenceId: string, humanValidated = false) {
  if (!humanValidated) return { success: false, error: 'Human validation is required', status: 400 } as const;
  const account = await ensureAccount(blink, userId);
  const transactions = blink.db.table<CreditTransaction>('credit_transactions');
  const prior = await transactions.list({ where: { userId, type: 'sms_consumption', referenceId }, limit: 1 });
  if (prior[0]) return { success: true, balanceAfter: Number(prior[0].balanceAfter) || 0, idempotent: true } as const;
  const result = await blink.db.batch([{ sql: `UPDATE credit_accounts SET sms_remaining = sms_remaining - MIN(sms_remaining, 1), sms_purchased_remaining = sms_purchased_remaining - MAX(0, 1 - sms_remaining), sms_used = sms_used + MIN(sms_remaining, 1), updated_at = ? WHERE id = ? AND (sms_remaining + sms_purchased_remaining) >= 1`, args: [new Date().toISOString(), account.id] }], 'write');
  const changed = Number((result.results?.[0] as { affectedRows?: number } | undefined)?.affectedRows ?? 0);
  if (changed !== 1) return { success: false, error: 'SMS quota exhausted', status: 402 } as const;
  const updated = await blink.db.table<CreditAccount>('credit_accounts').get(account.id);
  const balanceAfter = safeNumber(updated?.smsRemaining) + safeNumber(updated?.smsPurchasedRemaining);
  await transactions.create({ id: `stx_${crypto.randomUUID()}`, userId, type: 'sms_consumption', actionType: 'sms_send', creditsDelta: -1, balanceAfter, description: 'SMS envoyé après validation humaine', referenceId, metadata: '{}', createdAt: new Date().toISOString(), creditType: 'sms', sourceType: 'included_or_purchased', periodKey: account.periodKey });
  return { success: true, balanceAfter, idempotent: false } as const;
}
