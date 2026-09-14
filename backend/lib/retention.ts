import { safeError, operationalLog } from './operations';

const MAX_ROWS_PER_TABLE = 5000;

type Policy = { id: string; tableName: string; retentionDays: number | string; action: string; enabled: number | string };
type Row = Record<string, any>;

function dateField(row: Row): string {
  return String(row.createdAt || row.created_at || row.startedAt || row.started_at || row.syncedAt || row.synced_at || row.occurredAt || row.occurred_at || row.requestedAt || row.requested_at || '');
}

function orderField(tableName: string) {
  if (tableName === 'ad_sync_runs') return 'startedAt';
  if (tableName === 'attribution_touchpoints') return 'occurredAt';
  if (tableName === 'metric_sync_log') return 'syncedAt';
  return 'createdAt';
}

function oldEnough(row: Row, cutoff: number) {
  const timestamp = Date.parse(dateField(row));
  return Number.isFinite(timestamp) && timestamp < cutoff;
}

async function pruneTable(blink: any, policy: Policy, now: number, correlationId: string) {
  const table = blink.db.table<Row>(policy.tableName);
  const cutoff = now - Number(policy.retentionDays) * 86_400_000;
  const rows = await table.list({ orderBy: { [orderField(policy.tableName)]: 'asc' }, limit: MAX_ROWS_PER_TABLE });
  const candidates = rows.filter(row => oldEnough(row, cutoff));
  let affected = 0;
  for (const row of candidates) {
    if (policy.action === 'anonymize' && policy.tableName === 'user_activity_logs') {
      await table.update(row.id, { email: '', ipAddress: '', userAgent: '', description: 'Anonymized operational audit event', metadata: JSON.stringify({ anonymizedAt: new Date(now).toISOString(), correlationId }) });
    } else if (policy.action === 'anonymize' && policy.tableName === 'attribution_touchpoints') {
      await table.update(row.id, { leadId: '', anonymousId: '', sessionId: '', clickId: '', metadata: JSON.stringify({ anonymizedAt: new Date(now).toISOString() }) });
    } else if (policy.action === 'delete') {
      await table.delete(row.id);
    } else if (policy.action === 'retain') {
      continue;
    } else {
      throw new Error(`Unsupported retention action: ${policy.action}`);
    }
    affected += 1;
  }
  return { table: policy.tableName, action: policy.action, scanned: rows.length, affected, truncated: rows.length === MAX_ROWS_PER_TABLE && candidates.length === rows.length };
}

export async function runRetentionCleanup(blink: any, correlationId = crypto.randomUUID()) {
  const policies = await blink.db.table<Policy>('retention_policies').list({ where: { enabled: '1' }, orderBy: { tableName: 'asc' }, limit: 100 });
  const results: Record<string, unknown>[] = [];
  for (const policy of policies) {
    try { results.push(await pruneTable(blink, policy, Date.now(), correlationId)); }
    catch (error) { results.push({ table: policy.tableName, action: policy.action, affected: 0, error: safeError(error) }); operationalLog('retention_table_failed', { correlationId }, { table: policy.tableName, error: safeError(error) }); }
  }
  const failed = results.filter(result => result.error).length;
  const summary = { correlationId, policyCount: policies.length, failed, tables: results, completedAt: new Date().toISOString() };
  try { await blink.db.table<any>('operations_reviews').create({ id: `review_retention_${correlationId}`, reviewType: 'retention_cleanup', status: failed > 0 ? 'failed' : 'completed', correlationId, periodStart: new Date(Date.now() - 86_400_000).toISOString(), periodEnd: new Date().toISOString(), summaryJson: JSON.stringify(summary) }); }
  catch (error) { operationalLog('retention_review_write_failed', { correlationId }, { error: safeError(error) }); }
  return summary;
}
