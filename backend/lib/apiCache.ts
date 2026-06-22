/**
 * apiCache.ts — External API Fault-Tolerance Layer
 *
 * Strategy:
 *  1. Try the live external API call (wrapped fetch or provider call)
 *  2. On success: persist the result + timestamp to the DB cache table (scheduled_posts reuse)
 *  3. On failure: load the last valid cached record and return it with a stale flag + age
 *
 * The cache key is: `cache:<source>:<userId>:<cacheKey>`
 * Stored in scheduled_posts.text_content as JSON with status = 'api_cache'
 */

import { createClient } from '@blinkdotnew/sdk';

export interface CacheEntry<T = unknown> {
  data: T;
  cachedAt: string; // ISO
  source: string;
  cacheKey: string;
}

export interface WithCacheResult<T = unknown> {
  data: T;
  isStale: boolean;
  staleAgeHours: number | null;
  cachedAt: string | null;
  source: string;
}

function getBlink(env: Record<string, string>) {
  return createClient({
    projectId: env.BLINK_PROJECT_ID,
    secretKey: env.BLINK_SECRET_KEY,
  });
}

/**
 * Wraps an external API call with automatic cache fallback.
 *
 * @param env       - Cloudflare env bindings
 * @param userId    - Authenticated user ID (for scoped cache)
 * @param source    - Source label, e.g. "google_mybusiness", "meta_insights"
 * @param cacheKey  - Unique key within the source, e.g. establishmentId
 * @param fetcher   - Async function that calls the external API
 * @param maxAgeHours - Cache TTL (default 24h; serves stale data beyond this but warns)
 */
export async function withCacheFallback<T>(
  env: Record<string, string>,
  userId: string,
  source: string,
  cacheKey: string,
  fetcher: () => Promise<T>,
  maxAgeHours = 24,
): Promise<WithCacheResult<T>> {
  const blink = getBlink(env);
  const recordId = `cache_${source}_${userId}_${cacheKey}`.replace(/[^a-z0-9_]/gi, '_').slice(0, 80);

  // ── 1. Try live fetch ────────────────────────────────────────────────────────
  try {
    const freshData = await fetcher();

    // Persist to cache (upsert via create with duplicate handling)
    const entry: CacheEntry<T> = {
      data: freshData,
      cachedAt: new Date().toISOString(),
      source,
      cacheKey,
    };

    try {
      await blink.db.scheduled_posts.upsert({
        id: recordId,
        userId,
        establishmentId: cacheKey,
        textContent: JSON.stringify(entry),
        channels: '["api_cache"]',
        status: 'api_cache',
        scheduledAt: new Date().toISOString(),
      });
    } catch {
      // Cache write failure is non-fatal; fresh data already retrieved
    }

    return {
      data: freshData,
      isStale: false,
      staleAgeHours: null,
      cachedAt: entry.cachedAt,
      source,
    };
  } catch (fetchErr) {
    console.warn(`[apiCache] Live fetch failed for ${source}/${cacheKey}:`, (fetchErr as Error).message);
  }

  // ── 2. Fallback: load last cached record ─────────────────────────────────────
  try {
    const rows = await blink.db.scheduled_posts.list({
      where: { id: recordId, userId, status: 'api_cache' },
      limit: 1,
    });

    const cached = rows?.[0];
    if (cached) {
      const entry: CacheEntry<T> = JSON.parse((cached as any).textContent || '{}');
      const cachedAt = new Date(entry.cachedAt);
      const ageMs = Date.now() - cachedAt.getTime();
      const staleAgeHours = Math.round(ageMs / (1000 * 60 * 60) * 10) / 10;

      return {
        data: entry.data,
        isStale: true,
        staleAgeHours,
        cachedAt: entry.cachedAt,
        source,
      };
    }
  } catch (cacheErr) {
    console.error(`[apiCache] Cache read failed for ${source}/${cacheKey}:`, cacheErr);
  }

  // ── 3. No cache available — throw so caller can handle gracefully ────────────
  throw new Error(`[apiCache] No live data and no cache for ${source}/${cacheKey}`);
}

/**
 * Formats a human-readable stale age label for the UI warning banner.
 */
export function formatStaleAge(hours: number | null): string {
  if (hours === null) return '';
  if (hours < 1) return 'moins d\'1 heure';
  if (hours < 24) return `${Math.round(hours)} heure${hours >= 2 ? 's' : ''}`;
  const days = Math.round(hours / 24);
  return `${days} jour${days > 1 ? 's' : ''}`;
}
