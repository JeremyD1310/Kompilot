/**
 * Metrics Sync Routes
 *
 * Automates periodic fetching of engagement metrics from all connected
 * social platforms and stores them in `post_engagement_metrics`.
 *
 * POST /api/metrics-sync/trigger — Enqueue background sync task
 * GET  /api/metrics-sync/status — Last sync timestamp for the user
 * POST /api/metrics-sync/queue-handler — Queue worker (called by Blink Queue)
 */

import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import { createSecureTokenStore } from '../lib/secureTokenStore';
import { getUserPages, getInstagramMedia } from '../lib/metaPublishingService';
import { tiktokApiCall } from '../lib/tiktokService';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

async function getUserId(authHeader: string | undefined, env: Env): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const blink = createClient({ projectId: env.BLINK_PROJECT_ID || 'presence-manager-saas-gbrhsehk', secretKey: env.BLINK_SECRET_KEY });
    const auth = await blink.auth.verifyToken(authHeader);
    return auth.valid && auth.userId ? auth.userId : null;
  } catch { return null; }
}

// ── POST /api/metrics-sync/trigger ───────────────────────────────────────────

router.post('/api/metrics-sync/trigger', async (c) => {
  const userId = await getUserId(c.req.header('Authorization'), c.env as unknown as Env);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const blink = createClient({
    projectId: env.BLINK_PROJECT_ID || 'presence-manager-saas-gbrhsehk',
    secretKey: env.BLINK_SECRET_KEY,
  });

  // Check cooldown: don't sync if last sync was < 6 hours ago
  try {
    const recent = await (blink.db.table('metric_sync_log') as any).list({
      where: { userId },
      orderBy: { syncedAt: 'desc' },
      limit: 1,
    });
    if (recent.length > 0) {
      const lastSync = new Date(recent[0].syncedAt).getTime();
      const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
      if (lastSync > sixHoursAgo) {
        return c.json({ skipped: true, reason: 'Synced recently', lastSyncAt: recent[0].syncedAt });
      }
    }
  } catch { /* table may not exist yet — proceed */ }

  // Enqueue background task
  try {
    const queueFn = (blink as any).queue;
    if (queueFn?.enqueue) {
      await queueFn.enqueue('metrics-sync', {
        userId,
        triggeredAt: new Date().toISOString(),
      });
      return c.json({ enqueued: true, message: 'Metrics sync queued' });
    }
  } catch { /* queue not available — fall through to inline */ }

  // Fallback: run sync inline (slower but works without queue)
  try {
    const result = await runMetricsSync(blink, userId, env);
    return c.json({ synced: true, ...result });
  } catch (err) {
    return c.json({ error: 'Sync failed', details: err instanceof Error ? err.message : 'Unknown' }, 500);
  }
});

// ── GET /api/metrics-sync/status ─────────────────────────────────────────────

router.get('/api/metrics-sync/status', async (c) => {
  const userId = await getUserId(c.req.header('Authorization'), c.env as unknown as Env);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const blink = createClient({
    projectId: env.BLINK_PROJECT_ID || 'presence-manager-saas-gbrhsehk',
    secretKey: env.BLINK_SECRET_KEY,
  });

  try {
    const recent = await (blink.db.table('metric_sync_log') as any).list({
      where: { userId },
      orderBy: { syncedAt: 'desc' },
      limit: 1,
    });
    return c.json({
      lastSyncAt: recent[0]?.syncedAt || null,
      syncedPlatforms: recent[0]?.platforms ? JSON.parse(recent[0].platforms) : [],
    });
  } catch {
    return c.json({ lastSyncAt: null, syncedPlatforms: [] });
  }
});

// ── POST /api/metrics-sync/queue-handler ─────────────────────────────────────

router.post('/api/metrics-sync/queue-handler', async (c) => {
  const body = await c.req.json() as { userId: string; triggeredAt: string };
  if (!body.userId) return c.json({ error: 'userId required' }, 400);

  const env = c.env as unknown as Env;
  const blink = createClient({
    projectId: env.BLINK_PROJECT_ID || 'presence-manager-saas-gbrhsehk',
    secretKey: env.BLINK_SECRET_KEY,
  });

  try {
    const result = await runMetricsSync(blink, body.userId, env);
    return c.json({ ok: true, ...result });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Unknown' }, 500);
  }
});

// ── Core sync logic ──────────────────────────────────────────────────────────

export async function runMetricsSync(
  blink: any,
  userId: string,
  env: Env,
): Promise<{ syncedPlatforms: string[]; metricsCount: number }> {
  const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);
  const metricsTable = blink.db.table('post_engagement_metrics');
  const syncedPlatforms: string[] = [];
  let metricsCount = 0;

  // ── TikTok metrics ──────────────────────────────────────────────────────
  try {
    const ttToken = await store.getByUser(userId, 'tiktok');
    if (ttToken) {
      const decrypted = await store.decryptAccessToken(ttToken.accessToken);
      let cursor: string | undefined;
      let hasMore = true;

      for (let page = 0; page < 5 && hasMore; page++) {
        const body: Record<string, unknown> = {
          fields: 'id,title,like_count,comment_count,share_count,view_count,create_time',
        };
        if (cursor) body.cursor = cursor;

        const result = await tiktokApiCall<any>(
          '/v2/video/list/?fields=id,title,like_count,comment_count,share_count,view_count,create_time',
          decrypted,
          { method: 'POST', body },
        );

        const videos = result.data?.videos ?? [];
        for (const v of videos) {
          const views = v.view_count || 0;
          const likes = v.like_count || 0;
          const comments = v.comment_count || 0;
          const shares = v.share_count || 0;
          const engRate = views > 0 ? ((likes + comments + shares) / views) * 100 : 0;

          try {
            await metricsTable.upsert({
              id: `tt-${userId}-${v.id}`,
              postId: `tiktok-${v.id}`,
              userId,
              platform: 'tiktok',
              impressions: views,
              clicks: 0,
              shares,
              comments,
              reach: views,
              engagementRate: Math.round(engRate * 100) / 100,
              ctr: 0,
              recordedAt: new Date((v.create_time || Date.now() / 1000) * 1000).toISOString(),
            });
            metricsCount++;
          } catch { /* upsert may fail on schema mismatch — skip */ }
        }

        cursor = result.data?.cursor;
        hasMore = result.data?.has_more === true && !!cursor;
      }
      syncedPlatforms.push('tiktok');
    }
  } catch { /* TikTok not connected or API error — skip */ }

  // ── Instagram Reels metrics ─────────────────────────────────────────────
  try {
    let accessToken: string | null = null;
    let igUserId: string | null = null;

    // Try standalone Instagram token first
    const igToken = await store.getByUser(userId, 'instagram');
    if (igToken) {
      accessToken = await store.decryptAccessToken(igToken.accessToken);
      const pages = await getUserPages(accessToken);
      const pageWithIg = pages.find((p: any) => p.instagram_business_account);
      if (pageWithIg?.instagram_business_account) igUserId = pageWithIg.instagram_business_account.id;
    }
    // Fallback to Meta token
    if (!igUserId) {
      const metaToken = await store.getByUser(userId, 'meta');
      if (metaToken) {
        accessToken = await store.decryptAccessToken(metaToken.accessToken);
        const pages = await getUserPages(accessToken);
        const pageWithIg = pages.find((p: any) => p.instagram_business_account);
        if (pageWithIg?.instagram_business_account) igUserId = pageWithIg.instagram_business_account.id;
      }
    }

    if (igUserId && accessToken) {
      const media = await getInstagramMedia(igUserId, accessToken);
      const reels = media.filter((m: any) => m.media_type === 'VIDEO');
      for (const r of reels) {
        const views = r.video_view_count || 0;
        const likes = r.like_count || 0;
        const comments = r.comments_count || 0;
        const engRate = views > 0 ? ((likes + comments) / views) * 100 : 0;

        try {
          await metricsTable.upsert({
            id: `ig-${userId}-${r.id}`,
            postId: `instagram-${r.id}`,
            userId,
            platform: 'instagram',
            impressions: views,
            clicks: 0,
            shares: 0,
            comments,
            reach: views,
            engagementRate: Math.round(engRate * 100) / 100,
            ctr: 0,
            recordedAt: r.timestamp || new Date().toISOString(),
          });
          metricsCount++;
        } catch { /* skip */ }
      }
      syncedPlatforms.push('instagram');
    }
  } catch { /* Instagram not connected — skip */ }

  // ── Log sync ────────────────────────────────────────────────────────────
  try {
    await (blink.db.table('metric_sync_log') as any).upsert({
      id: `sync-${userId}`,
      userId,
      syncedAt: new Date().toISOString(),
      platforms: JSON.stringify(syncedPlatforms),
      metricsCount,
    });
  } catch { /* table may not exist */ }

  return { syncedPlatforms, metricsCount };
}
