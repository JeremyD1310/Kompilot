/**
 * CategoryLimits — per-category daily spending limits.
 *
 * Each AI category (Inbox, Contenu, SEO, Automatisation…) can have its own
 * independent daily cap. Progress bars + warning/blocked badges provide
 * at-a-glance feedback. All state lives in EcoModeContext (localStorage).
 */
import { useState, useCallback } from 'react';
import {
  ShieldAlert, AlertTriangle, Lock, CheckCircle2, Zap, Info, XCircle,
} from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import { cn } from '@/lib/utils';
import { useEcoMode } from '../../../context/EcoModeContext';
import { CATEGORY_META } from './consumptionData';

// ── Category icon map (reuse Lucide icons inline) ─────────────────────────────
const CAT_ICONS: Record<string, string> = {
  'Inbox & Messagerie':    '💬',
  'Génération de contenu': '✨',
  'Outils & Diagnostics':  '🔧',
  'SEO & GEO':             '🔍',
  'Automatisation':        '📅',
};

// ── Status helpers ────────────────────────────────────────────────────────────

type CapStatus = 'none' | 'safe' | 'nearing' | 'reached';

function getCapStatus(used: number, cap: number | null): CapStatus {
  if (cap === null) return 'none';
  const pct = cap > 0 ? used / cap : 0;
  if (pct >= 1)   return 'reached';
  if (pct >= 0.8) return 'nearing';
  return 'safe';
}

function getPct(used: number, cap: number | null): number {
  if (!cap || cap <= 0) return 0;
  return Math.min(100, Math.round((used / cap) * 100));
}

// ── Single category row ───────────────────────────────────────────────────────

interface CategoryRowProps {
  category: string;
}

function CategoryRow({ category }: CategoryRowProps) {
  const {
    categoryCaps, setCategoryCap,
    getCategoryDailyUsage,
  } = useEcoMode();

  const cap = categoryCaps[category] ?? null;
  const used = getCategoryDailyUsage(category);
  const status = getCapStatus(used, cap);
  const pct = getPct(used, cap);
  const meta = CATEGORY_META[category];
  const emoji = CAT_ICONS[category] ?? '⚙️';

  const [inputVal, setInputVal] = useState<string>(cap !== null ? String(cap) : '');
  const [dirty, setDirty] = useState(false);

  const handleSave = useCallback(() => {
    const val = parseInt(inputVal, 10);
    if (!inputVal.trim() || isNaN(val) || val < 1) {
      setCategoryCap(category, null);
      toast.success(`Plafond "${category}" supprimé`);
    } else {
      setCategoryCap(category, val);
      toast.success(`Plafond "${category}" fixé à ${val} ⚡/jour`);
    }
    setDirty(false);
  }, [inputVal, category, setCategoryCap]);

  const handleRemove = useCallback(() => {
    setInputVal('');
    setCategoryCap(category, null);
    setDirty(false);
    toast.success(`Plafond "${category}" supprimé`);
  }, [category, setCategoryCap]);

  // Progress bar color
  const barColor =
    status === 'reached' ? 'bg-red-500'
    : status === 'nearing' ? 'bg-amber-400'
    : 'bg-primary';

  return (
    <div className={cn(
      'rounded-2xl border p-4 space-y-3 transition-all',
      status === 'reached' ? 'border-red-200 dark:border-red-800/50 bg-red-50/60 dark:bg-red-950/20'
        : status === 'nearing' ? 'border-amber-200 dark:border-amber-800/50 bg-amber-50/60 dark:bg-amber-950/20'
        : 'border-border bg-card'
    )}>

      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0">{emoji}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {meta ? (
                <span className={cn('text-xs font-bold', meta.color)}>{meta.label}</span>
              ) : (
                <span className="text-xs font-bold text-foreground">{category}</span>
              )}
              {/* Status badges */}
              {status === 'reached' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold rounded-full bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/50 px-2 py-0.5">
                  <Lock size={9} /> Bloquée
                </span>
              )}
              {status === 'nearing' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50 px-2 py-0.5">
                  <AlertTriangle size={9} /> Proche limite
                </span>
              )}
            </div>
            {cap !== null && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {used} / {cap} ⚡ aujourd'hui{status === 'none' ? '' : ` (${pct}%)`}
              </p>
            )}
            {cap === null && (
              <p className="text-[10px] text-muted-foreground">Sans plafond — toutes les IA disponibles</p>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar (only when a cap is set) */}
      {cap !== null && (
        <div className="space-y-1">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', barColor)}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground tabular-nums">
            <span>{used} ⚡ utilisés</span>
            <span>{Math.max(0, cap - used)} ⚡ restants</span>
          </div>
        </div>
      )}

      {/* Blocked warning */}
      {status === 'reached' && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 px-3 py-2">
          <XCircle size={12} className="text-red-500 shrink-0" />
          <p className="text-[11px] font-semibold text-red-700 dark:text-red-400">
            Plafond atteint — les actions IA de cette catégorie sont bloquées jusqu'à demain.
          </p>
        </div>
      )}

      {/* Nearing warning */}
      {status === 'nearing' && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 px-3 py-2">
          <AlertTriangle size={12} className="text-amber-500 shrink-0" />
          <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
            {pct}% du plafond atteint — il reste {Math.max(0, cap! - used)} ⚡ avant blocage.
          </p>
        </div>
      )}

      {/* Cap input + controls */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-[180px]">
          <Zap size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="number"
            min="1"
            max="9999"
            value={inputVal}
            onChange={e => { setInputVal(e.target.value); setDirty(true); }}
            placeholder="ex : 20"
            className="w-full pl-7 pr-12 py-1.5 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/60"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">⚡/j</span>
        </div>
        {dirty && (
          <button
            onClick={handleSave}
            className="flex items-center gap-1 text-[11px] font-bold bg-primary text-primary-foreground rounded-xl px-2.5 py-1.5 hover:opacity-90 transition-opacity shrink-0"
          >
            <CheckCircle2 size={11} /> Appliquer
          </button>
        )}
        {cap !== null && !dirty && (
          <button
            onClick={handleRemove}
            className="text-[11px] text-muted-foreground hover:text-red-500 transition-colors shrink-0"
          >
            Supprimer
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function CategoryLimits() {
  const { categoryCaps, categoryWarnings, getCategoryDailyUsage } = useEcoMode();
  const categories = Object.keys(CATEGORY_META);

  const activeCaps = categories.filter(c => categoryCaps[c] != null).length;

  return (
    <div className="space-y-4">
      {/* Section description */}
      <div className="flex items-start gap-3 rounded-xl bg-primary/5 border border-primary/15 px-4 py-3">
        <ShieldAlert size={14} className="text-primary shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-foreground">
            Plafonds par catégorie — contrôle granulaire
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Définissez un budget quotidien indépendant pour chaque type d'action IA.
            Idéal pour confier l'app à vos employés en autorisant l'Inbox mais en bloquant
            les Scans GEO coûteux ou l'Automatisation industrielle.
          </p>
          {activeCaps > 0 && (
            <p className="text-[11px] font-semibold text-primary mt-1">
              {activeCaps} catégorie{activeCaps > 1 ? 's' : ''} limitée{activeCaps > 1 ? 's' : ''}
              {categoryWarnings.length > 0 && (
                <span className="ml-2 text-amber-600 dark:text-amber-400">
                  · ⚠️ {categoryWarnings.length} en alerte
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Info pill: how category caps interact with global cap */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Info size={11} className="shrink-0 text-muted-foreground/60" />
        <span>
          Les plafonds par catégorie s'ajoutent au plafond global — le premier atteint bloque la catégorie.
        </span>
      </div>

      {/* Category rows grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map(cat => (
          <CategoryRow key={cat} category={cat} />
        ))}
      </div>

      {/* Global summary when caps are active */}
      {activeCaps > 0 && (
        <div className="rounded-xl bg-muted/30 border border-border px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-[11px] text-muted-foreground">
            Récap journalier — catégories limitées
          </p>
          <div className="flex items-center gap-3">
            {categories.filter(c => categoryCaps[c] != null).map(cat => {
              const cap = categoryCaps[cat]!;
              const used = getCategoryDailyUsage(cat);
              const status = getCapStatus(used, cap);
              return (
                <span key={cat} className={cn(
                  'inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5 border',
                  status === 'reached' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50'
                    : status === 'nearing' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50'
                    : 'bg-muted text-muted-foreground border-border'
                )}>
                  {CAT_ICONS[cat] ?? '⚙️'} {used}/{cap}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
