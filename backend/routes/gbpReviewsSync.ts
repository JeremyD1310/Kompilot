/**
 * gbpReviewsSync.ts — Google Business Profile Reviews Sync Routes
 *
 * Synchronizes Google Reviews into the Kompilot inbox for centralized management.
 *
 * Routes:
 *   POST /api/gbp/reviews-sync         — Trigger a manual reviews sync
 *   GET  /api/gbp/reviews-summary       — Aggregated review stats for dashboard
 *   GET  /api/gbp/reviews-inbox         — Reviews formatted for the unified inbox
 *   POST /api/gbp/reviews-reply         — Reply to a Google review
 */
import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import { createSecureTokenStore } from '../lib/secureTokenStore';
import {
  getAccounts, getLocations, getReviews, replyToReview, refreshAccessToken,
  type GBPReview,
} from '../lib/googleBusinessService';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

function getUserId(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try { const payload = authHeader.split('.')[1]; return (JSON.parse(atob(payload))).sub ?? null; } catch { return null; }
}

async function getValidGbpToken(env: Env, userId: string): Promise<string | null> {
  const blink = createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });
  const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);
  const tokens = await store.getByUser(userId, 'google_business');
  if (!tokens) return null;

  const expiresAt = new Date(tokens.expiresAt).getTime();
  if (expiresAt < Date.now() + 60000) {
    const clientId = (env as any).GOOGLE_BUSINESS_CLIENT_ID;
    const clientSecret = (env as any).GOOGLE_BUSINESS_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;

    try {
      const decryptedRefresh = await store.decryptAccessToken(tokens.refreshToken);
      const refreshed = await refreshAccessToken(decryptedRefresh, clientId, clientSecret);
      await store.save({
        userId,
        provider: 'google_business',
        accessToken: refreshed.accessToken,
        refreshToken: tokens.refreshToken ? await store.decryptAccessToken(tokens.refreshToken) : '',
        expiresAt: new Date(Date.now() + refreshed.expiresIn * 1000).toISOString(),
        scopes: ['business.manage'],
      });
      return refreshed.accessToken;
    } catch {
      return null;
    }
  }

  return store.decryptAccessToken(tokens.accessToken);
}

// ── POST /api/gbp/reviews-sync — Trigger manual sync ──────────────────────

router.post('/api/gbp/reviews-sync', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const accessToken = await getValidGbpToken(env, userId);
  if (!accessToken) return c.json({ error: 'Google Business not connected or token expired' }, 400);

  const blink = createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });

  try {
    // 1. Discover accounts and locations
    const accounts = await getAccounts(accessToken);
    let allReviews: (GBPReview & { locationName: string; locationTitle: string })[] = [];

    for (const account of accounts) {
      const locations = await getLocations(accessToken, account.name);
      for (const loc of locations) {
        try {
          const reviews = await getReviews(accessToken, loc.name);
          allReviews.push(...reviews.map(r => ({
            ...r,
            locationName: loc.name,
            locationTitle: loc.title || loc.locationName || 'Établissement',
          })));
        } catch (err) {
          console.warn(`[GBP Sync] Failed to fetch reviews for ${loc.name}:`, err);
        }
      }
    }

    // 2. Store new reviews in the inbox
    let newCount = 0;
    for (const review of allReviews) {
      const reviewerName = review.reviewer?.displayName || 'Client Google';
      const ratingStars = { ONE: '⭐', TWO: '⭐⭐', THREE: '⭐⭐⭐', FOUR: '⭐⭐⭐⭐', FIVE: '⭐⭐⭐⭐⭐' }[review.starRating] || '';
      const subject = `${ratingStars} Avis de ${reviewerName} — ${review.locationTitle}`;

      // Check if this review already exists (dedup by review name)
      const existing = await (blink as any).db.table('messages').list({
        where: { user_id: userId, subject: { LIKE: `%${review.reviewId}%` } },
        limit: 1,
      });

      if (!existing || existing.length === 0) {
        await (blink as any).db.table('messages').create({
          user_id: userId,
          sender_name: reviewerName,
          sender_email: '',
          subject: `[${review.reviewId}] ${subject}`,
          body: review.comment || '(Avis sans commentaire)',
          is_read: false,
          is_archived: false,
          is_starred: review.starRating === 'FIVE',
        });
        newCount++;
      }
    }

    return c.json({
      success: true,
      totalReviews: allReviews.length,
      newSynced: newCount,
      locationsScanned: allReviews.reduce((acc, r) => {
        if (!acc.includes(r.locationName)) acc.push(r.locationName);
        return acc;
      }, [] as string[]).length,
    });
  } catch (err: any) {
    console.error('[GBP Sync] Error:', err.message);
    return c.json({ error: 'Sync failed', details: err.message }, 500);
  }
});

// ── GET /api/gbp/reviews-summary — Aggregated stats ───────────────────────

router.get('/api/gbp/reviews-summary', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const accessToken = await getValidGbpToken(env, userId);
  if (!accessToken) return c.json({ connected: false });

  const blink = createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });

  try {
    const accounts = await getAccounts(accessToken);
    let totalReviews = 0;
    let avgRating = 0;
    const ratingDistribution: Record<string, number> = { 'ONE': 0, 'TWO': 0, 'THREE': 0, 'FOUR': 0, 'FIVE': 0 };
    let unrepliedCount = 0;
    const allReviews: GBPReview[] = [];

    for (const account of accounts) {
      const locations = await getLocations(accessToken, account.name);
      for (const loc of locations) {
        try {
          const reviews = await getReviews(accessToken, loc.name);
          allReviews.push(...reviews);
        } catch { /* skip */ }
      }
    }

    totalReviews = allReviews.length;
    let ratingSum = 0;
    for (const r of allReviews) {
      const ratingMap: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
      ratingSum += ratingMap[r.starRating] || 0;
      ratingDistribution[r.starRating] = (ratingDistribution[r.starRating] || 0) + 1;
      if (!r.reviewReply) unrepliedCount++;
    }
    avgRating = totalReviews > 0 ? Math.round((ratingSum / totalReviews) * 10) / 10 : 0;

    return c.json({
      connected: true,
      totalReviews,
      avgRating,
      ratingDistribution,
      unrepliedCount,
      accountsCount: accounts.length,
    });
  } catch (err: any) {
    console.error('[GBP Summary] Error:', err.message);
    return c.json({ error: 'Failed to fetch summary' }, 500);
  }
});

// ── GET /api/gbp/reviews-inbox — Reviews for the unified inbox ────────────

router.get('/api/gbp/reviews-inbox', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const blink = createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });

  try {
    // Fetch Google reviews from the messages table (synced by reviews-sync)
    const messages = await (blink as any).db.table('messages').list({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      limit: 100,
    });

    // Filter for Google review messages (contain [reviewId] pattern)
    const googleReviews = (messages || [])
      .filter((m: any) => m.subject?.startsWith('[') && m.subject?.includes('Avis de'))
      .map((m: any) => {
        const reviewIdMatch = m.subject.match(/\[(\w+)\]/);
        const ratingMatch = m.subject.match(/^(⭐+)/);
        return {
          id: m.id,
          reviewId: reviewIdMatch?.[1] || '',
          senderName: m.sender_name || 'Client',
          rating: ratingMatch?.[1]?.length || 0,
          comment: m.body || '',
          isRead: Number(m.is_read) > 0,
          isStarred: Number(m.is_starred) > 0,
          createdAt: m.created_at,
        };
      });

    return c.json({ reviews: googleReviews });
  } catch (err: any) {
    console.error('[GBP Inbox] Error:', err.message);
    return c.json({ error: 'Failed to fetch reviews inbox' }, 500);
  }
});

// ── POST /api/gbp/reviews-reply — Reply to a review ───────────────────────

router.post('/api/gbp/reviews-reply', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const accessToken = await getValidGbpToken(env, userId);
  if (!accessToken) return c.json({ error: 'Google Business not connected' }, 400);

  let body: { locationId?: string; reviewId?: string; replyText?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  if (!body.locationId || !body.reviewId || !body.replyText) {
    return c.json({ error: 'locationId, reviewId and replyText are required' }, 400);
  }

  try {
    await replyToReview(accessToken, `locations/${body.locationId}/reviews/${body.reviewId}`, body.replyText);

    // Mark the review as replied in our inbox
    const blink = createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });
    const messages = await (blink as any).db.table('messages').list({
      where: { user_id: userId },
      limit: 100,
    });
    const reviewMsg = (messages || []).find((m: any) => m.subject?.includes(`[${body.reviewId}]`));
    if (reviewMsg) {
      await (blink as any).db.table('messages').update(reviewMsg.id, { is_starred: true });
    }

    return c.json({ success: true });
  } catch (err: any) {
    console.error('[GBP Reply] Error:', err.message);
    return c.json({ error: 'Failed to reply to review', details: err.message }, 500);
  }
});
