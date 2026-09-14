import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BarChart3, MousePointerClick, Target, Users, UserRound } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { blink } from '../../blink/client';
import { useAuth } from '../../hooks/useAuth';
import { useDemoMode } from '../../context/DemoModeContext';

interface MetricRow { postId: string; platform: string; impressions: number | string; reach: number | string; clicks: number | string; shares: number | string; comments: number | string; engagementRate: number | string; }
interface LeadRow { id: string; firstName: string; lastName: string; email?: string; source?: string; offerLabel?: string; createdAt: string; }
interface ConversionRow { id: string; eventType: string; funnelStep?: string; source?: string; metadata?: string; createdAt: string; }
interface PostRow { id: string; textContent?: string; title?: string; channels?: string; }

const n = (value: number | string | undefined) => Number(value ?? 0) || 0;
const format = (value: number) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toLocaleString('fr-FR');
const label = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

const DEMO_LEADS: LeadRow[] = [
  { id: 'demo-lead-1', firstName: 'Camille', lastName: 'Bernard', source: 'instagram', offerLabel: 'Audit visibilité', createdAt: new Date().toISOString() },
  { id: 'demo-lead-2', firstName: 'Nicolas', lastName: 'Roux', source: 'google_business', offerLabel: 'Demande de devis', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'demo-lead-3', firstName: 'Sarah', lastName: 'Martin', source: 'meta_ads', offerLabel: 'Offre découverte', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
];

export function GrowthAttributionWidget() {
  const { user } = useAuth();
  const { isDemoActive } = useDemoMode();
  const query = useQuery({
    queryKey: ['dashboard-growth-attribution', user?.id],
    enabled: Boolean(user?.id) && !isDemoActive,
    staleTime: 60_000,
    queryFn: async () => {
      const [metrics, leads, conversions, posts] = await Promise.all([
        blink.db.table<MetricRow>('post_engagement_metrics').list({ where: { userId: user!.id }, orderBy: { recordedAt: 'desc' }, limit: 200 }),
        blink.db.table<LeadRow>('captured_leads').list({ where: { userId: user!.id }, orderBy: { createdAt: 'desc' }, limit: 100 }),
        blink.db.table<ConversionRow>('conversion_events').list({ where: { userId: user!.id }, orderBy: { createdAt: 'desc' }, limit: 300 }),
        blink.db.table<PostRow>('scheduled_posts').list({ where: { userId: user!.id }, orderBy: { createdAt: 'desc' }, limit: 100 }),
      ]);
      return { metrics, leads, conversions, posts };
    },
  });

  const data = isDemoActive ? { metrics: [], leads: DEMO_LEADS, conversions: [{ id: 'demo-c1', eventType: 'Lead', metadata: '{"postId":"demo-post-1"}' }], posts: [{ id: 'demo-post-1', textContent: '5 idées pour gagner en visibilité locale' }] } : (query.data ?? { metrics: [], leads: [], conversions: [], posts: [] });
  const postMap = useMemo(() => new Map(data.posts.map(post => [post.id, post])), [data.posts]);
  const leadPostCounts = useMemo(() => {
    const counts = new Map<string, number>();
    data.conversions.forEach(event => {
      try { const postId = JSON.parse(event.metadata || '{}').postId ?? JSON.parse(event.metadata || '{}').post_id; if (postId) counts.set(postId, (counts.get(postId) ?? 0) + 1); } catch { /* malformed metadata is ignored */ }
    });
    return counts;
  }, [data.conversions]);
  const totals = useMemo(() => ({
    reach: data.metrics.reduce((sum, row) => sum + n(row.reach), 0),
    clicks: data.metrics.reduce((sum, row) => sum + n(row.clicks), 0),
    impressions: data.metrics.reduce((sum, row) => sum + n(row.impressions), 0),
    qualified: data.conversions.filter(event => ['mql', 'sql', 'opportunity', 'closedwon', 'purchase'].includes(event.eventType.toLowerCase())).length,
  }), [data]);
  const sources = useMemo(() => Object.entries(data.leads.reduce<Record<string, number>>((acc, lead) => { const source = lead.source || 'widget'; acc[source] = (acc[source] ?? 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]), [data.leads]);
  const topPosts = useMemo(() => {
    const groups = new Map<string, { clicks: number; reach: number; engagement: number; postId: string }>();
    data.metrics.forEach(row => { const current = groups.get(row.postId) ?? { postId: row.postId, clicks: 0, reach: 0, engagement: 0 }; current.clicks += n(row.clicks); current.reach += n(row.reach); current.engagement = Math.max(current.engagement, n(row.engagementRate)); groups.set(row.postId, current); });
    return [...groups.values()].sort((a, b) => (b.clicks + b.engagement * 10) - (a.clicks + a.engagement * 10)).slice(0, 3);
  }, [data.metrics]);
  const leadRate = totals.clicks ? (data.leads.length / totals.clicks) * 100 : 0;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Target size={17} /></div><div><h2 className="text-sm font-bold text-foreground">Impact acquisition & publications</h2><p className="text-[11px] text-muted-foreground">Des clics aux leads, sans optimiser sur des formulaires junk.</p></div></div>
        <Link to="/performance" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80">Analyse complète <ArrowRight size={12} /></Link>
      </div>
      {query.isError ? <p className="px-5 py-4 text-xs text-destructive">Impossible de charger les données d'attribution.</p> : (
        <div className="space-y-5 p-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Portée posts', value: format(totals.reach), icon: Users },
              { label: 'Clics qualifiés', value: format(totals.clicks), icon: MousePointerClick },
              { label: 'Leads entrants', value: String(data.leads.length), icon: UserRound },
              { label: 'Clic → lead', value: `${leadRate.toFixed(1)}%`, icon: BarChart3 },
            ].map(item => <div key={item.label} className="rounded-xl border border-border bg-muted/20 p-3"><item.icon size={14} className="mb-2 text-primary" /><p className="text-xl font-black tabular-nums text-foreground">{item.value}</p><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</p></div>)}
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <div><div className="mb-3 flex items-center justify-between"><h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sources des leads</h3><span className="text-[10px] text-muted-foreground">{totals.qualified} qualifiés</span></div><div className="space-y-2">{sources.length ? sources.map(([source, count]) => <div key={source} className="flex items-center gap-2"><span className="w-24 truncate text-xs text-foreground">{label(source)}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(8, (count / data.leads.length) * 100)}%` }} /></div><span className="w-5 text-right text-xs font-bold text-foreground">{count}</span></div>) : <p className="text-xs text-muted-foreground">Aucun lead capturé pour le moment.</p>}</div></div>
            <div><h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Publications qui contribuent</h3><div className="space-y-2">{topPosts.length ? topPosts.map(post => <div key={post.postId} className="rounded-xl border border-border px-3 py-2"><p className="truncate text-xs font-semibold text-foreground">{postMap.get(post.postId)?.textContent || postMap.get(post.postId)?.title || `Publication ${post.postId.slice(0, 8)}`}</p><p className="mt-1 text-[10px] text-muted-foreground">{format(post.reach)} portée · {format(post.clicks)} clics · {leadPostCounts.get(post.postId) ?? 0} lead(s) attribué(s)</p></div>) : <p className="text-xs text-muted-foreground">Les performances apparaîtront après synchronisation.</p>}</div></div>
          </div>
          <div className="border-t border-border pt-4"><div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Derniers leads entrants</h3><Link to="/lead-gen" className="text-[11px] font-semibold text-primary hover:underline">Voir tous les leads</Link></div><div className="grid gap-2 sm:grid-cols-3">{data.leads.slice(0, 3).map(lead => <div key={lead.id} className="rounded-xl border border-border bg-background px-3 py-2"><p className="text-xs font-bold text-foreground">{lead.firstName} {lead.lastName}</p><p className="mt-0.5 truncate text-[10px] text-muted-foreground">{label(lead.source || 'widget')} · {lead.offerLabel || 'Demande entrante'}</p></div>)}</div></div>
        </div>
      )}
    </section>
  );
}
