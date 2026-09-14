import { createAdTenantStore, type AdProvider, type AdTenantContext } from './adTenantStore';
import { encryptToken } from './tokenEncryption';
import { notifyAdConnectionFailure } from './adConnectionAlerts';
import { fetchWithBackoff } from './providerHttp';
import { operationalLog, safeError, writeObservability } from './operations';

type SyncContext = AdTenantContext & { runId?: string; correlationId?: string; attempt?: number };
type SyncResult = { status: string; rows: number; rowsRead?: number; rowsWritten?: number; pages?: number; accounts?: number; error?: string };

export async function syncTenantAds(blink: any, env: Record<string, string>, context: SyncContext, provider: AdProvider, days = 30): Promise<SyncResult> {
  const store = createAdTenantStore(blink, env.TOKEN_ENCRYPTION_KEY);
  const runId = context.runId || `sync_${crypto.randomUUID()}`;
  const correlation = context.correlationId || crypto.randomUUID();
  const runs = blink.db.table<any>('ad_sync_runs');
  await runs.upsert({ id: runId, userId: context.userId, organizationId: context.organizationId, provider, status: 'running', requestedDays: days, startedAt: new Date().toISOString(), attemptCount: context.attempt || 1, correlationId: correlation, updatedAt: new Date().toISOString() });
  const finish = async (patch: Record<string, unknown>) => { await runs.update(runId, { ...patch, finishedAt: patch.status && ['completed', 'partial', 'failed', 'token_expired', 'rate_limited', 'skipped'].includes(String(patch.status)) ? new Date().toISOString() : undefined, updatedAt: new Date().toISOString() }); };
  try {
    const connection = await store.getConnection(context, provider);
    if (!connection || !['active', 'sync_error', 'rate_limited'].includes(connection.status)) { await finish({ status: 'skipped', errorCode: 'not_connected', errorMessage: 'not_connected' }); return { status: 'skipped', rows: 0 }; }
    let accessToken = await store.getAccessToken(connection);
    if (connection.tokenExpiresAt && Date.parse(connection.tokenExpiresAt) <= Date.now()) {
      if (provider === 'google_ads') {
        const refreshToken = await store.getRefreshToken(connection);
        if (refreshToken && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
          const response = await fetchWithBackoff('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, refresh_token: refreshToken, grant_type: 'refresh_token' }) }, { correlationId: correlation, userId: context.userId, organizationId: context.organizationId, provider, runId }, { provider, attempts: 3, timeoutMs: 15_000 });
          const refreshed = await response.json() as { access_token?: string; expires_in?: number; error?: string; error_description?: string };
          if (response.ok && refreshed.access_token) { accessToken = refreshed.access_token; await store.updateAccessToken(context, accessToken, new Date(Date.now() + (refreshed.expires_in ?? 3600) * 1000).toISOString()); }
          else { const code = refreshed.error || 'invalid_grant'; const message = refreshed.error_description || 'Le token Google Ads a été révoqué.'; await store.markConnection(context, provider, { status: code === 'invalid_grant' ? 'token_revoked' : 'token_expired', lastError: message, lastErrorCode: code }); await notifyAdConnectionFailure(blink, env, context, provider, message); await finish({ status: 'token_expired', errorCode: code, errorMessage: message }); return { status: 'token_expired', rows: 0, error: message }; }
        } else { const message = 'Le token Google Ads a expiré. Reconnectez le compte.'; await store.markConnection(context, provider, { status: 'token_expired', lastError: message, lastErrorCode: 'token_expired' }); await notifyAdConnectionFailure(blink, env, context, provider, message); await finish({ status: 'token_expired', errorCode: 'token_expired', errorMessage: message }); return { status: 'token_expired', rows: 0, error: message }; }
      } else { const message = 'Le token Meta Ads a expiré. Reconnectez le compte.'; await store.markConnection(context, provider, { status: 'token_expired', lastError: message, lastErrorCode: 'token_expired' }); await notifyAdConnectionFailure(blink, env, context, provider, message); await finish({ status: 'token_expired', errorCode: 'token_expired', errorMessage: message }); return { status: 'token_expired', rows: 0, error: message }; }
    }
    const accounts = (await store.listAccounts(context, provider)).filter((item: any) => Number(item.isSelected) > 0 && item.status !== 'revoked');
    let rows = 0; let pages = 0;
    for (const account of accounts) {
      const result = provider === 'google_ads' ? await syncGoogleAccount(store, context, accessToken, account, env, days, correlation, runId) : await syncMetaAccount(store, context, accessToken, account, days, correlation, runId);
      rows += result.rows; pages += result.pages;
      await runs.update(runId, { rowsRead: rows, rowsWritten: rows, pagesRead: pages, accountsProcessed: accounts.indexOf(account) + 1, updatedAt: new Date().toISOString() });
    }
    await store.markConnection(context, provider, { lastSyncAt: new Date().toISOString(), lastError: '', lastErrorCode: '' });
    await finish({ status: 'completed', rowsRead: rows, rowsWritten: rows, pagesRead: pages, accountsProcessed: accounts.length });
    await writeObservability(blink, 'ad_sync_completed', { correlationId: correlation, userId: context.userId, organizationId: context.organizationId, provider, runId }, 'info', { rows, pages, accounts: accounts.length });
    return { status: 'completed', rows, rowsRead: rows, rowsWritten: rows, pages, accounts: accounts.length };
  } catch (error) {
    const message = safeError(error);
    const rateLimited = message.includes('429') || message.toLowerCase().includes('rate') || message.toLowerCase().includes('quota');
    const status = rateLimited ? 'rate_limited' : 'sync_error';
    await finish({ status, errorCode: rateLimited ? 'provider_rate_limit' : 'provider_error', errorMessage: message });
    await store.markConnection(context, provider, { status: rateLimited ? 'active' : 'sync_error', lastError: message, lastErrorCode: rateLimited ? 'provider_rate_limit' : 'provider_error' });
    await notifyAdConnectionFailure(blink, env, context, provider, message);
    operationalLog('ad_sync_failed', { correlationId: correlation, userId: context.userId, organizationId: context.organizationId, provider, runId }, { error: message, status });
    return { status, rows: 0, error: message };
  }
}

async function syncGoogleAccount(store: ReturnType<typeof createAdTenantStore>, context: SyncContext, token: string, account: any, env: Record<string, string>, days: number, correlationId: string, runId: string) {
  const customerId = account.externalId.replace(/-/g, ''); const end = new Date(); const start = new Date(Date.now() - days * 86_400_000); const query = `SELECT campaign.id, campaign.name, segments.date, metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions FROM campaign WHERE segments.date BETWEEN '${iso(start)}' AND '${iso(end)}'`;
  let pageToken = ''; let pages = 0; let rows = 0;
  do {
    pages += 1; if (pages > 100) throw new Error('Google Ads pagination limit reached');
    const response = await fetchWithBackoff(`https://googleads.googleapis.com/v23/customers/${customerId}/googleAds:search`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'developer-token': env.GADS_DEVELOPER_TOKEN ?? '', 'Content-Type': 'application/json' }, body: JSON.stringify({ query, pageSize: 1000, ...(pageToken ? { pageToken } : {}) }) }, { correlationId, userId: context.userId, organizationId: context.organizationId, provider: 'google_ads', runId, }, { provider: 'google_ads', attempts: 3, timeoutMs: 20_000 });
    const data = await response.json() as any; if (!response.ok || data.error) throw new Error(data.error?.message || `Google Ads HTTP ${response.status}`);
    for (const item of data.results ?? []) { await store.writeMetric(context, { accountId: account.id, provider: 'google_ads', campaignId: String(item.campaign?.id ?? ''), campaignName: String(item.campaign?.name ?? ''), date: String(item.segments?.date ?? iso(end)), spendCents: Math.round(Number(item.metrics?.costMicros ?? 0) / 10_000), impressions: Number(item.metrics?.impressions ?? 0), clicks: Number(item.metrics?.clicks ?? 0), conversions: Number(item.metrics?.conversions ?? 0), raw: item }); rows += 1; }
    pageToken = String(data.nextPageToken ?? '');
  } while (pageToken);
  return { rows, pages };
}

async function syncMetaAccount(store: ReturnType<typeof createAdTenantStore>, context: SyncContext, token: string, account: any, days: number, correlationId: string, runId: string) {
  const url = new URL(`https://graph.facebook.com/v21.0/${account.externalId}/insights`); url.searchParams.set('access_token', token); url.searchParams.set('fields', 'campaign_id,campaign_name,spend,impressions,clicks,actions,date_start'); url.searchParams.set('time_range', JSON.stringify({ since: iso(new Date(Date.now() - days * 86_400_000)), until: iso(new Date()) })); url.searchParams.set('level', 'campaign');
  let next: string | undefined = url.toString(); let pages = 0; let rows = 0;
  while (next) { pages += 1; if (pages > 100) throw new Error('Meta pagination limit reached'); const response = await fetchWithBackoff(next, { headers: { Accept: 'application/json' } }, { correlationId, userId: context.userId, organizationId: context.organizationId, provider: 'meta', runId }, { provider: 'meta', attempts: 3, timeoutMs: 20_000 }); const data = await response.json() as any; if (!response.ok || data.error) throw new Error(data.error?.message || `Meta HTTP ${response.status}`); for (const item of data.data ?? []) { await store.writeMetric(context, { accountId: account.id, provider: 'meta', campaignId: String(item.campaign_id ?? ''), campaignName: String(item.campaign_name ?? ''), date: String(item.date_start ?? iso(new Date())), spendCents: Math.round(Number(item.spend ?? 0) * 100), impressions: Number(item.impressions ?? 0), clicks: Number(item.clicks ?? 0), conversions: Number((item.actions ?? []).find((action: any) => action.action_type === 'purchase')?.value ?? 0), raw: item }); rows += 1; } next = data.paging?.next; }
  return { rows, pages };
}
function iso(date: Date) { return date.toISOString().slice(0, 10); }
