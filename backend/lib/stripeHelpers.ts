/**
 * Shared Stripe utility functions used by billing and webhook routes.
 */
import { requireBlinkProjectId } from './blinkConfig';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from './types';
import { SUBSCRIPTION_PLANS, resolveSubscriptionPlan, resolveOneTimeProduct, type SubscriptionPlanId, type BillingInterval } from '../../shared/pricingCatalog';

export const getBlink = (env: Env) =>
  createClient({
    projectId: requireBlinkProjectId(env),
    secretKey:  env.BLINK_SECRET_KEY,
  });

/** Verify Stripe webhook signatures using CF Workers native crypto. */
export async function verifyStripeSignature(
  payload: string,
  header: string,
  secret: string,
  toleranceSeconds = 300,
): Promise<boolean> {
  try {
    const parts = header.split(',').map(part => part.trim());
    const timestamp = parts.find(part => part.startsWith('t='))?.slice(2);
    const signatures = parts.filter(part => part.startsWith('v1=')).map(part => part.slice(3));
    const timestampSeconds = Number(timestamp);
    if (!timestamp || !Number.isFinite(timestampSeconds) || signatures.length === 0) return false;
    if (Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds) > toleranceSeconds) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
    const expected = Array.from(new Uint8Array(sig)).map(byte => byte.toString(16).padStart(2, '0')).join('');
    return signatures.some(signature => signature.length === expected.length && signature === expected);
  } catch {
    return false;
  }
}

/** Get + parse user metadata JSON from Blink DB */
export async function getUserMeta(
  blink: ReturnType<typeof getBlink>,
  userId: string,
): Promise<Record<string, unknown>> {
  try {
    const rows = await blink.db.users.list({ where: { id: userId }, limit: 1 });
    const raw = (rows[0] as any)?.metadata;
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Write merged metadata back to users table */
export async function patchUserMeta(
  blink: ReturnType<typeof getBlink>,
  userId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const existing = await getUserMeta(blink, userId);
  const merged = { ...existing, ...patch };
  await blink.db.users.update(userId, { metadata: JSON.stringify(merged) } as any);
}

/** Lookup user_id by Stripe customer_id scanning users.metadata */
export async function findUserByCustomer(
  blink: ReturnType<typeof getBlink>,
  customerId: string,
): Promise<string | null> {
  try {
    const rows = await blink.db.users.list({ limit: 1000 });
    for (const row of rows as any[]) {
      if (!row.metadata) continue;
      try {
        const m = JSON.parse(row.metadata);
        if (m.stripe_customer_id === customerId) return row.id;
      } catch { /* noop */ }
    }
    return null;
  } catch {
    return null;
  }
}

// ── Plan resolution ───────────────────────────────────────────────────────────

export type PlanId = SubscriptionPlanId | 'enterprise';
export { BillingInterval };

/** Read-only compatibility mapping for accounts created before the canonical catalog. */
export function normalizeLegacyPlanForDisplay(planId: unknown): string | null {
  if (planId === 'starter') {
    console.warn('[billing] legacy starter plan detected; display-only normalization to pro is required');
    return 'pro';
  }
  return typeof planId === 'string' && (planId === 'trial' || planId === 'pilot' || planId === 'pro' || planId === 'multi' || planId === 'agency' || planId === 'enterprise')
    ? planId
    : null;
}

/** Resolve a canonical Stripe lookup key (never compare a Stripe price ID to a lookup key). */
export function resolvePriceToPlan(lookupKey: string | undefined, _env?: Record<string, string | undefined>): { planId: PlanId; billing: BillingInterval } | null {
  if (!lookupKey) return null;
  for (const plan of SUBSCRIPTION_PLANS) for (const billing of ['monthly', 'yearly'] as const) {
    if (lookupKey === plan.stripeLookupKeys[billing]) return { planId: plan.id, billing };
  }
  return null;
}

export async function resolvePriceIdToPlan(stripeKey: string | null, priceId: string | undefined) {
  if (!stripeKey || !priceId) return null;
  try {
    const response = await fetch(`https://api.stripe.com/v1/prices/${encodeURIComponent(priceId)}`, {
      headers: { Authorization: `Bearer ${stripeKey}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const price = await response.json() as { livemode?: boolean; active?: boolean; lookup_key?: string };
    if (price.livemode !== true || price.active !== true) return null;
    return resolvePriceToPlan(price.lookup_key);
  } catch {
    return null;
  }
}

export function canonicalPlan(planId: unknown, billing: unknown) {
  return resolveSubscriptionPlan(planId, billing);
}
export function canonicalOneTime(productId: unknown) { return resolveOneTimeProduct(productId); }

export type ResolvedStripePrice = {
  id: string;
  lookupKey: string;
  currency: string;
  active: boolean;
  recurring: boolean;
  livemode: boolean;
  unitAmount: number;
  taxBehavior: 'exclusive';
};

/** Resolve a server-owned Stripe price. Browser supplied price IDs and amounts are never accepted. */
export async function resolveStripePrice(
  stripeKey: string,
  lookupKey: string,
  options: { testMode?: boolean; recurring: boolean; currency?: string; expectedAmount?: number; expectedInterval?: 'month' | 'year'; expectedProductId?: string },
): Promise<ResolvedStripePrice> {
  if (!stripeKey || !lookupKey) throw new Error('Stripe price lookup is required');
  const expectedTest = options.testMode ?? false;
  if (expectedTest || !stripeKey.startsWith('rk_live_')) throw new Error('LIVE_STRIPE_KEY_REQUIRED');
  const response = await fetch(`https://api.stripe.com/v1/prices?${new URLSearchParams({ lookup_keys: lookupKey, active: 'true', limit: '10' })}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error('Stripe price lookup failed');
  const payload = await response.json() as { data?: Array<any> };
  const candidates = (payload.data ?? []).filter((price) =>
    price?.active === true && price?.lookup_key === lookupKey && price?.currency === (options.currency ?? 'eur') &&
    price?.livemode === true && Boolean(price?.recurring) === options.recurring &&
    (!options.recurring || price.recurring?.interval === (options.expectedInterval ?? price.recurring?.interval)),
  );
  if (candidates.length !== 1) throw new Error('Stripe price is missing, ambiguous, or has the wrong mode/shape');
  const price = candidates[0];
  if (!price.id || !Number.isInteger(price.unit_amount) || price.unit_amount <= 0) throw new Error('Stripe price has invalid amount');
  if (options.expectedAmount !== undefined && price.unit_amount !== options.expectedAmount) throw new Error('STRIPE_CATALOG_AMOUNT_MISMATCH');
  // The catalog publishes HT amounts only, so Stripe Tax must add VAT on top of the
  // unit amount. An 'inclusive' or 'unspecified' price would silently turn the
  // catalog amount into a TTC amount and shrink the taxable base.
  if (price.tax_behavior !== 'exclusive') throw new Error('STRIPE_TAX_BEHAVIOR_INVALID');
  const productId = typeof price.product === 'string' ? price.product : price.product?.id;
  if (!productId) throw new Error('STRIPE_PRODUCT_MISSING');
  if (options.expectedProductId && productId !== options.expectedProductId) throw new Error('STRIPE_PRODUCT_MISMATCH');
  const productResponse = await fetch(`https://api.stripe.com/v1/products/${encodeURIComponent(productId)}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!productResponse.ok) throw new Error('Stripe product lookup failed');
  const product = await productResponse.json() as { active?: boolean; livemode?: boolean };
  if (product.active !== true || product.livemode !== true) throw new Error('STRIPE_PRODUCT_INACTIVE_OR_TEST');
  return { id: price.id, lookupKey, currency: price.currency, active: true, recurring: options.recurring, livemode: true, unitAmount: price.unit_amount, taxBehavior: 'exclusive' };
}

/** Map planId to its allowed feature tier. */
const PLAN_TIER: Record<PlanId, number> = { pro: 1, multi: 2, agency: 3, enterprise: 4 };

/** Returns true if a canonical catalog plan grants access to at least `requiredPlan` tier. */
export function hasPlanAccess(planId: PlanId | string | undefined, requiredPlan: PlanId): boolean {
  // Display normalization is deliberately not used for authorization. Legacy plans
  // must be migrated explicitly, never silently upgraded at an access boundary.
  if (typeof planId !== 'string' || !resolveSubscriptionPlan(planId, 'monthly') && planId !== 'enterprise') return false;
  return (PLAN_TIER[planId as PlanId] ?? 0) >= (PLAN_TIER[requiredPlan] ?? 0);
}
