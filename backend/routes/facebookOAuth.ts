/**
 * Standalone Facebook OAuth Routes
 *
 * Uses the same Meta APP_ID/APP_SECRET but stores tokens as provider 'facebook'
 * for standalone Facebook Page publishing (independent from combined Meta flow).
 *
 * GET  /api/facebook/oauth/connect    — Generate OAuth URL with pages scopes
 * GET  /api/facebook/oauth/callback   — Exchange code, discover pages, store as 'facebook'
 * GET  /api/facebook/oauth/status     — Return connection status + pages
 * POST /api/facebook/oauth/disconnect — Revoke connection
 */

import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import { createSecureTokenStore } from '../lib/secureTokenStore';
import { createOAuthState, readOAuthState } from '../lib/oauthState';
import { exchangeForLongLivedToken, getUserPages, validateToken } from '../lib/metaPublishingService';

async function verifyUserId(c: any): Promise<string | null> {
  const auth = await createClient({ projectId: c.env.BLINK_PROJECT_ID || 'presence-manager-saas-gbrhsehk', secretKey: c.env.BLINK_SECRET_KEY }).auth.verifyToken(c.req.header('Authorization'));
  return auth.valid ? auth.userId : null;
}
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

const FACEBOOK_SCOPES = 'pages_manage_posts,pages_read_engagement,pages_show_list,pages_read_user_content';

// ── GET /api/facebook/oauth/connect ──────────────────────────────────────────

router.get('/api/facebook/oauth/connect', async (c) => {
  const userId = await verifyUserId(c);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const appId = (env as any).META_APP_ID;
  const redirectUri = (env as any).FACEBOOK_REDIRECT_URI || `${(env as any).BACKEND_URL || 'https://gbrhsehk.backend.blink.new'}/api/facebook/oauth/callback`;

  if (!appId) return c.json({ error: 'META_APP_ID not configured' }, 500);

  const appSecret = (env as any).META_APP_SECRET;
  if (!appSecret) return c.json({ error: 'META_APP_SECRET not configured' }, 500);
  const state = await createOAuthState(userId, appSecret);
  const url = new URL('https://www.facebook.com/v21.0/dialog/oauth');
  url.searchParams.set('client_id', appId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', FACEBOOK_SCOPES);
  url.searchParams.set('state', state);
  url.searchParams.set('response_type', 'code');

  return c.json({ url: url.toString(), scopes: FACEBOOK_SCOPES.split(',') });
});

// ── GET /api/facebook/oauth/callback ─────────────────────────────────────────

router.get('/api/facebook/oauth/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const error = c.req.query('error');

  if (error) {
    const appUrl = (c.env as any).APP_URL || 'https://kompilot.fr';
    return c.redirect(`${appUrl}/settings?facebook_error=${encodeURIComponent(c.req.query('error_description') || error)}`);
  }

  if (!code || !state) return c.json({ error: 'Missing parameters' }, 400);

  const env = c.env as unknown as Env;
  const appId = (env as any).META_APP_ID;
  const appSecret = (env as any).META_APP_SECRET;
  const redirectUri = (env as any).FACEBOOK_REDIRECT_URI || `${(env as any).BACKEND_URL || 'https://gbrhsehk.backend.blink.new'}/api/facebook/oauth/callback`;

  if (!appId || !appSecret) return c.json({ error: 'Meta credentials not configured' }, 500);

  try {
    const userId = await readOAuthState(state, appSecret);
    // Exchange short-lived code for access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
    );
    if (!tokenRes.ok) return c.json({ error: 'Token exchange failed' }, 400);
    const tokenData = await tokenRes.json() as { access_token: string; expires_in: number };

    // Exchange for long-lived token
    const longLived = await exchangeForLongLivedToken(tokenData.access_token, appId, appSecret);

    // Validate that the user can access at least the Pages endpoint before storing the token.
    await getUserPages(longLived.accessToken);

    // Store tokens with provider 'facebook'
    const blink = createClient({ projectId: env.BLINK_PROJECT_ID || 'presence-manager-saas-gbrhsehk', secretKey: env.BLINK_SECRET_KEY });
    const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);
    await store.save({
      userId,
      provider: 'facebook',
      accessToken: longLived.accessToken,
      expiresAt: new Date(Date.now() + longLived.expiresIn * 1000).toISOString(),
      scopes: FACEBOOK_SCOPES.split(','),
    });

    const appUrl = (env as any).APP_URL || 'https://kompilot.fr';
    return c.redirect(`${appUrl}/settings?facebook_connected=true`);
  } catch (err) {
    return c.json({ error: 'OAuth flow failed', details: err instanceof Error ? err.message : 'Unknown' }, 500);
  }
});

// ── GET /api/facebook/oauth/status ───────────────────────────────────────────

router.get('/api/facebook/oauth/status', async (c) => {
  const userId = await verifyUserId(c);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const blink = createClient({ projectId: env.BLINK_PROJECT_ID || 'presence-manager-saas-gbrhsehk', secretKey: env.BLINK_SECRET_KEY });
  const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);
  const tokens = await store.getByUser(userId, 'facebook');

  if (!tokens) return c.json({ connected: false, pages: [] });

  try {
    const decrypted = await store.decryptAccessToken(tokens.accessToken);
    const validation = await validateToken(decrypted);
    if (!validation.valid) return c.json({ connected: false, reason: 'Token expired', pages: [] });

    const pages = await getUserPages(decrypted);
    return c.json({
      connected: true,
      expiresAt: tokens.expiresAt,
      pages: pages.map((p: MetaPage) => ({
        id: p.id,
        name: p.name,
        category: p.category,
      })),
    });
  } catch {
    return c.json({ connected: true, expiresAt: tokens.expiresAt, pages: [] });
  }
});

// ── POST /api/facebook/oauth/disconnect ──────────────────────────────────────

router.post('/api/facebook/oauth/disconnect', async (c) => {
  const userId = await verifyUserId(c);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const blink = createClient({ projectId: env.BLINK_PROJECT_ID || 'presence-manager-saas-gbrhsehk', secretKey: env.BLINK_SECRET_KEY });
  const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);
  await store.revoke(userId, 'facebook');

  return c.json({ success: true });
});
