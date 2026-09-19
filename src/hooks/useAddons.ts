import { BACKEND_URL as KOMPILOT_BACKEND_URL } from '@/lib/backend';
/**
 * useAddons — React hook for the add-on system.
 *
 * Reads addon state from the backend /api/billing/addon/status endpoint
 * (which itself reads from users.metadata.addons — synced from Stripe webhooks).
 *
 * Usage:
 *   const { hasCreativePremium, hasWhiteLabel, subscribe, remove, loading } = useAddons();
 *   if (!hasCreativePremium) <AddonPaywall addonId="creative_premium" />
 */

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blink } from '../blink/client';
import { useAuth } from './useAuth';

const BACKEND_URL = KOMPILOT_BACKEND_URL;

// ── Types ────────────────────────────────────────────────────────────────────

export type AddonId = 'creative_premium' | 'white_label';

interface AddonInfo {
  active: boolean;
  label: string;
  description: string;
  priceCents: number;
  requiresPlan: string | null;
  canSubscribe: boolean;
  canSubscribeReason: string | null;
}

interface AddonStatusResponse {
  planId: string | null;
  addons: Record<AddonId, AddonInfo>;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAddons() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch addon status
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['addon-status', user?.id],
    queryFn: async (): Promise<AddonStatusResponse> => {
      const token = await blink.auth.getValidToken();
      const res = await fetch(`${BACKEND_URL}/api/billing/addon/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch addon status');
      return res.json();
    },
    enabled: !!user?.id,
    staleTime: 60_000,
    retry: 1,
  });

  // Subscribe to addon mutation
  const subscribeMutation = useMutation({
    mutationFn: async (addonId: AddonId) => {
      const token = await blink.auth.getValidToken();
      const res = await fetch(`${BACKEND_URL}/api/billing/addon/checkout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ addonId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as any;
        throw new Error(err.error || 'Erreur lors de l\'activation');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addon-status'] });
    },
  });

  // Remove addon mutation
  const removeMutation = useMutation({
    mutationFn: async (addonId: AddonId) => {
      const token = await blink.auth.getValidToken();
      const res = await fetch(`${BACKEND_URL}/api/billing/addon/remove`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ addonId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as any;
        throw new Error(err.error || 'Erreur lors du retrait');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addon-status'] });
    },
  });

  // Convenience accessors
  const hasCreativePremium = data?.addons?.creative_premium?.active ?? false;
  const hasWhiteLabel = data?.addons?.white_label?.active ?? false;

  const subscribe = useCallback(
    (addonId: AddonId) => subscribeMutation.mutateAsync(addonId),
    [subscribeMutation],
  );

  const remove = useCallback(
    (addonId: AddonId) => removeMutation.mutateAsync(addonId),
    [removeMutation],
  );

  return {
    // State
    hasCreativePremium,
    hasWhiteLabel,
    addons: data?.addons ?? null,
    planId: data?.planId ?? null,
    loading: isLoading,
    error: error as Error | null,

    // Actions
    subscribe,
    remove,
    refetch,

    // Mutation states
    subscribing: subscribeMutation.isPending,
    removing: removeMutation.isPending,
    subscribeError: subscribeMutation.error as Error | null,
    removeError: removeMutation.error as Error | null,
  };
}

// ── Standalone helpers for non-hook contexts ─────────────────────────────────

/**
 * Check if a feature requiring an addon should be gated.
 * Used in non-hook contexts (e.g. inside event handlers).
 */
export async function checkAddonAccessDirect(addonId: AddonId): Promise<boolean> {
  try {
    const token = await blink.auth.getValidToken();
    const res = await fetch(`${BACKEND_URL}/api/billing/addon/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    const data = await res.json() as AddonStatusResponse;
    return data.addons?.[addonId]?.active ?? false;
  } catch {
    return false;
  }
}
