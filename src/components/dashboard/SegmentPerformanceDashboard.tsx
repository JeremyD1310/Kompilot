/**
 * SegmentPerformanceDashboard
 *
 * Standalone panel showing KPIs, history and AI advice per user segment.
 * A segment filter bar at the top drives all sections simultaneously:
 *   • Full KPI grid  (online-presence-relevant metrics)
 *   • Multi-metric bar chart across segments
 *   • Per-segment campaign history table (filterable)
 *   • AI recommendation section  (re-uses buildRecos logic)
 */
import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import {
  Users, TrendingUp, MousePointerClick, ShoppingCart, Euro,
  Clock, Star, Repeat2, Eye, Zap, ChevronDown, ChevronUp, Info,
} from 'lucide-react';
import { cn } from '../../lib/utils';

// ── Segment data ───────────────────────────────────────────────────────────────

type SegmentId = 'all' | 'vip' | 'inactive' | 'new';

interface SegmentProfile {
  id:           SegmentId;
  label:        string;
  icon:         string;
  contacts:     number;
  // SMS metrics
  openRate:     number;
  ctr:          number;
  convRate:     number;
  avgBasket:    number;
  // Online presence metrics
  googleRating: number;   // avg Google rating from this segment
  reviewRate:   number;   // % who left a Google review after visit
  repeatVisit:  number;   // % 2nd visit within 60 days
  bookingRate:  number;   // % who booked online
  engagementScore: number; // composite social engagement score 0–100
  churnRisk:    number;   // % at risk of churning
  // Timing
  bestDay:      string;
  bestHour:     string;
  bestDiscount: string;
  persona:      string;
  // Color
  color:        string;
  accentBg:     string;
  accentText:   string;
  accentBorder: string;
}

const SEGMENTS: Record<SegmentId, SegmentProfile> = {
  all: {
    id: 'all', label: 'Tous les segments', icon: '📊', contacts: 470,
    openRate: 95.8, ctr: 42.2, convRate: 29.1, avgBasket: 39,
    googleRating: 4.5, reviewRate: 18.4, repeatVisit: 41.0, bookingRate: 34.2,
    engagementScore: 71, churnRisk: 14,
    bestDay: 'Mardi', bestHour: '12h30', bestDiscount: '-20%',
    persona: 'Vue agrégée de l\'ensemble de votre base clients',
    color: 'hsl(var(--primary))', accentBg: 'bg-primary/5', accentText: 'text-primary', accentBorder: 'border-primary/30',
  },
  vip: {
    id: 'vip', label: 'Clients VIP', icon: '👑', contacts: 247,
    openRate: 96.2, ctr: 43.1, convRate: 28.7, avgBasket: 48,
    googleRating: 4.8, reviewRate: 26.1, repeatVisit: 68.4, bookingRate: 52.3,
    engagementScore: 88, churnRisk: 6,
    bestDay: 'Mardi', bestHour: '12h30', bestDiscount: '-15%',
    persona: 'Sensibles à l\'exclusivité et aux offres personnalisées. Ambassadeurs naturels.',
    color: '#8b5cf6', accentBg: 'bg-violet-50 dark:bg-violet-950/20', accentText: 'text-violet-700 dark:text-violet-300', accentBorder: 'border-violet-200 dark:border-violet-800',
  },
  inactive: {
    id: 'inactive', label: 'Clients inactifs', icon: '🔄', contacts: 89,
    openRate: 94.0, ctr: 38.2, convRate: 24.1, avgBasket: 35,
    googleRating: 4.1, reviewRate: 9.8, repeatVisit: 12.3, bookingRate: 18.7,
    engagementScore: 42, churnRisk: 61,
    bestDay: 'Jeudi', bestHour: '10h00', bestDiscount: '-25%',
    persona: 'Réactivables par des remises fortes. Risque de churn élevé — priorité de rétention.',
    color: '#f59e0b', accentBg: 'bg-amber-50 dark:bg-amber-950/20', accentText: 'text-amber-700 dark:text-amber-300', accentBorder: 'border-amber-200 dark:border-amber-800',
  },
  new: {
    id: 'new', label: 'Nouveaux clients', icon: '🌟', contacts: 134,
    openRate: 97.1, ctr: 45.3, convRate: 33.2, avgBasket: 28,
    googleRating: 4.6, reviewRate: 22.4, repeatVisit: 38.7, bookingRate: 41.1,
    engagementScore: 79, churnRisk: 23,
    bestDay: 'Lundi', bestHour: '18h00', bestDiscount: '-20%',
    persona: 'Motivés par les offres de bienvenue. Fort potentiel de fidélisation sur 90 jours.',
    color: '#10b981', accentBg: 'bg-emerald-50 dark:bg-emerald-950/20', accentText: 'text-emerald-700 dark:text-emerald-300', accentBorder: 'border-emerald-200 dark:border-emerald-800',
  },
};

// ── Per-segment campaign history ───────────────────────────────────────────────

interface CampaignRow {
  date:    string;
  code:    string;
  segment: SegmentId;
  sent:    number;
  open:    string;
  ctr:     string;
  conv:    string;
  ca:      string;
  roi:     string;
}

const ALL_HISTORY: CampaignRow[] = [
  { date: 'Lun 19 mai', code: 'FLASH10', segment: 'new',      sent: 134, open: '97%', ctr: '45%', conv: '33%', ca: '1 250€', roi: '+820%' },
  { date: 'Jeu 22 mai', code: 'JEUDI15', segment: 'inactive', sent: 89,  open: '94%', ctr: '38%', conv: '24%', ca: '870€',   roi: '+718%' },
  { date: 'Mar 27 mai', code: 'MARDI20', segment: 'vip',      sent: 247, open: '96%', ctr: '41%', conv: '29%', ca: '2 840€', roi: '+863%' },
  { date: 'Lun 2 jun',  code: 'BIENVENU', segment: 'new',     sent: 134, open: '98%', ctr: '47%', conv: '35%', ca: '1 410€', roi: '+941%' },
  { date: 'Jeu 5 jun',  code: 'RETOUR25', segment: 'inactive',sent: 89,  open: '93%', ctr: '36%', conv: '22%', ca: '760€',   roi: '+614%' },
  { date: 'Mar 10 jun', code: 'VIP15',   segment: 'vip',      sent: 247, open: '97%', ctr: '44%', conv: '31%', ca: '3 100€', roi: '+944%' },
];

// ── Radar/bar chart data ───────────────────────────────────────────────────────

const METRIC_KEYS: { key: keyof SegmentProfile; label: string; max: number }[] = [
  { key: 'openRate',       label: 'Ouverture SMS',   max: 100 },
  { key: 'engagementScore',label: 'Engagement',      max: 100 },
  { key: 'repeatVisit',    label: '2ème visite',     max: 100 },
  { key: 'bookingRate',    label: 'Réservation',     max: 100 },
  { key: 'reviewRate',     label: 'Avis Google',     max: 40  },
];

function buildRadarData(segId: SegmentId) {
  const segs = segId === 'all'
    ? (['vip', 'inactive', 'new'] as SegmentId[]).map(id => SEGMENTS[id])
    : [SEGMENTS[segId]];

  return METRIC_KEYS.map(m => {
    const row: Record<string, number | string> = { metric: m.label };
    segs.forEach(s => {
      row[s.label] = Math.round(((s[m.key] as number) / m.max) * 100);
    });
    return row;
  });
}

function buildBarData() {
  return [
    { metric: 'SMS ouverture',  vip: 96.2, inactifs: 94.0, nouveaux: 97.1 },
    { metric: 'CTR',            vip: 43.1, inactifs: 38.2, nouveaux: 45.3 },
    { metric: 'Conversion',     vip: 28.7, inactifs: 24.1, nouveaux: 33.2 },
    { metric: 'Réservation %',  vip: 52.3, inactifs: 18.7, nouveaux: 41.1 },
    { metric: 'Fidélisation %', vip: 68.4, inactifs: 12.3, nouveaux: 38.7 },
  ];
}

// ── KPI definitions per segment ────────────────────────────────────────────────

function buildKPIs(p: SegmentProfile) {
  const roiEst = Math.round(((p.convRate / 100) * p.contacts * p.avgBasket - p.contacts * 0.12) / (p.contacts * 0.12) * 100);
  return [
    { icon: Users,            label: 'Contacts',          value: p.contacts.toLocaleString('fr-FR'),  sub: 'dans ce segment',          color: 'bg-slate-500'   },
    { icon: Eye,              label: 'Taux d\'ouverture',  value: `${p.openRate}%`,                    sub: 'avg SMS campagnes',         color: 'bg-violet-500'  },
    { icon: MousePointerClick,label: 'CTR moyen',          value: `${p.ctr}%`,                         sub: 'clics sur le lien',         color: 'bg-blue-500'    },
    { icon: ShoppingCart,     label: 'Taux conversion',   value: `${p.convRate}%`,                    sub: 'réservations générées',     color: 'bg-amber-500'   },
    { icon: Euro,             label: 'Panier moyen',       value: `${p.avgBasket}€`,                   sub: 'par conversion',            color: 'bg-emerald-500' },
    { icon: Star,             label: 'Note Google',        value: `${p.googleRating}/5`,               sub: `${p.reviewRate}% laissent un avis`, color: 'bg-yellow-500'  },
    { icon: Repeat2,          label: '2ème visite',        value: `${p.repeatVisit}%`,                 sub: 'dans les 60 jours',         color: 'bg-teal-500'    },
    { icon: Zap,              label: 'ROI estimé',         value: `+${roiEst}%`,                       sub: 'sur coût SMS',              color: 'bg-primary'     },
  ];
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function KPITile({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub: string; color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-3.5 py-3 space-y-1.5">
      <div className={cn('w-6 h-6 rounded-md flex items-center justify-center', color)}>
        <Icon size={12} className="text-white" />
      </div>
      <p className="text-[11px] text-muted-foreground leading-none">{label}</p>
      <p className="text-base font-extrabold text-foreground tabular-nums leading-none">{value}</p>
      <p className="text-[9px] text-muted-foreground leading-none">{sub}</p>
    </div>
  );
}

function ChurnBadge({ risk }: { risk: number }) {
  const level = risk > 50 ? 'high' : risk > 25 ? 'med' : 'low';
  const styles = {
    high: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-300 dark:border-red-800',
    med:  'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-800',
    low:  'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-800',
  }[level];
  const label = { high: 'Risque churn élevé', med: 'Risque churn modéré', low: 'Churn maîtrisé' }[level];
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border', styles)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', level === 'high' ? 'bg-red-500 animate-pulse' : level === 'med' ? 'bg-amber-500' : 'bg-emerald-500')} />
      {label} · {risk}%
    </span>
  );
}

function EngagementBar({ score }: { score: number }) {
  const color = score > 70 ? 'bg-emerald-500' : score > 45 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[10px] font-bold tabular-nums text-foreground w-7 text-right">{score}</span>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export function SegmentPerformanceDashboard() {
  const [activeSegment, setActiveSegment] = useState<SegmentId>('all');
  const [expandedInsight, setExpandedInsight] = useState(true);
  const [historyFilter, setHistoryFilter] = useState<SegmentId>('all');

  const profile  = SEGMENTS[activeSegment];
  const kpis     = useMemo(() => buildKPIs(profile), [profile]);
  const radarData = useMemo(() => buildRadarData(activeSegment), [activeSegment]);
  const barData   = buildBarData();

  const filteredHistory = historyFilter === 'all'
    ? ALL_HISTORY
    : ALL_HISTORY.filter(r => r.segment === historyFilter);

  const segmentKeys = (activeSegment === 'all'
    ? (['vip', 'inactive', 'new'] as SegmentId[]).map(id => ({ key: SEGMENTS[id].label, color: SEGMENTS[id].color }))
    : [{ key: profile.label, color: profile.color }]);

  const SEGMENT_TABS: SegmentId[] = ['all', 'vip', 'inactive', 'new'];

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center shrink-0 shadow-sm">
          <Users size={14} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-extrabold text-foreground">Performance par Segment Client</p>
          <p className="text-[11px] text-muted-foreground">Métriques de présence en ligne filtrées par segment</p>
        </div>
      </div>

      {/* ── Segment filter tabs ── */}
      <div className="flex gap-1.5 flex-wrap">
        {SEGMENT_TABS.map(segId => {
          const seg = SEGMENTS[segId];
          const isActive = activeSegment === segId;
          return (
            <button
              key={segId}
              onClick={() => setActiveSegment(segId)}
              className={cn(
                'flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all select-none',
                isActive
                  ? cn(seg.accentBg, seg.accentText, seg.accentBorder, 'shadow-sm')
                  : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
              )}
            >
              <span>{seg.icon}</span>
              <span>{seg.label}</span>
              <span className={cn(
                'text-[9px] font-bold rounded-full px-1.5 py-0.5',
                isActive ? cn(seg.accentBg, seg.accentText) : 'bg-muted text-muted-foreground'
              )}>
                {seg.contacts}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Profile strip ── */}
      <div className={cn('rounded-2xl border p-4 flex items-start gap-3', profile.accentBg, profile.accentBorder)}>
        <span className="text-3xl leading-none shrink-0">{profile.icon}</span>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-extrabold text-foreground">{profile.label}</span>
            <span className={cn('text-[10px] font-bold rounded-full px-2 py-0.5 border', profile.accentBg, profile.accentText, profile.accentBorder)}>
              {profile.contacts} contacts
            </span>
            <ChurnBadge risk={profile.churnRisk} />
          </div>
          <p className="text-[11px] text-muted-foreground italic">"{profile.persona}"</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] text-muted-foreground">Score d'engagement</span>
            <div className="flex-1 max-w-32">
              <EngagementBar score={profile.engagementScore} />
            </div>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] text-muted-foreground">Meilleur créneau</p>
          <p className="text-xs font-extrabold text-foreground">{profile.bestDay} {profile.bestHour}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Remise optimale</p>
          <p className="text-xs font-extrabold text-foreground">{profile.bestDiscount}</p>
        </div>
      </div>

      {/* ── KPI grid ── */}
      <div>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Indicateurs clés · {profile.label}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {kpis.map(kpi => (
            <KPITile key={kpi.label} {...kpi} />
          ))}
        </div>
      </div>

      {/* ── Charts grid ── */}
      <div className="grid sm:grid-cols-2 gap-4">

        {/* Radar / spider chart — single segment */}
        {activeSegment !== 'all' && (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <p className="text-xs font-bold text-foreground">Profil de performance — {profile.label}</p>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData} margin={{ top: 8, right: 20, bottom: 8, left: 20 }}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name={profile.label}
                  dataKey={profile.label}
                  stroke={profile.color}
                  fill={profile.color}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
                  formatter={(v: number) => [`${v}/100`, '']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Bar chart — cross-segment comparison */}
        <div className={cn('rounded-2xl border border-border bg-card p-4 space-y-2', activeSegment !== 'all' && 'sm:col-span-1', activeSegment === 'all' && 'sm:col-span-2')}>
          <p className="text-xs font-bold text-foreground">Comparaison toutes métriques · tous segments</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 4, right: 4, bottom: 0, left: -18 }} barCategoryGap="30%">
              <XAxis dataKey="metric" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
                formatter={(v: number) => [`${v}%`, '']}
              />
              <Bar dataKey="vip"      name="Clients VIP"      fill="#8b5cf6" radius={[3, 3, 0, 0]} opacity={activeSegment === 'vip'      || activeSegment === 'all' ? 1 : 0.25} />
              <Bar dataKey="inactifs" name="Clients inactifs" fill="#f59e0b" radius={[3, 3, 0, 0]} opacity={activeSegment === 'inactive' || activeSegment === 'all' ? 1 : 0.25} />
              <Bar dataKey="nouveaux" name="Nouveaux clients" fill="#10b981" radius={[3, 3, 0, 0]} opacity={activeSegment === 'new'      || activeSegment === 'all' ? 1 : 0.25} />
            </BarChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 justify-center pt-1">
            {[{ label: 'Clients VIP', color: '#8b5cf6' }, { label: 'Clients inactifs', color: '#f59e0b' }, { label: 'Nouveaux clients', color: '#10b981' }].map(l => (
              <span key={l.label} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-sm inline-block shrink-0" style={{ background: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filterable campaign history ── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/20 flex-wrap">
          <p className="text-xs font-bold text-foreground uppercase tracking-wide">Historique des campagnes</p>
          <div className="flex gap-1 flex-wrap">
            {(['all', 'vip', 'inactive', 'new'] as SegmentId[]).map(sid => (
              <button
                key={sid}
                onClick={() => setHistoryFilter(sid)}
                className={cn(
                  'flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border transition-all',
                  historyFilter === sid
                    ? 'bg-primary text-white border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/30'
                )}
              >
                {SEGMENTS[sid].icon} {sid === 'all' ? 'Tous' : SEGMENTS[sid].label.split(' ')[1]}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {['Date', 'Code', 'Segment', 'Envoyés', 'Ouverture', 'CTR', 'Conversion', 'CA', 'ROI'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-muted-foreground font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((row, i) => {
                const seg = SEGMENTS[row.segment];
                return (
                  <tr key={i} className={cn('border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors', row.segment === activeSegment && activeSegment !== 'all' && 'bg-primary/5')}>
                    <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{row.date}</td>
                    <td className="px-3 py-2.5 font-mono font-bold text-foreground whitespace-nowrap">{row.code}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border', seg.accentBg, seg.accentText, seg.accentBorder)}>
                        {seg.icon} {seg.label.split(' ').slice(1).join(' ')}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground tabular-nums">{row.sent}</td>
                    <td className="px-3 py-2.5 font-semibold text-violet-600">{row.open}</td>
                    <td className="px-3 py-2.5 font-semibold text-blue-600">{row.ctr}</td>
                    <td className="px-3 py-2.5 font-semibold text-amber-600">{row.conv}</td>
                    <td className="px-3 py-2.5 font-bold text-foreground tabular-nums">{row.ca}</td>
                    <td className="px-3 py-2.5 font-extrabold text-emerald-600 tabular-nums">{row.roi}</td>
                  </tr>
                );
              })}
              {filteredHistory.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-6 text-center text-xs text-muted-foreground">Aucune campagne pour ce segment</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── AI insight section ── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <button
          onClick={() => setExpandedInsight(v => !v)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-gradient-to-r from-primary/5 to-teal-500/5 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center shrink-0">
              <TrendingUp size={11} className="text-white" />
            </div>
            <p className="text-xs font-extrabold text-foreground">
              Conseils IA — {profile.label}
            </p>
          </div>
          {expandedInsight
            ? <ChevronUp size={13} className="text-muted-foreground shrink-0" />
            : <ChevronDown size={13} className="text-muted-foreground shrink-0" />
          }
        </button>

        {expandedInsight && (
          <div className="p-4 space-y-3">
            {activeSegment === 'all' ? (
              <div className="space-y-2.5">
                {([['vip', 'Vos Clients VIP affichent le meilleur panier moyen (48€) et le score d\'engagement le plus élevé (88/100). Priorité : campagnes d\'exclusivité le mardi à 12h30.'],
                   ['inactive', 'Vos Clients inactifs ont un risque de churn critique (61%). Lancez une campagne de réactivation avec -25% dès cette semaine — chaque jour coûte des clients.'],
                   ['new', 'Vos Nouveaux clients convertissent le mieux (33.2%). Le créneau lundi 18h00 est optimal pour maximiser les 2èmes visites dans les 60 jours.'],
                ] as [SegmentId, string][]).map(([sid, text]) => {
                  const s = SEGMENTS[sid];
                  return (
                    <div key={sid} className={cn('rounded-xl border p-3 flex items-start gap-2.5', s.accentBg, s.accentBorder)}>
                      <span className="text-base shrink-0">{s.icon}</span>
                      <div>
                        <p className="text-[11px] font-bold text-foreground mb-0.5">{s.label}</p>
                        <p className="text-[11px] text-foreground/80 leading-relaxed">{text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Timing */}
                <div className={cn('rounded-xl border p-3', profile.accentBg, profile.accentBorder)}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock size={11} className={profile.accentText} />
                    <p className="text-[11px] font-bold text-foreground">Envoi optimal</p>
                    <span className={cn('ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded border', profile.accentBg, profile.accentText, profile.accentBorder)}>
                      {profile.bestDay} {profile.bestHour}
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground/80 leading-relaxed">
                    Ce segment ouvre préférentiellement le {profile.bestDay.toLowerCase()} à {profile.bestHour}. Programmez vos prochaines campagnes sur ce créneau pour +12% d'ouvertures estimées.
                  </p>
                </div>

                {/* Churn risk */}
                {profile.churnRisk > 30 && (
                  <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Info size={11} className="text-red-600" />
                      <p className="text-[11px] font-bold text-foreground">Attention — Risque de churn {profile.churnRisk}%</p>
                    </div>
                    <p className="text-[11px] text-foreground/80 leading-relaxed">
                      {profile.id === 'inactive'
                        ? 'Ce segment n\'a pas visité depuis +3 mois. Une remise de -25% avec message personnalisé peut récupérer jusqu\'à 30% de ces clients perdus.'
                        : `${profile.churnRisk}% de ce segment risque de ne pas revenir. Renforcez l'engagement avec des contenus exclusifs et des offres de fidélité.`
                      }
                    </p>
                  </div>
                )}

                {/* Growth opportunity */}
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp size={11} className="text-emerald-600" />
                    <p className="text-[11px] font-bold text-foreground">Opportunité de croissance</p>
                    <span className="ml-auto text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                      ROI {Math.round(((profile.convRate / 100) * profile.contacts * profile.avgBasket - profile.contacts * 0.12) / (profile.contacts * 0.12) * 100)}%
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground/80 leading-relaxed">
                    Avec {profile.contacts} contacts à {profile.avgBasket}€ de panier moyen et {profile.convRate}% de conversion, la prochaine campagne peut générer jusqu'à{' '}
                    <strong>{Math.round(profile.contacts * (profile.convRate / 100) * profile.avgBasket).toLocaleString('fr-FR')}€</strong> de CA.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
