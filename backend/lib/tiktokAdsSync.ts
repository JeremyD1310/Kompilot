import { createClient } from '@blinkdotnew/sdk';
import { createSecureTokenStore } from './secureTokenStore';
import type { Env } from './types';

type Row = Record<string, any>;
const API_BASE = 'https://business-api.tiktok.com/open_api/v1.3';

async function callTikTok(path: string, token: string, body: Row) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Access-Token': token, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const json = await response.json() as Row;
    if (!response.ok || (json.code !== undefined && json.code !== 0 && json.code !== 200)) {
      throw new Error(String(json.message || `TikTok Ads HTTP ${response.status}`));
    }
    return json;
  } finally {
    clearTimeout(timer);
  }
}

export async function resolveTikTokAdsToken(env: Env, userId: string) {
  const blink = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
  const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);
  const tokenRow = await store.getByUser(userId, 'tiktok_ads');
  if (tokenRow) {
    try { return await store.decryptAccessToken(tokenRow.accessToken); } catch { /* continue */ }
  }
  return (env as any).TIKTOK_BUSINESS_API_KEY || null;
}

export async function syncTikTokSpend(env: Env, userId: string, range: { start: string; end: string }) {
  const token = await resolveTikTokAdsToken(env, userId);
  if (!token) return { configured: false, rows: [] as Row[] };

  const advertisersResponse = await callTikTok('/advertiser/info/', token, { page_size: 100 });
  const advertisers = advertisersResponse.data?.list || [];
  const rows: Row[] = [];
  for (const advertiser of advertisers.slice(0, 20)) {
    const advertiserId = String(advertiser.advertiser_id || '');
    if (!advertiserId) continue;
    const report = await callTikTok('/report/integrated/get/', token, {
      advertiser_id: advertiserId,
      report_type: 'BASIC',
      data_level: 'AUCTION_CAMPAIGN',
      dimensions: ['campaign_id'],
      metrics: ['campaign_name', 'spend', 'impressions', 'clicks', 'conversions'],
      start_date: range.start,
      end_date: range.end,
      page_size: 1000,
      page: 1,
    });
    for (const item of report.data?.list || []) {
      rows.push({
        platform: 'tiktok_ads', accountId: advertiserId, accountName: String(advertiser.name || advertiserId),
        campaignId: String(item.dimensions?.campaign_id || item.campaign_id || ''),
        campaignName: String(item.metrics?.campaign_name || item.campaign_name || 'Campagne TikTok'),
        spendCents: Math.round(Number(item.metrics?.spend || item.spend || 0) * 100),
        impressions: Number(item.metrics?.impressions || item.impressions || 0),
        clicks: Number(item.metrics?.clicks || item.clicks || 0),
        conversions: Math.round(Number(item.metrics?.conversions || item.conversions || 0)),
        revenueCents: 0, currency: 'EUR', periodStart: range.start, periodEnd: range.end,
        source: 'tiktok_ads_api', syncedAt: new Date().toISOString(),
      });
    }
  }
  return { configured: true, rows };
}
