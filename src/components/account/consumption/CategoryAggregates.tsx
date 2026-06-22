/**
 * CategoryAggregates — horizontal progress bars showing
 * credit spend per category for the current billing cycle.
 */
import { useMemo } from 'react';
import { BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CreditSpendEntry } from '../../../lib/creditsCosts';
import { ACTION_CATEGORY, CATEGORY_META, SLICE_COLORS } from './consumptionData';

interface Props {
  history: CreditSpendEntry[];
}

export function CategoryAggregates({ history }: Props) {
  const cats = useMemo(() => {
    const m: Record<string, { total: number; count: number }> = {};
    history.forEach(e => {
      const cat = ACTION_CATEGORY[e.action] ?? 'Autre';
      if (!m[cat]) m[cat] = { total: 0, count: 0 };
      m[cat].total += e.amount;
      m[cat].count += 1;
    });
    const grand = Object.values(m).reduce((s, v) => s + v.total, 0) || 1;
    return Object.entries(m)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([name, { total, count }]) => ({
        name, total, count,
        pct: Math.round((total / grand) * 100),
      }));
  }, [history]);

  if (cats.length === 0) return null;

  const grandTotal = history.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/60 bg-muted/20 flex items-center gap-2">
        <BarChart2 size={14} className="text-primary" />
        <p className="text-sm font-bold text-foreground">Répartition par catégorie — Cycle en cours</p>
      </div>

      {/* Category rows */}
      <div className="divide-y divide-border/40">
        {cats.map((cat, i) => {
          const meta = CATEGORY_META[cat.name];
          const barColor = SLICE_COLORS[i % SLICE_COLORS.length];
          return (
            <div key={cat.name} className="px-5 py-3.5 hover:bg-muted/10 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {meta ? (
                    <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5 border', meta.color, meta.bg, meta.border)}>
                      {meta.label}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-foreground">{cat.name}</span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {cat.count} action{cat.count > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-muted-foreground">{cat.pct}%</span>
                  <span className="text-sm font-extrabold tabular-nums" style={{ color: barColor }}>
                    {cat.total} ⚡
                  </span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${cat.pct}%`, background: barColor }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border/40 bg-muted/10 flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">
          {cats.length} catégorie{cats.length > 1 ? 's' : ''} actives
        </p>
        <p className="text-xs font-bold text-foreground">
          Total cycle :{' '}
          <span className="text-primary tabular-nums">{grandTotal} ⚡</span>
        </p>
      </div>
    </div>
  );
}
