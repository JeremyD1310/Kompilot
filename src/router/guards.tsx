/**
 * guards.tsx
 * Auth + Onboarding route guards used in App.tsx
 *
 * CRITICAL: Never return null/undefined during loading states — always render
 * a spinner. Returning null causes "Something went wrong" on Safari/Firefox
 * because the router treats an empty render as an error boundary trigger.
 */
import { useState, useEffect } from 'react';
import { Navigate } from '@tanstack/react-router';
import { useAuth } from '../hooks/useAuth';
import { useDemoMode } from '../context/DemoModeContext';
import { useTrialSequence } from '../hooks/useTrialSequence';
import { blink } from '../blink/client';
import { useImmediateWelcomeEmail } from '../hooks/useImmediateWelcomeEmail';
import { useHighTouchDetection } from '../hooks/useHighTouchDetection';
import { useCrispChat } from '../hooks/useCrispChat';
import { LoadingOverlay } from '@blinkdotnew/ui';
import OnboardingPage from '../pages/OnboardingPage';
import { isKompilotTeam } from '../context/AdminContext';

// ── Helper ────────────────────────────────────────────────────────────────────

export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  if (localStorage.getItem(`onboarding_done_${userId}`) === '1') return true;
  try {
    const profiles = blink.db.table<Record<string, unknown>>('onboarding_profiles');
    const rows = await profiles.list({ where: { userId } });
    if (rows.length > 0) {
      localStorage.setItem(`onboarding_done_${userId}`, '1');
      return true;
    }
  } catch {
    return false; // Fail closed: a backend outage must not bypass onboarding.
  }
  return false;
}

// ── AuthGuard ─────────────────────────────────────────────────────────────────
// Only mounted when navigating to protected routes.
//
// Render order (strict priority):
//  1. Still loading auth state → spinner (never null — Safari/Firefox crash fix)
//  2. Not authenticated, not demo → /login
//  3. Email explicitly unverified (false, NOT undefined) → /email-unverified
//  4. Onboarding check in progress → spinner
//  5. Needs onboarding → /onboarding
//  6. All good → render children

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isDemoActive } = useDemoMode();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Fire trial email sequence once per session (J0→J30), non-blocking
  useTrialSequence(user?.id);

  // Fire immediate welcome email for brand-new signups (< 10 min), non-blocking
  useImmediateWelcomeEmail(user?.id);

  // Fire high-touch lead detection once per session, non-blocking
  useHighTouchDetection(user?.id, user?.email, user?.displayName);

  // Crisp chat: show for authenticated users, hide on public pages
  useCrispChat(user, isLoading);

  useEffect(() => {
    let cancelled = false;
    setOnboardingChecked(false);
    setNeedsOnboarding(false);

    // Demo users skip onboarding entirely
    if (isDemoActive && !user) {
      setOnboardingChecked(true);
      return () => { cancelled = true; };
    }
    if (!user) return () => { cancelled = true; };
    // Admin/Kompilot team members skip onboarding — smart routing sends them to /admin
    if (isKompilotTeam(user.email)) {
      setOnboardingChecked(true);
      return () => { cancelled = true; };
    }
    hasCompletedOnboarding(user.id).then(done => {
      if (cancelled) return;
      setNeedsOnboarding(!done);
      setOnboardingChecked(true);
    });
    return () => { cancelled = true; };
  }, [user?.id, user?.email, isDemoActive]);

  // ── 1. Auth still loading — ALWAYS show spinner, NEVER return null ──────────
  // Returning null here causes TanStack Router to render the error boundary
  // ("Something went wrong") on Safari and Firefox, which have slower token
  // resolution than Chrome.
  if (isLoading && !isDemoActive) return <LoadingOverlay loading />;

  // ── 2. Not authenticated ────────────────────────────────────────────────────
  if (!isAuthenticated && !isDemoActive) return <Navigate to="/login" />;

  // ── 3. Email unverified (only if EXPLICITLY false, not undefined/null) ──────
  // emailVerified === undefined means the SDK hasn't hydrated the field yet;
  // treating undefined as false causes a redirect loop on first load.
  if (user && user.emailVerified === false) return <Navigate to="/email-unverified" />;

  // ── 4. Onboarding check still in flight ─────────────────────────────────────
  if (!onboardingChecked) return <LoadingOverlay loading />;

  // ── 5. Needs onboarding (regular users only — admins already skipped) ──────
  if (needsOnboarding && !isDemoActive) return <Navigate to="/onboarding" />;

  // ── 5.5. Smart Routing — admin/staff → /admin ─────────────────────────────
  // After login, team members (jeremy, romain, valentine @kompilot.fr) are
  // automatically redirected to the admin dashboard instead of the client view.
  // The /admin route uses AdminGuard (not AuthGuard), so this won't loop.
  if (user && !isDemoActive && isKompilotTeam(user.email)) return <Navigate to="/admin" />;

  // ── 6. All clear ─────────────────────────────────────────────────────────────
  return <>{children}</>;
}

// ── OnboardingGuard ───────────────────────────────────────────────────────────
// Prevents already-onboarded users from revisiting /onboarding.

export function OnboardingGuard({ children }: { children?: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [checked, setChecked] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Admin/Kompilot team → skip onboarding entirely, redirect to admin
    if (isKompilotTeam(user.email)) {
      setDone(true);
      setChecked(true);
      return;
    }
    hasCompletedOnboarding(user.id).then(completed => {
      setDone(completed);
      setChecked(true);
    });
  }, [user]);

  if (isLoading) return <LoadingOverlay loading />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!checked) return <LoadingOverlay loading />;
  // Admin team members → admin dashboard (not client dashboard)
  if (user && isKompilotTeam(user.email)) return <Navigate to="/admin" />;
  if (done) return <Navigate to="/dashboard" />;

  return <>{children ?? <OnboardingPage />}</>;
}

// ── AdminGuard ───────────────────────────────────────────────────────────────
// Protects /admin routes. Only Kompilot team members can access.
// Non-admin users are redirected to /dashboard.

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <LoadingOverlay loading />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!user || !isKompilotTeam(user.email)) return <Navigate to="/dashboard" />;

  return <>{children}</>;
}
