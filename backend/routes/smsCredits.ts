import { Hono } from 'hono';
import type { Env } from '../lib/types';
import { getBlink } from '../lib/stripeHelpers';

export const router = new Hono();

async function session(c: any) {
  const blink = getBlink(c.env as Env);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  return auth.valid ? { blink, userId: auth.userId } : null;
}

async function ensureCredits(blink: any, userId: string) {
  const table = blink.db.table<any>('sms_credits');
  const rows = await table.list({ where: { userId }, limit: 1 });
  if (rows[0]) return rows[0];
  // The first authenticated backend access owns the welcome grant. The stable id
  // makes retries harmless and prevents client-side welcome-credit fabrication.
  try {
    return await table.create({ id: `sms:${userId}`, userId, balance: 50, totalUsed: 0, totalGiven: 50, planMonthlyQuota: 50, welcomePackGranted: 1 });
  } catch {
    return (await table.list({ where: { userId }, limit: 1 }))[0];
  }
}

router.get('/api/sms-credits/status', async (c) => {
  const s = await session(c); if (!s) return c.json({ error: 'Unauthorized' }, 401);
  const row = await ensureCredits(s.blink, s.userId);
  return c.json({ balance: Number(row?.balance) || 0, totalUsed: Number(row?.totalUsed) || 0, totalGiven: Number(row?.totalGiven) || 0, planMonthlyQuota: Number(row?.planMonthlyQuota) || 0, welcomePackGranted: Number(row?.welcomePackGranted) > 0 });
});

router.post('/api/sms-credits/consume', async (c) => {
  const s = await session(c); if (!s) return c.json({ error: 'Unauthorized' }, 401);
  const row = await ensureCredits(s.blink, s.userId);
  const body = await c.req.json<{ amount?: number; referenceId?: string }>();
  const amount = Math.floor(Number(body.amount));
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10000) return c.json({ error: 'amount must be a positive integer' }, 400);
  const reference = (body.referenceId || `sms:${s.userId}:${crypto.randomUUID()}`).slice(0, 255);
  const result = await s.blink.db.batch([{ sql: `UPDATE sms_credits SET balance = balance - ?, total_used = total_used + ?, updated_at = ? WHERE id = ? AND user_id = ? AND balance >= ?`, args: [amount, amount, new Date().toISOString(), row.id, s.userId, amount] }], 'write');
  const changed = Number((result.results?.[0] as any)?.affectedRows || 0);
  if (changed !== 1) return c.json({ error: 'Insufficient SMS credits', balance: Number((await ensureCredits(s.blink, s.userId)).balance) || 0 }, 402);
  return c.json({ success: true, amount, referenceId: reference, balance: Number((await ensureCredits(s.blink, s.userId)).balance) || 0 });
});

router.get('/api/sms-credits/history', async (c) => {
  const s = await session(c); if (!s) return c.json({ error: 'Unauthorized' }, 401);
  const row = await ensureCredits(s.blink, s.userId);
  return c.json({ history: [{ id: row.id, balance: Number(row.balance) || 0, totalUsed: Number(row.totalUsed) || 0, totalGiven: Number(row.totalGiven) || 0, updatedAt: row.updatedAt ?? null }] });
});
