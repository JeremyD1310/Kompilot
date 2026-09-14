/**
 * Instagram OAuth Routes — Standalone Instagram Business integration
 *
 * Uses Meta Graph API but stores tokens separately as provider 'instagram'
 * for standalone Instagram channel publishing.
 *
 * GET  /api/instagram/oauth/connect    — Generate OAuth URL (instagram_basic + content_publish)
 * GET  /api/instagram/oauth/callback   — Handle callback, discover IG accounts, store tokens
 * GET  /api/instagram/oauth/status     — Check connection status + IG account info
 * POST /api/instagram/oauth/disconnect — Revoke connection
 */

import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import { createSecureTokenStore } from '../lib/secureTokenStore';
import { createOAuthState, readOAuthState } from '../lib/oauthState';
import { exchangeForLongLivedToken, getUserPages } from '../lib/metaPublishingService';

async function verifyUserId(c: any): Promise<string | null> {
  const auth = await createClient({ projectId: c.env.BLINK_PROJECT_ID || 'presence-manager-saas-gbrhsehk', secretKey: c.env.BLINK_SECRET_KEY }).auth.verifyToken(c.req.header('Authorization'));
  return auth.valid ? auth.userId : null;
}
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

const IG_SCOPES = 'instagram_basic,instagram_content_publish,instagram_manage_comments,pages_show_list,pages_read_engagement,pages_read_user_content';

// ── GET /api/instagram/oauth/connect ─────────────────────────────────────────

router.get('/api/instagram/oauth/connect', async (c) => {
  const userId = await verifyUserId(c);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const appId = (env as any).META_APP_ID;
  const redirectUri = (env as any).INSTAGRAM_REDIRECT_URI || `${(env as any).BACKEND_URL || 'https://gbrhsehk.backend.blink.new'}/api/instagram/oauth/callback`;

  if (!appId) return c.json({ error: 'META_APP_ID not configured — required for Instagram API' }, 500);

  const appSecret = (env as any).META_APP_SECRET;
  if (!appSecret) return c.json({ error: 'META_APP_SECRET not configured' }, 500);
  const state = await createOAuthState(userId, appSecret);
  const url = new URL('https://www.facebook.com/v21.0/dialog/oauth');
  url.searchParams.set('client_id', appId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', IG_SCOPES);
  url.searchParams.set('state', state);
  url.searchParams.set('response_type', 'code');

  return c.json({ url: url.toString() });
});

// ── GET /api/instagram/oauth/callback ────────────────────────────────────────

router.get('/api/instagram/oauth/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const error = c.req.query('error');

  if (error) return c.redirect(`${(c.env as any).APP_URL || '/settings'}?instagram_error=${encodeURIComponent(error)}`);
  if (!code || !state) return c.json({ error: 'Missing parameters' }, 400);

  const env = c.env as unknown as Env;
  const appId = (env as any).META_APP_ID;
  const appSecret = (env as any).META_APP_SECRET;
  const redirectUri = (env as any).INSTAGRAM_REDIRECT_URI || `${(env as any).BACKEND_URL || 'https://gbrhsehk.backend.blink.new'}/api/instagram/oauth/callback`;

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

    // Validate that the user can access Pages and linked Instagram Business accounts.
    await getUserPages(longLived.accessToken);

    // Store tokens with provider 'instagram'
    const blink = createClient({ projectId: env.BLINK_PROJECT_ID || 'presence-manager-saas-gbrhsehk', secretKey: env.BLINK_SECRET_KEY });
    const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);
    await store.save({
      userId,
      provider: 'instagram',
      accessToken: longLived.accessToken,
      expiresAt: new Date(Date.now() + longLived.expiresIn * 1000).toISOString(),
      scopes: IG_SCOPES.split(','),
    });

    const appUrl = (env as any).APP_URL || 'https://kompilot.fr';
    return c.redirect(`${appUrl}/settings?instagram_connected=true`);
  } catch (err) {
    return c.json({ error: 'OAuth flow failed', details: err instanceof Error ? err.message : 'Unknown' }, 500);
  }
});

// ── GET /api/instagram/oauth/status ──────────────────────────────────────────

router.get('/api/instagram/oauth/status', async (c) => {
  const userId = await verifyUserId(c);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const blink = createClient({ projectId: env.BLINK_PROJECT_ID || 'presence-manager-saas-gbrhsehk', secretKey: env.BLINK_SECRET_KEY });
  const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);
  const tokens = await store.getByUser(userId, 'instagram');

  if (!tokens) return c.json({ connected: false, accounts: [] });

  try {
    const decrypted = await store.decryptAccessToken(tokens.accessToken);
    const pages = await getUserPages(decrypted);
    const accounts = pages
      .filter((p: MetaPage) => p.instagram_business_account)
      .map((p: MetaPage) => ({
        pageId: p.id,
        pageName: p.name,
        igAccountId: p.instagram_business_account!.id,
        igUsername: p.instagram_business_account!.username || p.instagram_business_account!.name,
        igName: p.instagram_business_account!.name,
      }));

    return c.json({
      connected: true,
      expiresAt: tokens.expiresAt,
      accounts,
      primaryAccount: accounts[0] || null,
    });
  } catch {
    return c.json({ connected: false, reason: 'Token expired or invalid', accounts: [] });
  }
});

// ── POST /api/instagram/oauth/disconnect ─────────────────────────────────────

router.post('/api/instagram/oauth/disconnect', async (c) => {
  const userId = await verifyUserId(c);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const blink = createClient({ projectId: env.BLINK_PROJECT_ID || 'presence-manager-saas-gbrhsehk', secretKey: env.BLINK_SECRET_KEY });
  const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);
  await store.revoke(userId, 'instagram');

  return c.json({ success: true });
});
