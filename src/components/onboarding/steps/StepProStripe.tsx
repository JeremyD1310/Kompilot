/**
 * StepProStripe — Onboarding step: Bouclier No-Show + Stripe KYC
 * Nouvelle étape Pro : configure la protection des RDV et le KYC Stripe.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CreditCard, CheckCircle2, ArrowRight, Zap } from 'lucide-react';

interface Props { onComplete: () => void }

const PROTECTION_LEVELS = [
  { pct: 10, label: 'Prudent', desc: 'Idéal pour commencer', color: 'bg-emerald-400' },
  { pct: 25, label: 'Recommandé', desc: 'Optimal selon votre secteur', color: 'bg-teal-500', recommended: true },
  { pct: 50, label: 'Maximal', desc: 'Tolérance zéro no-show', color: 'bg-violet-500' },
];

export function StepProStripe({ onComplete }: Props) {
  const [selectedPct, setSelectedPct] = useState(25);
  const [kycStarted, setKycStarted] = useState(false);
  const [kycDone, setKycDone] = useState(false);

  const handleKyc = () => {
    setKycStarted(true);
    setTimeout(() => {
      setKycDone(true);
      setTimeout(onComplete, 600);
    }, 1800);
  };

  return (
    <div className="space-y-4">
      {/* Header banner */}
      <div className="rounded-xl bg-gradient-to-r from-violet-50 to-teal-50 dark:from-violet-950/30 dark:to-teal-950/20 border border-violet-200 dark:border-violet-800 px-3.5 py-3 flex items-start gap-2.5">
        <Shield size={16} className="text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-violet-800 dark:text-violet-300 leading-relaxed">
          <strong>BOUCLIER NO-SHOW PRO :</strong> Chaque rendez-vous annulé = pénalité encaissée
          directement sur votre compte Stripe. Aucun effort de votre côté.
        </p>
      </div>

      {/* ROI teaser */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { value: '87€', label: 'Récupérés / mois en moyenne', icon: '💰' },
          { value: '2 min', label: 'Pour configurer', icon: '⚡' },
          { value: '100%', label: 'Automatique', icon: '🤖' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl bg-muted/40 border border-border p-3 text-center space-y-0.5"
          >
            <p className="text-lg">{stat.icon}</p>
            <p className="text-sm font-black text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Protection level selector */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          Taux de protection choisi
        </p>
        <div className="space-y-2">
          {PROTECTION_LEVELS.map((level) => (
            <button
              key={level.pct}
              onClick={() => setSelectedPct(level.pct)}
              className={`relative w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                selectedPct === level.pct
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-card hover:border-primary/40'
              }`}
            >
              {level.recommended && (
                <span className="absolute -top-2 left-3 text-[9px] font-black uppercase tracking-wider bg-teal-500 text-white rounded-full px-2 py-0.5">
                  Recommandé IA
                </span>
              )}
              <div className={`w-8 h-8 rounded-lg ${level.color} flex items-center justify-center shrink-0`}>
                <span className="text-white text-xs font-black">{level.pct}%</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground">{level.label}</p>
                <p className="text-[10px] text-muted-foreground">{level.desc}</p>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                selectedPct === level.pct ? 'border-primary bg-primary' : 'border-border'
              }`}>
                {selectedPct === level.pct && (
                  <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* KYC CTA */}
      <AnimatePresence mode="wait">
        {!kycDone ? (
          <motion.div key="kyc-cta" className="space-y-2">
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-3.5 py-3 space-y-1">
              <p className="text-[10px] font-bold text-foreground flex items-center gap-1.5">
                <CreditCard size={12} className="text-primary" />
                Liaison bancaire sécurisée via Stripe Connect
              </p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Vérification d'identité en 2 min. Kompilot ne stocke aucune donnée bancaire.
              </p>
            </div>
            <button
              onClick={handleKyc}
              disabled={kycStarted}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-teal-600 text-white text-sm font-bold py-2.5 shadow-md disabled:opacity-70 transition-all active:scale-[0.98]"
            >
              {kycStarted ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Connexion Stripe en cours…
                </>
              ) : (
                <>
                  <Zap size={14} />
                  Activer le Bouclier No-Show ({selectedPct}%)
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="kyc-done"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 px-3.5 py-3 flex items-center gap-3"
          >
            <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                Bouclier activé à {selectedPct}% !
              </p>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                Vos prochains RDV sont protégés automatiquement.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
