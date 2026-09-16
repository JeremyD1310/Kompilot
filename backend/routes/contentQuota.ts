import { Hono } from 'hono';
import type { Env } from '../lib/types';
import { CONTENT_PACKS, consumeContentQuota, ensureContentQuota, quotaView, releaseContentQuota } from '../lib/contentQuota';
import { getBlink } from '../lib/stripeHelpers';

export const router = new Hono<{ Bindings: Env }>();

async function authUser(c: any) {
  const blink = getBlink(c.env as Env);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  return auth.valid ? auth.userId : null;
}

router.get('/api/content-credits/status', async (c) => {
  const userId = await authUser(c);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const row = await ensureContentQuota(c.env as Env, userId);
    return c.json({ ...quotaView(row), packs: CONTENT_PACKS, stripeDeferred: false });
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Quota unavailable' }, 500);
  }
});

router.get('/api/content-credits/packs', (c) => c.json({ packs: CONTENT_PACKS, stripeDeferred: false }));

router.post('/api/content-credits/consume', async (c) => {
  const userId = await authUser(c);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json<{ amount?: number; action?: string }>().catch(() => ({}));
  try {
    const result = await consumeContentQuota(c.env as Env, userId, body.amount ?? 1, body.action ?? 'content_generation');
    if (!result.success) return c.json({ error: 'CONTENT_QUOTA_EXCEEDED', ...result }, 429);
    return c.json(result);
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Quota consumption failed' }, 500);
  }
});

router.post('/api/content-credits/release', async (c) => {
  const userId = await authUser(c);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json<{ amount?: number }>().catch(() => ({}));
  try {
    return c.json({ success: true, ...(await releaseContentQuota(c.env as Env, userId, body.amount ?? 1) ?? {}) });
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Quota release failed' }, 500);
  }
});

router.post('/api/content-credits/add', async (c) => {
  const userId = await authUser(c);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  return c.json({
    error: 'Les recharges de contenu ne créent plus de Checkout legacy.',
    code: 'LEGACY_CHECKOUT_DISABLED',
    canonicalEndpoint: '/api/billing/one-time-checkout',
  }, 410);
});