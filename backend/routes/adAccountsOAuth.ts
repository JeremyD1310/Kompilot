import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import { createAdTenantStore, type AdProvider } from '../lib/adTenantStore';
import type { Env } from '../lib/types';
import { correlationId, safeError } from '../lib/operations';

export const router = new Hono<{ Bindings: Env }>();
const META_AUTHORIZE = 'https://www.facebook.com/v21.0/dialog/oauth';
const GOOGLE_AUTHORIZE = 'https://accounts.google.com/o/oauth2/v2/auth';
const META_SCOPES = ['ads_read', 'business_management'];
const GOOGLE_SCOPES = ['https://www.googleapis.com/auth/adwords'];

function envOf(c: any) { return c.env as Record<string, string>; }
function blinkOf(env: Record<string, string>) { return createClient({ projectId: env.BLINK_PROJECT_ID || 'presence-manager-saas-gbrhsehk', secretKey: env.BLINK_SECRET_KEY }); }
async function userIdOf(c: any) {
  const env = envOf(c); const auth = await blinkOf(env).auth.verifyToken(c.req.header('Authorization'));
  return auth.valid && auth.userId ? auth.userId : null;
}
function redirectUri(env: Record<string, string>) { return `${env.BACKEND_URL || 'https://gbrhsehk.backend.blink.new'}/api/auth/ad-accounts/callback`; }
function callbackTo(env: Record<string, string>) { return env.APP_URL || 'https://kompilot.fr'; }
function encode(value: unknown) { return btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, ''); }
function decode(value: string) { const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4); return JSON.parse(atob(padded)); }
async function stateFor(payload: Record<string, unknown>, secret: string) {
  const body = encode({ ...payload, exp: Date.now() + 10 * 60 * 1000, nonce: crypto.randomUUID() });
  return `${body}.${await signBody(body, secret)}`;
}

async function signBody(body: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function readState(value: string, secret: string) {
  const [body, signature] = value.split('.');
  if (!body || !signature || signature !== await signBody(body, secret)) throw new Error('OAuth state invalid');
  const result = decode(body) as { userId?: string; organizationId?: string; provider?: AdProvider; returnTo?: string; exp?: number; nonce?: string; correlationId?: string };
  if (!result.userId || !result.organizationId || !result.provider || !result.exp || result.exp < Date.now()) throw new Error('OAuth state expired');
  return result;
}

function safeReturn(value: string | undefined) { return value && value.startsWith('/') && !value.startsWith('//') ? value : '/settings?tab=connexions'; }

async function resolveTenant(c: any, userId: string) {
  const env = envOf(c);
  const blink = blinkOf(env);
  const requested = c.req.query('organizationId') || c.req.header('X-Organization-Id');
  if (!requested) return `personal_${userId}`;
  const members = await blink.db.table<any>('ad_organization_members').list({ where: { organizationId: requested, userId, status: 'active' }, limit: 1 });
  if (members.length === 0) throw new Error('Organisation non autorisée pour cet utilisateur.');
  return requested;
}

function stateHash(value: string) {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)).then(bytes => Array.from(new Uint8Array(bytes)).map(byte => byte.toString(16).padStart(2, '0')).join(''));
}

router.get('/api/auth/:provider/connect', async (c) => {
  const provider = c.req.param('provider') as AdProvider;
  if (!['meta', 'google_ads'].includes(provider)) return c.json({ error: 'Provider publicitaire inconnu.' }, 400);
  const userId = await userIdOf(c); if (!userId) return c.json({ error: 'Session expirée.' }, 401);
  const env = envOf(c); const secret = env.BLINK_SECRET_KEY; if (!secret) return c.json({ error: 'Configuration serveur incomplète.' }, 503);
  const organizationId = await resolveTenant(c, userId); const correlation = correlationId(c.req.raw); const state = await stateFor({ userId, organizationId, provider, returnTo: safeReturn(c.req.query('returnTo')), correlationId: correlation }, secret);
  await blinkOf(env).db.table<any>('ad_oauth_states').create({ id: `oauth_state_${crypto.randomUUID()}`, stateHash: await stateHash(state), userId, organizationId, provider, returnTo: safeReturn(c.req.query('returnTo')), correlationId: correlation, expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() });
  const url = new URL(provider === 'meta' ? META_AUTHORIZE : GOOGLE_AUTHORIZE);
  if (provider === 'meta') {
    if (!env.META_APP_ID) return c.json({ error: 'META_APP_ID non configuré.' }, 503);
    url.searchParams.set('client_id', env.META_APP_ID); url.searchParams.set('redirect_uri', redirectUri(env)); url.searchParams.set('scope', META_SCOPES.join(',')); url.searchParams.set('response_type', 'code');
  } else {
    if (!env.GOOGLE_CLIENT_ID) return c.json({ error: 'GOOGLE_CLIENT_ID non configuré.' }, 503);
    url.searchParams.set('client_id', env.GOOGLE_CLIENT_ID); url.searchParams.set('redirect_uri', redirectUri(env)); url.searchParams.set('scope', GOOGLE_SCOPES.join(' ')); url.searchParams.set('response_type', 'code'); url.searchParams.set('access_type', 'offline'); url.searchParams.set('prompt', 'consent');
  }
  url.searchParams.set('state', state);
  return c.json({ url: url.toString(), provider, organizationId });
});

router.get('/api/auth/ad-accounts/callback', async (c) => {
  const env = envOf(c); const state = c.req.query('state');
  try {
    if (!state) throw new Error('Paramètres OAuth manquants.');
    const blink = blinkOf(env);
    const context = await readState(state, env.BLINK_SECRET_KEY);
    const stateRows = await blink.db.table<any>('ad_oauth_states').list({ where: { stateHash: await stateHash(state), userId: context.userId, organizationId: context.organizationId, provider: context.provider }, limit: 1 });
    const stateRow = stateRows[0];
    if (!stateRow || stateRow.consumedAt || Date.parse(stateRow.expiresAt) <= Date.now()) throw new Error('OAuth state expired or already used.');
    await blink.db.table<any>('ad_oauth_states').update(stateRow.id, { consumedAt: new Date().toISOString() });
    const correlation = context.correlationId || stateRow.correlationId || crypto.randomUUID();
    const target = `${callbackTo(env)}${safeReturn(context.returnTo)}${context.returnTo?.includes('?') ? '&' : '?'}ad_provider=${context.provider}`;
    if (c.req.query('error') || !c.req.query('code')) return c.redirect(`${target}&ad_status=denied`);
    const body = new URLSearchParams({ code: c.req.query('code')!, client_id: context.provider === 'meta' ? env.META_APP_ID : env.GOOGLE_CLIENT_ID, client_secret: context.provider === 'meta' ? env.META_APP_SECRET : env.GOOGLE_CLIENT_SECRET, redirect_uri: redirectUri(env), grant_type: 'authorization_code' });
    const response = await fetch(context.provider === 'meta' ? 'https://graph.facebook.com/v21.0/oauth/access_token' : 'https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body, signal: AbortSignal.timeout(15_000) });
    const tokens = await response.json() as { access_token?: string; refresh_token?: string; expires_in?: number; error_description?: string };
    if (!response.ok || !tokens.access_token) throw new Error(tokens.error_description || 'Échange OAuth impossible.');
    if (!env.TOKEN_ENCRYPTION_KEY) throw new Error('TOKEN_ENCRYPTION_KEY non configurée.');
    const store = createAdTenantStore(blink, env.TOKEN_ENCRYPTION_KEY); const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3_600) * 1000).toISOString();
    await store.saveConnection({ userId: context.userId, organizationId: context.organizationId }, context.provider, tokens.access_token, tokens.refresh_token ?? '', expiresAt, context.provider === 'meta' ? META_SCOPES : GOOGLE_SCOPES);
    const discoveredAccounts = await discoverAccounts(store, context, tokens.access_token, context.provider, env);
    await store.event({ userId: context.userId, organizationId: context.organizationId }, context.provider, 'connected', 'Compte publicitaire connecté.', { correlationId: correlation, metadataJson: JSON.stringify({ accountDiscovery: 'completed', accountCount: discoveredAccounts }) });
    const runId = `sync_${crypto.randomUUID()}`;
    await blink.db.table<any>('ad_sync_runs').create({ id: runId, userId: context.userId, organizationId: context.organizationId, provider: context.provider, status: 'queued', requestedDays: 30, startedAt: new Date().toISOString(), attemptCount: 0, correlationId: correlation, updatedAt: new Date().toISOString() });
    try { await blink.queue.enqueue('ad-sync', { userId: context.userId, organizationId: context.organizationId, provider: context.provider, days: 30, runId, correlationId: correlation }, { queue: 'ad-sync', retries: 3, timeout: '2m' }); } catch (queueError) { await blink.db.table<any>('ad_sync_runs').update(runId, { status: 'failed', errorCode: 'queue_enqueue_failed', errorMessage: safeError(queueError), finishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); console.error('[Ad OAuth] initial sync enqueue failed', safeError(queueError)); }
    return c.redirect(`${target}&ad_status=connected`);
  } catch (error) {
    console.error('[Ad OAuth callback]', safeError(error));
    return c.redirect(`${callbackTo(env)}/settings?tab=connexions&ad_status=error&ad_error=oauth_exchange_failed`);
  }
});

router.get('/api/auth/ad-accounts/status', async (c) => {
  const userId = await userIdOf(c); if (!userId) return c.json({ error: 'Session expirée.' }, 401);
  const env = envOf(c); if (!env.TOKEN_ENCRYPTION_KEY) return c.json({ error: 'Configuration de chiffrement manquante.' }, 503);
  const ctx = { userId, organizationId: await resolveTenant(c, userId) }; const store = createAdTenantStore(blinkOf(env), env.TOKEN_ENCRYPTION_KEY);
  const [meta, google, accounts] = await Promise.all([store.getConnection(ctx, 'meta'), store.getConnection(ctx, 'google_ads'), store.listAccounts(ctx)]);
  return c.json({ organizationId: ctx.organizationId, providers: { meta: summarize(meta), google_ads: summarize(google) }, accounts: accounts.map((account: any) => ({ id: account.id, provider: account.provider, externalId: account.externalId, name: account.name, currency: account.currency, status: account.status, selected: Number(account.isSelected) > 0 })) });
});

router.post('/api/auth/ad-accounts/disconnect/:provider', async (c) => {
  const provider = c.req.param('provider') as AdProvider; if (!['meta', 'google_ads'].includes(provider)) return c.json({ error: 'Provider inconnu.' }, 400);
  const userId = await userIdOf(c); if (!userId) return c.json({ error: 'Session expirée.' }, 401); const env = envOf(c); if (!env.TOKEN_ENCRYPTION_KEY) return c.json({ error: 'Configuration de chiffrement manquante.' }, 503); const ctx = { userId, organizationId: await resolveTenant(c, userId) }; const store = createAdTenantStore(blinkOf(env), env.TOKEN_ENCRYPTION_KEY);
  const result = await store.disconnect(ctx, provider, 'user_requested', correlationId(c.req.raw)); return c.json({ success: true, externalRevocation: result.externalRevocation });
});

function summarize(connection: any) { return connection ? { connected: connection.status === 'active', status: connection.status, expiresAt: connection.tokenExpiresAt, lastSyncAt: connection.lastSyncAt, lastError: connection.lastError } : { connected: false, status: 'disconnected' }; }

async function discoverAccounts(store: ReturnType<typeof createAdTenantStore>, context: { userId: string; organizationId: string }, token: string, provider: AdProvider, env: Record<string, string>) {
  if (provider === 'meta') {
    let next: string | undefined = 'https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name,currency,account_status&limit=200';
    const connection = await store.getConnection(context, 'meta');
    let accountCount = 0;
    for (let page = 0; next && page < 100; page += 1) {
      const url = new URL(next); url.searchParams.set('access_token', token);
      const response = await fetch(url, { signal: AbortSignal.timeout(15_000) }); const data = await response.json() as any;
      if (!response.ok || data.error) throw new Error(data.error?.message || `Meta Ads HTTP ${response.status}`);
      for (const account of data.data ?? []) {
        await store.upsertAccount(context, connection?.id ?? '', { provider: 'meta', externalId: String(account.id).replace(/^act_/, ''), name: account.name || `Compte Meta ${account.id}`, currency: account.currency || 'EUR', externalStatus: String(account.account_status ?? '') });
        accountCount += 1;
      }
      next = data.paging?.next;
    }
    if (next) throw new Error('Meta account pagination limit reached');
    return accountCount;
  }
  if (!env.GADS_DEVELOPER_TOKEN) throw new Error('GADS_DEVELOPER_TOKEN non configuré.');
  const response = await fetch('https://googleads.googleapis.com/v23/customers:listAccessibleCustomers', { headers: { Authorization: `Bearer ${token}`, 'developer-token': env.GADS_DEVELOPER_TOKEN }, signal: AbortSignal.timeout(15_000) });
  const data = await response.json() as { resourceNames?: string[]; error?: { message?: string } };
  if (!response.ok || data.error) throw new Error(data.error?.message || `Google Ads HTTP ${response.status}`);
  const connection = await store.getConnection(context, 'google_ads');
  let accountCount = 0;
  for (const resource of data.resourceNames ?? []) { const externalId = resource.split('/').pop() || ''; await store.upsertAccount(context, connection?.id ?? '', { provider: 'google_ads', externalId, name: `Compte Google Ads ${externalId}` }); accountCount += 1; }
  return accountCount;
}
