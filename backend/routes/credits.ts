/**
 * Credits management routes
 *
 *   GET  /api/credits/balance   — current credit balance + plan info
 *   GET  /api/credits/history   — paginated credit transaction history
 *   POST /api/credits/consume   — deduct credits for an AI action
 *   POST /api/credits/refund    — refund credits for a prior transaction
 */

import { Hono } from 'hono';
import type { Env } from '../lib/types';
import { getBlink } from '../lib/stripeHelpers';
import { AI_CREDIT_COSTS } from '../../shared/pricingCatalog';
import { consumeCredits, refundCredits, getCurrentBalance, getPlanInitialCredits, CREDIT_COSTS, type CreditTransaction } from '../lib/creditService';

export const router = new Hono();

async function auth(c: any) {
  const blink = getBlink(c.env as Env);
  const result = await blink.auth.verifyToken(c.req.header('Authorization'));
  return result.valid ? { blink, userId: result.userId } : null;
}

router.get('/api/credits/balance', async (c) => {
  const session = await auth(c); if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const { blink, userId } = session;
  const initial = await getPlanInitialCredits(blink, userId);
  const raw = await getCurrentBalance(blink, userId);
  const balance = raw < 0 ? initial : raw;
  const monthlyQuota = initial;
  const usedThisMonth = Math.max(0, initial - balance);
  const remaining = Math.max(0, balance);
  const percentage = monthlyQuota > 0 ? Math.round((remaining / monthlyQuota) * 100) : 0;

  return c.json({ balance, planName: 'Current plan', monthlyQuota, usedThisMonth, remaining, percentage });
});

router.get('/api/credits/history', async (c) => {
  const session = await auth(c); if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const limit = Math.min(Number(c.req.query('limit')) || 50, 200);
  const offset = Number(c.req.query('offset')) || 0;
  const transactions = await session.blink.db.table<CreditTransaction>('credit_transactions').list({ where: { userId: session.userId }, orderBy: { createdAt: 'desc' }, limit, offset });
  return c.json({ transactions, limit, offset, count: transactions.length });
});

router.post('/api/credits/consume', async (c) => {
  const session = await auth(c); if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json<{ actionType?: string; description?: string; referenceId?: string }>();
  if (!body.actionType) return c.json({ error: 'actionType is required' }, 400);
  const cost = CREDIT_COSTS[body.actionType] ?? AI_CREDIT_COSTS[body.actionType as keyof typeof AI_CREDIT_COSTS];
  if (!cost) return c.json({ error: `Unknown action type: ${body.actionType}`, validTypes: Object.keys(AI_CREDIT_COSTS) }, 400);
  const result = await consumeCredits(session.blink, session.userId, body.actionType, body.description || '', body.referenceId || '');
  if (!result.success) return c.json({ error: result.error || 'Insufficient credits', currentBalance: result.balanceAfter, required: result.cost }, 402);
  return c.json({ success: true, creditsCharged: result.cost, balanceAfter: result.balanceAfter });
});

router.post('/api/credits/refund', async (c) => {
  const session = await auth(c); if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json<{ transactionId?: string; reason?: string }>();
  if (!body.transactionId || !body.reason) return c.json({ error: 'transactionId and reason are required' }, 400);
  const original = await session.blink.db.table<CreditTransaction>('credit_transactions').get(body.transactionId);
  if (!original) return c.json({ error: 'Transaction not found' }, 404);
  if (original.userId !== session.userId) return c.json({ error: 'Transaction does not belong to this user' }, 403);
  const amount = Math.abs(Number(original.creditsDelta) || 0);
  if (!amount) return c.json({ error: 'Nothing to refund — zero delta' }, 400);
  await refundCredits(session.blink, session.userId, amount, body.reason, body.transactionId);
  const balance = await getCurrentBalance(session.blink, session.userId);
  return c.json({ success: true, refundAmount: amount, balanceAfter: balance });
});
