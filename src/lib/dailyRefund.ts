/**
 * dailyRefund.ts
 *
 * Automatic end-of-day credit refund for unused category budgets.
 *
 * Logic:
 *   For each category that has a daily cap configured, if the user spent
 *   LESS than their cap today, the unused credits are refunded to their
 *   monthly usage counter (reducing `stored.used` in CreditsContext).
 *
 * Runs once per calendar day on app mount (guarded by a localStorage key).
 * Refunds are capped so monthly usage never goes below 0.
 *
 * Storage keys (read-only here — written by EcoModeContext):
 *   kompilot_daily_usage_v2   → DailyUsage { date, used, byCategory }
 *   kompilot_budget_settings_v2 → BudgetSettings { categoryCaps, … }
 *   kompilot_usage_v2          → StoredUsage { month, used }  (CreditsContext)
 *
 * Own storage keys:
 *   kompilot_refund_log_v1     → RefundEntry[]  (last 30 days of history)
 *   kompilot_last_refund_v1    → YYYY-MM-DD     (guard: run once per day)
 */

// ── Keys ──────────────────────────────────────────────────────────────────────

const DAILY_KEY    = 'kompilot_daily_usage_v2';
const SETTINGS_KEY = 'kompilot_budget_settings_v2';
const USAGE_KEY    = 'kompilot_usage_v2';
const REFUND_LOG   = 'kompilot_refund_log_v1';
const LAST_REFUND  = 'kompilot_last_refund_v1';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RefundEntry {
  /** Date the refund was *computed* (yesterday's date) */
  date: string;
  /** Total credits refunded across all categories */
  totalRefunded: number;
  /** Per-category breakdown */
  breakdown: { category: string; cap: number; used: number; refunded: number }[];
}

export interface RefundResult {
  /** Was a refund actually computed this session? */
  applied: boolean;
  /** How many credits were returned to the pool (0 if nothing to refund) */
  totalRefunded: number;
  /** Full breakdown for the toast */
  entry: RefundEntry | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
}

// ── Refund log helpers ────────────────────────────────────────────────────────

export function getRefundLog(): RefundEntry[] {
  return safeGet<RefundEntry[]>(REFUND_LOG, []);
}

function appendRefundLog(entry: RefundEntry): void {
  const log = getRefundLog();
  log.unshift(entry);
  safeSet(REFUND_LOG, log.slice(0, 30)); // keep last 30 days
}

// ── Core refund computation ───────────────────────────────────────────────────

/**
 * Computes and applies the daily refund.
 *
 * Should be called once on app mount. Returns a RefundResult so the caller
 * can decide whether to show a toast.
 *
 * @param forceDate  Override "yesterday" for testing (YYYY-MM-DD)
 */
export function computeDailyRefund(forceDate?: string): RefundResult {
  const today = getTodayStr();

  // ── Guard: only run once per calendar day ──────────────────────────────────
  const lastRun = safeGet<string>(LAST_REFUND, '');
  if (lastRun === today) {
    return { applied: false, totalRefunded: 0, entry: null };
  }

  // Mark as run for today immediately (prevents double-run on fast re-mounts)
  safeSet(LAST_REFUND, today);

  const yesterday = forceDate ?? getYesterdayStr();

  // ── Read yesterday's usage ─────────────────────────────────────────────────
  interface DailyUsage { date: string; used: number; byCategory: Record<string, number> }
  const daily = safeGet<DailyUsage>(DAILY_KEY, { date: '', used: 0, byCategory: {} });

  // If the daily record isn't from yesterday, there's nothing to refund
  // (fresh install, or user skipped a day — no punitive refunds for missed days)
  if (daily.date !== yesterday) {
    return { applied: false, totalRefunded: 0, entry: null };
  }

  // ── Read category caps ─────────────────────────────────────────────────────
  interface BudgetSettings { categoryCaps: Record<string, number | null> }
  const settings = safeGet<BudgetSettings>(SETTINGS_KEY, { categoryCaps: {} });
  const caps = settings.categoryCaps ?? {};

  if (Object.keys(caps).length === 0) {
    // No category caps configured → nothing to refund
    return { applied: false, totalRefunded: 0, entry: null };
  }

  // ── Compute per-category refunds ───────────────────────────────────────────
  const breakdown: RefundEntry['breakdown'] = [];
  let totalRefunded = 0;

  for (const [category, cap] of Object.entries(caps)) {
    if (cap === null || cap === undefined || cap <= 0) continue;
    const used = daily.byCategory[category] ?? 0;
    if (used < cap) {
      const refunded = cap - used;
      breakdown.push({ category, cap, used, refunded });
      totalRefunded += refunded;
    }
  }

  if (totalRefunded === 0) {
    return { applied: false, totalRefunded: 0, entry: null };
  }

  // ── Apply refund to monthly usage counter ─────────────────────────────────
  interface StoredUsage { month: string; used: number }
  const stored = safeGet<StoredUsage>(USAGE_KEY, { month: '', used: 0 });
  const newUsed = Math.max(0, stored.used - totalRefunded);
  safeSet(USAGE_KEY, { ...stored, used: newUsed });

  // ── Record in refund log ───────────────────────────────────────────────────
  const entry: RefundEntry = { date: yesterday, totalRefunded, breakdown };
  appendRefundLog(entry);

  return { applied: true, totalRefunded, entry };
}
