/**
 * LinkedIn OAuth Routes
 *
 * GET  /api/linkedin/oauth/connect    — Generate OAuth URL
 * GET  /api/linkedin/oauth/callback   — Handle OAuth callback, exchange code, store tokens
 * GET  /api/linkedin/oauth/status     — Check connection status
 * POST /api/linkedin/oauth/disconnect — Revoke connection
 */

import { requireBackendUrl, requireAppUrl, isBackendDependencyConfigError, backendDependencyUnavailable } from '../lib/blinkConfig';
import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import { createSecureTokenStore } from '../lib/secureTokenStore';
import { createOAuthState, readOAuthState } from '../lib/oauthState';
import { exchangeCodeForToken, getProfile } from '../lib/linkedinPublishingService';

async function verifyUserId(c: any): Promise<string | null> {
  const auth = await createClient({ projectId: requireBlinkProjectId(c.env), secretKey: c.env.BLINK_SECRET_KEY }).auth.verifyToken(c.req.header('Authorization'));
  return auth.valid ? auth.userId : null;
}
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

const LINKEDIN_SCOPES = 'openid profile email w_member_social';

// ── GET /api/linkedin/oauth/connect ──────────────────────────────────────────

router.get('/api/linkedin/oauth/connect', async (c) => {
  const userId = await verifyUserId(c);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const clientId = env.LINKEDIN_CLIENT_ID;
  const redirectUri = env.LINKEDIN_REDIRECT_URI || `${requireBackendUrl(env)}/api/linkedin/oauth/callback`;

  const clientSecret = env.LINKEDIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) return c.json({ error: 'LinkedIn credentials not configured' }, 500);

  const state = await createOAuthState(userId, clientSecret);
  const url = new URL('https://www.linkedin.com/oauth/v2/authorization');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', LINKEDIN_SCOPES);
  url.searchParams.set('state', state);

  return c.json({ url: url.toString() });
});

// ── GET /api/linkedin/oauth/callback ─────────────────────────────────────────

router.get('/api/linkedin/oauth/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const error = c.req.query('error');

  if (error) {
    const appUrl = requireAppUrl(c.env as any);
    return c.redirect(`${appUrl}/settings?linkedin_error=${encodeURIComponent(c.req.query('error_description') || error)}`);
  }

  if (!code || !state) return c.json({ error: 'Missing parameters' }, 400);

  const env = c.env as unknown as Env;
  const clientId = env.LINKEDIN_CLIENT_ID;
  const clientSecret = env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = env.LINKEDIN_REDIRECT_URI || `${requireBackendUrl(env)}/api/linkedin/oauth/callback`;

  if (!clientId || !clientSecret) return c.json({ error: 'LinkedIn credentials not configured' }, 500);

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
      provider: 'linkedin',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: new Date(Date.now() + tokens.expiresIn * 1000).toISOString(),
      scopes: tokens.scope.split(' '),
    });

    const appUrl = requireAppUrl(env);
    return c.redirect(`${appUrl}/settings?linkedin_connected=true`);
  } catch (err) {
    if (isBackendDependencyConfigError(err)) return c.json(backendDependencyUnavailable(err), 503);
    const appUrl = requireAppUrl(env);
    return c.redirect(`${appUrl}/settings?linkedin_error=${encodeURIComponent(err instanceof Error ? err.message : 'Token exchange failed')}`);
  }
});

// ── GET /api/linkedin/oauth/status ───────────────────────────────────────────

router.get('/api/linkedin/oauth/status', async (c) => {
  const userId = await verifyUserId(c);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const blink = createClient({
    projectId: requireBlinkProjectId(env),
    secretKey: env.BLINK_SECRET_KEY,
  });
  const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);
  const tokens = await store.getByUser(userId, 'linkedin');

  if (!tokens) return c.json({ connected: false });

  try {
    const decrypted = await store.decryptAccessToken(tokens.accessToken);
    const profile = await getProfile(decrypted);
    return c.json({
      connected: true,
      expiresAt: tokens.expiresAt,
      user: {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        picture: profile.picture,
      },
      profile: {
        sub: profile.sub,
        name: profile.name,
        email: profile.email,
        picture: profile.picture,
      },
    });
  } catch {
    return c.json({ connected: false, reason: 'Token expired or invalid' });
  }
});

// ── POST /api/linkedin/oauth/disconnect ──────────────────────────────────────

router.post('/api/linkedin/oauth/disconnect', async (c) => {
  const userId = await verifyUserId(c);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const blink = createClient({
    projectId: requireBlinkProjectId(env),
    secretKey: env.BLINK_SECRET_KEY,
  });
  const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);
  await store.revoke(userId, 'linkedin');
  return c.json({ success: true });
});
