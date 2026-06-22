/**
 * CopilotPrimitives — atomes partagés du widget d'activation.
 * StatusPill · LogLine · CinematicOrb · HeroBackground · ActivationSkeleton
 */

import { AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';

// ── StatusPill ────────────────────────────────────────────────────────────────

export function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, { label: string; dot: string; wrap: string }> = {
    loading: { label: 'Chargement',      dot: 'bg-slate-400',                 wrap: 'bg-slate-100 dark:bg-slate-800/60 text-slate-500' },
    idle:    { label: 'Inactif',         dot: 'bg-slate-400',                 wrap: 'bg-slate-100 dark:bg-slate-800/60 text-slate-500' },
    running: { label: 'Initialisation…', dot: 'bg-amber-400 animate-pulse',   wrap: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
    active:  { label: 'En ligne',        dot: 'bg-emerald-500 animate-pulse', wrap: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
    error:   { label: 'Erreur',          dot: 'bg-red-500',                   wrap: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
  };
  const c = cfg[status] ?? cfg.idle;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[11px] font-semibold tracking-wide ${c.wrap}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
      {c.label}
    </span>
  );
}

// ── LogLine ───────────────────────────────────────────────────────────────────

export function LogLine({ label, sublabel, done, active, error }: {
  label: string; sublabel?: string;
  done: boolean; active: boolean; error: boolean;
}) {
  return (
    <div className={`flex items-start gap-2.5 transition-all duration-500 ${
      error || done || active ? 'opacity-100 translate-y-0' : 'opacity-25 translate-y-1'
    }`}>
      <div className="mt-[3px] shrink-0 w-3.5 h-3.5 flex items-center justify-center">
        {error   ? <AlertTriangle size={11} className="text-red-500" />
        : done   ? <CheckCircle2 size={12} className="text-emerald-500" />
        : active ? <span className="block w-3 h-3 rounded-full border-[1.5px] border-primary border-t-transparent animate-spin" />
        :           <span className="block w-1.5 h-1.5 rounded-full bg-border" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-[13px] leading-tight font-medium ${
          error            ? 'text-red-600 dark:text-red-400'
          : done || active ? 'text-foreground'
          :                  'text-muted-foreground'
        }`}>
          {label}
        </p>
        {sublabel && active && (
          <p className="text-[11px] text-muted-foreground mt-0.5 animate-pulse">{sublabel}</p>
        )}
      </div>
    </div>
  );
}

// ── CinematicOrb ──────────────────────────────────────────────────────────────

export function CinematicOrb({ progress }: { progress: number }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative flex items-center justify-center w-28 h-28 mx-auto select-none">
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-30"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' }}
      />
      <div className="absolute inset-0 rounded-full border border-primary/15 animate-spin" style={{ animationDuration: '12s' }} />
      <div className="absolute inset-2 rounded-full border border-primary/10 animate-spin" style={{ animationDuration: '8s', animationDirection: 'reverse' }} />
      <div className="absolute inset-0 rounded-full border-2 border-primary/8 animate-ping" style={{ animationDuration: '2.5s' }} />
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="currentColor"
          strokeWidth="2.5" className="text-muted/40" />
        <circle cx="48" cy="48" r={r} fill="none" stroke="currentColor"
          strokeWidth="3"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - progress / 100)}
          strokeLinecap="round"
          className="text-primary transition-all duration-700 ease-out"
          style={{ filter: 'drop-shadow(0 0 6px hsl(var(--primary) / 0.6))' }}
        />
      </svg>
      <div className="relative z-10 flex flex-col items-center justify-center gap-0.5">
        <Sparkles size={16} className="text-primary animate-pulse" />
        <span className="text-[13px] font-bold text-foreground tabular-nums">{progress}%</span>
      </div>
    </div>
  );
}

// ── HeroBackground ────────────────────────────────────────────────────────────

export function HeroBackground() {
  return (
    <>
      <div
        className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 70%)' }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
    </>
  );
}

// ── ActivationSkeleton ────────────────────────────────────────────────────────

export function ActivationSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="animate-pulse">
        <div className="px-5 pt-5 pb-4 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-muted" />
            <div className="space-y-1.5">
              <div className="h-3.5 bg-muted rounded-full w-36" />
              <div className="h-2.5 bg-muted rounded-full w-24" />
            </div>
          </div>
          <div className="h-5 w-20 bg-muted rounded-full" />
        </div>
        <div className="p-5 space-y-3">
          <div className="h-32 bg-muted/60 rounded-2xl" />
          <div className="h-14 bg-muted rounded-2xl" />
          <div className="flex gap-2">
            <div className="h-3 bg-muted rounded-full w-20" />
            <div className="h-3 bg-muted rounded-full w-16" />
            <div className="h-3 bg-muted rounded-full w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}
