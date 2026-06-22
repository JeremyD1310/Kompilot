/**
 * ConsumptionTab — "Ma Consommation" dashboard tab.
 *
 * Sub-modules:
 *   consumption/consumptionData.ts     — shared data, types, helpers, seed
 *   consumption/CostReferenceTable.tsx — full tariff grid + cycle totals per action
 *   consumption/FullHistoryTable.tsx   — paginated, filterable, sortable history
 *   consumption/CategoryAggregates.tsx — progress bars per category
 *   consumption/RefundHistory.tsx      — log of automatic daily refunds
 */
import React, { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip as RechartTooltip,
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  Zap, Leaf, Gauge, AlertTriangle, Settings,
  CheckCircle2, TrendingUp, Info, Lock,
} from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import { cn } from '@/lib/utils';
import { useCredits } from '../../context/CreditsContext';
import { useEcoMode } from '../../context/EcoModeContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { getCreditSpendHistory, getWeeklySpendSummary } from '../../lib/creditsCosts';
import { buildDonutData, buildActionSummary, seedDemoHistory, SLICE_COLORS } from './consumption/consumptionData';
import { CostReferenceTable } from './consumption/CostReferenceTable';
import { FullHistoryTable } from './consumption/FullHistoryTable';
import { CategoryAggregates } from './consumption/CategoryAggregates';
import { CategoryLimits } from './consumption/CategoryLimits';
import { RefundHistory } from './consumption/RefundHistory';
import type { CreditSpendEntry } from '../../lib/creditsCosts';

// ── Tiny shared UI ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={onChange}
      className={cn('relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30', checked ? 'bg-primary' : 'bg-muted-foreground/25')}
    >
      <span className={cn('pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200', checked ? 'translate-x-5' : 'translate-x-0')} />
    </button>
  );
}

function KpiCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 space-y-1">
      <div className={cn('flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide', color)}>{icon}<span>{label}</span></div>
      <p className={cn('text-2xl font-extrabold tabular-nums leading-none', color)}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function DonutCenter({ cx, cy, total }: { cx: number; cy: number; total: number }) {
  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" style={{ fontSize: 22, fontWeight: 800, fill: 'var(--foreground)' }}>{total}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" style={{ fontSize: 11, fill: 'var(--muted-foreground)' }}>⚡ utilisés</text>
    </g>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ConsumptionTab() {
  const { usage, limit } = useCredits();
  const { ecoMode, toggleEcoMode, dailyCap, setDailyCap, dailyUsage, isDailyCapReached, isDailyCapNearing, categoryWarnings, thresholdAlert, setThresholdAlert } = useEcoMode();
  const { currentPlan } = useSubscription();

  const [history, setHistory] = useState<CreditSpendEntry[]>(() => getCreditSpendHistory());
  const [capInput, setCapInput] = useState<string>(dailyCap !== null ? String(dailyCap) : '');
  const [capDirty, setCapDirty] = useState(false);

  const weeklyData    = useMemo(() => getWeeklySpendSummary(), [history.length]);
  const donutData     = useMemo(() => buildDonutData(history), [history]);
  const actionSummary = useMemo(() => buildActionSummary(history), [history]);
  const totalUsed     = history.reduce((s, e) => s + e.amount, 0);
  const remaining     = Math.max(0, limit - usage);
  const pctUsed       = limit > 0 ? Math.round((usage / limit) * 100) : 0;
  const isNearLimit   = pctUsed >= 80;

  const handleRefresh  = () => setHistory(getCreditSpendHistory());
  const handleSeedDemo = () => { seedDemoHistory(); setHistory(getCreditSpendHistory()); toast.success('Données de démonstration chargées ✨'); };

  const handleSaveCap = () => {
    const val = parseInt(capInput, 10);
    if (!capInput.trim() || isNaN(val) || val < 1) { setDailyCap(null); toast.success('Plafond journalier supprimé'); }
    else { setDailyCap(val); toast.success(`Plafond journalier fixé à ${val} ⚡/jour`); }
    setCapDirty(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard icon={<Zap size={11} />} label="Aujourd'hui" value={`${dailyUsage} ⚡`} sub={dailyCap !== null ? `/ ${dailyCap} max` : 'Sans plafond'} color={isDailyCapReached ? 'text-red-600' : 'text-teal-600'} />
        <KpiCard icon={<TrendingUp size={11} />} label="Ce mois" value={`${usage} ⚡`} sub={`sur ${limit} (${pctUsed}%)`} color={isNearLimit ? 'text-amber-600' : 'text-primary'} />
        <KpiCard icon={<Gauge size={11} />} label="Restants" value={`${remaining} ⚡`} sub={currentPlan.name} color={remaining === 0 ? 'text-red-600' : 'text-foreground'} />
        <KpiCard icon={<Leaf size={11} />} label="Mode actif" value={ecoMode ? 'Éco 🌿' : 'Premium ⚡'} sub={ecoMode ? 'Coût ×0.5 (niv.1)' : 'Puissance max'} color={ecoMode ? 'text-emerald-600' : 'text-violet-600'} />
      </div>

      {/* ── Monthly threshold warning ── */}
      {isNearLimit && (
        <div className="flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 px-4 py-3">
          <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Consommation élevée — {pctUsed}% du forfait mensuel utilisé</p>
            <p className="text-[11px] text-amber-600/80 dark:text-amber-500 mt-0.5">
              Il vous reste {remaining} ⚡. Activez le Mode Éco pour économiser jusqu'à 50% sur les actions simples.
            </p>
          </div>
        </div>
      )}

      {/* ── Daily cap nearing warning ── */}
      {isDailyCapNearing && !isDailyCapReached && (
        <div className="flex items-start gap-3 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/50 px-4 py-3">
          <AlertTriangle size={14} className="text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-orange-700 dark:text-orange-400">Plafond journalier global bientôt atteint</p>
            <p className="text-[11px] text-orange-600/80 dark:text-orange-500 mt-0.5">
              {dailyUsage} / {dailyCap} ⚡ utilisés aujourd'hui ({Math.round((dailyUsage / dailyCap!) * 100)}%). Les IA se bloqueront à {dailyCap} ⚡.
            </p>
          </div>
        </div>
      )}

      {/* ── Per-category cap warnings ── */}
      {categoryWarnings.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 px-4 py-3">
          <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
              {categoryWarnings.length} catégorie{categoryWarnings.length > 1 ? 's' : ''} proche{categoryWarnings.length > 1 ? 's' : ''} de leur plafond journalier
            </p>
            <p className="text-[11px] text-amber-600/80 dark:text-amber-500 mt-0.5">
              {categoryWarnings.join(', ')} — vérifiez les plafonds par catégorie ci-dessous.
            </p>
          </div>
        </div>
      )}

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Donut */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-sm font-bold text-foreground mb-4">Répartition par catégorie</p>
          {donutData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[180px] text-center gap-3">
              <Zap size={28} className="text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">Aucune consommation ce mois.</p>
              <button onClick={handleSeedDemo} className="text-[11px] font-semibold text-primary hover:underline">+ Charger des données de démo</button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="shrink-0">
                <PieChart width={160} height={160}>
                  <Pie data={donutData} cx={75} cy={75} innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none">
                    {donutData.map((_, i) => <Cell key={i} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />)}
                  </Pie>
                  <DonutCenter cx={75} cy={75} total={totalUsed} />
                  <RechartTooltip formatter={(v: number, name: string) => [`${v} ⚡`, name]} contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)' }} />
                </PieChart>
              </div>
              <div className="flex-1 space-y-1.5">
                {donutData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: SLICE_COLORS[i % SLICE_COLORS.length] }} />
                    <p className="text-[11px] text-foreground/80 flex-1 truncate">{d.name}</p>
                    <p className="text-[11px] font-bold text-foreground tabular-nums">{d.pct}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Weekly bar */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-sm font-bold text-foreground mb-4">Activité des 7 derniers jours</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyData} barSize={18} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <RechartTooltip formatter={(v: number) => [`${v} ⚡`, 'Crédits']} contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)' }} />
              <Bar dataKey="total" fill="#0D9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Category aggregates ── */}
      {history.length > 0 && <CategoryAggregates history={history} />}

      {/* ── Full cost breakdown (tariff grid) ── */}
      <CostReferenceTable ecoMode={ecoMode} actionSummary={actionSummary} />

      {/* ── Full history table ── */}
      <FullHistoryTable history={history} onRefresh={handleRefresh} onSeedDemo={handleSeedDemo} />

      {/* ── Refund history ── */}
      <RefundHistory />

      {/* ── Mode Éco / Rapidité ── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60 bg-muted/20 flex items-center gap-2">
          <Leaf size={14} className="text-emerald-600" />
          <p className="text-sm font-bold text-foreground">Mode Éco / Rapidité</p>
        </div>
        <div className="px-5 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-foreground">{ecoMode ? '🌿 Mode Éco activé' : '⚡ Mode Premium activé'}</p>
                <span className={cn('text-[10px] font-bold rounded-full px-2 py-0.5 border', ecoMode ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50' : 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800/50')}>
                  {ecoMode ? '×0.5 crédits (niv.1)' : 'Puissance max'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {ecoMode ? 'Les actions rapides (réponses Inbox, génération de post) consomment 0.5 ⚡ au lieu de 1 ⚡. Les actions complexes (Radar GEO, Calendrier en masse) restent inchangées.' : 'L\'IA utilise ses modèles de pointe pour des analyses chirurgicales et des réponses d\'une précision maximale. Coûts complets.'}
              </p>
            </div>
            <Toggle checked={ecoMode} onChange={() => { toggleEcoMode(); toast.success(ecoMode ? '⚡ Mode Premium activé' : '🌿 Mode Éco activé — économies ×2 sur actions simples'); }} />
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { label: 'Réponse IA Inbox',    eco: '0.5 ⚡', premium: '1 ⚡',  changed: true },
              { label: 'Génération de post',  eco: '0.5 ⚡', premium: '1 ⚡',  changed: true },
              { label: 'Dictée vocale',       eco: '0.5 ⚡', premium: '1 ⚡',  changed: true },
              { label: 'Script vidéo',        eco: '5 ⚡',   premium: '5 ⚡',  changed: false },
              { label: 'Scan Radar GEO',      eco: '10 ⚡',  premium: '10 ⚡', changed: false },
              { label: 'Calendrier en masse', eco: '30 ⚡',  premium: '30 ⚡', changed: false },
            ].map(row => (
              <div key={row.label} className={cn('rounded-xl px-3 py-2.5 border text-center', row.changed && ecoMode ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50' : 'bg-muted/30 border-border')}>
                <p className="text-[10px] text-muted-foreground mb-1 leading-tight">{row.label}</p>
                <p className={cn('text-sm font-extrabold', row.changed && ecoMode ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground')}>{ecoMode ? row.eco : row.premium}</p>
                {row.changed && ecoMode && <p className="text-[9px] text-emerald-600/70 mt-0.5">−50%</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Per-category daily limits ── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60 bg-muted/20 flex items-center gap-2">
          <Settings size={14} className="text-primary" />
          <p className="text-sm font-bold text-foreground">Plafonds journaliers par catégorie</p>
        </div>
        <div className="px-5 py-5">
          <CategoryLimits />
        </div>
      </div>

      {/* ── Global budget limits ── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60 bg-muted/20 flex items-center gap-2">
          <Settings size={14} className="text-primary" />
          <p className="text-sm font-bold text-foreground">Plafond global & alertes</p>
        </div>
        <div className="divide-y divide-border/60">
          {/* Daily cap */}
          <div className="px-5 py-4">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5"><Lock size={13} className="text-primary" /> Plafond journalier</p>
                <p className="text-xs text-muted-foreground mt-0.5">Limite la consommation quotidienne — idéal pour confier l'app à vos employés sans risque.</p>
              </div>
              {dailyCap !== null && (
                <span className="text-[10px] font-bold rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 shrink-0 mt-1">{dailyUsage} / {dailyCap} aujourd'hui</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-[200px]">
                <Zap size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="number" min="1" max="9999" value={capInput} onChange={e => { setCapInput(e.target.value); setCapDirty(true); }} placeholder="ex : 30" className="w-full pl-8 pr-14 py-2 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">⚡/j</span>
              </div>
              {capDirty && <button onClick={handleSaveCap} className="flex items-center gap-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-xl px-3 py-2 hover:opacity-90 transition-opacity"><CheckCircle2 size={12} /> Enregistrer</button>}
              {dailyCap !== null && !capDirty && <button onClick={() => { setCapInput(''); setCapDirty(true); }} className="text-xs text-muted-foreground hover:text-red-500 transition-colors">Supprimer</button>}
            </div>
            {isDailyCapReached && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 px-3 py-2">
                <AlertTriangle size={12} className="text-red-500 shrink-0" />
                <p className="text-[11px] text-red-700 dark:text-red-400 font-semibold">Plafond journalier atteint — les fonctions IA sont bloquées jusqu'à demain.</p>
              </div>
            )}
          </div>
          {/* 80% alert */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5"><AlertTriangle size={13} className="text-amber-500" /> Alerte à 80% du forfait</p>
                <p className="text-xs text-muted-foreground mt-0.5">Recevez une notification push et un email quand vous approchez de la limite mensuelle.</p>
              </div>
              <Toggle checked={thresholdAlert} onChange={() => { setThresholdAlert(!thresholdAlert); toast.success(!thresholdAlert ? 'Alerte 80% activée' : 'Alerte 80% désactivée'); }} />
            </div>
            {thresholdAlert && (
              <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                <Info size={11} className="shrink-0" />
                Alerte envoyée à <strong className="text-foreground">{Math.round(limit * 0.8)} ⚡</strong> utilisés ({limit > 0 ? 80 : 0}% de {limit} ⚡).
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
