import { useState } from 'react';
import { Zap, Plus, Leaf, Lock } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useCredits } from '../../context/CreditsContext';
import { useDemoMode } from '../../context/DemoModeContext';
import { CreditsTopUpModal } from '../subscription/CreditsTopUpModal';
import { useBYOK } from '../../context/BYOKContext';
import { useEcoMode } from '../../context/EcoModeContext';

export function CreditsIndicator() {
  const { credits, isEmpty } = useCredits();
  const { isDemoActive } = useDemoMode();
  const { hasValidOpenAIKey } = useBYOK();
  const { ecoMode, isDailyCapReached, isDailyCapNearing, dailyCap, dailyUsage, categoryWarnings } = useEcoMode();
  const [topUpOpen, setTopUpOpen] = useState(false);

  // BYOK active: show "Illimité (Clé perso)" badge
  if (hasValidOpenAIKey) {
    return (
      <div className="mx-3 mb-3 flex items-center gap-2 rounded-xl border border-emerald-300/70 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800/50 px-3 py-2">
        <Zap size={12} className="text-emerald-600 shrink-0 fill-emerald-500" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 leading-none mb-0.5">Clé API perso.</p>
          <p className="text-xs font-bold leading-none text-emerald-700 dark:text-emerald-400">Illimité 🟢</p>
        </div>
      </div>
    );
  }

  // Demo mode: show 50-credit pool with real usage
  if (isDemoActive) {
    const remaining = typeof credits === 'number' ? credits : 50;
    const pct = Math.max(0, (remaining / 50) * 100);
    const isLow = pct <= 20;
    return (
      <div className={`mx-3 mb-3 flex items-center gap-2 rounded-xl border px-3 py-2 ${
        isLow ? 'border-orange-300/70 bg-orange-50' : 'border-emerald-300/70 bg-emerald-50/80'
      }`}>
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Zap size={12} className={`shrink-0 ${isLow ? 'text-orange-500 animate-pulse' : 'text-emerald-600'}`} />
          <div className="min-w-0">
            <p className={`text-[10px] font-medium leading-none mb-0.5 ${isLow ? 'text-orange-700' : 'text-emerald-700'}`}>
              Crédits Démo
            </p>
            <p className={`text-xs font-bold leading-none ${isLow ? 'text-orange-700' : 'text-emerald-700'}`}>
              {remaining} / 50 {isLow ? '⚠️' : '🟢'}
            </p>
          </div>
        </div>
        <span className={`text-[9px] font-bold rounded-full px-1.5 py-0.5 shrink-0 leading-tight border ${
          isLow
            ? 'text-orange-600 bg-orange-100 border-orange-200'
            : 'text-emerald-600 bg-emerald-100 border-emerald-200'
        }`}>
          {isLow ? '⚡ Faible' : 'Démo'}
        </span>
      </div>
    );
  }

  const label = credits === 'unlimited' ? 'Illimité' : `${credits} crédit${(credits as number) !== 1 ? 's' : ''}`;
  const isLow = credits !== 'unlimited' && (credits as number) <= 5 && !isEmpty;

  return (
    <>
      <div
        className={`mx-3 mb-3 flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors cursor-pointer ${
          isEmpty
            ? 'border-red-300/60 bg-red-50 dark:bg-red-950/20 dark:border-red-800/50 hover:bg-red-100'
            : isLow
              ? 'border-amber-300/60 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/50 hover:bg-amber-100'
              : 'border-border bg-muted/40 hover:bg-muted/60'
        }`}
        onClick={() => isEmpty && setTopUpOpen(true)}
        title={isEmpty ? 'Recharger mes crédits' : undefined}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Zap size={12} className={`shrink-0 ${
            isEmpty ? 'text-red-500 animate-pulse' : isLow ? 'text-amber-500' : 'text-muted-foreground'
          }`} />
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground leading-none mb-0.5">Solde</p>
            <p className={`text-xs font-bold leading-none ${
              isEmpty ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-foreground'
            }`}>
              {isEmpty ? '0 ⚡ — Épuisé' : label}
            </p>
          </div>
        </div>

        {/* Top-up CTA when empty */}
        {isEmpty ? (
          <button
            onClick={() => setTopUpOpen(true)}
            className="flex items-center justify-center w-6 h-6 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors shrink-0"
            title="Recharger mes crédits"
          >
            <Plus size={13} strokeWidth={2.5} />
          </button>
        ) : (
          <Link
            to="/subscription"
            className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors shrink-0"
            title="Gérer mes crédits"
          >
            <Plus size={13} strokeWidth={2.5} />
          </Link>
        )}
      </div>

      {/* Top-up modal (for zero-credits state) */}
      {isEmpty && (
        <CreditsTopUpModal open={topUpOpen} onClose={() => setTopUpOpen(false)} />
      )}

      {/* Eco mode badge */}
      {ecoMode && (
        <div className="mx-3 mb-1 flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/50 px-2.5 py-1.5">
          <Leaf size={10} className="text-emerald-600 shrink-0" />
          <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">Mode Éco — ×0.5 ⚡</p>
        </div>
      )}

      {/* Daily cap indicator */}
      {dailyCap !== null && (
        <div className={`mx-3 mb-1 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 ${
          isDailyCapReached
            ? 'bg-red-50 dark:bg-red-950/20 border-red-200/70 dark:border-red-800/50'
            : isDailyCapNearing
              ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200/70 dark:border-orange-800/50'
              : 'bg-muted/30 border-border'
        }`}>
          <Lock size={10} className={`shrink-0 ${isDailyCapReached ? 'text-red-500' : isDailyCapNearing ? 'text-orange-500' : 'text-muted-foreground'}`} />
          <p className={`text-[10px] font-semibold ${isDailyCapReached ? 'text-red-700 dark:text-red-400' : isDailyCapNearing ? 'text-orange-700 dark:text-orange-400' : 'text-muted-foreground'}`}>
            {isDailyCapReached ? 'Plafond atteint 🔒' : isDailyCapNearing ? `⚠️ ${dailyUsage}/${dailyCap} auj.` : `${dailyUsage}/${dailyCap} auj.`}
          </p>
        </div>
      )}

      {/* Per-category cap warnings */}
      {categoryWarnings.length > 0 && (
        <div className="mx-3 mb-2 flex items-center gap-1.5 rounded-lg border bg-amber-50 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-800/50 px-2.5 py-1.5">
          <Lock size={10} className="shrink-0 text-amber-500" />
          <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 truncate">
            ⚠️ {categoryWarnings.length} catégorie{categoryWarnings.length > 1 ? 's' : ''} limite
          </p>
        </div>
      )}
    </>
  );
}
