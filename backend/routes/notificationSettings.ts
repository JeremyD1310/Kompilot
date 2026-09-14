import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();
type Settings = { id: string; userId: string; weeklyReportEnabled: string | number };

async function getActor(c: any) {
  const blink = createClient({ projectId: c.env.BLINK_PROJECT_ID, secretKey: c.env.BLINK_SECRET_KEY });
  const verified = await blink.auth.verifyToken(c.req.header('Authorization'));
  return verified.valid ? { blink, userId: verified.userId } : null;
}

router.get('/api/notification-settings', async (c) => {
  const actor = await getActor(c);
  if (!actor) return c.json({ error: 'Unauthorized' }, 401);
  const rows = await actor.blink.db.table<Settings>('user_notification_settings').list({ where: { userId: actor.userId }, limit: 1 });
  const settings = rows[0];
  return c.json({ weeklyDigest: settings ? Number(settings.weeklyReportEnabled) > 0 : true });
});

router.patch('/api/notification-settings', async (c) => {
  const actor = await getActor(c);
  if (!actor) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json() as { weeklyDigest?: boolean };
  if (typeof body.weeklyDigest !== 'boolean') return c.json({ error: 'weeklyDigest must be boolean' }, 400);
  const table = actor.blink.db.table<Settings>('user_notification_settings');
  const existing = (await table.list({ where: { userId: actor.userId }, limit: 1 }))[0];
  if (existing) {
    await table.update(existing.id, { weeklyReportEnabled: body.weeklyDigest ? 1 : 0, updatedAt: new Date().toISOString() } as any);
  } else {
    await table.create({ userId: actor.userId, weeklyReportEnabled: body.weeklyDigest ? 1 : 0 } as any);
  }
  return c.json({ weeklyDigest: body.weeklyDigest });
});
