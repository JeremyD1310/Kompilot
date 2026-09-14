import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import { getAdAccounts, getAdInsights } from '../lib/metaMarketingService';
import { decryptMetaUserToken, getMetaConnection } from '../lib/metaAccountStore';
import { syncTikTokSpend, resolveTikTokAdsToken } from '../lib/tiktokAdsSync';
import { allocateAttribution, normalizeAttributionModel, type AttributionModel } from '../lib/attributionModels';
import type { Env } from '../lib/types';
import { correlationId, safeError, operationalLog } from '../lib/operations';

export const router = new Hono<{ Bindings: Env }>();
type Row = Record<string, any>;
type Channel = { channel: string; spendCents: number; revenueCents: number; leads: number; customers: number; impressions: number; clicks: number; conversions: number; cacCents: number | null; contributionPct: number };

const blinkFor = (env: Env) => createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
const json = (value: unknown): Row => { try { return typeof value === 'string' ? JSON.parse(value) : (value as Row) || {}; } catch { return {}; } };
const secret = (raw: Record<string, string | undefined>, ...parts: string[]) => raw[parts.join('_')] || '';
const valueFrom = (row: Row, camel: string, snake: string) => row[camel] ?? row[snake];
const channelOf = (value: unknown) => {
  const source = String(value || '').toLowerCase().trim();
  if (['google', 'google_ads', 'googleads', 'gads', 'adwords', 'cpc', 'paid_search'].includes(source) || source.includes('google')) return 'google_ads';
  if (['meta', 'meta_ads', 'facebook', 'instagram', 'fb', 'ig'].includes(source) || source.includes('facebook') || source.includes('instagram')) return 'meta_ads';
  if (['linkedin', 'linkedin_ads'].includes(source) || source.includes('linkedin')) return 'linkedin_ads';
  if (['tiktok', 'tiktok_ads'].includes(source) || source.includes('tiktok')) return 'tiktok_ads';
  if (source.includes('email') || source.includes('brevo')) return 'email';
  if (source.includes('organic') || source.includes('seo')) return 'organic';
  return source || 'unattributed';
};

async function auth(c: any) {
  const env = c.env as Env;
  const client = blinkFor(env);
  const verified = await client.auth.verifyToken(c.req.header('Authorization') || '');
  return verified.valid ? { client, userId: verified.userId, raw: c.env as Record<string, string | undefined> } : null;
}

async function resolveMetaToken(session: { client: any; userId: string; raw: Record<string, string | undefined> }) {
  if (session.raw.META_SYSTEM_USER_TOKEN) return session.raw.META_SYSTEM_USER_TOKEN;
  const encryptionKey = session.raw.TOKEN_ENCRYPTION_KEY || '';
  if (!encryptionKey) return '';
  const connection = await decryptMetaUserToken(session.client, session.userId, encryptionKey);
  return connection?.accessToken || '';
}

function period(days: number) {
  const end = new Date();
  const start = new Date(Date.now() - days * 86400000);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

async function upsertSpend(client: any, userId: string, row: Row, organizationId = '', syncRunId = '', correlationId = '') {
  const table = client.db.table<Row>('marketing_ad_spend');
  const scoped = { ...row, organizationId, syncRunId, correlationId };
  const existing = await table.list({ where: { userId, organizationId, platform: row.platform, accountId: row.accountId, campaignId: row.campaignId, periodStart: row.periodStart, periodEnd: row.periodEnd }, limit: 1 });
  if (existing[0]) return table.update(existing[0].id, scoped);
  return table.create({ id: crypto.randomUUID(), userId, ...scoped });
}

async function fetchGoogleSpend(raw: Record<string, string | undefined>, range: { start: string; end: string }) {
  const customerId = secret(raw, 'GADS', 'CUSTOMER', 'ID').replace(/-/g, '');
  const developerToken = secret(raw, 'GADS', 'DEVELOPER', 'TOKEN');
  const oauthToken = secret(raw, 'GADS', 'OAUTH', 'TOKEN');
  if (!customerId || !developerToken || !oauthToken) return { configured: false, rows: [] as Row[] };
  const query = `SELECT campaign.id, campaign.name, metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions FROM campaign WHERE segments.date BETWEEN '${range.start}' AND '${range.end}'`;
  const rows: Row[] = [];
  let pageToken = '';
  for (let page = 0; page < 10; page += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`https://googleads.googleapis.com/v23/customers/${customerId}/googleAds:search`, { method: 'POST', headers: { Authorization: `Bearer ${oauthToken}`, 'developer-token': developerToken, 'Content-Type': 'application/json', ...(raw.GADS_LOGIN_CUSTOMER_ID ? { 'login-customer-id': raw.GADS_LOGIN_CUSTOMER_ID.replace(/-/g, '') } : {}) }, body: JSON.stringify({ query, pageSize: 1000, ...(pageToken ? { pageToken } : {}) }), signal: controller.signal });
      const data = await response.json() as any;
      if (!response.ok || data.error) throw new Error(data.error?.message || `Google Ads HTTP ${response.status}`);
      rows.push(...(data.results || []).map((item: Row) => ({ platform: 'google_ads', accountId: customerId, accountName: `Google Ads · ${customerId}`, campaignId: String(item.campaign?.id || ''), campaignName: String(item.campaign?.name || 'Campagne Google'), spendCents: Math.round(Number(item.metrics?.costMicros || 0) / 10000), impressions: Number(item.metrics?.impressions || 0), clicks: Number(item.metrics?.clicks || 0), conversions: Math.round(Number(item.metrics?.conversions || 0)), revenueCents: 0, currency: 'EUR', periodStart: range.start, periodEnd: range.end, source: 'google_ads_api', syncedAt: new Date().toISOString() })));
      pageToken = String(data.nextPageToken || '');
      if (!pageToken) break;
    } finally { clearTimeout(timer); }
  }
  return { configured: true, rows };
}

async function resolveOrganization(session: { client: any; userId: string }, requested?: string) {
  if (!requested) return `personal_${session.userId}`;
  const members = await session.client.db.table<any>('ad_organization_members').list({ where: { organizationId: requested, userId: session.userId, status: 'active' }, limit: 1 });
  if (!members.length) throw new Error('Organisation non autorisée.');
  return requested;
}

router.get('/api/marketing-attribution/connections', async (c) => {
  const session = await auth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const raw = session.raw;
  const metaConnection = await getMetaConnection(session.client, session.userId);
  const googleCustomer = Boolean(secret(raw, 'GADS', 'CUSTOMER', 'ID'));
  const googleDeveloper = Boolean(secret(raw, 'GADS', 'DEVELOPER', 'TOKEN'));
  const googleOAuth = Boolean(secret(raw, 'GADS', 'OAUTH', 'TOKEN'));
  const tiktokToken = await resolveTikTokAdsToken(raw as Env, session.userId);
  return c.json({ meta: Boolean(raw.META_SYSTEM_USER_TOKEN || metaConnection), google: googleCustomer && googleDeveloper && googleOAuth, googleStatus: googleCustomer && googleDeveloper && googleOAuth ? 'connected' : googleCustomer || googleDeveloper || googleOAuth ? 'partial' : 'not_configured', tiktok: Boolean(tiktokToken), tiktokStatus: tiktokToken ? 'configured' : 'not_configured', checkedAt: new Date().toISOString() });
});

router.post('/api/marketing-attribution/sync', async (c) => {
  const session = await auth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const correlation = correlationId(c.req.raw);
  const body = await c.req.json().catch(() => ({})) as Row;
  let organizationId: string;
  try { organizationId = await resolveOrganization(session, String(body.organizationId || c.req.header('X-Organization-Id') || '')); } catch (error) { return c.json({ error: safeError(error) }, 403); }
  const runId = `attr_sync_${crypto.randomUUID()}`;
  await session.client.db.table<any>('ad_sync_runs').create({ id: runId, userId: session.userId, organizationId, provider: 'attribution', status: 'running', requestedDays: Math.min(Math.max(Number(body.days || 30), 7), 90), startedAt: new Date().toISOString(), correlationId, attemptCount: 1, updatedAt: new Date().toISOString() });
  const days = Math.min(Math.max(Number(body.days || 30), 7), 90);
  const range = period(days);
  const raw = session.raw;
  const results: Row[] = [];
  const metaToken = await resolveMetaToken(session);
  const googleCustomerId = secret(raw, 'GADS', 'CUSTOMER', 'ID');
  const googleDeveloper = secret(raw, 'GADS', 'DEVELOPER', 'TOKEN');
  const googleOAuth = secret(raw, 'GADS', 'OAUTH', 'TOKEN');
  const googleConfigured = Boolean(googleCustomerId && googleDeveloper && googleOAuth);
  const googlePartial = Boolean(googleCustomerId || googleDeveloper || googleOAuth) && !googleConfigured;
  const tiktokToken = await resolveTikTokAdsToken(raw as Env, session.userId);
  if (!metaToken && !googleConfigured && !tiktokToken) {
    await session.client.db.table<any>('ad_sync_runs').update(runId, { status: 'failed', errorCode: 'configuration_error', errorMessage: googlePartial ? 'Google Ads est partiellement configuré. Ajoutez GADS_DEVELOPER_TOKEN et GADS_OAUTH_TOKEN.' : 'Aucune connexion publicitaire configurée. Ajoutez Meta, Google Ads ou TikTok Ads.', finishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }).catch(() => undefined);
    return c.json({ error: googlePartial ? 'Google Ads est partiellement configuré. Ajoutez GADS_DEVELOPER_TOKEN et GADS_OAUTH_TOKEN.' : 'Aucune connexion publicitaire configurée. Ajoutez Meta, Google Ads ou TikTok Ads.' }, 503);
  }
  try {
    if (metaToken) {
      const accounts = await getAdAccounts(metaToken);
      const account = accounts.find(item => body.metaAccountId ? item.id === body.metaAccountId : true);
      if (account) {
        const insights = await getAdInsights(metaToken, account.id, days <= 7 ? 'last_7d' : days <= 30 ? 'last_30d' : 'last_90d');
        for (const insight of insights) results.push({ platform: 'meta_ads', accountId: account.id, accountName: account.name, campaignId: String(insight.campaign_id || ''), campaignName: String(insight.campaign_name || 'Campagne Meta'), spendCents: Math.round(Number(insight.spend || 0) * 100), impressions: Number(insight.impressions || 0), clicks: Number(insight.clicks || 0), conversions: 0, revenueCents: 0, currency: account.currency || 'EUR', periodStart: range.start, periodEnd: range.end, source: 'meta_graph_api', syncedAt: new Date().toISOString() });
      }
    }
    const google = await fetchGoogleSpend(raw, range);
    results.push(...google.rows);
    const tiktok = tiktokToken ? await syncTikTokSpend(raw as Env, session.userId, range) : { configured: false, rows: [] as Row[] };
    results.push(...tiktok.rows);
    for (const row of results) await upsertSpend(session.client, session.userId, row, organizationId, runId, correlation);
    await session.client.db.table<any>('ad_sync_runs').update(runId, { status: 'completed', rowsRead: results.length, rowsWritten: results.length, finishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    return c.json({ synced: results.length, platforms: { meta: results.some(row => row.platform === 'meta_ads'), google: results.some(row => row.platform === 'google_ads'), tiktok: results.some(row => row.platform === 'tiktok_ads') }, googleStatus: googleConfigured ? (google.rows.length ? 'connected' : 'connected_no_data') : googlePartial ? 'partial' : 'not_configured', tiktokStatus: tiktok.configured ? (tiktok.rows.length ? 'connected' : 'connected_no_data') : 'not_configured', period: range });
  } catch (error) { await session.client.db.table<any>('ad_sync_runs').update(runId, { status: 'failed', errorCode: 'provider_error', errorMessage: safeError(error), finishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }).catch(() => undefined); operationalLog('attribution_sync_failed', { correlationId, userId: session.userId, organizationId, runId }, { error: safeError(error) }); return c.json({ error: error instanceof Error ? error.message : 'Ad spend sync failed' }, 502); }
});

router.get('/api/marketing-attribution/overview', async (c) => {
  const session = await auth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const requestedOrganizationId = c.req.query('organizationId') || c.req.header('X-Organization-Id') || '';
  let organizationId: string;
  try { organizationId = await resolveOrganization(session, requestedOrganizationId); } catch (error) { return c.json({ error: safeError(error) }, 403); }
  const days = Math.min(Math.max(Number(c.req.query('days') || 30), 1), 90);
  const model = normalizeAttributionModel(c.req.query('model'));
  const since = Date.now() - days * 86400000;
  try {
    const [spendRows, conversions, leads, touchpoints] = await Promise.all([
      session.client.db.table<Row>('marketing_ad_spend').list({ where: { userId: session.userId, organizationId }, orderBy: { periodEnd: 'desc' }, limit: 1000 }),
      session.client.db.table<Row>('conversion_events').list({ where: { userId: session.userId }, orderBy: { createdAt: 'desc' }, limit: 1000 }),
      session.client.db.table<Row>('captured_leads').list({ where: { userId: session.userId }, orderBy: { createdAt: 'desc' }, limit: 1000 }),
      session.client.db.table<Row>('attribution_touchpoints').list({ where: { userId: session.userId }, orderBy: { occurredAt: 'desc' }, limit: 2000 }),
    ]);
    const periodSpendRows = spendRows.filter(row => { const end = valueFrom(row, 'periodEnd', 'period_end'); return !end || new Date(String(end)).getTime() >= since; });
    const periodTouchpoints = touchpoints.filter(row => { const occurredAt = valueFrom(row, 'occurredAt', 'occurred_at'); return !occurredAt || new Date(String(occurredAt)).getTime() >= since; });
    const touchesFor = (identifier: string) => periodTouchpoints.filter(row => [valueFrom(row, 'leadId', 'lead_id'), valueFrom(row, 'anonymousId', 'anonymous_id'), valueFrom(row, 'sessionId', 'session_id')].some(value => String(value || '') === identifier)).map(row => ({ id: String(row.id), channel: channelOf(valueFrom(row, 'channel', 'channel') || valueFrom(row, 'source', 'source')), occurredAt: String(valueFrom(row, 'occurredAt', 'occurred_at') || '') }));
    const creditsFor = (identifier: string, fallbackChannel: unknown) => {
      const credits = allocateAttribution(touchesFor(identifier), model);
      return credits.length ? credits : [{ channel: channelOf(fallbackChannel), touchpointId: '', weight: 1 }];
    };
    const map = new Map<string, Channel>();
    const ensure = (channel: string) => map.get(channel) || (map.set(channel, { channel, spendCents: 0, revenueCents: 0, leads: 0, customers: 0, impressions: 0, clicks: 0, conversions: 0, cacCents: null, contributionPct: 0 }), map.get(channel)!);
    for (const row of periodSpendRows) { const item = ensure(channelOf(row.platform)); item.spendCents += Number(row.spendCents) || 0; item.impressions += Number(row.impressions) || 0; item.clicks += Number(row.clicks) || 0; item.conversions += Number(row.conversions) || 0; }
    for (const lead of leads) { const leadAt = valueFrom(lead, 'createdAt', 'created_at'); if (leadAt && new Date(String(leadAt)).getTime() < since) continue; const identifier = String(lead.id || lead.email || ''); const fallbackChannel = valueFrom(lead, 'source', 'source'); const leadCredits = creditsFor(identifier, fallbackChannel); for (const credit of leadCredits) ensure(credit.channel).leads += credit.weight; }
    for (const event of conversions) {
      const eventAt = valueFrom(event, 'createdAt', 'created_at');
      if (eventAt && new Date(String(eventAt)).getTime() < since) continue;
      const metadata = json(valueFrom(event, 'metadata', 'metadata'));
      const identifier = String(valueFrom(event, 'leadId', 'lead_id') || metadata.leadId || metadata.lead_id || valueFrom(event, 'sessionId', 'session_id') || metadata.sessionId || metadata.session_id || '');
      const fallbackChannel = valueFrom(event, 'source', 'source') || valueFrom(event, 'medium', 'medium') || metadata.utmSource || metadata.utm_source;
      const type = String(valueFrom(event, 'eventType', 'event_type') || '').toLowerCase();
      const eventCredits = creditsFor(identifier, fallbackChannel);
      const amountCents = Number(valueFrom(event, 'amountCents', 'amount_cents') || metadata.revenueCents || metadata.revenue_cents || 0) || 0;
      for (const credit of eventCredits) {
        const item = ensure(credit.channel);
        if (['lead', 'mql', 'qualified', 'sql'].includes(type)) item.leads += credit.weight;
        if (['purchase', 'sale', 'closedwon', 'customer', 'conversion'].includes(type)) item.customers += credit.weight;
        item.revenueCents += Math.round(amountCents * credit.weight);
      }
    }
    const channels = [...map.values()].map(item => ({ ...item, cacCents: item.customers ? Math.round(item.spendCents / item.customers) : null }));
    const totalSpend = channels.reduce((sum, item) => sum + item.spendCents, 0);
    const attributedRevenue = channels.filter(item => item.channel !== 'unattributed').reduce((sum, item) => sum + item.revenueCents, 0);
    const rawRevenue = conversions.filter(event => { const eventAt = valueFrom(event, 'createdAt', 'created_at'); return !eventAt || new Date(String(eventAt)).getTime() >= since; }).reduce((sum, event) => { const metadata = json(valueFrom(event, 'metadata', 'metadata')); return sum + (Number(valueFrom(event, 'amountCents', 'amount_cents') || metadata.revenueCents || metadata.revenue_cents || 0) || 0); }, 0);
    const unattributed = ensure('unattributed'); unattributed.revenueCents = Math.max(0, rawRevenue - attributedRevenue);
    if (unattributed.revenueCents > 0 && !channels.some(item => item.channel === 'unattributed')) channels.push(unattributed);
    for (const item of channels) item.contributionPct = rawRevenue ? Math.round((item.revenueCents / rawRevenue) * 1000) / 10 : 0;
    const visibleChannels = channels.filter(item => item.revenueCents || item.spendCents || item.leads || item.customers);
    return c.json({ model, models: ['last_touch', 'first_touch', 'linear', 'position_based'], period: { days, from: new Date(since).toISOString(), to: new Date().toISOString() }, channels: visibleChannels.sort((a, b) => b.revenueCents - a.revenueCents), totals: { spendCents: totalSpend, revenueCents: rawRevenue, leads: channels.reduce((sum, item) => sum + item.leads, 0), customers: channels.reduce((sum, item) => sum + item.customers, 0), unattributedRevenueCents: unattributed.revenueCents }, confidence: periodSpendRows.length ? 'connected' : 'no_spend_data' });
  } catch (error) { return c.json({ error: error instanceof Error ? error.message : 'Attribution unavailable' }, 500); }
});
