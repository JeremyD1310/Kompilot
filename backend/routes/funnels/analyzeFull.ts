/**
 * Funnels — full competitive analysis controller
 *
 *   POST /api/funnels/analyze-full
 *
 * Orchestrates in parallel:
 *   1. Tech stack detection via regex scan of the domain HTML
 *   2. Meta Ad Library fetch for competitor's active ads
 *   3. 21-day longevity filter → identifies "winner" creatives
 *   4. Dynamic performance score: min(60 + winnerCount × 4, 98)
 *
 * Body:
 *   { domainUrl: string, competitorName: string }
 *
 * Response:
 *   {
 *     success: true,
 *     domainUrl, competitorName,
 *     techStack: string[],        // detected tool names
 *     metrics: { totalActiveAds, winningAdsCount, estimatedPerformanceScore },
 *     ads: { all: EnrichedMetaAd[], winners: EnrichedMetaAd[] }
 *   }
 */
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import { detectTechStack } from '../../lib/techDetector';
import {
  fetchCompetitorAds,
  enrichAds,
  computePerformanceScore,
} from '../../lib/metaAdsService';
import { getCachedAnalysis, setCachedAnalysis } from './analysisCache';

// Extend env bindings to include META_ACCESS_TOKEN
type Bindings = {
  BLINK_SECRET_KEY: string;
  META_ACCESS_TOKEN?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// ── In-memory cache (per CF Worker instance, 5-minute TTL) ───────────────────
// Avoids redundant HTML fetches + Meta API calls for the same domain within
// a short window (e.g. user re-opens the same funnel or two concurrent users).
interface CacheEntry {
  data: object;
  expiresAt: number;
}
const analysisCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1_000; // 5 minutes

function getCached(key: string): object | null {
  const entry = analysisCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    analysisCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: object): void {
  // Evict oldest entry if cache grows beyond 100 keys to prevent memory leaks
  if (analysisCache.size >= 100) {
    const firstKey = analysisCache.keys().next().value;
    if (firstKey) analysisCache.delete(firstKey);
  }
  analysisCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ── POST /analyze-full ────────────────────────────────────────────────────────
app.post('/analyze-full', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const blink = createClient({
      projectId: 'presence-manager-saas-gbrhsehk',
      secretKey: c.env.BLINK_SECRET_KEY,
    });

    const token = authHeader.split(' ')[1];
    const user = await blink.auth.verifyToken(token);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const body = await c.req.json() as {
      domainUrl?: string;
      competitorName?: string;
    };

    const { domainUrl, competitorName } = body;

    const cleanDomain = domainUrl.trim();
    const cleanName   = competitorName.trim();

    if (!cleanDomain || !cleanName) {
      return c.json(
        { error: 'domainUrl et competitorName sont requis.' },
        400
      );
    }

    // ── 1. In-memory cache (5-min, per CF Worker instance) ───────────────
    const cacheKey = cleanDomain.toLowerCase();
    const memCached = getCached(cacheKey);
    if (memCached) {
      return c.json(memCached);
    }

    // ── 2. Persistent DB cache (3-day TTL, shared across all users) ──────
    const dbCached = await getCachedAnalysis(blink, cleanDomain);
    if (dbCached) {
      setCache(cacheKey, dbCached); // warm the in-memory cache too
      return c.json(dbCached);
    }

    // ── Step 1 & 2 in parallel ─────────────────────────────────────────────
    const [techStack, rawAds] = await Promise.all([
      // 1. Scan the domain HTML for known tech signatures
      detectTechStack(cleanDomain),

      // 2. Fetch active ads from the Meta Ad Library
      // Falls back to [] if META_ACCESS_TOKEN is missing (graceful degradation)
      fetchCompetitorAds(
        c.env.META_ACCESS_TOKEN ?? '',
        cleanName,
      ),
    ]);

    // ── Step 3: Enrich ads with daysActive + isWinner ─────────────────────
    const enrichedAds = enrichAds(rawAds);

    // ── Step 4: Filter winner ads (21+ days) ──────────────────────────────
    const winningAds = enrichedAds.filter(ad => ad.isWinner);

    // ── Step 5: Compute dynamic performance score ─────────────────────────
    const estimatedPerformanceScore = computePerformanceScore(winningAds.length);

    const result = {
      success: true,
      domainUrl: cleanDomain,
      competitorName: cleanName,
      techStack,
      metrics: {
        totalActiveAds: enrichedAds.length,
        winningAdsCount: winningAds.length,
        estimatedPerformanceScore,
      },
      ads: {
        all: enrichedAds,
        winners: winningAds,
      },
    };

    // Store in in-memory cache (5 min)
    setCache(cacheKey, result);

    // Store in persistent DB cache (3-day TTL, fire-and-forget)
    setCachedAnalysis(blink, cleanDomain, cleanName, result).catch(() => {});

    return c.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[analyze-full] Erreur lors de l'analyse globale du tunnel:", msg);
    return c.json({ error: "Échec de l'analyse du tunnel." }, 500);
  }
});

export const router = app;
