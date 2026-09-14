/**
 * FomoBanner — optional demo billing reminder banner.
 * Pushes demo users toward the annual offer without implying restricted access.
 *
 * Three variants rotate per session (picked at mount, stored in sessionStorage).
 * Auto-dismisses via sessionStorage. Only visible in active demo mode.
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useDemoMode } from '../../context/DemoModeContext';

// ── Constants ──────────────────────────────────────────────────────────────────

const DISMISS_KEY = 'kompilot_fomo_dismissed';
const VARIANT_KEY = 'kompilot_fomo_variant';

// ── Variant definitions ────────────────────────────────────────────────────────

type FomoVariant = 'A' | 'B' | 'C';

interface VariantData {
  title: string;
  subtitle: (daysLeft: number) => string;
  cta: string;
}

const VARIANTS: Record<FomoVariant, VariantData> = {
  A: {
    title: 'Un mois offert sur la formule annuelle',
    subtitle: () => 'Passez à l’annuel Starter (69 €/mois) ou Agency (149 €/mois) et simplifiez votre gestion.',
    cta: 'Découvrir les offres',
  },
  B: {
    title: 'Pilotez votre visibilité depuis un seul cockpit',
    subtitle: () => 'Posts, avis Google et présence locale réunis dans Kompilot.',
    cta: 'Voir les offres',
  },
  C: {
    title: 'Kompilot est ouvert à tous les professionnels',
    subtitle: () => 'Créez votre espace et commencez votre essai gratuit dès maintenant.',
    cta: 'Commencer maintenant',
  },
};

/** Pick a variant deterministically for this session. */
function pickVariant(): FomoVariant {
  try {
    const stored = sessionStorage.getItem(VARIANT_KEY);
    if (stored === 'A' || stored === 'B' || stored === 'C') return stored;
  } catch { /* noop */ }
  const keys: FomoVariant[] = ['A', 'B', 'C'];
  const chosen = keys[Math.floor(Math.random() * keys.length)];
  try { sessionStorage.setItem(VARIANT_KEY, chosen); } catch { /* noop */ }
  return chosen;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function FomoBanner() {
  const navigate = useNavigate();
  const { isDemoActive } = useDemoMode();

  const [dismissed, setDismissed] = useState<boolean>(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });

  const variant = useMemo(() => pickVariant(), []);
  // Guard: only show the optional reminder inside an active demo session.
  if (!isDemoActive || dismissed) return null;

  const data = VARIANTS[variant];

  const handleDismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* noop */ }
  };

  const handleCta = () => {
    navigate({ to: '/pricing' });
  };

  return (
    <AnimatePresence>
      <motion.div
        key="fomo-banner"
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="overflow-hidden shrink-0"
      >
        <div className="max-h-12 overflow-hidden bg-gradient-to-r from-amber-500 to-orange-500 text-white">
          <div className="flex h-12 flex-col items-start justify-center gap-1 overflow-hidden px-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 md:px-4">
            {/* Left: icon + text */}
            <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
              <Clock size={15} className="shrink-0 mt-0.5 sm:mt-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold leading-tight">
                  {data.title}
                </span>
                <span className="text-[11px] leading-tight opacity-90">
                  {data.subtitle(0)}
                </span>
              </div>
            </div>

            {/* Right: CTA + dismiss */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleCta}
                className="flex items-center gap-1.5 rounded-full text-xs font-bold px-3 py-1.5 bg-white/20 hover:bg-white/30 border border-white/30 transition-all active:scale-[0.97] shadow-sm whitespace-nowrap"
              >
                {data.cta}
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Masquer l'offre"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
