import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button } from '@blinkdotnew/ui';
import { Zap, ArrowRight, Sparkles } from 'lucide-react';
import { useSubscription, PLANS } from '../../context/SubscriptionContext';
import { SubscriptionCheckoutPanel } from './SubscriptionCheckoutPanel';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  targetPlan?: 'starter' | 'agency';
  /** Special mode: shows Stories-specific messaging */
  storiesPaywall?: boolean;
}

export function UpgradeModal({
  open,
  onClose,
  title,
  description,
  targetPlan = 'starter',
  storiesPaywall = false,
}: UpgradeModalProps) {
  const { setPlan } = useSubscription();
  const [paymentOpen, setPaymentOpen] = useState(false);

  const plan = PLANS.find(p => p.id === targetPlan)!;
  const planLabel = targetPlan === 'starter' ? 'Pro — 69€/mois HT' : 'Agency — 149€/mois HT';

  // Stories paywall overrides defaults
  const modalTitle = storiesPaywall ? '🔒 Fonctionnalité Premium' : (title ?? 'Limite atteinte');
  const modalDesc  = storiesPaywall
    ? "Boostez votre engagement avec les Stories Instagram & Facebook en passant à l'offre Agency à 149€/mois HT !"
    : (description ?? undefined);

  const handleCheckoutOpened = () => {
    setPlan(targetPlan); // optimistic update
    setPaymentOpen(false);
    onClose();
  };

  return (
    <>
      {/* Paywall dialog — hides when payment modal takes over */}
      <Dialog open={open && !paymentOpen} onOpenChange={v => { if (!v) onClose(); }}>
        <DialogContent className="max-w-md w-full text-center">
          {/* Icon */}
          <div className="flex justify-center mb-2 -mt-2">
            {storiesPaywall ? (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                <Sparkles size={32} className="text-violet-500" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
                <Zap size={32} className="text-amber-500" />
              </div>
            )}
          </div>

          <DialogHeader className="text-center space-y-2">
            <DialogTitle className="text-xl font-bold text-center">{modalTitle}</DialogTitle>
            <p className="text-sm text-muted-foreground leading-relaxed text-center">{modalDesc}</p>
          </DialogHeader>

          {/* Feature highlight */}
          <div className={`my-4 rounded-xl border px-4 py-3 text-left space-y-2 ${
            storiesPaywall || targetPlan === 'expert'
              ? 'bg-violet-50 border-violet-200'
              : 'bg-primary/5 border-primary/20'
          }`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${
              storiesPaywall || targetPlan === 'agency' ? 'text-violet-600' : 'text-primary'
            }`}>
              Offre {targetPlan === 'starter' ? 'Pro — 69€/mois HT' : 'Agency — 149€/mois HT'}
            </p>

            {storiesPaywall ? (
              <ul className="space-y-1.5 text-sm text-foreground">
                <li className="flex items-center gap-2"><span className="text-violet-500 font-bold">✦</span> <strong>Stories Instagram & Facebook</strong> incluses</li>
                <li className="flex items-center gap-2"><span className="text-violet-500 font-bold">✦</span> Prévisualisation Story en 9:16</li>
                <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> 30 contenus (posts + stories) / mois</li>
                <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Réseaux illimités</li>
                <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Rapports PDF & multi-utilisateurs</li>
              </ul>
            ) : targetPlan === 'starter' ? (
              <ul className="space-y-1 text-sm text-foreground">
                <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Pilotage de présence locale</li>
                <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Calendrier éditorial</li>
                <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Boîte de réception unifiée</li>
                <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Génération de contenu par IA</li>
              </ul>
            ) : (
              <ul className="space-y-1 text-sm text-foreground">
                <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> 30 contenus (posts + stories) / mois</li>
                <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Stories Instagram & Facebook</li>
                <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Réseaux illimités</li>
                <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Rapports PDF & multi-utilisateurs</li>
              </ul>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={() => setPaymentOpen(true)}
              className={`w-full gap-2 text-base py-5 ${
                storiesPaywall || targetPlan === 'agency'
                  ? 'bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 border-0'
                  : ''
              }`}
            >
              <Zap size={16} />
              Passer à l'offre {planLabel}
              <ArrowRight size={16} />
            </Button>
            <Button variant="ghost" onClick={onClose} className="w-full text-muted-foreground">
              Pas maintenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkout panel with CGV clickwrap — opens over the paywall */}
      {paymentOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-background rounded-2xl shadow-2xl p-6 space-y-4">
            <SubscriptionCheckoutPanel
              planId={targetPlan}
              planName={`Offre ${plan.name}`}
              onCancel={() => setPaymentOpen(false)}
              onCheckoutOpened={handleCheckoutOpened}
            />
          </div>
        </div>
      )}
    </>
  );
}
