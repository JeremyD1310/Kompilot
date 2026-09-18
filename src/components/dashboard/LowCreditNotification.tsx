import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, X, TrendingUp } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useDemoMode } from '../../context/DemoModeContext';

// ── Session-scoped dismiss flag ────────────────────────────────────────────────

const DISMISS_KEY = 'kompilot_lowcredit_dismissed';

function readDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeDismissed(): void {
  try {
    sessionStorage.setItem(DISMISS_KEY, 'true');
  } catch {
    /* noop */
  }
}

// ── Variant definitions ────────────────────────────────────────────────────────

type Variant = 'A' | 'B';

interface VariantContent {
  headerText: (n: number) => string;
  bodyText: string;
  ctaLabel: string;
}

const VARIANT_A: VariantContent = {
  headerText: (n: number) =>
    `🚀 Belle session ! Il vous reste ${n} crédits IA.`,
  bodyText:
    'Vous avez généré du contenu et analysé vos métriques en quelques minutes. Pour continuer à utiliser le Copilote IA sans interruption, passez au plan Starter (69 €/mois) ou Agence (149 €/mois).',
  ctaLabel: "Débloquer l'IA illimitée",
};

const VARIANT_B: VariantContent = {
  headerText: (n: number) =>
    `⚡ Plus que ${n} crédits — et après, c'est à vous de jouer`,
  bodyText:
    'Le Copilote IA a fait ses preuves pendant votre démo. Pour garder cette productivité chaque semaine — posts automatiques, réponses aux avis, audits GEO — passez au plan complet. Offre de lancement : 1 mois offert sur l’annuel.',
  ctaLabel: 'Voir les formules',
};

// ── Component ──────────────────────────────────────────────────────────────────

export function LowCreditNotification() {
  const { isDemoActive, demoCreditsRemaining } = useDemoMode();
  const navigate = useNavigate();

  const [dismissed, setDismissed] = useState<boolean>(readDismissed);
  const [variant] = useState<Variant>(() =>
    Math.random() < 0.5 ? 'A' : 'B',
  );

  // ── Guard: only show when demo is active, credits are low, and not dismissed
  const shouldShow =
    isDemoActive &&
    demoCreditsRemaining > 0 &&
    demoCreditsRemaining <= 10 &&
    !dismissed;

  const handleDismiss = () => {
    setDismissed(true);
    writeDismissed();
  };

  const handleCTA = () => {
    setDismissed(true);
    writeDismissed();
    navigate({ to: '/pricing' as any });
  };

  if (!shouldShow) return null;

  const content = variant === 'A' ? VARIANT_A : VARIANT_B;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1] as const,
      }}
      className="fixed bottom-4 right-4 z-50 max-w-sm"
    >
      <div className="bg-white border border-amber-200 shadow-xl rounded-xl overflow-hidden">

        {/* ── Header (amber background) ── */}
        <div className="bg-amber-50 px-4 py-3 flex items-start gap-2.5">
          <Zap
            size={16}
            className="shrink-0 mt-0.5 text-amber-500 animate-pulse"
          />
          <p className="text-sm font-semibold text-amber-900 flex-1 leading-snug">
            {content.headerText(demoCreditsRemaining)}
          </p>
          <button
            onClick={handleDismiss}
            className="shrink-0 p-0.5 rounded-md text-amber-500 hover:text-amber-700 hover:bg-amber-100 transition-colors"
            aria-label="Fermer la notification"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="px-4 py-3 space-y-3">
          <div className="flex items-start gap-2">
            <TrendingUp
              size={16}
              className="shrink-0 mt-0.5 text-teal-600"
            />
            <p className="text-sm text-slate-600 leading-relaxed">
              {content.bodyText}
            </p>
          </div>

          {/* ── CTA ── */}
          <button
            onClick={handleCTA}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 transition-colors shadow-sm"
          >
            <Zap size={15} />
            {content.ctaLabel}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
