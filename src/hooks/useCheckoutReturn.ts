/**
 * useCheckoutReturn — detects a Stripe Checkout success redirect and refreshes
 * the billing status so the plan upgrades immediately without requiring a page reload.
 *
 * Stripe redirects to: /dashboard?checkout=success&plan=<planId>
 * This hook runs once on mount, detects those params, refreshes billing, shows a
 * success toast, and cleans the URL.
 */
import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from '@blinkdotnew/ui';
import { useSubscription } from '../context/SubscriptionContext';

export function useCheckoutReturn() {
  const { refreshBillingStatus } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutType = params.get('checkout');
    if (!checkoutType) return;

    // Credit pack purchase
    if (checkoutType === 'credit_pack') {
      const credits = params.get('credits');
      toast.success('Crédits rechargés ! 🎉', {
        description: credits
          ? `${credits} crédits IA ajoutés à votre compte.`
          : 'Vos crédits ont été ajoutés. Actualisez si nécessaire.',
      });
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
      return;
    }

    // Subscription checkout
    if (checkoutType !== 'success') return;

    const planLabel = params.get('plan') === 'expert' ? 'Expert' : 'Pro';

    // Refresh billing status so the plan syncs from Stripe → DB → context
    refreshBillingStatus().then(() => {
      toast.success(`Offre ${planLabel} activée ! 🎉`, {
        description: 'Votre abonnement est maintenant actif. Bienvenue dans Kompilot !',
      });
    }).catch(() => {
      // Non-blocking — show success toast anyway
      toast.success(`Paiement confirmé ! 🎉`, {
        description: 'Votre abonnement est en cours d\'activation.',
      });
    });

    // Clean the URL without triggering a navigation
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
