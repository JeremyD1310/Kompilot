import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend, Cell,
} from 'recharts';
import { Megaphone, Filter, ArrowUpDown, TrendingUp, Target, Globe } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { EngagementData } from '../../hooks/useEngagementData';

interface CampaignPerformanceProps {
  campaigns: EngagementData['campaigns'];
}

const BAR_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1',
];

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('fr-FR');
}

export function CampaignPerformance({ campaigns }: CampaignPerformanceProps) {
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [mediumFilter, setMediumFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<'totalReach' | 'totalClicks' | 'avgEngagementRate' | 'totalImpressions'>('totalReach');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Unique sources & mediums
  const sources = useMemo(() => ['all', ...Array.from(new Set(campaigns.map(c => c.utm_source).filter(Boolean)))], [campaigns]);
  const mediums = useMemo(() => ['all', ...Array.from(new Set(campaigns.map(c => c.utm_medium).filter(Boolean)))], [campaigns]);

  // Filtered & sorted campaigns
  const filtered = useMemo(() => {
    let result = [...campaigns];
    if (sourceFilter !== 'all') result = result.filter(c => c.utm_source === sourceFilter);
    if (mediumFilter !== 'all') result = result.filter(c => c.utm_medium === mediumFilter);
    result.sort((a, b) => sortDir === 'desc' ? (b[sortKey] as number) - (a[sortKey] as number) : (a[sortKey] as number) - (b[sortKey] as number));
    return result;
  }, [campaigns, sourceFilter, mediumFilter, sortKey, sortDir]);

  // Summary stats
  const totalCampaigns = campaigns.length;
  const bestCampaign = campaigns.reduce((best, c) => c.avgEngagementRate > (best?.avgEngagementRate ?? 0) ? c : best, campaigns[0]);
  const totalReach = campaigns.reduce((sum, c) => sum + c.totalReach, 0);

  // Chart data — top 8 campaigns by sort metric
  const chartData = filtered.slice(0, 8).map(c => ({
    name: c.campaign || c.utm_campaign || 'Sans nom',
    reach: c.totalReach,
    clicks: c.totalClicks,
    shares: c.totalShares,
    comments: c.totalComments,
  }));

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortHeader = ({ label, field }: { label: string; field: typeof sortKey }) => (
    <button
      type="button"
      onClick={() => toggleSort(field)}
      className={cn(
        'flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors',
        sortKey === field ? 'text-primary' : 'text-muted-foreground/60 hover:text-muted-foreground',
      )}
    >
      {label}
      {sortKey === field && <ArrowUpDown size={10} className="text-primary" />}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* ── Summary cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center shrink-0">
            <Megaphone size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total campagnes</p>
            <p className="text-2xl font-extrabold text-foreground mt-0.5">{totalCampaigns}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <Target size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Meilleure campagne</p>
            <p className="text-sm font-bold text-foreground mt-0.5 truncate max-w-[160px]">
              {bestCampaign?.campaign || bestCampaign?.utm_campaign || '—'}
            </p>
            <p className="text-[11px] text-muted-foreground">{bestCampaign ? `${bestCampaign.avgEngagementRate.toFixed(1)}% engagement` : 'Aucune donnée'}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
            <Globe size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Portée totale campagnes</p>
            <p className="text-2xl font-extrabold text-foreground mt-0.5">{formatNum(totalReach)}</p>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Filter size={13} />
          <span className="font-semibold">Filtrer :</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Source</span>
          <div className="flex gap-1">
            {sources.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setSourceFilter(s)}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-all',
                  sourceFilter === s
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
                )}
              >
                {s === 'all' ? 'Toutes' : s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Medium</span>
          <div className="flex gap-1">
            {mediums.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMediumFilter(m)}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-all',
                  mediumFilter === m
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
                )}
              >
                {m === 'all' ? 'Tous' : m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Chart ── */}
      {chartData.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-primary" />
            Comparaison des campagnes (portée vs clics)
          </h4>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="reach" name="Portée" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="clicks" name="Clics" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Table ── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Campagne</th>
                <th className="text-left px-3 py-3"><SortHeader label="Source" field="totalReach" /></th>
                <th className="text-left px-3 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Medium</th>
                <th className="text-right px-3 py-3"><SortHeader label="Posts" field="totalImpressions" /></th>
                <th className="text-right px-3 py-3"><SortHeader label="Portée" field="totalReach" /></th>
                <th className="text-right px-3 py-3"><SortHeader label="Clics" field="totalClicks" /></th>
                <th className="text-right px-3 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Partages</th>
                <th className="text-right px-3 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Commentaires</th>
                <th className="text-right px-3 py-3"><SortHeader label="Eng. %" field="avgEngagementRate" /></th>
                <th className="text-right px-3 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">CTR</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Megaphone size={28} className="text-muted-foreground/30" />
                      <p className="text-sm font-semibold text-muted-foreground">Aucune campagne trouvée</p>
                      <p className="text-xs text-muted-foreground/60">Ajoutez des paramètres UTM à vos publications pour commencer le suivi.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => (
                  <tr
                    key={`${c.campaign}-${i}`}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
                        />
                        <span className="font-semibold text-foreground truncate max-w-[140px]">{c.campaign || '—'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs bg-muted/60 text-foreground rounded-full px-2 py-0.5 font-medium">{c.utm_source || '—'}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs bg-muted/60 text-foreground rounded-full px-2 py-0.5 font-medium">{c.utm_medium || '—'}</span>
                    </td>
                    <td className="px-3 py-3 text-right text-foreground font-medium tabular-nums">{c.totalPosts}</td>
                    <td className="px-3 py-3 text-right text-foreground font-medium tabular-nums">{formatNum(c.totalReach)}</td>
                    <td className="px-3 py-3 text-right text-foreground font-medium tabular-nums">{formatNum(c.totalClicks)}</td>
                    <td className="px-3 py-3 text-right text-foreground font-medium tabular-nums">{formatNum(c.totalShares)}</td>
                    <td className="px-3 py-3 text-right text-foreground font-medium tabular-nums">{formatNum(c.totalComments)}</td>
                    <td className="px-3 py-3 text-right">
                      <span className={cn(
                        'text-xs font-bold rounded-full px-2 py-0.5',
                        c.avgEngagementRate >= 5 ? 'text-emerald-700 bg-emerald-50' :
                        c.avgEngagementRate >= 2 ? 'text-amber-700 bg-amber-50' :
                        'text-muted-foreground bg-muted/60',
                      )}>
                        {c.avgEngagementRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right text-foreground font-medium tabular-nums">{c.avgCtr.toFixed(2)}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
