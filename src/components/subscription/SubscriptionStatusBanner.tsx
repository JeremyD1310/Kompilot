/**
 * SubscriptionStatusBanner — contextual billing status banner.
 *
 * Shows relevant info based on Stripe subscription status:
 *   - past_due  → red   "⚠️ Paiement échoué"
 *   - cancel*   → yellow "Abonnement se termine le [date]"
 *   - trialing  → teal  "Essai gratuit — J jours restants"
 *   - none      → subtle "Activez votre abonnement"
 *   - active    → nothing
 *
 * Dismissable via X — dismissed state stored in sessionStorage for 1h.
 */
import { useState, useEffect } from 'react';
import { X, AlertTriangle, Zap, Clock } from 'lucide-react';
import { useStripeWebhookStatus } from '../../hooks/useStripeWebhookStatus';
import { BillingPortalButton } from './BillingPortalButton';

const DISMISS_KEY = 'kompilot_sub_banner_dismissed';
const ONE_HOUR_MS = 60 * 60 * 1000;

function isDismissed(): boolean {
  try {
    const raw = sessionStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    return !isNaN(ts) && Date.now() - ts < ONE_HOUR_MS;
  } catch { return false; }
}

function dismiss(): void {
  try { sessionStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function trialDaysLeft(trialEnd: string | null): number {
  if (!trialEnd) return 0;
  const ms = new Date(trialEnd).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function SubscriptionStatusBanner() {
  const { data: sub } = useStripeWebhookStatus();
  const [dismissed, setDismissed] = useState(isDismissed);

  // Re-read dismiss state when status changes
  useEffect(() => { setDismissed(isDismissed()); }, [sub?.status]);

  if (!sub || dismissed) return null;

  const { status, cancelAtPeriodEnd, currentPeriodEnd, isTrial, trialEnd, isPastDue } = sub;

  // Active and not about to cancel → hide
  if (status === 'active' && !cancelAtPeriodEnd && !isTrial) return null;

  const handleDismiss = () => {
    dismiss();
    setDismissed(true);
  };

  const baseClass = 'shrink-0 flex items-center justify-between gap-3 px-4 py-2.5 text-sm border-b';

  // ── past_due ─────────────────────────────────────────────────────────────────
  if (isPastDue) {
    return (
      <div className={`${baseClass} bg-red-50 border-red-200 text-red-800`}>
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle size={14} className="shrink-0 text-red-600" />
          <p className="text-xs font-semibold truncate">
            ⚠️ Paiement échoué — Mettez à jour votre moyen de paiement
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <BillingPortalButton variant="compact" label="Mettre à jour" />
          <button onClick={handleDismiss} className="p-1 rounded hover:bg-red-100 transition-colors" aria-label="Fermer">
            <X size={13} className="text-red-600" />
          </button>
        </div>
      </div>
    );
  }

  // ── cancelAtPeriodEnd ─────────────────────────────────────────────────────────
  if (cancelAtPeriodEnd && currentPeriodEnd) {
    return (
      <div className={`${baseClass} bg-amber-50 border-amber-200 text-amber-800`}>
        <div className="flex items-center gap-2 min-w-0">
          <Clock size={14} className="shrink-0 text-amber-600" />
          <p className="text-xs font-semibold truncate">
            Votre abonnement se termine le {formatDate(currentPeriodEnd)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <BillingPortalButton variant="compact" label="Renouveler" />
          <button onClick={handleDismiss} className="p-1 rounded hover:bg-amber-100 transition-colors" aria-label="Fermer">
            <X size={13} className="text-amber-600" />
          </button>
        </div>
      </div>
    );
  }

  // ── trialing ──────────────────────────────────────────────────────────────────
  if (isTrial) {
    const days = trialDaysLeft(trialEnd);
    return (
      <div className={`${baseClass} bg-teal-50 border-teal-200 text-teal-800`}>
        <div className="flex items-center gap-2 min-w-0">
          <Zap size={14} className="shrink-0 text-teal-600" />
          <p className="text-xs font-semibold truncate">
            Essai gratuit — {days > 0 ? `${days} jour${days !== 1 ? 's' : ''} restant${days !== 1 ? 's' : ''}` : 'se termine aujourd\'hui'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/account?tab=billing"
            className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 transition-colors"
          >
            <Zap size={11} /> Passer Pro
          </a>
          <button onClick={handleDismiss} className="p-1 rounded hover:bg-teal-100 transition-colors" aria-label="Fermer">
            <X size={13} className="text-teal-600" />
          </button>
        </div>
      </div>
    );
  }

  // ── none ──────────────────────────────────────────────────────────────────────
  if (status === 'none') {
    return (
      <div className={`${baseClass} bg-muted/50 border-border text-muted-foreground`}>
        <div className="flex items-center gap-2 min-w-0">
          <Zap size={14} className="shrink-0 text-primary/60" />
          <p className="text-xs truncate">
            Activez votre abonnement pour débloquer toutes les fonctionnalités
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/account?tab=billing"
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
          >
            Voir les offres
          </a>
          <button onClick={handleDismiss} className="p-1 rounded hover:bg-muted transition-colors" aria-label="Fermer">
            <X size={13} />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
