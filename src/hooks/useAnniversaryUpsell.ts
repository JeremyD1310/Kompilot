/**
 * useAnniversaryUpsell — Contextual annual upsell after 90 days of usage.
 *
 * Logic:
 *   - If user has been subscribed for 90+ days on a MONTHLY plan
 *   - And hasn't already dismissed the upsell
 *   - Then show a gentle upsell banner: "Passez en annuel, économisez 1 mois"
 *
 * The hook returns { showUpsell, dismiss, daysActive, planSavings }.
 * The parent component decides how to render the banner.
 */

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './useAuth';

interface AnniversaryUpsellState {
  showUpsell: boolean;
  dismiss: () => void;
  daysActive: number;
  planSavings: { starter: number; agency: number };
}

const DISMISS_KEY = 'kompilot_anniversary_upsell_dismissed';
const ACTIVATION_THRESHOLD_DAYS = 90;

export function useAnniversaryUpsell(): AnniversaryUpsellState {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });

  // Calculate days since account creation
  const daysActive = useMemo(() => {
    const createdAt = (user as any)?.createdAt || (user as any)?.created_at;
    if (!createdAt) return 0;
    try {
      const created = new Date(createdAt);
      const now = new Date();
      return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    } catch { return 0; }
  }, [(user as any)?.createdAt, (user as any)?.created_at]);

  // Read billing interval from user metadata (DB-level, fetched separately)
  const billingInterval = useMemo(() => {
    try {
      // user.metadata from Blink SDK may be an object or string depending on version
      const raw = (user as any)?.metadata;
      if (!raw) return 'monthly';
      const meta = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return meta?.billing_interval || 'monthly';
    } catch { return 'monthly'; }
  }, [(user as any)?.metadata]);

  // Only show if: monthly + 90+ days + not dismissed
  const showUpsell = !dismissed
    && billingInterval === 'monthly'
    && daysActive >= ACTIVATION_THRESHOLD_DAYS;

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* noop */ }
  };

  // Savings: 1 month free on annual
  const planSavings = { starter: 69, agency: 149 };

  return { showUpsell, dismiss, daysActive, planSavings };
}
