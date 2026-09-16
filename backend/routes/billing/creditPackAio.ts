/**
 * Legacy AIO credit-pack endpoint. It remains only as a migration guard and
 * cannot create a Stripe Checkout session.
 */
import { Hono } from 'hono';

export const router = new Hono();

router.post('/api/billing/credit-pack-aio', (c) => c.json({
  error: 'Pack AIO retiré. Utilisez une recharge IA canonique via /api/billing/one-time-checkout.',
  code: 'BILLING_MIGRATION_REQUIRED',
}, 410));
