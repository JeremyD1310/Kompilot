/**
 * MilestoneProgressWidget
 *
 * Dashboard card showing real-time progress against every configured
 * AI milestone threshold. Grouped into four metric families:
 *   Position · Avis · Note · Réponses IA
 *
 * Each row shows:
 *  • metric icon + label
 *  • animated fill bar (color: red → amber → emerald depending on progress %)
 *  • current value / threshold value + unit
 *  • "Atteint ✓" badge once the threshold is crossed
 *
 * Data comes from buildDemoVisibilityData (same source as LocalVisibilityWidget)
 * and getAIReplyCount / getThresholdValues from the milestone config.
 *
 * No props required — reads everything from localStorage config + demo data.
 */
import { useMemo } from 'react';
import {
  MapPin, Star, MessageSquare, Sparkles,
  ChevronRight, CheckCircle2, Trophy,
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { getThresholdValues } from '../../lib/milestoneThresholds';
import { getAIReplyCount } from '../../lib/reviewMilestones';
import { buildDemoVisibilityData } from '../gmaps/LocalVisibilityWidget';
import { useEstablishment } from '../../context/EstablishmentContext';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MetricRow {
  id: string;
  icon: React.ReactNode;
  label: string;
  current: number;
  target: number;
  unit: string;
  /** Higher is better (reviews, rating, reply rate, AI replies) vs lower is better (rank) */
  higherIsBetter: boolean;
  /** Format current value for display */
  formatValue?: (v: number) => string;
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ pct, reached }: { pct: number; reached: boolean }) {
  const clampedPct = Math.min(100, Math.max(0, pct));
  const barColor = reached
    ? 'bg-emerald-500'
    : clampedPct >= 75
      ? 'bg-teal-500'
      : clampedPct >= 40
        ? 'bg-amber-400'
        : 'bg-red-400';

  return (
    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden min-w-0">
      <div
        className={cn('h-full rounded-full transition-all duration-700', barColor)}
        style={{ width: `${clampedPct}%` }}
      />
    </div>
  );
}

// ── Single metric row ─────────────────────────────────────────────────────────

function MetricRow({ row }: { row: MetricRow }) {
  const reached = row.higherIsBetter
    ? row.current >= row.target
    : row.current <= row.target;

  const rawPct = row.higherIsBetter
    ? (row.current / row.target) * 100
    : row.target > 0
      ? ((row.target - Math.max(0, row.current - row.target)) / row.target) * 100
      : 100;

  const pct = Math.min(100, Math.max(0, rawPct));
  const displayCurrent = row.formatValue ? row.formatValue(row.current) : String(row.current);
  const displayTarget = row.formatValue ? row.formatValue(row.target) : String(row.target);

  return (
    <div className="flex items-center gap-3 py-2.5">
      {/* Icon */}
      <div className={cn(
        'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
        reached ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-muted text-muted-foreground',
      )}>
        {row.icon}
      </div>

      {/* Label + bar */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-foreground truncate">{row.label}</span>
          {reached ? (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 shrink-0">
              <CheckCircle2 size={10} /> Atteint
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
              {displayCurrent} / {displayTarget} {row.unit}
            </span>
          )}
        </div>
        <ProgressBar pct={pct} reached={reached} />
      </div>
    </div>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────

export function MilestoneProgressWidget() {
  const { activeEstablishment } = useEstablishment();

  const { rows, reachedCount, totalCount } = useMemo(() => {
    const t = getThresholdValues();
    const aiCount = getAIReplyCount();
    const vis = buildDemoVisibilityData(
      '2025-01',
      activeEstablishment?.activity ?? 'commerce',
      activeEstablishment?.city ?? 'votre ville',
    );

    // Mock reply rate based on copilotReplied / currentReviews
    const replyRatePct = vis.currentReviews > 0
      ? Math.round((vis.copilotReplied / vis.currentReviews) * 100)
      : 0;

    const allRows: MetricRow[] = [
      // ── Position ─────────────────────────────────────────────────────────────
      {
        id: 'rank',
        icon: <MapPin size={13} />,
        label: `Top ${t.rankTopN} local`,
        current: vis.currentRank,
        target: t.rankTopN,
        unit: 'pos.',
        higherIsBetter: false,
        formatValue: (v) => `${v}e`,
      },

      // ── Review volume (next uncrossed threshold) ──────────────────────────────
      {
        id: 'reviews_first',
        icon: <MessageSquare size={13} />,
        label: `${t.reviewsFirst} avis Google`,
        current: vis.currentReviews,
        target: t.reviewsFirst,
        unit: 'avis',
        higherIsBetter: true,
      },
      {
        id: 'reviews_second',
        icon: <MessageSquare size={13} />,
        label: `${t.reviewsSecond} avis Google`,
        current: vis.currentReviews,
        target: t.reviewsSecond,
        unit: 'avis',
        higherIsBetter: true,
      },
      {
        id: 'reviews_third',
        icon: <MessageSquare size={13} />,
        label: `${t.reviewsThird} avis Google`,
        current: vis.currentReviews,
        target: t.reviewsThird,
        unit: 'avis',
        higherIsBetter: true,
      },

      // ── Rating ────────────────────────────────────────────────────────────────
      {
        id: 'rating_first',
        icon: <Star size={13} />,
        label: `Note ${t.ratingFirst}★`,
        current: vis.avgRating,
        target: t.ratingFirst,
        unit: '★',
        higherIsBetter: true,
        formatValue: (v) => v.toFixed(1),
      },
      {
        id: 'rating_second',
        icon: <Star size={13} />,
        label: `Note ${t.ratingSecond}★`,
        current: vis.avgRating,
        target: t.ratingSecond,
        unit: '★',
        higherIsBetter: true,
        formatValue: (v) => v.toFixed(1),
      },

      // ── Reply rate ────────────────────────────────────────────────────────────
      {
        id: 'reply_rate',
        icon: <MessageSquare size={13} />,
        label: `Taux de réponse ${t.replyRateFirst}%`,
        current: replyRatePct,
        target: t.replyRateFirst,
        unit: '%',
        higherIsBetter: true,
      },

      // ── AI replies ────────────────────────────────────────────────────────────
      {
        id: 'ai_first',
        icon: <Sparkles size={13} />,
        label: `${t.aiRepliesFirst} réponses IA`,
        current: aiCount,
        target: t.aiRepliesFirst,
        unit: 'rép.',
        higherIsBetter: true,
      },
      {
        id: 'ai_second',
        icon: <Sparkles size={13} />,
        label: `${t.aiRepliesSecond} réponses IA`,
        current: aiCount,
        target: t.aiRepliesSecond,
        unit: 'rép.',
        higherIsBetter: true,
      },
      {
        id: 'ai_third',
        icon: <Sparkles size={13} />,
        label: `${t.aiRepliesThird} réponses IA`,
        current: aiCount,
        target: t.aiRepliesThird,
        unit: 'rép.',
        higherIsBetter: true,
      },
    ];

    const reached = allRows.filter(r => {
      if (r.higherIsBetter) return r.current >= r.target;
      return r.current <= r.target;
    }).length;

    return { rows: allRows, reachedCount: reached, totalCount: allRows.length };
  }, [activeEstablishment]);

  const overallPct = Math.round((reachedCount / totalCount) * 100);

  // Split rows into groups for the two-column layout
  const positionRow = rows.slice(0, 1);
  const reviewRows = rows.slice(1, 4);
  const ratingRows = rows.slice(4, 6);
  const replyRow = rows.slice(6, 7);
  const aiRows = rows.slice(7, 10);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-gradient-to-r from-primary/5 to-teal-500/5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Trophy size={13} className="text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground leading-tight">Progression vers les milestones</p>
            <p className="text-[10px] text-muted-foreground">
              {reachedCount} / {totalCount} atteints
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Overall pill */}
          <div className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold',
            overallPct >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : overallPct >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
          )}>
            {overallPct}%
          </div>
          <Link
            to="/google-maps"
            className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:opacity-80 transition-opacity"
          >
            Configurer <ChevronRight size={11} />
          </Link>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="h-1.5 bg-muted">
        <div
          className={cn(
            'h-full transition-all duration-700',
            overallPct >= 80 ? 'bg-emerald-500' : overallPct >= 50 ? 'bg-amber-400' : 'bg-primary',
          )}
          style={{ width: `${overallPct}%` }}
        />
      </div>

      {/* Metric rows — 2 columns on md+ */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-x-6">
        {/* Left column */}
        <div className="divide-y divide-border/60">
          {/* Position */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 pt-1 pb-0.5 flex items-center gap-1">
              <MapPin size={9} /> Position
            </p>
            {positionRow.map(r => <MetricRow key={r.id} row={r} />)}
          </div>
          {/* Review volume */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 pt-2.5 pb-0.5 flex items-center gap-1">
              <MessageSquare size={9} /> Volume d'avis
            </p>
            {reviewRows.map(r => <MetricRow key={r.id} row={r} />)}
          </div>
        </div>

        {/* Right column */}
        <div className="divide-y divide-border/60 mt-3 md:mt-0">
          {/* Rating */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 pt-1 pb-0.5 flex items-center gap-1">
              <Star size={9} /> Note moyenne
            </p>
            {ratingRows.map(r => <MetricRow key={r.id} row={r} />)}
          </div>
          {/* Reply rate */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 pt-2.5 pb-0.5 flex items-center gap-1">
              <MessageSquare size={9} /> Taux de réponse
            </p>
            {replyRow.map(r => <MetricRow key={r.id} row={r} />)}
          </div>
          {/* AI replies */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 pt-2.5 pb-0.5 flex items-center gap-1">
              <Sparkles size={9} /> Réponses IA
            </p>
            {aiRows.map(r => <MetricRow key={r.id} row={r} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
