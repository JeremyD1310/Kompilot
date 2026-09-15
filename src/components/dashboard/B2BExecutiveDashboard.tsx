import { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, BarChart3, Filter, MousePointerClick, Users, WalletCards } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Button } from '@blinkdotnew/ui';

type DateRange = '7d' | '30d' | '90d';

const SERIES = {
  '7d': [
    { day: 'Lun', visits: 280, leads: 18 }, { day: 'Mar', visits: 340, leads: 22 }, { day: 'Mer', visits: 310, leads: 20 },
    { day: 'Jeu', visits: 390, leads: 27 }, { day: 'Ven', visits: 430, leads: 31 }, { day: 'Sam', visits: 510, leads: 38 }, { day: 'Dim', visits: 470, leads: 34 },
  ],
  '30d': [
    { day: 'S1', visits: 940, leads: 62 }, { day: 'S2', visits: 1120, leads: 78 }, { day: 'S3', visits: 1280, leads: 91 }, { day: 'S4', visits: 1460, leads: 106 },
  ],
  '90d': [
    { day: 'Avr', visits: 3200, leads: 210 }, { day: 'Mai', visits: 4100, leads: 286 }, { day: 'Juin', visits: 4980, leads: 344 },
  ],
} satisfies Record<DateRange, { day: string; visits: number; leads: number }[]>;

const RANGE_LABELS: Record<DateRange, string> = { '7d': '7 derniers jours', '30d': '30 derniers jours', '90d': '90 derniers jours' };

function Metric({ label, value, change, icon: Icon, positive = true }: { label: string; value: string; change: string; icon: typeof Users; positive?: boolean }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Icon size={17} /></span>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${positive ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'}`}>
          {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {change}
        </span>
      </div>
      <p className="mt-4 text-2xl font-black tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
    </article>
  );
}

export function B2BExecutiveDashboard({ establishmentName, isDemo }: { establishmentName: string; isDemo: boolean }) {
  const [range, setRange] = useState<DateRange>('7d');
  const data = useMemo(() => SERIES[range], [range]);
  const totalVisits = data.reduce((sum, point) => sum + point.visits, 0);
  const totalLeads = data.reduce((sum, point) => sum + point.leads, 0);

  return (
    <section className="space-y-4" aria-labelledby="executive-dashboard-title">
      <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary"><BarChart3 size={14} /> Pilotage B2B</div>
          <h2 id="executive-dashboard-title" className="mt-2 text-xl font-black tracking-tight text-foreground sm:text-2xl">Votre présence, en un coup d’œil</h2>
          <p className="mt-1 text-sm text-muted-foreground">{establishmentName} · acquisition, conversion et attribution réunies.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start rounded-xl border border-border bg-background px-2 py-1.5 text-xs font-bold text-foreground sm:self-center" role="group" aria-label="Période d’analyse" data-testid="period-filter">
          <Filter size={14} className="ml-1 text-primary" />
          <span className="sr-only">Période active :</span>
          <span className="mr-1 text-[10px] text-muted-foreground" data-testid="active-period">{RANGE_LABELS[range]}</span>
          {Object.entries(RANGE_LABELS).map(([value, label]) => <button key={value} type="button" aria-label={`Période : ${label}`} aria-pressed={range === value} data-testid={`period-${value}`} onClick={() => setRange(value as DateRange)} className={`rounded-lg px-2 py-1.5 transition ${range === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>{value.toUpperCase()}</button>)}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Visites qualifiées" value={totalVisits.toLocaleString('fr-FR')} change="+18,4 %" icon={MousePointerClick} />
        <Metric label="Prospects générés" value={totalLeads.toLocaleString('fr-FR')} change="+12,8 %" icon={Users} />
        <Metric label="Taux de conversion" value="7,3 %" change="+1,6 pt" icon={BarChart3} />
        <Metric label="Valeur attribuée" value="8 420 €" change="+24,1 %" icon={WalletCards} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <article className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3"><div><h3 className="text-sm font-black text-foreground">Trafic et demandes</h3><p className="mt-1 text-xs text-muted-foreground">La dynamique de votre présence sur la période sélectionnée.</p></div><span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold text-muted-foreground">Simulé</span></div>
          <div className="h-56 w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 10, right: 4, left: -24, bottom: 0 }}><defs><linearGradient id="visitsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.26} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="4 4" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} /><Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', fontSize: 12 }} /><Area type="monotone" dataKey="visits" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#visitsFill)" name="Visites" /><Area type="monotone" dataKey="leads" stroke="hsl(var(--chart-2))" strokeWidth={2} fill="none" name="Prospects" /></AreaChart></ResponsiveContainer></div>
        </article>

        <article className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-black text-foreground">Attribution des conversions</h3><p className="mt-1 text-xs text-muted-foreground">Les canaux qui contribuent le plus.</p></div><Button variant="outline" size="sm" className="bg-background" onClick={() => window.dispatchEvent(new CustomEvent('kompilot:open-attribution'))}>Détails</Button></div>
          <div className="mt-5 space-y-4">{[
            ['Google Business', 42, 'bg-primary'], ['Réseaux sociaux', 28, 'bg-chart-2'], ['SEO local', 19, 'bg-chart-3'], ['Campagnes', 11, 'bg-chart-4'],
          ].map(([label, share, color]) => <div key={label as string}><div className="mb-1.5 flex items-center justify-between text-xs"><span className="font-semibold text-foreground">{label}</span><span className="font-black text-muted-foreground">{share} %</span></div><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className={`h-full rounded-full ${color}`} style={{ width: `${share}%` }} /></div></div>)} </div>
          <div className="mt-5 rounded-xl bg-secondary/70 p-3"><p className="text-xs font-bold text-foreground">Insight du moment</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Les demandes issues de Google Business convertissent 2,1× mieux que la moyenne.</p></div>
        </article>
      </div>

      {isDemo && <p className="text-center text-[11px] font-medium text-muted-foreground">Mode démo : les métriques sont fictives pour vous aider à visualiser le pilotage.</p>}
    </section>
  );
}
