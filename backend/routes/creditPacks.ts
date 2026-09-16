/**
 * Legacy credit-pack endpoint. It remains as a compatibility route only and
 * cannot create Checkout sessions. Recharges use /api/billing/one-time-checkout.
 */
import { Hono } from 'hono';

export const router = new Hono();

router.post('/api/billing/credit-packs', (c) => c.json({
  error: 'Ancien checkout désactivé. Utilisez /api/billing/one-time-checkout avec un produit canonique.',
  code: 'LEGACY_CHECKOUT_DISABLED',
  canonicalEndpoint: '/api/billing/one-time-checkout',
}, 410));
