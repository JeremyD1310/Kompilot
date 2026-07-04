/**
 * useHighTouchDetection — fires high-touch lead check once per user session.
 *
 * Calls POST /api/leads/high-touch-check with the user's email on first auth.
 * Non-blocking: fires-and-forgets; logs results but never affects UI.
 */
import { useEffect, useRef } from 'react';
import { blink } from '../blink/client';

const BACKEND_URL = `https://gbrhsehk.backend.blink.new`;
const SESSION_KEY = 'high_touch_checked_v1';

export function useHighTouchDetection(
  userId: string | undefined,
  email: string | undefined,
  displayName: string | undefined,
) {
  const fired = useRef(false);

  useEffect(() => {
    if (!userId || !email || fired.current) return;

    // Only fire once per browser session
    try {
      if (sessionStorage.getItem(SESSION_KEY) === userId) return;
    } catch { /* noop */ }

    fired.current = true;

    const run = async () => {
      try {
        const token = await blink.auth.getValidToken();
        if (!token) return;

        const res = await fetch(`${BACKEND_URL}/api/leads/high-touch-check`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ email, displayName }),
        });

        if (res.ok) {
          const data = await res.json() as { analysis?: { shouldAlert?: boolean; highTouchScore?: number } };
          if (data.analysis?.shouldAlert) {
            console.log('[high-touch] lead qualified:', data.analysis.highTouchScore);
          }
          sessionStorage.setItem(SESSION_KEY, userId);
        }
      } catch (err) {
        // Non-blocking — don't affect UI
        console.warn('[high-touch] check failed (non-fatal):', err);
      }
    };

    // Delay 5s after auth to not block initial render
    const timer = setTimeout(run, 5000);
    return () => clearTimeout(timer);
  }, [userId, email, displayName]);
}
