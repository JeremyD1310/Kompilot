/**
 * VideoPerformanceCard — Displays Meta 6-second video metrics
 * Shows: video_6s, cost_per_6s, completion rate, avg watch time
 * Comparison with legacy ThruPlay (15s) metric.
 */
import { motion } from 'framer-motion';
import { Film, Clock, TrendingDown, BarChart3, PlayCircle, CheckCircle2 } from 'lucide-react';

export interface VideoMetrics {
  video6s: number;
  costPer6sEur: number;
  videoThruPlays: number;
  costPerThruPlayEur: number;
  videoCompletionRate: number;
  avgWatchTimeSec: number;
  spendEur: number;
}

interface VideoPerformanceCardProps {
  metrics: VideoMetrics;
  loading?: boolean;
  className?: string;
}

const fmt = (n: number, decimals = 0) => n.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
const fmtEur = (n: number) => `${n.toFixed(2)} €`;

export function VideoPerformanceCard({ metrics, loading = false, className = '' }: VideoPerformanceCardProps) {
  if (loading) {
    return (
      <div className={`rounded-2xl border border-border bg-card p-5 animate-pulse ${className}`}>
        <div className="h-4 w-40 bg-muted rounded mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const hasVideoData = metrics.video6s > 0 || metrics.videoThruPlays > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
      className={`rounded-2xl border border-border bg-card overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Film size={15} className="text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Performance Video</h3>
            <p className="text-[10px] text-muted-foreground">Métrique standard 6 secondes (Meta 2024+)</p>
          </div>
        </div>
      </div>

      {!hasVideoData ? (
        <div className="px-5 pb-5">
          <p className="text-xs text-muted-foreground text-center py-4">
            Aucune donnée vidéo disponible pour cette campagne.
          </p>
        </div>
      ) : (
        <div className="px-5 pb-5 space-y-3">
          {/* Primary: 6-second views */}
          <div className="flex items-center gap-3 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/30 px-4 py-3">
            <PlayCircle size={18} className="text-violet-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                Vues 6 secondes
              </p>
              <p className="text-2xl font-black text-violet-700 dark:text-violet-300 tabular-nums">
                {fmt(metrics.video6s)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-violet-500">Coût / vue 6s</p>
              <p className="text-sm font-bold text-violet-600 dark:text-violet-400">{fmtEur(metrics.costPer6sEur)}</p>
            </div>
          </div>

          {/* Comparison: 6s vs ThruPlay */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-border bg-card px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Clock size={12} className="text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">ThruPlay (15s)</span>
              </div>
              <p className="text-lg font-extrabold tabular-nums">{fmt(metrics.videoThruPlays)}</p>
              <p className="text-[10px] text-muted-foreground">{fmtEur(metrics.costPerThruPlayEur)} / vue</p>
            </div>

            <div className="rounded-xl border border-border bg-card px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingDown size={12} className="text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Temps moyen</span>
              </div>
              <p className="text-lg font-extrabold tabular-nums">{metrics.avgWatchTimeSec.toFixed(1)}s</p>
              <p className="text-[10px] text-muted-foreground">visionnage / vue</p>
            </div>
          </div>

          {/* Completion funnel */}
          <div className="rounded-xl border border-border bg-card px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 size={12} className={metrics.videoCompletionRate >= 50 ? 'text-emerald-500' : 'text-amber-500'} />
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Taux de complétion</span>
              <span className="ml-auto text-sm font-bold tabular-nums">
                {metrics.videoCompletionRate}%
              </span>
            </div>
            {/* Funnel bar */}
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, metrics.videoCompletionRate)}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
                className={`h-full rounded-full ${
                  metrics.videoCompletionRate >= 50
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                    : 'bg-gradient-to-r from-amber-500 to-amber-400'
                }`}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              % de vues ayant atteint la fin (p100) parmi les vues 25% (p25)
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
