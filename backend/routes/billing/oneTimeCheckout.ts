import { Hono } from 'hono'
import { getBlink, getUserMeta, patchUserMeta, resolveStripePrice } from '../../lib/stripeHelpers'
import { liveBillingConfig, isDemoBillingRequest, demoBillingResponse, addQuery } from '../../lib/liveBilling'
import { resolveOneTimeProduct } from '../../../shared/pricingCatalog'

export const router = new Hono()
const CGV_VERSION = 'CGV_V1.0_2026-06'

router.post('/api/billing/one-time-checkout', async (c) => {
  const rawEnv = c.env as Record<string, unknown>
  const env = c.env as any
  const blink = getBlink(env)
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'))
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401)
  if (isDemoBillingRequest(c, rawEnv)) return demoBillingResponse(c)
  const live = liveBillingConfig(rawEnv)
  if (!live.config) return c.json({ error: live.error ?? 'Stripe Live is not configured', code: live.error ? 'INVALID_LIVE_BILLING_CONFIG' : 'LIVE_BILLING_NOT_CONFIGURED', missing: live.missing }, 503)
  const { stripeKey, successUrl, cancelUrl } = live.config

  const body = await c.req.json<{ productId?: string; legalConsent?: { cgvAccepted?: boolean; retractionWaived?: boolean; cgvVersion?: string } }>()
  const product = resolveOneTimeProduct(body?.productId)
  if (!product) return c.json({ error: 'Produit invalide', code: 'INVALID_PRODUCT' }, 400)
  if ((product.productType !== 'topup' && product.productType !== 'guided_pilot') || product.recurring === true) {
    return c.json({ error: 'Ce produit n’est pas disponible via ce checkout', code: 'INVALID_PRODUCT' }, 400)
  }
  // Enterprise/custom-quote work is never payable through direct checkout.
  if (product.amountEurHt === null) {
    return c.json({ error: 'Ce produit nécessite un devis signé', code: 'CUSTOM_QUOTE_REQUIRED' }, 400)
  }
  const consent = body.legalConsent
  if (!consent?.cgvAccepted || !consent.retractionWaived || consent.cgvVersion !== CGV_VERSION) {
    return c.json({ error: 'Consentement légal requis', code: 'INVALID_LEGAL_CONSENT' }, 422)
  }

  const consentAt = new Date().toISOString()
  const meta = await getUserMeta(blink, auth.userId)
  let priceId: string
  try {
    priceId = (await resolveStripePrice(stripeKey, product.lookupKey, {
      recurring: product.recurring === true,
      testMode: false,
      currency: 'eur',
      expectedAmount: product.amountEurHt * 100,
      ...(product.recurring === true ? { expectedInterval: product.billing === 'monthly' ? 'month' : 'year' } : {}),
    })).id
  } catch (error) {
    console.error('[billing/one-time-checkout] price resolution failed', error)
    return c.json({ error: 'Prix Stripe non configuré côté serveur', code: 'PRICE_NOT_CONFIGURED' }, 503)
  }
  // Pilot access starts only after checkout.completed/payment fulfillment; never before payment.
  const params = new URLSearchParams({
    mode: 'payment',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    success_url: addQuery(successUrl, { checkout: 'success', product: product.id }),
    cancel_url: cancelUrl.toString(),
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
  const idempotencyKey = c.req.header('Idempotency-Key')?.trim()
  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': idempotencyKey || `kompilot:one-time:${auth.userId}:${product.id}`.slice(0, 255),
    },
    body: params.toString(),
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) return c.json({ error: 'Checkout creation failed' }, 502)
  const session = await response.json() as { url?: string }
  await patchUserMeta(blink, auth.userId, {
    legal_consent_at: consentAt,
    legal_consent_version: consent.cgvVersion,
    legal_consent_log: JSON.stringify({ cgvVersion: consent.cgvVersion, acceptedAt: consentAt, productId: product.id, cgvAccepted: true, retractionWaived: true }),
  })
  return c.json({ url: session.url, productId: product.id, pilotEndAt: null, renews: false })
})
