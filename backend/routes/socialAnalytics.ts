/**
 * Social Analytics Routes
 *
 * Aggregates analytics data from scheduled_posts and post_engagement_metrics
 * tables for the social dashboard.
 *
 * GET /api/social-analytics/overview — Returns aggregated analytics by platform
 * GET /api/social-analytics/tiktok-metrics — Returns per-post TikTok video metrics
 */

import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import { createSecureTokenStore } from '../lib/secureTokenStore';
import { tiktokApiCall } from '../lib/tiktokService';
import { getUserPages, getInstagramMedia } from '../lib/metaPublishingService';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

async function getUserId(authHeader: string | undefined, env: Env): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const blink = createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });
    const auth = await blink.auth.verifyToken(authHeader);
    return auth.valid && auth.userId ? auth.userId : null;
  } catch { return null; }
}

// ── GET /api/social-analytics/overview ───────────────────────────────────────

router.get('/api/social-analytics/overview', async (c) => {
  const userId = await getUserId(c.req.header('Authorization'), c.env as unknown as Env);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const days = parseInt(c.req.query('days') || '30', 10);
  const env = c.env as unknown as Env;
  const blink = createClient({
    projectId: requireBlinkProjectId(env),
    secretKey: env.BLINK_SECRET_KEY,
  });

  try {
    // Fetch all user's scheduled posts
    const allPosts = await (blink.db.table('scheduled_posts') as any).list({
      where: { userId },
      limit: 1000,
    });

    // Fetch all user's engagement metrics
    const allMetrics = await (blink.db.table('post_engagement_metrics') as any).list({
      where: { userId },
      limit: 1000,
    });

    // ── Posts by platform ─────────────────────────────────────────────────
    const postsByPlatform: Record<string, number> = {};
    const now = new Date();
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    for (const post of allPosts as any[]) {
      let channels: string[] = [];
      try { channels = JSON.parse(post.channels || '[]'); } catch { channels = []; }
      for (const ch of channels) {
        postsByPlatform[ch] = (postsByPlatform[ch] || 0) + 1;
      }
    }

    // ── Engagement metrics by platform ────────────────────────────────────
    const platformMetrics: Record<string, {
      impressions: number; clicks: number; shares: number;
      comments: number; reach: number; engagementRateSum: number; count: number;
    }> = {};

    for (const m of allMetrics as any[]) {
      const platform = m.platform || 'unknown';
      if (!platformMetrics[platform]) {
        platformMetrics[platform] = { impressions: 0, clicks: 0, shares: 0, comments: 0, reach: 0, engagementRateSum: 0, count: 0 };
      }
      const pm = platformMetrics[platform];
      pm.impressions += Number(m.impressions) || 0;
      pm.clicks += Number(m.clicks) || 0;
      pm.shares += Number(m.shares) || 0;
      pm.comments += Number(m.comments) || 0;
      pm.reach += Number(m.reach) || 0;
      pm.engagementRateSum += Number(m.engagementRate) || 0;
      pm.count++;
    }

    const platformBreakdown: Record<string, {
      impressions: number; clicks: number; shares: number;
      comments: number; reach: number; avgEngagementRate: number; postCount: number;
    }> = {};

    for (const [platform, pm] of Object.entries(platformMetrics)) {
      platformBreakdown[platform] = {
        impressions: pm.impressions,
        clicks: pm.clicks,
        shares: pm.shares,
        comments: pm.comments,
        reach: pm.reach,
        avgEngagementRate: pm.count > 0 ? Math.round((pm.engagementRateSum / pm.count) * 100) / 100 : 0,
        postCount: pm.count,
      };
    }

    // ── Posts trend (last N days, daily count) ────────────────────────────
    const dailyCounts: Record<string, number> = {};
    // Pre-fill all days with 0
    for (let i = 0; i < days; i++) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      dailyCounts[key] = 0;
    }

    for (const post of allPosts as any[]) {
      const createdAt = post.createdAt;
      if (!createdAt) continue;
      const postDate = new Date(createdAt);
      if (postDate >= cutoff) {
        const key = postDate.toISOString().split('T')[0];
        if (key in dailyCounts) dailyCounts[key]++;
      }
    }

    const postsTrend = Object.entries(dailyCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    // ── Top performing posts ──────────────────────────────────────────────
    const postsWithMetrics = (allPosts as any[]).map((post: any) => {
      const metrics = (allMetrics as any[]).filter(m => m.postId === post.id);
      const totalImpressions = metrics.reduce((s: number, m: any) => s + (Number(m.impressions) || 0), 0);
      const totalClicks = metrics.reduce((s: number, m: any) => s + (Number(m.clicks) || 0), 0);
      const totalEngagement = metrics.reduce((s: number, m: any) => s + (Number(m.engagementRate) || 0), 0);
      return { ...post, totalImpressions, totalClicks, totalEngagement };
    });

    const topPosts = postsWithMetrics
      .sort((a: any, b: any) => b.totalImpressions - a.totalImpressions)
      .slice(0, 10)
      .map((p: any) => ({
        id: p.id,
        text: p.textContent?.substring(0, 120) || '',
        status: p.status,
        createdAt: p.createdAt,
        impressions: p.totalImpressions,
        clicks: p.totalClicks,
      }));

    // ── Summary totals ────────────────────────────────────────────────────
    const totalImpressions = Object.values(platformBreakdown).reduce((s, p) => s + p.impressions, 0);
    const totalClicks = Object.values(platformBreakdown).reduce((s, p) => s + p.clicks, 0);
    const totalShares = Object.values(platformBreakdown).reduce((s, p) => s + p.shares, 0);
    const totalComments = Object.values(platformBreakdown).reduce((s, p) => s + p.comments, 0);
    const totalPosts = (allPosts as any[]).length;

    return c.json({
      summary: { totalPosts, totalImpressions, totalClicks, totalShares, totalComments },
      postsByPlatform,
      platformBreakdown,
      postsTrend,
      topPosts,
      period: { days, from: cutoff.toISOString(), to: now.toISOString() },
    });
  } catch (err) {
    return c.json({ error: 'Failed to fetch analytics', details: err instanceof Error ? err.message : 'Unknown' }, 500);
  }
});

// ── GET /api/social-analytics/tiktok-metrics ────────────────────────────────

router.get('/api/social-analytics/tiktok-metrics', async (c) => {
  const userId = await getUserId(c.req.header('Authorization'), c.env as unknown as Env);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const blink = createClient({
    projectId: requireBlinkProjectId(env),
    secretKey: env.BLINK_SECRET_KEY,
  });

  // ── Cache check: return DB metrics if synced within last 6 hours ────────
  try {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const cachedMetrics = await (blink.db.table('post_engagement_metrics') as any).list({
      where: { AND: [{ userId }, { platform: 'tiktok' }] },
      limit: 1000,
    });
    const recent = (cachedMetrics as any[]).filter((m: any) => m.recordedAt && m.recordedAt >= sixHoursAgo);
    if (recent.length > 0) {
      const videos = recent.map((m: any) => ({
        videoId: m.postId || m.id,
        title: '',
        likes: Number(m.clicks) || 0,
        comments: Number(m.comments) || 0,
        shares: Number(m.shares) || 0,
        views: Number(m.impressions) || 0,
        createTime: m.recordedAt ? Math.floor(new Date(m.recordedAt).getTime() / 1000) : 0,
      }));
      return c.json({ videos, total: videos.length, cached: true });
    }
  } catch { /* cache miss — fall through to live API */ }

  const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);
  const tokens = await store.getByUser(userId, 'tiktok');

  if (!tokens) return c.json({ error: 'Not connected to TikTok' }, 400);

  try {
    const decrypted = await store.decryptAccessToken(tokens.accessToken);

    // Fetch all videos with cursor pagination
    const allVideos: Array<{
      videoId: string; title: string; likes: number;
      comments: number; shares: number; views: number; createTime: number;
    }> = [];

    let cursor: string | undefined = undefined;
    let hasMore = true;
    const maxPages = 10; // safety limit

    for (let page = 0; page < maxPages && hasMore; page++) {
      const body: Record<string, unknown> = {
        fields: 'id,title,like_count,comment_count,share_count,view_count,create_time',
      };
      if (cursor) body.cursor = cursor;

      const result = await tiktokApiCall<{
        data?: {
          videos?: Array<{
            id: string; title: string; like_count: number;
            comment_count: number; share_count: number; view_count: number; create_time: number;
          }>;
          cursor?: string;
          has_more?: boolean;
        };
        error?: { code: string; message: string };
      }>('/v2/video/list/?fields=id,title,like_count,comment_count,share_count,view_count,create_time', decrypted, {
        method: 'POST',
        body,
      });

      if (result.error) {
        throw new Error(result.error.message || 'TikTok API error');
      }

      const videos = result.data?.videos ?? [];
      for (const v of videos) {
        allVideos.push({
          videoId: v.id,
          title: v.title || '',
          likes: v.like_count || 0,
          comments: v.comment_count || 0,
          shares: v.share_count || 0,
          views: v.view_count || 0,
          createTime: v.create_time || 0,
        });
      }

      cursor = result.data?.cursor;
      hasMore = result.data?.has_more === true && !!cursor;
    }

    return c.json({ videos: allVideos, total: allVideos.length });
  } catch (err) {
    return c.json({ error: 'Failed to fetch TikTok metrics', details: err instanceof Error ? err.message : 'Unknown' }, 500);
  }
});

// ── GET /api/social-analytics/compare ────────────────────────────────────────

router.get('/api/social-analytics/compare', async (c) => {
  const userId = await getUserId(c.req.header('Authorization'), c.env as unknown as Env);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const days = parseInt(c.req.query('days') || '30', 10);
  const compareDays = parseInt(c.req.query('compareDays') || '60', 10);
  const env = c.env as unknown as Env;
  const blink = createClient({
    projectId: requireBlinkProjectId(env),
    secretKey: env.BLINK_SECRET_KEY,
  });

  try {
    // Fetch all user's scheduled posts and engagement metrics
    const allPosts = await (blink.db.table('scheduled_posts') as any).list({
      where: { userId },
      limit: 1000,
    });
    const allMetrics = await (blink.db.table('post_engagement_metrics') as any).list({
      where: { userId },
      limit: 1000,
    });

    const now = new Date();
    const currentCutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousCutoff = new Date(now.getTime() - compareDays * 24 * 60 * 60 * 1000);

    // Filter posts into current and previous periods
    const currentPosts = (allPosts as any[]).filter(p => {
      if (!p.createdAt) return false;
      const d = new Date(p.createdAt);
      return d >= currentCutoff;
    });
    const previousPosts = (allPosts as any[]).filter(p => {
      if (!p.createdAt) return false;
      const d = new Date(p.createdAt);
      return d < currentCutoff && d >= previousCutoff;
    });

    // Filter metrics into current and previous periods
    const currentMetrics = (allMetrics as any[]).filter(m => {
      if (!m.recordedAt) return false;
      const d = new Date(m.recordedAt);
      return d >= currentCutoff;
    });
    const previousMetrics = (allMetrics as any[]).filter(m => {
      if (!m.recordedAt) return false;
      const d = new Date(m.recordedAt);
      return d < currentCutoff && d >= previousCutoff;
    });

    // Aggregate helper
    function aggregate(posts: any[], metrics: any[]) {
      const totalImpressions = metrics.reduce((s, m) => s + (Number(m.impressions) || 0), 0);
      const totalClicks = metrics.reduce((s, m) => s + (Number(m.clicks) || 0), 0);
      const totalShares = metrics.reduce((s, m) => s + (Number(m.shares) || 0), 0);
      const totalComments = metrics.reduce((s, m) => s + (Number(m.comments) || 0), 0);
      const totalPosts = posts.length;
      const rateSum = metrics.reduce((s, m) => s + (Number(m.engagementRate) || 0), 0);
      const avgEngagementRate = metrics.length > 0 ? Math.round((rateSum / metrics.length) * 100) / 100 : 0;
      return { totalPosts, totalImpressions, totalClicks, totalShares, totalComments, avgEngagementRate };
    }

    return c.json({
      current: aggregate(currentPosts, currentMetrics),
      previous: aggregate(previousPosts, previousMetrics),
    });
  } catch (err) {
    return c.json({ error: 'Failed to compare analytics', details: err instanceof Error ? err.message : 'Unknown' }, 500);
  }
});

// ── GET /api/social-analytics/instagram-reels-metrics ────────────────────────

router.get('/api/social-analytics/instagram-reels-metrics', async (c) => {
  const userId = await getUserId(c.req.header('Authorization'), c.env as unknown as Env);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const blink = createClient({
    projectId: requireBlinkProjectId(env),
    secretKey: env.BLINK_SECRET_KEY,
  });

  // ── Cache check: return DB metrics if synced within last 6 hours ────────
  try {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const cachedMetrics = await (blink.db.table('post_engagement_metrics') as any).list({
      where: { AND: [{ userId }, { platform: 'instagram' }] },
      limit: 1000,
    });
    const recent = (cachedMetrics as any[]).filter((m: any) => m.recordedAt && m.recordedAt >= sixHoursAgo);
    if (recent.length > 0) {
      const reels = recent.map((m: any) => ({
        id: m.postId || m.id,
        caption: '',
        likes: Number(m.clicks) || 0,
        comments: Number(m.comments) || 0,
        views: Number(m.impressions) || 0,
        timestamp: m.recordedAt || '',
        permalink: '',
        thumbnailUrl: '',
      }));
      return c.json({ reels, total: reels.length, cached: true });
    }
  } catch { /* cache miss — fall through to live API */ }

  const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);

  // Try standalone Instagram token first, then Meta token
  let accessToken: string | null = null;
  let igUserId: string | null = null;

  const igToken = await store.getByUser(userId, 'instagram');
  if (igToken) {
    accessToken = await store.decryptAccessToken(igToken.accessToken);
    const pages = await getUserPages(accessToken);
    const pageWithIg = pages.find((p: any) => p.instagram_business_account);
    if (pageWithIg?.instagram_business_account) {
      igUserId = pageWithIg.instagram_business_account.id;
    }
  }

  if (!igUserId) {
    const metaToken = await store.getByUser(userId, 'meta');
    if (metaToken) {
      accessToken = await store.decryptAccessToken(metaToken.accessToken);
      const pages = await getUserPages(accessToken);
      const pageWithIg = pages.find((p: any) => p.instagram_business_account);
      if (pageWithIg?.instagram_business_account) {
        igUserId = pageWithIg.instagram_business_account.id;
      }
    }
  }

  if (!igUserId || !accessToken) {
    return c.json({ error: 'Not connected to Instagram' }, 400);
  }

  try {
    const allMedia = await getInstagramMedia(igUserId, accessToken);
    // Filter to Reels only (VIDEO media_type)
    const reels = allMedia
      .filter(m => m.media_type === 'VIDEO')
      .map(m => ({
        id: m.id,
        caption: m.caption?.substring(0, 120) || '',
        likes: m.like_count || 0,
        comments: m.comments_count || 0,
        views: m.video_view_count || 0,
        timestamp: m.timestamp,
        permalink: m.permalink || '',
        thumbnailUrl: m.thumbnail_url || '',
      }));

    return c.json({ reels, total: reels.length });
  } catch (err) {
    return c.json({ error: 'Failed to fetch Instagram Reels metrics', details: err instanceof Error ? err.message : 'Unknown' }, 500);
  }
});
