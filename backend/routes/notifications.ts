import { Hono } from 'hono';
import { getBlink } from '../lib/stripeHelpers';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();
type Row = Record<string, any>;

async function actor(c: any) {
  const blink = getBlink(c.env as Env);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization') || '');
  return auth.valid ? { blink, userId: auth.userId } : null;
}

router.get('/api/notifications', async (c) => {
  const session = await actor(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const rows = await session.blink.db.table<Row>('notifications_queue').list({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    limit: 50,
  });
  return c.json({ notifications: rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    type: row.type,
    url: row.url,
    status: row.status,
    read: row.status === 'read',
    createdAt: row.createdAt,
  })) });
});

router.patch('/api/notifications/:id/read', async (c) => {
  const session = await actor(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const table = session.blink.db.table<Row>('notifications_queue');
  const row = (await table.list({ where: { id: c.req.param('id'), userId: session.userId }, limit: 1 }))[0];
  if (!row) return c.json({ error: 'Notification not found' }, 404);
  await table.update(row.id, { status: 'read' });
  return c.json({ success: true });
});

router.post('/api/notifications/read-all', async (c) => {
  const session = await actor(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const table = session.blink.db.table<Row>('notifications_queue');
  const rows = await table.list({ where: { userId: session.userId }, limit: 100 });
  for (const row of rows) {
    if (row.status !== 'read') await table.update(row.id, { status: 'read' });
  }
  return c.json({ success: true, updated: rows.length });
});

router.post('/api/notifications/clear-all', async (c) => {
  const session = await actor(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const table = session.blink.db.table<Row>('notifications_queue');
  const rows = await table.list({ where: { userId: session.userId }, limit: 100 });
  for (const row of rows) await table.delete(row.id);
  return c.json({ success: true, deleted: rows.length });
});
