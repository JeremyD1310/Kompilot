/**
 * handleAioCreditPackGrant — Grants Luma AI + SerpApi credits after payment.
 *
 * Called from the webhook handler when checkout.session.completed fires
 * with metadata.packType === 'aio_creative'.
 *
 * Credit storage strategy:
 *   - Luma AI credits → establishments.ai_credits_used (increment limit)
 *   - SerpApi credits → user_credit_quotas table (separate row for this pack)
 *
 * This keeps the credit pack grants separate from the monthly plan quotas
 * so they don't get reset on billing period renewal.
 */

import type { getBlink as GetBlinkFn } from './stripeHelpers';

type BlinkClient = ReturnType<typeof GetBlinkFn>;

interface GrantResult {
  success: boolean;
  lumaGranted: number;
  serpapiGranted: number;
  newLumaLimit?: number;
  newSerpapiBalance?: number;
  error?: string;
}

/**
 * Grant AIO + Creative credits to a user after successful payment.
 *
 * @param blink  - Blink SDK client (server-side, secretKey auth)
 * @param userId - Kompilot user ID from the Stripe metadata
 * @param lumaCredits - Number of Luma AI video credits to grant
 * @param serpapiCredits - Number of SerpApi query credits to grant
 */
export async function handleAioCreditPackGrant(
  blink: BlinkClient,
  userId: string,
  lumaCredits: number,
  serpapiCredits: number,
): Promise<GrantResult> {
  try {
    // 1. Find the user's establishment (same pattern as creditPackHandler.ts)
    const establishments = await blink.db.establishments.list({
      where: { userId },
      limit: 1,
    }) as any[];

    if (!establishments || establishments.length === 0) {
      console.warn(`[aio-credit-pack] No establishment found for user ${userId}, credits pending`);
      return {
        success: false,
        lumaGranted: 0,
        serpapiGranted: 0,
        error: 'No establishment found for user',
      };
    }

    const establishment = establishments[0];

    // 2. Grant Luma AI credits — increment the establishment's AI credits limit
    const currentLimit = establishment.aiCreditsLimit || 50;
    const newLumaLimit = currentLimit + lumaCredits;

    await blink.db.establishments.update(establishment.id, {
      aiCreditsLimit: newLumaLimit,
      updatedAt: new Date().toISOString(),
    } as any);

    // 3. Grant SerpApi credits — upsert a row in user_credit_quotas
    //    We use a separate "pack type" to distinguish from monthly plan quotas
    const packId = `aio_pack_${userId}_${Date.now()}`;
    const now = new Date().toISOString();

    // Check if there's an existing AIO pack quota row
    const existingQuotas = await blink.db.user_credit_quotas.list({
      where: { userId, planType: 'aio_creative_pack' },
      limit: 1,
    }) as any[];

    if (existingQuotas.length > 0) {
      // Add to existing pack balance
      const existing = existingQuotas[0];
      const currentSerpapi = existing.emailLimitMonthly || 0; // reusing this field for SerpApi
      await blink.db.user_credit_quotas.update(existing.id, {
        emailLimitMonthly: currentSerpapi + serpapiCredits,
        updatedAt: now,
      } as any);
    } else {
      // Create a new quota row for this pack
      await blink.db.user_credit_quotas.create({
        id: packId,
        userId,
        planType: 'aio_creative_pack',
        smsUsedThisMonth: 0,
        smsLimitMonthly: lumaCredits,        // Luma credits stored here
        emailUsedThisMonth: 0,
        emailLimitMonthly: serpapiCredits,    // SerpApi credits stored here
        isBlocked: 0,
        currentMonth: new Date().toISOString().slice(0, 7), // YYYY-MM
        createdAt: now,
        updatedAt: now,
      } as any);
    }

    console.warn(
      `[aio-credit-pack] Granted to user ${userId}: +${lumaCredits} Luma AI (limit now ${newLumaLimit}), +${serpapiCredits} SerpApi`,
    );

    return {
      success: true,
      lumaGranted: lumaCredits,
      serpapiGranted: serpapiCredits,
      newLumaLimit,
      newSerpapiBalance: (existingQuotas[0]?.emailLimitMonthly || 0) + serpapiCredits,
    };
  } catch (err) {
    console.error('[aio-credit-pack] Grant failed:', err);
    return {
      success: false,
      lumaGranted: 0,
      serpapiGranted: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
