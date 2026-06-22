/**
 * StripeCheckoutButton — initiates a Stripe Checkout session.
 *
 * Handles idle → loading → redirecting → error states.
 * After redirect, detects ?checkout=success in URL and calls onSuccess.
 * Displays inline error (no toast).
 */
import { useState, useEffect } from 'react';
import { Lock, Loader2, Zap } from 'lucide-react';
import { Button } from '@blinkdotnew/ui';
import { createCheckoutSession, type CheckoutLegalConsent } from '../../lib/billingClient';
import { CGV_VERSION } from './LegalConsentBlock';

export interface StripeCheckoutButtonProps {
  planId: string;
  planName: string;
  /** Stripe price ID — passed through to billingClient (future use) */
  priceId?: string;
  amount: number;
  /** Require legal consent before calling backend */
  legalConsent?: CheckoutLegalConsent;
  onSuccess?: () => void;
  className?: string;
  disabled?: boolean;
}

type CheckoutState = 'idle' | 'loading' | 'redirecting' | 'error';

export function StripeCheckoutButton({
  planId,
  planName,
  amount,
  legalConsent,
  onSuccess,
  className = '',
  disabled = false,
}: StripeCheckoutButtonProps) {
  const [state, setState] = useState<CheckoutState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Detect ?checkout=success after Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      onSuccess?.();
    }
  }, [onSuccess]);

  const handleClick = async () => {
    if (state === 'loading' || state === 'redirecting') return;
    setErrorMsg(null);
    setState('loading');

    try {
      const consent: CheckoutLegalConsent = legalConsent ?? {
        cgvAccepted: true,
        retractionWaived: true,
        cgvVersion: CGV_VERSION,
        acceptedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
      };

      const result = await createCheckoutSession(planId, consent);

      if (result.url && !result.fallback) {
        setState('redirecting');
        window.open(result.url, '_blank', 'noopener,noreferrer');
        // Reset after a moment so the button is clickable again if tab didn't open
        setTimeout(() => setState('idle'), 4000);
      } else if (result.fallback) {
        setState('idle');
        setErrorMsg('Configuration Stripe en cours — revenez bientôt.');
      } else if (result.code === 'MISSING_LEGAL_CONSENT') {
        setState('idle');
        setErrorMsg('Veuillez accepter les CGV avant de continuer.');
      } else {
        setState('error');
        setErrorMsg(result.error ?? 'Une erreur est survenue. Réessayez.');
      }
    } catch {
      setState('error');
      setErrorMsg('Erreur réseau. Vérifiez votre connexion et réessayez.');
    }
  };

  const isLoading = state === 'loading' || state === 'redirecting';

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={`gap-2 ${className}`}
      >
        {isLoading ? (
          <><Loader2 size={14} className="animate-spin" />{state === 'redirecting' ? 'Redirection…' : 'Ouverture…'}</>
        ) : (
          <><Zap size={14} />Choisir {planName} — {amount}€/mois</>
        )}
      </Button>

      {/* Mention légale L221-3 — obligatoire sous le bouton de paiement */}
      <div style={{
        background: 'rgba(15,23,42,.04)',
        border: '1px solid rgba(0,0,0,.08)',
        borderRadius: 8,
        padding: '9px 12px',
        marginTop: 2,
      }}>
        <p style={{
          fontSize: '.68rem',
          color: '#64748B',
          lineHeight: 1.55,
          margin: 0,
          textAlign: 'center',
        }}>
          <strong style={{ color: '#475569' }}>
            En validant votre abonnement, vous agissez en tant que professionnel.
          </strong>{' '}
          Conformément à l'article L221-3 du Code de la consommation, le droit de rétractation n'est pas applicable.
          L'accès immédiat aux outils d'automatisation et aux crédits IA (Claude / Meta Ads) entraîne l'exécution pleine
          et entière du service dès la validation du paiement.
        </p>
      </div>

      <p className="text-center text-[10px] text-muted-foreground/70 flex items-center justify-center gap-1 mt-1">
        <Lock size={9} /> Paiement sécurisé 🔒
      </p>

      {errorMsg && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
