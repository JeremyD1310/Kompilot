import { useState, useMemo } from 'react';
import {
  Page, PageHeader, PageTitle, PageDescription, PageActions, PageBody,
  Button, Tabs, TabsList, TabsTrigger, TabsContent,
} from '@blinkdotnew/ui';
import {
  RefreshCw, Share2, MessageSquare, MousePointerClick, Eye, Users,
  TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight,
  BarChart3, Target,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend, BarChart, Bar, Cell,
} from 'recharts';
import { useEngagementData } from '../hooks/useEngagementData';
import { CampaignPerformance } from '../components/analytics/CampaignPerformance';
import { cn } from '../lib/utils';

// ── Formatting helpers ──────────────────────────────────────────────────────
function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('fr-FR');
}

function fmtPct(n: number): string {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

// ── Sparkline mini-chart ────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 72, H = 24;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x},${y}`;
  });
  const area = `M${pts.join(' L')} L${W},${H} L0,${H} Z`;
  const uid = color.replace(/[^a-z0-9]/gi, '');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible opacity-60">
      <defs>
        <linearGradient id={`sp-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sp-${uid})`} />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Trend badge ─────────────────────────────────────────────────────────────
function TrendBadge({ change }: { change: number }) {
  const abs = Math.abs(change).toFixed(1);
  if (change > 0) return (
    <span className="flex items-center gap-0.5 text-[10px] font-bold text-white/90 bg-white/20 rounded-full px-1.5 py-0.5">
      <TrendingUp size={9} strokeWidth={3} /> +{abs}%
    </span>
  );
  if (change < 0) return (
    <span className="flex items-center gap-0.5 text-[10px] font-bold text-white/90 bg-white/20 rounded-full px-1.5 py-0.5">
      <TrendingDown size={9} strokeWidth={3} /> −{abs}%
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-[10px] font-bold text-white/70 bg-white/15 rounded-full px-1.5 py-0.5">
      <Minus size={9} strokeWidth={3} /> {abs}%
    </span>
  );
}

// ── KPI Card definition ─────────────────────────────────────────────────────
interface KPICardDef {
  key: string;
  label: string;
  icon: React.ElementType;
  bg: string;
  glow: string;
  sparkColor: string;
  iconBg: string;
  isPercent?: boolean;
  sparkData?: number[];
}

const KPI_CARDS: KPICardDef[] = [
  { key: 'totalShares', label: 'Partages', icon: Share2, bg: 'bg-gradient-to-br from-emerald-600 to-teal-400', glow: 'shadow-[0_8px_32px_-8px_rgba(16,185,129,0.5)]', sparkColor: '#a7f3d0', iconBg: 'bg-white/20' },
  { key: 'totalComments', label: 'Commentaires', icon: MessageSquare, bg: 'bg-gradient-to-br from-blue-600 to-indigo-500', glow: 'shadow-[0_8px_32px_-8px_rgba(59,130,246,0.5)]', sparkColor: '#bfdbfe', iconBg: 'bg-white/20' },
  { key: 'totalClicks', label: 'Clics', icon: MousePointerClick, bg: 'bg-gradient-to-br from-violet-600 to-purple-500', glow: 'shadow-[0_8px_32px_-8px_rgba(139,92,246,0.5)]', sparkColor: '#ddd6fe', iconBg: 'bg-white/20' },
  { key: 'totalImpressions', label: 'Impressions', icon: Eye, bg: 'bg-gradient-to-br from-amber-500 to-orange-500', glow: 'shadow-[0_8px_32px_-8px_rgba(245,158,11,0.5)]', sparkColor: '#fed7aa', iconBg: 'bg-white/20' },
  { key: 'totalReach', label: 'Portée', icon: Users, bg: 'bg-gradient-to-br from-rose-500 to-pink-500', glow: 'shadow-[0_8px_32px_-8px_rgba(244,63,94,0.5)]', sparkColor: '#fecdd3', iconBg: 'bg-white/20' },
  { key: 'avgEngagementRate', label: "Taux d'engagement", icon: Target, bg: 'bg-gradient-to-br from-green-600 to-emerald-400', glow: 'shadow-[0_8px_32px_-8px_rgba(22,163,74,0.5)]', sparkColor: '#bbf7d0', iconBg: 'bg-white/20', isPercent: true },
  { key: 'avgCtr', label: 'CTR', icon: BarChart3, bg: 'bg-gradient-to-br from-sky-600 to-cyan-400', glow: 'shadow-[0_8px_32px_-8px_rgba(2,132,199,0.5)]', sparkColor: '#bae6fd', iconBg: 'bg-white/20', isPercent: true },
];

// ── Platform colors ─────────────────────────────────────────────────────────
const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#e11d48',
  facebook: '#2563eb',
  linkedin: '#0a66c2',
  tiktok: '#000000',
  google: '#ea4335',
  twitter: '#1d9bf0',
  website: '#6366f1',
};

// ── Main page ───────────────────────────────────────────────────────────────
export default function EngagementPage() {
  const [period, setPeriod] = useState<7 | 14 | 30 | 90>(30);
  const [comparisonView, setComparisonView] = useState<'weekly' | 'monthly'>('weekly');

  const { data, isLoading, isFetching, refetch } = useEngagementData(period);

  // Derive sparkline data from trend array for each KPI
  const sparklines = useMemo(() => {
    if (!data?.trend?.length) return {};
    const keys = ['shares', 'comments', 'clicks', 'impressions', 'reach', 'engagementRate', 'ctr'] as const;
    const kpiToTrend: Record<string, string> = {
      totalShares: 'shares', totalComments: 'comments', totalClicks: 'clicks',
      totalImpressions: 'impressions', totalReach: 'reach',
      avgEngagementRate: 'engagementRate', avgCtr: 'ctr',
    };
    const result: Record<string, number[]> = {};
    for (const [kpiKey, trendKey] of Object.entries(kpiToTrend)) {
      result[kpiKey] = data.trend.map((t: Record<string, unknown>) => Number(t[trendKey]) || 0).slice(-10);
    }
    return result;
  }, [data?.trend]);

  // Trend chart data
  const trendChartData = useMemo(() => {
    if (!data?.trend?.length) return [];
    return data.trend.map((t: Record<string, unknown>) => ({
      date: typeof t.date === 'string' ? t.date.slice(5) : String(t.date), // MM-DD
      Partages: Number(t.shares) || 0,
      Commentaires: Number(t.comments) || 0,
      Clics: Number(t.clicks) || 0,
      Impressions: Number(t.impressions) || 0,
      Portée: Number(t.reach) || 0,
    }));
  }, [data?.trend]);

  // Platform chart data
  const platformChartData = useMemo(() => {
    if (!data?.platformBreakdown?.length) return [];
    return data.platformBreakdown.map((p: Record<string, unknown>) => ({
      platform: String(p.platform || 'Autre'),
      Partages: Number(p.shares) || 0,
      Commentaires: Number(p.comments) || 0,
      Clics: Number(p.clicks) || 0,
      Impressions: Number(p.impressions) || 0,
      Portée: Number(p.reach) || 0,
      engagementRate: Number(p.engagementRate) || 0,
    }));
  }, [data?.platformBreakdown]);

  // Comparison data
  const comparison = comparisonView === 'weekly' ? data?.weeklyComparison : data?.monthlyComparison;
  const compLabel = comparisonView === 'weekly' ? 'Semaine' : 'Mois';

  return (
    <Page className="page-enter">
      <PageHeader>
        <PageTitle>Engagement &amp; Campagnes</PageTitle>
        <PageDescription>
          Suivez vos métriques d'engagement, comparez les périodes et analysez vos campagnes UTM.
        </PageDescription>
        <PageActions>
          <div className="flex items-center rounded-lg border border-border overflow-hidden text-xs">
            {([7, 14, 30, 90] as const).map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setPeriod(d)}
                className={cn(
                  'px-3 py-1.5 font-medium transition-colors',
                  period === d
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:bg-muted',
                )}
              >
                {d}j
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            Actualiser
          </Button>
        </PageActions>
      </PageHeader>

      <PageBody>
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="comparisons">Comparaisons</TabsTrigger>
            <TabsTrigger value="platforms">Plateformes</TabsTrigger>
            <TabsTrigger value="campaigns">Campagnes UTM</TabsTrigger>
          </TabsList>

          {/* ── Tab: Overview ── */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {KPI_CARDS.map(card => {
                const kpi = data?.kpis?.[card.key as keyof typeof data.kpis];
                const value = kpi?.value ?? 0;
                const change = kpi?.change ?? 0;
                const Icon = card.icon;
                const sparkData = sparklines[card.key] ?? [];

                return (
                  <div
                    key={card.key}
                    className={cn(
                      'relative rounded-2xl overflow-hidden text-white flex flex-col gap-3 p-5 transition-all duration-300',
                      card.bg, card.glow,
                    )}
                  >
                    {/* Decorative circles */}
                    <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
                    <div className="absolute -bottom-5 -right-1 w-14 h-14 rounded-full bg-white/10 pointer-events-none" />

                    <div className="flex items-start justify-between relative z-10">
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', card.iconBg)}>
                        <Icon size={18} />
                      </div>
                      <TrendBadge change={change} />
                    </div>

                    <div className="relative z-10">
                      <p className="text-3xl font-extrabold tracking-tight leading-none">
                        {isLoading ? '—' : card.isPercent ? `${value.toFixed(1)}%` : fmt(value)}
                      </p>
                      <p className="text-xs mt-1 text-white/70">{card.label}</p>
                    </div>

                    <div className="relative z-10 flex items-end justify-between">
                      <p className="text-[11px] text-white/60">{fmtPct(change)} vs période préc.</p>
                      <Sparkline data={sparkData} color={card.sparkColor} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Engagement Trend Chart */}
            {trendChartData.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp size={14} className="text-primary" />
                  Tendance d'engagement ({period} derniers jours)
                </h3>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={trendChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="gShares" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gComments" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
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
                    <Area type="monotone" dataKey="Partages" stroke="#10b981" fill="url(#gShares)" strokeWidth={2} />
                    <Area type="monotone" dataKey="Commentaires" stroke="#3b82f6" fill="url(#gComments)" strokeWidth={2} />
                    <Area type="monotone" dataKey="Clics" stroke="#8b5cf6" fill="url(#gClicks)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>

          {/* ── Tab: Comparisons ── */}
          <TabsContent value="comparisons" className="space-y-6">
            {/* Toggle */}
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-lg border border-border overflow-hidden text-xs">
                {(['weekly', 'monthly'] as const).map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setComparisonView(v)}
                    className={cn(
                      'px-4 py-1.5 font-medium transition-colors',
                      comparisonView === v
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {v === 'weekly' ? 'Hebdomadaire' : 'Mensuel'}
                  </button>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                Comparez les performances de {comparisonView === 'weekly' ? 'cette semaine' : 'ce mois'} vs {comparisonView === 'weekly' ? 'la semaine dernière' : 'le mois dernier'}
              </span>
            </div>

            {/* Comparison cards grid */}
            {comparison && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(['shares', 'comments', 'clicks', 'impressions', 'reach'] as const).map(metric => {
                  const current = comparison.current?.[metric] ?? 0;
                  const previous = comparison.previous?.[metric] ?? 0;
                  const change = comparison.changes?.[metric] ?? 0;
                  const isUp = change > 0;
                  const isDown = change < 0;

                  const labels: Record<string, string> = {
                    shares: 'Partages', comments: 'Commentaires', clicks: 'Clics',
                    impressions: 'Impressions', reach: 'Portée',
                  };

                  const icons: Record<string, React.ElementType> = {
                    shares: Share2, comments: MessageSquare, clicks: MousePointerClick,
                    impressions: Eye, reach: Users,
                  };

                  const MetricIcon = icons[metric];

                  return (
                    <div key={metric} className="rounded-2xl border border-border bg-card p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <MetricIcon size={14} />
                          </div>
                          <span className="text-sm font-semibold text-foreground">{labels[metric]}</span>
                        </div>
                        <span className={cn(
                          'flex items-center gap-1 text-xs font-bold rounded-full px-2 py-0.5',
                          isUp ? 'text-emerald-700 bg-emerald-50' :
                          isDown ? 'text-red-700 bg-red-50' :
                          'text-muted-foreground bg-muted/60',
                        )}>
                          {isUp ? <ArrowUpRight size={12} /> : isDown ? <ArrowDownRight size={12} /> : <Minus size={12} />}
                          {fmtPct(change)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            {compLabel} actuelle
                          </p>
                          <p className="text-xl font-extrabold text-foreground">{fmt(current)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            {compLabel} précédente
                          </p>
                          <p className="text-xl font-extrabold text-muted-foreground/50">{fmt(previous)}</p>
                        </div>
                      </div>

                      {/* Mini progress bar showing relative size */}
                      <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-700',
                            isUp ? 'bg-emerald-500' : isDown ? 'bg-red-400' : 'bg-muted-foreground/30',
                          )}
                          style={{ width: `${Math.min(100, Math.max(5, (current / Math.max(current, previous || 1)) * 100))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── Tab: Platforms ── */}
          <TabsContent value="platforms" className="space-y-6">
            {platformChartData.length > 0 ? (
              <>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <BarChart3 size={14} className="text-primary" />
                    Répartition par plateforme
                  </h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={platformChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="platform" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
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
                      <Bar dataKey="Portée" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Clics" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Partages" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Platform detail table */}
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Plateforme</th>
                        <th className="text-right px-3 py-3 text-xs font-bold text-muted-foreground">Portée</th>
                        <th className="text-right px-3 py-3 text-xs font-bold text-muted-foreground">Impressions</th>
                        <th className="text-right px-3 py-3 text-xs font-bold text-muted-foreground">Clics</th>
                        <th className="text-right px-3 py-3 text-xs font-bold text-muted-foreground">Partages</th>
                        <th className="text-right px-3 py-3 text-xs font-bold text-muted-foreground">Commentaires</th>
                        <th className="text-right px-3 py-3 text-xs font-bold text-muted-foreground">Eng. %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {platformChartData.map((p, i) => (
                        <tr key={p.platform} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: PLATFORM_COLORS[p.platform.toLowerCase()] ?? '#6366f1' }}
                              />
                              <span className="font-semibold text-foreground capitalize">{p.platform}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right font-medium tabular-nums">{fmt(p.Portée)}</td>
                          <td className="px-3 py-3 text-right font-medium tabular-nums">{fmt(p.Impressions)}</td>
                          <td className="px-3 py-3 text-right font-medium tabular-nums">{fmt(p.Clics)}</td>
                          <td className="px-3 py-3 text-right font-medium tabular-nums">{fmt(p.Partages)}</td>
                          <td className="px-3 py-3 text-right font-medium tabular-nums">{fmt(p.Commentaires)}</td>
                          <td className="px-3 py-3 text-right">
                            <span className={cn(
                              'text-xs font-bold rounded-full px-2 py-0.5',
                              p.engagementRate >= 5 ? 'text-emerald-700 bg-emerald-50' :
                              p.engagementRate >= 2 ? 'text-amber-700 bg-amber-50' :
                              'text-muted-foreground bg-muted/60',
                            )}>
                              {p.engagementRate.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-10 text-center">
                <BarChart3 size={36} className="text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm font-semibold text-muted-foreground">Aucune donnée plateforme</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Connectez vos réseaux sociaux pour voir la répartition.</p>
              </div>
            )}
          </TabsContent>

          {/* ── Tab: Campaigns ── */}
          <TabsContent value="campaigns">
            {data?.campaigns?.length ? (
              <CampaignPerformance campaigns={data.campaigns} />
            ) : (
              <div className="rounded-2xl border border-border bg-card p-10 text-center">
                <Target size={36} className="text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm font-semibold text-muted-foreground">Aucune campagne UTM</p>
                <p className="text-xs text-muted-foreground/60 mt-1 max-w-md mx-auto">
                  Ajoutez des paramètres UTM (source, medium, campaign) à vos publications pour suivre les performances de chaque campagne marketing.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </PageBody>
    </Page>
  );
}
