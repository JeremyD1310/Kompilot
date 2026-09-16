/**
 * CreditsTopUpModal — Stripe credit top-up modal.
 * Three packs: Micro (50⚡ / 5€), Standard (150⚡ / 10€), Booster (400⚡ / 20€).
 * Opens Stripe Checkout in a new tab (iframes blocked).
 * On close/return the parent should poll for a credit update.
 */
import { useState } from 'react';
import { toast } from '@blinkdotnew/ui';
import { Zap, X, Star, CheckCircle2, ExternalLink, RefreshCw, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCredits } from '../../context/CreditsContext';
import { createOneTimeCheckout } from '../../lib/billingClient';
import { LegalConsentBlock, isLegalConsentValid, type LegalConsentState, CGV_VERSION } from './LegalConsentBlock';

// ── Pack definitions ──────────────────────────────────────────────────────────

interface CreditPack {
  id: string;
  name: string;
  credits: number;
  priceEur: number;
  pricePerCredit: string;
  badge?: string;
  highlight: boolean;
  stripePriceId?: string; // would be real in production
}

const PACKS: CreditPack[] = [
  { id: 'kompilot_ai_250_once', name: 'Pack 250', credits: 250, priceEur: 19, pricePerCredit: '0,08€', highlight: false },
  { id: 'kompilot_ai_750_once', name: 'Pack 750', credits: 750, priceEur: 49, pricePerCredit: '0,07€', highlight: true, badge: '⭐ Populaire' },
  { id: 'kompilot_ai_2000_once', name: 'Pack 2000', credits: 2000, priceEur: 99, pricePerCredit: '0,05€', highlight: false, badge: '💰 Meilleure valeur' },
];

// ── Pack card ─────────────────────────────────────────────────────────────────

function PackCard({
  pack,
  selected,
  onSelect,
}: {
  pack: CreditPack;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'relative w-full rounded-2xl border-2 p-4 text-left transition-all focus:outline-none',
        pack.highlight
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card hover:border-primary/40',
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
    >
      {pack.badge && (
        <span className={cn(
          'absolute -top-3 left-4 text-[10px] font-extrabold rounded-full px-3 py-1 border',
          pack.highlight
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50'
        )}>
          {pack.badge}
        </span>
      )}

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-foreground">{pack.name}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Zap size={13} className="text-amber-500 fill-amber-400" />
            <span className="text-xl font-extrabold text-foreground tabular-nums">{pack.credits}</span>
            <span className="text-xs text-muted-foreground">crédits</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">{pack.pricePerCredit} / crédit</p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-2xl font-extrabold text-foreground tabular-nums">{pack.priceEur}€</p>
          <p className="text-[10px] text-muted-foreground">paiement unique</p>
        </div>
      </div>

      {selected && (
        <div className="absolute top-3 right-3">
          <CheckCircle2 size={16} className="text-primary" />
        </div>
      )}
    </button>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

interface CreditsTopUpModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreditsTopUpModal({ open, onClose }: CreditsTopUpModalProps) {
  const { usage, limit } = useCredits();
  const [selectedPack, setSelectedPack] = useState<string>('kompilot_ai_750_once');
  const [loading, setLoading] = useState(false);
  const [checkoutOpened, setCheckoutOpened] = useState(false);
  const [consent, setConsent] = useState<LegalConsentState>({ cgvAccepted: false, retractionWaived: false });

  if (!open) return null;

  const remaining = Math.max(0, limit - usage);
  const pack = PACKS.find(p => p.id === selectedPack)!;

  const handleCheckout = async () => {
    if (!isLegalConsentValid(consent)) return;
    setLoading(true);

    const result = await createOneTimeCheckout(pack.id as 'kompilot_ai_250_once' | 'kompilot_ai_750_once' | 'kompilot_ai_2000_once', {
      ...consent, cgvVersion: CGV_VERSION, acceptedAt: new Date().toISOString(), userAgent: navigator.userAgent,
    });
    if (!result.url) throw new Error(result.error || 'Paiement indisponible');
    const paymentWindow = window.open(result.url, '_blank', 'noopener,noreferrer');
    if (!paymentWindow) throw new Error('Autorisez les fenêtres pop-up puis réessayez.');
    setCheckoutOpened(true);
    setLoading(false);

    toast.success('Fenêtre Stripe ouverte dans un nouvel onglet', {
      description: 'Les crédits seront ajoutés après confirmation du paiement.',
    });
  };

  const handleSimulateSuccess = () => {
    // Simulated success removed: only the backend webhook can grant credits.
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-background border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                <Zap size={16} className="text-amber-500 fill-amber-400" />
              </div>
              <h2 className="text-lg font-extrabold text-foreground">Recharger mes crédits ⚡</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Solde actuel : <span className={cn('font-bold', remaining === 0 ? 'text-red-500' : 'text-foreground')}>{remaining} ⚡</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        {/* Zero-credits alert */}
        {remaining === 0 && (
          <div className="mx-6 mb-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 px-4 py-3 flex items-start gap-2">
            <Zap size={13} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-400">
              <strong>Crédits épuisés.</strong> Les fonctionnalités IA sont temporairement bloquées. Rechargez pour les débloquer immédiatement.
            </p>
          </div>
        )}

        {/* Pack selection */}
        <div className="px-6 space-y-3">
          {PACKS.map(p => (
            <PackCard
              key={p.id}
              pack={p}
              selected={selectedPack === p.id}
              onSelect={() => setSelectedPack(p.id)}
            />
          ))}
        </div>

        <div className="px-6 pt-4">
          <LegalConsentBlock state={consent} onChange={setConsent} disabled={loading} />
        </div>

        {/* Checkout button */}
        <div className="p-6 pt-4 space-y-3">
          {!checkoutOpened ? (
            <button
              onClick={handleCheckout}
              disabled={loading || !isLegalConsentValid(consent)}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold text-sm rounded-xl py-3 hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? (
                <><RefreshCw size={14} className="animate-spin" /> Ouverture Stripe…</>
              ) : (
                <><ExternalLink size={14} /> Payer {pack.priceEur}€ via Stripe</>
              )}
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-center text-muted-foreground">
                Le solde sera actualisé automatiquement après confirmation du paiement par Stripe.
              </p>
              <button
                onClick={handleCheckout}
                className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground py-2 transition-colors"
              >
                <ArrowRight size={11} /> Rouvrir la page Stripe
              </button>
            </div>
          )}

          <p className="text-[10px] text-center text-muted-foreground">
            Paiement sécurisé via Stripe · Crédits valables 12 mois · Sans abonnement
          </p>
        </div>

        {/* Usage perks reminder */}
        <div className="border-t border-border px-6 py-4 bg-muted/20">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Avec {pack.credits} crédits vous pouvez :</p>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] text-muted-foreground">
            {[
              `${pack.credits} réponses IA Inbox`,
              `${Math.floor(pack.credits / 5)} scripts vidéo`,
              `${Math.floor(pack.credits / 10)} scans Radar GEO`,
              `${Math.floor(pack.credits / 30)} calendriers complets`,
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Star size={9} className="text-amber-400 fill-amber-300 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
