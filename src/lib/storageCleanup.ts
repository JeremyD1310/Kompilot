/**
 * storageCleanup.ts
 *
 * Audit-grade storage cleanup utilities for Kompilot.
 *
 * Call `fullStorageCleanup()` on logout to ensure 100% clean slate:
 * - All user-scoped billing keys
 * - All global Kompilot keys
 * - All session cache keys
 * - All mentor / onboarding / demo flags
 *
 * This module is intentionally self-contained (no React imports)
 * so it can be called from anywhere — hooks, error boundaries, logout flows.
 */

/** All global localStorage key prefixes and exact keys to purge on logout */
const GLOBAL_LS_KEYS: string[] = [
  // Auth
  'blink_user_id',
  // Billing (unscoped/legacy)
  'kompilot_plan',
  'kompilot_subscription_status',
  'kompilot_grace_period_end',
  'kompilot_payment_failed',
  'kompilot_active_payment_method',
  'kompilot_invoices',
  'kompilot_accountant',
  'kompilot_trial_end',
  'kompilot_credits_balance',
  // Establishments cache
  'kompilot_establishments',
  // UI state
  'kompilot_sidebar_collapsed',
  'kompilot_demo_view_role',
  'kompilot_switcher_unlocked',
  // Dev / QA
  'kompilot_active_faults',
  'kompilot_fault_log',
  'kompilot_api_errors',
  // Onboarding / walkthrough
  'walkthrough_shown',
];

/** All sessionStorage keys to purge on logout */
const GLOBAL_SS_KEYS: string[] = [
  'kompilot_demo_active_session',
  'demo_exhausted_shown',
  'mentor_payment_failed_shown',
  'mentor_cancelled_shown',
  'kompilot_credits_shown',
];

/** User-scoped key prefixes (will be suffixed with _${userId}) */
const USER_SCOPED_PREFIXES: string[] = [
  'onboarding_done_',
  'checklist_show_',
  'meta_audit_launched_',
  'anti_noshow_enabled_',
  'ai_creative_generated_',
  'video_story_exported_',
  'onboarding_checklist_dismissed_',
  // Billing user-scoped
  'kompilot_plan_',
  'kompilot_subscription_status_',
  'kompilot_grace_period_end_',
  'kompilot_payment_failed_',
  'kompilot_active_payment_method_',
  'kompilot_invoices_',
  'kompilot_accountant_',
  'kompilot_trial_end_',
  'kompilot_credits_balance_',
];

/**
 * Full storage cleanup for the given user ID.
 * Safe to call in incognito mode — all errors are swallowed.
 */
export function fullStorageCleanup(userId: string | null): void {
  try {
    // 1. User-scoped keys
    if (userId) {
      for (const prefix of USER_SCOPED_PREFIXES) {
        try { localStorage.removeItem(`${prefix}${userId}`); } catch { /* noop */ }
      }
    }

    // 2. Global localStorage keys
    for (const key of GLOBAL_LS_KEYS) {
      try { localStorage.removeItem(key); } catch { /* noop */ }
    }

    // 3. Any remaining keys matching kompilot_ prefix (catch-all)
    try {
      const allKeys = Object.keys(localStorage);
      for (const k of allKeys) {
        if (k.startsWith('kompilot_') || k.startsWith('blink_')) {
          localStorage.removeItem(k);
        }
      }
    } catch { /* noop */ }

    // 4. sessionStorage — api cache
    try {
      const ssKeys = Object.keys(sessionStorage);
      for (const k of ssKeys) {
        if (k.startsWith('safeapi_') || k.startsWith('kompilot_') || k.startsWith('mentor_') || k.startsWith('demo_')) {
          sessionStorage.removeItem(k);
        }
      }
    } catch { /* noop */ }

    // 5. sessionStorage — explicit keys
    for (const key of GLOBAL_SS_KEYS) {
      try { sessionStorage.removeItem(key); } catch { /* noop */ }
    }

  } catch { /* fail silently — strict incognito or storage disabled */ }
}

/**
 * Returns a list of Kompilot-related keys still in localStorage.
 * Useful for debugging / QA assertions.
 */
export function debugListKompilotStorageKeys(): string[] {
  try {
    return Object.keys(localStorage).filter(
      k => k.startsWith('kompilot_') || k.startsWith('blink_') || k.startsWith('onboarding_')
    );
  } catch {
    return [];
  }
}
