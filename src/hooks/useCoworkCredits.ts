/**
 * useCoworkCredits — Persists Claude Cowork AI credits in blink.db.
 * Each user starts with 15 free credits. Credits stored in ai_credits_used
 * field on the establishments table (reused) or in a dedicated local store.
 * We use localStorage for demo + DB for real users.
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

const DEFAULT_CREDITS = 15;
const CREDITS_KEY = (userId: string) => `cowork_credits_${userId}`;

export function useCoworkCredits() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number>(DEFAULT_CREDITS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const stored = localStorage.getItem(CREDITS_KEY(user.id));
    setCredits(stored !== null ? parseInt(stored, 10) : DEFAULT_CREDITS);
    setIsLoaded(true);
  }, [user?.id]);

  const consumeCredit = useCallback(() => {
    if (!user?.id) return false;
    const current = credits;
    if (current <= 0) return false;
    const next = current - 1;
    setCredits(next);
    localStorage.setItem(CREDITS_KEY(user.id), String(next));
    return true;
  }, [credits, user?.id]);

  const addCredits = useCallback((amount = 15) => {
    if (!user?.id) return;
    const next = credits + amount;
    setCredits(next);
    localStorage.setItem(CREDITS_KEY(user.id), String(next));
  }, [credits, user?.id]);

  const refillIfEmpty = useCallback(() => {
    if (!user?.id) return;
    if (credits <= 0) {
      setCredits(DEFAULT_CREDITS);
      localStorage.setItem(CREDITS_KEY(user.id), String(DEFAULT_CREDITS));
    }
  }, [credits, user?.id]);

  return { credits, isLoaded, consumeCredit, addCredits, refillIfEmpty };
}
