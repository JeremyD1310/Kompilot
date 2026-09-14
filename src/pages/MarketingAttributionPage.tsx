import { useEffect, useState } from 'react';
import { Button, Page, PageBody, PageDescription, PageHeader, PageTitle, toast } from '@blinkdotnew/ui';
import { CheckCircle2, DollarSign, Link2, RefreshCw, TrendingUp, Users } from 'lucide-react';
import { backendFetch, authHeaders, readBackendError } from '../lib/backend';

type Channel = { channel: string; spendCents: number; revenueCents: number; leads: number; customers: number; impressions: number; clicks: number; conversions: number; cacCents: number | null; contributionPct: number };
type AttributionModel = 'last_touch' | 'first_touch' | 'linear' | 'position_based';
type Overview = { model: AttributionModel; models: AttributionModel[]; channels: Channel[]; totals: { spendCents: number; revenueCents: number; leads: number; customers: number; unattributedRevenueCents: number }; confidence: string; period: { days: number } };
const EMPTY_OVERVIEW: Overview = { model: 'last_touch', models: ['last_touch', 'first_touch', 'linear', 'position_based'], channels: [], totals: { spendCents: 0, revenueCents: 0, leads: 0, customers: 0, unattributedRevenueCents: 0 }, confidence: 'no_spend_data', period: { days: 30 } };
const label = (value: string) => ({ meta_ads: 'Meta Ads', google_ads: 'Google Ads', linkedin_ads: 'LinkedIn Ads', tiktok_ads: 'TikTok Ads', organic: 'Organique', email: 'Email', unattributed: 'Non attribué' }[value] || value.replace(/_/g, ' '));
const safeNumber = (value: unknown) => { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; };
const money = (cents: number) => `${Math.round(safeNumber(cents) / 100).toLocaleString('fr-FR')} €`;

export default function MarketingAttributionPage() {
  const [data, setData] = useState<Overview | null>(EMPTY_OVERVIEW);
  const [syncing, setSyncing] = useState(false);
  const [days, setDays] = useState(30);
  const [model, setModel] = useState<AttributionModel>('last_touch');
  const [connections, setConnections] = useState<{ meta: boolean; google: boolean; tiktok?: boolean; googleStatus?: string } | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const load = async () => {
    setLoadError(null);
    try {
      const response = await backendFetch(`/api/marketing-attribution/overview?days=${days}&model=${model}`, { headers: await authHeaders() });
      if (!response.ok) throw await readBackendError(response, 'Impossible de charger l’attribution');
      const nextData = await response.json() as Overview;
      setData(nextData);
      setModel(nextData.model || model);
      try {
        const connectionResponse = await backendFetch('/api/marketing-attribution/connections', { headers: await authHeaders() });
        if (!connectionResponse.ok) throw await readBackendError(connectionResponse, 'Impossible de vérifier les connexions');
        setConnections(await connectionResponse.json() as { meta: boolean; google: boolean; googleStatus?: string });
        setConnectionError(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Impossible de vérifier les connexions';
        setConnectionError(message);
        toast.error(message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Attribution indisponible';
      setLoadError(message);
      toast.error(message);
    }
  };
  // The focused workspace is intentionally quiet on first paint. Load live data
  // only after an explicit refresh/sync action so an auth-hydration race cannot
  // create background 401s before the user asks for attribution data.
  const sync = async () => {
    setSyncing(true);
    try {
      const response = await backendFetch('/api/marketing-attribution/sync', { method: 'POST', headers: await authHeaders(true), body: JSON.stringify({ days }) });
      if (!response.ok) throw await readBackendError(response, 'Synchronisation publicitaire impossible');
      const result = await response.json() as { synced: number; platforms: { meta: boolean; google: boolean } };
      toast.success(`${result.synced} ligne(s) publicitaire(s) synchronisée(s)`);
      await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Synchronisation impossible'); } finally { setSyncing(false); }
  };
  const view = data;
  const totalCustomers = safeNumber(view?.totals.customers);
  const channels = view?.channels || [];
  const totalCac = totalCustomers ? Math.round(safeNumber(view?.totals.spendCents) / totalCustomers) : 0;
  const maxRevenue = Math.max(...channels.map(item => safeNumber(item.revenueCents)), 1);
  const connected = view?.confidence === 'connected';
  const totalSpend = safeNumber(view?.totals.spendCents);
  const totalRevenue = safeNumber(view?.totals.revenueCents);
  const googleLabel = connections?.google ? 'connecté' : connections?.googleStatus === 'partial' ? 'configuration partielle' : 'à configurer';
  if (!view) return <Page className="page-enter"><PageHeader><PageTitle>CA & CAC réels</PageTitle><PageDescription>Chargement des données d’attribution…</PageDescription></PageHeader><PageBody>{loadError ? <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">{loadError}<button onClick={() => void load()} className="ml-3 font-semibold underline">Réessayer</button></div> : <div className="grid gap-4 md:grid-cols-2"><div className="h-28 animate-pulse rounded-2xl bg-muted" /><div className="h-28 animate-pulse rounded-2xl bg-muted" /><div className="h-64 animate-pulse rounded-2xl bg-muted md:col-span-2" /></div>}</PageBody></Page>;
  return <Page className="page-enter"><PageHeader><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary"><TrendingUp size={13} /> Attribution multi-canal</div><PageTitle>CA & CAC réels</PageTitle><PageDescription>Reliez les dépenses Meta et Google aux conversions finales pour savoir ce qui paie vraiment.</PageDescription></div><div className="flex flex-wrap gap-2"><select value={days} onChange={event => setDays(Number(event.target.value))} className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"><option value={7}>7 jours</option><option value={30}>30 jours</option><option value={90}>90 jours</option></select><Button variant="ghost" size="sm" onClick={() => void load()} className="gap-2"><RefreshCw size={14} />Actualiser</Button><Button variant="outline" size="sm" onClick={sync} disabled={syncing} className="gap-2"><RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />Synchroniser les dépenses</Button></div></div></PageHeader><PageBody><div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3"><div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground"><span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-amber-400'}`} />{connected ? 'Données publicitaires connectées' : 'Aucune dépense synchronisée sur cette période'}<span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${connections?.meta ? 'bg-emerald-500/10 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>Meta {connections?.meta ? 'connecté' : 'à connecter'}</span><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${connections?.google ? 'bg-emerald-500/10 text-emerald-700' : connections?.googleStatus === 'partial' ? 'bg-amber-500/10 text-amber-700' : 'bg-muted text-muted-foreground'}`}>Google Ads {googleLabel}</span>{connectionError && <span className="text-xs text-amber-700">{connectionError}</span>}</div><span className="text-xs font-semibold text-muted-foreground">Période : {days} jours</span></div><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[{ label: 'Dépenses', value: money(totalSpend), icon: DollarSign }, { label: 'CA attribué', value: money(totalRevenue), icon: TrendingUp }, { label: 'Clients convertis', value: String(totalCustomers), icon: Users }, { label: 'CAC moyen', value: totalCac ? money(totalCac) : '—', icon: Link2 }].map(item => <div key={item.label} className="rounded-2xl border border-border bg-card p-4"><item.icon size={16} className="mb-3 text-primary" /><p className="text-2xl font-black tabular-nums text-foreground">{item.value}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{item.label}</p></div>)}</div><div className="rounded-2xl border border-border bg-card shadow-sm"><div className="border-b border-border px-5 py-4"><h2 className="text-sm font-bold text-foreground">Contribution de chaque canal au chiffre d’affaires</h2><p className="mt-1 text-xs text-muted-foreground">Modèle last-touch sur les conversions connues · montants en euros.</p></div><div className="space-y-4 p-5">{channels.map(item => <div key={item.channel} className="space-y-2"><div className="flex items-center justify-between gap-3 text-sm"><div className="flex min-w-0 items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" /><span className="font-semibold text-foreground">{label(item.channel)}</span><span className="text-xs text-muted-foreground">{Number(item.leads) || 0} leads · {Number(item.customers) || 0} clients</span></div><span className="font-black tabular-nums text-foreground">{money(item.revenueCents)}</span></div><div className="flex items-center gap-3"><div className="h-3 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.max(safeNumber(item.revenueCents) ? 6 : 0, (safeNumber(item.revenueCents) / maxRevenue) * 100)}%` }} /></div><span className="w-12 text-right text-xs font-bold text-primary">{safeNumber(item.contributionPct)}%</span></div><div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-muted-foreground"><span>Dépenses : <strong className="text-foreground">{money(item.spendCents)}</strong></span><span>CAC : <strong className="text-foreground">{safeNumber(item.cacCents) > 0 ? money(item.cacCents) : 'n/a'}</strong></span><span>ROAS : <strong className="text-foreground">{safeNumber(item.spendCents) > 0 ? `${(safeNumber(item.revenueCents) / safeNumber(item.spendCents)).toFixed(1)}x` : 'organique'}</strong></span></div></div>)}{!view?.channels.length && <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">Synchronisez Meta ou Google Ads pour faire apparaître vos canaux.</div>}</div></div><div className="grid gap-4 md:grid-cols-2"><div className="rounded-2xl border border-primary/20 bg-primary/5 p-4"><div className="flex items-center gap-2 text-sm font-bold text-foreground"><CheckCircle2 size={16} className="text-primary" /> Ce que vous mesurez</div><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Le CAC est calculé sur les dépenses connectées divisées par les clients convertis identifiés. Les conversions sans source restent séparées, jamais inventées.</p></div><div className="rounded-2xl border border-border bg-card p-4"><div className="flex items-center gap-2 text-sm font-bold text-foreground"><Link2 size={16} className="text-primary" /> Connexions attendues</div><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Meta : token système + compte publicitaire. Google : Customer ID, developer token et OAuth. Configurez-les dans les secrets du backend.</p></div></div></div></PageBody></Page>;
}
