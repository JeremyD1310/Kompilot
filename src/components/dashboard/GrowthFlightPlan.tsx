/**
 * GrowthFlightPlan — "🚀 Votre Plan de Configuration Kompilot"
 *
 * Gamified onboarding checklist with real DB-backed state.
 * Each incomplete step is clickable → redirects to the right page.
 */
import { useNavigate } from '@tanstack/react-router';
import { CheckSquare, Square, ChevronRight, Loader2, Rocket, X, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { GrowthStep } from '../../hooks/useGrowthChecklist';

interface GrowthFlightPlanProps {
  steps:          GrowthStep[];
  completedCount: number;
  totalCount:     number;
  allDone:        boolean;
  isLoading:      boolean;
  className?:     string;
}

export function GrowthFlightPlan({
  steps,
  completedCount,
  totalCount,
  allDone,
  isLoading,
  className,
}: GrowthFlightPlanProps) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className={cn(
      'relative rounded-2xl border border-border bg-card shadow-sm overflow-hidden',
      className,
    )}>
      {/* Top gradient progress bar */}
      <div
        className="h-1.5 w-full transition-all duration-700 ease-out"
        style={{
          background: `linear-gradient(to right, hsl(var(--primary)) ${progressPct}%, hsl(var(--muted)) ${progressPct}%)`,
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border bg-gradient-to-r from-primary/3 to-transparent">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/15">
            <Rocket size={18} className="text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground leading-tight">
              🚀 Votre Plan de Configuration Kompilot
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isLoading
                ? 'Vérification en cours…'
                : allDone
                  ? '🎉 Configuration complète ! Votre présence est optimisée.'
                  : `${completedCount} / ${totalCount} étapes complétées — Cliquez sur une étape pour l'activer`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Progress badge */}
          {!isLoading && (
            <span className={cn(
              'text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all',
              progressPct === 100
                ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800'
                : progressPct >= 60
                  ? 'bg-primary/10 text-primary border-primary/20'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/40',
            )}>
              {progressPct}%
            </span>
          )}

          {/* Dismiss when all done */}
          {allDone && (
            <button
              onClick={() => setDismissed(true)}
              className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Masquer"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Steps list */}
      <div className="divide-y divide-border/50">
        {steps.map((step, idx) => (
          <StepRow
            key={step.id}
            step={step}
            index={idx}
            onAction={() => {
              if (!step.completed && !step.loading) {
                navigate({ to: step.href as any });
              }
            }}
          />
        ))}
      </div>

      {/* Footer when all done */}
      {allDone && (
        <div className="px-5 py-3 bg-green-50 dark:bg-green-950/20 border-t border-green-200 dark:border-green-800/40 flex items-center gap-2">
          <Sparkles size={14} className="text-green-600 dark:text-green-400 shrink-0" />
          <span className="text-xs font-semibold text-green-700 dark:text-green-400">
            Félicitations ! Votre Kompilot est entièrement configuré et optimisé.
          </span>
        </div>
      )}
    </div>
  );
}

// ── Individual step row ───────────────────────────────────────────────────────

function StepRow({
  step,
  index,
  onAction,
}: {
  step: GrowthStep;
  index: number;
  onAction: () => void;
}) {
  const isClickable = !step.completed && !step.loading;

  return (
    <button
      type="button"
      onClick={isClickable ? onAction : undefined}
      disabled={!isClickable}
      title={isClickable ? `Cliquer pour : ${step.ctaLabel}` : undefined}
      style={{ animationDelay: `${index * 60}ms` }}
      className={cn(
        'w-full flex items-center gap-4 px-4 py-3 md:px-5 md:py-3.5 text-left transition-all duration-150 min-h-[48px]',
        isClickable
          ? 'hover:bg-primary/5 active:bg-primary/10 cursor-pointer group'
          : step.completed
            ? 'cursor-default'
            : 'cursor-default opacity-60',
      )}
    >
      {/* Step number + checkbox */}
      <div className="shrink-0 flex items-center justify-center w-7">
        {step.loading ? (
          <Loader2 size={18} className="text-muted-foreground/40 animate-spin" />
        ) : step.completed ? (
          <div className="relative">
            <CheckSquare
              size={24}
              className="text-primary transition-all duration-300"
              strokeWidth={2}
            />
          </div>
        ) : (
          <Square
            size={24}
            className="text-muted-foreground/25 group-hover:text-primary/40 transition-colors duration-150"
            strokeWidth={1.5}
          />
        )}
      </div>

      {/* Icon + labels */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-xl shrink-0 leading-none w-7 text-center">{step.icon}</span>
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-sm font-semibold leading-tight',
            step.completed
              ? 'text-foreground'
              : isClickable
                ? 'text-foreground group-hover:text-primary transition-colors'
                : 'text-muted-foreground',
          )}>
            {step.label}
          </p>
          <p className={cn(
            'text-[11px] leading-snug mt-0.5 truncate transition-colors',
            step.completed
              ? 'text-primary/70'
              : isClickable
                ? 'text-muted-foreground group-hover:text-primary/60'
                : 'text-muted-foreground/50',
          )}>
            {step.completed ? `✓ ${step.description}` : step.ctaLabel}
          </p>
        </div>
      </div>

      {/* Right indicator */}
      {step.completed ? (
        <span className="shrink-0 text-[10px] font-bold text-primary bg-primary/10 rounded-full px-2.5 py-0.5 border border-primary/15">
          Activé ✓
        </span>
      ) : !step.loading && (
        <div className="shrink-0 flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground/50 group-hover:text-primary/50 font-medium hidden sm:block transition-colors">
            Configurer →
          </span>
          <ChevronRight
            size={15}
            className="text-muted-foreground/25 group-hover:text-primary/50 group-hover:translate-x-0.5 transition-all duration-150"
          />
        </div>
      )}
    </button>
  );
}
