/**
 * Analytics route — proxies Meta Insights + Google My Business data
 * through the secure backend so API tokens never touch the browser.
 *
 * Endpoints:
 *   GET  /api/analytics/meta?since=YYYY-MM-DD&until=YYYY-MM-DD
 *   GET  /api/analytics/gmb?locationId=XXX&since=YYYY-MM-DD&until=YYYY-MM-DD
 *   GET  /api/analytics/combined?since=YYYY-MM-DD&until=YYYY-MM-DD
 *   POST /api/analytics/approval/notify  — fires when client approves posts
 *
 * Secrets required (set in Project Settings → Secrets):
 *   META_ACCESS_TOKEN        — Meta user/page long-lived token
 *   META_PAGE_ID             — Facebook Page ID
 *   GMB_ACCESS_TOKEN         — Google My Business OAuth token
 *   GMB_ACCOUNT_ID           — GMB account ID (accounts/XXXXX)
 */
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';

// Analytics router — Env bindings are accessed via (c.env as any) for optional secrets
// (META_ACCESS_TOKEN, META_PAGE_ID, GMB_ACCESS_TOKEN, GMB_ACCOUNT_ID)
// so they don't need to be declared in the Env type as required fields.
export const router = new Hono<{ Bindings: Env }>();

// ── Helpers ───────────────────────────────────────────────────────────────────
const getBlink = (env: Env) =>
  createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });

function dateRange(since?: string, until?: string) {
  const now = new Date();
  const end = until ?? now.toISOString().slice(0, 10);
  const start = since ?? new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
  return { since: start, until: end };
}

// ── Meta Insights ─────────────────────────────────────────────────────────────
router.get('/api/analytics/meta', async (c) => {
  const env = c.env as any;
  const blink = getBlink(env as Env);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);
  const token: string | undefined = env.META_ACCESS_TOKEN;
  const pageId: string | undefined = env.META_PAGE_ID;

  if (!token || !pageId) {
    return c.json({
      source: 'meta',
      connected: false,
      message: 'META_ACCESS_TOKEN and META_PAGE_ID secrets are not configured.',
      data: [],
    }, 200);
  }

  const { since, until } = dateRange(
    c.req.query('since'),
    c.req.query('until'),
  );

  // Meta Graph API — Page Insights
  const metrics = [
    'page_impressions',
    'page_reach',
    'page_engaged_users',
    'page_post_engagements',
    'page_views_total',
  ].join(',');

  const url = `https://graph.facebook.com/v20.0/${pageId}/insights?metric=${metrics}&since=${since}&until=${until}&period=day&access_token=${token}`;

  let raw: any;
  try {
    const res = await fetch(url);
    raw = await res.json();
    if (raw.error) {
      return c.json({ source: 'meta', connected: false, message: raw.error.message, data: [] }, 200);
    }
  } catch (e: any) {
    return c.json({ source: 'meta', connected: false, message: e.message, data: [] }, 200);
  }

  // Normalise: pivot by date → { date, reach, impressions, engagement, clicks }
  const byDate: Record<string, any> = {};
  for (const series of (raw.data ?? [])) {
    const name: string = series.name;
    for (const point of (series.values ?? [])) {
      const day = point.end_time?.slice(0, 10) ?? '';
      if (!byDate[day]) byDate[day] = { date: day, reach: 0, impressions: 0, engagement: 0, clicks: 0 };
      const v = typeof point.value === 'number' ? point.value : 0;
      if (name === 'page_reach' || name === 'page_impressions_unique') byDate[day].reach += v;
      if (name === 'page_impressions') byDate[day].impressions += v;
      if (name === 'page_engaged_users' || name === 'page_post_engagements') byDate[day].engagement += v;
      if (name === 'page_views_total') byDate[day].clicks += v;
    }
  }

  return c.json({
    source: 'meta',
    connected: true,
    since,
    until,
    data: Object.values(byDate).sort((a: any, b: any) => a.date.localeCompare(b.date)),
  });
});

// ── Google My Business Insights ───────────────────────────────────────────────
router.get('/api/analytics/gmb', async (c) => {
  const env = c.env as any;
  const blink = getBlink(env as Env);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);
  const token: string | undefined = env.GMB_ACCESS_TOKEN;
  const accountId: string | undefined = env.GMB_ACCOUNT_ID;
  const locationId: string | undefined = c.req.query('locationId');

  if (!token || !accountId) {
    return c.json({
      source: 'gmb',
      connected: false,
      message: 'GMB_ACCESS_TOKEN and GMB_ACCOUNT_ID secrets are not configured.',
      data: {},
    }, 200);
  }

  const { since, until } = dateRange(
    c.req.query('since'),
    c.req.query('until'),
  );

  // If no locationId provided, list locations first
  if (!locationId) {
    try {
      const listRes = await fetch(
        `https://mybusiness.googleapis.com/v4/${accountId}/locations?pageSize=20`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const listData = await listRes.json() as any;
      if (listData.error) {
        return c.json({ source: 'gmb', connected: false, message: listData.error.message, locations: [] }, 200);
      }
      return c.json({ source: 'gmb', connected: true, locations: listData.locations ?? [], data: {} });
    } catch (e: any) {
      return c.json({ source: 'gmb', connected: false, message: e.message, locations: [] }, 200);
    }
  }

  // Fetch insights for a specific location
  const body = {
    locationNames: [`${accountId}/locations/${locationId}`],
    basicRequest: {
      metricRequests: [
        { metric: 'QUERIES_DIRECT' },
        { metric: 'QUERIES_INDIRECT' },
        { metric: 'VIEWS_MAPS' },
        { metric: 'VIEWS_SEARCH' },
        { metric: 'ACTIONS_WEBSITE' },
        { metric: 'ACTIONS_PHONE' },
        { metric: 'ACTIONS_DRIVING_DIRECTIONS' },
      ],
      timeRange: {
        startTime: `${since}T00:00:00Z`,
        endTime:   `${until}T23:59:59Z`,
      },
    },
  };

  try {
    const res = await fetch(
      'https://mybusiness.googleapis.com/v4/locations:reportInsights',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );
    const raw = await res.json() as any;
    if (raw.error) {
      return c.json({ source: 'gmb', connected: false, message: raw.error.message, data: {} }, 200);
    }

    // Flatten metrics into a summary object
    const loc = raw.locationMetrics?.[0];
    const summary: Record<string, number> = {};
    for (const m of (loc?.metricValues ?? [])) {
      const total = (m.dimensionalValues ?? []).reduce((s: number, d: any) => s + (parseInt(d.value ?? '0') || 0), 0);
      summary[m.metric] = total;
    }

    return c.json({ source: 'gmb', connected: true, since, until, data: summary });
  } catch (e: any) {
    return c.json({ source: 'gmb', connected: false, message: e.message, data: {} }, 200);
  }
});

// ── Combined analytics (Meta + GMB merged) ───────────────────────────────────
router.get('/api/analytics/combined', async (c) => {
  const env = c.env as any;
  const blink = getBlink(env as Env);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);
  const { since, until } = dateRange(c.req.query('since'), c.req.query('until'));

  // Fire both requests in parallel
  const baseUrl = new URL(c.req.url);
  const makeUrl = (path: string) => {
    const u = new URL(path, baseUrl.origin);
    u.searchParams.set('since', since);
    u.searchParams.set('until', until);
    return u.toString();
  };

  const [metaRes, gmbRes] = await Promise.allSettled([
    fetch(makeUrl('/api/analytics/meta'), { headers: c.req.raw.headers }),
    fetch(makeUrl('/api/analytics/gmb'),  { headers: c.req.raw.headers }),
  ]);

  const meta = metaRes.status === 'fulfilled' ? await (metaRes.value as Response).json() : { connected: false };
  const gmb  = gmbRes.status  === 'fulfilled' ? await (gmbRes.value  as Response).json() : { connected: false };

  return c.json({ since, until, meta, gmb });
});

// ── Approval notification → auto-schedule posts ───────────────────────────────
/**
 * POST /api/analytics/approval/notify
 * Body: { tokenId: string }
 *
 * When the client approves the weekly planning, this endpoint:
 *  1. Fetches the approval token to get post_ids + user_id
 *  2. Updates every matching scheduled_post to status='scheduled'
 *  3. Returns count of posts promoted to scheduled
 */
router.post('/api/analytics/approval/notify', async (c) => {
  const env = c.env as any;
  const blink = getBlink(env as Env);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  let body: { tokenId?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { tokenId } = body;
  if (!tokenId) return c.json({ error: 'tokenId is required' }, 400);

  // 1. Load the approval token
  const tokens = await blink.db.clientApprovalTokens.list({ where: { id: tokenId }, limit: 1 });
  if (!tokens.length) return c.json({ error: 'Token not found' }, 404);

  const token = tokens[0] as {
    id: string; userId: string; postIds: string; status: string;
  };

  if (token.status !== 'approved') {
    return c.json({ error: 'Token is not in approved state', status: token.status }, 409);
  }

  // 2. Parse post IDs
  let postIds: string[] = [];
  try { postIds = JSON.parse(token.postIds || '[]'); } catch { /* noop */ }

  if (!postIds.length) {
    return c.json({ promoted: 0, message: 'No post IDs attached to this token' });
  }

  // 3. Update each post to 'scheduled'
  let promoted = 0;
  const errors: string[] = [];

  await Promise.allSettled(
    postIds.map(async (pid) => {
      try {
        const posts = await blink.db.scheduledPosts.list({
          where: { id: pid, userId: token.userId },
          limit: 1,
        });
        if (posts.length) {
          await blink.db.scheduledPosts.update(pid, { status: 'scheduled' });
          promoted++;
        }
      } catch (e: any) {
        errors.push(`${pid}: ${e.message}`);
      }
    }),
  );

  return c.json({ promoted, total: postIds.length, errors });
});
