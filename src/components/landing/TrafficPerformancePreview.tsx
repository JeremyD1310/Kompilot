import { useMemo, useState } from 'react';
import { ArrowUpRight, BarChart3, Globe2, MousePointerClick, Users } from 'lucide-react';

type TrafficRange = '7j' | '30j' | '90j';

const TRAFFIC_DATA: Record<TrafficRange, {
  label: string;
  visitors: string;
  visitorsChange: string;
  pageViews: string;
  pageViewsChange: string;
  sessions: string;
  bounceRate: string;
  points: number[];
}> = {
  '7j': {
    label: '7 derniers jours',
    visitors: '1 284',
    visitorsChange: '+18,6%',
    pageViews: '3 842',
    pageViewsChange: '+24,1%',
    sessions: '2 106',
    bounceRate: '38,4%',
    points: [24, 31, 29, 42, 38, 56, 68],
  },
  '30j': {
    label: '30 derniers jours',
    visitors: '5 916',
    visitorsChange: '+31,8%',
    pageViews: '18 420',
    pageViewsChange: '+27,4%',
    sessions: '9 734',
    bounceRate: '41,2%',
    points: [22, 36, 32, 48, 44, 61, 54, 72, 68, 86],
  },
  '90j': {
    label: '90 derniers jours',
    visitors: '16 842',
    visitorsChange: '+46,2%',
    pageViews: '52 608',
    pageViewsChange: '+39,7%',
    sessions: '28 510',
    bounceRate: '43,8%',
    points: [18, 28, 26, 37, 34, 48, 45, 58, 55, 68, 64, 82],
  },
};

const TRAFFIC_SOURCES = [
  { label: 'Recherche Google', value: '48%', width: '48%', color: 'bg-teal-400' },
  { label: 'Réseaux sociaux', value: '27%', width: '27%', color: 'bg-indigo-400' },
  { label: 'Accès direct', value: '16%', width: '16%', color: 'bg-amber-300' },
  { label: 'Sites référents', value: '9%', width: '9%', color: 'bg-slate-400' },
];

function Metric({ icon: Icon, label, value, change }: { icon: typeof Users; label: string; value: string; change?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 sm:p-4">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        <Icon size={13} className="text-teal-300" aria-hidden="true" />
        {label}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <span className="text-xl font-black tracking-tight text-slate-100 sm:text-2xl">{value}</span>
        {change && <span className="text-[10px] font-bold text-emerald-300">{change}</span>}
      </div>
    </div>
  );
}

export function TrafficPerformancePreview() {
  const [range, setRange] = useState<TrafficRange>('30j');
  const data = TRAFFIC_DATA[range];
  const chartPoints = useMemo(() => data.points.map((point, index) => `${(index / (data.points.length - 1)) * 100},${100 - point}`).join(' '), [data.points]);

  return (
    <section data-testid="traffic-performance-preview" data-current-range={range} className="min-h-[760px] border-y border-white/[0.07] bg-[#080E1C] px-4 py-14 sm:px-6 md:min-h-[820px] md:py-20" aria-labelledby="traffic-preview-title">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-teal-300">Aperçu Analytics</p>
            <h2 id="traffic-preview-title" className="text-2xl font-black tracking-tight text-slate-100 sm:text-3xl">
              Comprenez ce qui attire vraiment vos clients.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400 sm:text-base">
              Un aperçu clair du trafic web, des sources d’acquisition et des actions qui transforment une visite en opportunité locale.
            </p>
          </div>
          <div className="flex w-fit items-center gap-1 rounded-xl border border-white/[0.1] bg-white/[0.04] p-1" role="group" aria-label="Période du trafic simulé">
            {(Object.keys(TRAFFIC_DATA) as TrafficRange[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRange(item)}
                aria-pressed={range === item}
                data-testid={`traffic-range-${item}`}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${range === item ? 'bg-teal-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-2xl border border-white/[0.09] bg-[#0D1117] p-4 shadow-[0_24px_60px_-32px_rgba(13,148,136,.55)] sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-200"><Globe2 size={16} className="text-teal-300" /> Trafic du site</div>
                <p className="mt-1 text-xs text-slate-500">{data.label} · données simulées</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300"><ArrowUpRight size={12} /> En progression</span>
            </div>

            <output data-testid="traffic-active-summary" aria-live="polite" className="mb-3 block text-xs font-semibold text-teal-200">Période active : {range} · {data.visitors} visiteurs uniques · {data.pageViews} pages vues</output>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Metric icon={Users} label="Visiteurs uniques" value={data.visitors} change={data.visitorsChange} />
              <Metric icon={BarChart3} label="Pages vues" value={data.pageViews} change={data.pageViewsChange} />
              <Metric icon={MousePointerClick} label="Sessions actives" value={data.sessions} />
            </div>

            <div className="mt-6 rounded-xl border border-white/[0.06] bg-slate-950/40 p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500"><span>Visiteurs uniques</span><span className="text-slate-400">{data.bounceRate} de rebond</span></div>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-36 w-full overflow-visible sm:h-44" role="img" aria-label={`Évolution simulée des visiteurs sur ${data.label}`}>
                <defs>
                  <linearGradient id="traffic-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[20, 40, 60, 80].map((y) => <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="rgba(148,163,184,.1)" strokeDasharray="1 2" vectorEffect="non-scaling-stroke" />)}
                <polygon points={`0,100 ${chartPoints} 100,100`} fill="url(#traffic-fill)" />
                <polyline points={chartPoints} fill="none" stroke="#2DD4BF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
                {data.points.map((point, index) => <circle key={`${point}-${index}`} cx={(index / (data.points.length - 1)) * 100} cy={100 - point} r="1.5" fill="#0D1117" stroke="#99F6E4" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
              </svg>
              <div className="mt-2 flex justify-between text-[9px] text-slate-600"><span>Début de période</span><span>Aujourd’hui</span></div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.09] bg-white/[0.035] p-4 sm:p-6">
            <div className="mb-6 flex items-center gap-2"><BarChart3 size={16} className="text-indigo-300" /><h3 className="text-sm font-bold text-slate-200">Sources d’acquisition</h3></div>
            <div className="space-y-5">
              {TRAFFIC_SOURCES.map((source) => (
                <div key={source.label}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs"><span className="text-slate-400">{source.label}</span><span className="font-bold text-slate-200">{source.value}</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]"><div className={`h-full rounded-full ${source.color} transition-all duration-500`} style={{ width: source.width }} /></div>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-xl border border-teal-300/15 bg-teal-300/[0.07] p-3.5"><p className="text-xs font-bold text-teal-200">Signal à retenir</p><p className="mt-1.5 text-xs leading-relaxed text-slate-400">La recherche Google génère près d’une visite sur deux. Kompilot vous aide à rester visible au moment où vos clients cherchent une adresse locale.</p></div>
          </div>
        </div>
        <p className="mt-4 text-center text-[11px] text-slate-600">Aperçu visuel basé sur des données fictives · Connectez vos outils pour afficher vos performances réelles.</p>
      </div>
    </section>
  );
}
