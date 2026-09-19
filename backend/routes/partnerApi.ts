/**
 * partnerApi.ts — Public Partner API for B2B customers
 *
 * POST   /api/partner/keys                — generate a new API key
 * GET    /api/partner/keys                 — list user's API keys (prefix only)
 * DELETE /api/partner/keys/:id             — revoke an API key
 * GET    /api/partner/v1/establishments     — list establishments (partner auth)
 * GET    /api/partner/v1/posts             — list scheduled posts (partner auth)
 * GET    /api/partner/v1/analytics          — analytics summary (partner auth)
 */
import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

function getBlink(env: Env) {
  return createClient({
    projectId: requireBlinkProjectId(env),
    secretKey: env.BLINK_SECRET_KEY,
  });
}

interface PartnerApiKey {
  id: string;
  userId: string;
  keyName: string;
  apiKeyHash: string;
  apiKeyPrefix: string;
  scopes: string;
  rateLimitPerMinute: number;
  totalRequests: number;
  lastUsedAt: string;
  expiresAt: string;
  isActive: number;
  createdAt: string;
}

// Simple in-memory rate limiter per key
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

async function authenticatePartnerKey(
  c: any,
  env: Env
): Promise<{ userId: string; keyRecord: PartnerApiKey } | { rateLimited: true } | null> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const providedKey = authHeader.slice(7);
  const prefix = providedKey.substring(0, 10);

  const blink = getBlink(env);
  const keyTable = blink.db.table<PartnerApiKey>('partner_api_keys');
  const keys = await keyTable.list({
    where: { apiKeyPrefix: prefix, isActive: "1" },
    limit: 5,
  });

  for (const k of keys) {
    // Simple SHA-256 comparison
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(providedKey));
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (hashHex === k.apiKeyHash) {
      if (k.expiresAt && new Date(k.expiresAt) < new Date()) {
        return null;
      }
      // Rate limit check
      const rlKey = `partner:${k.id}`;
      const now = Date.now();
      const rl = rateLimitMap.get(rlKey);
      if (rl && now < rl.resetAt && rl.count >= k.rateLimitPerMinute) {
        return { rateLimited: true };
      }
      if (!rl || now >= rl.resetAt) {
        rateLimitMap.set(rlKey, { count: 1, resetAt: now + 60000 });
      } else {
        rl.count++;
      }

      // Update last_used
      try {
        await keyTable.update(k.id, {
          totalRequests: Number(k.totalRequests) + 1,
          lastUsedAt: new Date().toISOString(),
        });
      } catch {}

      return { userId: k.userId, keyRecord: k };
    }
  }
  return null;
}

// ── POST /api/partner/keys ───────────────────────────────────────────────────

router.post('/api/partner/keys', async (c) => {
  try {
    const blink = getBlink(c.env as any);
    const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
    if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);
    const userId = auth.userId;

    const body = await c.req.json();
    const { keyName = 'Default', scopes = ['read'] } = body;

    const rawKey = `kp_${crypto.randomUUID().replace(/-/g, '')}`;
    const prefix = rawKey.substring(0, 10);

    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(rawKey));
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const id = `pak_${Date.now()}_${crypto.randomUUID().substring(0, 6)}`;

    const keyTable = blink.db.table<PartnerApiKey>('partner_api_keys');

    await keyTable.create({
      id,
      userId,
      keyName,
      apiKeyHash: hashHex,
      apiKeyPrefix: prefix,
      scopes: JSON.stringify(scopes),
      rateLimitPerMinute: 60,
    });

    return c.json({
      id,
      keyName,
      apiKey: rawKey, // Only shown once!
      prefix,
      scopes,
      createdAt: new Date().toISOString(),
    }, 201);
  } catch (e: any) {
    console.error('[PartnerApi] Create key error:', e.message);
    return c.json({ error: e.message }, 500);
  }
});

// ── GET /api/partner/keys ────────────────────────────────────────────────────

router.get('/api/partner/keys', async (c) => {
  try {
    const blink = getBlink(c.env as any);
    const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
    if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);
    const userId = auth.userId;

    const keyTable = blink.db.table<PartnerApiKey>('partner_api_keys');
    const keys = await keyTable.list({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return c.json({
      keys: keys.map(k => ({
        id: k.id,
        keyName: k.keyName,
        prefix: k.apiKeyPrefix,
        scopes: JSON.parse(k.scopes || '["read"]'),
        totalRequests: Number(k.totalRequests),
        lastUsedAt: k.lastUsedAt,
        expiresAt: k.expiresAt,
        isActive: Number(k.isActive) === 1,
        createdAt: k.createdAt,
      })),
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ── DELETE /api/partner/keys/:id ─────────────────────────────────────────────

router.delete('/api/partner/keys/:id', async (c) => {
  try {
    const blink = getBlink(c.env as any);
    const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
    if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);
    const userId = auth.userId;

    const keyId = c.req.param('id');

    const keyTable = blink.db.table<PartnerApiKey>('partner_api_keys');
    const keys = await keyTable.list({ where: { id: keyId, userId }, limit: 1 });

    if (keys.length === 0) {
      return c.json({ error: 'Key not found' }, 404);
    }

    await keyTable.update(keyId, { isActive: 0 });
    return c.json({ success: true, message: 'API key revoked' });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ── GET /api/v1/partner/establishments ──────────────────────────────────────

router.get('/api/v1/partner/establishments', async (c) => {
  const auth = await authenticatePartnerKey(c, c.env as any);
  if (!auth) return c.json({ error: 'Invalid or missing API key' }, 401);
  if ('rateLimited' in auth) return c.json({ error: 'Rate limit exceeded' }, 429, { 'Retry-After': '60' });
  if (!JSON.parse(auth.keyRecord.scopes || '["read"]').includes('read')) return c.json({ error: 'Insufficient scope' }, 403);

  try {
    const blink = getBlink(c.env as any);
    const estTable = blink.db.table<any>('establishments');
    const rows = await estTable.list({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
    });

    return c.json({
      data: rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        activity: r.activity,
        city: r.city,
        website: r.website,
        createdAt: r.createdAt,
      })),
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ── GET /api/partner/v1/posts ────────────────────────────────────────────────

router.get('/api/partner/v1/posts', async (c) => {
  const auth = await authenticatePartnerKey(c, c.env as any);
  if (!auth) return c.json({ error: 'Invalid or missing API key' }, 401);
  if ('rateLimited' in auth) return c.json({ error: 'Rate limit exceeded' }, 429, { 'Retry-After': '60' });
  if (!JSON.parse(auth.keyRecord.scopes || '["read"]').includes('read')) return c.json({ error: 'Insufficient scope' }, 403);

  try {
    const blink = getBlink(c.env as any);
    const postTable = blink.db.table<any>('scheduled_posts');
    const limit = Math.min(Number(c.req.query('limit') || '50'), 100);

    const rows = await postTable.list({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
      limit,
    });

    return c.json({
      data: rows.map((r: any) => ({
        id: r.id,
        textContent: r.textContent,
        status: r.status,
        channels: r.channels,
        scheduledAt: r.scheduledAt,
        createdAt: r.createdAt,
      })),
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ── GET /api/partner/v1/analytics ────────────────────────────────────────────

router.get('/api/v1/partner/analytics', async (c) => {
  const auth = await authenticatePartnerKey(c, c.env as any);
  if (!auth) return c.json({ error: 'Invalid or missing API key' }, 401);
  if ('rateLimited' in auth) return c.json({ error: 'Rate limit exceeded' }, 429, { 'Retry-After': '60' });
  if (!JSON.parse(auth.keyRecord.scopes || '["read"]').includes('read')) return c.json({ error: 'Insufficient scope' }, 403);

  try {
    const blink = getBlink(c.env as any);
    const dailyTable = blink.db.table<any>('daily_analytics');
    const days = Math.min(Number(c.req.query('days') || '30'), 90);

    const rows = await dailyTable.list({
      where: { userId: auth.userId },
      orderBy: { snapshotDate: 'desc' },
      limit: days,
    });

    return c.json({
      data: rows.map((r: any) => ({
        date: r.snapshotDate,
        geoScore: Number(r.geoScore),
        unhandledReviews: Number(r.unhandledReviews),
        postsPublished: Number(r.postsPublished),
        smsSent: Number(r.smsSent),
        localVisibility: Number(r.localVisibility),
      })),
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});