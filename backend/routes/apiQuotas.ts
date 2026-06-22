/** API quota management — token-bucket rate limiting per plan */
import { Hono } from 'hono';
import type { Env } from '../lib/types';
import { getBlink, getUserMeta, patchUserMeta } from '../lib/stripeHelpers';

export const router = new Hono();

const PLAN_LIMITS: Record<string, { ai_tokens: number; search_credits: number }> = {
  free:        { ai_tokens: 50,   search_credits: 10  },
  pro:         { ai_tokens: 200,  search_credits: 50  },
  business:    { ai_tokens: 500,  search_credits: 150 },
  agency:      { ai_tokens: 2000, search_credits: 500 },
  agency_pro:  { ai_tokens: 5000, search_credits: 1000 },
};

// GET /api/quotas/status — get current quota for authenticated user
router.get('/api/quotas/status', async (c) => {
  const blink = getBlink(c.env as Env);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const meta = await getUserMeta(blink, auth.userId);
  const planId = (meta.plan_id as string) || 'free';
  const limits = PLAN_LIMITS[planId] || PLAN_LIMITS.free;

  // Check if reset needed (monthly)
  const resetAt = meta.quota_reset_at as string | undefined;
  const now = new Date();
  const needsReset = !resetAt || new Date(resetAt) < now;

  if (needsReset) {
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    await patchUserMeta(blink, auth.userId, {
      quota_ai_tokens_left: limits.ai_tokens,
      quota_search_credits_left: limits.search_credits,
      quota_reset_at: nextReset,
    });
    return c.json({
      planId,
      aiTokensLeft: limits.ai_tokens,
      aiTokensTotal: limits.ai_tokens,
      searchCreditsLeft: limits.search_credits,
      searchCreditsTotal: limits.search_credits,
      resetAt: nextReset,
    });
  }

  return c.json({
    planId,
    aiTokensLeft: (meta.quota_ai_tokens_left as number) ?? limits.ai_tokens,
    aiTokensTotal: limits.ai_tokens,
    searchCreditsLeft: (meta.quota_search_credits_left as number) ?? limits.search_credits,
    searchCreditsTotal: limits.search_credits,
    resetAt,
  });
});

// POST /api/quotas/consume — deduct credits
router.post('/api/quotas/consume', async (c) => {
  const blink = getBlink(c.env as Env);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  let body: { type: 'ai_tokens' | 'search_credits'; amount?: number };
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  if (!body.type || !['ai_tokens', 'search_credits'].includes(body.type)) {
    return c.json({ error: 'Invalid type; must be ai_tokens or search_credits' }, 400);
  }

  const meta = await getUserMeta(blink, auth.userId);
  const planId = (meta.plan_id as string) || 'free';
  const limits = PLAN_LIMITS[planId] || PLAN_LIMITS.free;
  const amount = body.amount || 1;

  const field = body.type === 'ai_tokens' ? 'quota_ai_tokens_left' : 'quota_search_credits_left';
  const current = (meta[field] as number) ?? (body.type === 'ai_tokens' ? limits.ai_tokens : limits.search_credits);

  if (current < amount) {
    return c.json({
      success: false,
      error: 'QUOTA_EXCEEDED',
      remaining: current,
      planId,
      upgradeRequired: true,
    }, 429);
  }

  await patchUserMeta(blink, auth.userId, { [field]: current - amount });

  return c.json({ success: true, remaining: current - amount, consumed: amount });
});
