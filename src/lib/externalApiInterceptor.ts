/**
 * externalApiInterceptor.ts — External API Outage Interceptor
 *
 * Detects when Google, Meta (Facebook/Instagram) or OpenAI APIs return
 * 5xx / timeout / CORS / network errors and emits a global event that
 * the ExternalApiOutageBanner component listens to.
 *
 * Usage:
 *   import { withApiOutageDetection } from '../lib/externalApiInterceptor';
 *
 *   const result = await withApiOutageDetection(
 *     'Google',
 *     fetch('https://mybusiness.googleapis.com/...')
 *   );
 *
 * The interceptor:
 *  - Does NOT throw — always returns the original promise result
 *  - Fires a DOM CustomEvent 'external-api-outage' on window when an outage is detected
 *  - Auto-clears the outage flag after 5 minutes of no errors
 */

export type ExternalApiPartner = 'Google' | 'Meta' | 'OpenAI';

export interface OutageEvent {
  partner: ExternalApiPartner;
  detectedAt: string;
  errorCode?: string;
}

// ── Known error patterns that indicate partner-side outage ───────────────────

const OUTAGE_STATUS_CODES = new Set([500, 502, 503, 504, 529]);
const OUTAGE_TIMEOUT_MS = 5 * 60 * 1000; // Clear outage after 5 minutes of silence

// In-memory outage registry: partner → timestamp when outage was detected
const activeOutages = new Map<ExternalApiPartner, number>();

// ── Dispatch / clear helpers ─────────────────────────────────────────────────

function fireOutageEvent(partner: ExternalApiPartner, errorCode?: string) {
  const now = Date.now();
  const lastDetected = activeOutages.get(partner) ?? 0;

  // Debounce: don't re-fire if outage already active and recent
  if (now - lastDetected < 30_000) return;

  activeOutages.set(partner, now);

  const event: OutageEvent = {
    partner,
    detectedAt: new Date().toISOString(),
    errorCode,
  };

  window.dispatchEvent(new CustomEvent('external-api-outage', { detail: event }));

  // Auto-clear after OUTAGE_TIMEOUT_MS
  setTimeout(() => {
    if (activeOutages.get(partner) === now) {
      activeOutages.delete(partner);
      window.dispatchEvent(new CustomEvent('external-api-outage-cleared', { detail: { partner } }));
    }
  }, OUTAGE_TIMEOUT_MS);
}

function detectOutageFromResponse(partner: ExternalApiPartner, res: Response): void {
  if (OUTAGE_STATUS_CODES.has(res.status)) {
    fireOutageEvent(partner, `HTTP_${res.status}`);
  }
}

function detectOutageFromError(partner: ExternalApiPartner, err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);

  // Network-level failures: CORS, timeout, DNS, connection refused
  if (
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('CORS') ||
    msg.includes('ERR_NAME_NOT_RESOLVED') ||
    msg.includes('ERR_CONNECTION_REFUSED') ||
    msg.includes('Timeout') ||
    msg.includes('timeout') ||
    msg.includes('AbortError')
  ) {
    fireOutageEvent(partner, 'NETWORK_ERROR');
  }
}

// ── Main wrapper ─────────────────────────────────────────────────────────────

/**
 * Wraps a fetch Promise to detect outages without crashing the caller.
 * Always resolves (never rejects) — the caller still receives the original
 * Response or the error is swallowed after detection.
 */
export async function withApiOutageDetection<T>(
  partner: ExternalApiPartner,
  promise: Promise<T>,
): Promise<T | null> {
  try {
    const result = await promise;

    // If result is a Response, check the status
    if (result instanceof Response) {
      detectOutageFromResponse(partner, result);
    }

    return result;
  } catch (err) {
    detectOutageFromError(partner, err);
    return null;
  }
}

/**
 * Manually report an outage from an SDK error (e.g. blink.ai errors from OpenAI).
 * Call this in your catch blocks for AI-powered features.
 */
export function reportApiOutage(partner: ExternalApiPartner, errorCode?: string): void {
  fireOutageEvent(partner, errorCode);
}

/**
 * Check if a partner is currently flagged as down.
 */
export function isPartnerDown(partner: ExternalApiPartner): boolean {
  const detected = activeOutages.get(partner);
  if (!detected) return false;
  if (Date.now() - detected > OUTAGE_TIMEOUT_MS) {
    activeOutages.delete(partner);
    return false;
  }
  return true;
}

/**
 * Get all currently active outages.
 */
export function getActiveOutages(): ExternalApiPartner[] {
  const now = Date.now();
  const result: ExternalApiPartner[] = [];
  for (const [partner, ts] of activeOutages.entries()) {
    if (now - ts <= OUTAGE_TIMEOUT_MS) {
      result.push(partner);
    } else {
      activeOutages.delete(partner);
    }
  }
  return result;
}
