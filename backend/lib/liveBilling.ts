import type { Context } from 'hono'
import { getBlink, getUserMeta, patchUserMeta, resolveStripePrice, type ResolvedStripePrice } from './stripeHelpers'
import type { Env } from './types'

export const LIVE_CATALOG_VERSION = '2026-09'
export const PILOT_COUPON_ID = 'kompilot_pilot_credit_99'
export const LIVE_BILLING_SECRETS = [
  'STRIPE_RESTRICTED_KEY_LIVE',
  'STRIPE_WEBHOOK_SECRET_LIVE',
  'STRIPE_MODE',
  'APP_BASE_URL',
  'STRIPE_SUCCESS_URL',
  'STRIPE_CANCEL_URL',
] as const

export const LIVE_BILLING_DISABLED_CODE = 'LIVE_BILLING_DISABLED'

export function isLiveBillingEnabled(env: Record<string, unknown>): boolean {
  return String(env.LIVE_BILLING_ENABLED ?? '').trim().toLowerCase() === 'true'
}

export function liveBillingDisabledResponse(c: Context) {
  return c.json({
    error: 'La facturation en ligne sera activée après validation commerciale.',
    code: LIVE_BILLING_DISABLED_CODE,
    message: 'Essai gratuit, demande de démonstration ou activation commerciale : jeremy@kompilot.fr',
  }, 403)
}

export type LiveBillingConfig = {
  stripeKey: string
  appBaseUrl: URL
  successUrl: URL
  cancelUrl: URL
}

export function liveStripeKey(env: Record<string, unknown>): string | null {
  const key = String(env.STRIPE_RESTRICTED_KEY_LIVE ?? '').trim()
  return String(env.STRIPE_MODE ?? '').trim() === 'live' && key.startsWith('rk_live_') ? key : null
}

export function liveWebhookSecret(env: Record<string, unknown>): string | null {
  const secret = String(env.STRIPE_WEBHOOK_SECRET_LIVE ?? '').trim()
  return secret.startsWith('whsec_') ? secret : null
}

// BACKEND_URL is independent, mandatory config — never derived from BLINK_PROJECT_ID.
export function blinkBackendUrl(env: Record<string, unknown>): string | null {
  const backendUrl = String(env.BACKEND_URL ?? '').trim()
  return backendUrl ? backendUrl.replace(/\/+$/, '') : null
}

export function liveBillingConfig(env: Record<string, unknown>):
  | { config: LiveBillingConfig; missing: []; error: null }
  | { config: null; missing: string[]; error: string | null } {
  if (!isLiveBillingEnabled(env)) return { config: null, missing: [], error: LIVE_BILLING_DISABLED_CODE }
  const missing = LIVE_BILLING_SECRETS.filter((name) => !String(env[name] ?? '').trim())
  if (missing.length > 0) return { config: null, missing: [...missing], error: null }

  const stripeKey = String(env.STRIPE_RESTRICTED_KEY_LIVE).trim()
  if (!stripeKey.startsWith('rk_live_')) return { config: null, missing: [], error: 'STRIPE_RESTRICTED_KEY_LIVE must be an rk_live_ restricted key' }
  if (String(env.STRIPE_MODE).trim() !== 'live') return { config: null, missing: [], error: 'STRIPE_MODE must be live' }

  try {
    const appBaseUrl = new URL(String(env.APP_BASE_URL))
    const successUrl = new URL(String(env.STRIPE_SUCCESS_URL))
    const cancelUrl = new URL(String(env.STRIPE_CANCEL_URL))
    for (const url of [appBaseUrl, successUrl, cancelUrl]) {
      if (url.protocol !== 'https:') throw new Error('HTTPS URLs are required')
    }
    return { config: { stripeKey, appBaseUrl, successUrl, cancelUrl }, missing: [], error: null }
  } catch {
    return { config: null, missing: [], error: 'APP_BASE_URL, STRIPE_SUCCESS_URL and STRIPE_CANCEL_URL must be valid HTTPS URLs' }
  }
}

export function demoBillingResponse(c: Context) {
  return c.json({
    demo: true,
    message: 'Mode démo : action simulée, aucun paiement réel.',
    code: 'DEMO_BILLING_BLOCKED',
  })
}

export function isDemoBillingRequest(c: Context, env: Record<string, unknown>): boolean {
  if (String(env.KOMPILOT_DEMO_MODE).toLowerCase() === 'true') return true
  if (c.req.header('X-Kompilot-Demo-Session') === 'true') return true
  for (const header of ['Origin', 'Referer']) {
    const value = c.req.header(header)
    if (!value) continue
    try {
      if (new URL(value).hostname === 'demo.kompilot.fr') return true
    } catch { /* malformed origin is handled by normal auth/CORS */ }
  }
  return false
}

export function billingIdentity(c: Context, userId: string, meta: Record<string, unknown>) {
  const workspaceId = String(c.get('workspaceId') ?? c.req.header('X-Workspace-Id') ?? meta.workspace_id ?? '').trim()
  const organizationId = String(c.get('workspaceOwnerId') ?? meta.organization_id ?? workspaceId ?? '').trim()
  if (!organizationId || !workspaceId) return null
  return { organizationId, workspaceId, userId }
}

export function checkoutMetadata(identity: { organizationId: string; workspaceId: string; userId: string }, businessKey: string, planId: string, billingPeriod: string) {
  return {
    organization_id: identity.organizationId,
    user_id: identity.userId,
    workspace_id: identity.workspaceId,
    business_key: businessKey,
    plan_id: planId,
    billing_period: billingPeriod,
    environment: 'live',
    catalog_version: LIVE_CATALOG_VERSION,
  }
}

export function metadataParams(prefix: string, metadata: Record<string, string>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(metadata)) params.set(`${prefix}[${key}]`, value)
  return params
}

export function addQuery(url: URL, values: Record<string, string>) {
  const copy = new URL(url.toString())
  for (const [key, value] of Object.entries(values)) copy.searchParams.set(key, value)
  return copy.toString()
}

export function stableCheckoutId(identity: { organizationId: string }, businessKey: string, requestId?: string) {
  const suffix = requestId?.trim() || 'default'
  return `kompilot:${identity.organizationId}:${businessKey}:${suffix}`.slice(0, 255)
}

export async function ensureStripeCustomer(
  c: Context,
  env: Env,
  identity: { organizationId: string; workspaceId: string; userId: string },
  meta: Record<string, unknown>,
  stripeKey: string,
) {
  const blink = getBlink(env)
  const existing = String(meta.stripe_customer_id ?? '').trim()
  if (existing) return existing
  const users = await blink.db.users.list({ where: { id: identity.userId }, limit: 1 }) as Array<Record<string, unknown>>
  const user = users[0]
  const email = String(user?.email ?? '').trim()
  if (!email || user?.emailVerified !== true) throw new Error('VERIFIED_EMAIL_REQUIRED')

  const body = new URLSearchParams({
    email,
    'metadata[organization_id]': identity.organizationId,
    'metadata[workspace_id]': identity.workspaceId,
    'metadata[user_id]': identity.userId,
    'metadata[environment]': 'live',
  })
  const response = await fetch('https://api.stripe.com/v1/customers', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': `kompilot:customer:${identity.organizationId}`.slice(0, 255),
    },
    body: body.toString(),
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) throw new Error('STRIPE_CUSTOMER_CREATE_FAILED')
  const customer = await response.json() as { id?: string }
  if (!customer.id) throw new Error('STRIPE_CUSTOMER_CREATE_FAILED')
  await patchUserMeta(blink, identity.userId, {
    stripe_customer_id: customer.id,
    organization_id: identity.organizationId,
    workspace_id: identity.workspaceId,
  })
  return customer.id
}

export async function resolveLiveCatalogPrice(
  stripeKey: string,
  lookupKey: string,
  expected: { recurring: boolean; amount: number; productId: string },
): Promise<ResolvedStripePrice> {
  return resolveStripePrice(stripeKey, lookupKey, {
    recurring: expected.recurring,
    testMode: false,
    currency: 'eur',
    expectedAmount: expected.amount,
    expectedProductId: expected.productId,
  })
}

export function canApplyPilotCoupon(meta: Record<string, unknown>, planId: string, billing: string) {
  return Boolean(meta.pilot_paid_at) && ['pro', 'multi', 'agency'].includes(planId) && billing === 'yearly'
}
