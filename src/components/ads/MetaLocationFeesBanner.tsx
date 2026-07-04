/**
 * MetaLocationFeesBanner — Informative banner about Meta's Location Fees
 * (effective July 1, 2026).
 *
 * Non-intrusive, dismissible, dark-mode premium style.
 * Shown at the top of the Dashboard or Meta Ads tab.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X, ExternalLink } from 'lucide-react';

const DISMISS_KEY = 'kompilot_meta_location_fees_dismissed';

export function MetaLocationFeesBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch {}
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-3"
      >
        <div className="relative overflow-hidden rounded-2xl border border-blue-500/15 bg-gradient-to-r from-blue-500/[0.04] via-indigo-500/[0.03] to-violet-500/[0.04]">
          <div className="flex items-start gap-3 px-5 py-3.5">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mt-0.5">
              <Info size={15} className="text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground leading-tight">
                Frais régionaux Meta — Location Fees
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Depuis le 1er juillet 2026, Meta facture des frais réglementaires supplémentaires dans certains pays
                (FR 3%, AT 5%, ES 3%, IT 3%, GB 2%, TR 5%).{' '}
                <strong className="text-foreground">Kompilot intègre désormais ces frais dans votre ROAS réel</strong>{' '}
                pour garantir la précision de vos données.
              </p>
            </div>
            <button
              onClick={dismiss}
              className="shrink-0 p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
              aria-label="Fermer"
            >
              <X size={14} className="text-muted-foreground" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
