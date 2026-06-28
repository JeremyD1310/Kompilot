/**
 * Engagement Metrics — UTM campaign tracking & post engagement
 *
 * GET  /api/engagement/metrics?days=30   — aggregated KPIs + trend + platform breakdown
 * GET  /api/engagement/campaigns?days=30 — campaign performance by utm_campaign
 * POST /api/engagement/record            — record engagement for a single post
 * POST /api/engagement/sync-campaigns    — recompute campaign_performance from metrics
 */
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

/* ── helpers ──────────────────────────────────────────────────────────────── */

const getBlink = (env: Env) =>
  createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });

function getUserId(h: string | undefined): string | null {
  if (!h?.startsWith('Bearer ')) return null;
  try { const p = h.split('.')[1]; const d = JSON.parse(atob(p)); return d.sub ?? d.user_id ?? null; }
  catch { return null; }
}

function daysAgoISO(n: number) {
  return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
}

function pct(curr: number, prev: number) {
  return prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);
}

function sumField(arr: any[], field: string) {
  return arr.reduce((s: number, r: any) => s + (Number(r[field]) || 0), 0);
}

function safeDiv(num: number, den: number) {
  return den === 0 ? 0 : Math.round((num / den) * 10000) / 100; // 2-decimal %
}

function getDate(r: any) {
  return (r.recordedAt ?? r.recorded_at ?? r.createdAt ?? r.created_at ?? '').slice(0, 10);
}

function genId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/* ── GET /api/engagement/metrics?days=30 ──────────────────────────────────── */

router.get('/api/engagement/metrics', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const days = Math.min(parseInt(c.req.query('days') ?? '30'), 90);
  const blink = getBlink(c.env);
  const since = daysAgoISO(days);
  const prevSince = daysAgoISO(days * 2);
  const inCurrent = (dt: string) => dt >= since;
  const inPrev    = (dt: string) => dt >= prevSince && dt < since;

  try {
    const metrics = await blink.db.post_engagement_metrics.list({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      limit: 500,
    });

    const curMetrics  = metrics.filter((m: any) => inCurrent(getDate(m)));
    const prevMetrics = metrics.filter((m: any) => inPrev(getDate(m)));

    // ── KPIs with period-over-period change ──
    const kpis = {
      totalShares:      { value: sumField(curMetrics, 'shares'),      change: pct(sumField(curMetrics, 'shares'),      sumField(prevMetrics, 'shares')) },
      totalComments:    { value: sumField(curMetrics, 'comments'),    change: pct(sumField(curMetrics, 'comments'),    sumField(prevMetrics, 'comments')) },
      totalClicks:      { value: sumField(curMetrics, 'clicks'),      change: pct(sumField(curMetrics, 'clicks'),      sumField(prevMetrics, 'clicks')) },
      totalImpressions: { value: sumField(curMetrics, 'impressions'), change: pct(sumField(curMetrics, 'impressions'), sumField(prevMetrics, 'impressions')) },
      totalReach:       { value: sumField(curMetrics, 'reach'),       change: pct(sumField(curMetrics, 'reach'),       sumField(prevMetrics, 'reach')) },
      avgEngagementRate: {
        value: safeDiv(
          sumField(curMetrics, 'shares') + sumField(curMetrics, 'comments') + sumField(curMetrics, 'clicks'),
          sumField(curMetrics, 'impressions'),
        ),
        change: (() => {
          const curRate  = safeDiv(sumField(curMetrics, 'shares') + sumField(curMetrics, 'comments') + sumField(curMetrics, 'clicks'), sumField(curMetrics, 'impressions'));
          const prevRate = safeDiv(sumField(prevMetrics, 'shares') + sumField(prevMetrics, 'comments') + sumField(prevMetrics, 'clicks'), sumField(prevMetrics, 'impressions'));
          return pct(curRate, prevRate);
        })(),
      },
      avgCtr: {
        value: safeDiv(sumField(curMetrics, 'clicks'), sumField(curMetrics, 'impressions')),
        change: (() => {
          const curCtr  = safeDiv(sumField(curMetrics, 'clicks'), sumField(curMetrics, 'impressions'));
          const prevCtr = safeDiv(sumField(prevMetrics, 'clicks'), sumField(prevMetrics, 'impressions'));
          return pct(curCtr, prevCtr);
        })(),
      },
    };

    // ── Daily trend ──
    const trendDays = Math.min(days, 30);
    const byDate: Record<string, any[]> = {};
    curMetrics.forEach((m: any) => {
      const dt = getDate(m);
      if (!byDate[dt]) byDate[dt] = [];
      byDate[dt].push(m);
    });

    const trend = Array.from({ length: trendDays }, (_, i) => {
      const dt = daysAgoISO(trendDays - 1 - i);
      const rows = byDate[dt] || [];
      const shares      = sumField(rows, 'shares');
      const comments    = sumField(rows, 'comments');
      const clicks      = sumField(rows, 'clicks');
      const impressions = sumField(rows, 'impressions');
      const reach       = sumField(rows, 'reach');
      return {
        date: dt,
        shares,
        comments,
        clicks,
        impressions,
        reach,
        engagementRate: safeDiv(shares + comments + clicks, impressions),
        ctr: safeDiv(clicks, impressions),
      };
    });

    // ── Platform breakdown ──
    const platMap: Record<string, any[]> = {};
    curMetrics.forEach((m: any) => {
      const p = m.platform ?? 'unknown';
      if (!platMap[p]) platMap[p] = [];
      platMap[p].push(m);
    });

    const platformBreakdown = Object.entries(platMap).map(([platform, rows]) => {
      const shares      = sumField(rows, 'shares');
      const comments    = sumField(rows, 'comments');
      const clicks      = sumField(rows, 'clicks');
      const impressions = sumField(rows, 'impressions');
      const reach       = sumField(rows, 'reach');
      return {
        platform,
        shares,
        comments,
        clicks,
        impressions,
        reach,
        engagementRate: safeDiv(shares + comments + clicks, impressions),
        ctr: safeDiv(clicks, impressions),
      };
    });

    return c.json({ kpis, trend, platformBreakdown });
  } catch (err: any) {
    console.error('[EngagementMetrics] GET /metrics error:', err);
    return c.json({ error: err.message ?? 'Internal error' }, 500);
  }
});

/* ── GET /api/engagement/campaigns?days=30 ────────────────────────────────── */

router.get('/api/engagement/campaigns', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const days = Math.min(parseInt(c.req.query('days') ?? '30'), 90);
  const blink = getBlink(c.env);
  const since = daysAgoISO(days);

  try {
    const rows = await blink.db.campaign_performance.list({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      limit: 100,
    });

    // Filter to period and aggregate by utm_campaign
    const relevant = rows.filter((r: any) => (r.periodEnd ?? r.period_end ?? '') >= since);

    const campaigns = relevant.map((r: any) => ({
      campaign:        r.campaignName  ?? r.campaign_name  ?? '',
      utm_source:      r.utmSource     ?? r.utm_source     ?? '',
      utm_medium:      r.utmMedium     ?? r.utm_medium     ?? '',
      utm_campaign:    r.utmCampaign   ?? r.utm_campaign   ?? '',
      totalPosts:      Number(r.totalPosts)      ?? 0,
      totalImpressions:Number(r.totalImpressions) ?? 0,
      totalReach:      Number(r.totalReach)       ?? 0,
      totalClicks:     Number(r.totalClicks)      ?? 0,
      totalShares:     Number(r.totalShares)      ?? 0,
      totalComments:   Number(r.totalComments)    ?? 0,
      avgEngagementRate: Number(r.avgEngagementRate) ?? 0,
      avgCtr:          Number(r.avgCtr)           ?? 0,
      periodStart:     r.periodStart   ?? r.period_start  ?? '',
      periodEnd:       r.periodEnd     ?? r.period_end    ?? '',
    }));

    // Sort by totalReach desc
    campaigns.sort((a: any, b: any) => b.totalReach - a.totalReach);

    return c.json({ campaigns });
  } catch (err: any) {
    console.error('[EngagementMetrics] GET /campaigns error:', err);
    return c.json({ error: err.message ?? 'Internal error' }, 500);
  }
});

/* ── POST /api/engagement/record ──────────────────────────────────────────── */

router.post('/api/engagement/record', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const blink = getBlink(c.env);

  try {
    const body = await c.req.json();
    const {
      postId,
      platform,
      shares = 0,
      comments = 0,
      clicks = 0,
      impressions = 0,
      reach = 0,
      utm_source = '',
      utm_medium = '',
      utm_campaign = '',
    } = body;

    if (!postId) return c.json({ error: 'postId is required' }, 400);

    const numImpressions = Number(impressions) || 0;
    const numShares   = Number(shares)   || 0;
    const numComments = Number(comments) || 0;
    const numClicks   = Number(clicks)   || 0;
    const numReach    = Number(reach)    || 0;

    const engagementRate = safeDiv(numShares + numComments + numClicks, numImpressions);
    const ctr = safeDiv(numClicks, numImpressions);

    const now = new Date().toISOString();

    // Check if a metric already exists for this post
    const existing = await blink.db.post_engagement_metrics.list({
      where: { AND: [{ userId }, { postId }] },
      limit: 1,
    });

    if (existing.length > 0) {
      await blink.db.post_engagement_metrics.update(existing[0].id, {
        platform,
        shares: numShares,
        comments: numComments,
        clicks: numClicks,
        impressions: numImpressions,
        reach: numReach,
        engagementRate,
        ctr,
        utmSource:   utm_source,
        utmMedium:   utm_medium,
        utmCampaign: utm_campaign,
        updatedAt: now,
      });
    } else {
      await blink.db.post_engagement_metrics.create({
        id: genId('pem'),
        userId,
        postId,
        platform,
        shares: numShares,
        comments: numComments,
        clicks: numClicks,
        impressions: numImpressions,
        reach: numReach,
        engagementRate,
        ctr,
        utmSource:   utm_source,
        utmMedium:   utm_medium,
        utmCampaign: utm_campaign,
        recordedAt: now,
      });
    }

    // Also update the scheduled_posts row with engagement data
    try {
      const posts = await blink.db.scheduled_posts.list({
        where: { AND: [{ userId }, { id: postId }] },
        limit: 1,
      });
      if (posts.length > 0) {
        await blink.db.scheduled_posts.update(postId, {
          shares: numShares,
          comments: numComments,
          clicks: numClicks,
          impressions: numImpressions,
          reach: numReach,
          engagementRate,
          ctr,
          updatedAt: now,
        });
      }
    } catch (syncErr) {
      console.warn('[EngagementMetrics] Failed to sync scheduled_post:', syncErr);
    }

    return c.json({ ok: true, engagementRate, ctr });
  } catch (err: any) {
    console.error('[EngagementMetrics] POST /record error:', err);
    return c.json({ error: err.message ?? 'Internal error' }, 500);
  }
});

/* ── POST /api/engagement/sync-campaigns ──────────────────────────────────── */

router.post('/api/engagement/sync-campaigns', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const blink = getBlink(c.env);

  try {
    const metrics = await blink.db.post_engagement_metrics.list({
      where: { userId },
      limit: 1000,
    });

    if (metrics.length === 0) {
      return c.json({ ok: true, campaignsSynced: 0 });
    }

    // Group by (utm_source, utm_medium, utm_campaign)
    const groups: Record<string, any[]> = {};
    metrics.forEach((m: any) => {
      const src = m.utmSource ?? m.utm_source ?? '';
      const med = m.utmMedium ?? m.utm_medium ?? '';
      const camp = m.utmCampaign ?? m.utm_campaign ?? '';
      const key = `${src}||${med}||${camp}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });

    let synced = 0;
    const now = new Date().toISOString();

    for (const [key, rows] of Object.entries(groups)) {
      const [utmSource, utmMedium, utmCampaign] = key.split('||');

      // Derive campaign name from utm_campaign or utm_source
      const campaignName = utmCampaign || utmSource || 'untagged';

      const totalPosts      = rows.length;
      const totalShares     = sumField(rows, 'shares');
      const totalComments   = sumField(rows, 'comments');
      const totalClicks     = sumField(rows, 'clicks');
      const totalImpressions= sumField(rows, 'impressions');
      const totalReach      = sumField(rows, 'reach');
      const avgEngagementRate = safeDiv(totalShares + totalComments + totalClicks, totalImpressions);
      const avgCtr          = safeDiv(totalClicks, totalImpressions);

      // Determine period boundaries
      const dates = rows.map((r: any) => getDate(r)).filter(Boolean).sort();
      const periodStart = dates[0] || daysAgoISO(30);
      const periodEnd   = dates[dates.length - 1] || new Date().toISOString().slice(0, 10);

      // Check if a campaign_performance row exists for this grouping
      const existing = await blink.db.campaign_performance.list({
        where: {
          AND: [
            { userId },
            { utmSource: utmSource || '' },
            { utmMedium: utmMedium || '' },
            { utmCampaign: utmCampaign || '' },
          ],
        },
        limit: 1,
      });

      const payload = {
        campaignName,
        utmSource,
        utmMedium,
        utmCampaign,
        totalPosts,
        totalImpressions,
        totalReach,
        totalClicks,
        totalShares,
        totalComments,
        avgEngagementRate,
        avgCtr,
        periodStart,
        periodEnd,
        updatedAt: now,
      };

      if (existing.length > 0) {
        await blink.db.campaign_performance.update(existing[0].id, payload);
      } else {
        await blink.db.campaign_performance.create({
          id: genId('cp'),
          userId,
          ...payload,
        });
      }
      synced++;
    }

    return c.json({ ok: true, campaignsSynced: synced });
  } catch (err: any) {
    console.error('[EngagementMetrics] POST /sync-campaigns error:', err);
    return c.json({ error: err.message ?? 'Internal error' }, 500);
  }
});
