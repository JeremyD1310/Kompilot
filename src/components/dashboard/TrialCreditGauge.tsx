/**
 * TrialCreditGauge — Jauge discrète des crédits IA restants pendant l'essai.
 *
 * Affiche 3 barres de progression : Réponses IA · Posts · Audits
 * Se masque automatiquement quand l'essai est expiré (ne pas gêner les abonnés).
 */
import { useTrial, TRIAL_QUOTA } from '../../context/TrialContext';
import { Zap, MessageSquare, FileText, Search } from 'lucide-react';

interface GaugeRowProps {
  icon: React.ReactNode;
  label: string;
  used: number;
  limit: number;
  color: string;
}

function GaugeRow({ icon, label, used, limit, color }: GaugeRowProps) {
  const remaining = Math.max(0, limit - used);
  const pct = Math.min(100, (used / limit) * 100);
  const isEmpty = remaining === 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`shrink-0 ${isEmpty ? 'text-red-400' : 'text-muted-foreground'}`}>
            {icon}
          </span>
          <span className={`text-[11px] font-medium truncate ${isEmpty ? 'text-red-500' : 'text-foreground/70'}`}>
            {label}
          </span>
        </div>
        <span className={`text-[11px] font-bold shrink-0 ${
          isEmpty ? 'text-red-500' : remaining <= 1 ? 'text-amber-500' : 'text-foreground/60'
        }`}>
          {remaining}/{limit}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isEmpty ? 'bg-red-400' : remaining <= 1 ? 'bg-amber-400' : color
          }`}
          style={{ width: `${100 - pct}%` }}
        />
      </div>
    </div>
  );
}

export function TrialCreditGauge() {
  const { isTrialActive, trialDaysLeft, quotaUsed, openPaywall } = useTrial();

  // Only show during active trial
  if (!isTrialActive) return null;

  const allExhausted =
    quotaUsed.aiReplies >= TRIAL_QUOTA.aiReplies.limit &&
    quotaUsed.postGens  >= TRIAL_QUOTA.postGens.limit  &&
    quotaUsed.audits    >= TRIAL_QUOTA.audits.limit;

  return (
    <div className={`rounded-xl border p-3 space-y-2.5 transition-colors ${
      allExhausted
        ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40'
        : 'bg-muted/50 border-border/60'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Zap size={12} className={allExhausted ? 'text-red-400' : 'text-primary'} />
          <span className="text-[11px] font-bold text-foreground/80">
            Crédits IA d'essai
          </span>
        </div>
        <button
          onClick={openPaywall}
          className="text-[10px] font-semibold text-primary hover:underline"
        >
          Passer Pro
        </button>
      </div>

      {/* Gauge rows */}
      <div className="space-y-2">
        <GaugeRow
          icon={<MessageSquare size={11} />}
          label="Réponses IA"
          used={quotaUsed.aiReplies}
          limit={TRIAL_QUOTA.aiReplies.limit}
          color="bg-primary"
        />
        <GaugeRow
          icon={<FileText size={11} />}
          label="Posts générés"
          used={quotaUsed.postGens}
          limit={TRIAL_QUOTA.postGens.limit}
          color="bg-teal-400"
        />
        <GaugeRow
          icon={<Search size={11} />}
          label="Audits GEO"
          used={quotaUsed.audits}
          limit={TRIAL_QUOTA.audits.limit}
          color="bg-violet-400"
        />
      </div>

      {/* Countdown */}
      <p className="text-[10px] text-muted-foreground text-center">
        ⏳ <strong>{trialDaysLeft}</strong> jour{trialDaysLeft !== 1 ? 's' : ''} restant{trialDaysLeft !== 1 ? 's' : ''} · Essai gratuit
      </p>
    </div>
  );
}
