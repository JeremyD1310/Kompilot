/**
 * scanRateLimiter.ts — Free GeoScanner Flash Rate Limiter
 *
 * Limits unauthenticated (landing page) scans to:
 *   - 3 real scans per IP per 24 hours
 *
 * Storage: uses the `leads` table as a lightweight KV store
 *   - id = "ratelimit_<hashedIp>_<dayKey>"
 *   - visibility_score = scan count
 *   - status = "rate_limit_counter"
 *
 * Client-side fingerprint is also checked (sent as X-Browser-FP header)
 * for extra resilience against IP rotation.
 */

import { createClient } from '@blinkdotnew/sdk';

const MAX_FREE_SCANS_PER_DAY = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getBlink(env: Record<string, string>) {
  return createClient({
    projectId: env.BLINK_PROJECT_ID,
    secretKey: env.BLINK_SECRET_KEY,
  });
}

function getDayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/**
 * Simple deterministic hash (no crypto dep needed for rate-limit keys).
 * NOT cryptographic — purely for privacy-safe keying.
 */
function hashString(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
    h = h >>> 0; // keep unsigned
  }
  return h.toString(16).padStart(8, '0');
}

function makeRecordId(ip: string, fingerprint: string, dayKey: string): string {
  const ipHash = hashString(ip);
  const fpHash = fingerprint ? hashString(fingerprint) : '00000000';
  return `rl_scan_${ipHash}_${fpHash}_${dayKey}`;
}

export interface RateLimitResult {
  allowed: boolean;
  scansUsed: number;
  scansLimit: number;
  scansRemaining: number;
  resetsAt: string; // ISO timestamp of next day reset (UTC midnight)
  message: string | null;
}

/**
 * Checks and increments the free scan counter for a given IP + fingerprint.
 * Call this BEFORE running the real scan.
 *
 * @param env         - CF Worker env bindings
 * @param ip          - Client IP address
 * @param fingerprint - Browser fingerprint (optional, from X-Browser-FP header)
 */
export async function checkAndIncrementScanQuota(
  env: Record<string, string>,
  ip: string,
  fingerprint = '',
): Promise<RateLimitResult> {
  const blink = getBlink(env);
  const dayKey = getDayKey();
  const recordId = makeRecordId(ip, fingerprint, dayKey);

  // Next UTC midnight reset time
  const now = new Date();
  const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const resetsAt = tomorrow.toISOString();

  try {
    // Try to load existing counter for today
    const rows = await blink.db.leads.list({
      where: { id: recordId, status: 'rate_limit_counter' },
      limit: 1,
    });

    const existing = rows?.[0];
    const currentCount = existing ? Number((existing as any).visibilityScore ?? 0) : 0;

    if (currentCount >= MAX_FREE_SCANS_PER_DAY) {
      // Quota exhausted
      return {
        allowed: false,
        scansUsed: currentCount,
        scansLimit: MAX_FREE_SCANS_PER_DAY,
        scansRemaining: 0,
        resetsAt,
        message:
          'Vous avez atteint la limite de diagnostics gratuits pour aujourd\'hui. ' +
          'Créez un compte pour débloquer des analyses illimitées.',
      };
    }

    // Increment counter (upsert)
    const newCount = currentCount + 1;
    if (existing) {
      await blink.db.leads.update(recordId, {
        visibilityScore: newCount,
        status: 'rate_limit_counter',
      });
    } else {
      await blink.db.leads.create({
        id: recordId,
        businessName: `rate_limit_${dayKey}`,
        email: `ratelimit-${recordId}@internal.kompilot`,
        visibilityScore: newCount,
        scanData: JSON.stringify({ ip: hashString(ip), fp: hashString(fingerprint), day: dayKey }),
        status: 'rate_limit_counter',
      });
    }

    return {
      allowed: true,
      scansUsed: newCount,
      scansLimit: MAX_FREE_SCANS_PER_DAY,
      scansRemaining: MAX_FREE_SCANS_PER_DAY - newCount,
      resetsAt,
      message: null,
    };
  } catch (err) {
    // If rate-limit check fails (DB error), fail-OPEN to avoid blocking legit users
    // but log the error
    console.error('[scanRateLimiter] Rate limit check failed (fail-open):', err);
    return {
      allowed: true,
      scansUsed: 0,
      scansLimit: MAX_FREE_SCANS_PER_DAY,
      scansRemaining: MAX_FREE_SCANS_PER_DAY,
      resetsAt,
      message: null,
    };
  }
}

/**
 * Check quota WITHOUT incrementing (read-only, for preflight).
 */
export async function getScanQuota(
  env: Record<string, string>,
  ip: string,
  fingerprint = '',
): Promise<RateLimitResult> {
  const blink = getBlink(env);
  const dayKey = getDayKey();
  const recordId = makeRecordId(ip, fingerprint, dayKey);

  const now = new Date();
  const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const resetsAt = tomorrow.toISOString();

  try {
    const rows = await blink.db.leads.list({
      where: { id: recordId, status: 'rate_limit_counter' },
      limit: 1,
    });
    const existing = rows?.[0];
    const currentCount = existing ? Number((existing as any).visibilityScore ?? 0) : 0;
    const remaining = Math.max(0, MAX_FREE_SCANS_PER_DAY - currentCount);

    return {
      allowed: remaining > 0,
      scansUsed: currentCount,
      scansLimit: MAX_FREE_SCANS_PER_DAY,
      scansRemaining: remaining,
      resetsAt,
      message:
        remaining === 0
          ? 'Vous avez atteint la limite de diagnostics gratuits pour aujourd\'hui. Créez un compte pour débloquer des analyses illimitées.'
          : null,
    };
  } catch {
    return {
      allowed: true,
      scansUsed: 0,
      scansLimit: MAX_FREE_SCANS_PER_DAY,
      scansRemaining: MAX_FREE_SCANS_PER_DAY,
      resetsAt,
      message: null,
    };
  }
}
