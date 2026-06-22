/**
 * DailyRefundToast
 *
 * Renders an animated banner (once per day) when unused category credits
 * are automatically refunded at the start of a new day.
 *
 * Shown inside DashboardLayout — auto-dismissed after 8 seconds.
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ChevronDown, ChevronUp, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEcoMode } from '../../context/EcoModeContext';

const CAT_ICONS: Record<string, string> = {
  'Inbox & Messagerie':    '💬',
  'Génération de contenu': '✨',
  'Outils & Diagnostics':  '🔧',
  'SEO & GEO':             '🔍',
  'Automatisation':        '📅',
};

export function DailyRefundToast() {
  const { lastRefundResult, clearRefundResult } = useEcoMode();
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(false);

  // Show when a new refund arrives
  useEffect(() => {
    if (lastRefundResult?.applied) {
      setVisible(true);
      setExpanded(false);
    }
  }, [lastRefundResult]);

  // Auto-dismiss after 8 s (unless expanded)
  useEffect(() => {
    if (!visible || expanded) return;
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(clearRefundResult, 400); // wait for exit animation
    }, 8000);
    return () => clearTimeout(timer);
  }, [visible, expanded, clearRefundResult]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(clearRefundResult, 400);
  };

  if (!lastRefundResult?.applied || !lastRefundResult.entry) return null;

  const { totalRefunded, entry } = lastRefundResult;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="refund-toast"
          initial={{ opacity: 0, y: -12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-sm px-4 sm:px-0"
        >
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-white dark:bg-slate-900 shadow-xl shadow-emerald-500/10 overflow-hidden">
            {/* Header */}
            <div className="flex items-start gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40">
              {/* Icon */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500 shadow-sm">
                <Gift size={15} className="text-white" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300 leading-tight">
                  +{totalRefunded} ⚡ remboursés automatiquement
                </p>
                <p className="text-[11px] text-emerald-700/70 dark:text-emerald-400/70 mt-0.5">
                  Crédits non utilisés hier restitués au forfait mensuel
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setExpanded(e => !e)}
                  className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                  aria-label={expanded ? 'Réduire' : 'Voir le détail'}
                >
                  {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                <button
                  onClick={handleDismiss}
                  className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                  aria-label="Fermer"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Expanded breakdown */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 py-3 space-y-2 border-t border-emerald-100 dark:border-emerald-900/50">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Détail par catégorie — {entry.date}
                    </p>
                    {entry.breakdown.map(row => (
                      <div key={row.category} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-sm shrink-0">{CAT_ICONS[row.category] ?? '⚙️'}</span>
                          <span className="text-xs text-foreground/80 truncate">{row.category}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-[11px]">
                          <span className="text-muted-foreground tabular-nums">
                            {row.used}/{row.cap} utilisés
                          </span>
                          <span className={cn(
                            'font-bold tabular-nums rounded-full px-2 py-0.5 border',
                            'bg-emerald-50 text-emerald-700 border-emerald-200',
                            'dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50'
                          )}>
                            +{row.refunded} ⚡
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Total row */}
                    <div className="flex items-center justify-between pt-2 border-t border-emerald-100 dark:border-emerald-900/50">
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={11} className="text-emerald-600" />
                        <span className="text-xs font-bold text-foreground">Total remboursé</span>
                      </div>
                      <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        +{totalRefunded} ⚡
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress bar (auto-dismiss indicator, paused when expanded) */}
            {!expanded && (
              <motion.div
                className="h-0.5 bg-emerald-500 origin-left"
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 8, ease: 'linear' }}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
