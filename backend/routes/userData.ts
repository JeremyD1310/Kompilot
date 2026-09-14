import { Hono } from 'hono';
import { getBlink } from '../lib/stripeHelpers';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();
type Row = Record<string, any>;

const EXPORT_TABLES = ['users', 'establishments', 'posts', 'scheduled_posts', 'messages', 'captured_leads', 'conversion_events', 'leads', 'user_credits', 'campaign_performance', 'post_engagement_metrics', 'user_activity_logs', 'attribution_touchpoints', 'marketing_ad_spend', 'ad_accounts', 'ad_metrics', 'ad_sync_runs', 'ad_connection_events', 'metric_sync_log', 'notifications_queue', 'repurposing_jobs', 'repurposing_approvals', 'repurposing_scheduled_posts'];

router.get('/api/user/data/export', async (c) => {
  const blink = getBlink(c.env as Env);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid || !auth.userId) return c.json({ error: 'Unauthorized' }, 401);

  const exportData: Record<string, unknown> = { exportedAt: new Date().toISOString(), userId: auth.userId, tables: {}, privacyNotice: 'Les secrets OAuth et données techniques sensibles ne sont pas inclus dans l’export utilisateur.' };
  for (const tableName of EXPORT_TABLES) {
    try {
      const table = blink.db.table<Row>(tableName);
      const rows = tableName === 'users'
        ? await table.list({ where: { id: auth.userId }, limit: 1 })
        : await table.list({ where: { userId: auth.userId }, limit: 1000 });
      (exportData.tables as Record<string, unknown>)[tableName] = rows;
    } catch (error) {
      (exportData.tables as Record<string, unknown>)[tableName] = { unavailable: error instanceof Error ? error.message : 'unavailable' };
    }
  }
  return c.json(exportData);
});
