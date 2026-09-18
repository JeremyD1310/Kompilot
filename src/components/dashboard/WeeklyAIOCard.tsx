/**
 * WeeklyAIOCard — Displays the latest weekly AIO report in the dashboard.
 *
 * Shows: AIO score trend, AI citations, top recommendation, sector comparison.
 * Only visible when the backend has a report available.
 */

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Brain, Target, ChevronRight } from 'lucide-react';
import { useWeeklyAIOReport, type WeeklyAIOReport } from '../../hooks/useWeeklyAIOReport';

export function WeeklyAIOCard() {
  const { report, isLoading, hasNewReport } = useWeeklyAIOReport();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 animate-pulse">
        <div className="h-4 w-40 bg-muted rounded mb-3" />
        <div className="h-8 w-20 bg-muted rounded mb-2" />
        <div className="h-3 w-full bg-muted rounded" />
      </div>
    );
  }

  if (!hasNewReport || !report) return null;

  const delta = report.aioScoreDelta;
  const isPositive = delta >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Brain size={16} className="text-violet-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Rapport AIO Hebdomadaire</h3>
            <p className="text-[10px] text-muted-foreground">{report.weekOf}</p>
          </div>
        </div>

        {/* Score + Delta */}
        <div className="flex items-end gap-3 mb-4">
          <span className="text-3xl font-black text-foreground leading-none">
            {report.aioScore}
          </span>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
            isPositive
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/10 text-red-600 dark:text-red-400'
          }`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {isPositive ? '+' : ''}{delta} pts
          </div>
          <span className="text-[10px] text-muted-foreground ml-auto">
            moy. secteur: {report.sectorAverage}
          </span>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl bg-muted/30 p-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Citations IA</p>
            <p className="text-lg font-black text-foreground">{report.citationsDetected}</p>
          </div>
          <div className="rounded-xl bg-muted/30 p-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Mots-clés visibles</p>
            <p className="text-lg font-black text-foreground">{report.visibleKeywords.length}</p>
          </div>
        </div>

        {/* Top recommendation */}
        <div className="rounded-xl bg-violet-500/5 border border-violet-500/15 p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Target size={12} className="text-violet-500" />
            <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
              Action prioritaire
            </p>
          </div>
          <p className="text-xs text-foreground leading-relaxed">
            {report.topRecommendation}
          </p>
        </div>
      </div>

      {/* Invisible keywords (collapsed) */}
      {report.invisibleKeywords.length > 0 && (
        <div className="px-5 pb-4">
          <p className="text-[10px] font-semibold text-muted-foreground mb-2">
            Mots-clés invisibles ({report.invisibleKeywords.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {report.invisibleKeywords.slice(0, 5).map((kw, i) => (
              <span key={i} className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-medium">
                {kw}
              </span>
            ))}
            {report.invisibleKeywords.length > 5 && (
              <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px]">
                +{report.invisibleKeywords.length - 5}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border bg-muted/20">
        <a
          href="/aio-sync"
          className="flex items-center justify-between text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
        >
          Voir le rapport complet
          <ChevronRight size={14} />
        </a>
      </div>
    </motion.div>
  );
}
