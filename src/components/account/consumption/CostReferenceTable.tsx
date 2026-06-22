/**
 * CostReferenceTable — full tariff grid showing every AI action,
 * its category, level, unit cost, and current cycle usage/total.
 */
import { useState } from 'react';
import { ChevronDown, ChevronUp, ListFilter, TableProperties, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCreditLevel } from '../../../lib/creditsCosts';
import type { CreditAction } from '../../../lib/creditsCosts';
import { TARIFF_ROWS, CATEGORY_META, ACTION_CATEGORY } from './consumptionData';

// ── Shared small components ───────────────────────────────────────────────────

export function CategoryBadge({ category }: { category: string }) {
  const meta = CATEGORY_META[category];
  if (!meta) return <span className="text-[10px] text-muted-foreground">{category}</span>;
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5 border', meta.color, meta.bg, meta.border)}>
      {meta.label}
    </span>
  );
}

export function LevelBadge({ cost }: { cost: number }) {
  const level = getCreditLevel(cost);
  return (
    <span className={cn('text-[10px] font-bold rounded-full px-2 py-0.5 border', level.bgColor, level.color, level.borderColor)}>
      {level.label}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  ecoMode: boolean;
  actionSummary: Record<CreditAction, { count: number; total: number }>;
}

export function CostReferenceTable({ ecoMode, actionSummary }: Props) {
  const [catFilter, setCatFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState(true);

  const categories = ['all', ...Object.keys(CATEGORY_META)];
  const filtered = catFilter === 'all'
    ? TARIFF_ROWS
    : TARIFF_ROWS.filter(r => r.category === catFilter);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Collapsible header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 border-b border-border/60 bg-muted/20 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <TableProperties size={14} className="text-primary" />
          <p className="text-sm font-bold text-foreground">Grille tarifaire complète — Coût par action IA</p>
          <span className="text-[10px] font-semibold rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5">
            {TARIFF_ROWS.length} actions
          </span>
        </div>
        {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>

      {expanded && (
        <>
          {/* Category filter pills */}
          <div className="px-5 py-3 border-b border-border/40 flex items-center gap-2 overflow-x-auto">
            <ListFilter size={12} className="text-muted-foreground shrink-0" />
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className={cn(
                  'shrink-0 text-[10px] font-semibold rounded-full px-3 py-1 border transition-colors',
                  catFilter === cat
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted/70 hover:text-foreground'
                )}
              >
                {cat === 'all' ? 'Toutes les catégories' : cat}
              </button>
            ))}
          </div>

          {/* Table column headers */}
          <div className="hidden sm:grid grid-cols-[2fr_1.4fr_0.8fr_0.8fr_1fr_1fr] gap-3 px-5 py-2.5 bg-muted/10 border-b border-border/40">
            {['Action IA', 'Catégorie', 'Niveau', 'Coût unitaire', 'Utilisations ce cycle', 'Total ce cycle'].map((h, i) => (
              <p key={h} className={cn('text-[10px] font-bold uppercase tracking-wider text-muted-foreground', i >= 3 && 'text-right')}>{h}</p>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-border/40">
            {filtered.map(row => {
              const level = getCreditLevel(row.unitCost);
              const summary = actionSummary[row.action] ?? { count: 0, total: 0 };
              const effectiveCost = ecoMode ? row.ecoUnitCost : row.unitCost;
              const hasActivity = summary.count > 0;

              return (
                <div
                  key={row.action}
                  className={cn(
                    'grid grid-cols-1 sm:grid-cols-[2fr_1.4fr_0.8fr_0.8fr_1fr_1fr] gap-2 sm:gap-3 px-5 py-3.5 transition-colors',
                    hasActivity ? 'hover:bg-primary/[0.03]' : 'hover:bg-muted/10 opacity-70'
                  )}
                >
                  {/* Action name */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Bot size={11} className={cn('shrink-0', hasActivity ? 'text-primary' : 'text-muted-foreground/50')} />
                      <p className="text-xs font-semibold text-foreground truncate">{row.label}</p>
                      {hasActivity && <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug line-clamp-1">{row.description}</p>
                  </div>

                  {/* Category */}
                  <div className="flex items-center">
                    <CategoryBadge category={row.category} />
                  </div>

                  {/* Level */}
                  <div className="flex items-center">
                    <LevelBadge cost={row.unitCost} />
                  </div>

                  {/* Unit cost */}
                  <div className="flex items-center sm:justify-end">
                    <div className="text-right">
                      <span className={cn('text-sm font-extrabold tabular-nums', level.color)}>
                        {effectiveCost} ⚡
                      </span>
                      {ecoMode && row.ecoUnitCost < row.unitCost && (
                        <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          <span className="line-through text-muted-foreground mr-1">{row.unitCost}</span>−50% Éco
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Count */}
                  <div className="flex items-center sm:justify-end">
                    {hasActivity
                      ? <span className="text-xs font-bold text-foreground tabular-nums">{summary.count}×</span>
                      : <span className="text-[10px] text-muted-foreground/50">—</span>
                    }
                  </div>

                  {/* Cycle total */}
                  <div className="flex items-center sm:justify-end">
                    {hasActivity
                      ? <span className={cn('text-xs font-extrabold tabular-nums', level.color)}>{summary.total} ⚡</span>
                      : <span className="text-[10px] text-muted-foreground/50">0 ⚡</span>
                    }
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer totals */}
          <div className="px-5 py-3 border-t border-border/40 bg-muted/10 flex items-center justify-between gap-4">
            <p className="text-[11px] text-muted-foreground">
              {filtered.filter(r => (actionSummary[r.action]?.count ?? 0) > 0).length} actions utilisées sur {filtered.length}
            </p>
            <p className="text-xs font-bold text-foreground tabular-nums">
              Total filtré :{' '}
              <span className="text-primary">
                {filtered.reduce((s, r) => s + (actionSummary[r.action]?.total ?? 0), 0)} ⚡
              </span>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
