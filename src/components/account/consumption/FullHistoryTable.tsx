/**
 * FullHistoryTable — full paginated + sortable + filterable
 * history of all AI credit actions for the current billing cycle.
 */
import { useState, useMemo } from 'react';
import {
  History, RefreshCw, ListFilter, Bot,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCreditLevel, type CreditSpendEntry } from '../../../lib/creditsCosts';
import { ACTION_CATEGORY, CATEGORY_META, formatDate } from './consumptionData';
import { CategoryBadge } from './CostReferenceTable';

const PAGE_SIZE = 10;
type SortField = 'date' | 'amount' | 'action';
type SortDir = 'asc' | 'desc';

interface Props {
  history: CreditSpendEntry[];
  onRefresh: () => void;
  onSeedDemo: () => void;
}

export function FullHistoryTable({ history, onRefresh, onSeedDemo }: Props) {
  const [catFilter, setCatFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let rows = catFilter === 'all'
      ? history
      : history.filter(e => ACTION_CATEGORY[e.action] === catFilter);
    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date')   cmp = a.date.localeCompare(b.date);
      if (sortField === 'amount') cmp = a.amount - b.amount;
      if (sortField === 'action') cmp = a.action.localeCompare(b.action);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return rows;
  }, [history, catFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const categories = ['all', ...Object.keys(CATEGORY_META)];

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    sortField === field
      ? (sortDir === 'desc' ? <ChevronDown size={10} className="text-primary" /> : <ChevronUp size={10} className="text-primary" />)
      : <ArrowUpDown size={10} className="text-muted-foreground/40" />
  );

  // Build pagination pages array with ellipsis
  const paginationPages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | '...')[]>((acc, p, i, arr) => {
      if (i > 0 && (arr[i - 1] as number) + 1 < p) acc.push('...');
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-muted/20">
        <div className="flex items-center gap-2">
          <History size={14} className="text-primary" />
          <p className="text-sm font-bold text-foreground">Historique complet du cycle en cours</p>
          {filtered.length > 0 && (
            <span className="text-[10px] font-semibold rounded-full bg-muted text-muted-foreground border border-border px-2 py-0.5">
              {filtered.length} entrée{filtered.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button onClick={onRefresh} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Rafraîchir">
          <RefreshCw size={12} />
        </button>
      </div>

      {/* Category filter */}
      <div className="px-5 py-3 border-b border-border/40 flex items-center gap-2 overflow-x-auto">
        <ListFilter size={12} className="text-muted-foreground shrink-0" />
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => { setCatFilter(cat); setPage(1); }}
            className={cn(
              'shrink-0 text-[10px] font-semibold rounded-full px-3 py-1 border transition-colors',
              catFilter === cat
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted/70 hover:text-foreground'
            )}
          >
            {cat === 'all' ? 'Toutes' : cat}
          </button>
        ))}
      </div>

      {/* Column headers */}
      <div className="hidden sm:grid grid-cols-[0.7fr_2fr_1.2fr_0.8fr] gap-3 px-5 py-2.5 bg-muted/10 border-b border-border/40">
        <button onClick={() => toggleSort('date')} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
          Date <SortIcon field="date" />
        </button>
        <button onClick={() => toggleSort('action')} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
          Action IA <SortIcon field="action" />
        </button>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Catégorie</p>
        <button onClick={() => toggleSort('amount')} className="flex items-center justify-end gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
          Coût <SortIcon field="amount" />
        </button>
      </div>

      {/* Rows */}
      {pageRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <History size={28} className="text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Aucune action enregistrée.</p>
          <button onClick={onSeedDemo} className="text-xs font-semibold text-primary hover:underline">
            + Charger des données de démonstration
          </button>
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {pageRows.map((entry, idx) => {
            const level = getCreditLevel(entry.amount);
            const levelDot = level.level === 1 ? '#10B981' : level.level === 2 ? '#3B82F6' : level.level === 3 ? '#F59E0B' : '#8B5CF6';
            const cat = ACTION_CATEGORY[entry.action] ?? 'Autre';
            return (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-[0.7fr_2fr_1.2fr_0.8fr] gap-2 sm:gap-3 px-5 py-3 hover:bg-muted/15 transition-colors">
                {/* Date + dot */}
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: levelDot }} />
                  <span className="text-[11px] text-foreground font-medium tabular-nums">{formatDate(entry.date)}</span>
                </div>
                {/* Action label */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <Bot size={11} className="text-primary shrink-0" />
                  <span className="text-xs text-foreground font-medium truncate">{entry.label}</span>
                </div>
                {/* Category */}
                <div className="flex items-center">
                  <CategoryBadge category={cat} />
                </div>
                {/* Cost */}
                <div className="flex items-center sm:justify-end">
                  <span className={cn('text-xs font-extrabold tabular-nums rounded-full px-2 py-0.5 border', level.bgColor, level.color, level.borderColor)}>
                    {entry.amount} ⚡
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-border/40 bg-muted/10">
          <p className="text-[11px] text-muted-foreground">Page {page}/{totalPages} · {filtered.length} entrées</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-40">
              <ChevronLeft size={13} />
            </button>
            {paginationPages.map((p, i) =>
              p === '...'
                ? <span key={`e${i}`} className="text-[10px] text-muted-foreground px-1">…</span>
                : <button key={p} onClick={() => setPage(p as number)} className={cn('w-7 h-7 rounded-lg text-[11px] font-semibold transition-colors', page === p ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground')}>
                    {p}
                  </button>
            )}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-40">
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Cycle total footer */}
      {filtered.length > 0 && (
        <div className="px-5 py-3 border-t border-border/40 bg-muted/5 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            Filtre : <strong className="text-foreground">{catFilter === 'all' ? 'Toutes catégories' : catFilter}</strong>
          </p>
          <p className="text-xs font-bold text-foreground">
            Total filtré : <span className="text-primary tabular-nums">{filtered.reduce((s, e) => s + e.amount, 0)} ⚡</span>
          </p>
        </div>
      )}
    </div>
  );
}
