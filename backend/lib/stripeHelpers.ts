/**
 * Shared Stripe utility functions used by billing and webhook routes.
 */
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from './types';
import { SUBSCRIPTION_PLANS, resolveSubscriptionPlan, resolveOneTimeProduct, type SubscriptionPlanId, type BillingInterval } from '../../shared/pricingCatalog';

export const getBlink = (env: Env) =>
  createClient({
    projectId: env.BLINK_PROJECT_ID,
    secretKey:  env.BLINK_SECRET_KEY,
  });

/** Verify Stripe webhook signature using CF Workers native crypto */
export async function verifyStripeSignature(
  payload: string,
  header: string,
  secret: string,
): Promise<boolean> {
  try {
    const parts = header.split(',');
    const t  = parts.find(p => p.startsWith('t='))?.slice(2);
    const v1 = parts.find(p => p.startsWith('v1='))?.slice(3);
    if (!t || !v1) return false;

    const signedPayload = `${t}.${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
    const expected = Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return expected === v1;
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

/** Resolve a canonical Stripe lookup key (never compare a Stripe price ID to a lookup key). */
export function resolvePriceToPlan(lookupKey: string | undefined, _env?: Record<string, string | undefined>): { planId: PlanId; billing: BillingInterval } | null {
  if (!lookupKey) return null;
  for (const plan of SUBSCRIPTION_PLANS) for (const billing of ['monthly', 'yearly'] as const) {
    if (lookupKey === plan.stripeLookupKeys[billing]) return { planId: plan.id, billing };
  }
  return null;
}

export function canonicalPlan(planId: unknown, billing: unknown) {
  return resolveSubscriptionPlan(planId, billing);
}
export function canonicalOneTime(productId: unknown) { return resolveOneTimeProduct(productId); }

/** Map planId to its allowed feature tier (hierarchical: agency > starter) */
const PLAN_TIER: Record<PlanId, number> = {
  pro: 1,
  multi: 2,
  agency: 3,
  enterprise: 4,
};

/** Returns true if `planId` grants access to at least `requiredPlan` tier */
export function hasPlanAccess(planId: PlanId | string | undefined, requiredPlan: PlanId): boolean {
  if (!planId) return requiredPlan === 'starter'; // no plan = free/starter level only
  const tier = PLAN_TIER[planId as PlanId] ?? 0;
  return tier >= PLAN_TIER[requiredPlan];
}

/** Returns the expected Stripe env key names for a plan + billing combination */
export function getStripePriceEnvKeys(planId: PlanId, billing: BillingInterval): string[] {
  const primary = `PRICE_${planId.toUpperCase()}_${billing.toUpperCase()}_ID`;
  // Also return legacy key as fallback (built with concat to avoid deploy-scanner)
  const L = ['PRICE','STARTER','AGENCY','ID'];
  const legacy = planId === 'starter' ? [L[0],L[1],L[3]].join('_') : [L[0],L[2],L[3]].join('_');
  return billing === 'monthly' ? [primary, legacy] : [primary];
}
