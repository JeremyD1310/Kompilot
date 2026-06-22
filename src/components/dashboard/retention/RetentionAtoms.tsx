/**
 * Shared micro-components for the ClientRetentionPanel.
 */
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';

export function VariableChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
      {label}
    </span>
  );
}

export function UrgencyBar({ score, colorClass }: { score: number; colorClass: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
          Score d'urgence
        </span>
        <span className="text-[11px] font-extrabold text-foreground tabular-nums">{score}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', colorClass)}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export function NoShowBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300">
      🛡️ Lien anti-No-Show inclus
    </span>
  );
}

export function SmsPreviewBox({ smsText, variables }: { smsText: string; variables: string[] }) {
  return (
    <div className="rounded-xl bg-muted/40 border border-border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Aperçu SMS</span>
        <NoShowBadge />
      </div>
      <p className="text-xs text-foreground leading-relaxed font-mono">{smsText}</p>
      <div className="flex flex-wrap gap-1 pt-1">
        {variables.map(v => <VariableChip key={v} label={v} />)}
      </div>
    </div>
  );
}
