/**
 * VAT / Tax routes
 *   POST   /api/billing/vat/validate — VIES VAT validation + Stripe tax_id attach
 *   GET    /api/billing/vat          — Return current VAT info from user metadata
 *   DELETE /api/billing/vat          — Remove VAT number (Stripe + metadata)
 */
import { Hono } from 'hono';
import type { Env } from '../../lib/types';
import { getBlink, getUserMeta, patchUserMeta } from '../../lib/stripeHelpers';

export const router = new Hono();

// ── EU country codes (for reverse-charge logic) ───────────────────────────────
const EU_COUNTRIES = new Set([
  'AT','BE','BG','CY','CZ','DE','DK','EE','ES','FI','FR','GR','HR',
  'HU','IE','IT','LT','LU','LV','MT','NL','PL','PT','RO','SE','SI','SK',
]);

// Kompilot domiciliation country — adjust if not FR
const HOME_COUNTRY = 'FR';

// ── VAT number validation (VIES proxy) ───────────────────────────────────────
//
// POST /api/billing/vat/validate
// Body: { vatNumber: string, countryCode?: string }
// Returns: { valid, vatNumber, name?, address?, countryCode, reverseCharge, stripeVerified? }

router.post('/api/billing/vat/validate', async (c) => {
  const env       = c.env as unknown as Env;
  const rawEnv    = c.env as any;
  const blink     = getBlink(env);
  const stripeKey = rawEnv.STRIPE_SECRET_KEY as string | undefined;

  // 1. Auth
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  // 2. Parse body
  const body = await c.req.json<{ vatNumber?: string; countryCode?: string }>();
  const rawVat = (body?.vatNumber ?? '').toUpperCase().replace(/\s/g, '');
  if (!rawVat || rawVat.length < 4) {
    return c.json({ valid: false, error: 'Numéro TVA trop court' }, 400);
  }

  // Extract 2-letter country prefix (e.g. "FR12345678901" → "FR")
  const countryCode = body?.countryCode?.toUpperCase() || rawVat.slice(0, 2);
  const vatNumber   = rawVat.slice(2); // digits only after prefix

  let viesValid  = false;
  let viesName   = '';
  let viesAddr   = '';

  // 3. Try VIES REST API (EC official endpoint)
  try {
    const viesRes = await fetch(
      `https://ec.europa.eu/taxation_customs/vies/rest-api/ms/${countryCode}/vat/${encodeURIComponent(vatNumber)}`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (viesRes.ok) {
      const viesData = await viesRes.json() as any;
      viesValid = viesData.isValid === true;
      viesName  = viesData.name  ?? '';
      viesAddr  = viesData.address ?? '';
    }
  } catch (e) {
    console.warn('[vat/validate] VIES unavailable, falling back to format check:', e);
    // Soft fallback: accept structurally correct EU VAT numbers
    // Format: 2-letter country + 8–12 alphanumeric chars
    viesValid = EU_COUNTRIES.has(countryCode) && /^[A-Z0-9]{8,12}$/.test(vatNumber);
  }

  // 4. Determine if reverse-charge applies:
  //    - VAT is valid
  //    - Company is in EU
  //    - Company is NOT in our home country (FR)
  const isEU         = EU_COUNTRIES.has(countryCode);
  const reverseCharge = viesValid && isEU && countryCode !== HOME_COUNTRY;

  // 5. Optionally attach Stripe tax_id to the customer (if stripe key available)
  let stripeVerified = false;
  if (stripeKey && viesValid) {
    try {
      const meta       = await getUserMeta(blink, auth.userId);
      const customerId = meta.stripe_customer_id as string | undefined;
      if (customerId) {
        // Remove existing EU VAT tax IDs before adding fresh one
        const existingRes = await fetch(
          `https://api.stripe.com/v1/customers/${customerId}/tax_ids`,
          { headers: { Authorization: `Bearer ${stripeKey}` } },
        );
        if (existingRes.ok) {
          const existing = await existingRes.json() as { data: { id: string; type: string }[] };
          for (const tid of (existing.data || [])) {
            if (tid.type === 'eu_vat') {
              await fetch(`https://api.stripe.com/v1/customers/${customerId}/tax_ids/${tid.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${stripeKey}` },
              });
            }
          }
        }
        // Add new tax ID
        const addRes = await fetch(
          `https://api.stripe.com/v1/customers/${customerId}/tax_ids`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ type: 'eu_vat', value: rawVat }).toString(),
          },
        );
        stripeVerified = addRes.ok;

        // Persist VAT number in user metadata for invoice use
        await patchUserMeta(blink, auth.userId, {
          vat_number:      rawVat,
          vat_country:     countryCode,
          reverse_charge:  reverseCharge,
          vat_verified_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error('[vat/validate] Stripe tax_id error:', e);
    }
  } else if (viesValid) {
    // No Stripe configured — still persist VAT metadata
    await patchUserMeta(blink, auth.userId, {
      vat_number:      rawVat,
      vat_country:     countryCode,
      reverse_charge:  reverseCharge,
      vat_verified_at: new Date().toISOString(),
    });
  }

  return c.json({
    valid:         viesValid,
    vatNumber:     rawVat,
    countryCode,
    name:          viesName  || null,
    address:       viesAddr  || null,
    reverseCharge,
    stripeVerified,
    isEU,
    message: !viesValid
      ? 'Numéro TVA invalide ou non trouvé dans VIES'
      : reverseCharge
        ? 'Autoliquidation de TVA applicable (0 % pour vous)'
        : countryCode === HOME_COUNTRY
          ? 'TVA française (20 %) applicable'
          : 'TVA applicable selon la réglementation locale',
  });
});

// ── GET current VAT info ──────────────────────────────────────────────────────

router.get('/api/billing/vat', async (c) => {
  const env   = c.env as unknown as Env;
  const blink = getBlink(env);

  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const meta = await getUserMeta(blink, auth.userId);
  return c.json({
    vatNumber:     meta.vat_number     ?? null,
    vatCountry:    meta.vat_country    ?? null,
    reverseCharge: meta.reverse_charge ?? false,
    verifiedAt:    meta.vat_verified_at ?? null,
  });
});

// ── DELETE VAT number ─────────────────────────────────────────────────────────

router.delete('/api/billing/vat', async (c) => {
  const env       = c.env as unknown as Env;
  const rawEnv    = c.env as any;
  const blink     = getBlink(env);
  const stripeKey = rawEnv.STRIPE_SECRET_KEY as string | undefined;

  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  // Remove from Stripe
  if (stripeKey) {
    const meta       = await getUserMeta(blink, auth.userId);
    const customerId = meta.stripe_customer_id as string | undefined;
    if (customerId) {
      const listRes = await fetch(
        `https://api.stripe.com/v1/customers/${customerId}/tax_ids`,
        { headers: { Authorization: `Bearer ${stripeKey}` } },
      );
      if (listRes.ok) {
        const list = await listRes.json() as { data: { id: string; type: string }[] };
        for (const tid of (list.data || [])) {
          if (tid.type === 'eu_vat') {
            await fetch(`https://api.stripe.com/v1/customers/${customerId}/tax_ids/${tid.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${stripeKey}` },
            });
          }
        }
      }
    }
  }

  await patchUserMeta(blink, auth.userId, {
    vat_number:      null,
    vat_country:     null,
    reverse_charge:  false,
    vat_verified_at: null,
  });

  return c.json({ success: true });
});
