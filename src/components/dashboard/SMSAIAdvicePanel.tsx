/**
 * SMSAIAdvicePanel
 *
 * Expanded AI recommendation engine for SMS Flash campaigns.
 * Analyses historical campaign data + current segment profile to surface:
 *   1. Segment performance comparison (all 3 segments, current highlighted)
 *   2. Historical trend chart (CA + open rate across last 4 campaigns)
 *   3. Personalised recommendation cards (timing, discount, next segment, copy)
 */
import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import { Clock, Tag, Users, MessageSquare, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { SMSCampaign } from './SMSCampaignAnalytics';

// ── Segment profiles ───────────────────────────────────────────────────────────

interface SegmentProfile {
  id:          string;
  label:       string;
  icon:        string;
  contacts:    number;
  openRate:    number; // %
  ctr:         number; // %
  convRate:    number; // %
  avgBasket:   number; // €
  bestDay:     string;
  bestHour:    string;
  bestDiscount:string;
  persona:     string; // what drives them
}

const SEGMENT_PROFILES: Record<string, SegmentProfile> = {
  'Clients VIP': {
    id: 'vip', label: 'Clients VIP', icon: '👑', contacts: 247,
    openRate: 96.2, ctr: 43.1, convRate: 28.7, avgBasket: 48,
    bestDay: 'Mardi', bestHour: '12h30', bestDiscount: '-15%',
    persona: 'Sensibles à l\'exclusivité et aux offres personnalisées',
  },
  'Clients inactifs': {
    id: 'inactive', label: 'Clients inactifs', icon: '🔄', contacts: 89,
    openRate: 94.0, ctr: 38.2, convRate: 24.1, avgBasket: 35,
    bestDay: 'Jeudi', bestHour: '10h00', bestDiscount: '-25%',
    persona: 'Réactivables par des remises fortes et un sentiment d\'urgence',
  },
  'Nouveaux clients': {
    id: 'new', label: 'Nouveaux clients', icon: '🌟', contacts: 134,
    openRate: 97.1, ctr: 45.3, convRate: 33.2, avgBasket: 28,
    bestDay: 'Lundi', bestHour: '18h00', bestDiscount: '-20%',
    persona: 'Motivés par les offres de bienvenue et la découverte',
  },
};

const FALLBACK_PROFILE = SEGMENT_PROFILES['Clients VIP'];

// ── Historical data (last 4 campaigns per segment) ────────────────────────────

const HISTORY_TRENDS = [
  { date: '19 mai', openRate: 97, ca: 1250, segment: 'Nouveaux clients' },
  { date: '22 mai', openRate: 94, ca: 870,  segment: 'Clients inactifs' },
  { date: '27 mai', openRate: 96, ca: 2840, segment: 'Clients VIP'      },
  { date: "Aujourd'hui", openRate: null, ca: null, current: true },
];

const COMPARISON_DATA = [
  { metric: 'Ouverture %', vip: 96.2, inactifs: 94.0, nouveaux: 97.1 },
  { metric: 'CTR %',       vip: 43.1, inactifs: 38.2, nouveaux: 45.3 },
  { metric: 'Conversion %',vip: 28.7, inactifs: 24.1, nouveaux: 33.2 },
];

// ── Recommendation card ────────────────────────────────────────────────────────

interface RecoCard {
  icon:     React.ElementType;
  color:    string;
  bgColor:  string;
  title:    string;
  body:     string;
  badge?:   string;
}

function buildRecos(profile: SegmentProfile, campaign: SMSCampaign, liveOpenRate: string): RecoCard[] {
  // Next best segment
  const others = Object.values(SEGMENT_PROFILES).filter(p => p.label !== profile.label);
  const nextSeg = others.reduce((best, p) => p.convRate > best.convRate ? p : best, others[0]);

  // Days until best day
  const dayNames = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  const today = new Date().getDay();
  const bestDayIndex = dayNames.indexOf(profile.bestDay);
  const daysUntil = ((bestDayIndex - today + 7) % 7) || 7;
  const bestDate = new Date();
  bestDate.setDate(bestDate.getDate() + daysUntil);
  const formattedDate = bestDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

  // Discount delta vs current
  const currentPct = parseInt(campaign.discount);
  const bestPct    = parseInt(profile.bestDiscount);
  const discountDiff = Math.abs(currentPct) - Math.abs(bestPct);

  return [
    {
      icon: Clock, color: 'text-violet-600', bgColor: 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800',
      title: 'Meilleur créneau d\'envoi',
      badge: `${profile.bestDay} ${profile.bestHour}`,
      body: `Vos ${profile.label.toLowerCase()} ouvrent préférentiellement le ${profile.bestDay.toLowerCase()} autour de ${profile.bestHour}. Programmez votre prochaine campagne le ${profile.bestDay.toLowerCase()} ${formattedDate} à ${profile.bestHour} pour maximiser votre taux d'ouverture actuel de ${liveOpenRate}.`,
    },
    {
      icon: Tag, color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
      title: 'Optimisation de la remise',
      badge: `Optimal : ${profile.bestDiscount}`,
      body: discountDiff > 0
        ? `Vous avez utilisé ${campaign.discount} mais l'analyse historique montre que ${profile.bestDiscount} génère un ROI ${Math.abs(discountDiff) * 4}% supérieur chez vos ${profile.label.toLowerCase()} — panier moyen de ${profile.avgBasket}€ vs ${profile.avgBasket - 8}€ à forte remise.`
        : `Votre remise ${campaign.discount} est déjà optimale pour ce segment. L'historique confirme que ${profile.bestDiscount} maximise le ROI chez vos ${profile.label.toLowerCase()}.`,
    },
    {
      icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
      title: 'Prochain segment à cibler',
      badge: `${nextSeg.icon} ${nextSeg.label}`,
      body: `${nextSeg.label} (${nextSeg.contacts} contacts) n'a pas reçu de campagne depuis 6 jours. Avec un taux de conversion historique de ${nextSeg.convRate}% et un créneau optimal le ${nextSeg.bestDay.toLowerCase()} à ${nextSeg.bestHour}, c'est votre meilleure opportunité de relance.`,
    },
    {
      icon: MessageSquare, color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
      title: 'Optimisation du message',
      badge: '+18% CTR estimé',
      body: `Personnalisez avec le prénom du client et une mention de sa dernière visite. Les campagnes personnalisées génèrent en moyenne 18% de CTR supplémentaire sur le segment ${profile.label.toLowerCase()}. Ajoutez aussi un lien de réservation direct plutôt qu'un lien générique.`,
    },
  ];
}

// ── Segment comparison mini-bars ──────────────────────────────────────────────

function SegmentComparisonRow({ profile, isActive, metric, value }: {
  profile: SegmentProfile; isActive: boolean; metric: string; value: number;
}) {
  return (
    <div className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-all', isActive ? 'border-primary/40 bg-primary/5' : 'border-border bg-card/40')}>
      <span className="text-base shrink-0">{profile.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-foreground truncate">{profile.label}</p>
        <p className="text-[10px] text-muted-foreground">{metric}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className={cn('h-full rounded-full', isActive ? 'bg-primary' : 'bg-muted-foreground/40')} style={{ width: `${Math.min(100, value)}%` }} />
        </div>
        <span className={cn('text-xs font-bold tabular-nums w-10 text-right', isActive ? 'text-primary' : 'text-muted-foreground')}>{value}%</span>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

interface Props {
  campaign:     SMSCampaign;
  liveOpenRate: string;
  liveCtr:      string;
  liveConvRate: string;
  liveRevenue:  number;
  progress:     number;
}

export function SMSAIAdvicePanel({ campaign, liveOpenRate, liveCtr, liveConvRate, liveRevenue, progress }: Props) {
  const [expandedReco,   setExpandedReco]   = useState<number | null>(0);
  const [activeMetric,   setActiveMetric]   = useState<'openRate' | 'ctr' | 'convRate'>('openRate');
  // Segment filter — defaults to the campaign's segment but can be changed
  const [selectedSegment, setSelectedSegment] = useState<string>(campaign.segmentLabel);

  const profile  = SEGMENT_PROFILES[selectedSegment] ?? FALLBACK_PROFILE;
  const recos    = buildRecos(profile, campaign, liveOpenRate);

  // Chart data for the metric comparison
  const metricLabel: Record<typeof activeMetric, string> = {
    openRate: 'Ouverture %', ctr: 'CTR %', convRate: 'Conversion %',
  };
  const chartData = COMPARISON_DATA.filter(d => d.metric === metricLabel[activeMetric]);

  // Trend data enriched with current campaign
  const trendData = HISTORY_TRENDS.map(d => ({
    ...d,
    openRate: d.current ? parseFloat(liveOpenRate) || null : d.openRate,
    ca:       d.current ? Math.round(liveRevenue)       : d.ca,
  }));

  // Filter history to selected segment (or show all if "all" toggle)
  const [showAllHistory, setShowAllHistory] = useState(false);
  const filteredTrend = showAllHistory
    ? trendData
    : trendData.filter(d => (d as any).segment === selectedSegment || (d as any).current);

  if (progress < 30) return null; // Show only once enough data is in

  return (
    <div className="space-y-5 animate-in fade-in duration-500">

      {/* ── Section header ── */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center shrink-0">
          <Sparkles size={13} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-extrabold text-foreground">Recommandations IA Personnalisées</p>
          <p className="text-[11px] text-muted-foreground">Filtrez par segment pour personnaliser les conseils</p>
        </div>
      </div>

      {/* ── Segment filter bar ── */}
      <div className="flex gap-1.5 flex-wrap">
        {Object.values(SEGMENT_PROFILES).map(p => {
          const isActive = selectedSegment === p.label;
          const isCurrent = p.label === campaign.segmentLabel;
          return (
            <button
              key={p.id}
              onClick={() => { setSelectedSegment(p.label); setExpandedReco(0); }}
              className={cn(
                'flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all select-none',
                isActive
                  ? 'border-primary/40 bg-primary/5 text-primary shadow-sm'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
              )}
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
              {isCurrent && (
                <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full px-1.5 py-0.5 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800">
                  actif
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Segment profile card ── */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <p className="text-xs font-bold text-foreground uppercase tracking-wide">Profil · {profile.label}</p>
        <div className="flex items-start gap-3">
          <div className="text-3xl leading-none">{profile.icon}</div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-foreground">{profile.label}</span>
              <span className="text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">{profile.contacts} contacts</span>
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300">
                Optimal : {profile.bestDiscount}
              </span>
              {profile.label !== campaign.segmentLabel && (
                <span className="text-[9px] text-muted-foreground italic">(segment comparatif)</span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed italic">"{profile.persona}"</p>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {[
                { label: 'Ouverture', value: `${profile.openRate}%` },
                { label: 'CTR moy.',  value: `${profile.ctr}%` },
                { label: 'Panier',    value: `${profile.avgBasket}€` },
              ].map(m => (
                <div key={m.label} className="text-center rounded-lg bg-muted/40 py-1.5">
                  <p className="text-sm font-extrabold text-foreground tabular-nums">{m.value}</p>
                  <p className="text-[9px] text-muted-foreground">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Segment comparison ── */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-foreground">Comparaison des segments</p>
          <div className="flex gap-1">
            {(['openRate', 'ctr', 'convRate'] as const).map(m => (
              <button
                key={m}
                onClick={() => setActiveMetric(m)}
                className={cn('text-[9px] font-bold px-2 py-1 rounded-lg border transition-all', activeMetric === m ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary/40')}
              >
                {m === 'openRate' ? 'Ouverture' : m === 'ctr' ? 'CTR' : 'Conversion'}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          {Object.values(SEGMENT_PROFILES).map(p => (
            <SegmentComparisonRow
              key={p.id}
              profile={p}
              isActive={p.label === selectedSegment}
              metric={metricLabel[activeMetric]}
              value={p[activeMetric]}
            />
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">
          {profile.label} classé <strong>#{Object.values(SEGMENT_PROFILES).sort((a, b) => b[activeMetric] - a[activeMetric]).findIndex(p => p.label === selectedSegment) + 1}</strong> sur 3 pour {metricLabel[activeMetric].replace(' %', '').toLowerCase()}
        </p>
      </div>

      {/* ── Historical trend chart ── */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-foreground">Tendance CA · {profile.label}</p>
          <button
            onClick={() => setShowAllHistory(v => !v)}
            className="text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            {showAllHistory ? 'Filtrer ce segment' : 'Voir tous'}
          </button>
        </div>
        <ResponsiveContainer width="100%" height={130}>
          <LineChart data={showAllHistory ? trendData : filteredTrend} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
              formatter={(v: number, name: string) => [name === 'ca' ? `${v.toLocaleString('fr-FR')}€` : `${v}%`, name === 'ca' ? 'CA' : 'Ouverture']}
            />
            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} formatter={v => v === 'ca' ? 'CA (€)' : 'Ouverture (%)'} />
            <Line type="monotone" dataKey="ca" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} connectNulls activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="openRate" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} connectNulls strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
        {liveRevenue > 0 && (
          <p className="text-[10px] text-muted-foreground">
            📈 Cette campagne génère <strong>{liveRevenue.toLocaleString('fr-FR')}€</strong> — {
              liveRevenue > 2000 ? 'votre meilleure performance ce mois !' :
              liveRevenue > 1000 ? 'dans la moyenne haute de vos campagnes.' :
              'en dessous de la moyenne — testez un segment différent.'
            }
          </p>
        )}
      </div>

      {/* ── Recommendation cards ── */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-foreground uppercase tracking-wide">
          Actions recommandées · {profile.label}
        </p>
        {recos.map((reco, i) => {
          const Icon = reco.icon;
          const isOpen = expandedReco === i;
          return (
            <div key={i} className={cn('rounded-xl border transition-all overflow-hidden', reco.bgColor)}>
              <button
                onClick={() => setExpandedReco(isOpen ? null : i)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-white/60 dark:bg-black/20 flex items-center justify-center shrink-0">
                  <Icon size={13} className={reco.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground">{reco.title}</p>
                  {reco.badge && (
                    <span className="text-[10px] font-semibold text-muted-foreground">{reco.badge}</span>
                  )}
                </div>
                {isOpen ? <ChevronUp size={13} className="text-muted-foreground shrink-0" /> : <ChevronDown size={13} className="text-muted-foreground shrink-0" />}
              </button>
              {isOpen && (
                <div className="px-4 pb-3">
                  <p className="text-xs text-foreground/80 leading-relaxed">{reco.body}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}