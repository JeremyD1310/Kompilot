/**
 * Funnels — Ghost Email Analytics routes
 *
 *   POST /api/funnels/:id/ghost-emails/:emailId/track  — log open/click/bounce
 *   GET  /api/funnels/:id/ghost-emails/analytics       — aggregate stats per email
 *   GET  /api/funnels/track-pixel/:token               — 1x1 pixel tracking for opens
 */
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';

const app = new Hono<{ Bindings: { BLINK_SECRET_KEY: string } }>();

type EventType = 'open' | 'click' | 'bounce';

// ── GET /api/funnels/:id/ghost-emails/analytics ───────────────────────────────
app.get('/:id/ghost-emails/analytics', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const blink = createClient({
      projectId: 'presence-manager-saas-gbrhsehk',
      secretKey: c.env.BLINK_SECRET_KEY,
    });

    const token = authHeader.split(' ')[1];
    const user = await blink.auth.verifyToken(token);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const funnelId = c.req.param('id');

    // Get all analytics events for this funnel
    const events = await blink.db.ghostEmailAnalytics.list({
      where: { funnelId, userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    // Aggregate per ghost_email_id
    const statsMap: Record<string, { opens: number; clicks: number; bounces: number; lastEvent: string }> = {};

    for (const ev of events) {
      const key = ev.ghostEmailId ?? 'unknown';
      if (!statsMap[key]) {
        statsMap[key] = { opens: 0, clicks: 0, bounces: 0, lastEvent: ev.createdAt as string };
      }
      if (ev.eventType === 'open') statsMap[key].opens++;
      else if (ev.eventType === 'click') statsMap[key].clicks++;
      else if (ev.eventType === 'bounce') statsMap[key].bounces++;
    }

    // Overall funnel totals
    const totals = Object.values(statsMap).reduce(
      (acc, s) => ({
        opens: acc.opens + s.opens,
        clicks: acc.clicks + s.clicks,
        bounces: acc.bounces + s.bounces,
      }),
      { opens: 0, clicks: 0, bounces: 0 }
    );

    return c.json({ totals, byEmail: statsMap, events: events.slice(0, 50) });
  } catch (err) {
    console.error('[ghost-emails analytics GET]', err);
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

// ── POST /api/funnels/:id/ghost-emails/:emailId/track ────────────────────────
app.post('/:id/ghost-emails/:emailId/track', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const blink = createClient({
      projectId: 'presence-manager-saas-gbrhsehk',
      secretKey: c.env.BLINK_SECRET_KEY,
    });

    const token = authHeader.split(' ')[1];
    const user = await blink.auth.verifyToken(token);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const funnelId = c.req.param('id');
    const emailId = c.req.param('emailId');
    const body = await c.req.json() as { eventType?: EventType; eventUrl?: string };

    const validTypes: EventType[] = ['open', 'click', 'bounce'];
    const eventType: EventType = validTypes.includes(body.eventType as EventType)
      ? (body.eventType as EventType)
      : 'open';

    await blink.db.ghostEmailAnalytics.create({
      id: crypto.randomUUID().replace(/-/g, ''),
      funnelId,
      userId: user.id,
      ghostEmailId: emailId,
      eventType,
      eventUrl: body.eventUrl ?? null,
      createdAt: new Date().toISOString(),
    });

    return c.json({ success: true });
  } catch (err) {
    console.error('[ghost-emails track POST]', err);
    return c.json({ error: 'Failed to log event' }, 500);
  }
});

// ── POST /api/funnels/:id/ghost-emails/bulk-event ─────────────────────────────
// Manually mark emails as opened/clicked/bounced (for simulation / manual entry)
app.post('/:id/ghost-emails/bulk-event', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const blink = createClient({
      projectId: 'presence-manager-saas-gbrhsehk',
      secretKey: c.env.BLINK_SECRET_KEY,
    });

    const token = authHeader.split(' ')[1];
    const user = await blink.auth.verifyToken(token);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const funnelId = c.req.param('id');
    const body = await c.req.json() as {
      emailIds: string[];
      eventType: EventType;
    };

    const validTypes: EventType[] = ['open', 'click', 'bounce'];
    const eventType: EventType = validTypes.includes(body.eventType) ? body.eventType : 'open';
    const emailIds: string[] = Array.isArray(body.emailIds) ? body.emailIds.slice(0, 50) : [];

    const inserts = emailIds.map(emailId => ({
      id: crypto.randomUUID().replace(/-/g, ''),
      funnelId,
      userId: user.id,
      ghostEmailId: emailId,
      eventType,
      createdAt: new Date().toISOString(),
    }));

    if (inserts.length > 0) {
      await blink.db.ghostEmailAnalytics.createMany(inserts);
    }

    return c.json({ success: true, count: inserts.length });
  } catch (err) {
    console.error('[ghost-emails bulk-event POST]', err);
    return c.json({ error: 'Failed to log bulk events' }, 500);
  }
});

export const router = app;
