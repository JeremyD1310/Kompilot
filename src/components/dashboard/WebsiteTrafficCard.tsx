import { useReducedMotion, motion } from 'framer-motion';
import { Activity, Eye, MousePointerClick, Users } from 'lucide-react';
import { useDemoMode } from '../../context/DemoModeContext';
import { useWebsiteTraffic, type WebsiteTrafficSummary } from '../../hooks/useWebsiteTraffic';

function formatNumber(value: number) { return new Intl.NumberFormat('fr-FR').format(value); }

function Sparkline({ data }: { data: number[] }) {
  const points = data.length > 1 ? data.map((value, index) => `${(index * 100) / (data.length - 1)},${100 - value}`).join(' ') : '0,80 100,80';
  return <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-32 w-full text-primary" role="img" aria-label="Sessions du site sur les sept derniers jours">
    {[25, 50, 75].map(y => <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="currentColor" opacity=".08" strokeWidth=".6" />)}
    <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    {data.map((value, index) => <circle key={index} cx={(index * 100) / Math.max(data.length - 1, 1)} cy={100 - value} r="1.6" className="fill-primary" />)}
  </svg>;
}

function DemoTraffic() {
  return <TrafficContent demo summary={{ totalSessions: 1284, totalActiveUsers: 936, totalPageViews: 2410, totalConversions: 62, conversionRate: 4.8, avgEngagementRate: 68.4, dailyBreakdown: [42, 55, 48, 68, 61, 78, 73].map((sessions, index) => ({ date: `2026-08-${String(index + 1).padStart(2, '0')}`, sessions, activeUsers: sessions, pageViews: sessions, conversions: 0, engagementRate: 0 })), dateRange: { startDate: '', endDate: '' }, fetchedAt: new Date().toISOString() }} />;
}

function TrafficContent({ summary, demo = false }: { summary: WebsiteTrafficSummary; demo?: boolean }) {
  const reducedMotion = useReducedMotion();
  const values = summary.dailyBreakdown.map(day => day.sessions);
  const max = Math.max(...values, 1);
  const kpis = [
    { label: 'Sessions', value: formatNumber(summary.totalSessions), icon: Activity },
    { label: 'Utilisateurs actifs', value: formatNumber(summary.totalActiveUsers), icon: Users },
    { label: 'Pages vues', value: formatNumber(summary.totalPageViews), icon: Eye },
    { label: 'Conversions', value: formatNumber(summary.totalConversions), icon: MousePointerClick },
  ];
  return <motion.section initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card overflow-hidden">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
      <div><div className="flex items-center gap-2"><h2 className="text-sm font-semibold text-foreground">Trafic de votre site</h2><span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${demo ? 'border-violet-200 bg-violet-50 text-violet-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{demo ? 'Mode démo' : 'GA4 connecté'}</span></div><p className="mt-1 text-xs text-muted-foreground">{demo ? 'Données de démonstration' : `Derniers 7 jours · actualisé ${new Date(summary.fetchedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}</p></div>
      <span className="text-xs font-semibold text-primary">{summary.avgEngagementRate.toLocaleString('fr-FR')} % d'engagement · {summary.conversionRate.toLocaleString('fr-FR')} % de conversion</span>
    </div>
    <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[1.2fr_1fr]"><div className="min-w-0"><div className="flex items-end justify-between"><div><p className="text-2xl font-bold tabular-nums text-foreground">{formatNumber(summary.totalSessions)}</p><p className="text-xs text-muted-foreground">sessions sur la période</p></div></div><div className="mt-4"><Sparkline data={values.map(value => Math.max(8, (value / max) * 88))} /></div><div className="mt-1 flex justify-between text-[10px] text-muted-foreground">{summary.dailyBreakdown.map(day => <span key={day.date}>{day.date.slice(8, 10)}/{day.date.slice(5, 7)}</span>)}</div></div><div className="grid grid-cols-2 gap-2">{kpis.map(({ label, value, icon: Icon }, index) => <motion.div key={label} initial={reducedMotion ? false : { opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * .05 }} className="flex items-center gap-2 rounded-lg border border-border bg-background p-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon size={15} /></div><div className="min-w-0"><p className="text-[10px] text-muted-foreground">{label}</p><p className="text-sm font-bold tabular-nums text-foreground">{value}</p></div></motion.div>)}</div></div>
  </motion.section>;
}

export function WebsiteTrafficCard() {
  const { isDemoActive } = useDemoMode();
  const query = useWebsiteTraffic(!isDemoActive);
  if (isDemoActive) return <DemoTraffic />;
  if (query.isLoading) return <div className="h-64 rounded-xl border border-border bg-card animate-pulse" aria-label="Chargement des statistiques" />;
  if (query.error) return <section className="rounded-xl border border-dashed border-border bg-card p-6"><div className="flex items-start gap-3"><Activity className="mt-0.5 text-muted-foreground" size={18} /><div><h2 className="text-sm font-semibold text-foreground">Trafic de votre site</h2><p className="mt-1 text-xs text-muted-foreground">{query.error instanceof Error ? query.error.message : 'Connectez Google Analytics 4 pour afficher vos données réelles.'}</p><a className="mt-3 inline-flex text-xs font-semibold text-primary hover:underline" href="/settings?tab=analytics">Configurer GA4</a></div></div></section>;
  return <TrafficContent summary={query.data!} />;
}
