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
import { blink } from '../blink/client';
import { LoadingOverlay } from '@blinkdotnew/ui';
import OnboardingPage from '../pages/OnboardingPage';

// ── Helper ────────────────────────────────────────────────────────────────────

export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  if (localStorage.getItem(`onboarding_done_${userId}`) === '1') return true;
  try {
    const rows = await blink.db.onboardingProfiles.list({ where: { userId } });
    if (rows.length > 0) {
      localStorage.setItem(`onboarding_done_${userId}`, '1');
      return true;
    }
  } catch {
    return true; // If DB check fails, don't block the user
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

  useEffect(() => {
    // Demo users skip onboarding entirely
    if (isDemoActive && !user) {
      setNeedsOnboarding(false);
      setOnboardingChecked(true);
      return;
    }
    if (!user) return;
    // Admin users skip onboarding check
    if (user.email === 'admin@kompilot.com') {
      setNeedsOnboarding(false);
      setOnboardingChecked(true);
      return;
    }
    hasCompletedOnboarding(user.id).then(done => {
      setNeedsOnboarding(!done);
      setOnboardingChecked(true);
    });
  }, [user, isDemoActive]);

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

  // ── 5. Needs onboarding ──────────────────────────────────────────────────────
  if (needsOnboarding && !isDemoActive) return <Navigate to="/onboarding" />;

  // ── 6. All clear ─────────────────────────────────────────────────────────────
  return <>{children}</>;
}

// ── OnboardingGuard ───────────────────────────────────────────────────────────
// Prevents already-onboarded users from revisiting /onboarding.

export function OnboardingGuard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [checked, setChecked] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!user) return;
    hasCompletedOnboarding(user.id).then(completed => {
      setDone(completed);
      setChecked(true);
    });
  }, [user]);

  if (isLoading) return <LoadingOverlay loading />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!checked) return <LoadingOverlay loading />;
  if (done) return <Navigate to="/dashboard" />;

  return <OnboardingPage />;
}
