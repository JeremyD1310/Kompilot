/**
 * useStripeCheckout — opens a real Stripe Checkout session in a new tab.
 *
 * Usage:
 *   const { startCheckout, loading } = useStripeCheckout();
 *   await startCheckout('pro', legalConsent);
 *
 * The legalConsent object (cgvAccepted + retractionWaived) is sent to the backend
 * where it is stored immutably with IP + timestamp for anti-chargeback proof.
 *
 * After successful payment Stripe redirects to /dashboard?checkout=success&plan=<planId>.
 * The DashboardPage listens for that query param and calls refreshBillingStatus()
 * so the plan upgrades automatically without page reload.
 */
import { useState } from 'react';
import { toast } from '@blinkdotnew/ui';
import { createCheckoutSession, type CheckoutLegalConsent } from '../lib/billingClient';
import { CGV_VERSION } from '../components/subscription/LegalConsentBlock';
import { useRecordLegalSignature } from './useLegalSignature';

export function useStripeCheckout() {
  const [loading, setLoading] = useState(false);
  const recordSignature = useRecordLegalSignature();

  const startCheckout = async (
    planId: 'pro' | 'expert' | 'starter' | 'agency',
    consent: Pick<CheckoutLegalConsent, 'cgvAccepted' | 'retractionWaived' | 'renouncedTrial'>,
  ) => {
    if (loading) return;

    // Guard: both mandatory checkboxes must be ticked before calling this
    if (!consent.cgvAccepted || !consent.retractionWaived) {
      toast.error('Validation légale requise', {
        description: 'Veuillez accepter les CGV et renoncer au droit de rétractation.',
      });
      return;
    }

    setLoading(true);
    try {
      const legalConsent: CheckoutLegalConsent = {
        cgvAccepted:      consent.cgvAccepted,
        retractionWaived: consent.retractionWaived,
        cgvVersion:       CGV_VERSION,
        acceptedAt:       new Date().toISOString(),
        userAgent:        navigator.userAgent,
        renouncedTrial:   consent.renouncedTrial ?? false,
      };

      // ── Log clickwrap to legal_signatures (immuable, anti-chargeback) ──
      try {
        await recordSignature.mutateAsync({
          cgv_version_accepted: CGV_VERSION,
          plan_id: planId,
          checkout_type: 'paywall',
          signature_metadata: {
            cgv_accepted: consent.cgvAccepted,
            retraction_waived: consent.retractionWaived,
            renounced_trial: consent.renouncedTrial ?? false,
          },
        });
      } catch {
        // Non-blocking: log silently, don't block checkout
      }

      const result = await createCheckoutSession(planId, legalConsent);

      if (result.url && !result.fallback) {
        // Open Stripe Checkout in a new tab (required — preview iframe blocks Stripe)
        window.open(result.url, '_blank', 'noopener,noreferrer');
      } else if (result.fallback) {
        // Stripe prices not yet configured — send to pricing page
        toast.info('Configuration Stripe en cours', {
          description: 'Les offres payantes seront disponibles très prochainement.',
        });
        window.open('https://www.kompilot.fr/#tarifs', '_blank', 'noopener,noreferrer');
      } else if (result.code === 'MISSING_LEGAL_CONSENT') {
        toast.error('Consentement légal requis', {
          description: 'Veuillez accepter les CGV et renoncer au droit de rétractation.',
        });
      } else {
        toast.error('Erreur lors de la création du paiement', {
          description: result.error || 'Veuillez réessayer ou contacter le support.',
        });
      }
    } catch {
      toast.error('Erreur réseau', {
        description: 'Impossible de contacter le serveur de paiement.',
      });
    } finally {
      setLoading(false);
    }
  };

  return { startCheckout, loading };
}
