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

type ResolvedTaxRate =
  | { rate: number; source: 'stripe_invoice'; invoiceId: string }
  | { rate: null; source: 'unavailable'; reason: string };

/**
 * Read back the VAT rate Stripe actually applied to this customer instead of assuming one.
 *
 * Stripe Tax is the only authority on the rate that is really charged (domestic FR 20 %,
 * intra-EU reverse charge 0 %, non-EU out of scope…), so the preview mirrors the most
 * recent finalized invoice that carries tax amounts. When no such invoice exists yet the
 * rate is reported as unavailable — a preview must never invent a rate, because the number
 * it shows is read as an accounting figure.
 */
async function resolveStripeTaxRate(
  stripeKey: string | undefined,
  customerId: string | undefined,
): Promise<ResolvedTaxRate> {
  if (!stripeKey)  return { rate: null, source: 'unavailable', reason: 'NO_STRIPE_KEY' };
  if (!customerId) return { rate: null, source: 'unavailable', reason: 'NO_STRIPE_CUSTOMER' };

  try {
    const query = new URLSearchParams({ customer: customerId, limit: '10' });
    const res = await fetch(`https://api.stripe.com/v1/invoices?${query}`, {
      headers: { Authorization: `Bearer ${stripeKey}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error('[billing/tax-rate] Stripe invoice lookup failed:', res.status, await res.text());
      return { rate: null, source: 'unavailable', reason: 'STRIPE_UNAVAILABLE' };
    }

    const payload = await res.json() as { data?: any[] };
    const invoice = (payload.data ?? []).find((inv: any) =>
      inv?.status && inv.status !== 'draft' && Array.isArray(inv.total_tax_amounts) && inv.total_tax_amounts.length > 0,
    );
    if (!invoice) return { rate: null, source: 'unavailable', reason: 'NO_TAXED_INVOICE' };

    const taxAmount = invoice.total_tax_amounts.reduce(
      (sum: number, entry: any) => sum + (Number(entry?.amount) || 0), 0,
    );
    const taxableBase = invoice.total_tax_amounts.reduce(
      (sum: number, entry: any) => sum + (Number(entry?.taxable_amount) || 0), 0,
    ) || Number(invoice.total_excluding_tax) || Number(invoice.subtotal) || 0;
    if (taxableBase <= 0) return { rate: null, source: 'unavailable', reason: 'NO_TAXABLE_BASE' };

    return {
      rate: Math.round((taxAmount / taxableBase) * 10_000) / 10_000,
      source: 'stripe_invoice',
      invoiceId: String(invoice.id),
    };
  } catch (err) {
    console.error('[billing/tax-rate] Stripe invoice lookup errored:', err);
    return { rate: null, source: 'unavailable', reason: 'STRIPE_UNAVAILABLE' };
  }
}

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

  // Tax figures are passed through from Stripe (never recomputed client-side) so the
  // HT / VAT / TTC breakdown always matches what was actually charged.
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
    subtotal:           inv.subtotal ?? null,
    total:              inv.total ?? null,
    total_excluding_tax: inv.total_excluding_tax ?? null,
    tax:                inv.tax ?? null,
    total_tax_amounts:  inv.total_tax_amounts ?? [],
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
  const env    = c.env as unknown as Env;
  const rawEnv = c.env as any;
  const blink  = getBlink(env);

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

  const lineItems = [
    {
      description: `Licences Kompilot — ${subAccountCount} sous-compte${subAccountCount !== 1 ? 's' : ''}`,
      quantity:    subAccountCount,
      unitPrice:   UNIT_PRICE_EUR,
      total:       subAccountCount * UNIT_PRICE_EUR,
    },
  ];

  const subtotal = lineItems.reduce((s, l) => s + l.total, 0);

  // The VAT rate is whatever Stripe Tax applied to this customer, not a hardcoded 20 %.
  // Reverse charge, non-EU customers and rate changes are therefore reflected
  // automatically; when Stripe has no taxed invoice yet, the preview says so instead of
  // displaying an amount that would not match the real charge.
  const resolvedTax = await resolveStripeTaxRate(
    rawEnv.STRIPE_SECRET_KEY as string | undefined,
    meta.stripe_customer_id as string | undefined,
  );
  const tvaRate = resolvedTax.rate;
  const tva     = tvaRate === null ? null : Math.round(subtotal * tvaRate * 100) / 100;
  const total   = tva === null ? null : Math.round((subtotal + tva) * 100) / 100;

  return c.json({
    agencyName,
    period:    periodLabel,
    lineItems,
    subtotal,
    tvaRate,
    tva,
    total,
    currency,
    taxSource:            resolvedTax.source,
    taxSourceInvoiceId:   resolvedTax.source === 'stripe_invoice' ? resolvedTax.invoiceId : null,
    taxUnavailableReason: resolvedTax.source === 'unavailable'    ? resolvedTax.reason    : null,
    reverseCharge:        tvaRate === null ? null : tvaRate === 0,
  });
});
