import { Hono } from 'hono';
import { getBlink } from '../lib/stripeHelpers';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();
type Row = Record<string, any>;

async function getUserId(c: any, blink: ReturnType<typeof getBlink>): Promise<string | null> {
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  return auth.valid ? auth.userId : null;
}

function parseMetadata(value: unknown): Row {
  if (!value) return {};
  if (typeof value === 'object') return value as Row;
  try { return JSON.parse(String(value)); } catch { return {}; }
}

router.get('/api/attribution/overview', async (c) => {
  const blink = getBlink(c.env as Env);
  const userId = await getUserId(c, blink);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const days = Math.min(Math.max(Number(c.req.query('days') ?? 30), 1), 90);
  const cutoff = Date.now() - days * 86400000;

  try {
    const [leads, conversions, metrics, posts] = await Promise.all([
      blink.db.table<Row>('captured_leads').list({ where: { userId }, orderBy: { createdAt: 'desc' }, limit: 500 }),
      blink.db.table<Row>('conversion_events').list({ where: { userId }, orderBy: { createdAt: 'desc' }, limit: 500 }),
      blink.db.table<Row>('post_engagement_metrics').list({ where: { userId }, orderBy: { recordedAt: 'desc' }, limit: 500 }),
      blink.db.table<Row>('scheduled_posts').list({ where: { userId }, orderBy: { createdAt: 'desc' }, limit: 200 }),
    ]);

    const inPeriod = (row: Row) => {
      const raw = row.createdAt ?? row.recordedAt ?? row.created_at ?? row.recorded_at;
      return !raw || new Date(raw).getTime() >= cutoff;
    };
    const periodLeads = leads.filter(inPeriod);
    const periodConversions = conversions.filter(inPeriod).filter((event) => event.userId === userId);
    const leadEvents = periodConversions.filter((event) => String(event.eventType ?? '').toLowerCase() === 'lead');
    const sourceMap: Record<string, number> = {};
    for (const lead of periodLeads) {
      const source = String(lead.source || 'widget').trim() || 'widget';
      sourceMap[source] = (sourceMap[source] ?? 0) + 1;
    }
    for (const event of leadEvents) {
      const source = String(event.source || parseMetadata(event.metadata).utmSource || 'widget').trim() || 'widget';
      if (!sourceMap[source]) sourceMap[source] = 0;
    }

    const postMap = new Map(posts.map((post) => [String(post.id), post]));
    const postStats = new Map<string, { postId: string; clicks: number; reach: number; leads: number }>();
    for (const metric of metrics.filter(inPeriod)) {
      const postId = String(metric.postId || '');
      if (!postId) continue;
      const current = postStats.get(postId) ?? { postId, clicks: 0, reach: 0, leads: 0 };
      current.clicks += Number(metric.clicks) || 0;
      current.reach += Number(metric.reach) || 0;
      postStats.set(postId, current);
    }
    for (const event of leadEvents) {
      const metadata = parseMetadata(event.metadata);
      const postId = String(metadata.postId || metadata.post_id || '');
      if (!postId) continue;
      const current = postStats.get(postId) ?? { postId, clicks: 0, reach: 0, leads: 0 };
      current.leads += 1;
      postStats.set(postId, current);
    }

    const funnel = {
      leads: periodLeads.length,
      qualified: periodConversions.filter((event) => ['mql', 'qualified', 'sql'].includes(String(event.eventType).toLowerCase())).length,
      opportunities: periodConversions.filter((event) => ['opportunity', 'closedwon', 'purchase'].includes(String(event.eventType).toLowerCase())).length,
    };

    return c.json({
      period: { days, from: new Date(cutoff).toISOString(), to: new Date().toISOString() },
      funnel,
      totalLeads: periodLeads.length,
      sources: Object.entries(sourceMap).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count),
      topPosts: [...postStats.values()].sort((a, b) => (b.leads * 100000 + b.clicks) - (a.leads * 100000 + a.clicks)).slice(0, 5).map((row) => ({
        ...row,
        title: postMap.get(row.postId)?.textContent || postMap.get(row.postId)?.title || `Publication ${row.postId.slice(0, 8)}`,
      })),
    });
  } catch (error) {
    console.error('[attribution] overview failed', error);
    return c.json({ error: error instanceof Error ? error.message : 'Attribution unavailable' }, 500);
  }
});