import { motion } from 'framer-motion';
import { ScoreGauge } from './ScoreGauge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface BreakdownItem {
  label: string;
  value: number;
  color: string;
}

interface VisibilityScoreWidgetProps {
  score: number;
  trend?: number[];
  breakdown?: {
    googleFiche: number;
    citations: number;
    avis: number;
    contenu: number;
  };
  establishmentName?: string;
}

const DEFAULT_TREND = [72, 74, 71, 76, 78, 75, 78];

function MiniSparkline({ data }: { data: number[] }) {
  const w = 120;
  const h = 32;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * (h - 4) - 2,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0D9488" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0D9488" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkGrad)" />
      <path d={linePath} fill="none" stroke="#0D9488" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) =>
        i === pts.length - 1 ? (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#0D9488" />
        ) : null,
      )}
    </svg>
  );
}

function BreakdownBar({ item, index }: { item: BreakdownItem; index: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">{item.label}</span>
        <span className="text-xs font-bold tabular-nums" style={{ color: item.color }}>{item.value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: item.color }}
          initial={{ width: 0 }}
          animate={{ width: `${item.value}%` }}
          transition={{ duration: 1.2, delay: 0.3 + index * 0.1, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
    </div>
  );
}

export function VisibilityScoreWidget({
  score,
  trend = DEFAULT_TREND,
  breakdown,
  establishmentName,
}: VisibilityScoreWidgetProps) {
  const bd = breakdown ?? { googleFiche: 88, citations: 71, avis: 82, contenu: 65 };

  const bars: BreakdownItem[] = [
    { label: 'Google Fiche', value: bd.googleFiche, color: '#0D9488' },
    { label: 'Citations', value: bd.citations, color: '#0891b2' },
    { label: 'Avis clients', value: bd.avis, color: '#0D9488' },
    { label: 'Contenu IA', value: bd.contenu, color: '#0891b2' },
  ];

  const trendDelta = trend.length >= 2 ? trend[trend.length - 1] - trend[0] : 0;
  const isPositive = trendDelta > 0;
  const isNeutral = trendDelta === 0;

  return (
    <motion.div
      className="bg-card border border-border rounded-2xl overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-bold text-foreground">Score de Visibilité</span>
          {establishmentName && (
            <span className="text-xs text-muted-foreground hidden sm:inline">— {establishmentName}</span>
          )}
        </div>
        {/* Live badge */}
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-full px-2.5 py-1">
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-teal-500"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          En direct
        </span>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-border">

        {/* Left — Gauge */}
        <div className="flex flex-col items-center justify-center gap-4 py-6 px-5">
          <ScoreGauge score={score} size={160} />

          {/* Sparkline + delta */}
          <div className="flex flex-col items-center gap-1.5">
            <MiniSparkline data={trend} />
            <div className="flex items-center gap-1.5">
              {isNeutral ? (
                <Minus size={13} className="text-muted-foreground" />
              ) : isPositive ? (
                <TrendingUp size={13} className="text-emerald-500" />
              ) : (
                <TrendingDown size={13} className="text-red-400" />
              )}
              <span
                className={`text-[11px] font-bold ${
                  isNeutral
                    ? 'text-muted-foreground'
                    : isPositive
                    ? 'text-emerald-500'
                    : 'text-red-400'
                }`}
              >
                {isPositive ? '+' : ''}{trendDelta} pts cette semaine
              </span>
            </div>
          </div>
        </div>

        {/* Right — Breakdown */}
        <div className="flex flex-col justify-center gap-3 py-6 px-5">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Détail par catégorie
          </p>
          {bars.map((bar, i) => (
            <BreakdownBar key={bar.label} item={bar} index={i} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
