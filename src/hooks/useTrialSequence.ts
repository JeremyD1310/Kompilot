/**
 * useTrialSequence — fires the trial email sequence check once per session.
 *
 * Calls POST /api/trial-sequence/check-and-send which evaluates the user's
 * trial stage (J0→J30) and sends the appropriate email if not already sent.
 *
 * This hook is non-blocking: it fires-and-forgets on first auth in a session,
 * debounced via sessionStorage to avoid re-sending on hot-reloads or fast nav.
 */
import { useEffect, useRef } from 'react';
import { blink } from '../blink/client';

const BACKEND_URL = `https://gbrhsehk.backend.blink.new`;
const SESSION_KEY = 'trial_seq_checked_v1';

export function useTrialSequence(userId: string | undefined) {
  const fired = useRef(false);

  useEffect(() => {
    if (!userId || fired.current) return;

    // Only fire once per browser session (survives React re-renders, not tab close)
    try {
      if (sessionStorage.getItem(SESSION_KEY) === userId) return;
    } catch { /* noop */ }

    fired.current = true;

    const run = async () => {
      try {
        const token = await blink.auth.getValidToken();
        if (!token) return;

        const res = await fetch(`${BACKEND_URL}/api/trial-sequence/check-and-send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json() as { emailsSent?: string[] };
          if (data.emailsSent?.length) {
            console.log('[trial-sequence] emails sent:', data.emailsSent);
          }
          // Mark as checked for this session
          try { sessionStorage.setItem(SESSION_KEY, userId); } catch { /* noop */ }
        }
      } catch (err) {
        // Non-blocking — don't affect the UI
        console.warn('[trial-sequence] check failed (non-fatal):', err);
      }
    };

    // Delay 3s after auth to not block initial render
    const timer = setTimeout(run, 3000);
    return () => clearTimeout(timer);
  }, [userId]);
}
