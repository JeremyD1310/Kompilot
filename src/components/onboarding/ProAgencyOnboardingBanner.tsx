/**
 * ProAgencyOnboardingBanner — Bannière de sélection Pro/Agence
 * affichée dans l'OnboardingPage après la configuration de base.
 * Permet à l'utilisateur de choisir son parcours d'activation avancé.
 *
 * v2 : Plus visuel, ROI chiffré, indicateurs de valeur par parcours.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Building2, Sparkles, ArrowRight, X,
  MapPin, Calendar, MessageSquare, TrendingUp, Users, Palette, CheckCircle2
} from 'lucide-react';
import { ClickByClickGuide } from './ClickByClickGuide';
import { AgencyOnboardingFlow } from './AgencyOnboardingFlow';
import { ProOnboardingFlow } from './ProOnboardingFlow';

interface Props {
  userName?: string;
  onDismiss?: () => void;
  sector?: string;
}

type Mode = 'select' | 'pro' | 'agency' | 'guide' | 'dismissed';

const PRO_FEATURES = [
  { icon: MapPin, label: 'Radar GEO IA', sub: 'ChatGPT & Gemini' },
  { icon: Shield, label: 'Bouclier No-Show', sub: 'Stripe automatique' },
  { icon: Calendar, label: 'Calendrier IA', sub: '4 semaines planifiées' },
  { icon: MessageSquare, label: 'SMS intelligent', sub: '95% de lecture' },
];

const AGENCY_FEATURES = [
  { icon: TrendingUp, label: 'Simulateur ROI', sub: 'Marge visible en live' },
  { icon: Palette, label: 'Marque blanche', sub: 'Votre domaine' },
  { icon: Users, label: 'Multi-clients', sub: 'Tableau unifié' },
  { icon: Building2, label: 'Rapports PDF', sub: 'Envoi auto mensuel' },
];

export function ProAgencyOnboardingBanner({ userName, onDismiss, sector }: Props) {
  const [mode, setMode] = useState<Mode>('select');
  const [guideOpen, setGuideOpen] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<'pro' | 'agency' | null>(null);

  if (mode === 'dismissed') return null;

  if (mode === 'pro') {
    return (
      <ProOnboardingFlow
        sector={sector}
        onComplete={() => { setMode('dismissed'); onDismiss?.(); }}
        onSkip={() => {
          // Fall back to click-by-click guide on skip
          setGuideOpen(true);
          setMode('guide');
        }}
      />
    );
  }

  if (mode === 'guide' || guideOpen) {
    return (
      <ClickByClickGuide
        open={true}
        onClose={() => { setGuideOpen(false); setMode('dismissed'); onDismiss?.(); }}
        profileMode="pro"
        sector={sector}
      />
    );
  }

  if (mode === 'agency') {
    return (
      <AgencyOnboardingFlow
        onComplete={() => { setMode('dismissed'); onDismiss?.(); }}
        onSkip={() => { setMode('dismissed'); onDismiss?.(); }}
      />
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full rounded-3xl border border-amber-200 dark:border-amber-800/50 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/20 dark:via-orange-950/10 dark:to-amber-950/20 overflow-hidden shadow-lg"
      >
        {/* Animated glow line */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

        {/* Dismiss button */}
        <button
          onClick={() => { setMode('dismissed'); onDismiss?.(); }}
          className="absolute top-3 right-3 w-7 h-7 rounded-full hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center transition-colors z-10"
        >
          <X size={13} className="text-muted-foreground" />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
              <Sparkles size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-black text-foreground leading-tight">
                {userName ? `${userName}, activez` : 'Activez'} votre moteur de croissance
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choisissez votre parcours d'activation — 3 minutes chrono.
              </p>
            </div>
          </div>

          {/* Mode cards */}
          <div className="grid grid-cols-2 gap-3">

            {/* Pro card */}
            <button
              onClick={() => setMode('pro')}
              onMouseEnter={() => setHoveredCard('pro')}
              onMouseLeave={() => setHoveredCard(null)}
              className="group relative flex flex-col items-start gap-3 rounded-2xl border-2 border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900/60 hover:border-teal-400 dark:hover:border-teal-600 p-4 text-left transition-all hover:shadow-md hover:shadow-teal-500/10 overflow-hidden"
            >
              {/* Background glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative z-10 w-full">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                    <Shield size={15} className="text-teal-600 dark:text-teal-400" />
                  </div>
                  <span className="text-[9px] font-black bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 rounded-full px-2 py-0.5 uppercase">
                    Commerçant
                  </span>
                </div>

                <p className="text-xs font-black text-foreground mb-2">Je suis commerçant / pro</p>

                <AnimatePresence mode="wait">
                  {hoveredCard === 'pro' ? (
                    <motion.div
                      key="features"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="grid grid-cols-2 gap-1.5"
                    >
                      {PRO_FEATURES.map((f, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <f.icon size={10} className="text-teal-500 shrink-0" />
                          <span className="text-[9px] text-muted-foreground leading-tight">{f.label}</span>
                        </div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="default"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <p className="text-[10px] text-muted-foreground leading-snug">
                        Scan GEO, Bouclier Stripe, Calendrier IA, SMS
                      </p>
                      <div className="mt-2 flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-full px-2 py-0.5 w-fit">
                        <CheckCircle2 size={9} />
                        +87€/mois récupérés en moyenne
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative z-10 flex items-center gap-1 text-[10px] font-bold text-teal-600 dark:text-teal-400 mt-auto">
                Activer le guide Pro <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Agency card */}
            <button
              onClick={() => setMode('agency')}
              onMouseEnter={() => setHoveredCard('agency')}
              onMouseLeave={() => setHoveredCard(null)}
              className="group relative flex flex-col items-start gap-3 rounded-2xl border-2 border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-900/60 hover:border-violet-400 dark:hover:border-violet-600 p-4 text-left transition-all hover:shadow-md hover:shadow-violet-500/10 overflow-hidden"
            >
              {/* Background glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative z-10 w-full">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <Building2 size={15} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <span className="text-[9px] font-black bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 rounded-full px-2 py-0.5 uppercase">
                    Agence
                  </span>
                </div>

                <p className="text-xs font-black text-foreground mb-2">Je suis une agence</p>

                <AnimatePresence mode="wait">
                  {hoveredCard === 'agency' ? (
                    <motion.div
                      key="features"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="grid grid-cols-2 gap-1.5"
                    >
                      {AGENCY_FEATURES.map((f, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <f.icon size={10} className="text-violet-500 shrink-0" />
                          <span className="text-[9px] text-muted-foreground leading-tight">{f.label}</span>
                        </div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="default"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <p className="text-[10px] text-muted-foreground leading-snug">
                        ROI simulateur, Marque blanche, Multi-clients
                      </p>
                      <div className="mt-2 flex items-center gap-1 text-[9px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 rounded-full px-2 py-0.5 w-fit">
                        <CheckCircle2 size={9} />
                        68% de marge nette possible
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative z-10 flex items-center gap-1 text-[10px] font-bold text-violet-600 dark:text-violet-400 mt-auto">
                Activer le guide Agence <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>

          {/* Skip */}
          <button
            onClick={() => { setMode('dismissed'); onDismiss?.(); }}
            className="w-full text-center text-[10px] text-muted-foreground hover:text-foreground transition-colors mt-4"
          >
            Je configurerai plus tard depuis le tableau de bord
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
