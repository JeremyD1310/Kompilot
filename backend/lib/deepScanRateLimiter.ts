/**
 * deepScanRateLimiter.ts — Authenticated Deep Scan Rate Limiter
 *
 * Limits authenticated pro users to:
 *   - 3 Deep Scans per IP per hour
 *   - 3 Deep Scans per SIRET per hour
 *
 * Storage: uses the `leads` table as lightweight KV store
 *   - id = "ds_rl_<hash>_<hourKey>"
 *   - visibility_score = scan count
 *   - status = "deep_scan_rl"
 *
 * Fail-open: if DB check errors, allow the scan (don't block legit users).
 */

import { createClient } from '@blinkdotnew/sdk';

const MAX_DEEP_SCANS_PER_HOUR = 3;

function getBlink(env: Record<string, string>) {
  return createClient({
    projectId: env.BLINK_PROJECT_ID,
    secretKey: env.BLINK_SECRET_KEY,
  });
}

function getHourKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCHours()).padStart(2, '0')}`;
}

function hashString(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
    h = h >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export interface DeepScanRateLimitResult {
  allowed: boolean;
  scansUsed: number;
  scansLimit: number;
  scansRemaining: number;
  resetsAt: string;
  blockedBy: 'ip' | 'siret' | null;
  message: string | null;
}

async function checkAndIncrementKey(
  blink: ReturnType<typeof createClient>,
  recordId: string,
  hourKey: string,
): Promise<{ count: number; wasCreated: boolean }> {
  const rows = await blink.db.leads.list({
    where: { id: recordId, status: 'deep_scan_rl' },
    limit: 1,
  });
  const existing = rows?.[0];
  const currentCount = existing ? Number((existing as any).visibilityScore ?? 0) : 0;
  const newCount = currentCount + 1;

  if (existing) {
    await blink.db.leads.update(recordId, {
      visibilityScore: newCount,
    });
  } else {
    await blink.db.leads.create({
      id: recordId,
      businessName: `deep_scan_rl_${hourKey}`,
      email: `ds-ratelimit-${recordId}@internal.kompilot`,
      visibilityScore: newCount,
      status: 'deep_scan_rl',
    });
  }

  return { count: newCount, wasCreated: !existing };
}

/**
 * Checks and increments deep scan quota for IP and/or SIRET.
 * Both are checked independently — either can block the request.
 */
export async function checkDeepScanQuota(
  env: Record<string, string>,
  ip: string,
  siret?: string,
): Promise<DeepScanRateLimitResult> {
  const blink = getBlink(env);
  const hourKey = getHourKey();

  // Compute next hour reset time
  const now = new Date();
  const nextHour = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
    now.getUTCHours() + 1, 0, 0, 0,
  ));
  const resetsAt = nextHour.toISOString();

  try {
    // ── Check IP quota (read-only first) ───────────────────────────────────────
    const ipHash = hashString(ip);
    const ipRecordId = `ds_rl_ip_${ipHash}_${hourKey}`;

    const ipRows = await blink.db.leads.list({
      where: { id: ipRecordId, status: 'deep_scan_rl' },
      limit: 1,
    });
    const ipCount = ipRows?.[0] ? Number((ipRows[0] as any).visibilityScore ?? 0) : 0;

    if (ipCount >= MAX_DEEP_SCANS_PER_HOUR) {
      return {
        allowed: false,
        scansUsed: ipCount,
        scansLimit: MAX_DEEP_SCANS_PER_HOUR,
        scansRemaining: 0,
        resetsAt,
        blockedBy: 'ip',
        message: `Limite de ${MAX_DEEP_SCANS_PER_HOUR} diagnostics approfondis par heure atteinte. Réessayez à ${nextHour.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC.`,
      };
    }

    // ── Check SIRET quota if provided ──────────────────────────────────────────
    if (siret && siret.length >= 9) {
      const siretHash = hashString(siret.replace(/\s/g, ''));
      const siretRecordId = `ds_rl_siret_${siretHash}_${hourKey}`;

      const siretRows = await blink.db.leads.list({
        where: { id: siretRecordId, status: 'deep_scan_rl' },
        limit: 1,
      });
      const siretCount = siretRows?.[0] ? Number((siretRows[0] as any).visibilityScore ?? 0) : 0;

      if (siretCount >= MAX_DEEP_SCANS_PER_HOUR) {
        return {
          allowed: false,
          scansUsed: siretCount,
          scansLimit: MAX_DEEP_SCANS_PER_HOUR,
          scansRemaining: 0,
          resetsAt,
          blockedBy: 'siret',
          message: `Limite de ${MAX_DEEP_SCANS_PER_HOUR} diagnostics approfondis par heure atteinte pour ce SIRET. Réessayez à ${nextHour.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC.`,
        };
      }

      // Increment SIRET counter
      await checkAndIncrementKey(blink, siretRecordId, hourKey);
    }

    // ── Increment IP counter ───────────────────────────────────────────────────
    const { count: newIpCount } = await checkAndIncrementKey(blink, ipRecordId, hourKey);

    return {
      allowed: true,
      scansUsed: newIpCount,
      scansLimit: MAX_DEEP_SCANS_PER_HOUR,
      scansRemaining: Math.max(0, MAX_DEEP_SCANS_PER_HOUR - newIpCount),
      resetsAt,
      blockedBy: null,
      message: null,
    };
  } catch (err) {
    // Fail-open: DB error should not block legit users
    console.error('[deepScanRateLimiter] Rate limit check failed (fail-open):', err);
    return {
      allowed: true,
      scansUsed: 0,
      scansLimit: MAX_DEEP_SCANS_PER_HOUR,
      scansRemaining: MAX_DEEP_SCANS_PER_HOUR,
      resetsAt,
      blockedBy: null,
      message: null,
    };
  }
}
