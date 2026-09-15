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
import { isDemoRuntime } from '../lib/demoDomain';
import { SUBSCRIPTION_PLANS, type SubscriptionPlanId } from '../../shared/pricingCatalog';

/** Canonical commercial plans, with legacy aliases accepted only at the boundary. */
export type PlanId = 'free' | SubscriptionPlanId | 'starter' | 'expert';

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

const catalogPlan = (id: SubscriptionPlanId): Plan => {
  const definition = SUBSCRIPTION_PLANS.find(plan => plan.id === id)!;
  return {
    id, name: definition.name, price: definition.monthlyPriceEurHt,
    maxNetworks: definition.entitlements.establishments ?? 1,
    maxSites: definition.entitlements.establishments ?? 1,
    maxPosts: Infinity, hasInbox: true, hasAI: true,
    hasPDF: id !== 'pro', hasMultiUser: (definition.entitlements.users ?? 1) > 1,
    hasStories: true, unlimited: id === 'agency',
  };
};

export const PLANS: Plan[] = [
  { id: 'free', name: 'Gratuit', price: 0, maxNetworks: 1, maxSites: 1, maxPosts: 3, hasInbox: false, hasAI: false, hasPDF: false, hasMultiUser: false, hasStories: false, unlimited: false },
  ...SUBSCRIPTION_PLANS.map(plan => catalogPlan(plan.id)),
  { ...catalogPlan('pro'), id: 'starter' },
  { ...catalogPlan('agency'), id: 'expert' },
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
  // Paid entitlements are restored only from the authenticated backend status.
  // Local storage may not grant a plan after reload or logout.
  const [planId, setPlanId] = useState<PlanId>('free');

  // ── Scope all billing storage keys to the authenticated user ────────────────
  useEffect(() => {
    const unsub = blink.auth.onAuthStateChanged((state) => {
      setHasAuthenticatedUser(Boolean(state.user));
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
    // Client code may not self-grant paid entitlements. Backend-confirmed plans are
    // applied by refreshBillingStatus; this method remains for old callers only.
    if (id !== 'free' && !isDemoRuntime()) return;
    setPlanId(id);
    if (id === 'free') { try { localStorage.removeItem(PLAN_STORAGE_KEY); } catch { /* noop */ } }
  };

  // ── Subscription status ────────────────────────────────────────────────────
  // Public pages mount this provider too, but billing is a protected endpoint.
  // Track auth state before refreshing so anonymous visitors never hit /api/billing/status.
  const [hasAuthenticatedUser, setHasAuthenticatedUser] = useState(() => blink.auth.isAuthenticated());
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
      if (data.planId && ['pro', 'multi', 'agency'].includes(data.planId)) {
        const canonicalPlanId = data.planId as PlanId;
        setPlanId(canonicalPlanId);
        try { localStorage.setItem(PLAN_STORAGE_KEY, canonicalPlanId); } catch { /* noop */ }
      }
    } catch (e) {
      // Network failure or Stripe unavailable — keep cached state, no crash
      console.warn('[SubscriptionContext] refreshBillingStatus failed (network?):', e);
    }
  }, []);

  // Refresh only for authenticated users (non-blocking, best-effort).
  // Anonymous landing pages must not request the protected billing endpoint.
  useEffect(() => {
    // The public demo is a local-only sandbox: never probe billing or Stripe.
    if (isDemoRuntime() || !hasAuthenticatedUser) return;
    refreshBillingStatus().catch(() => { /* noop */ });
  }, [hasAuthenticatedUser, refreshBillingStatus]);

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
