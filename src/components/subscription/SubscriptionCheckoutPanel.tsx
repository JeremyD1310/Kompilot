/**
 * SubscriptionCheckoutPanel — petit panneau inline qui affiche les checkboxes
 * légales CGV + rétractation et le bouton de redirection vers Stripe Checkout.
 *
 * Remplace l'appel direct à StripePaymentModal pour tout abonnement récurrent.
 * Les crédits ponctuels (non-récurrents) continuent d'utiliser StripePaymentModal.
 */
import { useState } from 'react';
import { Button } from '@blinkdotnew/ui';
import { Zap, X, Loader2 } from 'lucide-react';
import {
  LegalConsentBlock,
  isLegalConsentValid,
  type LegalConsentState,
} from './LegalConsentBlock';
import { useStripeCheckout } from '../../hooks/useStripeCheckout';

interface SubscriptionCheckoutPanelProps {
  planId: 'pro' | 'expert' | 'starter' | 'agency';
  planName: string;
  onCancel: () => void;
  onCheckoutOpened?: () => void;
  /** Show the trial-renunciation checkbox (pass true when user is on an active trial) */
  showTrialRenunciation?: boolean;
}

export function SubscriptionCheckoutPanel({
  planId,
  planName,
  onCancel,
  onCheckoutOpened,
  showTrialRenunciation,
}: SubscriptionCheckoutPanelProps) {
  const { startCheckout, loading } = useStripeCheckout();
  const [consent, setConsent] = useState<LegalConsentState>({
    cgvAccepted: false,
    retractionWaived: false,
    renouncedTrial: false,
  });

  // When trial renunciation is shown, require the box to be ticked before confirming
  const isValid = isLegalConsentValid(consent) &&
    (!showTrialRenunciation || consent.renouncedTrial === true);

  const handleConfirm = async () => {
    if (!isValid) return;
    await startCheckout(planId, consent);
    onCheckoutOpened?.();
  };

  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">
          Offre <span className="text-primary">{planName}</span> sélectionnée
        </p>
        <button
          onClick={onCancel}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Annuler"
        >
          <X size={14} />
        </button>
      </div>

      <LegalConsentBlock
        state={consent}
        onChange={setConsent}
        disabled={loading}
        showTrialRenunciation={showTrialRenunciation}
      />

      <div className="flex gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs h-9"
          onClick={onCancel}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button
          size="sm"
          onClick={handleConfirm}
          disabled={!isValid || loading}
          className="flex-1 gap-1.5 text-xs h-9"
        >
          {loading
            ? <><Loader2 size={12} className="animate-spin" /> Ouverture…</>
            : <><Zap size={12} /> Confirmer et payer</>
          }
        </Button>
      </div>
    </div>
  );
}
