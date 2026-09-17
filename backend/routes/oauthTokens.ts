/**
 * OAuth token management routes.
 *
 * POST /api/oauth/save-token    — Store encrypted OAuth tokens
 * POST /api/oauth/revoke-token  — Revoke stored tokens
 * GET  /api/oauth/status/:provider — Check if user has active tokens
 *
 * Uses secureTokenStore for AES-256-GCM encryption of tokens at rest.
 */

import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import { createSecureTokenStore } from '../lib/secureTokenStore';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

// ── Auth helper ──────────────────────────────────────────────────────────────

function getUserId(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const payload = authHeader.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.sub ?? decoded.user_id ?? null;
  } catch {
    return null;
  }
}

// ── POST /api/oauth/save-token ───────────────────────────────────────────────

router.post('/api/oauth/save-token', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const encryptionKey = (env as any).TOKEN_ENCRYPTION_KEY as string | undefined;

  let body: {
    provider?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: string;
    scopes?: string[];
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  if (!body.provider || !body.accessToken || !body.expiresAt) {
    return c.json({ error: 'provider, accessToken, and expiresAt are required' }, 400);
  }

  const validProviders = ['meta', 'google', 'instagram', 'facebook', 'tiktok'];
  if (!validProviders.includes(body.provider)) {
    return c.json({ error: `Invalid provider. Allowed: ${validProviders.join(', ')}` }, 400);
  }

  try {
    const blink = createClient({
      projectId: requireBlinkProjectId(env),
      secretKey: env.BLINK_SECRET_KEY,
    });

    const store = createSecureTokenStore(blink, encryptionKey);
    const tokenId = await store.save({
      userId,
      provider: body.provider,
      accessToken: body.accessToken,
      refreshToken: body.refreshToken,
      expiresAt: body.expiresAt,
      scopes: body.scopes,
    });

    return c.json({
      success: true,
      tokenId,
      encrypted: !!encryptionKey,
      message: encryptionKey
        ? 'Token stored with AES-256-GCM encryption.'
        : 'Token stored in plaintext (no encryption key configured).',
    });
  } catch (err: any) {
    console.error('[OAuth] save-token error:', err.message);
    return c.json({ error: err.message ?? 'Failed to save token' }, 500);
  }
});

// ── POST /api/oauth/revoke-token ─────────────────────────────────────────────

router.post('/api/oauth/revoke-token', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const encryptionKey = (env as any).TOKEN_ENCRYPTION_KEY as string | undefined;

  let body: { provider?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  if (!body.provider) {
    return c.json({ error: 'provider is required' }, 400);
  }

  try {
    const blink = createClient({
      projectId: requireBlinkProjectId(env),
      secretKey: env.BLINK_SECRET_KEY,
    });

    const store = createSecureTokenStore(blink, encryptionKey);
    await store.revoke(userId, body.provider);

    return c.json({ success: true, message: `Token for ${body.provider} revoked.` });
  } catch (err: any) {
    console.error('[OAuth] revoke-token error:', err.message);
    return c.json({ error: err.message ?? 'Failed to revoke token' }, 500);
  }
});

// ── GET /api/oauth/status/:provider ──────────────────────────────────────────

router.get('/api/oauth/status/:provider', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const provider = c.req.param('provider');
  const env = c.env as unknown as Env;
  const encryptionKey = (env as any).TOKEN_ENCRYPTION_KEY as string | undefined;

  try {
    const blink = createClient({
      projectId: requireBlinkProjectId(env),
      secretKey: env.BLINK_SECRET_KEY,
    });

    const store = createSecureTokenStore(blink, encryptionKey);
    const token = await store.getByUser(userId, provider);

    if (!token) {
      return c.json({ connected: false, provider });
    }

    const isExpired = new Date(token.expiresAt) < new Date();

    return c.json({
      connected: token.status === 'active' && !isExpired,
      provider,
      status: token.status,
      expiresAt: token.expiresAt,
      isExpired,
      scopes: token.scopes,
    });
  } catch (err: any) {
    console.error('[OAuth] status error:', err.message);
    return c.json({ error: err.message ?? 'Failed to check status' }, 500);
  }
});

// ── POST /api/oauth/migrate-plaintext ────────────────────────────────────────
// Admin-only: encrypt existing plaintext tokens

router.post('/api/oauth/migrate-plaintext', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const encryptionKey = (env as any).TOKEN_ENCRYPTION_KEY as string | undefined;

  if (!encryptionKey) {
    return c.json({ error: 'No encryption key configured. Add TOKEN_ENCRYPTION_KEY to secrets.' }, 400);
  }

  try {
    const blink = createClient({
      projectId: requireBlinkProjectId(env),
      secretKey: env.BLINK_SECRET_KEY,
    });

    const store = createSecureTokenStore(blink, encryptionKey);
    const migrated = await store.migratePlaintext(100);

    return c.json({
      success: true,
      migrated,
      message: `${migrated} tokens migrated from plaintext to encrypted.`,
    });
  } catch (err: any) {
    console.error('[OAuth] migrate error:', err.message);
    return c.json({ error: err.message ?? 'Migration failed' }, 500);
  }
});
