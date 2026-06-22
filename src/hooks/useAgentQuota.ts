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

function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function storageKey(userId: string): string {
  return `agent_quota_${userId}_${currentYearMonth()}`;
}

function extraCreditsKey(userId: string): string {
  return `agent_extra_${userId}`;
}

function readUsed(userId: string): number {
  try {
    return parseInt(localStorage.getItem(storageKey(userId)) ?? '0', 10) || 0;
  } catch { return 0; }
}

function writeUsed(userId: string, value: number): void {
  try { localStorage.setItem(storageKey(userId), String(value)); } catch {}
}

function readExtra(userId: string): number {
  try {
    return parseInt(localStorage.getItem(extraCreditsKey(userId)) ?? '0', 10) || 0;
  } catch { return 0; }
}

function writeExtra(userId: string, value: number): void {
  try { localStorage.setItem(extraCreditsKey(userId), String(value)); } catch {}
}

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
  const { user } = useAuth();
  const { currentPlan } = useSubscription();

  const planLimit = PLAN_LIMITS[currentPlan.id] ?? 0;
  const userId = user?.id ?? '__anon__';

  const [used, setUsed] = useState<number>(() => readUsed(userId));
  const [extraCredits, setExtraCredits] = useState<number>(() => readExtra(userId));

  // Re-read when user changes
  useEffect(() => {
    setUsed(readUsed(userId));
    setExtraCredits(readExtra(userId));
  }, [userId]);

  const total = planLimit + extraCredits;
  const remaining = Math.max(0, total - used);
  const isExhausted = remaining === 0;
  const planUsagePercent = planLimit > 0 ? Math.min(100, Math.round((used / planLimit) * 100)) : 0;

  const consume = useCallback((): boolean => {
    const currentUsed = readUsed(userId);
    const currentExtra = readExtra(userId);
    const currentTotal = planLimit + currentExtra;
    if (currentUsed >= currentTotal) return false;

    // Consume from extra first if base plan is exhausted
    if (currentUsed >= planLimit && currentExtra > 0) {
      const nextExtra = currentExtra - 1;
      writeExtra(userId, nextExtra);
      setExtraCredits(nextExtra);
    }

    const nextUsed = currentUsed + 1;
    writeUsed(userId, nextUsed);
    setUsed(nextUsed);

    // Mark onboarding checklist step as done (first sprint ever)
    try {
      if (currentUsed === 0) {
        localStorage.setItem(`agent_sprint_launched_${userId}`, '1');
      }
    } catch { /* noop */ }

    return true;
  }, [userId, planLimit]);

  const addPack = useCallback((sprints: number): void => {
    const current = readExtra(userId);
    const next = current + sprints;
    writeExtra(userId, next);
    setExtraCredits(next);
  }, [userId]);

  const monthLabel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return {
    planLimit,
    extraCredits,
    used,
    total,
    remaining,
    isExhausted,
    planUsagePercent,
    consume,
    addPack,
    monthLabel,
  };
}
