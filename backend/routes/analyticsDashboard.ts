/**
 * Analytics Dashboard — Aggregated KPIs from Blink DB
 * GET /api/analytics/dashboard?days=30
 */
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

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
  return den === 0 ? 0 : Math.round((num / den) * 10000) / 100;
}

function getISOWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function getMonth(dateStr: string): string {
  return dateStr.slice(0, 7); // "YYYY-MM"
}

router.get('/api/analytics/dashboard', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const days = Math.min(parseInt(c.req.query('days') ?? '30'), 90);
  const blink = getBlink(c.env);
  const since = daysAgoISO(days);
  const prevSince = daysAgoISO(days * 2);
  const inCurrent = (dt: string) => dt >= since;
  const inPrev = (dt: string) => dt >= prevSince && dt < since;

  try {
    const [dailyAnalytics, scheduledPosts, messages, capturedLeads, smsCredits, creativeReports, referralLinks, engagementMetrics, campaigns] =
      await Promise.all([
        blink.db.daily_analytics.list({ where: { userId }, orderBy: { snapshotDate: 'desc' }, limit: 90 }),
        blink.db.scheduled_posts.list({ where: { userId }, orderBy: { createdAt: 'desc' }, limit: 200 }),
        blink.db.messages.list({ where: { userId }, orderBy: { createdAt: 'desc' }, limit: 200 }),
        blink.db.captured_leads.list({ where: { userId }, orderBy: { createdAt: 'desc' }, limit: 200 }),
        blink.db.sms_credits.list({ where: { userId }, limit: 1 }),
        blink.db.creative_reports.list({ where: { userId }, orderBy: { createdAt: 'desc' }, limit: 50 }),
        blink.db.referral_links.list({ where: { userId }, orderBy: { createdAt: 'desc' }, limit: 100 }),
        blink.db.post_engagement_metrics.list({ where: { userId }, orderBy: { createdAt: 'desc' }, limit: 500 }),
        blink.db.campaign_performance.list({ where: { userId }, orderBy: { createdAt: 'desc' }, limit: 100 }),
      ]);

    const getDate = (r: any) => (r.snapshotDate ?? r.createdAt ?? r.created_at ?? '').slice(0, 10);

    const curDA  = dailyAnalytics.filter((d: any) => inCurrent(getDate(d)));
    const prevDA = dailyAnalytics.filter((d: any) => inPrev(getDate(d)));
    const curPosts  = scheduledPosts.filter((p: any) => inCurrent(getDate(p)));
    const prevPosts = scheduledPosts.filter((p: any) => inPrev(getDate(p)));
    const curMsgs   = messages.filter((m: any) => inCurrent(getDate(m)));
    const prevMsgs  = messages.filter((m: any) => inPrev(getDate(m)));
    const curLeads  = capturedLeads.filter((l: any) => inCurrent(getDate(l)));
    const prevLeads = capturedLeads.filter((l: any) => inPrev(getDate(l)));
    const curReports = creativeReports.filter((r: any) => inCurrent(getDate(r)));
    const curRefs    = referralLinks.filter((r: any) => inCurrent(getDate(r)));

    // ── Engagement metrics (current vs previous period) ──
    const curEngagement  = engagementMetrics.filter((m: any) => inCurrent(getDate(m)));
    const prevEngagement = engagementMetrics.filter((m: any) => inPrev(getDate(m)));

    // ── Daily engagement trend ──
    const engByDate: Record<string, any[]> = {};
    curEngagement.forEach((m: any) => {
      const dt = getDate(m);
      if (!engByDate[dt]) engByDate[dt] = [];
      engByDate[dt].push(m);
    });

    const engagementTrendDays = Math.min(days, 30);
    const engagementTrend = Array.from({ length: engagementTrendDays }, (_, i) => {
      const dt = daysAgoISO(engagementTrendDays - 1 - i);
      const rows = engByDate[dt] || [];
      const sh = sumField(rows, 'shares');
      const cm = sumField(rows, 'comments');
      const cl = sumField(rows, 'clicks');
      const im = sumField(rows, 'impressions');
      const re = sumField(rows, 'reach');
      return { date: dt, shares: sh, comments: cm, clicks: cl, impressions: im, reach: re, engagementRate: safeDiv(sh + cm + cl, im), ctr: safeDiv(cl, im) };
    });

    // ── Platform breakdown from engagement ──
    const platMap: Record<string, any[]> = {};
    curEngagement.forEach((m: any) => {
      const p = m.platform ?? 'unknown';
      if (!platMap[p]) platMap[p] = [];
      platMap[p].push(m);
    });
    const platformBreakdown = Object.entries(platMap).map(([platform, rows]) => {
      const sh = sumField(rows, 'shares');
      const cm = sumField(rows, 'comments');
      const cl = sumField(rows, 'clicks');
      const im = sumField(rows, 'impressions');
      const re = sumField(rows, 'reach');
      return { platform, shares: sh, comments: cm, clicks: cl, impressions: im, reach: re, engagementRate: safeDiv(sh + cm + cl, im), ctr: safeDiv(cl, im) };
    });

    // ── Campaigns from campaign_performance table ──
    const campaignsList = campaigns.map((r: any) => ({
      campaign: r.campaignName ?? r.campaign_name ?? '',
      utm_source: r.utmSource ?? r.utm_source ?? '',
      utm_medium: r.utmMedium ?? r.utm_medium ?? '',
      utm_campaign: r.utmCampaign ?? r.utm_campaign ?? '',
      totalPosts: Number(r.totalPosts) || 0,
      totalImpressions: Number(r.totalImpressions) || 0,
      totalReach: Number(r.totalReach) || 0,
      totalClicks: Number(r.totalClicks) || 0,
      totalShares: Number(r.totalShares) || 0,
      totalComments: Number(r.totalComments) || 0,
      avgEngagementRate: Number(r.avgEngagementRate) || 0,
      avgCtr: Number(r.avgCtr) || 0,
      periodStart: r.periodStart ?? r.period_start ?? '',
      periodEnd: r.periodEnd ?? r.period_end ?? '',
    }));

    // ── Weekly comparison (this week vs last week) ──
    const today = new Date();
    const dayOfWeek = today.getUTCDay() || 7;
    const thisWeekStart = daysAgoISO(dayOfWeek - 1);
    const lastWeekStart = daysAgoISO(dayOfWeek - 1 + 7);
    const lastWeekEnd = thisWeekStart;

    const curWeekMetrics = engagementMetrics.filter((m: any) => getDate(m) >= thisWeekStart);
    const prevWeekMetrics = engagementMetrics.filter((m: any) => {
      const dt = getDate(m);
      return dt >= lastWeekStart && dt < lastWeekEnd;
    });

    const weekShares = sumField(curWeekMetrics, 'shares');
    const weekComments = sumField(curWeekMetrics, 'comments');
    const weekClicks = sumField(curWeekMetrics, 'clicks');
    const weekImpressions = sumField(curWeekMetrics, 'impressions');
    const weekReach = sumField(curWeekMetrics, 'reach');

    const prevWeekShares = sumField(prevWeekMetrics, 'shares');
    const prevWeekComments = sumField(prevWeekMetrics, 'comments');
    const prevWeekClicks = sumField(prevWeekMetrics, 'clicks');
    const prevWeekImpressions = sumField(prevWeekMetrics, 'impressions');
    const prevWeekReach = sumField(prevWeekMetrics, 'reach');

    const weeklyComparison = {
      current: { shares: weekShares, comments: weekComments, clicks: weekClicks, impressions: weekImpressions, reach: weekReach, engagementRate: safeDiv(weekShares + weekComments + weekClicks, weekImpressions), ctr: safeDiv(weekClicks, weekImpressions) },
      previous: { shares: prevWeekShares, comments: prevWeekComments, clicks: prevWeekClicks, impressions: prevWeekImpressions, reach: prevWeekReach, engagementRate: safeDiv(prevWeekShares + prevWeekComments + prevWeekClicks, prevWeekImpressions), ctr: safeDiv(prevWeekClicks, prevWeekImpressions) },
      changes: { shares: pct(weekShares, prevWeekShares), comments: pct(weekComments, prevWeekComments), clicks: pct(weekClicks, prevWeekClicks), impressions: pct(weekImpressions, prevWeekImpressions), reach: pct(weekReach, prevWeekReach), engagementRate: pct(safeDiv(weekShares + weekComments + weekClicks, weekImpressions), safeDiv(prevWeekShares + prevWeekComments + prevWeekClicks, prevWeekImpressions)), ctr: pct(safeDiv(weekClicks, weekImpressions), safeDiv(prevWeekClicks, prevWeekImpressions)) },
    };

    // ── Monthly comparison (this month vs last month) ──
    const curMonth = new Date().toISOString().slice(0, 7);
    const prevMonthDate = new Date();
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const prevMonth = prevMonthDate.toISOString().slice(0, 7);

    const curMonthMetrics = engagementMetrics.filter((m: any) => getMonth(getDate(m)) === curMonth);
    const prevMonthMetrics = engagementMetrics.filter((m: any) => getMonth(getDate(m)) === prevMonth);

    const moShares = sumField(curMonthMetrics, 'shares');
    const moComments = sumField(curMonthMetrics, 'comments');
    const moClicks = sumField(curMonthMetrics, 'clicks');
    const moImpressions = sumField(curMonthMetrics, 'impressions');
    const moReach = sumField(curMonthMetrics, 'reach');

    const prevMoShares = sumField(prevMonthMetrics, 'shares');
    const prevMoComments = sumField(prevMonthMetrics, 'comments');
    const prevMoClicks = sumField(prevMonthMetrics, 'clicks');
    const prevMoImpressions = sumField(prevMonthMetrics, 'impressions');
    const prevMoReach = sumField(prevMonthMetrics, 'reach');

    const monthlyComparison = {
      current: { shares: moShares, comments: moComments, clicks: moClicks, impressions: moImpressions, reach: moReach, engagementRate: safeDiv(moShares + moComments + moClicks, moImpressions), ctr: safeDiv(moClicks, moImpressions) },
      previous: { shares: prevMoShares, comments: prevMoComments, clicks: prevMoClicks, impressions: prevMoImpressions, reach: prevMoReach, engagementRate: safeDiv(prevMoShares + prevMoComments + prevMoClicks, prevMoImpressions), ctr: safeDiv(prevMoClicks, prevMoImpressions) },
      changes: { shares: pct(moShares, prevMoShares), comments: pct(moComments, prevMoComments), clicks: pct(moClicks, prevMoClicks), impressions: pct(moImpressions, prevMoImpressions), reach: pct(moReach, prevMoReach), engagementRate: pct(safeDiv(moShares + moComments + moClicks, moImpressions), safeDiv(prevMoShares + prevMoComments + prevMoClicks, prevMoImpressions)), ctr: pct(safeDiv(moClicks, moImpressions), safeDiv(prevMoClicks, prevMoImpressions)) },
    };

    // ── UTM campaigns from scheduled_posts ──
    const utmGroupMap: Record<string, any[]> = {};
    scheduledPosts.forEach((p: any) => {
      const src = p.utmSource ?? p.utm_source ?? '';
      const med = p.utmMedium ?? p.utm_medium ?? '';
      const camp = p.utmCampaign ?? p.utm_campaign ?? '';
      if (!camp && !src) return; // skip untagged
      const key = `${src}||${med}||${camp}`;
      if (!utmGroupMap[key]) utmGroupMap[key] = [];
      utmGroupMap[key].push(p);
    });

    const utmCampaigns = Object.entries(utmGroupMap).map(([key, rows]) => {
      const [utmSource, utmMedium, utmCampaign] = key.split('||');
      return {
        campaign: utmCampaign || utmSource || 'untagged',
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        totalPosts: rows.length,
        totalImpressions: sumField(rows, 'impressions'),
        totalReach: sumField(rows, 'reach'),
        totalClicks: sumField(rows, 'clicks'),
        totalShares: sumField(rows, 'shares'),
        totalComments: sumField(rows, 'comments'),
      };
    });

    const avgGeo = (arr: any[]) => arr.length ? Math.round(sumField(arr, 'geoScore') / arr.length) : 0;
    const kpiGeo = avgGeo(curDA); const kpiGeoPrev = avgGeo(prevDA);

    const sms = (smsCredits[0] as any) ?? {};
    const totalClicks = sumField(referralLinks, 'clickCount');
    const totalConversions = sumField(referralLinks, 'conversionCount');
    const totalAdsAnalyzed = sumField(creativeReports, 'adsAnalyzed');
    const totalBudgetWaste = sumField(creativeReports, 'budgetWasteDetected');

    const channelCount: Record<string, number> = {};
    scheduledPosts.forEach((p: any) => {
      let chs: string[] = []; try { chs = JSON.parse(p.channels || '[]'); } catch {}
      chs.forEach((ch: string) => { channelCount[ch] = (channelCount[ch] || 0) + 1; });
    });

    const daByDate: Record<string, any> = {};
    dailyAnalytics.forEach((d: any) => { const dt = getDate(d); if (dt) daByDate[dt] = d; });
    const leadsByDate: Record<string, number> = {};
    capturedLeads.forEach((l: any) => { const dt = getDate(l); if (dt) leadsByDate[dt] = (leadsByDate[dt] || 0) + 1; });
    const msgsByDate: Record<string, number> = {};
    messages.forEach((m: any) => { const dt = getDate(m); if (dt) msgsByDate[dt] = (msgsByDate[dt] || 0) + 1; });
    const postsByDate: Record<string, number> = {};
    scheduledPosts.forEach((p: any) => { const dt = getDate(p); if (dt) postsByDate[dt] = (postsByDate[dt] || 0) + 1; });

    const trendDays = Math.min(days, 30);
    const trend = Array.from({ length: trendDays }, (_, i) => {
      const dt = daysAgoISO(trendDays - 1 - i);
      const da = daByDate[dt];
      return { date: dt, geoScore: Number(da?.geoScore) || 0, posts: postsByDate[dt] || Number(da?.postsPublished) || 0, reviews: Number(da?.reviewsHandled) || 0, leads: leadsByDate[dt] || 0, messages: msgsByDate[dt] || 0 };
    });

    const heatmap: Record<string, number> = {};
    scheduledPosts.forEach((p: any) => {
      if (!p.scheduledAt) return;
      const d = new Date(p.scheduledAt);
      const key = `${d.getDay()}-${d.getHours()}`;
      heatmap[key] = (heatmap[key] || 0) + 1;
    });

    const postsByStatus = curPosts.reduce((acc: Record<string, number>, p: any) => {
      acc[p.status] = (acc[p.status] || 0) + 1; return acc;
    }, {});

    return c.json({
      period: { days, since, until: new Date().toISOString().slice(0, 10) },
      kpis: {
        geoScore:           { value: kpiGeo,               change: pct(kpiGeo, kpiGeoPrev) },
        postsPublished:     { value: sumField(curDA, 'postsPublished'), change: pct(sumField(curDA, 'postsPublished'), sumField(prevDA, 'postsPublished')) },
        reviewsHandled:     { value: sumField(curDA, 'reviewsHandled'), change: pct(sumField(curDA, 'reviewsHandled'), sumField(prevDA, 'reviewsHandled')) },
        unhandledReviews:   { value: Number(curDA[0]?.unhandledReviews) || 0, change: 0 },
        inboxMessages:      { value: curMsgs.length,       change: pct(curMsgs.length, prevMsgs.length) },
        unreadMessages:     { value: messages.filter((m: any) => !Number(m.isRead)).length, change: 0 },
        leadsCapture:       { value: curLeads.length,      change: pct(curLeads.length, prevLeads.length) },
        leadsBySms:         { value: capturedLeads.filter((l: any) => Number(l.smsSent) > 0).length, change: 0 },
        smsBalance:         { value: Number(sms.balance) || 0, change: 0 },
        smsUsed:            { value: Number(sms.totalUsed) || 0, change: 0 },
        smsMonthlyQuota:    { value: Number(sms.planMonthlyQuota) || 50, change: 0 },
        totalPosts:         { value: curPosts.length,      change: pct(curPosts.length, prevPosts.length) },
        adsAnalyzed:        { value: totalAdsAnalyzed,     change: 0 },
        budgetWasteSaved:   { value: totalBudgetWaste,     change: 0 },
        creativeReports:    { value: curReports.length,    change: 0 },
        referralClicks:     { value: totalClicks,          change: 0 },
        referralConversions:{ value: totalConversions,     change: 0 },
        referralLinks:      { value: curRefs.length,       change: 0 },
      },
      charts: {
        trend,
        postsByStatus,
        channelBreakdown: Object.entries(channelCount).map(([channel, count]) => ({ channel, count })),
        heatmap: Object.entries(heatmap).map(([key, count]) => {
          const [day, hour] = key.split('-').map(Number);
          return { day, hour, count };
        }),
      },
      totals: {
        allTimePosts: scheduledPosts.length,
        allTimeLeads: capturedLeads.length,
        allTimeMessages: messages.length,
        allTimeCreativeReports: creativeReports.length,
        allTimeReferralClicks: totalClicks,
      },
      engagement: {
        kpis: {
          totalShares:      { value: sumField(curEngagement, 'shares'),      change: pct(sumField(curEngagement, 'shares'),      sumField(prevEngagement, 'shares')) },
          totalComments:    { value: sumField(curEngagement, 'comments'),    change: pct(sumField(curEngagement, 'comments'),    sumField(prevEngagement, 'comments')) },
          totalClicks:      { value: sumField(curEngagement, 'clicks'),      change: pct(sumField(curEngagement, 'clicks'),      sumField(prevEngagement, 'clicks')) },
          totalImpressions: { value: sumField(curEngagement, 'impressions'), change: pct(sumField(curEngagement, 'impressions'), sumField(prevEngagement, 'impressions')) },
          totalReach:       { value: sumField(curEngagement, 'reach'),       change: pct(sumField(curEngagement, 'reach'),       sumField(prevEngagement, 'reach')) },
          avgEngagementRate: {
            value: safeDiv(sumField(curEngagement, 'shares') + sumField(curEngagement, 'comments') + sumField(curEngagement, 'clicks'), sumField(curEngagement, 'impressions')),
            change: pct(
              safeDiv(sumField(curEngagement, 'shares') + sumField(curEngagement, 'comments') + sumField(curEngagement, 'clicks'), sumField(curEngagement, 'impressions')),
              safeDiv(sumField(prevEngagement, 'shares') + sumField(prevEngagement, 'comments') + sumField(prevEngagement, 'clicks'), sumField(prevEngagement, 'impressions')),
            ),
          },
          avgCtr: {
            value: safeDiv(sumField(curEngagement, 'clicks'), sumField(curEngagement, 'impressions')),
            change: pct(
              safeDiv(sumField(curEngagement, 'clicks'), sumField(curEngagement, 'impressions')),
              safeDiv(sumField(prevEngagement, 'clicks'), sumField(prevEngagement, 'impressions')),
            ),
          },
        },
        trend: engagementTrend,
        platformBreakdown,
        campaigns: campaignsList,
        weeklyComparison,
        monthlyComparison,
      },
      utmCampaigns,
    });
  } catch (err: any) {
    console.error('[AnalyticsDashboard] error:', err);
    return c.json({ error: err.message ?? 'Internal error' }, 500);
  }
});
