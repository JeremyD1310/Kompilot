import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { fetchBillingStatus } from '../lib/billingClient';
import { blink } from '../blink/client';
import { isDemoRuntime } from '../lib/demoDomain';
import { SUBSCRIPTION_PLANS, type SubscriptionPlanId } from '../../shared/pricingCatalog';

export type PlanId = SubscriptionPlanId;
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

export const PLANS: Plan[] = SUBSCRIPTION_PLANS.map((plan) => ({
  id: plan.id,
  name: plan.name,
  price: plan.monthlyPriceEurHt,
  maxNetworks: plan.entitlements.establishments ?? 0,
  maxSites: plan.entitlements.establishments ?? 0,
  maxPosts: Infinity,
  hasInbox: true,
  hasAI: (plan.entitlements.aiCredits ?? 0) > 0,
  hasPDF: plan.id === 'agency',
  hasMultiUser: plan.entitlements.users > 1,
  hasStories: true,
  unlimited: plan.id === 'agency',
}));

type SubscriptionStatus = 'active' | 'payment_failed' | 'grace' | 'cancelled' | 'unpaid';
interface SubscriptionContextValue {
  currentPlan: Plan;
  setPlan: (id: PlanId) => void;
  subscriptionStatus: SubscriptionStatus;
  isAgentEnabled: boolean;
  refreshBillingStatus: () => Promise<void>;
}
const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [planId, setPlanId] = useState<PlanId>('pro');
  const [hasAuthenticatedUser, setHasAuthenticatedUser] = useState(() => blink.auth.isAuthenticated());
  const [subscriptionStatus, setStatusState] = useState<SubscriptionStatus>('unpaid');
  const [gracePeriodEnd, setGracePeriodEnd] = useState<Date | null>(null);

  useEffect(() => blink.auth.onAuthStateChanged((state) => {
    setHasAuthenticatedUser(Boolean(state.user));
    if (!state.user) setPlanId('pro');
  }), []);

  const refreshBillingStatus = useCallback(async () => {
    if (isDemoRuntime() || !blink.auth.isAuthenticated()) return;
    try {
      const data = await fetchBillingStatus();
      setStatusState(data.status);
      setGracePeriodEnd(data.gracePeriodEnd ? new Date(data.gracePeriodEnd) : null);
      if (data.planId === 'pro' || data.planId === 'multi' || data.planId === 'agency') setPlanId(data.planId);
    } catch { /* backend remains the source of truth; keep safe state */ }
  }, []);

  useEffect(() => {
    if (!isDemoRuntime() && hasAuthenticatedUser) refreshBillingStatus();
  }, [hasAuthenticatedUser, refreshBillingStatus]);

  const currentPlan = PLANS.find((plan) => plan.id === planId) ?? PLANS[0];
  const isAgentEnabled = subscriptionStatus === 'active' || subscriptionStatus === 'payment_failed' || subscriptionStatus === 'grace'
    || (!!gracePeriodEnd && gracePeriodEnd > new Date());

  return <SubscriptionContext.Provider value={{
    currentPlan,
    setPlan: () => { /* checkout/webhook owns plan changes */ },
    subscriptionStatus,
    isAgentEnabled,
    refreshBillingStatus,
  }}>{children}</SubscriptionContext.Provider>;
}

const FALLBACK: SubscriptionContextValue = {
  currentPlan: PLANS[0],
  setPlan: () => undefined,
  subscriptionStatus: 'unpaid',
  isAgentEnabled: false,
  refreshBillingStatus: async () => undefined,
};
export function useSubscription() {
  return useContext(SubscriptionContext) ?? FALLBACK;
}
