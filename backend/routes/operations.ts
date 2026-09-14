import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';
import { correlationId, safeError, writeOperationReview } from '../lib/operations';

export const router = new Hono<{ Bindings: Env }>();
type Row = Record<string, any>;

async function admin(c: any) {
  const blink = createClient({ projectId: c.env.BLINK_PROJECT_ID, secretKey: c.env.BLINK_SECRET_KEY });
  const auth = await blink.auth.verifyToken(c.req.header('Authorization') || '');
  const allowed = auth.valid && (auth.appRole === 'admin' || auth.email?.endsWith('@kompilot.fr') || auth.email === 'admin@kompilot.com');
  return allowed ? { blink, auth } : null;
}

router.get('/api/operations/overview', async (c) => {
  const session = await admin(c);
  if (!session) return c.json({ error: 'Accès administrateur requis.' }, 403);
  const id = correlationId(c.req.raw);
  const now = Date.now();
  const day = new Date(now - 86_400_000).toISOString();
  const week = new Date(now - 7 * 86_400_000).toISOString();
  const [failedRuns, disconnected, privacy, deadTasks, failedTasks, errors, unattributed] = await Promise.all([
    session.blink.db.table<Row>('ad_sync_runs').list({ where: { status: 'sync_error' }, orderBy: { startedAt: 'desc' }, limit: 500 }),
    session.blink.db.table<Row>('ad_connections').list({ where: { status: 'revoked' }, orderBy: { updatedAt: 'desc' }, limit: 500 }),
    session.blink.db.table<Row>('privacy_requests').list({ orderBy: { requestedAt: 'desc' }, limit: 500 }),
    session.blink.db.table<Row>('_blink_tasks').list({ where: { status: 'dead' }, orderBy: { failedAt: 'desc' }, limit: 500 }),
    session.blink.db.table<Row>('_blink_tasks').list({ where: { status: 'failed' }, orderBy: { failedAt: 'desc' }, limit: 500 }),
    session.blink.db.table<Row>('observability_logs').list({ where: { severity: 'error' }, orderBy: { createdAt: 'desc' }, limit: 500 }),
    session.blink.db.table<Row>('conversion_events').list({ orderBy: { createdAt: 'desc' }, limit: 1000 }),
  ]);
  const recent = (rows: Row[], field: string, since: string) => rows.filter(row => String(row[field] || '') >= since).length;
  const unattributedCount = unattributed.filter(row => !row.source || row.source === 'unknown' || row.source === 'unattributed').length;
  const parseMetadata = (row: Row) => {
    if (typeof row.metadata !== 'string') return row.metadata || {};
    try { return JSON.parse(row.metadata) as Row; } catch { return {}; }
  };
  const summary = {
    generatedAt: new Date(now).toISOString(),
    correlationId: id,
    daily: { syncErrors: recent(failedRuns, 'startedAt', day), providerDisconnects: recent(disconnected, 'updatedAt', day), criticalLogs: errors.filter(row => row.severity === 'critical' && String(row.createdAt || '') >= day).length, deadTasks: recent(deadTasks, 'failedAt', day), failedTasks: recent(failedTasks, 'failedAt', day) },
    weekly: { privacyRequests: recent(privacy, 'requestedAt', week), privacyFailures: privacy.filter(row => row.status === 'failed' && String(row.requestedAt || '') >= week).length, unattributedConversions: unattributedCount, syncErrors: recent(failedRuns, 'startedAt', week) },
    queues: { dead: deadTasks.length, failed: failedTasks.length },
    recentErrors: errors.slice(0, 20).map(row => ({ id: row.id, action: row.action, provider: row.provider, severity: row.severity, error: row.errorMessage, createdAt: row.createdAt, correlationId: parseMetadata(row).correlationId || '' })),
  };
  await writeOperationReview(session.blink, 'daily_operations', summary.daily, { correlationId: id }, day, new Date(now).toISOString()).catch(error => console.error('[Operations] review write failed', safeError(error)));
  return c.json(summary);
});

router.get('/api/operations/privacy-requests', async (c) => {
  const session = await admin(c);
  if (!session) return c.json({ error: 'Accès administrateur requis.' }, 403);
  const limit = Math.min(Math.max(Number(c.req.query('limit') || 100), 1), 200);
  const offset = Math.max(Number(c.req.query('offset') || 0), 0);
  const rows = await session.blink.db.table<Row>('privacy_requests').list({ orderBy: { requestedAt: 'desc' }, limit, offset });
  return c.json({ requests: rows.map(row => ({ id: row.id, userId: row.userId, requestType: row.requestType, status: row.status, requestedAt: row.requestedAt, startedAt: row.startedAt, completedAt: row.completedAt, correlationId: row.correlationId, errorMessage: row.errorMessage })), limit, offset, nextOffset: rows.length === limit ? offset + rows.length : null });
});

router.get('/api/operations/sync-runs', async (c) => {
  const session = await admin(c);
  if (!session) return c.json({ error: 'Accès administrateur requis.' }, 403);
  const limit = Math.min(Math.max(Number(c.req.query('limit') || 100), 1), 200);
  const offset = Math.max(Number(c.req.query('offset') || 0), 0);
  const rows = await session.blink.db.table<Row>('ad_sync_runs').list({ orderBy: { startedAt: 'desc' }, limit, offset });
  return c.json({ runs: rows, limit, offset, nextOffset: rows.length === limit ? offset + rows.length : null });
});
