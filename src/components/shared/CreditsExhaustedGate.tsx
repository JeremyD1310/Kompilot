/**
 * CreditsExhaustedGate — paywall overlay shown when a user runs out of AI credits.
 * Wraps any AI-powered section and shows a top-up prompt instead when credits = 0.
 */
import { useState } from 'react';
import { Zap, Lock } from 'lucide-react';
import { useCredits } from '../../context/CreditsContext';
import { CreditsTopUpModal } from '../subscription/CreditsTopUpModal';
import { useBYOKSwitch } from '../../context/BYOKContext';

interface CreditsExhaustedGateProps {
  children: React.ReactNode;
  /** Credits required for this action (default 1) */
  cost?: number;
  /** Feature name shown in the paywall message */
  featureName?: string;
}

export function CreditsExhaustedGate({
  children,
  cost = 1,
  featureName = 'cette fonctionnalité IA',
}: CreditsExhaustedGateProps) {
  const { canCreate, hasEnoughCredits } = useCredits();
  const { skipCredits } = useBYOKSwitch();
  const [topUpOpen, setTopUpOpen] = useState(false);

  // BYOK active → bypass gate entirely
  if (skipCredits) return <>{children}</>;

  // Has enough credits → show normally
  if (hasEnoughCredits(cost)) return <>{children}</>;

  return (
    <>
      <div className="relative rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-700/50 bg-amber-50/40 dark:bg-amber-950/10 overflow-hidden">
        {/* Blurred preview of children */}
        <div className="pointer-events-none select-none blur-sm opacity-40">
          {children}
        </div>

        {/* Paywall overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
            <Lock size={22} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Crédits insuffisants</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Vous avez besoin de <strong>{cost} ⚡ crédit{cost > 1 ? 's' : ''}</strong> pour accéder à {featureName}. Rechargez pour débloquer immédiatement.
            </p>
          </div>
          <button
            onClick={() => setTopUpOpen(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl px-4 py-2.5 transition-colors shadow-sm"
          >
            <Zap size={14} className="fill-white" />
            Recharger mes crédits ⚡
          </button>
        </div>
      </div>

      <CreditsTopUpModal open={topUpOpen} onClose={() => setTopUpOpen(false)} />
    </>
  );
}

/**
 * useCreditsGate — programmatic check + modal trigger for use in event handlers.
 * Returns { check } — call check(cost) before an AI action; returns true if OK.
 */
export function useCreditsGate() {
  const { hasEnoughCredits, deductCredits } = useCredits();
  const { skipCredits } = useBYOKSwitch();
  const [topUpOpen, setTopUpOpen] = useState(false);

  const check = (cost = 1): boolean => {
    if (skipCredits) return true;
    if (hasEnoughCredits(cost)) return true;
    setTopUpOpen(true);
    return false;
  };

  const modal = (
    <CreditsTopUpModal open={topUpOpen} onClose={() => setTopUpOpen(false)} />
  );

  return { check, deductCredits, modal, topUpOpen };
}
