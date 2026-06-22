/**
 * ComparisonPanel — radar chart + metrics table + growth tips.
 */
import { cn } from '../../../lib/utils';
import {
  type Competitor, MY_METRICS,
  buildRadarData, generateTips, getStrengths, totalFollowers,
  RADAR_AXES, RADAR_LABELS,
} from './types';

// ── SVG Radar chart (dependency-free) ────────────────────────────────────────

function RadarViz({ competitor }: { competitor: Competitor }) {
  const data = buildRadarData(competitor);
  const n = data.length;
  const cx = 120, cy = 120, maxR = 82, labelR = 107;
  const angle = (i: number) => (i / n) * 2 * Math.PI - Math.PI / 2;

  const pt = (value: number, i: number): [number, number] => {
    const a = angle(i);
    const r = (value / 100) * maxR;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };

  const polygon = (fn: (d: typeof data[0]) => number) =>
    data.map((d, i) => pt(fn(d), i).join(',')).join(' ');

  const gridLevels = [25, 50, 75, 100];

  return (
    <div>
      <svg viewBox="0 0 240 240" className="w-full max-w-[220px] mx-auto">
        {/* Grid polygons */}
        {gridLevels.map(lv => (
          <polygon key={lv}
            points={data.map((_, i) => pt(lv, i).join(',')).join(' ')}
            fill="none" stroke="hsl(var(--border))" strokeWidth="0.8"
          />
        ))}
        {/* Spokes */}
        {data.map((_, i) => {
          const [px, py] = pt(100, i);
          return <line key={i} x1={cx} y1={cy} x2={px} y2={py} stroke="hsl(var(--border))" strokeWidth="0.8" />;
        })}
        {/* Competitor area */}
        <polygon points={polygon(d => d.concurrent)}
          fill="#8b5cf6" fillOpacity={0.15} stroke="#8b5cf6" strokeWidth="1.8" strokeLinejoin="round"
        />
        {/* My area */}
        <polygon points={polygon(d => d.vous)}
          fill="hsl(var(--primary))" fillOpacity={0.28} stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinejoin="round"
        />
        {/* My dots */}
        {data.map((d, i) => {
          const [px, py] = pt(d.vous, i);
          return <circle key={i} cx={px} cy={py} r="3.5" fill="hsl(var(--primary))" stroke="hsl(var(--card))" strokeWidth="1" />;
        })}
        {/* Labels */}
        {data.map((d, i) => {
          const a = angle(i);
          const lx = cx + labelR * Math.cos(a);
          const ly = cy + labelR * Math.sin(a);
          return (
            <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
              fontSize="9" fontWeight="600" fill="hsl(var(--foreground))">
              {d.axis}
            </text>
          );
        })}
      </svg>
      {/* Legend */}
      <div className="flex items-center justify-center gap-5 text-[11px] mt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 rounded-full bg-primary inline-block" />
          <span className="text-muted-foreground font-medium">Vous</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 rounded-full bg-violet-500 inline-block" />
          <span className="text-muted-foreground font-medium">{competitor.name}</span>
        </span>
      </div>
    </div>
  );
}

// ── Metric comparison row ─────────────────────────────────────────────────────

function MetricRow({ label, mine, theirs, unit = '', inverse = false, format = String }:{
  label: string; mine: number; theirs: number;
  unit?: string; inverse?: boolean;
  format?: (n: number) => string;
}) {
  const win  = inverse ? mine < theirs : mine > theirs;
  const lose = inverse ? mine > theirs : mine < theirs;
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xs font-bold tabular-nums text-right text-foreground">{format(mine)}{unit}</p>
      <p className="text-xs font-bold tabular-nums text-right text-foreground">{format(theirs)}{unit}</p>
      <span className={cn('text-[9px] font-bold rounded-full px-1.5 py-0.5 border whitespace-nowrap',
        win  ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
        lose ? 'text-red-700 bg-red-50 border-red-200' :
               'text-muted-foreground bg-muted border-border'
      )}>
        {win ? '✓ Meilleur' : lose ? '↓ Inférieur' : '≈ Égal'}
      </span>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function ComparisonPanel({ competitor }: { competitor: Competitor }) {
  const tips      = generateTips(competitor);
  const strengths = getStrengths(competitor);
  const myTotal   = Object.values(MY_METRICS.followers).reduce((s, v) => s + (v ?? 0), 0);
  const theirTotal = totalFollowers(competitor);

  // Per-axis comparison bars
  const axisRows = RADAR_AXES.map(ax => ({
    label: RADAR_LABELS[ax],
    mine: MY_METRICS.radar[ax],
    theirs: competitor.metrics.radar[ax],
  }));

  const overallDiff = Math.round(
    RADAR_AXES.reduce((s, ax) => s + (MY_METRICS.radar[ax] - competitor.metrics.radar[ax]), 0) / RADAR_AXES.length
  );

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-muted/20">
        <p className="text-sm font-bold text-foreground flex-1">
          Vous <span className="text-muted-foreground font-normal">vs</span> {competitor.name}
        </p>
        <span className={cn('text-[11px] font-extrabold rounded-full px-2.5 py-1 border',
          overallDiff >= 0
            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
            : 'text-amber-700 bg-amber-50 border-amber-200'
        )}>
          {overallDiff >= 0 ? `+${overallDiff}` : overallDiff} pts en moyenne
        </span>
      </div>

      <div className="p-5 space-y-6">
        {/* Radar + Metrics 2-col layout */}
        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* Radar */}
          <div className="rounded-xl border border-border bg-muted/10 p-4">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-3">Score multi-axe (0–100)</p>
            <RadarViz competitor={competitor} />
          </div>

          {/* Metrics table */}
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Métriques clés</p>
            <div className="grid grid-cols-[1fr_auto_auto_auto] text-[10px] font-bold text-muted-foreground uppercase tracking-wide px-0 mb-1 gap-3">
              <span>Métrique</span><span className="text-right">Vous</span><span className="text-right">Eux</span><span></span>
            </div>
            <MetricRow label="Abonnés total" mine={myTotal} theirs={theirTotal} format={n => n.toLocaleString('fr-FR')} />
            <MetricRow label="Posts / semaine" mine={MY_METRICS.postsPerWeek} theirs={competitor.metrics.postsPerWeek} format={n => n.toFixed(1)} />
            <MetricRow label="Engagement" mine={MY_METRICS.engagement} theirs={competitor.metrics.engagement} unit="%" format={n => n.toFixed(1)} />
            <MetricRow label="Note Google" mine={MY_METRICS.reviewScore} theirs={competitor.metrics.reviewScore} unit="/5" format={n => n.toFixed(1)} />
            <MetricRow label="Dernier post" mine={MY_METRICS.lastPostDays} theirs={competitor.metrics.lastPostDays} unit=" j" inverse format={n => n === 0 ? "auj." : String(n)} />

            {/* Per-axis mini bars */}
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mt-4 mb-2">Comparaison par axe</p>
            <div className="space-y-2">
              {axisRows.map(({ label, mine, theirs }) => (
                <div key={label} className="space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground font-medium">{label}</span>
                    <span className={cn('font-bold tabular-nums', mine >= theirs ? 'text-emerald-600' : 'text-red-500')}>
                      {mine} <span className="text-muted-foreground font-normal">vs</span> {theirs}
                    </span>
                  </div>
                  <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="absolute inset-0 rounded-full bg-violet-400/30" style={{ width: `${theirs}%` }} />
                    <div className="absolute inset-0 rounded-full bg-primary" style={{ width: `${mine}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Growth tips */}
        {tips.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">💡 Leviers prioritaires à activer</p>
            {tips.map((t, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <div>
                  <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300 mb-0.5">{RADAR_LABELS[t.ax]} — écart : +{t.gap} pts</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-snug">{t.tip}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Strengths */}
        {strengths.length > 0 && (
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2">✅ Vos atouts face à {competitor.name}</p>
            <div className="flex flex-wrap gap-2">
              {strengths.map((s, i) => (
                <span key={i} className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                  ✓ {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Kompilot CTA */}
        <div className="rounded-xl border-2 border-primary/20 bg-primary/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-xs text-foreground flex-1 leading-snug">
            <span className="font-bold">Kompilot corrige ces écarts automatiquement</span> — publications planifiées, réponses aux avis, SEO local boosté.
          </p>
          <a href="/cockpit" className="text-[11px] font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg px-3 py-2 whitespace-nowrap transition-colors shrink-0">
            Propulser mon commerce →
          </a>
        </div>
      </div>
    </div>
  );
}
