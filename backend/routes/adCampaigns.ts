import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();
type Campaign = Record<string, any>;
const table = (blink: any) => blink.db.table<Campaign>('ad_campaigns');
const auth = async (c: any) => {
  const header = c.req.header('Authorization');
  if (!header) return null;
  const blink = createClient({ projectId: requireBlinkProjectId(c.env), secretKey: c.env.BLINK_SECRET_KEY });
  const verified = await blink.auth.verifyToken(header);
  return verified.valid ? { id: verified.userId, blink } : null;
};
const json = (value: unknown) => {
  try { return JSON.stringify(value ?? {}); } catch { return '{}'; }
};
const readBody = async (c: any) => { try { return await c.req.json(); } catch { return null; } };
const allowedPlatforms = ['meta', 'tiktok'];
const allowedStatuses = ['draft', 'active', 'paused', 'completed'];
const pick = (b: any) => ({
  name: String(b.name || '').trim(), platform: b.platform, objective: String(b.objective || '').trim(),
  audience: json(b.audience), budgetCents: Number(b.budgetCents || 0), dailyBudgetCents: Number(b.dailyBudgetCents || 0),
  startDate: String(b.startDate || ''), endDate: String(b.endDate || ''), creativeText: String(b.creativeText || ''),
  imageUrl: String(b.imageUrl || ''), status: b.status || 'draft',
});
const validate = (b: any) => !b || !b.name || !allowedPlatforms.includes(b.platform) || !b.objective || !allowedStatuses.includes(b.status || 'draft') || !Number.isFinite(Number(b.budgetCents || 0)) || !Number.isFinite(Number(b.dailyBudgetCents || 0));

router.use('/api/ad-campaigns/*', async (c, next) => { if (!await auth(c)) return c.json({ error: 'Unauthorized' }, 401); await next(); });
router.get('/api/ad-campaigns', async c => { const u = await auth(c); if (!u) return c.json({ error: 'Unauthorized' }, 401); return c.json(await table(u.blink).list({ where: { userId: u.id }, orderBy: { createdAt: 'desc' } })); });
router.get('/api/ad-campaigns/:id', async c => { const u = await auth(c); if (!u) return c.json({ error: 'Unauthorized' }, 401); const x = await table(u.blink).get(c.req.param('id')); return !x || x.userId !== u.id ? c.json({ error: 'Not found' }, 404) : c.json(x); });
router.post('/api/ad-campaigns', async c => { const u = await auth(c); if (!u) return c.json({ error: 'Unauthorized' }, 401); const b = await readBody(c); if (validate(b)) return c.json({ error: 'Invalid campaign. Required: name, platform, objective; platform must be meta or tiktok.' }, 400); const now = new Date().toISOString(); return c.json({ campaign: await table(u.blink).create({ id: crypto.randomUUID(), userId: u.id, ...pick(b), providerStatus: 'not_launched', createdAt: now, updatedAt: now }) }, 201); });
router.patch('/api/ad-campaigns/:id', async c => { const u = await auth(c); if (!u) return c.json({ error: 'Unauthorized' }, 401); const t = table(u.blink); const x = await t.get(c.req.param('id')); if (!x || x.userId !== u.id) return c.json({ error: 'Not found' }, 404); const b = await readBody(c); if (validate({ ...x, ...b })) return c.json({ error: 'Invalid campaign' }, 400); return c.json({ campaign: await t.update(x.id, { ...pick({ ...x, ...b }), updatedAt: new Date().toISOString() }) }); });
router.delete('/api/ad-campaigns/:id', async c => { const u = await auth(c); if (!u) return c.json({ error: 'Unauthorized' }, 401); const t = table(u.blink); const x = await t.get(c.req.param('id')); if (!x || x.userId !== u.id) return c.json({ error: 'Not found' }, 404); await t.delete(x.id); return c.json({ success: true }); });
router.post('/api/ad-campaigns/:id/launch', async c => { const u = await auth(c); if (!u) return c.json({ error: 'Unauthorized' }, 401); const t = table(u.blink); const x = await t.get(c.req.param('id')); if (!x || x.userId !== u.id) return c.json({ error: 'Not found' }, 404); await t.update(x.id, { status: 'draft', providerStatus: 'provider_api_not_configured', updatedAt: new Date().toISOString() }); return c.json({ launched: false, code: 'PROVIDER_API_NOT_CONFIGURED', message: 'Live provider campaign launch is not configured; campaign remains a draft.' }, 409); });