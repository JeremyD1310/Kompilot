import { useCallback, useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, BarChart3, Minus, RefreshCw, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Button, Card, CardContent, toast } from '@blinkdotnew/ui';
import { useDemoMode } from '../../context/DemoModeContext';
import { fetchAdvisoryImpact } from '../../lib/advisoryApi';
import type { AdvisoryImpactReport, AdvisoryMetricSnapshot } from '../../lib/advisoryTypes';

const DEMO_IMPACT: AdvisoryImpactReport = {
  recommendationAt: '2026-07-18T09:30:00.000Z',
  before: { posts: 8, impressions: 18400, reach: 12100, clicks: 246, engagementRate: 4.2 },
  after: { posts: 11, impressions: 27100, reach: 18900, clicks: 418, engagementRate: 6.8 },
  hasAfterData: true,
};

const metricLabels: { key: keyof AdvisoryMetricSnapshot; label: string; suffix?: string }[] = [
  { key: 'impressions', label: 'Impressions' },
  { key: 'reach', label: 'Portée' },
  { key: 'clicks', label: 'Clics' },
  { key: 'engagementRate', label: 'Engagement moyen', suffix: '%' },
  { key: 'posts', label: 'Publications' },
];

function formatValue(value: number, suffix = '') {
  if (suffix) return `${value.toFixed(1)}${suffix}`;
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(Math.round(value));
}

function Delta({ before, after }: { before: number; after: number }) {
  if (!before) return <span className="text-xs text-muted-foreground">—</span>;
  const percent = ((after - before) / before) * 100;
  const positive = percent > 0;
  const neutral = Math.abs(percent) < 0.1;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${neutral ? 'text-muted-foreground' : positive ? 'text-emerald-600' : 'text-red-600'}`}>
      {neutral ? <Minus size={12} /> : positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {neutral ? 'Stable' : `${positive ? '+' : ''}${percent.toFixed(0)}%`}
    </span>
  );
}

export function AdvisoryImpactComparison() {
  const { isDemoActive } = useDemoMode();
  const [impact, setImpact] = useState<AdvisoryImpactReport | null>(isDemoActive ? DEMO_IMPACT : null);
  const [loading, setLoading] = useState(!isDemoActive);

  const loadImpact = useCallback(async () => {
    if (isDemoActive) {
      setImpact(DEMO_IMPACT);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setImpact(await fetchAdvisoryImpact());
    } catch (error) {
      toast.error('Comparaison indisponible', { description: error instanceof Error ? error.message : 'Réessayez plus tard.' });
    } finally {
      setLoading(false);
    }
  }, [isDemoActive]);

  useEffect(() => { loadImpact(); }, [loadImpact]);

  if (loading && !impact) return <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />;
  if (!impact) return <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Générez une analyse IA pour commencer le suivi avant / après.</CardContent></Card>;

  const hasAfter = impact.hasAfterData && impact.after;
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0"><BarChart3 size={19} /></div>
            <div>
              <h2 className="font-bold text-slate-900">Impact des recommandations</h2>
              <p className="text-xs text-slate-500 mt-1">Comparaison des métriques sociales depuis la dernière analyse IA.</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={loadImpact} disabled={loading} aria-label="Actualiser la comparaison">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-5 text-center">
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] uppercase tracking-wide text-slate-400">Avant</p><p className="text-sm font-bold text-slate-800 mt-1">{new Date(impact.recommendationAt).toLocaleDateString('fr-FR')}</p></div>
          <div className="flex items-center justify-center text-slate-300">→</div>
          <div className="rounded-xl bg-teal-50 p-3"><p className="text-[10px] uppercase tracking-wide text-teal-700">Après</p><p className="text-sm font-bold text-teal-800 mt-1">{hasAfter ? 'Données reçues' : 'En attente'}</p></div>
        </div>

        {!hasAfter && <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 mb-4">Les recommandations sont enregistrées. Publiez-les puis revenez ici quand les premières métriques seront synchronisées.</div>}

        {/* Bar chart comparison */}
        {hasAfter && (() => {
          const chartData = metricLabels.slice(0, 4).map(({ key, label, suffix }) => ({
            name: label,
            Avant: Math.round(impact.before[key]),
            Après: Math.round(impact.after[key]),
            suffix,
          }));
          return (
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-3">
                <TrendingUp size={13} className="text-teal-600" />
                <p className="text-xs font-bold text-slate-700">Évolution graphique</p>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} barSize={20} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}
                    formatter={(value: number, name: string) => [value.toLocaleString('fr-FR'), name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Avant" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Après" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        })()}

        <div className="space-y-3">
          {metricLabels.map(({ key, label, suffix }) => {
            const before = impact.before[key];
            const after = hasAfter ? impact.after[key] : before;
            const max = Math.max(before, after, 1);
            return (
              <div key={key}>
                <div className="flex items-center justify-between gap-3 mb-1"><span className="text-xs font-semibold text-slate-700">{label}</span><div className="flex items-center gap-2"><span className="text-[11px] text-slate-400">{formatValue(before, suffix)} → {hasAfter ? formatValue(after, suffix) : '—'}</span>{hasAfter && <Delta before={before} after={after} />}</div></div>
                <div className="grid grid-cols-2 gap-1.5"><div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-slate-300" style={{ width: `${(before / max) * 100}%` }} /></div><div className="h-2 rounded-full bg-teal-50 overflow-hidden"><div className="h-full rounded-full bg-teal-600" style={{ width: `${(after / max) * 100}%` }} /></div></div>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-400 mt-5">Source : métriques sociales Kompilot · analyse du {new Date(impact.recommendationAt).toLocaleDateString('fr-FR')}</p>
      </CardContent>
    </Card>
  );
}
