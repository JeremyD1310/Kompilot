/**
 * demoDomain.ts — Single source of truth for demo domain detection.
 *
 * When the app runs on demo.kompilot.fr, the entire experience switches to
 * "demo mirror mode": auto-login, mock data, all features unlocked.
 *
 * CRITICAL: This file has ZERO React dependencies — it can be imported
 * from index.html inline scripts, main.tsx, contexts, guards, and hooks.
 */

import { DEMO_USER_ID, DEMO_EMAIL, DEMO_DISPLAY_NAME } from './demoConstants';

// ── Detection ──────────────────────────────────────────────────────────────

/** Returns true when running on the demo subdomain */
export function isDemoDomain(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'demo.kompilot.fr' || h.endsWith('.demo.kompilot.fr');
}

/** Returns true for the public demo flow, including protected-looking paths
 * reached after the demo CTA. The session marker keeps /calendrier and /social
 * local-only after a full navigation from /demo/dashboard. */
export function isDemoRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  if (isDemoDomain() || window.location.pathname === '/demo' || window.location.pathname.startsWith('/demo/')) return true;
  try {
    // A demo session is deliberately session-scoped. Never let a stale local
    // marker turn a normal production route into a sandbox after navigation.
    return sessionStorage.getItem('kompilot_demo_active_session') === 'true';
  } catch {
    return false;
  }
}

/** The current page path is intentionally evaluated at call time. */
export const IS_DEMO_DOMAIN: boolean = isDemoDomain();
export const IS_DEMO_RUNTIME: boolean = isDemoRuntime();

// ── Storage keys (shared by all demo adapters) ─────────────────────────────

export const DEMO_STORAGE_KEYS = [
  'kompilot_demo_data_v1',
  'kompilot_demo_session_v1',
  'kompilot_demo_active_session',
  'kompilot_demo_profile_v2',
  'kompilot_demo_view_role',
  'kompilot_switcher_unlocked',
  'kompilot_demo_sector',
  'kompilot_demo_credits_v1',
  'kompilot_demo_approval_statuses_v1',
  'kompilot_demo_selection_v1',
  'kompilot_demo_start_v1',
  'kompilot_demo_onboarding_v1',
  'kompilot_plan',
  'blink_user_id',
  'demo_exhausted_shown',
] as const;

const DEMO_SESSION_KEY  = 'kompilot_demo_session_v1';
const DEMO_ACTIVE_KEY   = 'kompilot_demo_active_session';
const SWITCHER_KEY      = 'kompilot_switcher_unlocked';
const PLAN_KEY          = 'kompilot_plan';
const DEMO_SECTOR_KEY   = 'kompilot_demo_sector';

// ── Demo user profile ──────────────────────────────────────────────────────

export const DEMO_DOMAIN_USER = {
  id:            DEMO_USER_ID,
  email:         DEMO_EMAIL,
  displayName:   DEMO_DISPLAY_NAME,
  emailVerified: true,
  role:          'admin',
  metadata: {
    plan:       'agency' as const,
    isDemo:     true,
    agencyMode: true,
  },
  createdAt:     '2024-01-01T00:00:00.000Z',
  updatedAt:     new Date().toISOString(),
  lastSignIn:    new Date().toISOString(),
};

// ── Bootstrap (runs BEFORE React mounts) ───────────────────────────────────
// Writes all necessary localStorage/sessionStorage entries so that every
// downstream consumer (useAuth, guards, SubscriptionContext, DemoModeContext)
// finds a valid demo session on first render.

export function bootstrapDemoSession(): void {
  if (!isDemoDomain()) return;

  try {
    // 1. Write demo session (what useAuth reads)
    if (!localStorage.getItem(DEMO_SESSION_KEY)) {
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify({
        user: DEMO_DOMAIN_USER,
        savedAt: Date.now(),
      }));
    }

    // 2. Activate demo mode flag (what DemoModeContext reads)
    sessionStorage.setItem(DEMO_ACTIVE_KEY, 'true');

    // 3. Unlock Pro/Agency switcher
    localStorage.setItem(SWITCHER_KEY, '1');

    // 4. Force highest plan (what SubscriptionContext reads)
    localStorage.setItem(PLAN_KEY, 'agency');

    // 5. Set demo sector (restaurant by default)
    if (!localStorage.getItem(DEMO_SECTOR_KEY)) {
      localStorage.setItem(DEMO_SECTOR_KEY, 'restaurant');
    }

    // 6. Mark blink user ID for billing scope
    localStorage.setItem('blink_user_id', DEMO_DOMAIN_USER.id);

    // 7. Mark onboarding as complete
    localStorage.setItem(`onboarding_done_${DEMO_DOMAIN_USER.id}`, '1');

  } catch { /* noop — incognito / storage full */ }
}

/** Clear every known demo key without touching unrelated user data. */
export function clearDemoStorage(options: { keepSession?: boolean } = {}): void {
  const keep = new Set(options.keepSession ? [DEMO_SESSION_KEY, DEMO_ACTIVE_KEY, 'blink_user_id'] : []);
  try {
    for (const key of DEMO_STORAGE_KEYS) {
      if (!keep.has(key)) localStorage.removeItem(key);
    }
    localStorage.removeItem(`onboarding_done_${DEMO_DOMAIN_USER.id}`);
    if (!options.keepSession) {
      localStorage.removeItem(DEMO_SESSION_KEY);
      localStorage.removeItem('blink_user_id');
      sessionStorage.removeItem(DEMO_ACTIVE_KEY);
    }
    sessionStorage.removeItem('demo_exhausted_shown');
    sessionStorage.removeItem('mentor_payment_failed_shown');
    sessionStorage.removeItem('mentor_cancelled_shown');
  } catch { /* private browsing */ }
}
