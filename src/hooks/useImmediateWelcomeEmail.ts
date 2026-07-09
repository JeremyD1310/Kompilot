/**
 * useImmediateWelcomeEmail — Fires a welcome email immediately on first signup.
 *
 * Unlike useTrialSequence (fires on protected route load) and useWelcomeEmailSequence
 * (fires after onboarding completion), this hook detects a brand-new user in
 * onAuthStateChanged and sends the J0 welcome email within seconds of account creation.
 *
 * Dedup: localStorage key per userId. The backend also rate-limits to 1 email/24h.
 */

import { useEffect, useRef } from 'react';
import { blink } from '../blink/client';

const BACKEND_URL = 'https://gbrhsehk.backend.blink.new';
const SENT_KEY = (userId: string) => `immediate_welcome_sent_${userId}`;

export function useImmediateWelcomeEmail(userId: string | null | undefined) {
  const fired = useRef(false);

  useEffect(() => {
    if (!userId || fired.current) return;

    // Already sent in a previous session
    try {
      if (localStorage.getItem(SENT_KEY(userId))) return;
    } catch { /* noop */ }

    fired.current = true;

    const run = async () => {
      try {
        // Get full user profile to check created_at
        const user = await blink.auth.me().catch(() => null);
        if (!user?.email) return;

        // Only fire for users created within the last 10 minutes (genuine new signups)
        const createdAt = (user as any).createdAt || (user as any).created_at;
        if (createdAt) {
          const ageMinutes = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60);
          if (ageMinutes > 10) return; // Not a new signup — skip
        }

        const token = await blink.auth.getValidToken().catch(() => null);
        if (!token) return;

        const displayName = user.displayName || user.email.split('@')[0] || '';
        const sector = (user as any).metadata?.onboarding_sector || 'commerce';
        const objective = (user as any).metadata?.objective || '';

        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 10_000);

        await fetch(`${BACKEND_URL}/api/onboarding/welcome-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId,
            sector,
            objective,
            displayName,
            email: user.email,
          }),
          signal: ctrl.signal,
        });

        clearTimeout(timer);

        // Mark as sent locally
        try { localStorage.setItem(SENT_KEY(userId), new Date().toISOString()); } catch { /* noop */ }
      } catch {
        // Silent — never block the user
      }
    };

    // Delay 2s to let auth settle and not block initial render
    const timer = setTimeout(run, 2000);
    return () => clearTimeout(timer);
  }, [userId]);
}
