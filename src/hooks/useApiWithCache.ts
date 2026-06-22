/**
 * useApiWithCache — React hook for external API calls with stale-data fallback
 *
 * Usage:
 *   const { data, isStale, staleAgeHours, retry } = useApiWithCache({
 *     cacheKey: 'google_mybusiness_estab123',
 *     fetcher: () => fetchGoogleData(),
 *     staleWhileRevalidate: true,
 *   });
 *
 * When the live fetch fails:
 *  - Returns last persisted data from localStorage/sessionStorage
 *  - isStale = true, staleAgeHours = hours since last success
 *  - Shows retry button in the StaleDataBanner component
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface CachedEntry<T> {
  data: T;
  cachedAt: number; // timestamp ms
  cacheKey: string;
}

export interface UseApiWithCacheResult<T> {
  data: T | null;
  isLoading: boolean;
  isStale: boolean;
  staleAgeHours: number | null;
  cachedAt: Date | null;
  error: string | null;
  retry: () => void;
}

interface UseApiWithCacheOptions<T> {
  cacheKey: string;
  fetcher: () => Promise<T>;
  /** Keep showing stale data while re-fetching (default: true) */
  staleWhileRevalidate?: boolean;
  /** Refetch interval in ms (0 = no auto-refresh; default 0) */
  refreshIntervalMs?: number;
  /** Disable the hook entirely */
  enabled?: boolean;
}

const CACHE_PREFIX = 'kompilot_api_cache_';
const MAX_CACHE_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days max before discarding

function readCache<T>(key: string): CachedEntry<T> | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CachedEntry<T>;
    // Discard if too old
    if (Date.now() - entry.cachedAt > MAX_CACHE_AGE_MS) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T): void {
  try {
    const entry: CachedEntry<T> = {
      data,
      cachedAt: Date.now(),
      cacheKey: key,
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Storage quota exceeded or private mode — silently fail
  }
}

export function useApiWithCache<T>({
  cacheKey,
  fetcher,
  staleWhileRevalidate = true,
  refreshIntervalMs = 0,
  enabled = true,
}: UseApiWithCacheOptions<T>): UseApiWithCacheResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [staleAgeHours, setStaleAgeHours] = useState<number | null>(null);
  const [cachedAt, setCachedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const execute = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);

    try {
      const freshData = await fetcher();
      writeCache(cacheKey, freshData);
      setData(freshData);
      setIsStale(false);
      setStaleAgeHours(null);
      setCachedAt(new Date());
    } catch (err) {
      // Live fetch failed — try cache
      const cached = readCache<T>(cacheKey);
      if (cached) {
        setData(cached.data);
        setIsStale(true);
        const ageMs = Date.now() - cached.cachedAt;
        setStaleAgeHours(Math.round(ageMs / (1000 * 60 * 60) * 10) / 10);
        setCachedAt(new Date(cached.cachedAt));
        setError(null); // we have stale data, not an error
      } else {
        setError(
          err instanceof Error
            ? err.message
            : 'Données non disponibles — aucun cache trouvé.'
        );
        setIsStale(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey, fetcher, enabled]);

  // Preload from cache immediately (zero-latency)
  useEffect(() => {
    if (!enabled) return;
    const cached = readCache<T>(cacheKey);
    if (cached) {
      setData(cached.data);
      if (staleWhileRevalidate) {
        const ageMs = Date.now() - cached.cachedAt;
        // Only mark stale if older than 1h
        if (ageMs > 60 * 60 * 1000) {
          setIsStale(true);
          setStaleAgeHours(Math.round(ageMs / (1000 * 60 * 60) * 10) / 10);
          setCachedAt(new Date(cached.cachedAt));
        }
      }
    }
  }, [cacheKey, staleWhileRevalidate, enabled]);

  // Initial fetch
  useEffect(() => {
    execute();
  }, [execute]);

  // Auto-refresh interval
  useEffect(() => {
    if (!enabled || !refreshIntervalMs) return;
    intervalRef.current = setInterval(execute, refreshIntervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [execute, refreshIntervalMs, enabled]);

  return { data, isLoading, isStale, staleAgeHours, cachedAt, error, retry: execute };
}
