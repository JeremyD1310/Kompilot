/**
 * Weekly AIO Report route — returns the latest weekly AIO performance summary.
 *   GET /api/weekly-report/latest  — get the most recent report for the user
 *
 * The report is computed from:
 *   - daily_analytics (GEO score, posts, reviews)
 *   - user metadata (AIO audit results, billing plan)
 *
 * The weekly report email is sent by a cron job (_blink_schedules).
 * This endpoint only serves the data to the frontend dashboard widget.
 */

import { Hono } from 'hono';
import type { Env } from '../lib/types';
import { getBlink, getUserMeta } from '../lib/stripeHelpers';

export const router = new Hono();

// ── GET /api/weekly-report/latest ─────────────────────────────────────────────

router.get('/api/weekly-report/latest', async (c) => {
  const env   = c.env as unknown as Env;
  const blink = getBlink(env);

  // 1. Auth
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  try {
    // 2. Get latest daily analytics for the user
    const analytics = await blink.db.daily_analytics.list({
      where: { user_id: auth.userId },
      orderBy: { snapshot_date: 'desc' },
      limit: 14, // last 2 weeks
    });

    if (!analytics || analytics.length === 0) {
      return c.json(null);
    }

    const latest = analytics[0] as any;
    const previousWeek = analytics.length >= 7 ? (analytics[6] as any) : null;

    // 3. Get user metadata for AIO data
    const meta = await getUserMeta(blink, auth.userId);
    const planId = (meta.plan_id as string) || 'starter';
    const aioVisibility = Number(meta.aio_visibility ?? latest?.local_visibility ?? 0);
    const prevAioVisibility = previousWeek ? Number(previousWeek.local_visibility ?? 0) : aioVisibility;

    // 4. Extract keywords from metadata
    let invisibleKeywords: string[] = [];
    let visibleKeywords: string[] = [];
    try {
      const missingKw = latest?.missing_keywords;
      if (missingKw) {
        const parsed = typeof missingKw === 'string' ? JSON.parse(missingKw) : missingKw;
        invisibleKeywords = Array.isArray(parsed) ? parsed.slice(0, 5) : [];
      }
    } catch { /* noop */ }

    // 5. Build recommendation based on data
    const recommendations: Record<string, string> = {
      low_geo: 'Améliorez votre score GEO en complétant votre fiche Google Business Profile',
      low_reviews: 'Répondez à vos avis Google en attente — chaque réponse booste votre autorité locale',
      low_posts: 'Publiez au moins 3 posts cette semaine pour maintenir votre visibilité',
      low_aio: 'Générez un Schema JSON-LD avec FAQ pour améliorer votre visibilité dans les réponses IA',
      good: 'Continuez votre stratégie actuelle — votre visibilité IA progresse',
    };

    const geoScore = Number(latest.geo_score ?? 0);
    const unhandledReviews = Number(latest.unhandled_reviews ?? 0);
    const postsPublished = Number(latest.posts_published ?? 0);

    let topRecommendation = recommendations.good;
    if (geoScore < 50) topRecommendation = recommendations.low_geo;
    else if (unhandledReviews > 3) topRecommendation = recommendations.low_reviews;
    else if (postsPublished < 3) topRecommendation = recommendations.low_posts;
    else if (aioVisibility < 30) topRecommendation = recommendations.low_aio;

    // 6. Sector average (simulated — in production this comes from aggregated data)
    const sectorAverage = 35;

    return c.json({
      weekOf: latest.snapshot_date,
      aioScore: aioVisibility,
      aioScoreDelta: aioVisibility - prevAioVisibility,
      citationsDetected: Math.max(0, Math.round(aioVisibility / 10)),
      topRecommendation,
      sectorAverage,
      invisibleKeywords,
      visibleKeywords,
    });
  } catch (err) {
    console.error('[weekly-report] Error:', err);
    return c.json({ error: 'Failed to generate report' }, 500);
  }
});
