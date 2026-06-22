/**
 * scanRateLimit.ts — Client-side scan rate limit enforcement
 *
 * Works in two layers:
 *   1. localStorage check (instant, no network) — primary guard
 *   2. Backend API validation (authoritative) — secondary check
 *
 * The localStorage layer uses the same day-key as the backend,
 * ensuring consistency without requiring server round-trips for the UI.
 *
 * Max: 3 free scans per 24h window.
 */

const STORAGE_KEY = 'kompilot_scan_rl';
const MAX_FREE_SCANS = 3;
const BACKEND_URL = 'https://gbrhsehk.backend.blink.new';

interface ScanRecord {
  count: number;
  dayKey: string;
  resetAt: number; // UTC timestamp of next midnight
}

function getTodayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function getNextMidnightUTC(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
}

function readRecord(): ScanRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, dayKey: getTodayKey(), resetAt: getNextMidnightUTC() };
    const rec = JSON.parse(raw) as ScanRecord;
    // Reset if day has changed
    if (rec.dayKey !== getTodayKey()) {
      return { count: 0, dayKey: getTodayKey(), resetAt: getNextMidnightUTC() };
    }
    return rec;
  } catch {
    return { count: 0, dayKey: getTodayKey(), resetAt: getNextMidnightUTC() };
  }
}

function writeRecord(rec: ScanRecord): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rec));
  } catch {
    // Private mode or quota exceeded — silently degrade
  }
}

/**
 * Generates a lightweight browser fingerprint from available signals.
 * NOT cryptographic — only for rate-limit UX consistency.
 */
export function getBrowserFingerprint(): string {
  try {
    const signals = [
      navigator.userAgent,
      navigator.language,
      String(screen.width),
      String(screen.height),
      String(screen.colorDepth),
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    ].join('|');

    let h = 5381;
    for (let i = 0; i < signals.length; i++) {
      h = ((h << 5) + h) ^ signals.charCodeAt(i);
      h = h >>> 0;
    }
    return h.toString(16).padStart(8, '0');
  } catch {
    return '00000000';
  }
}

export interface ScanQuotaStatus {
  allowed: boolean;
  scansUsed: number;
  scansLimit: number;
  scansRemaining: number;
  resetsAt: Date;
  message: string | null;
}

/**
 * Checks whether a new scan is allowed (client-side only, instant).
 */
export function checkLocalQuota(): ScanQuotaStatus {
  const rec = readRecord();
  const resetsAt = new Date(rec.resetAt);
  const scansRemaining = Math.max(0, MAX_FREE_SCANS - rec.count);

  if (rec.count >= MAX_FREE_SCANS) {
    return {
      allowed: false,
      scansUsed: rec.count,
      scansLimit: MAX_FREE_SCANS,
      scansRemaining: 0,
      resetsAt,
      message:
        'Vous avez atteint la limite de diagnostics gratuits pour aujourd\'hui. ' +
        'Créez un compte pour débloquer des analyses illimitées.',
    };
  }

  return {
    allowed: true,
    scansUsed: rec.count,
    scansLimit: MAX_FREE_SCANS,
    scansRemaining,
    resetsAt,
    message: null,
  };
}

/**
 * Validates quota with the backend API (authoritative check + increments counter).
 * Falls back to local-only check if backend is unreachable.
 *
 * @returns ScanQuotaStatus — if allowed, the caller may proceed with the scan.
 */
export async function validateAndIncrementScan(): Promise<ScanQuotaStatus> {
  // Step 1: local check (fast path)
  const local = checkLocalQuota();
  if (!local.allowed) return local;

  // Step 2: backend authoritative check + increment
  try {
    const fp = getBrowserFingerprint();
    const res = await fetch(`${BACKEND_URL}/api/scanner/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Browser-FP': fp,
      },
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    const data = await res.json() as {
      allowed: boolean;
      scansUsed: number;
      scansLimit: number;
      scansRemaining: number;
      resetsAt: string;
      message: string | null;
    };

    if (!data.allowed) {
      return {
        allowed: false,
        scansUsed: data.scansUsed,
        scansLimit: data.scansLimit,
        scansRemaining: 0,
        resetsAt: new Date(data.resetsAt),
        message: data.message,
      };
    }

    // Backend allowed: update local counter to stay in sync
    const rec = readRecord();
    writeRecord({ ...rec, count: data.scansUsed });

    return {
      allowed: true,
      scansUsed: data.scansUsed,
      scansLimit: data.scansLimit,
      scansRemaining: data.scansRemaining,
      resetsAt: new Date(data.resetsAt),
      message: null,
    };
  } catch {
    // Backend unreachable — fall back to local increment
    const rec = readRecord();
    const newCount = rec.count + 1;
    writeRecord({ ...rec, count: newCount });

    return {
      allowed: true,
      scansUsed: newCount,
      scansLimit: MAX_FREE_SCANS,
      scansRemaining: Math.max(0, MAX_FREE_SCANS - newCount),
      resetsAt: new Date(rec.resetAt),
      message: null,
    };
  }
}
