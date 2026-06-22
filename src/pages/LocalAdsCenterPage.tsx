/**
 * LocalAdsCenterPage — Unified local ad campaign center.
 * Channels: Google Ads Local · Meta Ads (FB/IG) · Google Maps Ads
 */
import { useState, useMemo } from 'react';
import { useEstablishment } from '../context/EstablishmentContext';
import { toast } from '@blinkdotnew/ui';
import {
  Megaphone, MapPin, Target, Sparkles, TrendingUp, Eye,
  Euro, Zap, Plus, RefreshCw, CheckCircle2,
  BarChart2, ArrowUpRight, ShieldCheck,
} from 'lucide-react';
import { LocalAdsModal } from '../components/ads/LocalAdsModal';
import { MetaBudgetAlertWidget } from '../components/ads/MetaBudgetAlertWidget';
import { IntegrationsSectionAds } from '../components/ads/IntegrationsSectionAds';
import { CampaignCoworkStudio } from '../components/cowork/CampaignCoworkStudio';

// ── Wrapper section Cowork ────────────────────────────────────────────────────

function CampaignCoworkStudioSection() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-dashed border-primary/30 bg-gradient-to-br from-violet-50/50 to-amber-50/30 dark:from-violet-950/20 dark:to-amber-950/10 overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-amber-500 flex items-center justify-center shadow-md shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold">Claude Cowork Studio</p>
            <p className="text-xs text-muted-foreground">GPT-4o génère · Claude 3.5 Sonnet affine · Résultats professionnels</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
            NOUVEAU
          </span>
          <Zap className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''} text-muted-foreground`} />
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5">
          <CampaignCoworkStudio />
        </div>
      )}
    </div>
  );
}
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts';

// ── Types ────────────────────────────────────────────────────────────────────

type Channel = 'google' | 'meta' | 'gmaps';

interface Campaign {
  id: string;
  name: string;
  channel: Channel;
  budget: number;
  reach: number;
  clicks: number;
  conversions: number;
  revenue: number;
  status: 'active' | 'paused' | 'ended';
  startDate: string;
}

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: 'c1', name: '☀️ Offre Été — Colorations',    channel: 'meta',   budget: 80,  reach: 4200, clicks: 312,  conversions: 18, revenue: 720,  status: 'active',  startDate: '01/06' },
  { id: 'c2', name: '📍 Google Maps — Visibilité Max', channel: 'gmaps', budget: 40,  reach: 1850, clicks: 94,   conversions: 9,  revenue: 360,  status: 'active',  startDate: '28/05' },
  { id: 'c3', name: '🔍 Google Ads Local — Soins',    channel: 'google', budget: 60,  reach: 2980, clicks: 187,  conversions: 14, revenue: 560,  status: 'paused',  startDate: '20/05' },
  { id: 'c4', name: '🎂 Promo Fidélité — Clients VIP', channel: 'meta',  budget: 30,  reach: 1150, clicks: 89,   conversions: 6,  revenue: 240,  status: 'ended',   startDate: '01/05' },
];

const SPARKLINE_DATA = [
  { day: 'J1', google: 120, meta: 180, gmaps: 60 },
  { day: 'J2', google: 240, meta: 320, gmaps: 110 },
  { day: 'J3', google: 380, meta: 520, gmaps: 160 },
  { day: 'J4', google: 510, meta: 740, gmaps: 220 },
  { day: 'J5', google: 670, meta: 980, gmaps: 310 },
  { day: 'J6', google: 820, meta: 1200, gmaps: 420 },
  { day: 'J7', google: 980, meta: 1480, gmaps: 520 },
];

// ── Channel config ────────────────────────────────────────────────────────────

const CHANNEL_CONFIG: Record<Channel, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  google: {
    label: 'Google Ads',
    color: '#4285F4',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800/50',
    icon: <span className="text-[11px] font-extrabold text-white">G</span>,
  },
  meta: {
    label: 'Meta Ads',
    color: '#1877F2',
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    border: 'border-indigo-200 dark:border-indigo-800/50',
    icon: <span className="text-[11px] font-extrabold text-white">M</span>,
  },
  gmaps: {
    label: 'Google Maps',
    color: '#EA4335',
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800/50',
    icon: <MapPin size={11} className="text-white" />,
  },
};

const STATUS_STYLE: Record<Campaign['status'], { cls: string; label: string }> = {
  active: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: '● Active' },
  paused: { cls: 'bg-amber-50 text-amber-700 border-amber-200',       label: '⏸ En pause' },
  ended:  { cls: 'bg-muted text-muted-foreground border-border',      label: '■ Terminée' },
};

// ── Quick campaign creator ────────────────────────────────────────────────────

const BUDGETS = [20, 50, 100, 200];
const OBJECTIVES = [
  { id: 'visibility', label: '👁️ Notoriété', desc: 'Faire connaître mon établissement' },
  { id: 'clicks',     label: '🖱️ Clics site', desc: 'Amener des visites sur mon site' },
  { id: 'calls',      label: '📞 Appels',      desc: 'Recevoir des appels téléphoniques' },
  { id: 'bookings',   label: '📅 Réservations', desc: 'Générer des prises de RDV' },
];

function QuickCreatorPanel({ onLaunched }: { onLaunched: () => void }) {
  const [channel, setChannel] = useState<Channel>('meta');
  const [budget, setBudget]   = useState(50);
  const [objective, setObj]   = useState('bookings');
  const [radius, setRadius]   = useState(5);
  const [launching, setLaunching] = useState(false);
  const { activeEstablishment } = useEstablishment();

  const estimatedReach = useMemo(() => {
    const base = channel === 'gmaps' ? 300 : channel === 'google' ? 500 : 800;
    return Math.round(base * (budget / 50) * (1 + radius / 25));
  }, [channel, budget, radius]);

  const handleLaunch = async () => {
    setLaunching(true);
    await new Promise(r => setTimeout(r, 1500));
    setLaunching(false);
    toast.success('🚀 Campagne lancée avec succès !', {
      description: `${CHANNEL_CONFIG[channel].label} · ${budget}€ · ~${estimatedReach.toLocaleString('fr-FR')} personnes atteintes`,
    });
    onLaunched();
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border bg-gradient-to-r from-violet-50/60 to-teal-50/60 dark:from-violet-950/20 dark:to-teal-950/10">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center shrink-0">
          <Plus size={15} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-extrabold text-foreground">Créer une campagne en 3 clics</p>
          <p className="text-[11px] text-muted-foreground">L'IA configure automatiquement le ciblage optimal pour {activeEstablishment?.city || 'votre ville'}</p>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Channel selector */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-foreground/70 uppercase tracking-wider">1. Canal publicitaire</p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(CHANNEL_CONFIG) as [Channel, typeof CHANNEL_CONFIG[Channel]][]).map(([id, cfg]) => (
              <button
                key={id}
                onClick={() => setChannel(id)}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${
                  channel === id
                    ? 'ring-2 ring-offset-1 ring-primary/30'
                    : 'border-border hover:border-primary/30'
                }`}
                style={{ borderColor: channel === id ? cfg.color : undefined, backgroundColor: channel === id ? `${cfg.color}11` : undefined }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cfg.color }}>
                  {cfg.icon}
                </div>
                <span className="text-[11px] font-bold text-foreground">{cfg.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Objective */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-foreground/70 uppercase tracking-wider">2. Objectif</p>
          <div className="grid grid-cols-2 gap-2">
            {OBJECTIVES.map(obj => (
              <button
                key={obj.id}
                onClick={() => setObj(obj.id)}
                className={`flex items-start gap-2 rounded-xl border p-3 text-left transition-all ${
                  objective === obj.id
                    ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border hover:border-primary/30 hover:bg-muted/40'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground">{obj.label}</p>
                  <p className="text-[10px] text-muted-foreground">{obj.desc}</p>
                </div>
                {objective === obj.id && <CheckCircle2 size={13} className="text-primary shrink-0 mt-0.5" />}
              </button>
            ))}
          </div>
        </div>

        {/* Budget + radius */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-bold text-foreground/70 uppercase tracking-wider">3. Budget / 7 jours</p>
            <div className="grid grid-cols-2 gap-1.5">
              {BUDGETS.map(b => (
                <button
                  key={b}
                  onClick={() => setBudget(b)}
                  className={`rounded-lg border py-2 text-center text-sm font-bold transition-all ${
                    budget === b
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : 'border-border text-foreground hover:border-emerald-300 hover:bg-emerald-50/40'
                  }`}
                >
                  {b}€
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold text-foreground/70 uppercase tracking-wider">Rayon ciblé</p>
            <div className="bg-muted/30 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <MapPin size={13} className="text-violet-500" />
                <span className="text-lg font-extrabold text-violet-600 tabular-nums">{radius} km</span>
              </div>
              <input
                type="range" min={1} max={25} step={1} value={radius}
                onChange={e => setRadius(+e.target.value)}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-violet-600"
              />
            </div>
          </div>
        </div>

        {/* Summary + CTA */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center gap-3">
          <ShieldCheck size={15} className="text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">
              <strong>{CHANNEL_CONFIG[channel].label}</strong> · <strong>{budget}€</strong> sur 7 jours · <strong>{radius} km</strong>
            </p>
            <p className="text-[11px] text-muted-foreground">Portée estimée : ~<strong>{estimatedReach.toLocaleString('fr-FR')} personnes</strong></p>
          </div>
        </div>

        <button
          onClick={handleLaunch}
          disabled={launching}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-extrabold text-white shadow-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-70 bg-gradient-to-r from-violet-600 to-teal-500 hover:from-violet-700 hover:to-teal-600"
        >
          {launching ? (
            <><RefreshCw size={15} className="animate-spin" /> Lancement en cours…</>
          ) : (
            <><Zap size={15} /> 🚀 Lancer la campagne</>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Campaign row ─────────────────────────────────────────────────────────────

function CampaignRow({ campaign }: { campaign: Campaign }) {
  const cfg = CHANNEL_CONFIG[campaign.channel];
  const st  = STATUS_STYLE[campaign.status];
  const roi = (campaign.revenue / campaign.budget).toFixed(1);

  return (
    <tr className="border-b border-border/50 hover:bg-muted/20 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: cfg.color }}>
            {cfg.icon}
          </div>
          <div>
            <p className="text-xs font-bold text-foreground leading-tight">{campaign.name}</p>
            <p className="text-[10px] text-muted-foreground">{cfg.label} · depuis le {campaign.startDate}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-sm font-bold text-foreground tabular-nums">{campaign.budget}€</span>
      </td>
      <td className="px-4 py-3 text-right hidden sm:table-cell">
        <span className="text-sm font-semibold tabular-nums" style={{ color: cfg.color }}>{campaign.reach.toLocaleString('fr-FR')}</span>
      </td>
      <td className="px-4 py-3 text-right hidden md:table-cell">
        <span className="text-sm font-semibold text-emerald-600 tabular-nums">{campaign.conversions}</span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-sm font-extrabold text-emerald-600 tabular-nums">{campaign.revenue}€</span>
      </td>
      <td className="px-4 py-3 text-right hidden sm:table-cell">
        <span className="text-xs font-extrabold text-amber-600 tabular-nums">×{roi}</span>
      </td>
      <td className="px-4 py-3 text-right hidden sm:table-cell">
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold ${st.cls}`}>
          {st.label}
        </span>
      </td>
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LocalAdsCenterPage() {
  const [metaModalOpen, setMetaModalOpen] = useState(false);
  const [campaigns, setCampaigns]         = useState(MOCK_CAMPAIGNS);
  const [launched, setLaunched]           = useState(false);

  const totalBudget  = campaigns.reduce((s, c) => s + c.budget, 0);
  const totalReach   = campaigns.reduce((s, c) => s + c.reach, 0);
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
  const avgRoi       = (totalRevenue / totalBudget).toFixed(1);
  const activeCamps  = campaigns.filter(c => c.status === 'active').length;

  const handleLaunched = () => {
    setLaunched(true);
    const newCamp: Campaign = {
      id: `c${Date.now()}`, name: '🚀 Nouvelle Campagne IA',
      channel: 'meta', budget: 50, reach: 0, clicks: 0,
      conversions: 0, revenue: 0, status: 'active', startDate: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    };
    setCampaigns(prev => [newCamp, ...prev]);
  };

  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center shrink-0">
          <Megaphone size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-extrabold text-foreground leading-tight">Centre de Publicité Locale 📣</h1>
          <p className="text-sm text-muted-foreground">Gérez vos campagnes Google Ads, Meta Ads et Google Maps Ads depuis un seul endroit.</p>
        </div>
      </div>

      {/* Meta Budget Alert Widget */}
      <MetaBudgetAlertWidget />

      {/* KPI summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <Megaphone size={14} />, label: 'Campagnes actives',  value: activeCamps.toString(),              color: 'text-violet-600' },
          { icon: <Eye size={14} />,       label: 'Portée totale',       value: totalReach.toLocaleString('fr-FR'),  color: 'text-blue-600' },
          { icon: <Euro size={14} />,      label: 'CA généré',           value: `${totalRevenue}€`,                  color: 'text-emerald-600' },
          { icon: <TrendingUp size={14} />, label: 'ROI moyen',           value: `×${avgRoi}`,                        color: 'text-amber-600' },
        ].map(k => (
          <div key={k.label} className="bg-card border border-border rounded-xl px-4 py-3 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">{k.icon}<span className="text-[10px] font-bold uppercase tracking-wide">{k.label}</span></div>
            <p className={`text-2xl font-extrabold tabular-nums ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick creator */}
        <QuickCreatorPanel onLaunched={handleLaunched} />

        {/* Channel performance chart */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <BarChart2 size={15} className="text-primary" />
            <p className="text-sm font-bold text-foreground">Portée par canal (7 jours)</p>
          </div>
          <div className="px-4 py-4">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={SPARKLINE_DATA} margin={{ left: -10, right: 8, top: 4, bottom: 4 }}>
                <defs>
                  {[
                    { id: 'google', color: '#4285F4' },
                    { id: 'meta',   color: '#1877F2' },
                    { id: 'gmaps',  color: '#EA4335' },
                  ].map(g => (
                    <linearGradient key={g.id} id={`grad-${g.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={g.color} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={g.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={36} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 11 }}
                  labelStyle={{ fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="google" name="Google Ads" stroke="#4285F4" strokeWidth={2} fill="url(#grad-google)" dot={false} />
                <Area type="monotone" dataKey="meta"   name="Meta Ads"   stroke="#1877F2" strokeWidth={2} fill="url(#grad-meta)"   dot={false} />
                <Area type="monotone" dataKey="gmaps"  name="Google Maps" stroke="#EA4335" strokeWidth={2} fill="url(#grad-gmaps)"  dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Channel breakdown */}
          <div className="px-5 pb-4 space-y-2">
            {(Object.entries(CHANNEL_CONFIG) as [Channel, typeof CHANNEL_CONFIG[Channel]][]).map(([id, cfg]) => {
              const chCamps = campaigns.filter(c => c.channel === id);
              const chRev   = chCamps.reduce((s, c) => s + c.revenue, 0);
              const chBudget = chCamps.reduce((s, c) => s + c.budget, 0);
              return (
                <div key={id} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: cfg.color }}>
                    {cfg.icon}
                  </div>
                  <span className="text-xs font-semibold text-foreground flex-1">{cfg.label}</span>
                  <span className="text-xs text-emerald-600 font-bold tabular-nums">{chRev}€ CA</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">{chBudget}€ budget</span>
                  {chBudget > 0 && (
                    <span className="text-[10px] font-extrabold text-amber-600 tabular-nums">
                      ×{(chRev / chBudget).toFixed(1)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Campaigns table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Target size={15} className="text-primary" />
            <p className="text-sm font-bold text-foreground">Toutes les campagnes</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMetaModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold bg-gradient-to-r from-[#1877F2] to-[#E1306C] text-white rounded-xl px-3 py-2 hover:opacity-90 transition-opacity"
            >
              <Plus size={12} /> Meta Ads
            </button>
            <button
              onClick={() => toast.success('Google Ads — Ouvre le gestionnaire Google')}
              className="flex items-center gap-1.5 text-xs font-bold bg-[#4285F4] text-white rounded-xl px-3 py-2 hover:opacity-90 transition-opacity"
            >
              <Plus size={12} /> Google Ads
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Campagne</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Budget</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Portée</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wide hidden md:table-cell">RDV</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wide">CA</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">ROI</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Statut</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => <CampaignRow key={c.id} campaign={c} />)}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-muted/30">
                <td className="px-4 py-3 text-xs font-bold text-muted-foreground">Total</td>
                <td className="px-4 py-3 text-right text-xs font-extrabold text-foreground tabular-nums">{totalBudget}€</td>
                <td className="px-4 py-3 hidden sm:table-cell" />
                <td className="px-4 py-3 hidden md:table-cell" />
                <td className="px-4 py-3 text-right text-xs font-extrabold text-emerald-600 tabular-nums">{totalRevenue}€</td>
                <td className="px-4 py-3 text-right text-xs font-extrabold text-amber-600 tabular-nums hidden sm:table-cell">×{avgRoi}</td>
                <td className="px-4 py-3 hidden sm:table-cell" />
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border bg-muted/10 flex items-center gap-2">
          <ArrowUpRight size={13} className="text-primary shrink-0" />
          <p className="text-[11px] text-muted-foreground">
            ROI moyen tous canaux : <strong className="text-foreground">×{avgRoi}</strong> — chaque euro investi génère {avgRoi}€ de chiffre d'affaires.
          </p>
        </div>
      </div>

      {/* ── Claude Cowork Studio ────────────────────────────────────────────── */}
      <CampaignCoworkStudioSection />

      {/* ── Intégrations API ────────────────────────────────────────────────── */}
      <IntegrationsSectionAds />

      {/* AI tips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: '⏰', title: 'Meilleures heures', desc: 'Vos audiences locales sont actives entre 12h et 14h et 18h à 21h. Planifiez vos campagnes sur ces créneaux pour maximiser le CTR.' },
          { icon: '🎯', title: 'Ciblage optimal', desc: 'Les campagnes à 5 km génèrent 3× plus de conversions que les campagnes larges pour les commerces locaux.' },
          { icon: '📸', title: 'Visuels vidéo', desc: 'Les publicités en format Réel (9:16) ont un coût par clic 40% inférieur aux images statiques sur Instagram.' },
        ].map(tip => (
          <div key={tip.title} className="bg-card border border-border rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{tip.icon}</span>
              <div className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
                <Sparkles size={10} className="text-violet-600" />
              </div>
              <span className="text-[10px] font-extrabold text-violet-600 uppercase tracking-wide">Conseil IA</span>
            </div>
            <p className="text-sm font-bold text-foreground">{tip.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{tip.desc}</p>
          </div>
        ))}
      </div>

      <LocalAdsModal open={metaModalOpen} onClose={() => setMetaModalOpen(false)} />
    </div>
  );
}
