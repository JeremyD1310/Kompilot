/**
 * Funnels — Persistent Analysis Cache (DB-backed, 3-day TTL)
 *
 * Serves cached analysis results when available.
 * Cache key: normalized domain URL.
 * TTL: 72 hours (3 days).
 *
 * Exported as utility functions (not a Hono app) — used by analyzeFull.ts.
 */
import { createClient } from '@blinkdotnew/sdk';

const CACHE_TTL_HOURS = 72;

type BlinkClient = ReturnType<typeof createClient>;

export async function getCachedAnalysis(
  blink: BlinkClient,
  domainUrl: string
): Promise<object | null> {
  try {
    const normalized = domainUrl.trim().toLowerCase().replace(/\/$/, '');
    const rows = await blink.db.funnelAnalysisCache.list({
      where: { domainUrl: normalized },
      orderBy: { createdAt: 'desc' },
      limit: 1,
    });

    if (!rows || rows.length === 0) return null;

    const row = rows[0];
    const expiresAt = new Date(row.expiresAt as string).getTime();

    if (Date.now() > expiresAt) {
      // Expired — clean up asynchronously
      blink.db.funnelAnalysisCache.delete(row.id as string).catch(() => {});
      return null;
    }

    const parsed = JSON.parse(row.analysisData as string);
    return { ...parsed, _fromCache: true, _cachedAt: row.createdAt };
  } catch (err) {
    console.error('[analysisCache] getCachedAnalysis error:', err);
    return null;
  }
}

export async function setCachedAnalysis(
  blink: BlinkClient,
  domainUrl: string,
  competitorName: string,
  data: object
): Promise<void> {
  try {
    const normalized = domainUrl.trim().toLowerCase().replace(/\/$/, '');
    const expiresAt = new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString();

    // Delete existing cache entry for this domain if any
    const existing = await blink.db.funnelAnalysisCache.list({
      where: { domainUrl: normalized },
    });
    for (const row of existing) {
      await blink.db.funnelAnalysisCache.delete(row.id as string).catch(() => {});
    }

    await blink.db.funnelAnalysisCache.create({
      id: crypto.randomUUID().replace(/-/g, ''),
      domainUrl: normalized,
      competitorName,
      analysisData: JSON.stringify(data),
      expiresAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[analysisCache] setCachedAnalysis error:', err);
    // Non-fatal — analysis still returned, just not cached
  }
}

export async function getCacheStatus(
  blink: BlinkClient,
  domainUrl: string
): Promise<{ cached: boolean; expiresAt: string | null; cachedAt: string | null }> {
  try {
    const normalized = domainUrl.trim().toLowerCase().replace(/\/$/, '');
    const rows = await blink.db.funnelAnalysisCache.list({
      where: { domainUrl: normalized },
      orderBy: { createdAt: 'desc' },
      limit: 1,
    });

    if (!rows || rows.length === 0) return { cached: false, expiresAt: null, cachedAt: null };

    const row = rows[0];
    const expiresAt = new Date(row.expiresAt as string).getTime();
    const isValid = Date.now() <= expiresAt;

    return {
      cached: isValid,
      expiresAt: row.expiresAt as string,
      cachedAt: row.createdAt as string,
    };
  } catch {
    return { cached: false, expiresAt: null, cachedAt: null };
  }
}
