/**
 * creditPackHandler — Handles credit-pack one-time payment grants.
 *
 * Extracted from webhooks.ts to reduce file size and improve testability.
 * Called from the Stripe webhook when checkout.session.completed fires
 * with mode='payment' and metadata.creditPack='true'.
 */
import type { BlinkClient } from './types';

/**
 * Grant AI credits from a credit-pack purchase to the user's establishment.
 *
 * @param blink   - Blink SDK client (server-side with secretKey)
 * @param userId  - The user who purchased the credit pack
 * @param credits - Number of credits to add (from session.metadata.credits)
 */
export async function handleCreditPackGrant(
  blink: BlinkClient,
  userId: string,
  credits: number,
  purchaseReference = `credit-pack:${userId}:${Date.now()}`,
): Promise<{ success: boolean; newLimit?: number; error?: string }> {
  if (credits <= 0) {
    return { success: false, error: 'Invalid credit amount' };
  }

  try {
    const existingGrant = await blink.db.table<any>('credit_transactions').list({
      where: { userId, type: 'grant', referenceId: purchaseReference }, limit: 1,
    });
    if (existingGrant.length > 0) return { success: true };

    // credit_transactions is the canonical ledger. Do not mutate establishments
    // here: legacy counters are not a source of truth for generic AI credits.
    const now = new Date().toISOString();
    const periodKey = now.slice(0, 7);
    const expiresAt = new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000).toISOString();
    await blink.db.batch([{
      sql: `INSERT INTO credit_transactions
        (id, user_id, type, action_type, credits_delta, balance_after, description, reference_id, metadata, created_at, credit_type, source_type, expires_at, period_key)
        SELECT ?, ?, 'grant', 'credit_pack', ?,
          ?, ?, ?, '{}', ?, 'ai', 'purchased', ?, ?
        WHERE NOT EXISTS (SELECT 1 FROM credit_transactions WHERE user_id = ? AND type = 'grant' AND reference_id = ?)`,
      args: [`grant:${purchaseReference}`.slice(0, 255), userId, credits, credits,
        `Purchased credit pack (+${credits})`, purchaseReference, now, expiresAt, periodKey, userId, purchaseReference],
    }], 'write');

    console.warn(`[credit-pack] User ${userId} +${credits} credits`);
    return { success: true };
  } catch (err) {
    console.error('[credit-pack] Grant failed:', err);
    return { success: false, error: String(err) };
  }
}
