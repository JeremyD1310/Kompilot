/**
 * RefundHistory — shows the log of automatic daily credit refunds.
 *
 * Reads from the refund log written by src/lib/dailyRefund.ts.
 * Shows each day's refund as a row with per-category breakdown on expand.
 */
import { useState, useCallback } from 'react';
import { Gift, ChevronDown, ChevronUp, RefreshCw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRefundLog, type RefundEntry } from '../../../lib/dailyRefund';

const CAT_ICONS: Record<string, string> = {
  'Inbox & Messagerie':    '💬',
  'Génération de contenu': '✨',
  'Outils & Diagnostics':  '🔧',
  'SEO & GEO':             '🔍',
  'Automatisation':        '📅',
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  } catch { return dateStr; }
}

function RefundRow({ entry }: { entry: RefundEntry }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border/40 last:border-0">
      {/* Summary row */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted/15 transition-colors text-left"
      >
        {/* Green dot */}
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />

        {/* Date */}
        <span className="text-[11px] text-foreground font-medium tabular-nums w-14 shrink-0">
          {formatDate(entry.date)}
        </span>

        {/* Label */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Gift size={11} className="text-emerald-600 shrink-0" />
          <span className="text-xs text-foreground font-medium truncate">
            Remboursement automatique
          </span>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {entry.breakdown.length} catégorie{entry.breakdown.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Amount badge */}
        <span className="text-xs font-extrabold tabular-nums rounded-full px-2 py-0.5 border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50 shrink-0">
          +{entry.totalRefunded} ⚡
        </span>

        {/* Expand chevron */}
        {open
          ? <ChevronUp size={11} className="text-muted-foreground shrink-0" />
          : <ChevronDown size={11} className="text-muted-foreground shrink-0" />
        }
      </button>

      {/* Expanded per-category breakdown */}
      {open && (
        <div className="px-5 pb-3 space-y-1.5 bg-muted/10">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 pt-1">
            Détail par catégorie
          </p>
          {entry.breakdown.map(row => (
            <div key={row.category} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm shrink-0">{CAT_ICONS[row.category] ?? '⚙️'}</span>
                <span className="text-[11px] text-foreground/80 truncate">{row.category}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 text-[11px]">
                <span className="text-muted-foreground tabular-nums">
                  {row.used}/{row.cap} utilisés
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  +{row.refunded} ⚡
                </span>
              </div>
            </div>
          ))}
          {/* Row subtotal */}
          <div className={cn(
            'flex items-center justify-between pt-1.5 mt-1 border-t border-border/40',
          )}>
            <div className="flex items-center gap-1.5">
              <Sparkles size={10} className="text-emerald-600" />
              <span className="text-[11px] font-bold text-foreground">Total</span>
            </div>
            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
              +{entry.totalRefunded} ⚡
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function RefundHistory() {
  const [log, setLog] = useState<RefundEntry[]>(() => getRefundLog());

  const handleRefresh = useCallback(() => setLog(getRefundLog()), []);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-muted/20">
        <div className="flex items-center gap-2">
          <Gift size={14} className="text-emerald-600" />
          <p className="text-sm font-bold text-foreground">Remboursements automatiques</p>
          {log.length > 0 && (
            <span className="text-[10px] font-semibold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50 px-2 py-0.5">
              {log.length} entrée{log.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button
          onClick={handleRefresh}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title="Rafraîchir"
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {/* Description */}
      <div className="px-5 py-3 border-b border-border/40 bg-primary/[0.03]">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Chaque nuit, les crédits non utilisés dans les catégories ayant un plafond journalier
          sont automatiquement remboursés sur votre forfait mensuel.
          <span className="font-semibold text-foreground"> Le plafond doit être configuré pour qu'un remboursement ait lieu.</span>
        </p>
      </div>

      {/* Log rows */}
      {log.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
          <Gift size={28} className="text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Aucun remboursement enregistré.</p>
          <p className="text-[11px] text-muted-foreground/70 max-w-[260px]">
            Configurez des plafonds journaliers par catégorie pour activer les remboursements automatiques.
          </p>
        </div>
      ) : (
        <div>
          {log.map((entry, i) => (
            <RefundRow key={`${entry.date}-${i}`} entry={entry} />
          ))}
        </div>
      )}

      {/* Total refunded footer */}
      {log.length > 0 && (
        <div className="px-5 py-3 border-t border-border/40 bg-muted/10 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            {log.length} jour{log.length > 1 ? 's' : ''} avec remboursement
          </p>
          <p className="text-xs font-bold text-foreground">
            Total remboursé :{' '}
            <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">
              +{log.reduce((s, e) => s + e.totalRefunded, 0)} ⚡
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
