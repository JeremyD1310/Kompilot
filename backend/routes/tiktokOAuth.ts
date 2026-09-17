/**
 * TikTok OAuth Routes — Content Posting API v2
 *
 * GET  /api/tiktok/oauth/connect    — Generate TikTok OAuth URL
 * GET  /api/tiktok/oauth/callback   — Handle OAuth callback, exchange code, store tokens
 * GET  /api/tiktok/oauth/status     — Check connection status + creator info
 * POST /api/tiktok/oauth/disconnect — Revoke connection
 */

import { requireBackendUrl } from '../lib/blinkConfig';
import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import { createSecureTokenStore } from '../lib/secureTokenStore';
import { createOAuthState, readOAuthState } from '../lib/oauthState';
import { exchangeCodeForToken, getCreatorInfo } from '../lib/tiktokService';

async function verifyUserId(c: any): Promise<string | null> {
  const auth = await createClient({ projectId: requireBlinkProjectId(c.env), secretKey: c.env.BLINK_SECRET_KEY }).auth.verifyToken(c.req.header('Authorization'));
  return auth.valid ? auth.userId : null;
}
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

const TIKTOK_SCOPES = 'user.info.basic,video.upload,video.publish,message.list,message.send';

function normalizeTikTokScopes(value?: string) {
  return (value || TIKTOK_SCOPES).split(/[\s,]+/).filter(Boolean);
}

// ── GET /api/tiktok/oauth/connect ────────────────────────────────────────────

router.get('/api/tiktok/oauth/connect', async (c) => {
  const userId = await verifyUserId(c);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const clientKey = (env as any).TIKTOK_CLIENT_KEY;
  const redirectUri = (env as any).TIKTOK_REDIRECT_URI || `${(env as any).BACKEND_URL || requireBackendUrl(env)}/api/tiktok/oauth/callback`;

  const clientSecret = (env as any).TIKTOK_CLIENT_SECRET;
  if (!clientKey || !clientSecret) return c.json({ error: 'TikTok credentials not configured' }, 500);

  const state = await createOAuthState(userId, clientSecret);
  const url = new URL('https://www.tiktok.com/v2/auth/authorize/');
  url.searchParams.set('client_key', clientKey);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', TIKTOK_SCOPES);
  url.searchParams.set('state', state);

  return c.json({ url: url.toString() });
});

// ── GET /api/tiktok/oauth/callback ───────────────────────────────────────────

router.get('/api/tiktok/oauth/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const error = c.req.query('error');

  if (error) {
    const appUrl = (c.env as any).APP_URL || 'https://kompilot.fr';
    return c.redirect(`${appUrl}/settings?tiktok_error=${encodeURIComponent(c.req.query('error_description') || error)}`);
  }

  if (!code || !state) return c.json({ error: 'Missing parameters' }, 400);

  const env = c.env as unknown as Env;
  const clientKey = (env as any).TIKTOK_CLIENT_KEY;
  const clientSecret = (env as any).TIKTOK_CLIENT_SECRET;
  const redirectUri = (env as any).TIKTOK_REDIRECT_URI || `${(env as any).BACKEND_URL || requireBackendUrl(env)}/api/tiktok/oauth/callback`;

  if (!clientKey || !clientSecret) return c.json({ error: 'TikTok credentials not configured' }, 500);

  try {
    const userId = await readOAuthState(state, clientSecret);
    const tokens = await exchangeCodeForToken(code, clientKey, clientSecret, redirectUri);

    const blink = createClient({
      projectId: requireBlinkProjectId(env),
      secretKey: env.BLINK_SECRET_KEY,
    });
    const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);

    await store.save({
      userId,
      provider: 'tiktok',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: new Date(Date.now() + tokens.expiresIn * 1000).toISOString(),
      scopes: normalizeTikTokScopes(tokens.scope),
    });

    try {
      const creator = await getCreatorInfo(tokens.accessToken);
      await blink.db.table('tiktok_dm_accounts').upsert({
        id: `tiktok_${userId}`,
        userId,
        openId: creator.openId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch { /* creator lookup is best effort; OAuth remains valid */ }

    const appUrl = (env as any).APP_URL || 'https://kompilot.fr';
    return c.redirect(`${appUrl}/settings?tiktok_connected=true`);
  } catch (err) {
    const appUrl = (env as any).APP_URL || 'https://kompilot.fr';
    return c.redirect(`${appUrl}/settings?tiktok_error=${encodeURIComponent(err instanceof Error ? err.message : 'Token exchange failed')}`);
  }
});

// ── GET /api/tiktok/oauth/status ─────────────────────────────────────────────

router.get('/api/tiktok/oauth/status', async (c) => {
  const userId = await verifyUserId(c);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const blink = createClient({
    projectId: requireBlinkProjectId(env),
    secretKey: env.BLINK_SECRET_KEY,
  });
  const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);
  const tokens = await store.getByUser(userId, 'tiktok');

  if (!tokens) return c.json({ connected: false });

  try {
    const decrypted = await store.decryptAccessToken(tokens.accessToken);
    const creator = await getCreatorInfo(decrypted);
    try {
      await blink.db.table('tiktok_dm_accounts').upsert({
        id: `tiktok_${userId}`,
        userId,
        openId: creator.openId,
        updatedAt: new Date().toISOString(),
      });
    } catch { /* mapping refresh is best effort */ }
    return c.json({
      connected: true,
      expiresAt: tokens.expiresAt,
      user: {
        displayName: creator.displayName,
        openId: creator.openId,
        avatarUrl: creator.avatarUrl,
      },
      creator: {
        displayName: creator.displayName,
        openId: creator.openId,
        avatarUrl: creator.avatarUrl,
      },
    });
  } catch {
    return c.json({ connected: false, reason: 'Token expired or invalid' });
  }
});

// ── POST /api/tiktok/oauth/disconnect ────────────────────────────────────────

router.post('/api/tiktok/oauth/disconnect', async (c) => {
  const userId = await verifyUserId(c);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const blink = createClient({
    projectId: requireBlinkProjectId(env),
    secretKey: env.BLINK_SECRET_KEY,
  });
  const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);
  await store.revoke(userId, 'tiktok');

  return c.json({ success: true });
});
