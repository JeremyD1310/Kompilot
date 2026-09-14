/**
 * PricingAbandonTracker — Hook + composant discret pour tracker les abandons
 * de page pricing. À monter dans la page de pricing/souscription.
 *
 * Détecte : visite d'un plan spécifique sans finalisation de paiement.
 * Enregistre dans pricing_abandon_events + notifie l'équipe support.
 */
import { useEffect, useRef } from 'react';
import { blink } from '../../blink/client';

interface PricingAbandonTrackerProps {
  planId: string;
  billing?: 'monthly' | 'yearly';
  email?: string;
  /** Délai en ms avant de considérer un abandon (défaut: 15s) */
  abandonDelayMs?: number;
}

/**
 * Hook à utiliser dans n'importe quel composant de pricing.
 * Appeler trackAbandon() quand l'utilisateur quitte sans payer.
 */
export function usePricingAbandon() {
  const tracked = useRef(new Set<string>());

  const trackAbandon = async (planId: string, billing: 'monthly' | 'yearly' = 'monthly', email = '') => {
    const key = `${planId}-${billing}-${Date.now()}`;
    if (tracked.current.has(key)) return;
    tracked.current.add(key);

    try {
      await blink.functions.invoke('api/pricing/abandon', {
        method: 'POST',
        body: { planId, billing, email, pageUrl: window.location.href },
      });
    } catch {
      // Silent — l'utilisateur ne doit pas voir d'erreur
    }
  };

  return { trackAbandon };
}

/**
 * Composant à monter dans la page pricing.
 * Tracke automatiquement l'abandon après abandonDelayMs.
 */
export function PricingAbandonTracker({ planId, billing = 'monthly', email = '', abandonDelayMs = 15000 }: PricingAbandonTrackerProps) {
  const hasTracked = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasTracked.current) return;
      hasTracked.current = true;

      blink.functions.invoke('api/pricing/abandon', {
        method: 'POST',
        body: { planId, billing, email, pageUrl: window.location.href },
      }).catch(() => {});
    }, abandonDelayMs);

    return () => clearTimeout(timer);
  }, [planId, billing, email, abandonDelayMs]);

  return null; // Composant invisible
}
