/**
 * Add-on Checkout Route
 *   POST /api/billing/addon/checkout  — Add an addon to the existing Stripe subscription
 *   POST /api/billing/addon/remove    — Remove an addon from the subscription
 *   GET  /api/billing/addon/status    — Get current addon state for the user
 *
 * Add-ons are added as additional items on the existing Stripe subscription
 * (not separate subscriptions). This keeps billing unified on one invoice.
 */

import { Hono } from 'hono';
import type { Env } from '../lib/types';
import { getBlink, getUserMeta, patchUserMeta } from '../lib/stripeHelpers';
import { resolveOneTimeProduct } from '../lib/pricingCatalog';
import {
  ADDON_DEFINITIONS,
  type AddonId,
  getAddonPriceId,
  checkAddonAccess,
  hasAddon,
  getAddonsFromMeta,
} from '../lib/addonHelpers';

export const router = new Hono();

// ── POST /api/billing/addon/checkout ─────────────────────────────────────────

router.post('/api/billing/addon/checkout', async (c) => {
  const env    = c.env as unknown as Env;
  const rawEnv = c.env as any;
  const blink  = getBlink(env);

  // 1. Auth
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  // 2. Stripe configured?
  const stripeKey = rawEnv.STRIPE_SECRET_KEY as string | undefined;
  if (!stripeKey) return c.json({ error: 'Stripe not configured', code: 'NO_STRIPE_KEY' }, 503);

  // 3. Parse body
  const body = await c.req.json<{ addonId: string }>();
  const addonId = body?.addonId as AddonId | undefined;
  if (!addonId || !ADDON_DEFINITIONS[addonId]) {
    return c.json({ error: 'Invalid addon ID', code: 'INVALID_ADDON' }, 400);
  }

  const def = ADDON_DEFINITIONS[addonId];
  const canonicalProduct = resolveOneTimeProduct(body?.addonId);
  if (canonicalProduct?.definition.productType === 'addon') {
    const meta = await getUserMeta(blink, auth.userId);
    const planId = String(meta.plan_id ?? '');
    if (canonicalProduct.definition.planId && planId !== canonicalProduct.definition.planId && planId !== 'enterprise') {
      return c.json({ error: 'Cet add-on nécessite un forfait compatible.', code: 'PLAN_REQUIRED', requiredPlan: canonicalProduct.definition.planId }, 403);
    }
    if (canonicalProduct.definition.maxTotal) {
      const existing = await blink.db.user_addons.list({ where: { userId: auth.userId, status: 'active' }, limit: 100 }) as any[];
      if (existing.length >= canonicalProduct.definition.maxTotal) return c.json({ error: 'Limite d’add-ons atteinte.', code: 'ADDON_LIMIT_REACHED' }, 409);
    }
  }

  // 4. Check plan restriction (white_label requires agency)
  const meta = await getUserMeta(blink, auth.userId);
  const planId = meta.plan_id as string | undefined;
  if (def.requiresPlan && planId !== def.requiresPlan && planId !== 'enterprise') {
    return c.json({
      error: `L'add-on "${def.label}" nécessite le forfait ${def.requiresPlan}.`,
      code: 'PLAN_REQUIRED',
      requiredPlan: def.requiresPlan,
    }, 403);
  }

  // 5. Already active?
  if (hasAddon(meta, addonId)) {
    return c.json({ error: 'Add-on déjà actif', code: 'ALREADY_ACTIVE' }, 409);
  }

  // 6. Get the Stripe subscription ID
  const subscriptionId = meta.stripe_subscription_id as string | undefined;
  if (!subscriptionId) {
    return c.json({
      error: 'Aucun abonnement actif. Veuillez d\'abord souscrire à un forfait.',
      code: 'NO_SUBSCRIPTION',
    }, 400);
  }

  // 7. Resolve addon price ID
  const canonicalAddon = resolveOneTimeProduct(body?.addonId)
  const priceId = canonicalAddon?.definition.productType === 'addon' ? await (async () => {
    const r = await fetch(`https://api.stripe.com/v1/prices?${new URLSearchParams({ lookup_keys: canonicalAddon.envKey ?? '', active: 'true', limit: '1' })}`, { headers: { Authorization: `Bearer ${stripeKey}` } });
    const d = await r.json() as { data?: Array<{ id: string }> }; return d.data?.[0]?.id ?? null
  })() : getAddonPriceId(rawEnv, addonId);
  if (!priceId) {
    return c.json({
      error: 'Prix de l\'add-on non configuré côté serveur.',
      code: 'ADDON_PRICE_MISSING',
    }, 503);
  }

  // 8. Add the addon as a new item on the existing subscription
  try {
    const stripeRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}/items`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'price': priceId,
        'quantity': '1',
        'payment_behavior': 'pending_if_incomplete',
        'proration_behavior': 'always_invoice',
        'metadata[addon_id]': addonId,
      }).toString(),
    });

    if (!stripeRes.ok) {
      const errBody = await stripeRes.text();
      console.error('[addon] Stripe subscription item create failed:', stripeRes.status, errBody);
      return c.json({ error: 'Erreur Stripe lors de l\'ajout de l\'add-on.', code: 'ADDON_STRIPE_ERR' }, 502);
    }

    const item = await stripeRes.json() as any;

    // 9. Immediately update user metadata (optimistic — webhook will confirm)
    const now = new Date().toISOString();
    const addons = getAddonsFromMeta(meta);
    addons[addonId] = {
      active: true,
      stripe_item_id: item.id,
      activated_at: now,
    };
    await patchUserMeta(blink, auth.userId, { addons });

    // 10. Insert into audit table
    try {
      await blink.db.user_addons.create({
        id: `addon_${auth.userId.slice(0, 8)}_${addonId}_${Date.now()}`,
        user_id: auth.userId,
        addon_id: addonId,
        stripe_item_id: item.id,
        stripe_price_id: priceId,
        status: 'active',
        activated_at: now,
      } as any);
    } catch (err) {
      console.error('[addon] audit insert failed (non-fatal):', err);
    }

    console.warn(`[addon] ${addonId} activated for user ${auth.userId}`);
    return c.json({ success: true, addonId, itemId: item.id });
  } catch (err) {
    console.error('[addon] checkout error:', err);
    return c.json({ error: 'Erreur interne', code: 'INTERNAL' }, 500);
  }
});

// ── POST /api/billing/addon/remove ──────────────────────────────────────────

router.post('/api/billing/addon/remove', async (c) => {
  const env    = c.env as unknown as Env;
  const rawEnv = c.env as any;
  const blink  = getBlink(env);

  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const stripeKey = rawEnv.STRIPE_SECRET_KEY as string | undefined;
  if (!stripeKey) return c.json({ error: 'Stripe not configured' }, 503);

  const body = await c.req.json<{ addonId: string }>();
  const addonId = body?.addonId as AddonId | undefined;
  if (!addonId || !ADDON_DEFINITIONS[addonId]) {
    return c.json({ error: 'Invalid addon ID' }, 400);
  }

  const meta = await getUserMeta(blink, auth.userId);
  const addons = getAddonsFromMeta(meta);
  const addon = addons[addonId];

  if (!addon?.active || !addon.stripe_item_id) {
    return c.json({ error: 'Add-on non actif', code: 'NOT_ACTIVE' }, 400);
  }

  const subscriptionId = meta.stripe_subscription_id as string | undefined;
  if (!subscriptionId) {
    return c.json({ error: 'Aucun abonnement actif' }, 400);
  }

  try {
    // Remove the item from the subscription (prorate credit)
    const stripeRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        [`items[0][id]`]: addon.stripe_item_id,
        [`items[0][deleted]`]: 'true',
        'proration_behavior': 'always_invoice',
      }).toString(),
    });

    if (!stripeRes.ok) {
      const errBody = await stripeRes.text();
      console.error('[addon] Stripe remove failed:', stripeRes.status, errBody);
      return c.json({ error: 'Erreur Stripe lors du retrait.' }, 502);
    }

    // Update metadata immediately
    addons[addonId] = { active: false };
    await patchUserMeta(blink, auth.userId, { addons });

    // Update audit table
    try {
      const rows = await blink.db.user_addons.list({
        where: { user_id: auth.userId, addon_id: addonId, status: 'active' },
        limit: 1,
      }) as any[];
      if (rows.length > 0) {
        await blink.db.user_addons.update(rows[0].id, {
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any);
      }
    } catch { /* non-fatal */ }

    console.warn(`[addon] ${addonId} removed for user ${auth.userId}`);
    return c.json({ success: true, addonId });
  } catch (err) {
    console.error('[addon] remove error:', err);
    return c.json({ error: 'Erreur interne' }, 500);
  }
});

// ── GET /api/billing/addon/status ───────────────────────────────────────────

router.get('/api/billing/addon/status', async (c) => {
  const env   = c.env as unknown as Env;
  const blink = getBlink(env);

  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const meta = await getUserMeta(blink, auth.userId);
  const addons = getAddonsFromMeta(meta);
  const planId = meta.plan_id as string | undefined;

  // Enrich with access info
  const result: Record<string, any> = {};
  for (const [addonId, def] of Object.entries(ADDON_DEFINITIONS)) {
    const access = checkAddonAccess(meta, addonId as AddonId);
    result[addonId] = {
      active: addons[addonId as AddonId]?.active ?? false,
      label: def.label,
      description: def.description,
      priceCents: def.priceCents,
      requiresPlan: def.requiresPlan ?? null,
      canSubscribe: !access.allowed && access.reason !== `requires_plan_${def.requiresPlan}`,
      canSubscribeReason: access.reason ?? null,
    };
  }

  return c.json({ planId, addons: result });
});

export { ADDON_DEFINITIONS, type AddonId, checkAddonAccess, hasAddon };
