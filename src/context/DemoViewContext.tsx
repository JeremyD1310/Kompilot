/**
 * DemoViewContext — Manages the PRO / AGENCY demo view switch.
 *
 * This context is designed to:
 *  - Be visible only when the demo account (test@kompilot.com) is active
 *    OR when the app admin mode is enabled.
 *  - Switch the in-memory "view role" between 'pro' and 'agency' instantly,
 *    without any page reload or heavy auth change.
 *  - Persist the last chosen view to localStorage so refreshes feel seamless.
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type DemoViewRole = 'pro' | 'agency';

const DEMO_VIEW_KEY = 'kompilot_demo_view_role';
const DEMO_TEST_EMAIL = 'test@kompilot.com';

/** Email addresses that should always see the view switcher */
export const DEMO_SWITCHER_EMAILS = [DEMO_TEST_EMAIL];

interface DemoViewContextValue {
  /** Current simulated view — 'pro' or 'agency' */
  demoViewRole: DemoViewRole;
  /** Toggle the active demo view between pro and agency */
  toggleDemoView: () => void;
  /** Explicitly set the demo view role */
  setDemoViewRole: (role: DemoViewRole) => void;
  /** Whether the switcher UI should be visible for this user */
  showSwitcher: boolean;
  /** Activate the switcher (called when demo mode is on or admin email detected) */
  activateSwitcher: () => void;
  deactivateSwitcher: () => void;
  /** Convenience boolean */
  isAgencyView: boolean;
  isProView: boolean;
}

const DemoViewContext = createContext<DemoViewContextValue>({
  demoViewRole: 'pro',
  toggleDemoView: () => {},
  setDemoViewRole: () => {},
  showSwitcher: false,
  activateSwitcher: () => {},
  deactivateSwitcher: () => {},
  isAgencyView: false,
  isProView: true,
});

function readStoredRole(): DemoViewRole {
  try {
    const stored = localStorage.getItem(DEMO_VIEW_KEY);
    if (stored === 'agency' || stored === 'pro') return stored;
  } catch { /* noop */ }
  return 'pro';
}

function saveRole(role: DemoViewRole): void {
  try { localStorage.setItem(DEMO_VIEW_KEY, role); } catch { /* noop */ }
}

export function DemoViewProvider({ children }: { children: ReactNode }) {
  const [demoViewRole, setDemoViewRoleState] = useState<DemoViewRole>(readStoredRole);
  const [showSwitcher, setShowSwitcher] = useState<boolean>(() => {
    // Auto-detect on load: check if user has previously unlocked switcher
    try {
      return localStorage.getItem('kompilot_switcher_unlocked') === '1';
    } catch { return false; }
  });

  const setDemoViewRole = useCallback((role: DemoViewRole) => {
    setDemoViewRoleState(role);
    saveRole(role);
  }, []);

  const toggleDemoView = useCallback(() => {
    setDemoViewRoleState(prev => {
      const next: DemoViewRole = prev === 'pro' ? 'agency' : 'pro';
      saveRole(next);
      return next;
    });
  }, []);

  const activateSwitcher = useCallback(() => {
    setShowSwitcher(true);
    try { localStorage.setItem('kompilot_switcher_unlocked', '1'); } catch { /* noop */ }
  }, []);

  const deactivateSwitcher = useCallback(() => {
    setShowSwitcher(false);
    try { localStorage.removeItem('kompilot_switcher_unlocked'); } catch { /* noop */ }
  }, []);

  return (
    <DemoViewContext.Provider value={{
      demoViewRole,
      toggleDemoView,
      setDemoViewRole,
      showSwitcher,
      activateSwitcher,
      deactivateSwitcher,
      isAgencyView: demoViewRole === 'agency',
      isProView: demoViewRole === 'pro',
    }}>
      {children}
    </DemoViewContext.Provider>
  );
}

export function useDemoView() {
  return useContext(DemoViewContext);
}

/** Returns true when the currently signed-in email is the test demo account */
export function isDemoTestAccount(email: string | null | undefined): boolean {
  if (!email) return false;
  return DEMO_SWITCHER_EMAILS.includes(email.toLowerCase().trim());
}

// Re-export constants for convenience
export { DEMO_TEST_EMAIL };
