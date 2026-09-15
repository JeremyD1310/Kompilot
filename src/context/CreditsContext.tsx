import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { useSubscription } from './SubscriptionContext';
import { useDemoMode, DEMO_CREDIT_TOTAL } from './DemoModeContext';
import { SUBSCRIPTION_PLANS } from '../../shared/pricingCatalog';
import { blink } from '../blink/client';
import { isDemoRuntime } from '../lib/demoDomain';

const API_BASE = 'https://gbrhsehk.backend.blink.new';

async function creditsRequest(path: string, init?: RequestInit) {
  const token = await blink.auth.getValidToken().catch(() => null);
  if (!token) return null;
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) } });
  if (!response.ok) return null;
  return response.json();
}

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

const PLAN_LIMITS: Record<string, number> = Object.fromEntries(
  SUBSCRIPTION_PLANS.map(plan => [plan.id, plan.entitlements.aiCredits ?? 0]),
);

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
  const limit = PLAN_LIMITS[currentPlan.id] ?? 0;
  const [serverBalance, setServerBalance] = useState<number | null>(null);
  const [serverUsed, setServerUsed] = useState(0);

  const refreshBalance = async () => {
    const data = await creditsRequest('/api/credits/balance');
    if (data) {
      setServerBalance(Number(data.balance ?? data.remaining ?? 0));
      setServerUsed(Number(data.usedThisMonth ?? 0));
    }
  };

  useEffect(() => {
    if (!isDemoRuntime() && blink.auth.isAuthenticated()) refreshBalance();
  }, []);

  // ── Demo mode: use the 50-credit demo pool ───────────────────────────────────
  const usage = isDemoActive ? demoCreditsUsed : serverUsed;
  const effectiveLimit = isDemoActive ? DEMO_CREDIT_TOTAL : (serverBalance ?? 0) + serverUsed;
  const remaining = isDemoActive ? Math.max(0, effectiveLimit - usage) : (serverBalance ?? 0);
  const canCreate = remaining > 0;

  const increment = (): boolean => {
    if (isDemoActive) return consumeDemoCredits(1);
    void creditsRequest('/api/credits/consume', { method: 'POST', body: JSON.stringify({ amount: 1, type: 'ai' }) }).then(refreshBalance);
    return canCreate;
  };

  const deductCredits = (n: number): boolean => {
    if (isDemoActive) return consumeDemoCredits(n);
    if (remaining < n) return false;
    void creditsRequest('/api/credits/consume', { method: 'POST', body: JSON.stringify({ amount: n, type: 'ai' }) }).then(refreshBalance);
    return true;
  };

  const hasEnoughCredits = (n: number): boolean => remaining >= n;
  const credits: CreditsValue = remaining;
  const deductCredit = increment;
  const addCredits = (_n: number) => { /* Authenticated balances are server-authoritative; checkout/webhooks add credits. */ };
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
