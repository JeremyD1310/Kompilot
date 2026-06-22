import { useEffect, useState, useCallback, useRef } from 'react';
import { blink } from '../blink/client';
import type { BlinkUser } from '@blinkdotnew/sdk';
import { setUserProperties } from './useAnalytics';
import {
  readDemoSession,
  clearDemoSession,
  DEMO_USER,
  type DemoUser,
} from '../lib/demoAccount';
import { setActiveUserId, clearBillingStorageForUser } from '../lib/billingStorage';
import { fullStorageCleanup } from '../lib/storageCleanup';

export function useAuth() {
  const [user, setUser] = useState<BlinkUser | DemoUser | null>(() => readDemoSession());
  // CRITICAL: isLoading starts true UNLESS a demo session is already confirmed synchronously.
  // This prevents any protected route from rendering before onAuthStateChanged fires.
  const [isLoading, setIsLoading] = useState(() => !readDemoSession());
  // Guard against setting state on unmounted component (prevents React state-update warning
  // that can cascade into ErrorBoundary on fast navigation)
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    // If a demo session already exists, skip the Blink auth listener startup
    if (readDemoSession()) {
      setUser(DEMO_USER as unknown as BlinkUser);
      setIsLoading(false);
      return;
    }

    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      // Guard: ignore stale callbacks after unmount
      if (!mountedRef.current) return;
      // Don't override an active demo session with a null real user
      if (readDemoSession()) return;

      setUser(state.user ?? null);

      // CRITICAL: only ever set isLoading to false, never back to true.
      // state.isLoading can cycle to true during token refresh → permanent blank screen
      // if we mirrored it directly.
      if (!state.isLoading) setIsLoading(false);

      // Set GA4 user properties when a user is identified
      if (state.user && !state.isLoading) {
        const props: Record<string, string> = {};
        if (state.user.email) props.email = state.user.email;
        if (state.user.displayName) props.display_name = state.user.displayName;
        if (state.user.role) props.role = state.user.role;
        setUserProperties(state.user.id, props);
        // Persist userId for checklist helpers that run outside React context
        try { localStorage.setItem('blink_user_id', state.user.id); } catch { /* noop */ }
        // Scope all billing localStorage keys to this user
        setActiveUserId(state.user.id);
      } else if (!state.user && !state.isLoading) {
        // User logged out — remove userId anchor key
        try { localStorage.removeItem('blink_user_id'); } catch { /* noop */ }
        setActiveUserId(null);
      }
    });

    // Safety net: if onAuthStateChanged never fires within 8s (network issue),
    // unblock the UI by setting isLoading=false so the guard can redirect to /login
    // rather than showing a permanent spinner.
    const safetyTimeout = setTimeout(() => {
      if (mountedRef.current) setIsLoading(false);
    }, 8_000);

    return () => {
      unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const login = () => blink.auth.login();

  // logout: uses SPA navigation via dispatchEvent to avoid full page reloads
  // that break routing on Safari. The actual navigate() call happens in the
  // component that calls logout (AppSidebarShell) via an event listener, OR
  // we use location.replace which preserves the back stack better than href.
  const logout = useCallback(() => {
    // Axe 5 FIX — nettoyage exhaustif du localStorage/sessionStorage au logout.
    // Empêche les tokens expirés ou données utilisateur de "contaminer" une
    // session future (compte partagé, re-connexion avec un autre compte).
    const _purgeUserStorage = (uid: string | null) => {
      try {
        // 1. Clés scopées par userId (onboarding, checklists, flags IA)
        if (uid) {
          const userPrefixes = [
            'onboarding_done_',
            'checklist_show_',
            'meta_audit_launched_',
            'anti_noshow_enabled_',
            'ai_creative_generated_',
            'video_story_exported_',
            'onboarding_checklist_dismissed_',
            'kompilot_demo_view_role',
          ];
          for (const prefix of userPrefixes) {
            localStorage.removeItem(`${prefix}${uid}`);
          }
        }
        // 2. Clés globales non scopées
        const globalKeys = [
          'blink_user_id',
          'kompilot_demo_view_role',
          'kompilot_switcher_unlocked',
          'kompilot_api_errors',
          // Établissements mis en cache localement (snapshot du compte précédent)
          'kompilot_establishments',
          // Sidebar state, walkthrough, fault-simulator
          'kompilot_sidebar_collapsed',
          'walkthrough_shown',
          'kompilot_active_faults',
          'kompilot_fault_log',
          // Notifications d'alerte mentor sessionStorage
        ];
        for (const k of globalKeys) {
          localStorage.removeItem(k);
        }
        // 3. Cache API sessionStorage (préfixe safeapi_)
        const ssKeys = Object.keys(sessionStorage).filter(k => k.startsWith('safeapi_'));
        for (const k of ssKeys) sessionStorage.removeItem(k);
        // 4. sessionStorage global (tokens mentor, état de facturation, démo)
        const ssGlobalKeys = [
          'kompilot_demo_active_session',
          'demo_exhausted_shown',
          'mentor_payment_failed_shown',
          'mentor_cancelled_shown',
          'mentor_payment_failed_shown',
          'kompilot_credits_shown',
        ];
        for (const k of ssGlobalKeys) sessionStorage.removeItem(k);
      } catch { /* noop — incognito strict mode */ }
    };

    // If in demo session, clear it
    if (readDemoSession()) {
      clearDemoSession();
      _purgeUserStorage(null);
      fullStorageCleanup(null);
      setUser(null);
      window.location.replace('/login');
      return;
    }
    // Clear scoped billing data for current user before signing out
    const currentUserId = (() => { try { return localStorage.getItem('blink_user_id'); } catch { return null; } })();
    clearBillingStorageForUser(currentUserId);
    _purgeUserStorage(currentUserId);
    // Audit-grade catch-all cleanup (covers any key added after this file was last edited)
    fullStorageCleanup(currentUserId);
    blink.auth.signOut();
    // signOut triggers onAuthStateChanged → user becomes null → AuthGuard redirects to /login
  }, []);

  /** Re-fetch the current user from the server to pick up fresh emailVerified state. */
  const refreshUser = async () => {
    try {
      const fresh = await blink.auth.me();
      if (mountedRef.current) setUser(fresh);
      return fresh;
    } catch {
      return null;
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  };
}
