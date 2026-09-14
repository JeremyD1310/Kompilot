/**
 * useReferralRewards — React Query hooks for the SaaS referral rewards system.
 *
 * Endpoints (backend/routes/referralRewards.ts):
 *   GET  /api/referral-rewards/stats   — referral stats for current user
 *   GET  /api/referral-rewards/link    — get or create unique referral code
 *   GET  /api/referral-rewards/history — reward history (last 50)
 *   POST /api/referral-rewards/redeem  — redeem earned free months
 *   POST /api/referral-rewards/convert — track a conversion (called server-side)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blink } from '../blink/client';
import { useAuth } from './useAuth';

const BACKEND_URL =
  (import.meta as any).env?.VITE_BACKEND_URL || 'https://gbrhsehk.backend.blink.new';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function authFetch(path: string, options: RequestInit = {}) {
  const token = await blink.auth.getValidToken();
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RewardTier {
  threshold: number;
  label: string;
  reward: string;
  monthsFree: number;
}

export interface ReferralRewardsStats {
  conversions: number;
  creditsEarned: number;
  freeMonthsEarned: number;
  freeMonthsRedeemed: number;
  freeMonthsAvailable: number;
  currentTier: RewardTier | null;
  nextTier: RewardTier | null;
  nextTierProgress: number;
  tiers: RewardTier[];
  bonusPerReferral: number;
}

export interface ReferralHistoryItem {
  id: string;
  referredEmail: string;
  creditsAwarded: number;
  tierUnlocked: string;
  createdAt: string;
}

export interface ReferralLink {
  code: string;
  link: string;
}

export interface RedeemResult {
  success: boolean;
  redeemed: number;
  remaining: number;
  message: string;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** Fetch referral rewards stats — auto-refetches every 60 seconds. */
export function useReferralRewardsStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['referral-rewards', 'stats', user?.id],
    queryFn: () => authFetch('/api/referral-rewards/stats') as Promise<ReferralRewardsStats>,
    enabled: !!user?.id,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  });
}

/** Fetch referral reward history (last 50 events). */
export function useReferralRewardsHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['referral-rewards', 'history', user?.id],
    queryFn: async (): Promise<ReferralHistoryItem[]> => {
      const data = await authFetch('/api/referral-rewards/history');
      return (data as { history: ReferralHistoryItem[] }).history;
    },
    enabled: !!user?.id,
    staleTime: 60_000,
    retry: 1,
  });
}

/** Fetch or create the user's unique referral code and link. */
export function useReferralRewardsLink() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['referral-rewards', 'link', user?.id],
    queryFn: () => authFetch('/api/referral-rewards/link') as Promise<ReferralLink>,
    enabled: !!user?.id,
    staleTime: 5 * 60_000, // link rarely changes
    retry: 1,
  });
}

/** Redeem one earned free month. Invalidates stats and history on success. */
export function useRedeemFreeMonth() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      authFetch('/api/referral-rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }) as Promise<RedeemResult>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-rewards', 'stats', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['referral-rewards', 'history', user?.id] });
    },
  });
}
