/**
 * facebookReviews.ts — Facebook Page Reviews Routes
 *
 * Fetches page ratings (reviews) from the Facebook Graph API and allows
 * replying to them via comments on the review's open graph story.
 *
 * Routes:
 *   GET  /api/facebook/reviews/status    — Check Facebook connection + page count
 *   GET  /api/facebook/reviews/summary   — Aggregated stats across all connected pages
 *   GET  /api/facebook/reviews/inbox     — Latest reviews from all pages
 *   POST /api/facebook/reviews/reply     — Reply to a review via its story comment
 */
import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import { createSecureTokenStore } from '../lib/secureTokenStore';
import { getUserPages, graphApiCall, type MetaPage } from '../lib/metaPublishingService';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// ── Helpers ──────────────────────────────────────────────────────────────────

function getUserId(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try { const payload = authHeader.split('.')[1]; return (JSON.parse(atob(payload))).sub ?? null; } catch { return null; }
}

interface FbReview {
  id: string;
  reviewer: { name: string; id: string };
  rating: number;
  review_text?: string;
  created_time: string;
  open_graph_story?: { id: string };
}

interface FbPageWithReviews {
  pageId: string;
  pageName: string;
  pageAccessToken: string;
  reviews: FbReview[];
}

async function fetchAllPagesReviews(userAccessToken: string): Promise<FbPageWithReviews[]> {
  const pages = await getUserPages(userAccessToken);
  const results: FbPageWithReviews[] = [];

  for (const page of pages) {
    try {
      const ratingsRes = await graphApiCall<{ data: FbReview[] }>(
        `/${page.id}/ratings?fields=reviewer,rating,review_text,created_time,open_graph_story&limit=50`,
        page.access_token,
      );
      results.push({
        pageId: page.id,
        pageName: page.name,
        pageAccessToken: page.access_token,
        reviews: ratingsRes.data || [],
      });
    } catch {
      // Page may not have reviews enabled — skip silently
      results.push({
        pageId: page.id,
        pageName: page.name,
        pageAccessToken: page.access_token,
        reviews: [],
      });
    }
  }

  return results;
}

// ── GET /api/facebook/reviews/status ─────────────────────────────────────────

router.get('/api/facebook/reviews/status', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const blink = createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });
  const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);
  const tokens = await store.getByUser(userId, 'facebook');

  if (!tokens) return c.json({ connected: false, pages: [] });

  try {
    const decrypted = await store.decryptAccessToken(tokens.accessToken);
    const pages = await getUserPages(decrypted);
    return c.json({
      connected: true,
      expiresAt: tokens.expiresAt,
      pages: pages.map((p: MetaPage) => ({ id: p.id, name: p.name, category: p.category })),
    });
  } catch {
    return c.json({ connected: false, reason: 'Token expired or invalid', pages: [] });
  }
});

// ── GET /api/facebook/reviews/summary ────────────────────────────────────────

router.get('/api/facebook/reviews/summary', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const blink = createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });
  const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);
  const tokens = await store.getByUser(userId, 'facebook');

  if (!tokens) {
    return c.json({ connected: false, totalReviews: 0, avgRating: 0, ratingDistribution: {}, pagesCount: 0 });
  }

  try {
    const decrypted = await store.decryptAccessToken(tokens.accessToken);
    const pagesReviews = await fetchAllPagesReviews(decrypted);

    let totalReviews = 0;
    let totalRating = 0;
    const distribution: Record<string, number> = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };

    for (const page of pagesReviews) {
      for (const review of page.reviews) {
        totalReviews++;
        totalRating += review.rating;
        const key = String(review.rating);
        distribution[key] = (distribution[key] || 0) + 1;
      }
    }

    return c.json({
      connected: true,
      totalReviews,
      avgRating: totalReviews > 0 ? Math.round((totalRating / totalReviews) * 10) / 10 : 0,
      ratingDistribution: distribution,
      pagesCount: pagesReviews.length,
    });
  } catch (err: any) {
    return c.json({ connected: false, reason: err.message || 'Failed to fetch reviews', totalReviews: 0, avgRating: 0, ratingDistribution: {}, pagesCount: 0 });
  }
});

// ── GET /api/facebook/reviews/inbox ──────────────────────────────────────────

router.get('/api/facebook/reviews/inbox', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const blink = createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });
  const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);
  const tokens = await store.getByUser(userId, 'facebook');

  if (!tokens) return c.json({ reviews: [] });

  try {
    const decrypted = await store.decryptAccessToken(tokens.accessToken);
    const pagesReviews = await fetchAllPagesReviews(decrypted);

    // Flatten + sort by date descending
    const allReviews = pagesReviews.flatMap((page) =>
      page.reviews.map((r) => ({
        id: r.id,
        pageId: page.pageId,
        pageName: page.pageName,
        reviewerName: r.reviewer?.name || 'Anonyme',
        reviewerId: r.reviewer?.id || '',
        rating: r.rating,
        comment: r.review_text || '',
        createdAt: r.created_time,
        storyId: r.open_graph_story?.id || null,
      })),
    );

    allReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return c.json({ reviews: allReviews });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to fetch reviews' }, 500);
  }
});

// ── POST /api/facebook/reviews/reply ─────────────────────────────────────────

router.post('/api/facebook/reviews/reply', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json<{ storyId: string; pageId: string; message: string }>();
  if (!body.storyId || !body.message || !body.pageId) return c.json({ error: 'storyId, pageId, and message required' }, 400);

  const env = c.env as unknown as Env;
  const blink = createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });
  const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);
  const tokens = await store.getByUser(userId, 'facebook');
  if (!tokens) return c.json({ error: 'Facebook not connected' }, 400);

  try {
    // Get the page access token by discovering pages
    const decrypted = await store.decryptAccessToken(tokens.accessToken);
    const pages = await getUserPages(decrypted);
    const page = pages.find((p) => p.id === body.pageId);
    if (!page) return c.json({ error: 'Page not found or not accessible' }, 400);

    // Reply by commenting on the review's open graph story
    const params = new URLSearchParams();
    params.set('message', body.message);

    const result = await graphApiCall<{ id: string }>(
      `/${body.storyId}/comments`,
      page.access_token,
      { method: 'POST', body: params },
    );

    return c.json({ success: true, commentId: result.id });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to reply to review' }, 500);
  }
});
