import { Hono } from 'hono'
import type { Env } from '../../lib/types'
import { getBlink, getUserMeta, patchUserMeta } from '../../lib/stripeHelpers'
import { resolveOneTimeProduct } from '../../lib/pricingCatalog'

export const router = new Hono()
const CGV_VERSION = 'CGV_V1.0_2026-06'

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
  if (product.productId === 'service_custom_quote') {
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
    legal_consent_log: JSON.stringify({ cgvVersion: consent.cgvVersion, acceptedAt: consentAt, productId: product.productId, cgvAccepted: true, retractionWaived: true }),
  })
  const meta = await getUserMeta(blink, auth.userId)
  const priceId = env[product.envKey]
  if (!priceId) return c.json({ error: 'Prix Stripe non configuré côté serveur', code: 'PRICE_NOT_CONFIGURED' }, 503)
  // Pilot access starts only after checkout.completed/payment fulfillment; never before payment.
  const params = new URLSearchParams({
    mode: 'payment',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    success_url: `https://kompilot.blinkpowered.com/dashboard?checkout=success&product=${product.productId}`,
    cancel_url: 'https://kompilot.blinkpowered.com/account?tab=billing',
    'metadata[user_id]': auth.userId,
    'metadata[product_id]': product.productId,
    'metadata[product_type]': product.definition.productType,
    'metadata[pilot_days]': String(product.definition.pilotDays ?? ''),
    'metadata[credit_eligible]': String(product.definition.creditEligible === true),
    'metadata[credit_type]': String(product.definition.creditType ?? ''),
    'metadata[credit_amount]': String(product.definition.creditAmount ?? ''),
    'metadata[legal_consent]': 'accepted',
    'metadata[legal_consent_version]': CGV_VERSION,
    'payment_intent_data[metadata][product_id]': product.productId,
    'payment_intent_data[metadata][pilot_days]': String(product.definition.pilotDays ?? ''),
    'payment_intent_data[metadata][credit_eligible]': String(product.definition.creditEligible === true),
  })
  if (meta.stripe_customer_id) params.set('customer', String(meta.stripe_customer_id))
  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() })
  if (!response.ok) return c.json({ error: 'Checkout creation failed' }, 502)
  const session = await response.json() as { url?: string }
  return c.json({ url: session.url, productId: product.productId, pilotEndAt: null, renews: false })
})
