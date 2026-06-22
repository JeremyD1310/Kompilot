/**
 * Stripe Connect (Express) routes
 *
 *   POST /api/stripe-connect/create-account  — create/fetch Connect Express account
 *   POST /api/stripe-connect/account-link    — generate onboarding Account Link URL
 *   GET  /api/stripe-connect/status          — read account capabilities & requirements
 */
import { Hono } from 'hono';
import type { Env } from '../lib/types';
import { getBlink, getUserMeta, patchUserMeta } from '../lib/stripeHelpers';

export const router = new Hono();

// ── Shared Stripe fetch helper ────────────────────────────────────────────────

type StripeMethod = 'GET' | 'POST' | 'DELETE';

async function stripeRequest<T = unknown>(
  stripeKey: string,
  method: StripeMethod,
  path: string,
  params?: URLSearchParams,
): Promise<{ ok: boolean; status: number; data: T | null; raw: string }> {
  const url = `https://api.stripe.com/v1${path}`;
  const headers: Record<string, string> = {
    Authorization: `Basic ${btoa(stripeKey + ':')}`,
  };
  if (method !== 'GET' && params) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
  }

  const res = await fetch(url, {
    method,
    headers,
    body: method !== 'GET' && params ? params.toString() : undefined,
    signal: AbortSignal.timeout(10_000),
  });

  const raw = await res.text();
  let data: T | null = null;
  try { data = JSON.parse(raw) as T; } catch { /* noop */ }

  return { ok: res.ok, status: res.status, data, raw };
}

// ── POST /api/stripe-connect/create-account ───────────────────────────────────
//
// Creates a Stripe Connect Express account for the authenticated user.
// Idempotent: returns existing account ID if already stored in user metadata.
// Returns: { accountId: string }

router.post('/api/stripe-connect/create-account', async (c) => {
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

  // 3. Idempotency — return existing account ID if present
  const meta = await getUserMeta(blink, auth.userId);
  const existingAccountId = meta.stripe_connect_account_id as string | undefined;
  if (existingAccountId) {
    return c.json({ accountId: existingAccountId });
  }

  // 4. Look up user email
  const usersResult = await blink.db.users.list({ where: { id: auth.userId }, limit: 1 });
  const user = (usersResult as any[])?.[0];
  if (!user) {
    return c.json({ error: 'User not found', code: 'USER_NOT_FOUND' }, 404);
  }
  const userEmail: string = user.email || '';

  // 5. Create Stripe Connect Express account
  const params = new URLSearchParams({
    type:                              'express',
    country:                           'FR',
    email:                             userEmail,
    'capabilities[transfers][requested]': 'true',
  });

  const { ok, data, raw } = await stripeRequest<{ id: string }>(
    stripeKey,
    'POST',
    '/accounts',
    params,
  );

  if (!ok || !data?.id) {
    console.error('[stripe-connect/create-account] Stripe error:', raw);
    return c.json({ error: 'Failed to create Connect account', detail: raw }, 502);
  }

  // 6. Persist account ID in user metadata
  try {
    await patchUserMeta(blink, auth.userId, {
      stripe_connect_account_id: data.id,
    });
  } catch (err) {
    // Non-fatal — account was created, metadata save failed
    console.error('[stripe-connect/create-account] Failed to save metadata (non-fatal):', err);
  }

  console.log(`[stripe-connect/create-account] Created account ${data.id} for user ${auth.userId}`);
  return c.json({ accountId: data.id });
});

// ── POST /api/stripe-connect/account-link ─────────────────────────────────────
//
// Generates a Stripe Account Link URL for Connect Express onboarding.
// Body (optional): { returnUrl?: string, refreshUrl?: string }
// Returns: { url: string }

router.post('/api/stripe-connect/account-link', async (c) => {
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

  // 3. Parse optional body
  let body: { returnUrl?: string; refreshUrl?: string } = {};
  try { body = await c.req.json(); } catch { /* no body — that's fine */ }

  const returnUrl  = body.returnUrl  || 'https://www.kompilot.com/settings?tab=no-show&connect=success';
  const refreshUrl = body.refreshUrl || 'https://www.kompilot.com/settings?tab=no-show&connect=refresh';

  // 4. Get accountId from metadata (create-account must be called first)
  const meta      = await getUserMeta(blink, auth.userId);
  const accountId = meta.stripe_connect_account_id as string | undefined;
  if (!accountId) {
    return c.json({
      error:  'No Stripe Connect account found',
      code:   'NO_CONNECT_ACCOUNT',
      detail: 'Call /api/stripe-connect/create-account first',
    }, 404);
  }

  // 5. Create Account Link
  const params = new URLSearchParams({
    account:     accountId,
    refresh_url: refreshUrl,
    return_url:  returnUrl,
    type:        'account_onboarding',
  });

  const { ok, data, raw } = await stripeRequest<{ url: string }>(
    stripeKey,
    'POST',
    '/account_links',
    params,
  );

  if (!ok || !data?.url) {
    console.error('[stripe-connect/account-link] Stripe error:', raw);
    return c.json({ error: 'Failed to create account link', detail: raw }, 502);
  }

  console.log(`[stripe-connect/account-link] Generated link for account ${accountId} / user ${auth.userId}`);
  return c.json({ url: data.url });
});

// ── GET /api/stripe-connect/status ────────────────────────────────────────────
//
// Returns the current Connect account capabilities and requirements.
// Returns: { connected, accountId?, payoutsEnabled, chargesEnabled, requiresAction, disabledReason, currentlyDue }

router.get('/api/stripe-connect/status', async (c) => {
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

  // 3. Check metadata for account ID
  const meta      = await getUserMeta(blink, auth.userId);
  const accountId = meta.stripe_connect_account_id as string | undefined;

  if (!accountId) {
    return c.json({
      connected:      false,
      payoutsEnabled: false,
      requiresAction: false,
    });
  }

  // 4. Fetch account details from Stripe
  const { ok, data, raw } = await stripeRequest<{
    id:               string;
    payouts_enabled:  boolean;
    charges_enabled:  boolean;
    requirements?: {
      disabled_reason: string | null;
      currently_due:   string[];
    };
  }>(stripeKey, 'GET', `/accounts/${accountId}`);

  if (!ok || !data) {
    console.error('[stripe-connect/status] Stripe error:', raw);
    return c.json({ error: 'Failed to fetch account status', detail: raw }, 502);
  }

  const payoutsEnabled = data.payouts_enabled  ?? false;
  const chargesEnabled = data.charges_enabled  ?? false;
  const disabledReason = data.requirements?.disabled_reason ?? null;
  const currentlyDue   = data.requirements?.currently_due  ?? [];
  const requiresAction = !payoutsEnabled && !!accountId;

  return c.json({
    connected:      true,
    accountId:      data.id,
    payoutsEnabled,
    chargesEnabled,
    requiresAction,
    disabledReason,
    currentlyDue,
  });
});
