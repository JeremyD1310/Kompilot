/**
 * TikTokAdsPanel — Display TikTok Ads campaign performance metrics.
 * Shows: campaigns list, spend/impressions/conversions KPIs, CPC/CPM/CTR efficiency,
 * video metrics, engagement stats, creatives.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Video, Eye, TrendingUp, DollarSign, MousePointerClick,
  Loader2, RefreshCw, AlertCircle, ExternalLink,
  PlayCircle, Target, Users, Zap, BarChart3,
  Heart, MessageCircle, Share2, UserPlus, Percent,
} from 'lucide-react';
import { Button, toast } from '@blinkdotnew/ui';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  AreaChart, Area,
} from 'recharts';
import { blink } from '../../blink/client';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TikTokStatus {
  connected: boolean;
  reason?: string;
  advertisers?: { id: string; name: string; status: string }[];
}

interface TikTokCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  budget: number;
  budgetMode: string;
  createdAt: string;
  metrics: {
    spend: number;
    impressions: number;
    clicks: number;
    cpc: number;
    cpm: number;
    ctr: number;
    conversions: number;
    costPerConversion: number;
    videoViews: number;
    video6sViews: number;
    videoP100Watched: number;
    likes: number;
    comments: number;
    shares: number;
    profileVisits: number;
    follows: number;
    conversionRate: number;
  } | null;
}

interface TikTokReport {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalReach: number;
  totalConversions: number;
  cpc: number;
  cpm: number;
  ctr: number;
  costPerConversion: number;
  videoViews: number;
  video6sViews: number;
  videoCompletionRate: number;
  engagementRate: number;
  totalEngagements: number;
  likes: number;
  comments: number;
  shares: number;
  profileVisits: number;
  follows: number;
  conversionRate: number;
}

// ── Fetchers ──────────────────────────────────────────────────────────────────

async function fetchWithAuth(url: string) {
  const token = await blink.auth.getValidToken();
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

const CAMPAIGN_COLORS = ['#00F2EA', '#FF0050', '#69C9D0', '#EE1D52', '#6C3AED'];

// ── Component ─────────────────────────────────────────────────────────────────

export function TikTokAdsPanel() {
  const [advertiserId, setAdvertiserId] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'engagement' | 'campaigns'>('overview');

  const { data: status, isLoading: loadingStatus } = useQuery<TikTokStatus>({
    queryKey: ['tiktokAdsStatus'],
    queryFn: () => fetchWithAuth('/api/tiktok/ads/status'),
    retry: false,
  });

  const selectedAdvertiser = advertiserId || status?.advertisers?.[0]?.id || '';

  const { data: campaignsData, isLoading: loadingCampaigns, refetch: refetchCampaigns } = useQuery({
    queryKey: ['tiktokCampaigns', selectedAdvertiser],
    queryFn: () => fetchWithAuth(`/api/tiktok/ads/campaigns?advertiser_id=${selectedAdvertiser}`),
    enabled: !!selectedAdvertiser && status?.connected === true,
  });

  const { data: reportData, isLoading: loadingReport } = useQuery({
    queryKey: ['tiktokReport', selectedAdvertiser],
    queryFn: () => fetchWithAuth(`/api/tiktok/ads/report?advertiser_id=${selectedAdvertiser}`),
    enabled: !!selectedAdvertiser && status?.connected === true,
  });

  const campaigns: TikTokCampaign[] = campaignsData?.campaigns || [];
  const report: TikTokReport | null = reportData?.report || null;
  const isConnected = status?.connected === true;

  const fmt = (n: number) => n.toLocaleString('fr-FR');
  const fmtEur = (n: number) => `${n.toFixed(2)} €`;
  const fmtPct = (n: number) => `${n.toFixed(2)}%`;

  const spendChartData = campaigns
    .filter(c => c.metrics)
    .slice(0, 10)
    .map((c, i) => ({
      name: c.name.length > 20 ? c.name.slice(0, 20) + '\u2026' : c.name,
      spend: c.metrics?.spend || 0,
      impressions: c.metrics?.impressions || 0,
      clicks: c.metrics?.clicks || 0,
      conversions: c.metrics?.conversions || 0,
      color: CAMPAIGN_COLORS[i % CAMPAIGN_COLORS.length],
    }));

  const performanceChartData = campaigns
    .filter(c => c.metrics)
    .slice(0, 8)
    .map((c, i) => ({
      name: c.name.length > 16 ? c.name.slice(0, 16) + '\u2026' : c.name,
      impressions: c.metrics?.impressions || 0,
      clicks: c.metrics?.clicks || 0,
      conversions: c.metrics?.conversions || 0,
      color: CAMPAIGN_COLORS[i % CAMPAIGN_COLORS.length],
    }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#00F2EA]/10 border border-[#00F2EA]/20 flex items-center justify-center">
            <Video size={18} className="text-[#00F2EA]" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-foreground">TikTok Ads</h3>
            <p className="text-[10px] text-muted-foreground">
              Performance des campagnes publicitaires TikTok
            </p>
          </div>
        </div>
        {isConnected && (
          <div className="flex items-center gap-2">
            {status.advertisers && status.advertisers.length > 1 && (
              <select
                value={selectedAdvertiser}
                onChange={(e) => setAdvertiserId(e.target.value)}
                className="text-xs border border-border bg-card rounded-lg px-2 py-1.5 text-foreground"
              >
                {status.advertisers.map(a => (
                  <option key={a.id} value={a.id}>{a.name || a.id}</option>
                ))}
              </select>
            )}
            <button
              onClick={() => { refetchCampaigns(); toast.success('Donn\u00e9es actualis\u00e9es'); }}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Not connected */}
      {!loadingStatus && !isConnected && (
        <div className="rounded-xl border border-[#00F2EA]/20 bg-[#00F2EA]/5 px-5 py-6 text-center">
          <Video size={32} className="mx-auto text-[#00F2EA]/40 mb-3" />
          <p className="text-sm font-semibold text-foreground mb-1">TikTok Ads non connect\u00e9</p>
          <p className="text-[10px] text-muted-foreground max-w-sm mx-auto mb-3">
            {status?.reason || 'Connectez votre compte TikTok Ads dans les Param\u00e8tres pour voir vos campagnes publicitaires.'}
          </p>
          <a
            href="https://ads.tiktok.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00F2EA] hover:underline"
          >
            <ExternalLink size={12} /> Ouvrir TikTok Ads Manager
          </a>
        </div>
      )}

      {loadingStatus && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      )}

      {isConnected && report && (
        <>
          {/* Primary KPI Cards — 6-up */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard icon={<DollarSign size={14} />} label="D\u00e9pense totale" value={fmtEur(report.totalSpend)} sub={`${fmt(report.totalReach)} atteints`} accent="text-[#00F2EA]" />
            <KpiCard icon={<Eye size={14} />} label="Impressions" value={fmt(report.totalImpressions)} sub={report.cpm > 0 ? `CPM ${fmtEur(report.cpm)}` : '\u2014'} accent="text-[#FF0050]" />
            <KpiCard icon={<MousePointerClick size={14} />} label="Clics" value={fmt(report.totalClicks)} sub={report.cpc > 0 ? `CPC ${fmtEur(report.cpc)}` : '\u2014'} accent="text-[#69C9D0]" />
            <KpiCard icon={<Target size={14} />} label="Conversions" value={fmt(report.totalConversions)} sub={report.conversionRate > 0 ? `Taux ${fmtPct(report.conversionRate)}` : '\u2014'} accent="text-emerald-500" />
            <KpiCard icon={<Percent size={14} />} label="CTR" value={fmtPct(report.ctr)} sub={report.costPerConversion > 0 ? `Co\u00fbt/conv. ${fmtEur(report.costPerConversion)}` : '\u2014'} accent="text-violet-500" />
            <KpiCard icon={<Heart size={14} />} label="Engagement" value={fmt(report.totalEngagements)} sub={report.engagementRate > 0 ? `Taux ${fmtPct(report.engagementRate)}` : '\u2014'} accent="text-rose-500" />
          </div>

          {/* Tab navigation */}
          <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1">
            {([['overview', "Vue d\u2019ensemble"], ['engagement', 'Engagement'], ['campaigns', 'Campagnes']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedTab(key)}
                className={`flex-1 text-xs font-semibold py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                  selectedTab === key
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Overview tab */}
          {selectedTab === 'overview' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 size={14} className="text-violet-500" />
                  <span className="text-xs font-bold text-foreground">M\u00e9triques d{"'"}efficacit\u00e9</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <EfficiencyStat label="CPC moyen" value={fmtEur(report.cpc)} quality={report.cpc < 0.5 ? 'good' : report.cpc < 1 ? 'mid' : 'bad'} />
                  <EfficiencyStat label="CPM moyen" value={fmtEur(report.cpm)} quality={report.cpm < 10 ? 'good' : report.cpm < 30 ? 'mid' : 'bad'} />
                  <EfficiencyStat label="CTR" value={fmtPct(report.ctr)} quality={report.ctr > 2 ? 'good' : report.ctr > 0.5 ? 'mid' : 'bad'} />
                  <EfficiencyStat label="Taux conversion" value={fmtPct(report.conversionRate)} quality={report.conversionRate > 3 ? 'good' : report.conversionRate > 1 ? 'mid' : 'bad'} />
                  <EfficiencyStat label="Co\u00fbt/conv." value={fmtEur(report.costPerConversion)} quality={report.costPerConversion < 5 ? 'good' : report.costPerConversion < 15 ? 'mid' : 'bad'} />
                  <EfficiencyStat label="Taux engagement" value={fmtPct(report.engagementRate)} quality={report.engagementRate > 3 ? 'good' : report.engagementRate > 1 ? 'mid' : 'bad'} />
                </div>
              </div>

              {spendChartData.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 size={14} className="text-[#00F2EA]" />
                    <span className="text-xs font-bold text-foreground">D\u00e9pense par campagne</span>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={spendChartData} margin={{ left: -10, right: 8, top: 4, bottom: 4 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={36} tickFormatter={v => `${v}\u20ac`} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="spend" name="D\u00e9pense (\u20ac)" radius={[6, 6, 0, 0]} maxBarSize={36}>
                        {spendChartData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} fillOpacity={0.85} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {performanceChartData.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye size={14} className="text-[#FF0050]" />
                    <span className="text-xs font-bold text-foreground">Impressions & Clics par campagne</span>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={performanceChartData} margin={{ left: -10, right: 8, top: 4, bottom: 4 }}>
                      <defs>
                        <linearGradient id="impGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00F2EA" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00F2EA" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF0050" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#FF0050" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={40} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="impressions" name="Impressions" stroke="#00F2EA" fill="url(#impGrad)" strokeWidth={2} />
                      <Area type="monotone" dataKey="clicks" name="Clics" stroke="#FF0050" fill="url(#clickGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {report.videoViews > 0 && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <PlayCircle size={14} className="text-[#FF0050]" />
                    <span className="text-xs font-bold text-foreground">M\u00e9triques vid\u00e9o TikTok</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Vues vid\u00e9o</p>
                      <p className="text-xl font-extrabold text-foreground">{fmt(report.videoViews)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Vues 6 secondes</p>
                      <p className="text-xl font-extrabold text-[#00F2EA]">{fmt(report.video6sViews)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {report.videoViews > 0 ? `${Math.round((report.video6sViews / report.videoViews) * 100)}%` : '\u2014'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Compl\u00e9tion 100%</p>
                      <p className="text-xl font-extrabold text-[#FF0050]">{report.videoCompletionRate}%</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Engagement tab */}
          {selectedTab === 'engagement' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <KpiCard icon={<Heart size={14} />} label="J'aime" value={fmt(report.likes)} sub="likes" accent="text-rose-500" />
                <KpiCard icon={<MessageCircle size={14} />} label="Commentaires" value={fmt(report.comments)} sub="commentaires" accent="text-blue-500" />
                <KpiCard icon={<Share2 size={14} />} label="Partages" value={fmt(report.shares)} sub="partages" accent="text-emerald-500" />
                <KpiCard icon={<Users size={14} />} label="Visites profil" value={fmt(report.profileVisits)} sub="visites" accent="text-violet-500" />
                <KpiCard icon={<UserPlus size={14} />} label="Abonn\u00e9s gagn\u00e9s" value={fmt(report.follows)} sub="follows" accent="text-amber-500" />
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <h4 className="text-xs font-bold text-foreground mb-3">Engagement par campagne</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-3 font-bold text-muted-foreground">Campagne</th>
                        <th className="text-right py-2 px-2 font-bold text-muted-foreground">J{"'"}aime</th>
                        <th className="text-right py-2 px-2 font-bold text-muted-foreground">Comment.</th>
                        <th className="text-right py-2 px-2 font-bold text-muted-foreground">Partages</th>
                        <th className="text-right py-2 px-2 font-bold text-muted-foreground">Profil</th>
                        <th className="text-right py-2 px-2 font-bold text-muted-foreground">Follows</th>
                        <th className="text-right py-2 pl-2 font-bold text-muted-foreground">Taux eng.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.filter(c => c.metrics).map((camp, i) => {
                        const m = camp.metrics!;
                        const engRate = m.impressions > 0
                          ? (((m.likes + m.comments + m.shares) / m.impressions) * 100).toFixed(2)
                          : '0';
                        return (
                          <tr key={camp.id} className="border-b border-border/50 last:border-0">
                            <td className="py-2 pr-3">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CAMPAIGN_COLORS[i % CAMPAIGN_COLORS.length] }} />
                                <span className="font-semibold text-foreground truncate max-w-[140px]">{camp.name}</span>
                              </div>
                            </td>
                            <td className="text-right py-2 px-2 text-rose-500 font-bold">{fmt(m.likes)}</td>
                            <td className="text-right py-2 px-2 text-blue-500 font-bold">{fmt(m.comments)}</td>
                            <td className="text-right py-2 px-2 text-emerald-500 font-bold">{fmt(m.shares)}</td>
                            <td className="text-right py-2 px-2 text-violet-500 font-bold">{fmt(m.profileVisits)}</td>
                            <td className="text-right py-2 px-2 text-amber-500 font-bold">{fmt(m.follows)}</td>
                            <td className="text-right py-2 pl-2 font-extrabold">{engRate}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Campaigns tab */}
          {selectedTab === 'campaigns' && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Campagnes ({campaigns.length})
              </h4>
              {campaigns.length === 0 ? (
                <div className="text-center py-6">
                  <Target size={24} className="mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">Aucune campagne trouv\u00e9e</p>
                </div>
              ) : (
                campaigns.slice(0, 20).map((camp, i) => (
                  <motion.div
                    key={camp.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl border border-border bg-card px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CAMPAIGN_COLORS[i % CAMPAIGN_COLORS.length] }} />
                          <span className="text-sm font-semibold text-foreground truncate">{camp.name}</span>
                          <span className={`shrink-0 text-[9px] font-bold rounded-full px-2 py-0.5 ${
                            camp.status === 'CAMPAIGN_STATUS_ENABLE' ? 'bg-emerald-500/10 text-emerald-600'
                              : camp.status === 'CAMPAIGN_STATUS_DISABLE' ? 'bg-red-500/10 text-red-600'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {camp.status === 'CAMPAIGN_STATUS_ENABLE' ? 'Active' : camp.status === 'CAMPAIGN_STATUS_DISABLE' ? 'Paus\u00e9e' : camp.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {camp.objective} \u00b7 Budget: {fmtEur(camp.budget)} / {camp.budgetMode === 'BUDGET_MODE_DAY' ? 'jour' : 'total'}
                        </p>
                      </div>
                    </div>

                    {camp.metrics && (
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 border-t border-border/50">
                        <MetricCell label="Impressions" value={fmt(camp.metrics.impressions)} />
                        <MetricCell label="Clics" value={fmt(camp.metrics.clicks)} accent="text-[#00F2EA]" />
                        <MetricCell label="CPC" value={fmtEur(camp.metrics.cpc)} accent="text-violet-500" />
                        <MetricCell label="CTR" value={fmtPct(camp.metrics.ctr)} accent="text-[#69C9D0]" />
                        <MetricCell label="Conversions" value={fmt(camp.metrics.conversions)} accent="text-emerald-500" />
                        <MetricCell label="Taux conv." value={fmtPct(camp.metrics.conversionRate)} accent="text-emerald-600" />
                      </div>
                    )}

                    {camp.metrics && (camp.metrics.likes > 0 || camp.metrics.comments > 0) && (
                      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/30 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Heart size={10} className="text-rose-500" />{fmt(camp.metrics.likes)}</span>
                        <span className="flex items-center gap-1"><MessageCircle size={10} className="text-blue-500" />{fmt(camp.metrics.comments)}</span>
                        <span className="flex items-center gap-1"><Share2 size={10} className="text-emerald-500" />{fmt(camp.metrics.shares)}</span>
                        {camp.metrics.video6sViews > 0 && (
                          <span className="flex items-center gap-1 ml-auto"><PlayCircle size={10} className="text-[#FF0050]" />{fmt(camp.metrics.video6sViews)} vues 6s</span>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, accent }: {
  icon: React.ReactNode; label: string; value: string; sub: string; accent: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card px-3 py-2.5 space-y-1"
    >
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-lg font-extrabold tabular-nums ${accent}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </motion.div>
  );
}

function EfficiencyStat({ label, value, quality }: {
  label: string; value: string; quality: 'good' | 'mid' | 'bad';
}) {
  const colors = { good: 'text-emerald-500', mid: 'text-amber-500', bad: 'text-red-500' };
  return (
    <div className="text-center">
      <p className="text-[10px] font-bold text-muted-foreground uppercase">{label}</p>
      <p className={`text-lg font-extrabold tabular-nums ${colors[quality]}`}>{value}</p>
    </div>
  );
}

function MetricCell({ label, value, accent }: {
  label: string; value: string; accent?: string;
}) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-xs font-bold ${accent || 'text-foreground'}`}>{value}</p>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card shadow-lg px-3 py-2 text-xs">
      <p className="font-bold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="font-extrabold ml-auto">{typeof p.value === 'number' ? p.value.toLocaleString('fr-FR') : p.value}</span>
        </div>
      ))}
    </div>
  );
}
