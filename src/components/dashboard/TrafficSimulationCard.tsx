import { motion, useReducedMotion } from 'framer-motion';
import { Activity, ArrowUpRight, Eye, Users, MousePointerClick } from 'lucide-react';

const traffic = [42, 55, 48, 68, 61, 78, 73];
const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function Sparkline() {
  const points = traffic.map((value, index) => `${(index * 100) / 6},${100 - value}`).join(' ');
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-40 w-full overflow-visible" role="img" aria-label="Trafic simulé sur les sept derniers jours">
      <defs>
        <linearGradient id="traffic-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity=".22" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[25, 50, 75].map(y => <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="currentColor" opacity=".08" strokeWidth=".6" />)}
      <polygon points={`0,100 ${points} 100,100`} fill="url(#traffic-fill)" className="text-primary" />
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" className="text-primary" />
      {traffic.map((value, index) => <circle key={index} cx={(index * 100) / 6} cy={100 - value} r="1.6" className="fill-primary" />)}
    </svg>
  );
}

export function TrafficSimulationCard() {
  const reducedMotion = useReducedMotion();
  const kpis = [
    { label: 'Visites', value: '1 284', change: '+12,4 %', icon: Eye },
    { label: 'Visiteurs uniques', value: '936', change: '+8,7 %', icon: Users },
    { label: 'Taux de conversion', value: '4,8 %', change: '+0,6 pt', icon: MousePointerClick },
  ];

  return (
    <motion.section initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }} className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <div className="flex items-center gap-2"><h2 className="text-sm font-semibold text-foreground">Trafic de votre site</h2><span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">Simulation</span></div>
          <p className="mt-1 text-xs text-muted-foreground">Projection indicative sur les 7 derniers jours</p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:animate-none" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>Simulation active</div>
      </div>
      <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="min-w-0"><div className="flex items-end justify-between"><div><p className="text-2xl font-bold tabular-nums text-foreground">1 284</p><p className="text-xs text-muted-foreground">sessions estimées</p></div><span className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><ArrowUpRight size={13} />12,4 %</span></div><div className="mt-4 text-primary"><Sparkline /></div><div className="mt-1 flex justify-between text-[10px] text-muted-foreground">{days.map(day => <span key={day}>{day}</span>)}</div></div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">{kpis.map(({ label, value, change, icon: Icon }, index) => <motion.div key={label} initial={reducedMotion ? false : { opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: reducedMotion ? 0 : index * .06 }} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon size={15} /></div><div className="min-w-0"><p className="text-[11px] text-muted-foreground">{label}</p><p className="text-sm font-bold tabular-nums text-foreground">{value}</p></div><span className="ml-auto text-[10px] font-semibold text-emerald-600">{change}</span></motion.div>)}</div>
      </div>
      <p className="border-t border-border bg-muted/20 px-5 py-2.5 text-[10px] text-muted-foreground">Les données sont simulées à titre indicatif et ne constituent pas des mesures analytics réelles.</p>
    </motion.section>
  );
}
