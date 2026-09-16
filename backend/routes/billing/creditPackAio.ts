/**
 * Legacy AIO credit-pack endpoint. It remains only as a migration guard and
 * cannot create a Stripe Checkout session.
 */
import { Hono } from 'hono';

export const router = new Hono();

router.post('/api/billing/credit-pack-aio', (c) => c.json({
  error: 'Ancien checkout désactivé. Utilisez /api/billing/one-time-checkout avec un produit canonique.',
  code: 'LEGACY_CHECKOUT_DISABLED',
  canonicalEndpoint: '/api/billing/one-time-checkout',
}, 410));
