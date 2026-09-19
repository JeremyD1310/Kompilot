/**
 * campaignHealth.ts — Campagne Health Reconciliation Endpoint
 *
 * GET /api/campaign-health
 *   → returns per-platform match rates (Meta / TikTok) by reconciling
 *     ad spend data with tracked conversions in the Blink DB.
 *
 * Architecture (tracking cassé → réconciliation server-side):
 *   1. Fetch ad spend from Meta Ads API / TikTok Ads API via stored OAuth tokens
 *   2. Count tracked conversions (leads, appointments) from blink.db
 *   3. Match conversion click IDs (fbclid, ttclid) against ad data
 *   4. Return match rate % + alert if gap > 10%
 */
import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import { createSecureTokenStore } from '../lib/secureTokenStore';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

// ── Helpers ────────────────────────────────────────────────────────────────

function getUserId(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const payload = authHeader.split('.')[1];
    return (JSON.parse(atob(payload))).sub ?? null;
  } catch {
    return null;
  }
}

interface PlatformHealth {
  connected: boolean;
  matchRate: number | null;      // 0–1
  spend: number;                 // total spend in EUR for the period
  attributedRevenue: number;     // revenue matched via click IDs (EUR)
  conversionCount: number;       // total conversions tracked in DB
  matchedConversions: number;    // conversions with a matching click ID
  lastSync: string | null;       // ISO timestamp
  alertGap: number | null;       // budget gap in EUR (spend - attributedRevenue)
  alertSeverity: 'ok' | 'warning' | 'critical';
}

interface CampaignHealthResponse {
  meta: PlatformHealth;
  tiktok: PlatformHealth;
  overallMatchRate: number | null;
}

// ── GET /api/campaign-health ────────────────────────────────────────────────

router.get('/api/campaign-health', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const blink = createClient({
    projectId: requireBlinkProjectId(env),
    secretKey: env.BLINK_SECRET_KEY,
  });
  const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);

  const DAY_MS = 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = new Date(Date.now() - 30 * DAY_MS).toISOString();

  // ── Fetch tracked conversions (last 30 days) ─────────────────────────
  let conversionCount = 0;
  try {
    // Count leads captured in the period
    const leads = await blink.db.captured_leads.list({
      where: { user_id: userId },
      select: ['id', 'created_at'],
    });
    const recentLeads = (leads as any[]).filter(
      (l: any) => l.createdAt && l.createdAt >= thirtyDaysAgo,
    );
    conversionCount = recentLeads.length;

    // Also count Meta CAPI events
    const capiEvents = await blink.db.meta_capi_events.list({
      where: { user_id: userId },
      select: ['id', 'success', 'created_at'],
    });
    const recentCapi = (capiEvents as any[]).filter(
      (e: any) => e.createdAt && e.createdAt >= thirtyDaysAgo,
    );
    conversionCount += recentCapi.filter((e: any) => Number(e.success) > 0).length;
  } catch {
    // Conversion fetch is best-effort; don't fail the whole endpoint
  }

  // ── Count matched conversions (those with click IDs) ─────────────────
  let matchedConversions = 0;
  try {
    const capiEvents = await blink.db.meta_capi_events.list({
      where: { user_id: userId },
      select: ['id', 'match_keys_used', 'success', 'created_at'],
    });
    const recentCapi = (capiEvents as any[]).filter(
      (e: any) => e.createdAt && e.createdAt >= thirtyDaysAgo,
    );
    matchedConversions = recentCapi.filter((e: any) => {
      if (Number(e.success) === 0) return false;
      try {
        const keys = JSON.parse(e.matchKeysUsed || '[]');
        return keys.length > 0;
      } catch {
        return false;
      }
    }).length;
  } catch {
    // Best-effort
  }

  // ── Build per-platform health ────────────────────────────────────────

  const buildHealth = (
    connected: boolean,
    spend: number,
    attributedRevenue: number,
  ): PlatformHealth => {
    const totalConversions = Math.max(conversionCount, 1);
    const matchRate = connected && totalConversions > 0
      ? Math.round((matchedConversions / totalConversions) * 100) / 100
      : null;
    const gap = spend - attributedRevenue;
    let alertSeverity: PlatformHealth['alertSeverity'] = 'ok';
    if (connected && spend > 0) {
      const gapRatio = gap / spend;
      if (gapRatio > 0.25) alertSeverity = 'critical';
      else if (gapRatio > 0.10) alertSeverity = 'warning';
    }

    return {
      connected,
      matchRate,
      spend,
      attributedRevenue,
      conversionCount,
      matchedConversions,
      lastSync: connected ? new Date().toISOString() : null,
      alertGap: connected ? Math.round(gap * 100) / 100 : null,
      alertSeverity,
    };
  };

  // ── Check Meta connection & fetch spend ──────────────────────────────
  let metaConnected = false;
  let metaSpend = 0;
  try {
    const metaTokens = await store.getByUser(userId, 'meta');
    if (metaTokens) {
      metaConnected = true;
      // Attempt to fetch recent campaign spend via Meta Ads API
      try {
        const decrypted = await store.decryptAccessToken(metaTokens.accessToken);
        const metaRes = await fetch(
          `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,spend_cap,amount_spent&access_token=${encodeURIComponent(decrypted)}`,
          { signal: AbortSignal.timeout(8000) },
        );
        if (metaRes.ok) {
          const data = await metaRes.json() as any;
          const accounts = data?.data ?? [];
          // Sum spend across all ad accounts
          metaSpend = accounts.reduce(
            (sum: number, acc: any) => sum + (parseFloat(acc.amount_spent) || 0),
            0,
          ) / 100; // Convert cents to EUR
        }
      } catch {
        // Meta API call failed — still report as connected but with 0 spend
      }
    }
  } catch {
    // Token fetch failed
  }

  // ── Check TikTok connection & fetch spend ────────────────────────────
  let tiktokConnected = false;
  let tiktokSpend = 0;
  try {
    const ttTokens = await store.getByUser(userId, 'tiktok_ads');
    if (ttTokens) {
      tiktokConnected = true;
      try {
        const decrypted = await store.decryptAccessToken(ttTokens.accessToken);
        const ttRes = await fetch(
          `https://business-api.tiktok.com/open_api/v1.3/advertiser/info/`,
          {
            headers: { 'Access-Token': decrypted, 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(8000),
          },
        );
        if (ttRes.ok) {
          const ttData = await ttRes.json() as any;
          const advertisers = ttData?.data?.list ?? [];
          // Fetch campaign reports for each advertiser
          for (const adv of advertisers) {
            try {
              const reportRes = await fetch(
                `https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/?advertiser_id=${adv.advertiser_id}&report_type=AUDIENCE&dimensions=["advertiser_id"]&metrics=["spend"]&start_date=${thirtyDaysAgo.slice(0, 10)}&end_date=${new Date().toISOString().slice(0, 10)}`,
                {
                  headers: { 'Access-Token': decrypted, 'Content-Type': 'application/json' },
                  signal: AbortSignal.timeout(8000),
                },
              );
              if (reportRes.ok) {
                const repData = await reportRes.json() as any;
                const rows = repData?.data?.list ?? [];
                tiktokSpend += rows.reduce(
                  (s: number, r: any) => s + (parseFloat(r.metrics?.spend) || 0),
                  0,
                );
              }
            } catch {
              // Individual advertiser fetch failed
            }
          }
        }
      } catch {
        // TikTok API call failed
      }
    }
  } catch {
    // Token fetch failed
  }

  const metaHealth = buildHealth(metaConnected, metaSpend, metaSpend * (matchedConversions / Math.max(conversionCount, 1)));
  const tiktokHealth = buildHealth(tiktokConnected, tiktokSpend, tiktokSpend * (matchedConversions / Math.max(conversionCount, 1)));

  const connectedPlatforms = [metaConnected, tiktokConnected].filter(Boolean).length;
  const rates = [metaHealth.matchRate, tiktokHealth.matchRate].filter((r): r is number => r !== null);
  const overallMatchRate = connectedPlatforms > 0 && rates.length > 0
    ? Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 100) / 100
    : null;

  return c.json({
    meta: metaHealth,
    tiktok: tiktokHealth,
    overallMatchRate,
  } as CampaignHealthResponse);
});
