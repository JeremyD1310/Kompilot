/**
 * tikTokAds.ts — TikTok Ads Campaign Performance Routes
 *
 * Fetches campaign metrics, ad group performance, and creative analytics
 * from the TikTok Marketing API (Ads API v1.3).
 *
 * Routes:
 *   GET  /api/tiktok/ads/status        — Check TikTok Ads connection
 *   GET  /api/tiktok/ads/campaigns     — List campaigns with metrics
 *   GET  /api/tiktok/ads/report        — Aggregated performance report
 */
import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import { createSecureTokenStore } from '../lib/secureTokenStore';
import { tiktokBusinessApiCall } from '../lib/tiktokService';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

const TIKTOK_ADS_API = 'https://business-api.tiktok.com/open_api/v1.3';

async function getUserId(authHeader: string | undefined, env: Env): Promise<string | null> {
  if (!authHeader) return null;
  try {
    const client = createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });
    const auth = await client.auth.verifyToken(authHeader);
    return auth.valid && auth.userId ? auth.userId : null;
  } catch { return null; }
}

async function adsApiCall<T>(
  path: string,
  accessToken: string,
  options: { method?: string; body?: Record<string, unknown> } = {},
): Promise<T> {
  const url = `${TIKTOK_ADS_API}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const init: RequestInit = {
      method: options.method || 'GET',
      headers: {
        'Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    };
    if (options.body) init.body = JSON.stringify(options.body);
    const response = await fetch(url, init);
    const json = await response.json() as any;
    if (json.code !== 0 && json.code !== 200) {
      throw new Error(json.message || `TikTok Ads API error: ${json.code}`);
    }
    return json as T;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Resolve TikTok Ads access token.
 * Priority: 1. User OAuth token (tiktok_ads provider), 2. TIKTOK_BUSINESS_API_KEY (server-to-server)
 */
async function resolveAdsToken(
  env: Env,
  userId: string,
): Promise<string | null> {
  const blink = createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });
  const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);

  // 1. Try user OAuth token
  const tokens = await store.getByUser(userId, 'tiktok_ads');
  if (tokens) {
    try {
      return await store.decryptAccessToken(tokens.accessToken);
    } catch { /* fall through */ }
  }

  // 2. Fallback to business API key (server-to-server)
  const businessKey = (env as any).TIKTOK_BUSINESS_API_KEY;
  if (businessKey) return businessKey;

  return null;
}

// ── GET /api/tiktok/ads/status ──────────────────────────────────────────────

router.get('/api/tiktok/ads/status', async (c) => {
  const env = c.env as unknown as Env;
  const userId = await getUserId(c.req.header('Authorization'), env);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const token = await resolveAdsToken(env, userId);

  if (!token) return c.json({ connected: false, reason: 'No TikTok account or business API key configured' });

  try {
    // Test connection by fetching advertiser info
    const result = await adsApiCall<{ data: { list: { advertiser_id: string; name: string; status: string }[] } }>(
      '/advertiser/info/',
      token,
      { method: 'GET' },
    );

    const advertisers = result.data?.list || [];
    return c.json({
      connected: true,
      authMode: token.startsWith('c4aa') ? 'business_api_key' : 'oauth',
      advertisers: advertisers.map(a => ({
        id: a.advertiser_id,
        name: a.name,
        status: a.status,
      })),
    });
  } catch (err: any) {
    return c.json({ connected: false, reason: err.message || 'Token expired or invalid' });
  }
});

// ── GET /api/tiktok/ads/campaigns ───────────────────────────────────────────

router.get('/api/tiktok/ads/campaigns', async (c) => {
  const env = c.env as unknown as Env;
  const userId = await getUserId(c.req.header('Authorization'), env);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const token = await resolveAdsToken(env, userId);
  if (!token) return c.json({ error: 'TikTok Ads not connected and no business API key configured' }, 400);

  const advertiserId = c.req.query('advertiser_id');
  if (!advertiserId) return c.json({ error: 'advertiser_id query param required' }, 400);

  try {
    // Fetch campaigns
    const campaignsResult = await adsApiCall<{
      data: {
        list: {
          campaign_id: string;
          campaign_name: string;
          operation_status: string;
          objective_type: string;
          budget: number;
          budget_mode: string;
          create_time: string;
        }[];
        page_info: { total_number: number };
      };
    }>(
      `/campaign/get/?advertiser_id=${advertiserId}&page_size=50`,
      token,
    );

    // Fetch campaign metrics (basic stats)
    const reportResult = await adsApiCall<{
      data: {
        list: {
          campaign_id: string;
          campaign_name: string;
          spend: string;
          impressions: string;
          clicks: string;
          cpc: string;
          cpm: string;
          ctr: string;
          conversions: string;
          cost_per_conversion: string;
          video_views: string;
          video_6s_views: string;
          video_p100_watched: string;
          like: string;
          comment: string;
          share: string;
          profile_visits: string;
          follows: string;
        }[];
      };
    }>(
      `/report/integrated/get/?advertiser_id=${advertiserId}&report_type=CUSTOM&dimensions=["campaign_id"]&metrics=["spend","impressions","clicks","cpc","cpm","ctr","conversions","cost_per_conversion","video_views","video_6s_views","video_p100_watched","like","comment","share","profile_visits","follows"]&data_level=AUCTION_CAMPAIGN&lifetime=true`,
      token,
    );

    // Merge campaign info with metrics
    const campaigns = campaignsResult.data?.list || [];
    const metrics = reportResult.data?.list || [];
    const metricsMap = new Map(metrics.map(m => [m.campaign_id, m]));

    const enriched = campaigns.map(camp => {
      const m = metricsMap.get(camp.campaign_id);
      return {
        id: camp.campaign_id,
        name: camp.campaign_name,
        status: camp.operation_status,
        objective: camp.objective_type,
        budget: camp.budget,
        budgetMode: camp.budget_mode,
        createdAt: camp.create_time,
        metrics: m ? {
          spend: parseFloat(m.spend || '0'),
          impressions: parseInt(m.impressions || '0'),
          clicks: parseInt(m.clicks || '0'),
          cpc: parseFloat(m.cpc || '0'),
          cpm: parseFloat(m.cpm || '0'),
          ctr: parseFloat(m.ctr || '0'),
          conversions: parseInt(m.conversions || '0'),
          costPerConversion: parseFloat(m.cost_per_conversion || '0'),
          videoViews: parseInt(m.video_views || '0'),
          video6sViews: parseInt(m.video_6s_views || '0'),
          videoP100Watched: parseInt(m.video_p100_watched || '0'),
          likes: parseInt(m.like || '0'),
          comments: parseInt(m.comment || '0'),
          shares: parseInt(m.share || '0'),
          profileVisits: parseInt(m.profile_visits || '0'),
          follows: parseInt(m.follows || '0'),
          conversionRate: parseInt(m.clicks || '0') > 0
            ? Math.round((parseInt(m.conversions || '0') / parseInt(m.clicks || '1')) * 10000) / 100
            : 0,
        } : null,
      };
    });

    return c.json({
      campaigns: enriched,
      totalCampaigns: campaignsResult.data?.page_info?.total_number || 0,
      advertiserId,
    });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to fetch TikTok campaigns' }, 500);
  }
});

// ── GET /api/tiktok/ads/report ──────────────────────────────────────────────

router.get('/api/tiktok/ads/report', async (c) => {
  const env = c.env as unknown as Env;
  const userId = await getUserId(c.req.header('Authorization'), env);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const token = await resolveAdsToken(env, userId);
  if (!token) return c.json({ error: 'TikTok Ads not connected and no business API key configured' }, 400);

  const advertiserId = c.req.query('advertiser_id');
  if (!advertiserId) return c.json({ error: 'advertiser_id query param required' }, 400);

  try {
    // Get aggregate report across all campaigns
    const reportResult = await adsApiCall<{
      data: {
        list: {
          spend: string;
          impressions: string;
          clicks: string;
          cpc: string;
          cpm: string;
          ctr: string;
          conversions: string;
          cost_per_conversion: string;
          video_views: string;
          video_6s_views: string;
          video_p100_watched: string;
          reach: string;
          like: string;
          comment: string;
          share: string;
          profile_visits: string;
          follows: string;
        }[];
      };
    }>(
      `/report/integrated/get/?advertiser_id=${advertiserId}&report_type=CUSTOM&metrics=["spend","impressions","clicks","cpc","cpm","ctr","conversions","cost_per_conversion","video_views","video_6s_views","video_p100_watched","reach","like","comment","share","profile_visits","follows"]&data_level=AUCTION_ADVERTISER&lifetime=true`,
      token,
    );

    const m = reportResult.data?.list?.[0];

    return c.json({
      report: m ? {
        totalSpend: parseFloat(m.spend || '0'),
        totalImpressions: parseInt(m.impressions || '0'),
        totalClicks: parseInt(m.clicks || '0'),
        totalReach: parseInt(m.reach || '0'),
        totalConversions: parseInt(m.conversions || '0'),
        cpc: parseFloat(m.cpc || '0'),
        cpm: parseFloat(m.cpm || '0'),
        ctr: parseFloat(m.ctr || '0'),
        costPerConversion: parseFloat(m.cost_per_conversion || '0'),
        videoViews: parseInt(m.video_views || '0'),
        video6sViews: parseInt(m.video_6s_views || '0'),
        videoCompletionRate: parseInt(m.video_views || '0') > 0
          ? Math.round((parseInt(m.video_p100_watched || '0') / parseInt(m.video_views || '1')) * 100)
          : 0,
        engagementRate: parseInt(m.impressions || '0') > 0
          ? Math.round(((parseInt(m.like || '0') + parseInt(m.comment || '0') + parseInt(m.share || '0')) / parseInt(m.impressions || '1')) * 10000) / 100
          : 0,
        totalEngagements: parseInt(m.like || '0') + parseInt(m.comment || '0') + parseInt(m.share || '0'),
        likes: parseInt(m.like || '0'),
        comments: parseInt(m.comment || '0'),
        shares: parseInt(m.share || '0'),
        profileVisits: parseInt(m.profile_visits || '0'),
        follows: parseInt(m.follows || '0'),
        conversionRate: parseInt(m.clicks || '0') > 0
          ? Math.round((parseInt(m.conversions || '0') / parseInt(m.clicks || '1')) * 10000) / 100
          : 0,
      } : null,
      advertiserId,
    });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to fetch TikTok report' }, 500);
  }
});
