/**
 * TrialContext — Gestion de l'essai gratuit 14 jours + logique paywall.
 *
 * - Calcule le nombre de jours restants depuis la date de création du compte
 * - Expose `isTrialActive`, `trialDaysLeft`, `isTrialExpired`
 * - Expose `gateAction(cb)` : si trial actif, bloque et ouvre la modale premium
 */

import {
  createContext, useContext, useState, useEffect, useCallback, useMemo,
  type ReactNode,
} from 'react';
import { useAuth } from '../hooks/useAuth';

const TRIAL_DURATION_DAYS = 14;

// ── Trial quotas ────────────────────────────────────────────────────────────
export const TRIAL_QUOTA = {
  aiReplies:  { limit: 10, key: 'nc_trial_ai_replies'  },
  postGens:   { limit: 5,  key: 'nc_trial_post_gens'   },
  audits:     { limit: 3,  key: 'nc_trial_audits'      },
} as const;

export type TrialQuotaType = keyof typeof TRIAL_QUOTA;

function readQuota(type: TrialQuotaType): number {
  try { return Math.max(0, Number(localStorage.getItem(TRIAL_QUOTA[type].key) ?? '0')); }
  catch { return 0; }
}

function writeQuota(type: TrialQuotaType, n: number): void {
  try { localStorage.setItem(TRIAL_QUOTA[type].key, String(n)); } catch { /* noop */ }
}

export interface TrialContextValue {
  /** L'essai est en cours (pas encore expiré, pas encore abonné) */
  isTrialActive: boolean;
  /** Jours restants (0 si expiré) */
  trialDaysLeft: number;
  /** L'essai est dépassé et l'utilisateur n'est pas abonné */
  isTrialExpired: boolean;
  /** Affiche la modale paywall sans exécuter l'action */
  openPaywall: () => void;
  /** Si trial actif ou expiré → bloque l'action et ouvre le paywall, sinon exécute cb */
  gateAction: (cb?: () => void) => void;
  /** Modale premium ouverte ? */
  paywallOpen: boolean;
  /** Ferme la modale */
  closePaywall: () => void;
  // ── Quotas ─────────────────────────────────────────────────────────────
  /** Consomme 1 unité de quota. Retourne false et ouvre le paywall si dépassé. */
  consumeQuota: (type: TrialQuotaType) => boolean;
  /** Usage actuel par type */
  quotaUsed: Record<TrialQuotaType, number>;
  /** Quota dépassé ? */
  isQuotaExceeded: (type: TrialQuotaType) => boolean;
  /** Crédits restants pour un type */
  quotaRemaining: (type: TrialQuotaType) => number;
}

const TrialContext = createContext<TrialContextValue | null>(null);

const TRIAL_START_KEY = 'kompilot_trial_start';

export function TrialProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [paywallOpen, setPaywallOpen] = useState(false);

  // ── Quota state (initialized from localStorage) ─────────────────────────
  const [quotaUsed, setQuotaUsed] = useState<Record<TrialQuotaType, number>>(() => ({
    aiReplies: readQuota('aiReplies'),
    postGens:  readQuota('postGens'),
    audits:    readQuota('audits'),
  }));

  // Détermine la date de début d'essai — priorité : DB user.created_at > localStorage > now
  const trialStart = (() => {
    // Priority 1: user account creation date from DB (most authoritative)
    const dbDate = (user as any)?.createdAt ?? (user as any)?.created_at;
    if (dbDate) {
      const d = new Date(dbDate);
      if (!isNaN(d.getTime())) {
        // Cache in localStorage to avoid recalculation when user is not yet loaded
        try { localStorage.setItem(TRIAL_START_KEY, d.toISOString()); } catch { /* noop */ }
        return d;
      }
    }
    // Priority 2: localStorage cached value
    try {
      const stored = localStorage.getItem(TRIAL_START_KEY);
      if (stored) return new Date(stored);
    } catch { /* noop */ }
    // Priority 3: now (first session before user loads)
    const now = new Date();
    try { localStorage.setItem(TRIAL_START_KEY, now.toISOString()); } catch { /* noop */ }
    return now;
  })();

  const msElapsed = Date.now() - trialStart.getTime();
  const daysElapsed = Math.floor(msElapsed / (1000 * 60 * 60 * 24));
  const trialDaysLeft = Math.max(0, TRIAL_DURATION_DAYS - daysElapsed);
  const isTrialExpired = trialDaysLeft === 0;
  const isTrialActive = !isTrialExpired;

  const openPaywall = useCallback(() => setPaywallOpen(true), []);
  const closePaywall = useCallback(() => setPaywallOpen(false), []);

  const gateAction = useCallback((cb?: () => void) => {
    if (isTrialExpired) { setPaywallOpen(true); return; }
    if (cb) cb();
  }, [isTrialExpired]);

  // ── Quota helpers ─────────────────────────────────────────────────────────
  const isQuotaExceeded = useCallback((type: TrialQuotaType): boolean =>
    quotaUsed[type] >= TRIAL_QUOTA[type].limit
  , [quotaUsed]);

  const quotaRemaining = useCallback((type: TrialQuotaType): number =>
    Math.max(0, TRIAL_QUOTA[type].limit - quotaUsed[type])
  , [quotaUsed]);

  /**
   * Consume 1 unit of the given quota.
   * - Returns true  → still within quota (action can proceed)
   * - Returns false → quota exceeded; paywall is opened automatically
   */
  const consumeQuota = useCallback((type: TrialQuotaType): boolean => {
    // If trial is expired, always block
    if (isTrialExpired) { setPaywallOpen(true); return false; }
    // Check quota before consuming
    const used = readQuota(type); // always read fresh from storage
    if (used >= TRIAL_QUOTA[type].limit) {
      setPaywallOpen(true);
      return false;
    }
    const next = used + 1;
    writeQuota(type, next);
    setQuotaUsed(prev => ({ ...prev, [type]: next }));
    return true;
  }, [isTrialExpired]);

  // Sauvegarde la date de début si l'utilisateur vient de se connecter
  useEffect(() => {
    if (!user) return;
    try {
      if (!localStorage.getItem(TRIAL_START_KEY)) {
        const d = (user as any)?.createdAt ? new Date((user as any).createdAt) : new Date();
        localStorage.setItem(TRIAL_START_KEY, d.toISOString());
      }
    } catch { /* noop */ }
  }, [user]);

  const contextValue = useMemo(() => ({
    isTrialActive,
    trialDaysLeft,
    isTrialExpired,
    openPaywall,
    gateAction,
    paywallOpen,
    closePaywall,
    consumeQuota,
    quotaUsed,
    isQuotaExceeded,
    quotaRemaining,
  }), [isTrialActive, trialDaysLeft, isTrialExpired, openPaywall, gateAction, paywallOpen, closePaywall, consumeQuota, quotaUsed, isQuotaExceeded, quotaRemaining]);

  return (
    <TrialContext.Provider value={contextValue}>
      {children}
    </TrialContext.Provider>
  );
}

export function useTrial() {
  const ctx = useContext(TrialContext);
  if (!ctx) { console.warn('useTrial must be used within TrialProvider' + ' — context missing, returning safe fallback'); return {} as any; }
  return ctx;
}
