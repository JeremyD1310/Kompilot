/**
 * useStripeWebhookStatus — fetches live subscription status from the backend.
 *
 * Returns a normalised status object derived from GET /api/billing/status.
 * Falls back to status 'none' on any error — never throws.
 *
 * staleTime: 5 min (backend may call Stripe live, so don't hammer it)
 */
import { useQuery } from '@tanstack/react-query';
import { blink } from '../blink/client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'https://gbrhsehk.backend.blink.new';

export type StripeSubStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'none';

export interface StripeWebhookStatus {
  /** Normalised status */
  status: StripeSubStatus;
  /** Stripe plan ID (e.g. 'pro' | 'expert') */
  planId: string | null;
  /** ISO8601 — end of current billing period */
  currentPeriodEnd: string | null;
  /** True when user cancelled but period has not ended yet */
  cancelAtPeriodEnd: boolean;
  /** ISO8601 — end of trial period (if trialing) */
  trialEnd: string | null;
  /** Subscription is active or trialing */
  isActive: boolean;
  /** Subscription is in trial */
  isTrial: boolean;
  /** Payment has failed (past_due) */
  isPastDue: boolean;
}

const NONE: StripeWebhookStatus = {
  status: 'none',
  planId: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  trialEnd: null,
  isActive: false,
  isTrial: false,
  isPastDue: false,
};

async function fetchStatus(): Promise<StripeWebhookStatus> {
  try {
    const token = await blink.auth.getValidToken().catch(() => null);
    if (!token) return NONE;

    const res = await fetch(`${BACKEND_URL}/api/billing/status`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return NONE;

    const data = await res.json() as {
      status?: string;
      planId?: string | null;
      currentPeriodEnd?: string | null;
      cancelAtPeriodEnd?: boolean;
      trialEnd?: string | null;
    };

    const status = (data.status ?? 'none') as StripeSubStatus;

    return {
      status,
      planId: data.planId ?? null,
      currentPeriodEnd: data.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
      trialEnd: data.trialEnd ?? null,
      isActive: status === 'active' || status === 'trialing',
      isTrial: status === 'trialing',
      isPastDue: status === 'past_due',
    };
  } catch {
    return NONE;
  }
}

export function useStripeWebhookStatus() {
  return useQuery<StripeWebhookStatus>({
    queryKey: ['stripe-webhook-status'],
    queryFn: fetchStatus,
    staleTime: 5 * 60 * 1000,
    // Return NONE on error instead of throwing
    retry: 1,
    throwOnError: false,
    placeholderData: NONE,
  });
}
