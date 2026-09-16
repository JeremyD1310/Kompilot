/**
 * DemoCtaBanner — sticky footer banner shown on the landing page
 * when the visitor is in Demo / anonymous sandbox mode.
 *
 * "Vous testez actuellement Kompilot avec des données de démonstration."
 * + CTA: "Activer mon vrai commerce (Essai 14j gratuit)"
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, X, ArrowRight } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useDemoMode } from '../../context/DemoModeContext';

const DISMISS_KEY = 'nc_demo_cta_banner_dismissed';

export function DemoCtaBanner() {
  const navigate = useNavigate();
  const { isDemoActive } = useDemoMode();
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });

  if (!isDemoActive || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* noop */ }
  };

  const handleCta = () => {
    navigate({ to: '/signup' });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26, delay: 0.4 }}
        className="fixed bottom-0 left-0 right-0 z-[400] flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-indigo-700 via-violet-700 to-purple-700 text-white shadow-2xl shadow-black/30"
        role="banner"
      >
        {/* Animated shimmer */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute inset-y-0 w-1/3 bg-white/5 skew-x-[-20deg] animate-[shimmer_3s_ease-in-out_infinite]"
            style={{ left: '-30%' }}
          />
        </div>

        <div className="flex items-center gap-2.5 flex-1 min-w-0 relative">
          <span className="text-base shrink-0">🎮</span>
          <p className="text-xs font-semibold leading-tight truncate">
            <span className="hidden sm:inline">Vous testez actuellement Kompilot avec des données de démonstration. </span>
            <span className="sm:hidden">Mode Démo actif · </span>
            <span className="opacity-80">Aucune donnée réelle n'est utilisée.</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 relative">
          <button
            onClick={handleCta}
            className="flex items-center gap-1.5 rounded-xl bg-white text-indigo-700 font-extrabold text-xs px-4 py-2 hover:bg-indigo-50 active:scale-[0.97] transition-all shadow-md whitespace-nowrap"
          >
            <Rocket size={13} className="shrink-0" />
            <span className="hidden sm:inline">Activer mon vrai commerce</span>
            <span className="sm:hidden">Commencer</span>
            <span className="hidden sm:inline text-indigo-400 font-normal">(Essai 14j gratuit)</span>
            <ArrowRight size={12} className="shrink-0" />
          </button>

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 transition-colors shrink-0"
            aria-label="Masquer"
          >
            <X size={12} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
