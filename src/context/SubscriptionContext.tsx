import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  getSubscriptionStatus,
  setSubscriptionStatus,
  getGracePeriodEnd,
  setGracePeriodEnd,
  isAgentEnabled as computeAgentEnabled,
  setActiveUserId,
  type SubscriptionStatus,
} from '../lib/billingStorage';
import { fetchBillingStatus } from '../lib/billingClient';
import { blink } from '../blink/client';

/**
 * PlanId — Nouveaux planId 2026 + aliases legacy pour rétrocompatibilité.
 * 'starter' = Pro 69€, 'agency' = Agency 149€
 * 'pro'/'expert' maintenus comme alias pour les abonnements existants.
 */
export type PlanId = 'free' | 'starter' | 'agency' | 'pro' | 'expert';

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  maxNetworks: number;
  maxSites: number;
  maxPosts: number;
  hasInbox: boolean;
  hasAI: boolean;
  hasPDF: boolean;
  hasMultiUser: boolean;
  hasStories: boolean;
  unlimited: boolean;
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Gratuit',
    price: 0,
    maxNetworks: 1,
    maxSites: 1,
    maxPosts: 3,
    hasInbox: false,
    hasAI: false,
    hasPDF: false,
    hasMultiUser: false,
    hasStories: false,
    unlimited: false,
  },
  // ── Pro 69€ (nouveau planId 'starter') ────────────────────────────────────
  {
    id: 'starter',
    name: 'Pro',
    price: 69,
    maxNetworks: 5,
    maxSites: 5,
    maxPosts: 50,
    hasInbox: true,
    hasAI: true,
    hasPDF: false,
    hasMultiUser: false,
    hasStories: true,
    unlimited: false,
  },
  // ── Agency 149€ (nouveau planId 'agency') ─────────────────────────────────
  {
    id: 'agency',
    name: 'Agency',
    price: 149,
    maxNetworks: Infinity,
    maxSites: 30,
    maxPosts: Infinity,
    hasInbox: true,
    hasAI: true,
    hasPDF: true,
    hasMultiUser: true,
    hasStories: true,
    unlimited: true,
  },
  // ── Aliases legacy (rétrocompatibilité abonnements existants) ─────────────
  {
    id: 'pro',
    name: 'Pro (ancien)',
    price: 69,
    maxNetworks: 5,
    maxSites: 5,
    maxPosts: 50,
    hasInbox: true,
    hasAI: true,
    hasPDF: false,
    hasMultiUser: false,
    hasStories: true,
    unlimited: false,
  },
  {
    id: 'expert',
    name: 'Agency (ancien)',
    price: 149,
    maxNetworks: Infinity,
    maxSites: 30,
    maxPosts: Infinity,
    hasInbox: true,
    hasAI: true,
    hasPDF: true,
    hasMultiUser: true,
    hasStories: true,
    unlimited: true,
  },
];

const PLAN_STORAGE_KEY = 'kompilot_plan';

interface SubscriptionContextValue {
  currentPlan: Plan;
  setPlan: (id: PlanId) => void;
  /** Current billing/subscription status (synced from Stripe via backend) */
  subscriptionStatus: SubscriptionStatus;
  /** False when subscription is cancelled/unpaid past grace → disables background AI tasks */
  isAgentEnabled: boolean;
  /** Re-fetch billing status from backend and update localStorage cache */
  refreshBillingStatus: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  // Restore plan from localStorage so it survives logout/login
  const [planId, setPlanId] = useState<PlanId>(() => {
    try {
      const stored = localStorage.getItem(PLAN_STORAGE_KEY) as PlanId | null;
      if (stored && PLANS.find(p => p.id === stored)) return stored;
    } catch { /* noop */ }
    return 'free';
  });

  // ── Scope all billing storage keys to the authenticated user ────────────────
  useEffect(() => {
    const unsub = blink.auth.onAuthStateChanged((state) => {
      setActiveUserId(state.user?.id ?? null);
      if (!state.user) {
        // Reset plan to free on logout to avoid stale data showing
        setPlanId('free');
      }
    });
    return unsub;
  }, []);

  const currentPlan = PLANS.find(p => p.id === planId)!;

  const setPlan = (id: PlanId) => {
    setPlanId(id);
    try { localStorage.setItem(PLAN_STORAGE_KEY, id); } catch { /* noop */ }
  };

  // ── Subscription status ────────────────────────────────────────────────────
  const [subscriptionStatus, setStatusState] = useState<SubscriptionStatus>(
    () => getSubscriptionStatus(),
  );
  const [agentEnabled, setAgentEnabled] = useState<boolean>(() => computeAgentEnabled());

  /** Sync from backend and cache locally. Also syncs planId when Stripe confirms payment.
   * RESILIENCE FIX: wrapped in try/catch — network failures don't crash the context.
   */
  const refreshBillingStatus = useCallback(async () => {
    try {
      const data = await fetchBillingStatus();
      const status = data.status as SubscriptionStatus;
      setSubscriptionStatus(status);
      if (data.gracePeriodEnd) setGracePeriodEnd(new Date(data.gracePeriodEnd));
      else setGracePeriodEnd(null);
      setStatusState(status);
      setAgentEnabled(computeAgentEnabled());

      // If Stripe confirmed a plan upgrade, update local plan state
      if (data.planId && ['pro', 'expert'].includes(data.planId)) {
        const backendPlanId = data.planId as PlanId;
        if (PLANS.find(p => p.id === backendPlanId)) {
          setPlanId(backendPlanId);
          try { localStorage.setItem(PLAN_STORAGE_KEY, backendPlanId); } catch { /* noop */ }
        }
      }
    } catch (e) {
      // Network failure or Stripe unavailable — keep cached state, no crash
      console.warn('[SubscriptionContext] refreshBillingStatus failed (network?):', e);
    }
  }, []);

  // Refresh on mount (non-blocking, best-effort)
  useEffect(() => {
    refreshBillingStatus().catch(() => { /* noop */ });
  }, [refreshBillingStatus]);

  // Keep storage in sync when plan changes externally (e.g. tab sync)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === PLAN_STORAGE_KEY && e.newValue) {
        const next = e.newValue as PlanId;
        if (PLANS.find(p => p.id === next)) setPlanId(next);
      }
      // Sync subscription status changes from other tabs
      if (e.key === 'kompilot_subscription_status' && e.newValue) {
        setStatusState(e.newValue as SubscriptionStatus);
        setAgentEnabled(computeAgentEnabled());
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        currentPlan,
        setPlan,
        subscriptionStatus,
        isAgentEnabled: agentEnabled,
        refreshBillingStatus,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

const SUBSCRIPTION_FALLBACK: SubscriptionContextValue = {
  currentPlan: PLANS.find(p => p.id === 'free')!,
  setPlan: () => { /* noop — no provider */ },
  subscriptionStatus: 'free',
  isAgentEnabled: false,
  refreshBillingStatus: async () => { /* noop — no provider */ },
};

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    console.warn('useSubscription must be used within SubscriptionProvider — context missing, returning safe fallback');
    return SUBSCRIPTION_FALLBACK;
  }
  return ctx;
}