/**
 * Billing router — main entry point
 *
 * Mounts all billing sub-routers under a single exported `router`.
 * Each sub-module owns a focused slice of the /api/billing/* namespace:
 *
 *   portal.ts   → POST /api/billing/portal
 *                 GET  /api/billing/status
 *
 *   checkout.ts → POST /api/billing/checkout
 *
 *   vat.ts      → POST   /api/billing/vat/validate
 *                 GET    /api/billing/vat
 *                 DELETE /api/billing/vat
 *
 *   invoices.ts → GET   /api/billing/invoices
 *                 GET   /api/billing/agency/status
 *                 PATCH /api/billing/agency/mode
 *                 GET   /api/billing/agency/sub-accounts
 *                 POST  /api/billing/agency/invoice-preview
 *
 *   refund.ts    → GET  /api/billing/refund-eligibility
 *                  POST /api/billing/process-refund
 *
 *   retention.ts → POST /api/billing/apply-retention-discount
 *
 *   seats.ts     → POST /api/billing/check-seats
 */
import { Hono } from 'hono';
import { router as portalRouter }    from './portal';
import { router as checkoutRouter }  from './checkout';
import { router as vatRouter }       from './vat';
import { router as invoicesRouter }  from './invoices';
import { router as refundRouter }    from './refund';
import { router as retentionRouter } from './retention';
import { router as seatsRouter }     from './seats';

export const router = new Hono();

router.route('/', portalRouter);
router.route('/', checkoutRouter);
router.route('/', vatRouter);
router.route('/', invoicesRouter);
router.route('/', refundRouter);
router.route('/', retentionRouter);
router.route('/', seatsRouter);
