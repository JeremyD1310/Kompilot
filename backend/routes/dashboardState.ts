import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import { requireBlinkProjectId } from '../lib/blinkConfig';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

function client(env: Env) {
  return createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });
}

async function authenticatedUserId(c: any, blink: ReturnType<typeof client>): Promise<string | null> {
  const verified = await blink.auth.verifyToken(c.req.header('Authorization') ?? '');
  return verified.valid ? verified.userId : null;
}

router.get('/api/dashboard/state', async (c) => {
  const blink = client(c.env as Env);
  const userId = await authenticatedUserId(c, blink);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const [preferences, milestoneRows] = await Promise.all([
      (blink.db as any).sql(
        `SELECT action_id, resolution, snoozed_until, updated_at
         FROM dashboard_action_preferences
         WHERE user_id = ?`,
        [userId],
      ),
      (blink.db as any).sql(
        `SELECT id, payload, recorded_at
         FROM dashboard_milestone_events
         WHERE user_id = ? AND acknowledged_at IS NULL
         ORDER BY recorded_at ASC
         LIMIT 1`,
        [userId],
      ),
    ]);

    const milestone = milestoneRows?.[0]
      ? {
          id: milestoneRows[0].id,
          recordedAt: milestoneRows[0].recorded_at,
          data: JSON.parse(milestoneRows[0].payload || '{}'),
        }
      : null;

    return c.json({
      preferences: (preferences ?? []).map((row: any) => ({
        actionId: row.action_id,
        resolution: row.resolution,
        snoozedUntil: row.snoozed_until,
        updatedAt: row.updated_at,
      })),
      milestone,
    });
  } catch (error) {
    console.error('[dashboard-state] read failed', error);
    return c.json({ error: 'Dashboard state unavailable', code: 'DASHBOARD_STATE_UNAVAILABLE' }, 503);
  }
});

router.put('/api/dashboard/actions/:actionId', async (c) => {
  const blink = client(c.env as Env);
  const userId = await authenticatedUserId(c, blink);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const actionId = c.req.param('actionId').trim();
  const body = await c.req.json().catch(() => null) as { resolution?: string; snoozedUntil?: string | null } | null;
  if (!/^[a-z0-9:_-]{1,100}$/i.test(actionId) || !body || !['ignored', 'snoozed'].includes(body.resolution ?? '')) {
    return c.json({ error: 'Invalid dashboard action preference' }, 400);
  }
  if (body.resolution === 'snoozed' && !body.snoozedUntil) {
    return c.json({ error: 'snoozedUntil is required' }, 400);
  }
  if (body.snoozedUntil && Number.isNaN(Date.parse(body.snoozedUntil))) {
    return c.json({ error: 'Invalid snoozedUntil' }, 400);
  }

  const now = new Date().toISOString();
  try {
    await (blink.db as any).sql(
      `INSERT INTO dashboard_action_preferences
        (id, user_id, action_id, resolution, snoozed_until, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, action_id) DO UPDATE SET
         resolution = excluded.resolution,
         snoozed_until = excluded.snoozed_until,
         updated_at = excluded.updated_at`,
      [`dashboard-action:${userId}:${actionId}`, userId, actionId, body.resolution, body.snoozedUntil ?? null, now, now],
    );
    return c.json({ ok: true, actionId, resolution: body.resolution, snoozedUntil: body.snoozedUntil ?? null });
  } catch (error) {
    console.error('[dashboard-state] action persistence failed', error);
    return c.json({ error: 'Dashboard action could not be saved', code: 'DASHBOARD_ACTION_SAVE_FAILED' }, 503);
  }
});

router.post('/api/dashboard/milestones/:eventId/acknowledge', async (c) => {
  const blink = client(c.env as Env);
  const userId = await authenticatedUserId(c, blink);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    await (blink.db as any).sql(
      `UPDATE dashboard_milestone_events
       SET acknowledged_at = ?
       WHERE id = ? AND user_id = ? AND acknowledged_at IS NULL`,
      [new Date().toISOString(), c.req.param('eventId'), userId],
    );
    return c.json({ ok: true });
  } catch (error) {
    console.error('[dashboard-state] milestone acknowledgement failed', error);
    return c.json({ error: 'Milestone acknowledgement failed' }, 503);
  }
});
