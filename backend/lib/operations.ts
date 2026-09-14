import type { Env } from './types';
import { getBlink } from './stripeHelpers';

type Row = Record<string, any>;

export type OperationContext = {
  correlationId: string;
  requestPath?: string;
  userId?: string;
  organizationId?: string;
  provider?: string;
  runId?: string;
  taskId?: string;
};

export function correlationId(request: Request): string {
  const incoming = request.headers.get('x-correlation-id')?.trim();
  return incoming && /^[a-zA-Z0-9._:-]{8,120}$/.test(incoming) ? incoming : crypto.randomUUID();
}

export function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]').replace(/access_token[=:]\S+/gi, 'access_token=[REDACTED]').slice(0, 500);
}

export function operationalLog(event: string, context: OperationContext, extra: Record<string, unknown> = {}) {
  console.error(JSON.stringify({ event, ...context, ...extra, at: new Date().toISOString() }));
}

export async function writeObservability(blink: any, event: string, context: OperationContext, severity: 'info' | 'warning' | 'error' | 'critical', extra: Record<string, unknown> = {}) {
  try {
    await blink.db.table<any>('observability_logs').create({
      id: `obs_${crypto.randomUUID()}`,
      userId: context.userId || 'system',
      action: event,
      provider: context.provider || '',
      errorMessage: typeof extra.error === 'string' ? safeError(extra.error) : '',
      metadata: JSON.stringify({ correlationId: context.correlationId, requestPath: context.requestPath, organizationId: context.organizationId, runId: context.runId, taskId: context.taskId, ...extra }),
      severity,
    });
  } catch (error) {
    operationalLog('observability_write_failed', context, { error: safeError(error), sourceEvent: event });
  }
}

export async function writeOperationReview(blink: any, reviewType: string, summary: Record<string, unknown>, context: OperationContext, periodStart: string, periodEnd: string) {
  await blink.db.table<any>('operations_reviews').upsert({ id: `review_${reviewType}_${context.correlationId}`, reviewType, status: 'completed', correlationId: context.correlationId, periodStart, periodEnd, summaryJson: JSON.stringify(summary) });
}

async function safeList(blink: any, tableName: string, options: Record<string, unknown>, context: OperationContext) {
  try {
    return await blink.db.table<Row>(tableName).list(options);
  } catch (error) {
    operationalLog('operations_review_source_failed', context, { table: tableName, error: safeError(error) });
    return [] as Row[];
  }
}

function metadata(row: Row): Row {
  if (typeof row.metadata !== 'string') return row.metadata || {};
  try { return JSON.parse(row.metadata) as Row; } catch { return {}; }
}

export async function runDailyOperationsReview(blink: any, id = crypto.randomUUID()) {
  const now = Date.now();
  const day = new Date(now - 86_400_000).toISOString();
  const context = { correlationId: id };
  const [failedRuns, disconnected, deadTasks, failedTasks, errors] = await Promise.all([
    safeList(blink, 'ad_sync_runs', { where: { status: 'sync_error' }, orderBy: { startedAt: 'desc' }, limit: 500 }, context),
    safeList(blink, 'ad_connections', { where: { status: 'revoked' }, orderBy: { updatedAt: 'desc' }, limit: 500 }, context),
    safeList(blink, '_blink_tasks', { where: { status: 'dead' }, orderBy: { failedAt: 'desc' }, limit: 500 }, context),
    safeList(blink, '_blink_tasks', { where: { status: 'failed' }, orderBy: { failedAt: 'desc' }, limit: 500 }, context),
    safeList(blink, 'observability_logs', { where: { severity: 'error' }, orderBy: { createdAt: 'desc' }, limit: 500 }, context),
  ]);
  const recent = (rows: Row[], field: string) => rows.filter(row => String(row[field] || '') >= day).length;
  const summary = { syncErrors: recent(failedRuns, 'startedAt'), providerDisconnects: recent(disconnected, 'updatedAt'), criticalLogs: errors.filter(row => row.severity === 'critical' && String(row.createdAt || '') >= day).length, failedTasks: recent(failedTasks, 'failedAt'), deadTasks: recent(deadTasks, 'failedAt') };
  await writeOperationReview(blink, 'daily_operations', summary, { correlationId: id }, day, new Date(now).toISOString());
  return { correlationId: id, summary };
}

export async function runWeeklyGdprReview(blink: any, id = crypto.randomUUID()) {
  const now = Date.now();
  const week = new Date(now - 7 * 86_400_000).toISOString();
  const [requests, retentionReviews] = await Promise.all([
    blink.db.table<Row>('privacy_requests').list({ orderBy: { requestedAt: 'desc' }, limit: 500 }),
    blink.db.table<Row>('operations_reviews').list({ where: { reviewType: 'retention_cleanup' }, orderBy: { createdAt: 'desc' }, limit: 100 }),
  ]);
  const recent = requests.filter(row => String(row.requestedAt || '') >= week);
  const summary = { requests: recent.length, completed: recent.filter(row => row.status === 'completed').length, failed: recent.filter(row => row.status === 'failed').length, processing: recent.filter(row => row.status === 'processing').length, retentionRuns: retentionReviews.filter(row => String(row.createdAt || '') >= week).length };
  await writeOperationReview(blink, 'weekly_gdpr', summary, { correlationId: id }, week, new Date(now).toISOString());
  return { correlationId: id, summary };
}

export async function getServiceBlink(env: Env) { return getBlink(env); }
