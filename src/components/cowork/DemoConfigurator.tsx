/**
 * DemoConfigurator — QA banner to toggle trial/active states without Stripe.
 * Visible in preview/sandbox by default (VITE_QA_MODE !== 'false').
 */
import { FlaskConical, RotateCcw } from 'lucide-react';
import { cn } from '@blinkdotnew/ui';

interface Props {
  isTrial: boolean;
  setIsTrial: (v: boolean) => void;
  aiOptionActivated: boolean;
  setAiOptionActivated: (v: boolean) => void;
  onReset: () => void;
}

export function DemoConfigurator({
  isTrial,
  setIsTrial,
  aiOptionActivated,
  setAiOptionActivated,
  onReset,
}: Props) {
  const isQaMode = import.meta.env.VITE_QA_MODE !== 'false';
  if (!isQaMode) return null;

  return (
    <div
      data-testid="demo-configurator"
      className="relative rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-transparent px-4 py-3 flex flex-wrap items-center gap-3"
    >
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
          <FlaskConical size={14} className="text-amber-400" />
        </div>
        <div>
          <p className="text-xs font-black text-amber-200 leading-tight">Mode Démonstration QA</p>
          <p className="text-[10px] text-amber-300/70 leading-tight">Basculez les états pour tester l'affichage</p>
        </div>
      </div>

      <span className="hidden sm:inline-block w-px h-7 bg-amber-500/20" />

      <div className="flex items-center gap-1 bg-slate-950/60 border border-slate-800 rounded-lg p-1">
        <button
          data-testid="qa-trial"
          onClick={() => setIsTrial(true)}
          className={cn(
            'text-[10px] font-bold px-2.5 py-1 rounded transition-all',
            isTrial
              ? 'bg-amber-500/30 text-amber-200 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200 border border-transparent',
          )}
        >
          Essai 14j
        </button>
        <button
          data-testid="qa-active"
          onClick={() => setIsTrial(false)}
          className={cn(
            'text-[10px] font-bold px-2.5 py-1 rounded transition-all',
            !isTrial
              ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200 border border-transparent',
          )}
        >
          Abonné
        </button>
      </div>

      <div className="flex items-center gap-1 bg-slate-950/60 border border-slate-800 rounded-lg p-1">
        <button
          data-testid="qa-option-off"
          onClick={() => setAiOptionActivated(false)}
          disabled={isTrial}
          className={cn(
            'text-[10px] font-bold px-2.5 py-1 rounded transition-all',
            !aiOptionActivated && !isTrial
              ? 'bg-slate-700 text-slate-200 border border-slate-600'
              : isTrial
                ? 'text-slate-600 cursor-not-allowed border border-transparent'
                : 'text-slate-400 hover:text-slate-200 border border-transparent',
          )}
        >
          Option OFF
        </button>
        <button
          data-testid="qa-option-on"
          onClick={() => setAiOptionActivated(true)}
          disabled={isTrial}
          className={cn(
            'text-[10px] font-bold px-2.5 py-1 rounded transition-all',
            aiOptionActivated
              ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/40'
              : isTrial
                ? 'text-slate-600 cursor-not-allowed border border-transparent'
                : 'text-slate-400 hover:text-slate-200 border border-transparent',
          )}
        >
          Option ON
        </button>
      </div>

      <button
        data-testid="qa-reset"
        onClick={onReset}
        className="ml-auto flex items-center gap-1 text-[10px] font-bold text-amber-300/80 hover:text-amber-200 transition-colors"
      >
        <RotateCcw size={10} /> Reset
      </button>
    </div>
  );
}
