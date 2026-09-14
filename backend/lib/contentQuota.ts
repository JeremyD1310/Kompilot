import type { Env } from './types';
import { getBlink } from './stripeHelpers';

type QuotaRow = {
  id: string;
  userId: string;
  monthlyLimit: number;
  additionalCredits: number;
  currentUsage: number;
  usageMonth: string;
  updatedAt?: string;
};

export const CONTENT_PACKS = [
  { id: 'small', label: 'Small', credits: 15, priceHt: 4.99 },
  { id: 'medium', label: 'Medium', credits: 30, priceHt: 7.99 },
  { id: 'large', label: 'Large', credits: 80, priceHt: 14.99 },
] as const;

function monthKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function quotaId(userId: string) {
  return `content_quota_${userId}`;
}

export async function ensureContentQuota(env: Env, userId: string): Promise<QuotaRow> {
  const blink = getBlink(env);
  const month = monthKey();
  const now = new Date().toISOString();

  await blink.db.sql(
    `INSERT INTO user_credits (id, user_id, monthly_limit, additional_credits, current_usage, usage_month, created_at, updated_at)
     VALUES (?, ?, 30, 0, 0, ?, ?, ?)
     ON CONFLICT(user_id) DO NOTHING`,
    [quotaId(userId), userId, month, now, now],
  );

  await blink.db.sql(
    `UPDATE user_credits
     SET current_usage = 0, usage_month = ?, updated_at = ?
     WHERE user_id = ? AND usage_month <> ?`,
    [month, now, userId, month],
  );

  const result = await blink.db.sql<QuotaRow>(
    `SELECT id, user_id AS userId, monthly_limit AS monthlyLimit,
            additional_credits AS additionalCredits, current_usage AS currentUsage,
            usage_month AS usageMonth, updated_at AS updatedAt
     FROM user_credits WHERE user_id = ? LIMIT 1`,
    [userId],
  );
  const row = result.rows[0];
  if (!row) throw new Error('Content quota could not be initialized');
  return {
    ...row,
    monthlyLimit: Number(row.monthlyLimit) || 30,
    additionalCredits: Number(row.additionalCredits) || 0,
    currentUsage: Number(row.currentUsage) || 0,
  };
}

export function quotaView(row: QuotaRow) {
  const totalLimit = row.monthlyLimit + row.additionalCredits;
  return {
    monthlyLimit: row.monthlyLimit,
    additionalCredits: row.additionalCredits,
    currentUsage: row.currentUsage,
    totalLimit,
    remaining: Math.max(0, totalLimit - row.currentUsage),
    usageMonth: row.usageMonth,
    blocked: row.currentUsage >= totalLimit,
  };
}

export async function consumeContentQuota(
  env: Env,
  userId: string,
  amount = 1,
  action = 'content_generation',
) {
  const blink = getBlink(env);
  const safeAmount = Math.max(1, Math.min(10, Math.floor(amount)));
  const row = await ensureContentQuota(env, userId);
  const now = new Date().toISOString();
  const month = monthKey();
  const result = await blink.db.sql<QuotaRow>(
    `UPDATE user_credits
     SET current_usage = current_usage + ?, updated_at = ?
     WHERE user_id = ? AND usage_month = ?
       AND current_usage + ? <= monthly_limit + additional_credits
     RETURNING id, user_id AS userId, monthly_limit AS monthlyLimit,
               additional_credits AS additionalCredits, current_usage AS currentUsage,
               usage_month AS usageMonth, updated_at AS updatedAt`,
    [safeAmount, now, userId, month, safeAmount],
  );
  if (result.rows.length !== 1) {
    return { success: false, action, ...quotaView(row) };
  }
  const updated = result.rows[0];
  return { success: true, action, ...quotaView({
    ...updated,
    monthlyLimit: Number(updated.monthlyLimit) || 30,
    additionalCredits: Number(updated.additionalCredits) || 0,
    currentUsage: Number(updated.currentUsage) || 0,
  }) };
}

export async function releaseContentQuota(env: Env, userId: string, amount = 1) {
  const blink = getBlink(env);
  const safeAmount = Math.max(1, Math.min(10, Math.floor(amount)));
  const now = new Date().toISOString();
  const result = await blink.db.sql<QuotaRow>(
    `UPDATE user_credits
     SET current_usage = MAX(0, current_usage - ?), updated_at = ?
     WHERE user_id = ?
     RETURNING id, user_id AS userId, monthly_limit AS monthlyLimit,
               additional_credits AS additionalCredits, current_usage AS currentUsage,
               usage_month AS usageMonth, updated_at AS updatedAt`,
    [safeAmount, now, userId],
  );
  return result.rows[0] ? quotaView({
    ...result.rows[0],
    monthlyLimit: Number(result.rows[0].monthlyLimit) || 30,
    additionalCredits: Number(result.rows[0].additionalCredits) || 0,
    currentUsage: Number(result.rows[0].currentUsage) || 0,
  }) : null;
}

export async function grantContentCredits(
  env: Env,
  userId: string,
  credits: number,
  eventId: string,
  description = 'Recharge Machine à Contenu',
) {
  const blink = getBlink(env);
  const parsedCredits = Math.floor(Number(credits) || 0);
  if (parsedCredits <= 0 || !eventId) throw new Error('Invalid content credit grant');

  await ensureContentQuota(env, userId);
  const now = new Date().toISOString();
  try {
    // Claim, balance update, ledger entry and completion are one DB transaction.
    // A completed claim is never reopened; a failed claim may be retried safely.
    await blink.db.batch([
      {
        sql: `INSERT INTO stripe_credit_grants (id, user_id, credit_type, credits, status, created_at, updated_at)
              VALUES (?, ?, 'content', ?, 'processing', ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                status = 'processing', credits = excluded.credits, error_message = '', updated_at = excluded.updated_at
              WHERE stripe_credit_grants.status = 'failed'`,
        args: [eventId, userId, parsedCredits, now, now],
      },
      {
        sql: `UPDATE user_credits
              SET additional_credits = additional_credits + ?, updated_at = ?
              WHERE user_id = ?
                AND EXISTS (SELECT 1 FROM stripe_credit_grants WHERE id = ? AND status = 'processing')
              RETURNING additional_credits AS additional_credits`,
        args: [parsedCredits, now, userId, eventId],
      },
      {
        sql: `INSERT INTO credit_transactions
              (id, user_id, type, action_type, credits_delta, balance_after, description, reference_id, metadata, created_at)
              SELECT ?, ?, 'purchase', 'content_pack', ?, additional_credits, ?, ?, '{}', ?
              FROM user_credits
              WHERE user_id = ?
                AND EXISTS (SELECT 1 FROM stripe_credit_grants WHERE id = ? AND status = 'processing')`,
        args: [`stripe_${eventId}`, userId, parsedCredits, description, eventId, now, userId, eventId],
      },
      {
        sql: `UPDATE stripe_credit_grants
              SET status = 'completed',
                  balance_after = (SELECT additional_credits FROM user_credits WHERE user_id = ?),
                  updated_at = ?
              WHERE id = ? AND status = 'processing'
                AND EXISTS (SELECT 1 FROM user_credits WHERE user_id = ?)`,
        args: [userId, now, eventId, userId],
      },
    ], 'write');

    const state = await blink.db.sql<{ status: string; balanceAfter: number; errorMessage: string }>(
      `SELECT status, balance_after AS balanceAfter, error_message AS errorMessage
       FROM stripe_credit_grants WHERE id = ? LIMIT 1`,
      [eventId],
    );
    const grant = state.rows[0];
    if (grant?.status === 'completed') {
      return { success: true, duplicate: true, balanceAfter: Number(grant.balanceAfter) || 0 };
    }
    if (grant?.status === 'processing') {
      throw new Error('Content credit grant could not be committed');
    }
    throw new Error(grant?.errorMessage || 'Content credit grant failed');
  } catch (error) {
    await blink.db.sql(
      `UPDATE stripe_credit_grants SET status = 'failed', error_message = ?, updated_at = ?
       WHERE id = ? AND status <> 'completed'`,
      [error instanceof Error ? error.message : String(error), new Date().toISOString(), eventId],
    ).catch(() => undefined);
    throw error;
  }
}