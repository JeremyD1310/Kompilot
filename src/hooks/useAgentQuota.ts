/**
 * useAgentQuota — Fair Use Policy for AI Agents (Claude Cowork)
 *
 * Limits:
 *   - Pro plan  : 100 sprints/month
 *   - Expert/Agency : 300 sprints/month
 *   - Free      : 0 (blocked by paywall upstream)
 *
 * Counters are stored in localStorage keyed by userId + YYYY-MM.
 * They reset automatically each calendar month.
 *
 * Credit packs (upsell):
 *   - Pack 50 sprints  → +25€/HT (simulated — triggers Stripe flow)
 *   - Pack 150 sprints → +60€/HT
 *   - Pack 500 sprints → +150€/HT
 */
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useSubscription } from '../context/SubscriptionContext';
import { useCredits } from '../context/CreditsContext'; // Assuming CreditsContext is available

// ── Plan limits ───────────────────────────────────────────────────────────────

export const PLAN_LIMITS: Record<string, number> = {
  free:   0,
  pro:    100,
  expert: 300,
};

// ── Credit packs (upsell) ────────────────────────────────────────────────────

export interface CreditPack {
  id: string;
  sprints: number;
  priceHT: number;
  label: string;
  badge?: string;
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: 'pack_50',  sprints: 50,  priceHT: 25,  label: 'Pack Starter', badge: '' },
  { id: 'pack_150', sprints: 150, priceHT: 60,  label: 'Pack Growth',  badge: 'Populaire' },
  { id: 'pack_500', sprints: 500, priceHT: 150, label: 'Pack Agence',  badge: 'Meilleure valeur' },
];

// ── Storage helpers ───────────────────────────────────────────────────────────

// Removed localStorage helper functions as they are no longer used.

// ── Hook ─────────────────────────────────────────────────────────────────────

export interface AgentQuota {
  /** Base plan limit for this month */
  planLimit: number;
  /** Extra bought credits (rolls over month to month) */
  extraCredits: number;
  /** Total sprints used this calendar month (plan + extra combined) */
  used: number;
  /** Total capacity = planLimit + extraCredits */
  total: number;
  /** Remaining = total - used */
  remaining: number;
  /** True when remaining === 0 */
  isExhausted: boolean;
  /** 0–100 percentage of base plan used */
  planUsagePercent: number;
  /** Consume one sprint. Returns false if exhausted. */
  consume: () => boolean;
  /** Add extra sprints from a purchased pack */
  addPack: (sprints: number) => void;
  /** Month label e.g. "Juin 2026" */
  monthLabel: string;
}

export function useAgentQuota(): AgentQuota {
  const { credits, limit, usage, hasEnoughCredits, deductCredits } = useCredits();
  const consume = useCallback(() => {
    if (!hasEnoughCredits(1)) return false;
    void deductCredits(1, 'agent_sprint');
    return true;
  }, [deductCredits, hasEnoughCredits]);
  const total = Math.max(0, limit);
  const remaining = Math.max(0, credits);
  return {
    planLimit: total,
    extraCredits: 0, // Assuming CreditsContext handles extra credits implicitly
    used: usage,
    total,
    remaining,
    isExhausted: remaining === 0,
    planUsagePercent: total > 0 ? Math.min(100, Math.round((usage / total) * 100)) : 0,
    consume,
    addPack: (_sprints: number) => { /* purchases are backend-confirmed */ },
    monthLabel: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
  };
}
