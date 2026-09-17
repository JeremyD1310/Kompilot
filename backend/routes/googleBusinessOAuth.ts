/**
 * Google Business Profile OAuth + API Routes
 *
 * GET  /api/gbp/oauth/connect    — Generate OAuth URL
 * GET  /api/gbp/oauth/callback   — Handle OAuth callback
 * GET  /api/gbp/oauth/status     — Check connection status
 * POST /api/gbp/oauth/disconnect — Revoke connection
 * GET  /api/gbp/locations        — List user's GBP locations
 * GET  /api/gbp/reviews/:locationId — Get reviews for a location
 * POST /api/gbp/reviews/:locationId/:reviewId/reply — Reply to a review
 * POST /api/gbp/posts/:locationId — Create a local post
 */

import { requireBackendUrl, requireAppUrl, isBackendDependencyConfigError, backendDependencyUnavailable } from '../lib/blinkConfig';
import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import { createSecureTokenStore } from '../lib/secureTokenStore';
import { createOAuthState, readOAuthState } from '../lib/oauthState';
import {
  exchangeCodeForToken, getAccounts, getLocations, getReviews,
  replyToReview, createLocalPost,
} from '../lib/googleBusinessService';

async function verifyUserId(c: any): Promise<string | null> {
  const auth = await createClient({ projectId: requireBlinkProjectId(c.env), secretKey: c.env.BLINK_SECRET_KEY }).auth.verifyToken(c.req.header('Authorization'));
  return auth.valid ? auth.userId : null;
}
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

const GBP_SCOPES = 'https://www.googleapis.com/auth/business.manage email profile openid';

// ── GET /api/gbp/oauth/connect ───────────────────────────────────────────────

router.get('/api/gbp/oauth/connect', async (c) => {
  const userId = await verifyUserId(c);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const env = c.env as unknown as Env;
  const clientId = (env as any).GOOGLE_BUSINESS_CLIENT_ID;
  const redirectUri = (env as any).GBP_REDIRECT_URI || `${requireBackendUrl(env)}/api/gbp/oauth/callback`;
  const clientSecret = (env as any).GOOGLE_BUSINESS_CLIENT_SECRET;
  if (!clientId || !clientSecret) return c.json({ error: 'Google Business credentials not configured' }, 500);
  const state = await createOAuthState(userId, clientSecret);
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', GBP_SCOPES);
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', state);
  return c.json({ url: url.toString() });
});

// ── GET /api/gbp/oauth/callback ──────────────────────────────────────────────

router.get('/api/gbp/oauth/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  if (!code || !state) return c.json({ error: 'Missing parameters' }, 400);
  const env = c.env as unknown as Env;
  const clientId = (env as any).GOOGLE_BUSINESS_CLIENT_ID;
  const clientSecret = (env as any).GOOGLE_BUSINESS_CLIENT_SECRET;
  const redirectUri = (env as any).GBP_REDIRECT_URI || `${requireBackendUrl(env)}/api/gbp/oauth/callback`;
  if (!clientId || !clientSecret) return c.json({ error: 'Google Business credentials not configured' }, 500);
  let userId: string;
  try {
    userId = await readOAuthState(state, clientSecret);
    const tokens = await exchangeCodeForToken(code, clientId, clientSecret, redirectUri);
    const blink = createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });
    const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);
    await store.save({ userId, provider: 'google_business', accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, expiresAt: new Date(Date.now() + tokens.expiresIn * 1000).toISOString(), scopes: ['business.manage'] });
    const appUrl = requireAppUrl(env);
    return c.redirect(`${appUrl}/settings?gbp_connected=true`);
  } catch (err) {
    if (isBackendDependencyConfigError(err)) return c.json(backendDependencyUnavailable(err), 503);
    return c.json({ error: 'Token exchange failed', details: err instanceof Error ? err.message : 'Unknown' }, 500);
  }
});

// ── GET /api/gbp/oauth/status ────────────────────────────────────────────────

router.get('/api/gbp/oauth/status', async (c) => {
  const userId = await verifyUserId(c);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const env = c.env as unknown as Env;
  const blink = createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });
  const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);
  const tokens = await store.getByUser(userId, 'google_business');
  if (!tokens) return c.json({ connected: false, accounts: [], locations: [] });
  try {
    const decrypted = await store.decryptAccessToken(tokens.accessToken);
    const accounts = await getAccounts(decrypted);
    return c.json({ connected: true, expiresAt: tokens.expiresAt, accounts });
  } catch {
    return c.json({ connected: false, reason: 'Token expired or invalid', accounts: [], locations: [] });
  }
});

// ── POST /api/gbp/oauth/disconnect ───────────────────────────────────────────

router.post('/api/gbp/oauth/disconnect', async (c) => {
  const userId = await verifyUserId(c);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const env = c.env as unknown as Env;
  const blink = createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });
  const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);
  await store.revoke(userId, 'google_business');
  return c.json({ success: true });
});

// ── GET /api/gbp/locations ───────────────────────────────────────────────────

router.get('/api/gbp/locations', async (c) => {
  const userId = await verifyUserId(c);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const env = c.env as unknown as Env;
  const blink = createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });
  const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);
  const tokens = await store.getByUser(userId, 'google_business');
  if (!tokens) return c.json({ error: 'Not connected' }, 400);
  const decrypted = await store.decryptAccessToken(tokens.accessToken);
  const accounts = await getAccounts(decrypted);
  const allLocations = [];
  for (const account of accounts) {
    const locs = await getLocations(decrypted, account.name);
    allLocations.push(...locs.map(l => ({ ...l, accountName: account.name })));
  }
  return c.json({ locations: allLocations });
});

// ── GET /api/gbp/reviews/:locationId ─────────────────────────────────────────

router.get('/api/gbp/reviews/:locationId', async (c) => {
  const userId = await verifyUserId(c);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const locationId = c.req.param('locationId');
  const env = c.env as unknown as Env;
  const blink = createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });
  const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);
  const tokens = await store.getByUser(userId, 'google_business');
  if (!tokens) return c.json({ error: 'Not connected' }, 400);
  const decrypted = await store.decryptAccessToken(tokens.accessToken);
  const reviews = await getReviews(decrypted, `locations/${locationId}`);
  return c.json({ reviews });
});

// ── POST /api/gbp/reviews/:locationId/:reviewId/reply ────────────────────────

router.post('/api/gbp/reviews/:locationId/:reviewId/reply', async (c) => {
  const userId = await verifyUserId(c);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const { locationId, reviewId } = c.req.param();
  const body = await c.req.json() as { replyText: string };
  if (!body.replyText) return c.json({ error: 'replyText is required' }, 400);
  const env = c.env as unknown as Env;
  const blink = createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });
  const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);
  const tokens = await store.getByUser(userId, 'google_business');
  if (!tokens) return c.json({ error: 'Not connected' }, 400);
  const decrypted = await store.decryptAccessToken(tokens.accessToken);
  await replyToReview(decrypted, `locations/${locationId}/reviews/${reviewId}`, body.replyText);
  return c.json({ success: true });
});

// ── POST /api/gbp/posts/:locationId ──────────────────────────────────────────

router.post('/api/gbp/posts/:locationId', async (c) => {
  const userId = await verifyUserId(c);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const locationId = c.req.param('locationId');
  const body = await c.req.json() as { summary: string; imageUrl?: string; callToAction?: { actionType: string; url: string } };
  if (!body.summary) return c.json({ error: 'summary is required' }, 400);
  const env = c.env as unknown as Env;
  const blink = createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });
  const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);
  const tokens = await store.getByUser(userId, 'google_business');
  if (!tokens) return c.json({ error: 'Not connected' }, 400);
  const decrypted = await store.decryptAccessToken(tokens.accessToken);
  const post = await createLocalPost(decrypted, `locations/${locationId}`, body.summary, body.imageUrl, body.callToAction);
  return c.json({ success: true, post });
});
