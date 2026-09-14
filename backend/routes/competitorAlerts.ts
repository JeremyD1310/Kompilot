import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

const ALERT_METRICS = ['engagement', 'posts_per_week', 'followers', 'last_post_days'] as const;
type AlertMetric = typeof ALERT_METRICS[number];

type CompetitorSnapshot = {
  id: string;
  userId: string;
  competitorId: string;
  metricsJson: string;
  source: string;
  capturedAt: string;
  createdAt: string;
};

function parseJson(value: unknown): Record<string, number> {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return parsed && typeof parsed === 'object' ? parsed as Record<string, number> : {};
  } catch {
    return {};
  }
}

function isTriggered(alert: any, metrics: Record<string, number>) {
  const current = Number(metrics[alert.metric]);
  const threshold = Number(alert.threshold);
  if (!Number.isFinite(current) || !Number.isFinite(threshold)) return false;
  return alert.operator === 'below' ? current < threshold : current > threshold;
}

async function session(c: any) {
  const env = c.env as Env;
  const blink = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  return auth.valid ? { userId: auth.userId, blink } : null;
}

router.get('/api/competitor-alerts', async c => {
  const current = await session(c);
  if (!current) return c.json({ error: 'Unauthorized' }, 401);
  const alerts = await current.blink.db.table<any>('competitor_alerts').list({ where: { userId: current.userId }, orderBy: { createdAt: 'desc' }, limit: 100 });
  return c.json({ alerts });
});

router.post('/api/competitor-alerts', async c => {
  const current = await session(c);
  if (!current) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json().catch(() => ({})) as Record<string, any>;
  if (!body.competitorId || !body.metric) return c.json({ error: 'competitorId and metric are required' }, 400);
  const ownedCompetitor = await current.blink.db.table<any>('competitors').list({ where: { id: String(body.competitorId), userId: current.userId }, limit: 1 });
  if (!ownedCompetitor[0] && !String(body.competitorId).startsWith('comp-default-')) return c.json({ error: 'Concurrent non autorisé.' }, 403);
  const competitorName = ownedCompetitor[0]?.name || String(body.competitorName || 'Concurrent suivi');
  const now = new Date().toISOString();
  const metric = String(body.metric) as AlertMetric;
  if (!ALERT_METRICS.includes(metric)) return c.json({ error: 'Métrique non supportée.' }, 400);
  const threshold = Number(body.threshold);
  if (!Number.isFinite(threshold) || threshold < 0) return c.json({ error: 'Seuil invalide.' }, 400);
  const alert = await current.blink.db.table<any>('competitor_alerts').create({
    id: `competitor_alert_${crypto.randomUUID()}`,
    userId: current.userId,
    competitorId: String(body.competitorId),
    competitorName,
    metric,
    operator: body.operator === 'below' ? 'below' : 'above',
    threshold,
    cadence: body.cadence === 'weekly' ? 'weekly' : 'daily',
    channels: JSON.stringify(Array.isArray(body.channels) ? body.channels : ['in_app']),
    enabled: 1,
    createdAt: now,
    updatedAt: now,
  });
  return c.json({ alert }, 201);
});

router.patch('/api/competitor-alerts/:id', async c => {
  const current = await session(c);
  if (!current) return c.json({ error: 'Unauthorized' }, 401);
  const rows = await current.blink.db.table<any>('competitor_alerts').list({ where: { id: c.req.param('id'), userId: current.userId }, limit: 1 });
  if (!rows[0]) return c.json({ error: 'Alert not found' }, 404);
  const body = await c.req.json().catch(() => ({})) as Record<string, any>;
  const enabled = body.enabled === true || body.enabled === 1 || body.enabled === '1';
  const alert = await current.blink.db.table<any>('competitor_alerts').update(rows[0].id, { enabled: enabled ? 1 : 0, updatedAt: new Date().toISOString() });
  return c.json({ alert });
});

router.delete('/api/competitor-alerts/:id', async c => {
  const current = await session(c);
  if (!current) return c.json({ error: 'Unauthorized' }, 401);
  const rows = await current.blink.db.table<any>('competitor_alerts').list({ where: { id: c.req.param('id'), userId: current.userId }, limit: 1 });
  if (!rows[0]) return c.json({ error: 'Alert not found' }, 404);
  await current.blink.db.table<any>('competitor_alerts').delete(rows[0].id);
  return c.json({ ok: true });
});

/**
 * Evaluate enabled competitor rules for one user. The caller supplies the latest
 * metrics from a trusted sync, so this endpoint never invents performance data.
 */
router.post('/api/competitor-alerts/evaluate', async c => {
  const current = await session(c);
  if (!current) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json().catch(() => ({})) as { snapshots?: Array<{ competitorId: string; metrics: Record<string, number>; source?: string }> };
  const snapshots = Array.isArray(body.snapshots) ? body.snapshots : [];
  const alerts = await current.blink.db.table<any>('competitor_alerts').list({ where: { userId: current.userId, enabled: 1 }, limit: 500 });
  const snapshotTable = current.blink.db.table<CompetitorSnapshot>('competitor_alert_snapshots');
  const triggered: any[] = [];
  const now = new Date().toISOString();

  for (const snapshot of snapshots) {
    if (!snapshot?.competitorId || !snapshot.metrics) continue;
    const snapshotId = `competitor_snapshot_${current.userId}_${snapshot.competitorId}_${now.slice(0, 10)}`;
    await snapshotTable.upsert({
      id: snapshotId,
      userId: current.userId,
      competitorId: snapshot.competitorId,
      metricsJson: JSON.stringify(snapshot.metrics),
      source: snapshot.source || 'sync',
      capturedAt: now,
      createdAt: now,
    });
    for (const alert of alerts.filter((item: any) => item.competitorId === snapshot.competitorId)) {
      if (!isTriggered(alert, snapshot.metrics)) continue;
      const lastTriggered = alert.lastTriggeredAt ? new Date(alert.lastTriggeredAt).getTime() : 0;
      const cooldown = alert.cadence === 'weekly' ? 7 * 86400000 : 86400000;
      if (lastTriggered && Date.now() - lastTriggered < cooldown) continue;
      const notification = await current.blink.db.table<any>('notifications_queue').create({
        id: `competitor_alert_notification_${crypto.randomUUID()}`,
        userId: current.userId,
        title: `Alerte concurrent — ${alert.competitorName}`,
        body: `${alert.metric} est ${alert.operator === 'below' ? 'sous' : 'au-dessus de'} ${alert.threshold}. Valeur observée : ${snapshot.metrics[alert.metric]}.`,
        type: 'competitor_alert',
        url: '/analytics',
        icon: 'bell',
        status: 'sent',
      });
      await current.blink.db.table<any>('competitor_alerts').update(alert.id, { lastTriggeredAt: now, updatedAt: now });
      triggered.push({ alertId: alert.id, notificationId: notification.id, metric: alert.metric, value: snapshot.metrics[alert.metric] });
    }
  }
  return c.json({ evaluated: alerts.length, triggered });
});

export async function evaluateCompetitorAlertsForCron(blink: any, userId?: string) {
  const alerts = await blink.db.table<any>('competitor_alerts').list({ ...(userId ? { where: { userId, enabled: 1 } } : { where: { enabled: 1 } }), limit: 1000 });
  const snapshots = await blink.db.table<CompetitorSnapshot>('competitor_alert_snapshots').list({ limit: 5000, orderBy: { capturedAt: 'desc' } });
  const latestByCompetitor = new Map<string, CompetitorSnapshot>();
  for (const snapshot of snapshots) if (!latestByCompetitor.has(`${snapshot.userId}:${snapshot.competitorId}`)) latestByCompetitor.set(`${snapshot.userId}:${snapshot.competitorId}`, snapshot);
  let triggered = 0;
  for (const alert of alerts) {
    const snapshot = latestByCompetitor.get(`${alert.userId}:${alert.competitorId}`);
    if (!snapshot || !isTriggered(alert, parseJson(snapshot.metricsJson))) continue;
    const lastTriggered = alert.lastTriggeredAt ? new Date(alert.lastTriggeredAt).getTime() : 0;
    const cooldown = alert.cadence === 'weekly' ? 7 * 86400000 : 86400000;
    if (lastTriggered && Date.now() - lastTriggered < cooldown) continue;
    const metrics = parseJson(snapshot.metricsJson);
    await blink.db.table<any>('notifications_queue').create({
      id: `competitor_alert_notification_${crypto.randomUUID()}`,
      userId: alert.userId,
      title: `Alerte concurrent — ${alert.competitorName}`,
      body: `${alert.metric} a franchi le seuil ${alert.threshold}. Valeur observée : ${metrics[alert.metric]}.`,
      type: 'competitor_alert',
      url: '/analytics',
      icon: 'bell',
      status: 'sent',
    });
    await blink.db.table<any>('competitor_alerts').update(alert.id, { lastTriggeredAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    triggered++;
  }
  return { evaluated: alerts.length, triggered };
}
