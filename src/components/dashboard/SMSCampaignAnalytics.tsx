/**
 * SMSCampaignAnalytics — live analytics panel for a sent SMS Flash campaign.
 *
 * Metrics update in real time via Blink Realtime (useSMSCampaignRealtime).
 * KPI counters animate from 0 to their live values; the area chart and funnel
 * bars grow as events arrive.
 */
import { useMemo, useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, MousePointerClick, ShoppingCart, Euro, PlusCircle,
  Radio, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useSMSCampaignRealtime } from '../../hooks/useSMSCampaignRealtime';
import { SMSAIAdvicePanel } from './SMSAIAdvicePanel';
import { TermTooltip } from '../shared/TermTooltip';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface SMSCampaign {
  id:           string;
  sentAt:       Date;
  code:         string;
  discount:     string;
  segmentLabel: string;
  sent:         number;
}

interface Props {
  campaign:      SMSCampaign;
  onNewCampaign: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const AVG_BASKET = 42; // €

function safeRate(num: number, den: number) {
  if (den === 0) return '—';
  return ((num / den) * 100).toFixed(1) + '%';
}

function computeRoi(revenue: number, sent: number) {
  const cost = sent * 0.12;
  if (cost === 0) return 0;
  return Math.round(((revenue - cost) / cost) * 100);
}

// ── Animated counter ──────────────────────────────────────────────────────────

function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const steps = 18;
    const interval = 40; // ms
    const delta = (value - display) / steps;
    let count = 0;
    const t = setInterval(() => {
      count++;
      setDisplay(prev => {
        const next = prev + delta;
        return count >= steps ? value : next;
      });
      if (count >= steps) clearInterval(t);
    }, interval);
    return () => clearInterval(t);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span className="tabular-nums">
      {decimals > 0
        ? display.toFixed(decimals)
        : Math.round(display).toLocaleString('fr-FR')}
    </span>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────

function KPI({ icon: Icon, label, value, sub, color, isLive, term }: {
  icon: React.ElementType; label: string; value: React.ReactNode;
  sub: string; color: string; isLive?: boolean; term?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 space-y-1 relative overflow-hidden">
      {isLive && (
        <span className="absolute top-2 right-2 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping absolute" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </span>
      )}
      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center mb-2', color)}>
        <Icon size={14} className="text-white" />
      </div>
      <div className="flex items-center gap-1.5">
        <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
        {term && <TermTooltip term={term} size="sm" />}
      </div>
      <p className="text-xl font-extrabold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}

// ── Funnel step ────────────────────────────────────────────────────────────────

function FunnelStep({ label, value, total, color }: {
  label: string; value: number; total: number; color: string;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className="font-bold text-foreground tabular-nums">
          {value.toLocaleString('fr-FR')}{' '}
          <span className="text-muted-foreground font-normal">({pct}%)</span>
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function LiveStatusBadge({ status }: { status: 'connecting' | 'live' | 'completed' | 'error' }) {
  if (status === 'connecting') return (
    <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      Connexion…
    </span>
  );
  if (status === 'live') return (
    <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
      <Radio size={10} className="shrink-0" />
      LIVE — données en temps réel
    </span>
  );
  if (status === 'completed') return (
    <span className="flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1">
      <CheckCircle2 size={10} className="shrink-0" />
      Campagne terminée · Rapport final
    </span>
  );
  return (
    <span className="flex items-center gap-1.5 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-2.5 py-1">
      <AlertCircle size={10} /> Erreur de connexion
    </span>
  );
}

// ── Past campaigns mock history ───────────────────────────────────────────────

const HISTORY = [
  { date: 'Mardi 27 mai',  code: 'MARDI20',  segment: 'VIP',      sent: 247, open: '96%', ctr: '41%', conv: '29%', rev: '2 840€' },
  { date: 'Jeudi 22 mai',  code: 'JEUDI15',  segment: 'Inactifs', sent:  89, open: '94%', ctr: '38%', conv: '24%', rev: '870€'   },
  { date: 'Lundi 19 mai',  code: 'FLASH10',  segment: 'Nouveaux', sent: 134, open: '97%', ctr: '45%', conv: '33%', rev: '1 250€' },
];

// ── Event type labels / colors ─────────────────────────────────────────────────

const EVENT_STYLE: Record<string, string> = {
  delivered: 'text-blue-600 bg-blue-50 border-blue-200',
  opened:    'text-violet-600 bg-violet-50 border-violet-200',
  clicked:   'text-amber-600 bg-amber-50 border-amber-200',
  converted: 'text-emerald-600 bg-emerald-50 border-emerald-200',
};
const EVENT_ICON: Record<string, string> = {
  delivered: '📤', opened: '👁️', clicked: '🔗', converted: '🛒',
};

// ── Main component ─────────────────────────────────────────────────────────────

export function SMSCampaignAnalytics({ campaign, onNewCampaign }: Props) {
  const live = useSMSCampaignRealtime({
    campaignId:  campaign.id,
    totalSent:   campaign.sent,
    avgBasket:   AVG_BASKET,
    autoSimulate: true,
  });

  const roi = computeRoi(live.revenue, campaign.sent);

  // Build hourly-style chart from live events (group by type bucket for visual effect)
  const chartData = useMemo(() => {
    // Cumulative snapshot every ~2.5s simulated as chart points
    const POINTS = 8;
    const points = Array.from({ length: POINTS }, (_, i) => ({
      h: `+${i * 30}min`,
      ouvertures: i <= POINTS - 1
        ? Math.round(live.opened * (i / (POINTS - 1)) * (0.6 + Math.random() * 0.1))
        : live.opened,
    }));
    // Override last point with live value
    points[points.length - 1].ouvertures = live.opened;
    return points;
  }, [live.opened]);

  const openRate = safeRate(live.opened, live.delivered);
  const ctr      = safeRate(live.clicked, live.opened);
  const convRate = safeRate(live.converted, live.clicked);

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-base font-extrabold text-foreground flex items-center gap-2 flex-wrap">
            📊 Analytics — Code{' '}
            <span className="font-mono text-primary">{campaign.code}</span>
            {roi !== 0 && (
              <span className={cn(
                'text-[11px] font-extrabold rounded-full px-2.5 py-1 border',
                roi > 0
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-red-50 text-red-600 border-red-200'
              )}>
                ROI {roi > 0 ? '+' : ''}{roi}%
              </span>
            )}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {campaign.segmentLabel} · {campaign.sent.toLocaleString('fr-FR')} SMS · {campaign.discount}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <LiveStatusBadge status={live.status} />
          <button
            onClick={onNewCampaign}
            className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg px-3 py-1.5 transition-colors"
          >
            <PlusCircle size={12} /> Nouvelle campagne
          </button>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-foreground">
            {live.status === 'completed' ? 'Rapport complet' : 'Collecte des données en cours…'}
          </span>
          <span className="text-muted-foreground tabular-nums">{live.progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700',
              live.status === 'completed' ? 'bg-primary' : 'bg-gradient-to-r from-violet-500 to-primary'
            )}
            style={{ width: `${live.progress}%` }}
          />
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI
          icon={TrendingUp} color="bg-violet-500" isLive={live.isLive}
          label="Taux d'ouverture"
          value={<>{openRate !== '—' ? openRate : <span className="text-sm text-muted-foreground">…</span>}</>}
          sub={`${live.opened.toLocaleString('fr-FR')} / ${live.delivered.toLocaleString('fr-FR')} livrés`}
        />
        <KPI
          icon={MousePointerClick} color="bg-blue-500" isLive={live.isLive}
          label="Taux de clic (CTR)"
          value={<>{ctr !== '—' ? ctr : <span className="text-sm text-muted-foreground">…</span>}</>}
          sub={`${live.clicked.toLocaleString('fr-FR')} clics sur le lien`}
          term="CTR"
        />
        <KPI
          icon={ShoppingCart} color="bg-amber-500" isLive={live.isLive}
          label="Taux de conversion"
          value={<>{convRate !== '—' ? convRate : <span className="text-sm text-muted-foreground">…</span>}</>}
          sub={`${live.converted.toLocaleString('fr-FR')} réservations`}
        />
        <KPI
          icon={Euro} color="bg-emerald-500" isLive={live.isLive}
          label="Chiffre d'affaires"
          value={<><AnimatedNumber value={live.revenue} />€</>}
          sub={live.converted > 0 ? `Panier moyen : ${Math.round(live.revenue / live.converted)}€` : 'En attente…'}
        />
      </div>

      {/* ── Live event feed + chart ── */}
      <div className="grid sm:grid-cols-2 gap-4">

        {/* Live event feed */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/20">
            {live.isLive && (
              <span className="relative flex shrink-0">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
            )}
            <p className="text-[11px] font-bold text-foreground uppercase tracking-wide">
              {live.isLive ? 'Événements en direct' : 'Journal des événements'}
            </p>
          </div>
          <div className="divide-y divide-border/40 max-h-52 overflow-y-auto">
            {live.events.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                En attente des premiers événements…
              </div>
            )}
            {live.events.map(ev => (
              <div key={ev.id} className="flex items-center gap-3 px-4 py-2.5 animate-in fade-in slide-in-from-top-1 duration-300">
                <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0', EVENT_STYLE[ev.type])}>
                  {EVENT_ICON[ev.type]} {ev.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{ev.label}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {ev.count.toLocaleString('fr-FR')} contacts · {ev.ts.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live opens chart */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <p className="text-xs font-bold text-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-500 inline-block shrink-0" />
            Ouvertures dans le temps
          </p>
          <ResponsiveContainer width="100%" height={148}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="live-opens-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#8b5cf6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <XAxis dataKey="h" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
                formatter={(v: number) => [`${v} ouvertures`, '']}
              />
              <Area type="monotone" dataKey="ouvertures" stroke="#8b5cf6" strokeWidth={2} fill="url(#live-opens-grad)" isAnimationActive={true} animationDuration={400} />
            </AreaChart>
          </ResponsiveContainer>
          {live.opened > 0 && (
            <p className="text-[10px] text-muted-foreground">
              💡 <strong>{Math.round((live.opened / Math.max(live.delivered, 1)) * 100)}%</strong> de taux d'ouverture actuel
            </p>
          )}
        </div>
      </div>

      {/* ── Conversion funnel ── */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-foreground">Entonnoir de conversion</p>
          {live.isLive && (
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Mise à jour en direct
            </span>
          )}
        </div>
        <div className="space-y-2.5">
          <FunnelStep label="📤 SMS envoyés"       value={campaign.sent}  total={campaign.sent} color="bg-slate-400"   />
          <FunnelStep label="✅ Livrés"             value={live.delivered} total={campaign.sent} color="bg-blue-400"    />
          <FunnelStep label="👁️ Ouverts"            value={live.opened}    total={campaign.sent} color="bg-violet-500"  />
          <FunnelStep label="🔗 Clics sur le lien"  value={live.clicked}   total={campaign.sent} color="bg-amber-500"   />
          <FunnelStep label="🛒 Conversions"        value={live.converted} total={campaign.sent} color="bg-emerald-500" />
        </div>
      </div>

      {/* ── Campaign history table ── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/20">
          <p className="text-xs font-bold text-foreground uppercase tracking-wide">Historique des campagnes</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {['Date', 'Code', 'Segment', 'Envoyés', 'Ouverture', 'CTR', 'Conversion', 'CA'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-muted-foreground font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Live row */}
              <tr className="border-b border-border bg-primary/5">
                {[
                  "Aujourd'hui",
                  campaign.code,
                  campaign.segmentLabel,
                  campaign.sent.toLocaleString('fr-FR'),
                  openRate,
                  ctr,
                  convRate,
                  `${live.revenue.toLocaleString('fr-FR')}€`,
                ].map((v, i) => (
                  <td key={i} className={cn('px-4 py-2.5 font-semibold text-foreground whitespace-nowrap', i === 0 && 'text-primary')}>
                    {i === 0
                      ? <span className="flex items-center gap-1.5">{v} {live.isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />}</span>
                      : v}
                  </td>
                ))}
              </tr>
              {HISTORY.map(row => (
                <tr key={row.code} className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors">
                  {[row.date, row.code, row.segment, row.sent.toLocaleString('fr-FR'), row.open, row.ctr, row.conv, row.rev].map((v, i) => (
                    <td key={i} className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── AI advice panel — personalised recommendations ── */}
      <SMSAIAdvicePanel
        campaign={campaign}
        liveOpenRate={openRate}
        liveCtr={ctr}
        liveConvRate={convRate}
        liveRevenue={live.revenue}
        progress={live.progress}
      />

    </div>
  );
}
