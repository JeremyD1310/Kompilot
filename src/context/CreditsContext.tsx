import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { useSubscription } from './SubscriptionContext';
import { useDemoMode, DEMO_CREDIT_TOTAL } from './DemoModeContext';
import { PLAN_CREDITS } from '../lib/creditsCosts';
import { blink } from '../blink/client';

// ── Monthly usage key ─────────────────────────────────────────────────────────
const USAGE_KEY_BASE = 'kompilot_usage_v2';
// Legacy key kept for migration reads
const USAGE_KEY = USAGE_KEY_BASE;

/** Returns the scoped key for the current userId (or anon). */
function getScopedUsageKey(userId: string | null): string {
  return userId ? `${USAGE_KEY_BASE}_${userId}` : `${USAGE_KEY_BASE}_anon`;
}

function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

interface StoredUsage {
  month: string;
  used: number;
}

function readStored(userId: string | null = null): StoredUsage {
  try {
    // Try scoped key first, fall back to legacy for migration
    const raw = localStorage.getItem(getScopedUsageKey(userId))
      ?? localStorage.getItem(USAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredUsage;
      if (parsed.month === getCurrentMonth()) return parsed;
    }
  } catch { /* noop */ }
  return { month: getCurrentMonth(), used: 0 };
}

function persistUsage(data: StoredUsage, userId: string | null = null) {
  try { localStorage.setItem(getScopedUsageKey(userId), JSON.stringify(data)); } catch { /* noop */ }
}

const PLAN_LIMITS: Record<string, number> = PLAN_CREDITS;

// ── Types ──────────────────────────────────────────────────────────────────────

// Legacy alias kept for backward compatibility
export type CreditsValue = number | 'unlimited';

interface CreditsContextValue {
  // ── New API ──
  usage: number;
  limit: number;
  canCreate: boolean;
  increment: () => boolean;
  // ── Multi-credit deduction ──
  deductCredits: (n: number) => boolean;
  hasEnoughCredits: (n: number) => boolean;

  // ── Legacy API (backward compat with CreatePostModal etc.) ──
  credits: CreditsValue;
  deductCredit: () => boolean;
  addCredits: (n: number) => void;
  isEmpty: boolean;
}

// ── Context ───────────────────────────────────────────────────────────────────

const CreditsContext = createContext<CreditsContextValue | null>(null);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const { currentPlan } = useSubscription();
  const {
    isDemoActive,
    demoCreditsUsed,
    consumeDemoCredits,
  } = useDemoMode();
  const limit = PLAN_LIMITS[currentPlan.id] ?? 3;

  const [userId, setUserId] = useState<string | null>(() => {
    try { return localStorage.getItem('blink_user_id'); } catch { return null; }
  });

  // Track userId from auth state for key scoping
  useEffect(() => {
    const unsub = blink.auth.onAuthStateChanged((state) => {
      const uid = state.user?.id ?? null;
      setUserId(uid);
      if (!uid) {
        // Reset credits on logout to prevent data leakage
        const fresh: StoredUsage = { month: getCurrentMonth(), used: 0 };
        setStored(fresh);
        persistUsage(fresh, uid); // Persist reset for anon user
      }
    });
    return unsub;
  }, []);

  const [stored, setStored] = useState<StoredUsage>(() => {
    const uid = (() => { try { return localStorage.getItem('blink_user_id'); } catch { return null; } })();
    return readStored(uid);
  });

  // Monthly reset — re-check each render cycle
  useEffect(() => {
    const current = getCurrentMonth();
    if (stored.month !== current) {
      const fresh: StoredUsage = { month: current, used: 0 };
      setStored(fresh);
      persistUsage(fresh, userId);
    }
  }, [stored.month, userId]); // Depend on userId to re-apply reset if user changes

  // Reset when plan changes
  const prevPlanRef = useRef(currentPlan.id);
  useEffect(() => {
    if (prevPlanRef.current === currentPlan.id) return;
    prevPlanRef.current = currentPlan.id;
    const fresh: StoredUsage = { month: getCurrentMonth(), used: 0 };
    setStored(fresh);
    persistUsage(fresh, userId);
  }, [currentPlan.id, userId]); // Depend on userId to re-apply reset if user changes

  // ── Demo mode: use the 50-credit demo pool ───────────────────────────────────
  const usage = isDemoActive ? demoCreditsUsed : stored.used;
  const effectiveLimit = isDemoActive ? DEMO_CREDIT_TOTAL : limit;
  const canCreate = usage < effectiveLimit;

  const increment = (): boolean => {
    if (isDemoActive) return consumeDemoCredits(1);
    if (!canCreate) return false;
    const next: StoredUsage = { ...stored, used: stored.used + 1 };
    setStored(next);
    persistUsage(next, userId);
    return true;
  };

  const deductCredits = (n: number): boolean => {
    if (isDemoActive) return consumeDemoCredits(n);
    const remaining = effectiveLimit - stored.used;
    if (remaining < n) return false;
    const next: StoredUsage = { ...stored, used: stored.used + n };
    setStored(next);
    persistUsage(next, userId);
    return true;
  };

  const hasEnoughCredits = (n: number): boolean => {
    return (effectiveLimit - usage) >= n;
  };

  // Legacy compat: credits = remaining = limit - used
  const credits: CreditsValue = Math.max(0, effectiveLimit - usage);
  const deductCredit = increment;
  const addCredits = (n: number) => {
    if (isDemoActive) return; // no-op in demo mode
    const next: StoredUsage = { ...stored, used: Math.max(0, stored.used - n) };
    setStored(next);
    persistUsage(next, userId);
  };
  const isEmpty = !canCreate;

  return (
    <CreditsContext.Provider value={{ usage, limit: effectiveLimit, canCreate, increment, deductCredits, hasEnoughCredits, credits, deductCredit, addCredits, isEmpty }}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const ctx = useContext(CreditsContext);
  if (!ctx) { console.warn('useCredits must be used within CreditsProvider' + ' — context missing, returning safe fallback'); return {} as any; }
  return ctx;
}