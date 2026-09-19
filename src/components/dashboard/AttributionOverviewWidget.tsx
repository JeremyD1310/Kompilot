import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BarChart3, MousePointerClick, Target, Users } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { blink } from '../../blink/client';
import { BACKEND_URL } from '../../lib/backend';

interface AttributionResponse {
  totalLeads: number;
  funnel: { leads: number; qualified: number; opportunities: number };
  sources: Array<{ source: string; count: number }>;
  topPosts: Array<{ postId: string; title: string; clicks: number; reach: number; leads: number }>;
}

function label(source: string) {
  return source.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function format(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toLocaleString('fr-FR');
}

export function AttributionOverviewWidget() {
  const query = useQuery<AttributionResponse>({
    queryKey: ['attribution-overview'],
    staleTime: 60_000,
    refetchInterval: 60_000,
    queryFn: async () => {
      const token = await blink.auth.getValidToken();
      const response = await fetch(`${BACKEND_URL}/api/attribution/overview?days=30`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('Impossible de charger l’attribution');
      return response.json();
    },
  });

  if (query.isLoading) return <section className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">Chargement de l’attribution…</section>;
  if (query.isError) return <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 text-sm text-amber-800">Les données d’attribution sont temporairement indisponibles.</section>;

  const data = query.data ?? { totalLeads: 0, funnel: { leads: 0, qualified: 0, opportunities: 0 }, sources: [], topPosts: [] };
  const leadRate = data.funnel.leads ? Math.round((data.funnel.opportunities / data.funnel.leads) * 100) : 0;
  const maxSource = Math.max(...data.sources.map(item => item.count), 1);

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Target size={17} /></div>
          <div><h2 className="text-sm font-bold text-foreground">Leads & impact des publications</h2><p className="text-[11px] text-muted-foreground">Une vue canonique des sources, du funnel et des posts contributeurs.</p></div>
        </div>
        <Link to="/performance" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Voir la performance <ArrowRight size={12} /></Link>
      </div>
      <div className="space-y-5 p-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { title: 'Leads entrants', value: data.totalLeads, icon: Users },
            { title: 'MQL / SQL', value: data.funnel.qualified, icon: Target },
            { title: 'Opportunités', value: data.funnel.opportunities, icon: BarChart3 },
            { title: 'Lead → opportunité', value: `${leadRate}%`, icon: MousePointerClick },
          ].map(item => <div key={item.title} className="rounded-xl border border-border bg-muted/20 p-3"><item.icon size={14} className="mb-2 text-primary" /><p className="text-xl font-black tabular-nums text-foreground">{item.value}</p><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{item.title}</p></div>)}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <div><h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Sources des leads · 30 jours</h3><div className="space-y-2">{data.sources.length ? data.sources.map(item => <div key={item.source} className="flex items-center gap-2"><span className="w-28 truncate text-xs text-foreground">{label(item.source)}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(8, (item.count / maxSource) * 100)}%` }} /></div><span className="w-6 text-right text-xs font-bold text-foreground">{item.count}</span></div>) : <p className="text-xs text-muted-foreground">Aucun lead attribué pour le moment.</p>}</div></div>
          <div><h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Posts qui génèrent des leads</h3><div className="space-y-2">{data.topPosts.length ? data.topPosts.map(post => <div key={post.postId} className="rounded-xl border border-border px-3 py-2"><p className="truncate text-xs font-semibold text-foreground">{post.title}</p><p className="mt-1 text-[10px] text-muted-foreground">{format(post.reach)} portée · {format(post.clicks)} clics · {post.leads} lead(s)</p></div>) : <p className="text-xs text-muted-foreground">Synchronisez vos performances pour voir les contributeurs.</p>}</div></div>
        </div>
        <div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-xs text-foreground">Conseil : priorisez les posts qui génèrent des leads qualifiés, pas uniquement ceux qui maximisent la portée.</div>
      </div>
    </section>
  );
}
