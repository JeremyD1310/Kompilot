/**
 * useAnnualPlanSwitch — Hook for switching from monthly to annual billing.
 *
 * Uses the existing /api/billing/change-plan endpoint which already supports
 * monthly→yearly transitions with proration.
 *
 * The annual pricing is:
 *   Starter: 690€/an (69€ × 10 = 2 mois offerts, équivalent 57.50€/mois)
 *   Agency:  1490€/an (149€ × 10 = 2 mois offerts, équivalent 124.17€/mois)
 */

import { useState, useCallback } from 'react';
import { blink } from '../blink/client';

const BACKEND_URL = 'https://gbrhsehk.backend.blink.new';

export interface AnnualPlanInfo {
  planId: string;
  monthlyPrice: number;
  annualTotal: number;         // 10 months worth
  monthlyEquiv: number;        // annualTotal / 12
  savings: number;             // 2 months free
  stripeEnvKey: string;
}

export const ANNUAL_PLANS: Record<string, AnnualPlanInfo> = {
  starter: {
    planId: 'starter',
    monthlyPrice: 69,
    annualTotal: 690,
    monthlyEquiv: 57.50,
    savings: 138,              // 69 × 2
    stripeEnvKey: 'PRICE_STARTER_YEARLY_ID',
  },
  agency: {
    planId: 'agency',
    monthlyPrice: 149,
    annualTotal: 1490,
    monthlyEquiv: 124.17,
    savings: 298,              // 149 × 2
    stripeEnvKey: 'PRICE_AGENCY_YEARLY_ID',
  },
};

export function useAnnualPlanSwitch(currentPlanId?: string) {
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planInfo = currentPlanId ? ANNUAL_PLANS[currentPlanId] ?? null : null;

  const switchToAnnual = useCallback(async (planId: string) => {
    setSwitching(true);
    setError(null);

    try {
      const token = await blink.auth.getValidToken();
      const res = await fetch(`${BACKEND_URL}/api/billing/change-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          newPlanId: planId,
          newBilling: 'yearly',
        }),
      });

      const data = await res.json() as {
        success?: boolean;
        error?: string;
        code?: string;
        subscription?: any;
      };

      if (!res.ok) {
        const msg = data.error || `Erreur HTTP ${res.status}`;
        setError(msg);
        return { success: false, error: msg };
      }

      return { success: true, subscription: data.subscription };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur réseau';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setSwitching(false);
    }
  }, []);

  return {
    planInfo,
    switching,
    error,
    switchToAnnual,
    clearError: () => setError(null),
  };
}
