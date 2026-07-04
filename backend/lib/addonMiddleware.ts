/**
 * addonMiddleware.ts — Hono middleware for add-on route protection
 *
 * Usage in backend routes:
 *   router.post('/api/creative/bulk-url-to-video', requireAddon('creative_premium'), handler)
 *   router.post('/api/agency/white-label-config', requireAddon('white_label'), handler)
 *
 * Or composite:
 *   router.post('/api/something', requirePlanOrAddon('agency', 'white_label'), handler)
 */

import type { Context, Next } from 'hono';
import type { Env } from './types';
import { getBlink, getUserMeta } from './stripeHelpers';
import { checkAddonAccess, hasAddon, type AddonId, ADDON_DEFINITIONS } from './addonHelpers';
import { hasPlanAccess, type PlanId } from './stripeHelpers';

/**
 * Middleware factory: blocks request if user doesn't have the specified addon active.
 * Returns HTTP 403 with a structured error body the frontend can use to show an upsell.
 *
 * @param addonId - The addon to check ('creative_premium' | 'white_label')
 */
export function requireAddon(addonId: AddonId) {
  return async (c: Context, next: Next) => {
    const env   = c.env as unknown as Env;
    const blink = getBlink(env);

    const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
    if (!auth.valid) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const meta = await getUserMeta(blink, auth.userId);
    const access = checkAddonAccess(meta, addonId);

    if (!access.allowed) {
      const def = ADDON_DEFINITIONS[addonId];
      return c.json({
        error: `Add-on requis : ${def.label}`,
        code: 'ADDON_REQUIRED',
        addonId,
        addonLabel: def.label,
        addonPriceCents: def.priceCents,
        reason: access.reason,
        stripeEnvKey: def.stripeEnvKey,
      }, 403);
    }

    // Attach addon state to context for downstream handlers
    c.set('addonId', addonId);
    c.set('userId', auth.userId);
    c.set('userMeta', meta);

    await next();
  };
}

/**
 * Middleware factory: blocks if user doesn't have EITHER the required plan OR the addon.
 * Useful for features that are available in the plan OR as an add-on.
 *
 * Example: requirePlanOrAddon('agency', 'white_label')
 *   → passes if plan=agency (feature included) OR addon=white_label active
 *
 * @param requiredPlan - Minimum plan tier required
 * @param addonId - Alternative: addon that grants access regardless of plan
 */
export function requirePlanOrAddon(requiredPlan: PlanId, addonId: AddonId) {
  return async (c: Context, next: Next) => {
    const env   = c.env as unknown as Env;
    const blink = getBlink(env);

    const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
    if (!auth.valid) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const meta = await getUserMeta(blink, auth.userId);
    const planId = meta.plan_id as string | undefined;

    // Check plan access first (cheaper)
    const planOk = hasPlanAccess(planId, requiredPlan);

    // If plan covers it, pass through
    if (planOk) {
      c.set('userId', auth.userId);
      c.set('userMeta', meta);
      await next();
      return;
    }

    // Otherwise, check addon
    const addonOk = hasAddon(meta, addonId);
    if (addonOk) {
      c.set('userId', auth.userId);
      c.set('userMeta', meta);
      c.set('addonId', addonId);
      await next();
      return;
    }

    // Neither plan nor addon covers this feature
    const def = ADDON_DEFINITIONS[addonId];
    return c.json({
      error: `Accès requis : forfait ${requiredPlan} OU add-on "${def.label}"`,
      code: 'PLAN_OR_ADDON_REQUIRED',
      requiredPlan,
      addonId,
      addonLabel: def.label,
      addonPriceCents: def.priceCents,
    }, 403);
  };
}

/**
 * Middleware factory: soft check — attaches addon state to context but doesn't block.
 * Use for routes that behave differently based on addon status (e.g. show watermark vs. not).
 */
export function withAddonCheck(addonId: AddonId) {
  return async (c: Context, next: Next) => {
    const env   = c.env as unknown as Env;
    const blink = getBlink(env);

    const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
    if (!auth.valid) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const meta = await getUserMeta(blink, auth.userId);
    c.set('addonActive', hasAddon(meta, addonId));
    c.set('addonId', addonId);
    c.set('userId', auth.userId);
    c.set('userMeta', meta);

    await next();
  };
}
