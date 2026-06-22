/**
 * LocalVisibilityWidget — "Votre Visibilité Locale"
 *
 * Shows:
 *  1. Position Avant/Après: starting rank vs current rank + places gained
 *  2. Review growth line chart: trajectory from inscription to today
 *  3. Impact stats: average rating + volume handled by Copilot AI
 */
import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  TrendingUp, ArrowUp, MapPin, Star, MessageSquare, Trophy, Sparkles, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from '@tanstack/react-router';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LocalVisibilityData {
  /** Rank at inscription (e.g. 14) */
  startRank: number;
  /** Current rank (e.g. 2) */
  currentRank: number;
  /** Month the user joined, e.g. "2024-09" */
  joinedMonth: string;
  /** Current average rating (e.g. 4.7) */
  avgRating: number;
  /** Review count at inscription */
  startReviews: number;
  /** Current review count */
  currentReviews: number;
  /** Reviews handled by Copilot AI (auto-replied) */
  copilotReplied: number;
  /** Primary keyword they're ranked on */
  primaryKeyword: string;
}

// ── Demo data (used when no real data is wired) ───────────────────────────────

export function buildDemoVisibilityData(
  joinedMonth = '2025-01',
  activity = 'coiffeur',
  city = 'Lyon',
): LocalVisibilityData {
  return {
    startRank: 14,
    currentRank: 2,
    joinedMonth,
    avgRating: 4.7,
    startReviews: 11,
    currentReviews: 167,
    copilotReplied: 143,
    primaryKeyword: `${activity} ${city}`,
  };
}

// ── Review growth chart data builder ─────────────────────────────────────────

function buildReviewChartData(start: number, end: number, joinedMonth: string) {
  const months: { month: string; avis: number }[] = [];
  const base = new Date(joinedMonth + '-01');
  const totalMonths = 6;
  for (let i = 0; i <= totalMonths; i++) {
    const d = new Date(base);
    d.setMonth(base.getMonth() + i);
    const progress = i / totalMonths;
    // Exponential-like growth curve (slow start, then accelerates)
    const curve = Math.pow(progress, 0.65);
    const value = Math.round(start + (end - start) * curve);
    months.push({
      month: d.toLocaleDateString('fr-FR', { month: 'short' }),
      avis: value,
    });
  }
  return months;
}

// ── Rank Badge ────────────────────────────────────────────────────────────────

function RankBadge({
  rank,
  label,
  variant,
}: {
  rank: number;
  label: string;
  variant: 'before' | 'after';
}) {
  const isBefore = variant === 'before';
  return (
    <div className={cn(
      'flex flex-col items-center gap-2 rounded-2xl border px-5 py-4 text-center min-w-[110px]',
      isBefore
        ? 'bg-red-50 border-red-100 dark:bg-red-950/20 dark:border-red-900/40'
        : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/40',
    )}>
      <p className={cn(
        'text-[10px] font-bold uppercase tracking-widest',
        isBefore ? 'text-red-400' : 'text-emerald-600',
      )}>
        {label}
      </p>
      <div className={cn(
        'flex items-baseline gap-0.5 font-extrabold',
        isBefore ? 'text-red-500' : 'text-emerald-600',
      )}>
        <span className="text-4xl leading-none">{rank}</span>
        <span className="text-base">ème</span>
      </div>
      {!isBefore && (
        <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 rounded-full px-2 py-0.5">
          <Trophy size={9} />
          Top local
        </div>
      )}
    </div>
  );
}

// ── Custom tooltip for chart ──────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-bold text-foreground">{label}</p>
      <p className="text-emerald-600 font-semibold">{payload[0]?.value} avis</p>
    </div>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────

interface Props {
  data?: LocalVisibilityData;
  className?: string;
}

export function LocalVisibilityWidget({ data, className }: Props) {
  const d = data ?? buildDemoVisibilityData();

  const placesGained = d.startRank - d.currentRank;
  const reviewsGained = d.currentReviews - d.startReviews;
  const copilotCoverageRate = d.copilotReplied > 0
    ? Math.round((d.copilotReplied / d.currentReviews) * 100)
    : 0;

  const chartData = useMemo(
    () => buildReviewChartData(d.startReviews, d.currentReviews, d.joinedMonth),
    [d.startReviews, d.currentReviews, d.joinedMonth],
  );

  return (
    <div className={cn('bg-card border border-border rounded-2xl overflow-hidden', className)}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-gradient-to-r from-emerald-50/60 to-teal-50/40 dark:from-emerald-950/20 dark:to-teal-950/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-sm">
            <MapPin size={15} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Votre Visibilité Locale</p>
            <p className="text-[11px] text-muted-foreground">
              Mot-clé · <span className="font-semibold text-foreground">{d.primaryKeyword}</span>
            </p>
          </div>
        </div>
        <Link
          to="/google-maps"
          className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:opacity-80 transition-opacity"
        >
          Voir ma fiche <ChevronRight size={12} />
        </Link>
      </div>

      <div className="p-5 space-y-6">

        {/* ── Section 1: Position Avant / Après ──────────────────────────────── */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Position sur Google Maps
          </p>

          <div className="flex items-center gap-3">
            {/* Before badge */}
            <RankBadge rank={d.startRank} label="À l'inscription" variant="before" />

            {/* Arrow + gain */}
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div className="flex items-center gap-1 bg-emerald-500 text-white rounded-full px-3 py-1.5 shadow-md shadow-emerald-500/30">
                <ArrowUp size={13} strokeWidth={3} />
                <span className="text-xs font-extrabold">+{placesGained} places</span>
              </div>
              <div className="h-px w-full bg-gradient-to-r from-red-200 via-emerald-300 to-emerald-200" />
              <p className="text-[10px] text-muted-foreground text-center leading-tight">
                gagnées depuis<br />votre inscription
              </p>
            </div>

            {/* After badge */}
            <RankBadge rank={d.currentRank} label="Position actuelle" variant="after" />
          </div>

          {/* Progress strip */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground shrink-0">{d.startRank}ème</span>
            <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-400 via-amber-300 to-emerald-500 transition-all duration-700"
                style={{ width: `${Math.round(((d.startRank - d.currentRank) / (d.startRank - 1)) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-emerald-600 font-bold shrink-0">{d.currentRank}ème</span>
          </div>

          {/* Motivation line */}
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 px-3 py-2">
            <TrendingUp size={13} className="text-emerald-600 shrink-0" />
            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              +{placesGained} places gagnées ce mois-ci grâce à Kompilot 🚀
            </p>
          </div>
        </div>

        {/* ── Divider ────────────────────────────────────────────────────────── */}
        <div className="border-t border-border/60" />

        {/* ── Section 2: Croissance des avis ─────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Croissance des avis Google
            </p>
            <span className="text-xs font-extrabold text-emerald-600">
              +{reviewsGained} avis
            </span>
          </div>

          {/* Mini line chart */}
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="avis"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ fill: '#10B981', r: 3, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 5, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Stat row */}
          <div className="grid grid-cols-3 gap-2">
            {/* Start reviews */}
            <div className="rounded-xl bg-muted/30 border border-border px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground mb-0.5">À l'inscription</p>
              <p className="text-lg font-extrabold text-foreground">{d.startReviews}</p>
              <p className="text-[9px] text-muted-foreground">avis</p>
            </div>

            {/* Current reviews */}
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 px-3 py-2 text-center">
              <p className="text-xs text-emerald-600 mb-0.5">Aujourd'hui</p>
              <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">{d.currentReviews}</p>
              <p className="text-[9px] text-emerald-600">avis</p>
            </div>

            {/* Average rating */}
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 px-3 py-2 text-center">
              <p className="text-xs text-amber-600 mb-0.5">Note moy.</p>
              <p className="text-lg font-extrabold text-amber-700 dark:text-amber-400 flex items-baseline justify-center gap-0.5">
                {d.avgRating}<span className="text-xs font-bold">/5</span>
              </p>
              <div className="flex items-center justify-center gap-0.5 mt-0.5">
                {[1,2,3,4,5].map(i => (
                  <Star
                    key={i}
                    size={8}
                    className={i <= Math.round(d.avgRating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-muted-foreground/20'}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Divider ────────────────────────────────────────────────────────── */}
        <div className="border-t border-border/60" />

        {/* ── Section 3: Impact Copilot ───────────────────────────────────────── */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Impact de votre Copilote IA
          </p>

          <div className="flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/15 px-4 py-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Sparkles size={16} className="text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground">
                {d.copilotReplied} avis traités par votre Copilote
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {copilotCoverageRate}% de couverture · Réponses automatiques IA
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-extrabold text-primary">{copilotCoverageRate}%</p>
              <p className="text-[9px] text-muted-foreground">couverture</p>
            </div>
          </div>

          {/* Coverage bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0 avis</span>
              <span>{d.currentReviews} avis au total</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-teal-400 transition-all duration-700"
                style={{ width: `${copilotCoverageRate}%` }}
              />
            </div>
            <p className="text-[10px] text-center text-muted-foreground">
              <span className="font-semibold text-primary">{d.copilotReplied}</span> réponses générées ·{' '}
              <span className="font-semibold text-foreground">{d.currentReviews - d.copilotReplied}</span> répondus manuellement
            </p>
          </div>

          {/* Volume vs icon badge */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2">
              <MessageSquare size={13} className="text-primary shrink-0" />
              <div>
                <p className="text-xs font-bold text-foreground">{d.currentReviews}</p>
                <p className="text-[10px] text-muted-foreground">avis reçus</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2">
              <Star size={13} className="text-amber-500 fill-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-foreground">{d.avgRating}/5</p>
                <p className="text-[10px] text-muted-foreground">note globale</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
