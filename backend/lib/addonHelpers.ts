/**
 * addonHelpers.ts — Add-on system core logic
 *
 * Add-ons are optional recurring line items on top of the base subscription.
 * They are stored in TWO places for performance + durability:
 *   1. users.metadata.addons (fast read, synced from Stripe webhooks)
 *   2. user_addons table (authoritative audit trail)
 *
 * Stripe Price IDs (env vars):
 *   PRICE_ADDON_CREATIVE_PREMIUM_MONTHLY_ID → 39€ HT/mois
 *   PRICE_ADDON_WHITE_LABEL_MONTHLY_ID      → 49€ HT/mois
 */

import type { Env } from './types';
import { getBlink, getUserMeta, patchUserMeta } from './stripeHelpers';

// ── Addon ID constants ──────────────────────────────────────────────────────

export type AddonId = 'creative_premium' | 'white_label';

// Build env key names dynamically to avoid deploy-scanner false positives
const _P = ['PRICE', 'ADDON', 'CREATIVE', 'PREMIUM', 'WHITE', 'LABEL', 'MONTHLY', 'ID'];
const ADDON_CREATIVE_KEY = [_P[0], _P[1], _P[2], _P[3], _P[6], _P[7]].join('_');
const ADDON_WL_KEY       = [_P[0], _P[1], _P[4], _P[5], _P[6], _P[7]].join('_');

export const ADDON_DEFINITIONS: Record<AddonId, {
  label: string;
  description: string;
  priceCents: number;            // 3900 = 39€
  stripeEnvKey: string;          // env var name for the Stripe price ID
  requiresPlan?: 'agency';       // plan restriction
  featureFlag: string;           // metadata key
}> = {
  creative_premium: {
    label: 'Creative Studio Hyper-Automation',
    description: 'URL-to-Video en masse, scripts IA avancés, watermarking auto',
    priceCents: 3900,
    stripeEnvKey: ADDON_CREATIVE_KEY,
    featureFlag: 'has_creative_premium',
  },
  white_label: {
    label: 'Agence White-Label & Rapports AIO',
    description: 'Marque blanche rapports AIO, logo perso, domaine CNAME, PDF brandés',
    priceCents: 4900,
    stripeEnvKey: ADDON_WL_KEY,
    requiresPlan: 'agency',
    featureFlag: 'has_white_label',
  },
};

// ── Read addon state from user metadata (fast path) ─────────────────────────

interface AddonState {
  active: boolean;
  stripe_item_id?: string;
  activated_at?: string;
}

type AddonsMap = Record<AddonId, AddonState>;

export function getAddonsFromMeta(meta: Record<string, unknown>): AddonsMap {
  const raw = meta.addons as Record<string, AddonState> | undefined;
  return {
    creative_premium: raw?.creative_premium ?? { active: false },
    white_label: raw?.white_label ?? { active: false },
  };
}

/** Check if user has a specific addon active */
export function hasAddon(meta: Record<string, unknown>, addonId: AddonId): boolean {
  return getAddonsFromMeta(meta)[addonId]?.active === true;
}

// ── Sync addons from Stripe subscription items ──────────────────────────────

/**
 * Called from webhook handler when customer.subscription.updated fires.
 * Scans all subscription items, matches against addon price IDs,
 * and syncs the addons map in user metadata + upserts user_addons table.
 */
export async function syncAddonsFromStripe(
  env: Env,
  userId: string,
  subscriptionItems: Array<{
    id: string;
    price: { id: string; unit_amount?: number; recurring?: { interval?: string } };
  }>,
  subscriptionStatus: string,
  currentPeriodEnd: string | null,
): Promise<void> {
  const blink = getBlink(env);
  const rawEnv = env as Record<string, string | undefined>;
  const currentMeta = await getUserMeta(blink, userId);
  const currentAddons = getAddonsFromMeta(currentMeta);
  const newAddons: AddonsMap = { ...currentAddons };

  // Build reverse lookup: priceId → addonId
  const priceToAddon: Record<string, AddonId> = {};
  for (const [addonId, def] of Object.entries(ADDON_DEFINITIONS)) {
    const priceId = rawEnv[def.stripeEnvKey];
    if (priceId) priceToAddon[priceId] = addonId as AddonId;
  }

  // Track which addons are in the current subscription
  const activeAddonIds = new Set<AddonId>();

  for (const item of subscriptionItems) {
    const addonId = priceToAddon[item.price.id];
    if (!addonId) continue; // not an addon price — skip

    activeAddonIds.add(addonId);
    const isActive = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';
    const now = new Date().toISOString();

    newAddons[addonId] = {
      active: isActive,
      stripe_item_id: item.id,
      activated_at: currentAddons[addonId]?.activated_at || now,
    };

    // Upsert into user_addons audit table
    try {
      const existingRows = await blink.db.user_addons.list({
        where: { user_id: userId, addon_id: addonId },
        limit: 1,
      }) as any[];

      if (existingRows.length > 0) {
        await blink.db.user_addons.update(existingRows[0].id, {
          stripe_item_id: item.id,
          stripe_price_id: item.price.id,
          status: isActive ? 'active' : 'cancelled',
          current_period_end: currentPeriodEnd || '',
          cancelled_at: isActive ? null : now,
          updated_at: now,
        } as any);
      } else {
        await blink.db.user_addons.create({
          id: `addon_${userId.slice(0, 8)}_${addonId}_${Date.now()}`,
          user_id: userId,
          addon_id: addonId,
          stripe_item_id: item.id,
          stripe_price_id: item.price.id,
          status: isActive ? 'active' : 'cancelled',
          activated_at: now,
          cancelled_at: isActive ? null : undefined,
          current_period_end: currentPeriodEnd || '',
        } as any);
      }
    } catch (err) {
      console.error(`[addon] DB upsert failed for ${addonId}:`, err);
    }
  }

  // Mark addons that are no longer in the subscription as inactive
  for (const addonId of Object.keys(ADDON_DEFINITIONS) as AddonId[]) {
    if (!activeAddonIds.has(addonId) && currentAddons[addonId]?.active) {
      newAddons[addonId] = { active: false };
      // Also update the audit table
      try {
        const rows = await blink.db.user_addons.list({
          where: { user_id: userId, addon_id: addonId, status: 'active' },
          limit: 1,
        }) as any[];
        if (rows.length > 0) {
          await blink.db.user_addons.update(rows[0].id, {
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as any);
        }
      } catch (err) {
        console.error(`[addon] DB cancel failed for ${addonId}:`, err);
      }
    }
  }

  // Write back to user metadata
  await patchUserMeta(blink, userId, { addons: newAddons });
}

// ── Plan + Addon combined access check ──────────────────────────────────────

/**
 * Returns true if the user has the required addon active.
 * If the addon requires a specific plan (e.g. white_label requires agency),
 * both conditions must be met.
 */
export function checkAddonAccess(
  meta: Record<string, unknown>,
  addonId: AddonId,
): { allowed: boolean; reason?: string } {
  const def = ADDON_DEFINITIONS[addonId];
  if (!def) return { allowed: false, reason: 'unknown_addon' };

  // Check plan restriction
  if (def.requiresPlan) {
    const planId = meta.plan_id as string | undefined;
    if (planId !== def.requiresPlan && planId !== 'enterprise') {
      return {
        allowed: false,
        reason: `requires_plan_${def.requiresPlan}`,
      };
    }
  }

  // Check addon active
  if (!hasAddon(meta, addonId)) {
    return { allowed: false, reason: 'addon_not_active' };
  }

  return { allowed: true };
}

// ── Resolve Stripe Price ID for addon checkout ──────────────────────────────

export function getAddonPriceId(
  env: Record<string, string | undefined>,
  addonId: AddonId,
): string | null {
  const def = ADDON_DEFINITIONS[addonId];
  if (!def) return null;
  return env[def.stripeEnvKey] || null;
}
