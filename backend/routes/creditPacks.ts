/**
 * Legacy credit-pack endpoint. It remains as a compatibility route only and
 * cannot create Checkout sessions. Recharges use /api/billing/one-time-checkout.
 */
import { Hono } from 'hono';

export const router = new Hono();

router.post('/api/billing/credit-packs', (c) => c.json({
  error: 'Parcours de recharge obsolète. Utilisez /api/billing/one-time-checkout.',
  code: 'BILLING_MIGRATION_REQUIRED',
}, 410));
