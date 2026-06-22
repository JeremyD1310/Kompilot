/**
 * Invoices & Agency billing routes
 *   GET   /api/billing/invoices                 — Fetch Stripe invoices for the current user
 *   GET   /api/billing/agency/status            — Agency billing mode + sub-account count
 *   PATCH /api/billing/agency/mode              — Update agency billing mode
 *   GET   /api/billing/agency/sub-accounts      — Per-establishment consumption breakdown
 *   POST  /api/billing/agency/invoice-preview   — Consolidated invoice preview for agency
 */
import { Hono } from 'hono';
import type { Env } from '../../lib/types';
import { getBlink, getUserMeta, patchUserMeta } from '../../lib/stripeHelpers';

export const router = new Hono();

// Kompilot domiciliation country — must match vat.ts
const HOME_COUNTRY = 'FR';

// Currency by country (ISO 4217)
const COUNTRY_CURRENCY: Record<string, string> = {
  FR:'EUR',BE:'EUR',DE:'EUR',ES:'EUR',IT:'EUR',NL:'EUR',LU:'EUR',
  GB:'GBP',CH:'CHF',CA:'CAD',US:'USD',AU:'AUD',
};

// ── Invoices list ─────────────────────────────────────────────────────────────

router.get('/api/billing/invoices', async (c) => {
  const env       = c.env as unknown as Env;
  const rawEnv    = c.env as any;
  const blink     = getBlink(env);
  const stripeKey = rawEnv.STRIPE_SECRET_KEY as string | undefined;

  // 1. Auth
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  // 2. Stripe configured?
  if (!stripeKey) {
    return c.json({ error: 'Stripe not configured', code: 'NO_STRIPE_KEY' }, 503);
  }

  // 3. Get customer ID
  const meta       = await getUserMeta(blink, auth.userId);
  const customerId = meta.stripe_customer_id as string | undefined;
  if (!customerId) {
    return c.json({ invoices: [], hasMore: false });
  }

  // 4. Fetch invoices from Stripe
  const url = `https://api.stripe.com/v1/invoices?customer=${encodeURIComponent(customerId)}&limit=24&expand[]=data.charge`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error('[billing/invoices] Stripe error:', detail);
    return c.json({ error: 'Failed to fetch invoices', detail }, 502);
  }

  const data = await res.json() as { data: any[]; has_more: boolean };

  const invoices = (data.data || []).map((inv: any) => ({
    id:                 inv.id,
    number:             inv.number,
    status:             inv.status,
    amount_paid:        inv.amount_paid,
    currency:           inv.currency,
    created:            inv.created,
    invoice_pdf:        inv.invoice_pdf,
    hosted_invoice_url: inv.hosted_invoice_url,
    description:        inv.description,
    lines:              inv.lines,
  }));

  return c.json({ invoices, hasMore: data.has_more ?? false });
});

// ── Agency billing status ──────────────────────────────────────────────────────

router.get('/api/billing/agency/status', async (c) => {
  const env   = c.env as unknown as Env;
  const blink = getBlink(env);

  // 1. Auth
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  // 2. Read agency metadata
  const meta             = await getUserMeta(blink, auth.userId);
  const billingMode      = (meta.agency_billing_mode as string) || 'centralized';
  const stripeConnectId  = (meta.agency_stripe_connect_id as string) || null;

  // 3. Count sub-accounts (users with role=agency_client whose metadata.agency_owner_id === this user)
  let subAccountCount = 0;
  try {
    const allClients = await blink.db.users.list({ where: { role: 'agency_client' }, limit: 1000 });
    subAccountCount = (allClients as any[]).filter((u: any) => {
      if (!u.metadata) return false;
      try {
        const m = JSON.parse(u.metadata);
        return m.agency_owner_id === auth.userId;
      } catch {
        return false;
      }
    }).length;
  } catch (e) {
    console.error('[billing/agency/status] sub-account count error:', e);
  }

  return c.json({
    billingMode:      billingMode as 'centralized' | 'connected',
    stripeConnectId,
    subAccountCount,
  });
});

// ── Agency billing mode update ────────────────────────────────────────────────

router.patch('/api/billing/agency/mode', async (c) => {
  const env   = c.env as unknown as Env;
  const blink = getBlink(env);

  // 1. Auth
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  // 2. Parse + validate body
  const body = await c.req.json<{ billingMode?: string }>();
  const { billingMode } = body || {};

  if (billingMode !== 'centralized' && billingMode !== 'connected') {
    return c.json({
      error: 'Invalid billingMode — must be "centralized" or "connected"',
    }, 400);
  }

  // 3. Persist
  await patchUserMeta(blink, auth.userId, { agency_billing_mode: billingMode });

  return c.json({ success: true, billingMode });
});

// ── Agency sub-accounts consumption ───────────────────────────────────────────

router.get('/api/billing/agency/sub-accounts', async (c) => {
  const env   = c.env as unknown as Env;
  const blink = getBlink(env);

  // 1. Auth
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  // 2. Fetch all establishments and filter in JS (JSON metadata not queryable)
  let allEstablishments: any[] = [];
  try {
    allEstablishments = (await blink.db.establishments.list({ limit: 200 })) as any[];
  } catch (e) {
    console.error('[billing/agency/sub-accounts] establishments fetch error:', e);
    return c.json({ error: 'Failed to fetch sub-accounts' }, 500);
  }

  const ownedEstablishments = allEstablishments.filter((est: any) => {
    // ownership: check est.user_id matches agency's sub-accounts
    // We also accept establishments whose metadata.agency_owner_id equals this user
    if (est.user_id === auth.userId) return false; // skip own primary establishment
    try {
      const m = est.metadata ? JSON.parse(est.metadata) : {};
      return m.agency_owner_id === auth.userId;
    } catch {
      return false;
    }
  });

  // 3. Build per-establishment line items
  const now              = new Date();
  const billingPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const subAccounts = ownedEstablishments.map((est: any) => ({
    clientName:       est.name,
    establishmentId:  est.id,
    sector:           est.activity || 'unknown',
    creditsUsed:      est.ai_credits_used   ?? 0,
    creditsLimit:     est.ai_credits_limit  ?? 50,
    lastActivity:     est.updated_at        || est.created_at || null,
    status:           (est.ai_credits_used ?? 0) >= (est.ai_credits_limit ?? 50) ? 'quota_reached' : 'active',
  }));

  const totalCreditsUsed  = subAccounts.reduce((sum, s) => sum + s.creditsUsed, 0);
  const totalSubAccounts  = subAccounts.length;

  return c.json({
    subAccounts,
    totalCreditsUsed,
    totalSubAccounts,
    billingPeriodStart,
  });
});

// ── Agency invoice preview ────────────────────────────────────────────────────

router.post('/api/billing/agency/invoice-preview', async (c) => {
  const env   = c.env as unknown as Env;
  const blink = getBlink(env);

  // 1. Auth
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  // 2. Gather agency context
  const meta = await getUserMeta(blink, auth.userId);

  // Agency display name: prefer metadata.agency_name, fall back to user record display_name
  let agencyName = (meta.agency_name as string) || 'Your Agency';
  try {
    const userRows = await blink.db.users.list({ where: { id: auth.userId }, limit: 1 });
    const user     = userRows[0] as any;
    if (!meta.agency_name && user?.display_name) agencyName = user.display_name;
  } catch { /* noop */ }

  // 3. Count sub-accounts owned by this agency
  let subAccountCount = 0;
  try {
    const allClients = await blink.db.users.list({ where: { role: 'agency_client' }, limit: 1000 });
    subAccountCount = (allClients as any[]).filter((u: any) => {
      if (!u.metadata) return false;
      try { return JSON.parse(u.metadata).agency_owner_id === auth.userId; } catch { return false; }
    }).length;
  } catch { /* noop */ }

  // 4. Compute pricing (fixed plan price per sub-account: 49 EUR/mo)
  const UNIT_PRICE_EUR = 49;
  const now            = new Date();
  const periodLabel    = `${now.toLocaleString('fr-FR', { month: 'long' })} ${now.getFullYear()}`;

  // Determine country and currency for this agency
  const vatCountry = meta.vat_country as string | undefined;
  const countryCode = vatCountry || HOME_COUNTRY; // Default to HOME_COUNTRY if no VAT country set
  const currency = COUNTRY_CURRENCY[countryCode] || 'EUR'; // Default to EUR

  // Check for reverse-charge (autoliquidation)
  const reverseCharge = meta.reverse_charge as boolean || false;

  const lineItems = [
    {
      description: `Licences Kompilot — ${subAccountCount} sous-compte${subAccountCount !== 1 ? 's' : ''}`,
      quantity:    subAccountCount,
      unitPrice:   UNIT_PRICE_EUR,
      total:       subAccountCount * UNIT_PRICE_EUR,
    },
  ];

  const subtotal  = lineItems.reduce((s, l) => s + l.total, 0);
  const tvaRate   = reverseCharge ? 0 : 0.20; // 20% VAT if not reverse-charge
  const tva       = Math.round(subtotal * tvaRate * 100) / 100;
  const total     = Math.round((subtotal + tva) * 100) / 100;

  return c.json({
    agencyName,
    period:    periodLabel,
    lineItems,
    subtotal,
    tvaRate,
    tva,
    total,
    currency,
  });
});
