/**
 * SocialAnalyticsPage — Dashboard de performance des posts sociaux
 *
 * Orchestrateur : imports depuis src/components/socialAnalytics/*
 */

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { blink } from '@/blink/client';
import { useTiktokMetrics, useInstagramReelsMetrics, useTriggerMetricsSync, useMetricsSyncStatus } from '@/hooks/useSocialPublish';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Button, Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  toast,
} from '@blinkdotnew/ui';
import {
  RefreshCw, Eye, MousePointerClick,
  Calendar, Zap, BarChart3, Database, Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, Cell, Legend,
} from 'recharts';

import {
  PLATFORMS, cardVariants, sectionFade,
  fmt, fmtPct, TrendBadge, buildUnifiedRows,
  type PlatformKey, type AnalyticsOverview, type ComparisonData, type UnifiedRow,
} from '@/components/socialAnalytics/types';
import { TiktokMetricsTable } from '@/components/socialAnalytics/TiktokMetricsTable';
import { InstagramReelsMetricsTable } from '@/components/socialAnalytics/InstagramReelsMetricsTable';
import { UnifiedCrossPlatformTable } from '@/components/socialAnalytics/UnifiedCrossPlatformTable';
import { ConnectionStatusWidget } from '@/components/socialAnalytics/ConnectionStatusWidget';

const BACKEND_URL = 'https://gbrhsehk.backend.blink.new';

// ── API fetch ────────────────────────────────────────────────────────────────

async function fetchAnalytics(days: number): Promise<AnalyticsOverview> {
  const token = await blink.auth.getValidToken();
  const res = await fetch(`${BACKEND_URL}/api/social-analytics/overview?days=${days}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load analytics');
  return res.json();
}

async function fetchComparison(days: number): Promise<ComparisonData> {
  const token = await blink.auth.getValidToken();
  const compareDays = days * 2;
  const res = await fetch(`${BACKEND_URL}/api/social-analytics/compare?days=${days}&compareDays=${compareDays}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load comparison');
  return res.json();
}

// ── CSV/PDF export helpers ───────────────────────────────────────────────────

function exportCSV(rows: UnifiedRow[], filename: string) {
  const header = 'Plateforme,Contenu,Vues/Impressions,Likes,Commentaires,Partages,Engagement %,Date\n';
  const csv = rows.map(r =>
    `"${PLATFORMS[r.platform]?.label || r.platform}","${r.title.replace(/"/g, '""')}",${r.views},${r.likes},${r.comments},${r.shares},${r.engagementRate.toFixed(1)},"${r.date.toLocaleDateString('fr-FR')}"`
  ).join('\n');
  const blob = new Blob([header + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

async function exportPDF(rows: UnifiedRow[], filename: string, days: number) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFontSize(16);
  doc.setTextColor(13, 148, 136);
  doc.text('Kompilot — Analytics Réseaux Sociaux', 14, 15);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Période : ${days} derniers jours · ${rows.length} publications · Exporté le ${new Date().toLocaleDateString('fr-FR')}`, 14, 22);

  const cols = ['Plateforme', 'Contenu', 'Vues', 'Likes', 'Commentaires', 'Partages', 'Eng. %', 'Date'];
  const colWidths = [30, 75, 22, 22, 28, 22, 20, 30];
  let y = 32;

  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'bold');
  let x = 14;
  cols.forEach((col, i) => { doc.text(col, x, y); x += colWidths[i]; });

  y += 2;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y, 283, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  for (const row of rows.slice(0, 60)) {
    if (y > 190) { doc.addPage(); y = 15; }
    x = 14;
    const vals = [
      PLATFORMS[row.platform]?.label || row.platform,
      row.title.substring(0, 55),
      row.views.toLocaleString('fr-FR'),
      row.likes.toLocaleString('fr-FR'),
      row.comments.toLocaleString('fr-FR'),
      row.shares.toLocaleString('fr-FR'),
      `${row.engagementRate.toFixed(1)}%`,
      row.date.toLocaleDateString('fr-FR'),
    ];
    doc.setTextColor(30, 30, 30);
    vals.forEach((val, i) => { doc.text(String(val), x, y); x += colWidths[i]; });
    y += 5;
  }

  doc.save(filename);
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function SocialAnalyticsPage() {
  const [days, setDays] = useState(30);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['social-analytics', days],
    queryFn: () => fetchAnalytics(days),
    staleTime: 60_000,
  });

  const { data: comparison } = useQuery({
    queryKey: ['social-analytics-compare', days],
    queryFn: () => fetchComparison(days),
    staleTime: 60_000,
  });

  const { data: tiktokMetricsData, isLoading: tiktokMetricsLoading } = useTiktokMetrics();
  const { data: reelsMetricsData, isLoading: reelsMetricsLoading } = useInstagramReelsMetrics();
  const triggerSync = useTriggerMetricsSync();
  const { data: syncStatus } = useMetricsSyncStatus();

  useEffect(() => { triggerSync.mutate(); /* eslint-disable-next-line */ }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const s = data?.summary;
  const platforms = data?.platformBreakdown || [];
  const trend = data?.postsTrend || [];
  const topPosts = data?.topPosts || [];

  return (
    <div className="space-y-6 p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics Réseaux Sociaux
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Performance de vos publications sur toutes les plateformes connectées
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 jours</SelectItem>
              <SelectItem value="30">30 jours</SelectItem>
              <SelectItem value="90">90 jours</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            const rows = buildUnifiedRows(tiktokMetricsData, reelsMetricsData, topPosts);
            if (rows.length > 0) exportCSV(rows, `kompilot-analytics-${days}j.csv`);
            else toast('Aucune donnée à exporter');
          }}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={async () => {
            const rows = buildUnifiedRows(tiktokMetricsData, reelsMetricsData, topPosts);
            if (rows.length > 0) await exportPDF(rows, `kompilot-analytics-${days}j.pdf`, days);
            else toast('Aucune donnée à exporter');
          }}>
            <Download className="h-4 w-4 mr-1" /> PDF
          </Button>
          {syncStatus?.lastSyncAt && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Database className="h-3.5 w-3.5" />
              Sync: {new Date(syncStatus.lastSyncAt).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      </div>

      {/* Connection Status */}
      <ConnectionStatusWidget />

      {/* KPI Summary Cards */}
      {s && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Publications', value: fmt(s.totalPosts), sub: `${s.publishedPosts} publiés · ${s.scheduledPosts} planifiés`, icon: <Calendar className="h-5 w-5 text-primary" />, bg: 'bg-primary/10', trendCur: s.totalPosts, trendPrev: comparison?.previous?.totalPosts ?? 0 },
            { label: 'Impressions', value: fmt(s.totalImpressions), sub: 'Portée consolidée', icon: <Eye className="h-5 w-5 text-blue-500" />, bg: 'bg-blue-500/10', trendCur: s.totalImpressions, trendPrev: comparison?.previous?.totalImpressions ?? 0 },
            { label: 'Clics', value: fmt(s.totalClicks), sub: `${fmt(s.totalShares)} partages`, icon: <MousePointerClick className="h-5 w-5 text-emerald-500" />, bg: 'bg-emerald-500/10', trendCur: s.totalClicks, trendPrev: comparison?.previous?.totalClicks ?? 0 },
            { label: 'Engagement', value: fmtPct(s.avgEngagementRate), sub: `${fmt(s.totalComments)} commentaires`, icon: <Zap className="h-5 w-5 text-orange-500" />, bg: 'bg-orange-500/10', trendCur: s.avgEngagementRate, trendPrev: comparison?.previous?.avgEngagementRate ?? 0 },
          ].map((kpi, i) => (
            <motion.div key={kpi.label} custom={i} initial="hidden" animate="visible" variants={cardVariants}>
              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{kpi.label}</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{kpi.value}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground">{kpi.sub}</p>
                        <TrendBadge current={kpi.trendCur} previous={kpi.trendPrev} label="vs préc." />
                      </div>
                    </div>
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', kpi.bg)}>
                      {kpi.icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Platform Breakdown Cards */}
      <motion.div variants={sectionFade} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}>
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Par plateforme</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {platforms.map((p, idx) => {
              const cfg = PLATFORMS[p.platform as PlatformKey];
              return (
                <motion.div key={p.platform} custom={idx} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={cardVariants}>
                  <Card className="border-l-4" style={{ borderLeftColor: cfg?.color || '#6366f1' }}>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{cfg?.icon || '📱'}</span>
                        <span className="text-sm font-semibold text-foreground">{cfg?.label || p.platform}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">Posts</span><span className="font-medium">{p.postCount}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">Impressions</span><span className="font-medium">{fmt(p.totalImpressions)}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">Clics</span><span className="font-medium">{fmt(p.totalClicks)}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">Engagement</span><span className="font-medium">{fmtPct(p.avgEngagementRate)}</span></div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Unified Cross-Platform Analytics */}
      <motion.div variants={sectionFade} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}>
        <UnifiedCrossPlatformTable
          tiktokData={tiktokMetricsData}
          reelsData={reelsMetricsData}
          topPostsData={topPosts}
          loading={tiktokMetricsLoading || reelsMetricsLoading}
        />
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={sectionFade} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Évolution des publications</CardTitle>
              <CardDescription>Nombre de posts et impressions par jour</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="gradPosts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.677 0.157 35.2)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="oklch(0.677 0.157 35.2)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradImpressions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1877F2" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#1877F2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="posts" name="Posts" stroke="oklch(0.677 0.157 35.2)" fill="url(#gradPosts)" strokeWidth={2} />
                  <Area type="monotone" dataKey="impressions" name="Impressions" stroke="#1877F2" fill="url(#gradImpressions)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Impressions par plateforme</CardTitle>
              <CardDescription>Comparaison de la portée entre plateformes</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={platforms.filter(p => p.postCount > 0)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis type="category" dataKey="platform" tick={{ fontSize: 11 }} width={100} tickFormatter={(v: string) => PLATFORMS[v as PlatformKey]?.label || v} />
                  <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} formatter={(value: number) => [fmt(value), 'Impressions']} />
                  <Bar dataKey="totalImpressions" radius={[0, 4, 4, 0]}>
                    {platforms.filter(p => p.postCount > 0).map((p) => (
                      <Cell key={p.platform} fill={PLATFORMS[p.platform as PlatformKey]?.color || '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* TikTok Performance */}
      <motion.div variants={sectionFade} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}>
        <TiktokMetricsTable data={tiktokMetricsData} loading={tiktokMetricsLoading} />
      </motion.div>

      {/* Instagram Reels Performance */}
      <motion.div variants={sectionFade} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}>
        <InstagramReelsMetricsTable />
      </motion.div>

      {/* Top Posts Table */}
      <motion.div variants={sectionFade} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top publications</CardTitle>
            <CardDescription>Les {Math.min(topPosts.length, 10)} posts les plus performants sur la période</CardDescription>
          </CardHeader>
          <CardContent>
            {topPosts.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Aucune donnée de performance disponible</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Publiez des posts et connectez vos plateformes pour voir les métriques</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Contenu</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Canaux</th>
                      <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Impressions</th>
                      <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Clics</th>
                      <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Partages</th>
                      <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Engagement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPosts.slice(0, 10).map((post) => {
                      let channels: string[] = [];
                      try { channels = JSON.parse(post.channels || '[]'); } catch {}
                      return (
                        <tr key={post.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-3 max-w-[300px]"><p className="text-sm text-foreground truncate">{post.textContent}</p></td>
                          <td className="py-2.5 px-3">
                            <div className="flex gap-1 flex-wrap">
                              {channels.map((ch, i) => {
                                const cfg = PLATFORMS[ch as PlatformKey];
                                return cfg ? <span key={i} className="text-xs">{cfg.icon}</span> : null;
                              })}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right text-sm font-medium">{fmt(post.impressions)}</td>
                          <td className="py-2.5 px-3 text-right text-sm">{fmt(post.clicks)}</td>
                          <td className="py-2.5 px-3 text-right text-sm">{fmt(post.shares)}</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className={`text-sm font-medium ${post.engagementRate > 3 ? 'text-emerald-600 dark:text-emerald-400' : post.engagementRate > 1 ? 'text-orange-500 dark:text-orange-400' : 'text-muted-foreground'}`}>
                              {fmtPct(post.engagementRate)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
