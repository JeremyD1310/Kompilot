/**
 * CreditCostBadge — inline pill showing how many credits an action costs.
 * InsufficientCreditsModal — modal shown when user lacks the required credits.
 * useCreditGuard — hook that checks balance, auto-deducts, and surfaces the modal.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, ArrowUpRight, Sparkles } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useCredits } from '../../context/CreditsContext';
import { useDemoMode } from '../../context/DemoModeContext';
import { getCreditLevel, recordCreditSpend, type CreditAction } from '../../lib/creditsCosts';

// ── CreditCostBadge ───────────────────────────────────────────────────────────

interface CreditCostBadgeProps {
  cost: number;
  variant?: 'inline' | 'pill' | 'ghost';
  className?: string;
}

export function CreditCostBadge({ cost, variant = 'pill', className = '' }: CreditCostBadgeProps) {
  const { isDemoActive } = useDemoMode();

  if (isDemoActive) {
    return (
      <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 ${className}`}>
        <Zap size={9} />∞
      </span>
    );
  }

  if (variant === 'ghost') {
    return (
      <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold opacity-70 ${className}`}>
        <Zap size={9} />-{cost}
      </span>
    );
  }

  const level = getCreditLevel(cost);

  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-0.5 text-[10px] font-extrabold ${level.color} ${className}`}>
        <Zap size={9} />-{cost}⚡
      </span>
    );
  }

  // 'pill' (default)
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-extrabold whitespace-nowrap ${level.color} ${level.bgColor} ${level.borderColor} ${className}`}>
      <Zap size={9} />-{cost} ⚡
    </span>
  );
}

// ── InsufficientCreditsModal ──────────────────────────────────────────────────

interface InsufficientCreditsModalProps {
  open: boolean;
  onClose: () => void;
  required: number;
  current: number;
}

export function InsufficientCreditsModal({ open, onClose, required, current }: InsufficientCreditsModalProps) {
  const missing = Math.max(0, required - current);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="fixed inset-0 z-[501] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between p-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center shrink-0">
                    <Zap size={20} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-foreground leading-tight">Solde insuffisant ⚡</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Crédits IA épuisés pour cette action</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0">
                  <X size={15} />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 pb-5 space-y-4">
                {/* Credit deficit visualization */}
                <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-700 dark:text-amber-400 font-semibold">Crédits requis</span>
                    <span className="font-extrabold text-amber-800 dark:text-amber-300">{required} ⚡</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-700 dark:text-amber-400 font-semibold">Votre solde actuel</span>
                    <span className="font-extrabold text-amber-800 dark:text-amber-300">{current} ⚡</span>
                  </div>
                  <div className="border-t border-amber-200 dark:border-amber-800/50 pt-2 flex items-center justify-between text-xs">
                    <span className="font-bold text-red-700 dark:text-red-400">Il vous manque</span>
                    <span className="font-extrabold text-red-700 dark:text-red-400 text-sm">{missing} ⚡</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Rechargez vos crédits ou passez à une offre supérieure pour débloquer cette action immédiatement.
                </p>

                {/* CTAs */}
                <div className="flex flex-col gap-2">
                  <Link
                    to="/subscription"
                    onClick={onClose}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-600 text-white text-sm font-bold py-3 hover:from-primary/90 hover:to-violet-700 transition-all shadow-md"
                  >
                    <Sparkles size={14} /> Recharger mes crédits
                    <ArrowUpRight size={13} />
                  </Link>
                  <button
                    onClick={onClose}
                    className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── useCreditGuard ────────────────────────────────────────────────────────────

interface CreditGuardOptions {
  cost: number;
  action: CreditAction;
}

/**
 * Hook that manages the full credit-guard flow:
 * - `guard(callback)` — checks balance, deducts if sufficient (records history), or shows modal
 * - `modalNode` — the InsufficientCreditsModal JSX to render in the component
 */
export function useCreditGuard({ cost, action }: CreditGuardOptions) {
  const [showModal, setShowModal] = useState(false);
  const { hasEnoughCredits, deductCredits, credits } = useCredits();
  const { isDemoActive } = useDemoMode();

  const currentBalance = isDemoActive ? 999 : (typeof credits === 'number' ? credits : 999);

  const guard = (callback: () => void) => {
    if (!hasEnoughCredits(cost)) {
      setShowModal(true);
      return false;
    }
    deductCredits(cost);
    recordCreditSpend(cost, action);
    callback();
    return true;
  };

  const modalNode = (
    <InsufficientCreditsModal
      open={showModal}
      onClose={() => setShowModal(false)}
      required={cost}
      current={currentBalance}
    />
  );

  return { guard, modalNode, canAfford: hasEnoughCredits(cost) };
}
