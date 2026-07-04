/**
 * AnniversaryUpsellBanner — Contextual upsell shown after 90 days on monthly plan.
 *
 * "Passez en annuel, économisez X € — 2 mois offerts"
 * Gentle, dismissible banner at the top of the dashboard.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, ArrowRight, Sparkles } from 'lucide-react';
import { useAnniversaryUpsell } from '../../hooks/useAnniversaryUpsell';
import { useAnnualPlanSwitch } from '../../hooks/useAnnualPlanSwitch';
import { useSubscription } from '../../context/SubscriptionContext';
import { toast } from '@blinkdotnew/ui';

export function AnniversaryUpsellBanner() {
  const { showUpsell, dismiss, daysActive, planSavings } = useAnniversaryUpsell();
  const { currentPlan } = useSubscription();
  const { switchToAnnual, switching } = useAnnualPlanSwitch(currentPlan.id);

  if (!showUpsell) return null;

  const savings = planSavings[currentPlan.id as keyof typeof planSavings] ?? planSavings.starter;
  const planLabel = currentPlan.id === 'agency' ? 'Agency' : 'Pro';

  const handleSwitch = async () => {
    const result = await switchToAnnual(currentPlan.id);
    if (result.success) {
      toast.success('Passage en annuel réussi !', {
        description: `Vous économisez ${savings}€ — facturation annuelle activée.`,
      });
      dismiss();
    } else if (result.error) {
      toast.error(result.error);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-3"
      >
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5">
          {/* Subtle shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/[0.03] to-transparent animate-pulse" />

          <div className="relative flex items-center gap-4 px-5 py-3.5">
            {/* Icon */}
            <div className="shrink-0 w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Gift size={18} className="text-emerald-500" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground leading-tight">
                🎁 {daysActive} jours ensemble — passez en annuel et économisez {savings}€
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                2 mois offerts sur le plan {planLabel} Annuel — sans engagement supplémentaire.
              </p>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleSwitch}
                disabled={switching}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
              >
                {switching ? (
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    Économiser {savings}€ <ArrowRight size={12} />
                  </>
                )}
              </button>

              <button
                onClick={dismiss}
                className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                aria-label="Fermer"
              >
                <X size={14} className="text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
