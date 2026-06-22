import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, Phone, MessageSquare, TrendingUp, TrendingDown, Minus, Wifi, WifiOff, Euro, ChevronDown, ChevronUp } from 'lucide-react';
import { useConnectedAccounts, NETWORK_KPI_DATA } from '../../context/ConnectedAccountsContext';
import { useEstablishment } from '../../context/EstablishmentContext';
import { usePremiumWin } from '../shared/PremiumWinEngine';
import { blink } from '../../blink/client';
import { useAuth } from '../../hooks/useAuth';

interface KPIData {
  label: string;
  value: string;
  subValue: string;
  delta: number;
  deltaLabel: string;
  trend: 'up' | 'down' | 'flat';
  sparkline: number[];
  empty?: boolean; // true when no accounts connected
}

// ── Blank KPI shown when no networks are connected ────────────────────────────
const EMPTY_KPI: Omit<KPIData, 'label' | 'empty'> = {
  value: '––',
  subValue: 'Connectez un réseau',
  delta: 0,
  deltaLabel: 'aucune donnée',
  trend: 'flat',
  sparkline: [1, 1, 1, 1, 1, 1, 1],
};

const CARD_THEMES = [
  {
    bg: 'bg-gradient-to-br from-violet-600 to-violet-400',
    bgEmpty: 'bg-gradient-to-br from-slate-400 to-slate-300',
    glow: 'shadow-[0_8px_32px_-8px_rgba(139,92,246,0.5)]',
    glowEmpty: 'shadow-[0_4px_16px_-8px_rgba(0,0,0,0.15)]',
    sparkColor: '#ddd6fe',
    sparkColorEmpty: '#e2e8f0',
    iconBg: 'bg-white/20',
    icon: Eye,
    networkId: 'linkedin' as const,
    networkLabel: 'LinkedIn',
  },
  {
    bg: 'bg-gradient-to-br from-rose-500 to-orange-400',
    bgEmpty: 'bg-gradient-to-br from-slate-400 to-slate-300',
    glow: 'shadow-[0_8px_32px_-8px_rgba(244,63,94,0.5)]',
    glowEmpty: 'shadow-[0_4px_16px_-8px_rgba(0,0,0,0.15)]',
    sparkColor: '#fed7aa',
    sparkColorEmpty: '#e2e8f0',
    iconBg: 'bg-white/20',
    icon: Phone,
    networkId: 'instagram' as const,
    networkLabel: 'Instagram',
  },
  {
    bg: 'bg-gradient-to-br from-emerald-600 to-teal-400',
    bgEmpty: 'bg-gradient-to-br from-slate-400 to-slate-300',
    glow: 'shadow-[0_8px_32px_-8px_rgba(16,185,129,0.5)]',
    glowEmpty: 'shadow-[0_4px_16px_-8px_rgba(0,0,0,0.15)]',
    sparkColor: '#a7f3d0',
    sparkColorEmpty: '#e2e8f0',
    iconBg: 'bg-white/20',
    icon: MessageSquare,
    networkId: 'google' as const,
    networkLabel: 'Google Business',
  },
];

// ── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 80, H = 28;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x},${y}`;
  });
  const area = `M${pts.join(' L')} L${W},${H} L0,${H} Z`;
  const uid = color.replace(/[^a-z0-9]/gi, '');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${uid})`} />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Trend badge ───────────────────────────────────────────────────────────────

function TrendBadge({ trend, delta, empty }: { trend: KPIData['trend']; delta: number; empty?: boolean }) {
  if (empty) {
    return (
      <span className="flex items-center gap-1 text-[11px] font-bold text-white/70 bg-white/15 rounded-full px-2 py-0.5">
        <WifiOff size={9} /> n/a
      </span>
    );
  }
  const abs = Math.abs(delta).toFixed(1);
  if (trend === 'up')   return <span className="flex items-center gap-1 text-[11px] font-bold text-white/90 bg-white/20 rounded-full px-2 py-0.5"><TrendingUp size={10} strokeWidth={3} /> +{abs}%</span>;
  if (trend === 'down') return <span className="flex items-center gap-1 text-[11px] font-bold text-white/90 bg-white/20 rounded-full px-2 py-0.5"><TrendingDown size={10} strokeWidth={3} /> −{abs}%</span>;
  return <span className="flex items-center gap-1 text-[11px] font-bold text-white/90 bg-white/20 rounded-full px-2 py-0.5"><Minus size={10} strokeWidth={3} /> {abs}%</span>;
}

// ── Animated counter (reveals value on first connect) ─────────────────────────

function AnimatedValue({ value, empty }: { value: string; empty: boolean }) {
  const [display, setDisplay] = useState(empty ? '––' : value);
  const prevEmpty = useRef(empty);

  useEffect(() => {
    if (prevEmpty.current === true && empty === false) {
      // Just connected — flash animation
      let count = 0;
      const chars = '0123456789,. ';
      const interval = setInterval(() => {
        if (count < 8) {
          setDisplay(value.split('').map((c, i) =>
            i < count ? c : chars[Math.floor(Math.random() * chars.length)]
          ).join(''));
          count++;
        } else {
          setDisplay(value);
          clearInterval(interval);
        }
      }, 60);
      return () => clearInterval(interval);
    }
    setDisplay(empty ? '––' : value);
    prevEmpty.current = empty;
  }, [value, empty]);

  return <span>{display}</span>;
}

// ── Revenue KPI Card (Money-First) ────────────────────────────────────────────

function RevenueCard({ estName, period }: { estName: string; period: 'semaine' | 'mois' }) {
  // Simulated revenue breakdown
  const multiplier = period === 'semaine' ? 0.25 : 1;
  const noshow = Math.round(380 * multiplier);
  const coupons = Math.round(210 * multiplier);
  const relances = Math.round(590 * multiplier);
  const total = noshow + coupons + relances;
  const { triggerWin } = usePremiumWin();

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-500 shadow-[0_8px_32px_-8px_rgba(16,185,129,0.55)] p-5 text-white flex flex-col gap-3 col-span-1 sm:col-span-full">
      {/* Decorative glow */}
      <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
      <div className="absolute -bottom-8 right-8 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Euro size={22} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-white/70 uppercase tracking-widest">Priorité n°1</p>
            <p className="text-sm font-extrabold text-white leading-tight">💰 Chiffre d'Affaires Sécurisé / Généré</p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-[11px] font-bold text-white/90 bg-white/20 rounded-full px-2 py-0.5">
          <TrendingUp size={10} strokeWidth={3} /> +{period === 'semaine' ? '8.4' : '12.7'}%
        </span>
      </div>

      {/* Main value */}
      <div className="relative z-10">
        <p className="text-4xl font-black tracking-tight leading-none nc-kpi-value">
          {total.toLocaleString('fr-FR')} €
        </p>
        <p className="text-xs mt-1 text-white/70">{estName} · {period === 'semaine' ? 'cette semaine' : 'ce mois'}</p>
      </div>

      {/* Breakdown pills — clicking no-show / coupons pills triggers Golden Win */}
      <div className="relative z-10 flex flex-wrap gap-2">
        <button
          onClick={() => triggerWin({ type: 'noshowBlocked', amount: noshow })}
          className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 text-[11px] font-semibold hover:bg-white/25 transition-colors cursor-pointer active:scale-95"
          title="Cliquez pour voir la notification de gain"
        >
          🛡️ No-Show bloqués : <strong>+{noshow} €</strong>
        </button>
        <button
          onClick={() => triggerWin({ type: 'coupon', amount: coupons })}
          className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 text-[11px] font-semibold hover:bg-white/25 transition-colors cursor-pointer active:scale-95"
          title="Cliquez pour voir la notification de gain"
        >
          🎟️ Coupons validés : <strong>+{coupons} €</strong>
        </button>
        <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 text-[11px] font-semibold">
          🤖 Relances IA : <strong>+{relances} €</strong>
        </span>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function KPICards() {
  const { isConnected, hasAny } = useConnectedAccounts();
  const { activeEstablishment, isSwitching } = useEstablishment();
  const [period, setPeriod] = useState<'mois' | 'semaine'>('mois');
  const [showSecondary, setShowSecondary] = useState(false);
  const { user } = useAuth();

  // ── Real published posts count for the current calendar month ────────────────
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: publishedPostsData } = useQuery({
    queryKey: ['published-posts-count', user?.id, monthStart],
    queryFn: async () => {
      if (!user?.id) return [];
      return blink.db.scheduledPosts.list({
        where: { userId: user.id, status: 'published' },
        limit: 100,
      });
    },
    enabled: !!user?.id,
    staleTime: 60_000, // 1 minute
  });

  // Filter to posts published this month and derive the real count
  const realPostsCount = (publishedPostsData ?? []).filter((p) => {
    const updatedAt = (p as { updated_at?: string; updatedAt?: string }).updatedAt
      ?? (p as { updated_at?: string; updatedAt?: string }).updated_at;
    if (!updatedAt) return true; // include if no date available
    return updatedAt >= monthStart;
  }).length;

  // Axe 4 FIX — optional chaining : activeEstablishment peut être null
  // au premier rendu ou pendant un switch d'établissement.
  const estKpi = activeEstablishment?.kpi;

  // Axe 4 FIX — guard complet : si estKpi est undefined (établissement non chargé),
  // on utilise des valeurs neutres pour éviter tout crash sur .reach, .views, etc.
  const safeKpi = estKpi ?? { reach: 0, reachChange: 0, views: 0, viewsChange: 0, engagement: 0, engagementChange: 0, posts: 0 };
  const safeName = activeEstablishment?.shortName ?? '—';

  const cards: (KPIData & { theme: typeof CARD_THEMES[0] })[] = CARD_THEMES.map((theme, idx) => {
    const connected = isConnected(theme.networkId);
    const networkKpi = connected ? NETWORK_KPI_DATA[theme.networkId] : null;

    // Override with establishment KPI data (simulated per establishment)
    const estValues = [
      { value: safeKpi.reach.toLocaleString('fr-FR'), subValue: `Portée — ${safeName}`, delta: safeKpi.reachChange, deltaLabel: `+${safeKpi.reachChange}% vs mois dernier`, trend: safeKpi.reachChange >= 0 ? 'up' as const : 'down' as const, sparkline: [40, 52, 48, 61, 55, 70, safeKpi.reach / 100].map(v => Math.round(v)) },
      { value: safeKpi.views.toLocaleString('fr-FR'), subValue: `Vues — ${safeName}`, delta: safeKpi.viewsChange, deltaLabel: `+${safeKpi.viewsChange}% vs mois dernier`, trend: safeKpi.viewsChange >= 0 ? 'up' as const : 'down' as const, sparkline: [30, 42, 38, 55, 60, 72, safeKpi.views / 300].map(v => Math.round(v)) },
      { value: `${safeKpi.engagement}%`, subValue: `Engagement — ${safeName}`, delta: safeKpi.engagementChange, deltaLabel: `${safeKpi.engagementChange > 0 ? '+' : ''}${safeKpi.engagementChange}% vs mois dernier`, trend: safeKpi.engagementChange >= 0 ? 'up' as const : 'down' as const, sparkline: [20, 35, 28, 42, 38, 50, Math.round(safeKpi.engagement * 8)] },
    ];

    const estValue = estValues[idx];

    return {
      theme,
      label: theme.networkLabel,
      value: estValue.value,
      subValue: estValue.subValue,
      delta: estValue.delta,
      deltaLabel: estValue.deltaLabel,
      trend: estValue.trend,
      sparkline: estValue.sparkline,
      empty: false,
    };
  });

  return (
    <div className={`space-y-3 relative transition-opacity duration-300 ${isSwitching ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
      {/* Establishment indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${activeEstablishment?.color ?? 'from-primary to-teal-400'}`} />
        <span>Données pour : <strong className="text-foreground">{activeEstablishment?.name ?? '—'}</strong></span>
        {(realPostsCount > 0 || safeKpi.posts > 0) && (
          <span className="ml-auto text-[10px] text-muted-foreground">
            {realPostsCount > 0 ? realPostsCount : safeKpi.posts} publications ce mois
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Performances financières</h3>
          {!hasAny && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5">
              <WifiOff size={10} /> Aucun canal connecté
            </span>
          )}
          {hasAny && (
            <span className="flex items-center gap-1 text-[11px] text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
              <Wifi size={10} /> Données synchronisées
            </span>
          )}
        </div>
        <div className="flex items-center rounded-lg border border-border overflow-hidden text-xs">
          {(['semaine', 'mois'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 font-medium transition-colors capitalize ${
                period === p ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              {p === 'semaine' ? 'Cette semaine' : 'Ce mois'}
            </button>
          ))}
        </div>
      </div>

      {/* ── PRIORITY 1: Revenue Card (full-width) ── */}
      <div className="grid grid-cols-1">
        <RevenueCard estName={activeEstablishment?.shortName ?? '—'} period={period} />
      </div>

      {/* ── Visibility metrics toggle ── */}
      <button
        onClick={() => setShowSecondary(s => !s)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-border bg-muted/40 hover:bg-muted/70 transition-colors text-sm text-muted-foreground"
      >
        <span className="font-semibold">📊 Métriques Secondaires (Visibilité)</span>
        {showSecondary ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>

      {/* ── Secondary metrics grid (collapsible) ── */}
      {showSecondary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {cards.map(({ theme, ...kpi }) => {
            const Icon = theme.icon;
            const isEmpty = kpi.empty;
            const bg = isEmpty ? theme.bgEmpty : theme.bg;
            const glow = isEmpty ? theme.glowEmpty : theme.glow;
            const sparkColor = isEmpty ? theme.sparkColorEmpty : theme.sparkColor;

            return (
              <div
                key={theme.networkId}
                className={`relative rounded-2xl overflow-hidden ${bg} ${glow} p-5 text-white flex flex-col gap-3 transition-all duration-700`}
              >
                <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
                <div className="absolute -bottom-6 -right-2 w-16 h-16 rounded-full bg-white/10 pointer-events-none" />

                <div className="flex items-start justify-between relative z-10">
                  <div className={`w-10 h-10 rounded-xl ${theme.iconBg} backdrop-blur-sm flex items-center justify-center`}>
                    {isEmpty ? <WifiOff size={18} className="text-white/70" /> : <Icon size={20} className="text-white" />}
                  </div>
                  <TrendBadge trend={kpi.trend} delta={kpi.delta} empty={isEmpty} />
                </div>

                <div className="relative z-10">
                  <p className={`text-3xl font-extrabold tracking-tight leading-none nc-kpi-value ${isEmpty ? 'opacity-50 font-light' : ''}`}>
                    <AnimatedValue value={kpi.value} empty={isEmpty!} />
                  </p>
                  <p className={`text-xs mt-1 ${isEmpty ? 'text-white/50' : 'text-white/70'}`}>{kpi.subValue}</p>
                </div>

                <div className="relative z-10 flex items-end justify-between">
                  <div>
                    <p className={`text-sm font-semibold ${isEmpty ? 'text-white/60' : ''}`}>{theme.networkLabel}</p>
                    <p className={`text-[11px] ${isEmpty ? 'text-white/40' : 'text-white/60'}`}>
                      {isEmpty ? 'Non connecté' : kpi.deltaLabel}
                    </p>
                  </div>
                  <div className={`transition-opacity duration-500 ${isEmpty ? 'opacity-30' : 'opacity-100'}`}>
                    <Sparkline data={kpi.sparkline} color={sparkColor} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
