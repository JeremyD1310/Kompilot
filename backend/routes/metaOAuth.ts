/**
 * Meta OAuth 2.0 Flow Routes
 *
 * GET  /api/meta/oauth/connect      — Generate OAuth URL for redirect
 * GET  /api/meta/oauth/callback     — Handle OAuth callback, exchange code for token
 * GET  /api/meta/oauth/status       — Check if user has valid Meta connection
 * POST /api/meta/oauth/disconnect   — Revoke tokens and disconnect
 * GET  /api/meta/pages              — List user's Facebook Pages + linked IG accounts
 */

import { requireBackendUrl } from '../lib/blinkConfig';
import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import { getUserPages, exchangeForLongLivedToken, validateToken } from '../lib/metaPublishingService';
import {
  getMetaAccounts,
  getMetaConnection,
  decryptMetaUserToken,
  markMetaConnection,
  saveMetaConnection,
  setSelectedMetaAccounts,
  syncMetaAccounts,
} from '../lib/metaAccountStore';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

const GRAPH_OAUTH_URL = 'https://www.facebook.com/v21.0/dialog/oauth';
const META_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_read_user_content',
  'pages_manage_metadata',
  'pages_manage_posts',
  'instagram_basic',
  'instagram_content_publish',
  'instagram_manage_comments',
  'business_management',
  'public_profile',
];

function envOf(c: any): any { return c.env as any; }

function backendRedirect(env: any) {
  return env.META_REDIRECT_URI || `${env.BACKEND_URL || requireBackendUrl(env)}/api/meta/oauth/callback`;
}

function appRedirect(env: any, params = '') {
  return `${env.APP_URL || 'https://kompilot.fr'}/settings${params}`;
}

function toBase64Url(value: string) {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4);
  return atob(padded);
}

async function signState(payload: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return toBase64Url(String.fromCharCode(...new Uint8Array(signature)));
}

async function createState(userId: string, secret: string) {
  const payload = toBase64Url(JSON.stringify({ userId, ts: Date.now(), nonce: crypto.randomUUID() }));
  return `${payload}.${await signState(payload, secret)}`;
}

async function readState(state: string, secret: string) {
  const [payload, signature] = state.split('.');
  if (!payload || !signature || signature !== await signState(payload, secret)) throw new Error('Invalid OAuth state');
  const parsed = JSON.parse(fromBase64Url(payload)) as { userId?: string; ts?: number };
  if (!parsed.userId || !parsed.ts || Date.now() - parsed.ts > 10 * 60 * 1000) throw new Error('OAuth state expired');
  return parsed.userId;
}

async function requireUserId(c: any): Promise<string | null> {
  const env = envOf(c);
  const blink = createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  return auth.valid ? auth.userId : null;
}

function oauthUrl(env: any, state: string) {
  const url = new URL(GRAPH_OAUTH_URL);
  url.searchParams.set('client_id', env.META_APP_ID);
  url.searchParams.set('redirect_uri', backendRedirect(env));
  url.searchParams.set('scope', META_SCOPES.join(','));
  url.searchParams.set('state', state);
  url.searchParams.set('response_type', 'code');
  return url.toString();
}

function getBlink(env: any) {
  return createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });
}

function accountDto(account: any) {
  return {
    id: account.id,
    network: account.network,
    externalId: account.externalId,
    name: account.name,
    username: account.username,
    profilePictureUrl: account.profilePictureUrl,
    parentPageId: account.parentPageId,
    parentPageName: account.parentPageName,
    selected: Number(account.isSelected) > 0,
    status: account.status,
    lastError: account.lastError || '',
    lastSyncedAt: account.lastSyncedAt,
  };
}

function parseScopes(value: string) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function pagesDto(accounts: any[]) {
  const pages = accounts.filter((account) => account.network === 'facebook');
  const instagramByPage = new Map<string, any>();
  for (const account of accounts) {
    if (account.network === 'instagram' && account.parentPageId) instagramByPage.set(account.parentPageId, account);
  }
  return pages.map((page) => {
    const instagram = instagramByPage.get(page.externalId);
    return {
      id: page.externalId,
      name: page.name,
      category: '',
      instagram: instagram ? {
        id: instagram.externalId,
        name: instagram.name,
        username: instagram.username || instagram.name,
      } : null,
    };
  });
}

router.get('/api/meta/oauth/connect', async (c) => {
  const env = envOf(c);
  const userId = await requireUserId(c);
  if (!userId) return c.json({ error: 'Session expirée. Veuillez vous reconnecter.' }, 401);
  if (!env.META_APP_ID || !env.META_APP_SECRET) return c.json({ error: 'Les identifiants Meta ne sont pas configurés.' }, 500);
  return c.json({ url: oauthUrl(env, await createState(userId, env.META_APP_SECRET)), scopes: META_SCOPES });
});

router.get('/api/meta/oauth/callback', async (c) => {
  const env = envOf(c);
  const error = c.req.query('error');
  if (error) return c.redirect(appRedirect(env, `?meta_error=${encodeURIComponent(c.req.query('error_description') || error)}`));
  const code = c.req.query('code');
  const state = c.req.query('state');
  if (!code || !state) return c.json({ error: 'Paramètres OAuth manquants.' }, 400);
  if (!env.META_APP_ID || !env.META_APP_SECRET || !env.TOKEN_ENCRYPTION_KEY) return c.json({ error: 'Configuration Meta ou clé de chiffrement manquante.' }, 500);

  try {
    const userId = await readState(state, env.META_APP_SECRET);
    const redirectUri = backendRedirect(env);
    const tokenUrl = new URL('https://graph.facebook.com/v21.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', env.META_APP_ID);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('client_secret', env.META_APP_SECRET);
    tokenUrl.searchParams.set('code', code);
    const tokenController = new AbortController();
    const tokenTimeout = setTimeout(() => tokenController.abort(), 15_000);
    let tokenResponse: Response;
    try {
      tokenResponse = await fetch(tokenUrl.toString(), { signal: tokenController.signal });
    } finally {
      clearTimeout(tokenTimeout);
    }
    const tokenData = await tokenResponse.json() as { access_token?: string; expires_in?: number; error?: { message?: string } };
    if (!tokenResponse.ok || !tokenData.access_token) throw new Error(tokenData.error?.message || 'Échange du code Meta impossible.');

    const longLived = await exchangeForLongLivedToken(tokenData.access_token, env.META_APP_ID, env.META_APP_SECRET);
    const pages = await getUserPages(longLived.accessToken);
    const blink = getBlink(env);
    const expiresAt = new Date(Date.now() + longLived.expiresIn * 1000).toISOString();
    const connectionId = await saveMetaConnection(blink, { userId, accessToken: longLived.accessToken, expiresAt, scopes: META_SCOPES, encryptionKey: env.TOKEN_ENCRYPTION_KEY });
    await syncMetaAccounts(blink, { userId, connectionId, pages, encryptionKey: env.TOKEN_ENCRYPTION_KEY });
    return c.redirect(appRedirect(env, '?meta_connected=true'));
  } catch (err) {
    console.error('[Meta OAuth callback]', err);
    return c.redirect(appRedirect(env, `?meta_error=${encodeURIComponent(err instanceof Error ? err.message : 'Connexion Meta impossible.')}`));
  }
});

router.get('/api/meta/oauth/status', async (c) => {
  const env = envOf(c);
  const userId = await requireUserId(c);
  if (!userId) return c.json({ error: 'Session expirée. Veuillez vous reconnecter.' }, 401);
  if (!env.TOKEN_ENCRYPTION_KEY) return c.json({ error: 'Clé de chiffrement Meta manquante.' }, 500);
  const blink = getBlink(env);
  const connection = await getMetaConnection(blink, userId);
  const accounts = await getMetaAccounts(blink, userId);
  if (!connection) return c.json({ connected: false, status: 'disconnected', pages: [], accounts: [] });

  const token = await decryptMetaUserToken(blink, userId, env.TOKEN_ENCRYPTION_KEY);
  if (!token) {
    const dto = accounts.map((account) => ({ ...accountDto(account), status: 'sync_error' }));
    return c.json({ connected: true, status: 'token_error', expiresAt: connection.tokenExpiresAt, pages: pagesDto(accounts), accounts: dto });
  }
  if (connection.tokenExpiresAt && Date.parse(connection.tokenExpiresAt) <= Date.now()) {
    await markMetaConnection(blink, userId, { status: 'token_expired', lastError: 'Le token Meta a expiré. Reconnectez votre compte pour continuer.' });
    const dto = accounts.map((account) => ({ ...accountDto(account), status: 'token_expired' }));
    return c.json({ connected: true, status: 'token_expired', expiresAt: connection.tokenExpiresAt, pages: pagesDto(accounts), accounts: dto });
  }
  const validation = await validateToken(token.accessToken, env.META_APP_ID, env.META_APP_SECRET);
  if (!validation.valid) {
    await markMetaConnection(blink, userId, { status: 'token_expired', lastError: 'Le token Meta a expiré. Reconnectez votre compte pour continuer.' });
    const dto = accounts.map((account) => ({ ...accountDto(account), status: 'token_expired' }));
    return c.json({ connected: true, status: 'token_expired', expiresAt: connection.tokenExpiresAt, pages: pagesDto(accounts), accounts: dto });
  }
  return c.json({ connected: true, status: connection.status, expiresAt: connection.tokenExpiresAt, scopes: parseScopes(connection.scopes), pages: pagesDto(accounts), accounts: accounts.map(accountDto) });
});

router.get('/api/meta/pages', async (c) => {
  const env = envOf(c);
  const userId = await requireUserId(c);
  if (!userId) return c.json({ error: 'Session expirée. Veuillez vous reconnecter.' }, 401);
  const accounts = await getMetaAccounts(getBlink(env), userId);
  return c.json({ accounts: accounts.map(accountDto) });
});

router.post('/api/meta/accounts/select', async (c) => {
  const env = envOf(c);
  const userId = await requireUserId(c);
  if (!userId) return c.json({ error: 'Session expirée. Veuillez vous reconnecter.' }, 401);
  const body = await c.req.json().catch(() => ({})) as { accountIds?: string[] };
  const accountIds = Array.isArray(body.accountIds) ? body.accountIds.filter((id): id is string => typeof id === 'string') : [];
  const blink = getBlink(env);
  const owned = await getMetaAccounts(blink, userId);
  const ownedIds = new Set(owned.map((account) => account.id));
  await setSelectedMetaAccounts(blink, userId, accountIds.filter((id) => ownedIds.has(id)));
  return c.json({ success: true, accounts: (await getMetaAccounts(blink, userId)).map(accountDto) });
});

router.post('/api/meta/oauth/refresh', async (c) => {
  const env = envOf(c);
  const userId = await requireUserId(c);
  if (!userId) return c.json({ error: 'Session expirée. Veuillez vous reconnecter.' }, 401);
  if (!env.META_APP_ID || !env.META_APP_SECRET) return c.json({ error: 'Les identifiants Meta ne sont pas configurés.' }, 500);
  return c.json({ url: oauthUrl(env, await createState(userId, env.META_APP_SECRET)) });
});

router.delete('/api/meta/accounts/:accountId', async (c) => {
  const env = envOf(c);
  const userId = await requireUserId(c);
  if (!userId) return c.json({ error: 'Session expirée. Veuillez vous reconnecter.' }, 401);
  const blink = getBlink(env);
  const account = await blink.db.table<any>('meta_social_accounts').get(c.req.param('accountId'));
  if (!account || account.userId !== userId) return c.json({ error: 'Compte Meta introuvable.' }, 404);
  await blink.db.table<any>('meta_social_accounts').update(account.id, {
    isSelected: 0,
    status: 'available',
    lastError: '',
    updatedAt: new Date().toISOString(),
  });
  return c.json({ success: true, account: accountDto({ ...account, isSelected: 0, status: 'available', lastError: '' }) });
});

router.post('/api/meta/oauth/disconnect', async (c) => {
  const env = envOf(c);
  const userId = await requireUserId(c);
  if (!userId) return c.json({ error: 'Session expirée. Veuillez vous reconnecter.' }, 401);
  const blink = getBlink(env);
  const connection = await getMetaConnection(blink, userId);
  if (connection) {
    await blink.db.table<any>('meta_connections').update(connection.id, { status: 'revoked', lastError: '', updatedAt: new Date().toISOString() });
    const accounts = await getMetaAccounts(blink, userId);
    for (const account of accounts) await blink.db.table<any>('meta_social_accounts').update(account.id, { isSelected: 0, status: 'disconnected', updatedAt: new Date().toISOString() });
  }
  return c.json({ success: true });
});
