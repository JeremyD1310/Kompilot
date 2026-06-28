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
): Promise<{ success: boolean; newLimit?: number; error?: string }> {
  if (credits <= 0) {
    return { success: false, error: 'Invalid credit amount' };
  }

  try {
    const establishments = await blink.db.establishments.list({ where: { userId }, limit: 1 });
    const est = establishments[0] as any;

    if (!est?.id) {
      console.warn(`[credit-pack] No establishment found for user ${userId}, credits pending`);
      return { success: false, error: 'No establishment found' };
    }

    const currentLimit = Number(est.aiCreditsLimit) || 50;
    const newLimit = currentLimit + credits;

    await blink.db.establishments.update(est.id, {
      aiCreditsLimit: newLimit,
      updatedAt: new Date().toISOString(),
    });

    console.warn(`[credit-pack] User ${userId} +${credits} credits (new limit: ${newLimit})`);
    return { success: true, newLimit };
  } catch (err) {
    console.error('[credit-pack] Grant failed:', err);
    return { success: false, error: String(err) };
  }
}
