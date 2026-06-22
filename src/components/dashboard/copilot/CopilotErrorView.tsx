/**
 * CopilotErrorView — vue "Erreur récupérable".
 * Diagnostic contextuel + retry non-bloquant
 */

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { LogLine } from './CopilotPrimitives';

export function CopilotErrorView({
  errorMsg,
  steps,
  onRetry,
  onReset,
}: {
  errorMsg: string | null;
  steps: { id: string; label: string; done: boolean; active: boolean; error: boolean }[];
  onRetry: () => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-4">

      {/* Message contextuel */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl border border-red-200/60 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20">
        <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
        <p className="text-[12.5px] text-red-700 dark:text-red-300 leading-relaxed">
          {errorMsg ?? 'Une API externe est temporairement indisponible. Vos données sont protégées.'}
        </p>
      </div>

      {/* Étapes accomplies / échouées */}
      <div className="space-y-2 px-0.5">
        {steps.filter(s => s.done || s.error).map(s => (
          <LogLine
            key={s.id}
            label={s.label}
            done={s.done}
            active={false}
            error={s.error}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onRetry}
          className="flex-1 flex items-center justify-center gap-2 text-primary-foreground font-bold text-sm py-3 rounded-xl transition-all duration-150 active:scale-[0.98] shadow-sm cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(173 80% 36%) 100%)',
            boxShadow: '0 4px 16px hsl(var(--primary) / 0.3)',
          }}
        >
          <RefreshCw size={13} />
          Relancer l'activation
        </button>
        <button
          onClick={onReset}
          className="px-4 py-3 rounded-xl border border-border bg-muted/40 text-muted-foreground hover:bg-muted text-sm font-medium transition-colors cursor-pointer"
        >
          Annuler
        </button>
      </div>

      <p className="text-[10px] text-center text-muted-foreground/40">
        Vos données ne sont pas affectées · Session toujours active
      </p>
    </div>
  );
}
