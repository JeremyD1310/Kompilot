/**
 * safeApiCall — Production-grade API wrapper for external services.
 *
 * Features:
 * - Timeout protection (configurable, default 8s)
 * - Automatic fallback to cached data on 500 / timeout
 * - Polite user-facing status messages
 * - Centralized error logging for admin replay
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type SafeApiStatus = 'ok' | 'fallback' | 'error';

export interface SafeApiResult<T> {
  data: T;
  status: SafeApiStatus;
  /** Human-readable message to show the user when status ≠ 'ok' */
  userMessage?: string;
  /** ISO timestamp of fallback data freshness */
  cachedAt?: string;
}

export interface SafeApiOptions<T> {
  /** Unique cache key for this request */
  cacheKey: string;
  /** Fallback data to return when API fails */
  fallback: T;
  /** Timeout in ms (default 8000) */
  timeoutMs?: number;
  /** Service label for error logging (e.g. 'ChatGPT GEO', 'WhatsApp') */
  serviceLabel?: string;
  /** Polite message shown to user during fallback mode */
  fallbackMessage?: string;
}

// ── In-memory + sessionStorage cache ──────────────────────────────────────────

const MEM_CACHE = new Map<string, { data: unknown; at: string }>();

function readCache<T>(key: string): { data: T; at: string } | null {
  // Check memory first
  if (MEM_CACHE.has(key)) {
    const entry = MEM_CACHE.get(key)!;
    return { data: entry.data as T, at: entry.at };
  }
  // Try sessionStorage
  try {
    const raw = sessionStorage.getItem(`safeapi_${key}`);
    if (raw) {
      const parsed = JSON.parse(raw) as { data: T; at: string };
      MEM_CACHE.set(key, parsed); // promote to memory
      return parsed;
    }
  } catch { /* noop */ }
  return null;
}

function writeCache<T>(key: string, data: T): void {
  const entry = { data, at: new Date().toISOString() };
  MEM_CACHE.set(key, entry);
  try {
    sessionStorage.setItem(`safeapi_${key}`, JSON.stringify(entry));
  } catch { /* storage full — memory only */ }
}

// ── Error log (ring buffer, max 20 entries) ────────────────────────────────────

export interface ApiErrorLog {
  id: string;
  service: string;
  error: string;
  timestamp: string;
  url?: string;
  status?: number;
}

const ERROR_LOG_KEY = 'kompilot_api_errors';
const MAX_LOG_SIZE = 20;

export function logApiError(entry: Omit<ApiErrorLog, 'id'>): void {
  // Axe 5 FIX — console.error en fallback si localStorage est plein (QuotaExceededError)
  // ou désactivé (mode privé strict). Garantit que l'erreur est toujours tracée.
  try {
    const raw = localStorage.getItem(ERROR_LOG_KEY);
    const logs: ApiErrorLog[] = raw ? JSON.parse(raw) : [];
    logs.unshift({ ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` });
    if (logs.length > MAX_LOG_SIZE) logs.splice(MAX_LOG_SIZE);
    localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(logs));
  } catch {
    // localStorage indisponible ou plein — on trace en console pour le debugging
    console.error('[Kompilot API Error]', entry.service, entry.error, entry.timestamp);
  }
}

export function getApiErrorLogs(): ApiErrorLog[] {
  try {
    const raw = localStorage.getItem(ERROR_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function clearApiErrorLogs(): void {
  try { localStorage.removeItem(ERROR_LOG_KEY); } catch { /* noop */ }
}

// ── Fault simulator interceptor (lazy import to avoid circular deps) ──────────

function runFaultInterceptor(serviceLabel: string, cacheKey: string): void {
  try {
    // Dynamic require-style: read active faults from localStorage directly
    // (avoids circular imports — faultSimulator imports nothing from safeApiCall)
    const raw = localStorage.getItem('kompilot_active_faults');
    if (!raw) return;
    const active: string[] = JSON.parse(raw);
    if (active.length === 0) return;

    // Lazy-load fault definitions inline to keep this file self-contained
    // Granular error codes per fault type (keep in sync with faultSimulator.ts)
    const FAULT_SERVICE_MAP: Record<string, string> = {
      // Database
      db_timeout:           'Blink DB',
      db_cantopen:          'Blink DB',
      db_corrupt:           'Blink DB',
      db_constraint:        'Blink DB',
      db_full:              'Blink DB',
      db_readonly:          'Blink DB',
      // Auth
      auth_server_down:     'Auth Server',
      auth_token_expired:   'Auth Server',
      auth_token_invalid:   'Auth Server',
      auth_token_type:      'Auth Server',
      auth_rate_limit:      'Auth Server',
      auth_user_disabled:   'Auth Server',
      // External
      geo_api:              'ChatGPT/Gemini/Perplexity GEO',
      whatsapp:             'WhatsApp Business API',
    };
    const FAULT_ERRORS: Record<string, [errorCode: string, message: string, httpStatus?: number]> = {
      db_timeout:           ['SQLITE_BUSY',        'SQLITE_BUSY: database is locked — query timeout after 8000ms', 503],
      db_cantopen:          ['SQLITE_CANTOPEN',    'SQLITE_CANTOPEN: unable to open database file — no such file or directory', 500],
      db_corrupt:           ['SQLITE_CORRUPT',     'SQLITE_CORRUPT: database disk image is malformed — invalid magic number', 500],
      db_constraint:        ['SQLITE_CONSTRAINT',  'SQLITE_CONSTRAINT: UNIQUE constraint failed: scheduled_posts.id', 409],
      db_full:              ['SQLITE_FULL',         'SQLITE_FULL: database or disk is full — quota exceeded', 507],
      db_readonly:          ['SQLITE_READONLY',    'SQLITE_READONLY: attempt to write a readonly database — write operations not permitted', 403],
      auth_server_down:     ['AUTH_SERVICE_UNAVAILABLE', 'AuthServiceError: 503 Service Unavailable — auth.blink.new is unreachable, retry in 30s', 503],
      auth_token_expired:   ['JWT_TOKEN_EXPIRED',   'JsonWebTokenError[TokenExpiredError]: jwt expired — exp claim: 2026-06-01T00:00:00Z', 401],
      auth_token_invalid:   ['JWT_INVALID_SIGNATURE','JsonWebTokenError: invalid signature — token payload tampered or signed with wrong secret', 401],
      auth_token_type:      ['JWT_WRONG_TOKEN_TYPE','TokenTypeError: expected token_type=access but received token_type=refresh — use /token/refresh', 401],
      auth_rate_limit:      ['AUTH_RATE_LIMIT_EXCEEDED','RateLimitError: 429 Too Many Requests — login attempts exceeded (10/min), retry-after: 60s', 429],
      auth_user_disabled:   ['AUTH_USER_DISABLED',  'AuthorizationError: 403 Forbidden — user account has been disabled by an administrator', 403],
      geo_api:              ['GEO_API_TIMEOUT',     'TimeoutError: no response after 6000ms — all GEO AI providers unreachable', 504],
      whatsapp:             ['WHATSAPP_SERVICE_UNAVAILABLE','WhatsAppBusinessAPIError: 503 Service Temporarily Unavailable — graph.facebook.com unreachable', 503],
    };

    for (const faultId of active) {
      const faultService = FAULT_SERVICE_MAP[faultId] ?? '';
      const sl = serviceLabel.toLowerCase();
      const fs = faultService.toLowerCase();
      const matches = sl.includes(fs) || fs.includes(sl)
        || (faultId.startsWith('db_') && /\bdb\b|database|blink db/i.test(serviceLabel))
        || (faultId.startsWith('auth_') && /auth|login|token|jwt/i.test(serviceLabel));

      if (matches) {
        const [errorCode, errorMessage, httpStatus] = FAULT_ERRORS[faultId] ?? ['FAULT_UNKNOWN', 'Simulated fault'];
        // Log fault interception
        try {
          const logRaw = localStorage.getItem('kompilot_fault_log');
          const logs = logRaw ? JSON.parse(logRaw) : [];
          logs.unshift({
            id: `fl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
            faultId,
            errorCode,
            service: serviceLabel,
            interceptedAt: new Date().toISOString(),
            callerCacheKey: cacheKey,
          });
          if (logs.length > 100) logs.splice(100);
          localStorage.setItem('kompilot_fault_log', JSON.stringify(logs));
        } catch { /* noop */ }

        const err = new Error(`[FaultSimulator:${faultId}] [${errorCode}] ${errorMessage}`);
        (err as Error & { faultId: string; errorCode: string; httpStatus?: number }).faultId = faultId;
        (err as Error & { faultId: string; errorCode: string; httpStatus?: number }).errorCode = errorCode;
        (err as Error & { faultId: string; errorCode: string; httpStatus?: number }).httpStatus = httpStatus;
        throw err;
      }
    }
  } catch (e) {
    // Re-throw only fault errors, not parsing errors
    if (e instanceof Error && e.message.startsWith('[FaultSimulator:')) throw e;
  }
}

// ── Core wrapper ───────────────────────────────────────────────────────────────

export async function safeApiCall<T>(
  apiFn: () => Promise<T>,
  options: SafeApiOptions<T>,
): Promise<SafeApiResult<T>> {
  const {
    cacheKey,
    fallback,
    timeoutMs = 8000,
    serviceLabel = 'External API',
    fallbackMessage = 'Analyse locale en cours d\'optimisation, vos résultats arrivent dans quelques instants…',
  } = options;

  // Build a timeout-wrapped promise
  const withTimeout = <R>(promise: Promise<R>, ms: number): Promise<R> => {
    const timer = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    );
    return Promise.race([promise, timer]);
  };

  try {
    // ── Fault simulator check (dev/QA only — no-op if no active faults) ───────
    runFaultInterceptor(serviceLabel, cacheKey);

    const data = await withTimeout(apiFn(), timeoutMs);
    // Success — update cache
    writeCache(cacheKey, data);
    return { data, status: 'ok' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);

    // Log for admin replay
    logApiError({
      service: serviceLabel,
      error: errorMsg,
      timestamp: new Date().toISOString(),
    });

    // ── Fire external API outage banner if the failing service is a known partner ──
    const sl = serviceLabel.toLowerCase();
    if (sl.includes('google') || sl.includes('gmb') || sl.includes('maps') || sl.includes('mybusiness')) {
      reportApiOutage('Google', errorMsg.slice(0, 50));
    } else if (sl.includes('meta') || sl.includes('facebook') || sl.includes('instagram') || sl.includes('graph.facebook')) {
      reportApiOutage('Meta', errorMsg.slice(0, 50));
    } else if (sl.includes('openai') || sl.includes('gpt') || sl.includes('anthropic') || sl.includes('claude')) {
      reportApiOutage('OpenAI', errorMsg.slice(0, 50));
    }

    // Try cache first
    const cached = readCache<T>(cacheKey);
    if (cached) {
      return {
        data: cached.data,
        status: 'fallback',
        userMessage: fallbackMessage,
        cachedAt: cached.at,
      };
    }

    // Last resort — use provided fallback
    return {
      data: fallback,
      status: 'fallback',
      userMessage: fallbackMessage,
    };
  }
}

// ── React hook ─────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import { reportApiOutage } from './externalApiInterceptor';

export interface UseSafeApiState<T> {
  data: T | null;
  status: SafeApiStatus | 'idle' | 'loading';
  userMessage: string | null;
  cachedAt: string | null;
  run: () => Promise<void>;
}

export function useSafeApi<T>(
  apiFn: () => Promise<T>,
  options: SafeApiOptions<T>,
): UseSafeApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<SafeApiStatus | 'idle' | 'loading'>('idle');
  const [userMessage, setUserMessage] = useState<string | null>(null);
  const [cachedAt, setCachedAt] = useState<string | null>(null);

  const run = useCallback(async () => {
    setStatus('loading');
    setUserMessage(null);
    const result = await safeApiCall(apiFn, options);
    setData(result.data);
    setStatus(result.status);
    setUserMessage(result.userMessage ?? null);
    setCachedAt(result.cachedAt ?? null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.cacheKey]);

  return { data, status, userMessage, cachedAt, run };
}
