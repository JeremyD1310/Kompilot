/**
 * DemoExhaustedModal — shown when demo AI credits reach zero.
 *
 * "Effet de manque" design: acknowledges what was accomplished,
 * offers two upgrade paths (Solo vs Franchise) and pre-selects the plan in Stripe.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Building2, Store } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useDemoMode } from '../../context/DemoModeContext';

interface DemoExhaustedModalProps {
  open: boolean;
  onClose: () => void;
}

export function DemoExhaustedModal({ open, onClose }: DemoExhaustedModalProps) {
  const navigate = useNavigate();
  const { deactivateDemo } = useDemoMode();
  const [selected, setSelected] = useState<'solo' | 'franchise' | null>(null);

  const handleUpgrade = (plan: 'pro' | 'expert') => {
    // Deactivate demo so regular plan takes effect after payment
    deactivateDemo();
    onClose();
    navigate({ to: '/subscription', search: { plan } as any });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[600] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="fixed inset-0 z-[601] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Gradient header */}
              <div className="relative bg-gradient-to-br from-primary via-teal-500 to-emerald-400 px-6 pt-8 pb-12">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/20 hover:bg-white/35 flex items-center justify-center transition-colors"
                >
                  <X size={14} className="text-white" />
                </button>

                <div className="text-center space-y-2">
                  <div className="text-4xl">🎉</div>
                  <h2 className="text-xl font-extrabold text-white leading-tight">
                    Fin de votre période d'essai Kompilot !
                  </h2>
                  <p className="text-sm text-white/85 leading-relaxed max-w-xs mx-auto">
                    En quelques clics, vous avez pu tester la puissance de notre
                    écosystème — <strong>Scan GEO, calendriers en masse, WhatsApp IA</strong>...
                  </p>
                </div>
              </div>

              {/* Body — pulled up to overlap header */}
              <div className="relative -mt-6 px-5 pb-6 space-y-4">
                <div className="rounded-2xl border border-border bg-card shadow-lg p-4">
                  <p className="text-sm text-center text-muted-foreground leading-relaxed">
                    Pour continuer à dominer vos concurrents sur ChatGPT et Google
                    sans interruption, activez votre abonnement en <strong>1 minute</strong>.
                  </p>
                </div>

                {/* Plan options */}
                <div className="space-y-3">
                  {/* Solo option */}
                  <button
                    onClick={() => setSelected('solo')}
                    className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
                      selected === 'solo'
                        ? 'border-primary bg-primary/8 shadow-md'
                        : 'border-border hover:border-primary/40 hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        selected === 'solo' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                        <Store size={17} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-extrabold text-foreground leading-tight">
                          👉 Rester en Solo (Starter / Business)
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                          Pour mon commerce indépendant — Cockpit IA, Calendrier, WhatsApp
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs font-bold text-primary">À partir de 29€/mois</span>
                          <span className="text-[10px] text-muted-foreground">sans engagement</span>
                        </div>
                      </div>
                      {selected === 'solo' && (
                        <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Franchise option */}
                  <button
                    onClick={() => setSelected('franchise')}
                    className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
                      selected === 'franchise'
                        ? 'border-violet-500 bg-violet-50/80 dark:bg-violet-950/20 shadow-md'
                        : 'border-border hover:border-violet-400/40 hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        selected === 'franchise' ? 'bg-violet-600 text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                        <Building2 size={17} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-extrabold text-foreground leading-tight">
                          🏢 Passer en offre Franchise / Réseau
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                          Multi-établissements, gestion d'équipe RGPD, tableau de bord réseau
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs font-bold text-violet-600">À partir de 79€/mois</span>
                          <span className="text-[10px] text-muted-foreground bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/40 rounded-full px-1.5 py-0.5 font-semibold text-violet-600">Recommandé réseau</span>
                        </div>
                      </div>
                      {selected === 'franchise' && (
                        <div className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center shrink-0 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                  </button>
                </div>

                {/* CTA */}
                <button
                  onClick={() => {
                    if (selected === 'franchise') handleUpgrade('expert');
                    else if (selected === 'solo') handleUpgrade('pro');
                  }}
                  disabled={!selected}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl text-white text-sm font-bold py-3.5 transition-all active:scale-[0.98] shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${
                    selected === 'franchise'
                      ? 'bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600'
                      : 'bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-600'
                  }`}
                >
                  Activer mon abonnement en 1 minute
                  <ArrowRight size={15} />
                </button>

                <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                  Paiement sécurisé · Sans engagement · Annulable à tout moment
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
