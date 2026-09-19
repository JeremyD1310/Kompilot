/**
 * YouTube OAuth Routes — YouTube Data API v3
 *
 * Uses the same Google OAuth client as GBP (GOOGLE_BUSINESS_CLIENT_ID/SECRET).
 * YouTube tokens are stored under provider 'youtube'.
 *
 * GET  /api/youtube/oauth/connect    — Generate Google OAuth URL for YouTube scopes
 * GET  /api/youtube/oauth/callback   — Handle OAuth callback, exchange code, store tokens
 * GET  /api/youtube/oauth/status     — Check connection status + channel info
 * POST /api/youtube/oauth/disconnect — Revoke connection
 */

import { requireBackendUrl } from '../lib/blinkConfig';
import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import { createSecureTokenStore } from '../lib/secureTokenStore';
import { createOAuthState, readOAuthState } from '../lib/oauthState';
import { exchangeCodeForToken, getChannelInfo } from '../lib/youtubeService';

async function verifyUserId(c: any): Promise<string | null> {
  const auth = await createClient({ projectId: requireBlinkProjectId(c.env), secretKey: c.env.BLINK_SECRET_KEY }).auth.verifyToken(c.req.header('Authorization'));
  return auth.valid ? auth.userId : null;
}
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

const YOUTUBE_SCOPES = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly';

// ── GET /api/youtube/oauth/connect ──────────────────────────────────────────

router.get('/api/youtube/oauth/connect', async (c) => {
  const userId = await verifyUserId(c);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const clientId = (env as any).GOOGLE_BUSINESS_CLIENT_ID;
  const redirectUri = (env as any).YOUTUBE_REDIRECT_URI || `${(env as any).BACKEND_URL || requireBackendUrl(env)}/api/youtube/oauth/callback`;

  const clientSecret = (env as any).GOOGLE_BUSINESS_CLIENT_SECRET;
  if (!clientId || !clientSecret) return c.json({ error: 'Google credentials not configured' }, 500);

  const state = await createOAuthState(userId, clientSecret);
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', YOUTUBE_SCOPES);
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', state);

  return c.json({ url: url.toString() });
});

// ── GET /api/youtube/oauth/callback ─────────────────────────────────────────

router.get('/api/youtube/oauth/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const error = c.req.query('error');

  if (error) {
    const appUrl = (c.env as any).APP_URL || 'https://kompilot.fr';
    return c.redirect(`${appUrl}/settings?youtube_error=${encodeURIComponent(c.req.query('error_description') || error)}`);
  }

  if (!code || !state) return c.json({ error: 'Missing parameters' }, 400);

  const env = c.env as unknown as Env;
  const clientId = (env as any).GOOGLE_BUSINESS_CLIENT_ID;
  const clientSecret = (env as any).GOOGLE_BUSINESS_CLIENT_SECRET;
  const redirectUri = (env as any).YOUTUBE_REDIRECT_URI || `${(env as any).BACKEND_URL || requireBackendUrl(env)}/api/youtube/oauth/callback`;

  if (!clientId || !clientSecret) return c.json({ error: 'Google credentials not configured' }, 500);

  try {
    const userId = await readOAuthState(state, clientSecret);
    const tokens = await exchangeCodeForToken(code, clientId, clientSecret, redirectUri);

    const blink = createClient({
      projectId: requireBlinkProjectId(env),
      secretKey: env.BLINK_SECRET_KEY,
    });
    const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);

    await store.save({
      userId,
      provider: 'youtube',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: new Date(Date.now() + tokens.expiresIn * 1000).toISOString(),
      scopes: tokens.scope ? tokens.scope.split(' ') : YOUTUBE_SCOPES.split(' '),
    });

    const appUrl = (env as any).APP_URL || 'https://kompilot.fr';
    return c.redirect(`${appUrl}/settings?youtube_connected=true`);
  } catch (err) {
    const appUrl = (env as any).APP_URL || 'https://kompilot.fr';
    return c.redirect(`${appUrl}/settings?youtube_error=${encodeURIComponent(err instanceof Error ? err.message : 'Token exchange failed')}`);
  }
});

// ── GET /api/youtube/oauth/status ───────────────────────────────────────────

router.get('/api/youtube/oauth/status', async (c) => {
  const userId = await verifyUserId(c);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const blink = createClient({
    projectId: requireBlinkProjectId(env),
    secretKey: env.BLINK_SECRET_KEY,
  });
  const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);
  const tokens = await store.getByUser(userId, 'youtube');

  if (!tokens) return c.json({ connected: false });

  try {
    const decrypted = await store.decryptAccessToken(tokens.accessToken);
    const channel = await getChannelInfo(decrypted);
    return c.json({
      connected: true,
      expiresAt: tokens.expiresAt,
      channel: {
        channelId: channel.channelId,
        title: channel.title,
        thumbnailUrl: channel.thumbnailUrl,
        subscriberCount: channel.subscriberCount,
        videoCount: channel.videoCount,
      },
    });
  } catch {
    return c.json({ connected: false, reason: 'Token expired or invalid' });
  }
});

// ── POST /api/youtube/oauth/disconnect ──────────────────────────────────────

router.post('/api/youtube/oauth/disconnect', async (c) => {
  const userId = await verifyUserId(c);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const blink = createClient({
    projectId: requireBlinkProjectId(env),
    secretKey: env.BLINK_SECRET_KEY,
  });
  const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);
  await store.revoke(userId, 'youtube');

  return c.json({ success: true });
});
