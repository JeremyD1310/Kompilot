import { Hono } from 'hono'
import type { Env } from '../../lib/types'
import { getBlink, getUserMeta, patchUserMeta } from '../../lib/stripeHelpers'
import { resolveOneTimeProduct } from '../../../shared/pricingCatalog'

export const router = new Hono()
const CGV_VERSION = 'CGV_V1.0_2026-06'

async function resolveStripePriceId(stripeKey: string, lookupKey: string): Promise<string | null> {
  const response = await fetch(`https://api.stripe.com/v1/prices?${new URLSearchParams({ lookup_keys: lookupKey, active: 'true', limit: '1' })}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  })
  if (!response.ok) return null
  const data = await response.json() as { data?: Array<{ id: string }> }
  return data.data?.[0]?.id ?? null
}

router.post('/api/billing/one-time-checkout', async (c) => {
  const env = c.env as unknown as Env & Record<string, string | undefined>
  const blink = getBlink(env)
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'))
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401)
  if (!env.STRIPE_SECRET_KEY) return c.json({ error: 'Stripe not configured', code: 'NO_STRIPE_KEY' }, 503)
  if (env.KOMPILOT_DEMO_MODE === 'true') return c.json({ error: 'Les achats sont désactivés dans le mode démo.', code: 'DEMO_BILLING_BLOCKED' }, 403)

  const body = await c.req.json<{ productId?: string; legalConsent?: { cgvAccepted?: boolean; retractionWaived?: boolean; cgvVersion?: string } }>()
  const product = resolveOneTimeProduct(body?.productId)
  if (!product) return c.json({ error: 'Produit invalide', code: 'INVALID_PRODUCT' }, 400)
  // Enterprise/custom-quote work is never payable through direct checkout.
  if (product.amountEurHt === null) {
    return c.json({ error: 'Ce produit nécessite un devis signé', code: 'CUSTOM_QUOTE_REQUIRED' }, 400)
  }
  const consent = body.legalConsent
  if (!consent?.cgvAccepted || !consent.retractionWaived || consent.cgvVersion !== CGV_VERSION) {
    return c.json({ error: 'Consentement légal requis', code: 'INVALID_LEGAL_CONSENT' }, 422)
  }

  const consentAt = new Date().toISOString()
  await patchUserMeta(blink, auth.userId, {
    legal_consent_at: consentAt,
    legal_consent_version: consent.cgvVersion,
    legal_consent_log: JSON.stringify({ cgvVersion: consent.cgvVersion, acceptedAt: consentAt, productId: product.id, cgvAccepted: true, retractionWaived: true }),
  })
  const meta = await getUserMeta(blink, auth.userId)
  const appUrl = String(env.APP_URL ?? env.PUBLIC_APP_URL ?? '').trim()
  let validatedAppUrl: URL
  try { validatedAppUrl = new URL(appUrl); if (validatedAppUrl.protocol !== 'https:') throw new Error('https required') } catch { return c.json({ error: 'APP_URL must be a valid https URL', code: 'INVALID_APP_URL' }, 503) }
  if (env.STRIPE_SECRET_KEY.startsWith('sk_live_') && env.STRIPE_TEST_MODE === 'true') return c.json({ error: 'Live Stripe key rejected in test mode', code: 'LIVE_KEY_IN_TEST_MODE' }, 503)
  const priceId = await resolveStripePriceId(env.STRIPE_SECRET_KEY, product.lookupKey)
  if (!priceId) return c.json({ error: 'Prix Stripe non configuré côté serveur', code: 'PRICE_NOT_CONFIGURED' }, 503)
  // Pilot access starts only after checkout.completed/payment fulfillment; never before payment.
  const params = new URLSearchParams({
    mode: 'payment',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    success_url: `${validatedAppUrl.origin}/dashboard?checkout=success&product=${product.id}`,
    cancel_url: `${validatedAppUrl.origin}/account?tab=billing`,
    'metadata[user_id]': auth.userId,
    'metadata[product_id]': product.id,
    'metadata[product_type]': product.productType,
    'metadata[pilot_days]': String(product.pilotDays ?? ''),
    'metadata[credit_eligible]': String(product.creditEligible === true),
    'metadata[credit_type]': String(product.creditType ?? ''),
    'metadata[credit_amount]': String(product.creditAmount ?? ''),
    'metadata[legal_consent]': 'accepted',
    'metadata[legal_consent_version]': CGV_VERSION,
    'payment_intent_data[metadata][product_id]': product.id,
    'payment_intent_data[metadata][pilot_days]': String(product.pilotDays ?? ''),
    'payment_intent_data[metadata][credit_eligible]': String(product.creditEligible === true),
  })
  if (meta.stripe_customer_id) params.set('customer', String(meta.stripe_customer_id))
  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() })
  if (!response.ok) return c.json({ error: 'Checkout creation failed' }, 502)
  const session = await response.json() as { url?: string }
  return c.json({ url: session.url, productId: product.id, pilotEndAt: null, renews: false })
})
