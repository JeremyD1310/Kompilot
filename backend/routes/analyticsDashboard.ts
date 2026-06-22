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
    const [dailyAnalytics, scheduledPosts, messages, capturedLeads, smsCredits, creativeReports, referralLinks] =
      await Promise.all([
        blink.db.daily_analytics.list({ where: { userId }, orderBy: { snapshotDate: 'desc' }, limit: 90 }),
        blink.db.scheduled_posts.list({ where: { userId }, orderBy: { createdAt: 'desc' }, limit: 200 }),
        blink.db.messages.list({ where: { userId }, orderBy: { createdAt: 'desc' }, limit: 200 }),
        blink.db.captured_leads.list({ where: { userId }, orderBy: { createdAt: 'desc' }, limit: 200 }),
        blink.db.sms_credits.list({ where: { userId }, limit: 1 }),
        blink.db.creative_reports.list({ where: { userId }, orderBy: { createdAt: 'desc' }, limit: 50 }),
        blink.db.referral_links.list({ where: { userId }, orderBy: { createdAt: 'desc' }, limit: 100 }),
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
    });
  } catch (err: any) {
    console.error('[AnalyticsDashboard] error:', err);
    return c.json({ error: err.message ?? 'Internal error' }, 500);
  }
});
