/**
 * BillingPortalButton — opens the Stripe Customer Portal in a new tab.
 *
 * Variants:
 *   - "full" (default): wide button with full label
 *   - "compact": icon + short label, suitable for inline use
 *
 * Shows inline error on failure (no toast).
 */
import { useState } from 'react';
import { CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@blinkdotnew/ui';
import { createBillingPortalSession, portalErrorLabel } from '../../lib/billingClient';

export interface BillingPortalButtonProps {
  variant?: 'full' | 'compact';
  label?: string;
  className?: string;
}

export function BillingPortalButton({
  variant = 'full',
  label,
  className = '',
}: BillingPortalButtonProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClick = async () => {
    if (loading) return;
    setErrorMsg(null);
    setLoading(true);

    try {
      const result = await createBillingPortalSession();
      if (result.url) {
        window.open(result.url, '_blank', 'noopener,noreferrer');
      } else {
        setErrorMsg(portalErrorLabel(result.error!));
      }
    } catch {
      setErrorMsg('Erreur réseau. Vérifiez votre connexion et réessayez.');
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'compact') {
    return (
      <div className="flex flex-col gap-1">
        <button
          onClick={handleClick}
          disabled={loading}
          className={`inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 disabled:opacity-50 transition-colors ${className}`}
        >
          {loading
            ? <Loader2 size={12} className="animate-spin" />
            : <CreditCard size={12} />
          }
          {label ?? 'Gérer l\'abonnement'}
          <ExternalLink size={10} />
        </button>
        {errorMsg && (
          <p className="text-[11px] text-red-600">{errorMsg}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        onClick={handleClick}
        disabled={loading}
        className={`w-full gap-2 ${className}`}
      >
        {loading
          ? <><Loader2 size={14} className="animate-spin" />Ouverture du portail…</>
          : <><CreditCard size={14} />{label ?? 'Gérer mon abonnement et mes factures'}<ExternalLink size={11} /></>
        }
      </Button>
      {errorMsg && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
