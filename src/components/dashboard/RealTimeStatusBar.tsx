import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity, MessageSquare, Star, TrendingUp,
  Globe, Wifi, RefreshCw, Eye,
} from 'lucide-react';
import { blink } from '../../blink/client';
import { useAuth } from '../../hooks/useAuth';
import { useEstablishment } from '../../context/EstablishmentContext';
import { useDemoMode } from '../../context/DemoModeContext';
import { useNavigate } from '@tanstack/react-router';

// ── Animated counter ─────────────────────────────────────────────────────────

function AnimatedNumber({
  target,
  suffix = '',
  className = '',
}: {
  target: number;
  suffix?: string;
  className?: string;
}) {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);

  useEffect(() => {
    if (prevRef.current === target) return;
    const start = prevRef.current;
    const diff = target - start;
    const steps = 20;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setDisplay(Math.round(start + diff * (step / steps)));
      if (step >= steps) {
        setDisplay(target);
        clearInterval(timer);
      }
    }, 30);
    prevRef.current = target;
    return () => clearInterval(timer);
  }, [target]);

  return (
    <span className={`tabular-nums font-black ${className}`}>
      {display}{suffix}
    </span>
  );
}

// ── Pulsing live dot ──────────────────────────────────────────────────────────

function LiveDot({ color = 'bg-emerald-500' }: { color?: string }) {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`} />
    </span>
  );
}

// ── Ticker pill ───────────────────────────────────────────────────────────────

function TickerPill({
  icon,
  label,
  value,
  valueClass,
  onClick,
  urgent,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  valueClass?: string;
  onClick?: () => void;
  urgent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 rounded-xl border px-3 py-2 transition-all duration-200 text-left
        ${urgent
          ? 'border-amber-300/70 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:border-amber-800 dark:hover:bg-amber-950/30'
          : 'border-border bg-card hover:bg-muted/60'
        }
        ${onClick ? 'cursor-pointer active:scale-[0.97]' : 'cursor-default'}
      `}
    >
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${urgent ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-muted/60'}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground leading-none mb-0.5 truncate">{label}</p>
        <div className={`text-xs leading-none ${valueClass ?? 'text-foreground'}`}>{value}</div>
      </div>
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function RealTimeStatusBar() {
  const { user } = useAuth();
  const { activeEstablishment } = useEstablishment();
  const { isDemoActive, demoData } = useDemoMode();
  const navigate = useNavigate();

  // Real-time tick — drives micro-fluctuations
  const [tick, setTick] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 8_000);
    return () => clearInterval(id);
  }, []);

  // ── Real data: unread messages ────────────────────────────────────────────
  const { data: messagesData, refetch: refetchMessages } = useQuery({
    queryKey: ['status-bar-messages', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return blink.db.messages.list({
        where: { userId: user.id, isRead: false, isArchived: 0 },
        limit: 50,
      });
    },
    enabled: !!user?.id && !isDemoActive,
    staleTime: 30_000,
    refetchInterval: 45_000,
  });

  // ── Real data: scheduled posts ────────────────────────────────────────────
  const { data: postsData, refetch: refetchPosts } = useQuery({
    queryKey: ['status-bar-posts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return blink.db.scheduledPosts.list({
        where: { userId: user.id, status: 'scheduled' },
        limit: 100,
      });
    },
    enabled: !!user?.id && !isDemoActive,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  // Derived values
  const unreadCount = isDemoActive
    ? demoData.messages.filter((m: any) => !m.isRead).length
    : (messagesData ?? []).length;

  const scheduledCount = isDemoActive
    ? demoData.posts.filter((p: any) => p.status === 'Planifié').length
    : (postsData ?? []).length;

  // Simulated values based on establishment KPI + tick oscillation
  const kpi = activeEstablishment.kpi;
  const visibilityScore = Math.min(100, Math.round(kpi.engagement * 8 + 35 + Math.sin(tick * 0.3) * 1.5));
  const viewsToday = Math.round((kpi.views / 30) + Math.sin(tick * 0.4) * 8 + tick * 0.5);

  const handleRefresh = () => {
    setIsRefreshing(true);
    refetchMessages();
    refetchPosts();
    setLastRefresh(new Date());
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const relativeTime = (() => {
    const diff = Math.floor((Date.now() - lastRefresh.getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    return `${Math.floor(diff / 60)}min`;
  })();

  return (
    <div className="px-6 py-3 border-b border-border bg-gradient-to-r from-primary/3 via-transparent to-transparent">
      <div className="flex items-center gap-2 flex-wrap">

        {/* Live status badge */}
        <div className="flex items-center gap-1.5 mr-1 shrink-0">
          <LiveDot />
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            En direct
          </span>
        </div>

        {/* Pills row */}
        <div className="flex items-center gap-2 flex-wrap flex-1">

          {/* Visibility score */}
          <TickerPill
            icon={<Globe size={13} className="text-teal-600" />}
            label="Score visibilité"
            value={<AnimatedNumber target={visibilityScore} suffix="%" />}
            valueClass={visibilityScore >= 70 ? 'text-teal-600' : visibilityScore >= 50 ? 'text-amber-600' : 'text-red-600'}
            onClick={() => navigate({ to: '/performance' })}
          />

          {/* Views today */}
          <TickerPill
            icon={<Eye size={13} className="text-primary" />}
            label="Vues aujourd'hui"
            value={<AnimatedNumber target={viewsToday} />}
            onClick={() => navigate({ to: '/performance' })}
          />

          {/* Unread messages */}
          <TickerPill
            icon={<MessageSquare size={13} className={unreadCount > 0 ? 'text-amber-600' : 'text-muted-foreground'} />}
            label="Messages non lus"
            value={
              <span className={unreadCount > 0 ? 'font-black text-amber-700 dark:text-amber-400' : ''}>
                {unreadCount > 0 ? `${unreadCount} nouveau${unreadCount > 1 ? 'x' : ''}` : 'Tout lu'}
              </span>
            }
            urgent={unreadCount > 0}
            onClick={() => navigate({ to: '/inbox' })}
          />

          {/* Scheduled posts */}
          <TickerPill
            icon={<Activity size={13} className="text-primary" />}
            label="Posts planifiés"
            value={<AnimatedNumber target={scheduledCount} />}
            onClick={() => navigate({ to: '/calendar' })}
          />

          {/* Trend badge - oscillates */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-emerald-200/70 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800/60 px-3 py-2 shrink-0">
            <TrendingUp size={12} className="text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
              +{Math.max(1, Math.round(kpi.reachChange + Math.sin(tick * 0.2) * 1.5))}%{' '}
              <span className="font-normal text-emerald-600/70 text-[10px]">activité vs hier</span>
            </span>
          </div>

          {/* Sync status */}
          <div className="hidden md:flex items-center gap-1 rounded-xl border border-border px-3 py-2 bg-muted/30 shrink-0">
            <Wifi size={11} className="text-emerald-500 shrink-0" />
            <span className="text-[10px] text-muted-foreground">Sync. {relativeTime}</span>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          title="Actualiser les données"
          className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted/60 transition-colors shrink-0 ml-auto"
        >
          <RefreshCw
            size={12}
            className={`text-muted-foreground transition-transform ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* Live ticker tape — subtle scrolling activity */}
      <LiveTicker tick={tick} unreadCount={unreadCount} estName={activeEstablishment.shortName} />
    </div>
  );
}

// ── Live ticker tape ──────────────────────────────────────────────────────────

const TICKER_EVENTS = [
  '🌟 Nouvel avis 5 étoiles reçu sur Google',
  '👀 +34 vues sur votre fiche Google Maps',
  '💬 Nouveau message WhatsApp en attente',
  '📈 Votre engagement Instagram +12% cette semaine',
  '✅ Post planifié publié avec succès',
  '🔔 Rappel : mettre à jour vos horaires de fêtes',
  '🤖 Kompilot a optimisé 3 réponses avis automatiquement',
  '📊 Votre score de présence a progressé de 4 points',
];

function LiveTicker({ tick, unreadCount, estName }: { tick: number; unreadCount: number; estName: string }) {
  const [visible, setVisible] = useState(true);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (tick === 0) return;
    setVisible(false);
    const t1 = setTimeout(() => {
      setCurrent(c => (c + 1) % TICKER_EVENTS.length);
      setVisible(true);
    }, 300);
    return () => clearTimeout(t1);
  }, [tick]);

  const msg = unreadCount > 0 && tick % 3 === 0
    ? `💬 ${unreadCount} message${unreadCount > 1 ? 's' : ''} non lu${unreadCount > 1 ? 's' : ''} pour ${estName} — répondez maintenant`
    : TICKER_EVENTS[current];

  return (
    <div
      className={`mt-1.5 flex items-center gap-1.5 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
      }`}
    >
      <span className="w-1 h-1 rounded-full bg-primary/60 shrink-0" />
      <p className="text-[11px] text-muted-foreground truncate">{msg}</p>
    </div>
  );
}
