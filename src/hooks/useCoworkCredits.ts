/**
 * useCoworkCredits — Persists Claude Cowork AI credits in blink.db.
 * Each user starts with 15 free credits. Credits stored in ai_credits_used
 * field on the establishments table (reused) or in a dedicated local store.
 * We use localStorage for demo + DB for real users.
 */
import { useCredits } from '../context/CreditsContext';

export function useCoworkCredits() {
  const { credits, isEmpty, deductCredit } = useCredits();

  return {
    credits: typeof credits === 'number' ? credits : 0,
    isLoaded: true,
    consumeCredit: () => {
      if (isEmpty) return false;
      void deductCredit();
      return true;
    },
    // Credit purchases are confirmed by billing webhooks; never mutate locally.
    addCredits: (_amount = 15) => { /* backend-owned */ },
    refillIfEmpty: () => { /* backend-owned */ },
  };
}
