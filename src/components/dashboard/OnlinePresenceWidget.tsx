import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Globe, Wifi, WifiOff, TrendingUp, RefreshCw,
  Star, MessageSquare, MapPin, Camera, Users, Eye,
  CheckCircle, AlertCircle, Clock, Zap,
} from 'lucide-react';
import { useEstablishment } from '../../context/EstablishmentContext';
import { useConnectedAccounts } from '../../context/ConnectedAccountsContext';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChannelStatus {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  dotColor: string;
  status: 'live' | 'syncing' | 'offline' | 'pending';
  metric: string;
  metricLabel: string;
  delta: number;
  lastSync: string;
}

interface PresenceScore {
  score: number;
  label: string;
  color: string;
  bgColor: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPresenceScore(score: number): PresenceScore {
  if (score >= 80) return { score, label: 'Excellente', color: 'text-emerald-600', bgColor: 'bg-emerald-500' };
  if (score >= 60) return { score, label: 'Bonne', color: 'text-teal-600', bgColor: 'bg-teal-500' };
  if (score >= 40) return { score, label: 'Moyenne', color: 'text-amber-600', bgColor: 'bg-amber-500' };
  return { score, label: 'Faible', color: 'text-red-600', bgColor: 'bg-red-500' };
}

function timeAgo(seconds: number): string {
  if (seconds < 60) return `il y a ${seconds}s`;
  if (seconds < 3600) return `il y a ${Math.floor(seconds / 60)}min`;
  return `il y a ${Math.floor(seconds / 3600)}h`;
}

// ── Pulsing status dot ────────────────────────────────────────────────────────

function StatusDot({ status }: { status: ChannelStatus['status'] }) {
  if (status === 'live') {
    return (
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
      </span>
    );
  }
  if (status === 'syncing') {
    return (
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
      </span>
    );
  }
  if (status === 'offline') {
    return <span className="inline-flex rounded-full h-2.5 w-2.5 bg-slate-300" />;
  }
  return <span className="inline-flex rounded-full h-2.5 w-2.5 bg-blue-400 animate-pulse" />;
}

// ── Circular score ring ───────────────────────────────────────────────────────

function ScoreRing({ score, color }: { score: number; color: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className="rotate-[-90deg]">
      {/* Track */}
      <circle
        cx="48" cy="48" r={radius}
        fill="none" stroke="currentColor"
        strokeWidth="6"
        className="text-border"
        opacity="0.3"
      />
      {/* Progress */}
      <circle
        cx="48" cy="48" r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className={color}
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
      />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function OnlinePresenceWidget() {
  const { activeEstablishment } = useEstablishment();
  const { isConnected } = useConnectedAccounts();

  // Simulated real-time tick
  const [tick, setTick] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(0); // seconds since last refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Score oscillates slightly to feel "live"
  const baseScore = Math.min(100, Math.round(activeEstablishment.kpi.engagement * 8 + 35));
  const score = Math.max(0, Math.min(100, baseScore + Math.sin(tick * 0.3) * 3));
  const presence = getPresenceScore(Math.round(score));

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTick(t => t + 1);
      setLastRefresh(s => s + 5);
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleManualRefresh = useCallback(() => {
    setIsRefreshing(true);
    setLastRefresh(0);
    setTimeout(() => setIsRefreshing(false), 1200);
  }, []);

  // Per-channel statuses
  const channels: ChannelStatus[] = [
    {
      id: 'google',
      label: 'Google Business',
      icon: MapPin,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
      dotColor: 'bg-emerald-500',
      status: 'live',
      metric: `${48 + Math.round(Math.sin(tick * 0.2) * 2)} avis`,
      metricLabel: 'note: 4.7★',
      delta: 3,
      lastSync: timeAgo(Math.max(5, lastRefresh)),
    },
    {
      id: 'instagram',
      label: 'Instagram',
      icon: Camera,
      color: 'text-rose-500',
      bgColor: 'bg-rose-50 dark:bg-rose-950/20',
      dotColor: 'bg-rose-500',
      status: isConnected('instagram') ? 'live' : 'pending',
      metric: `${3450 + Math.round(Math.sin(tick * 0.1) * 8)} abonnés`,
      metricLabel: `eng. ${(5.4 + Math.sin(tick * 0.15) * 0.2).toFixed(1)}%`,
      delta: 5,
      lastSync: timeAgo(Math.max(12, lastRefresh)),
    },
    {
      id: 'facebook',
      label: 'Facebook',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      dotColor: 'bg-blue-500',
      status: isConnected('facebook') ? 'live' : 'offline',
      metric: `${2180 + Math.round(Math.sin(tick * 0.08) * 5)} abonnés`,
      metricLabel: '2 posts cette semaine',
      delta: 2,
      lastSync: timeAgo(Math.max(30, lastRefresh)),
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      icon: Eye,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50 dark:bg-sky-950/20',
      dotColor: 'bg-sky-500',
      status: isConnected('linkedin') ? 'live' : 'offline',
      metric: `${1240 + Math.round(Math.sin(tick * 0.12) * 10)} vues`,
      metricLabel: 'cette semaine',
      delta: 12,
      lastSync: timeAgo(Math.max(18, lastRefresh)),
    },
  ];

  const liveCount = channels.filter(c => c.status === 'live').length;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Globe size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Présence en ligne</h3>
            <p className="text-[11px] text-muted-foreground">
              {liveCount}/{channels.length} canaux actifs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Live indicator */}
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-full px-2.5 py-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            EN DIRECT
          </span>
          <button
            onClick={handleManualRefresh}
            className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted/60 transition-colors"
            title="Actualiser"
          >
            <RefreshCw
              size={13}
              className={`text-muted-foreground transition-transform ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* Score row */}
        <div className="flex items-center gap-5">
          {/* Ring */}
          <div className="relative shrink-0">
            <ScoreRing score={presence.score} color={presence.bgColor.replace('bg-', 'text-')} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-xl font-black tabular-nums leading-none ${presence.color}`}>
                {presence.score}
              </span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide mt-0.5">/ 100</span>
            </div>
          </div>

          {/* Labels */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={`text-base font-black ${presence.color}`}>{presence.label}</span>
              <span className="text-[10px] font-semibold text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5">
                Score de présence
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Votre visibilité locale sur les {channels.length} principales plateformes.{' '}
              {presence.score < 70 && 'Connectez plus de canaux pour améliorer votre score.'}
            </p>
            {/* Progress bar */}
            <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
              <div
                className={`h-full rounded-full ${presence.bgColor} transition-all duration-1000`}
                style={{ width: `${presence.score}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock size={9} />
              Dernière actualisation : {timeAgo(lastRefresh)}
            </p>
          </div>
        </div>

        {/* Channel grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {channels.map((ch) => {
            const Icon = ch.icon;
            return (
              <div
                key={ch.id}
                className={`rounded-xl border border-border ${ch.bgColor} p-3 flex flex-col gap-2 transition-all duration-300`}
              >
                {/* Top */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon size={13} className={ch.color} />
                    <span className="text-[11px] font-bold text-foreground truncate">{ch.label}</span>
                  </div>
                  <StatusDot status={ch.status} />
                </div>

                {/* Metric */}
                <div>
                  <p className={`text-sm font-extrabold tabular-nums leading-none ${ch.color}`}>
                    {ch.status === 'offline' ? '——' : ch.metric}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {ch.status === 'offline' ? 'Non connecté' : ch.metricLabel}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  {ch.status !== 'offline' ? (
                    <>
                      <span className="flex items-center gap-0.5 text-[9px] font-semibold text-emerald-600">
                        <TrendingUp size={8} strokeWidth={3} /> +{ch.delta}%
                      </span>
                      <span className="text-[9px] text-muted-foreground">{ch.lastSync}</span>
                    </>
                  ) : (
                    <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                      <WifiOff size={8} /> À connecter
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick insights */}
        <div className="space-y-1.5">
          <QuickInsight
            icon={<CheckCircle size={11} className="text-emerald-500 shrink-0" />}
            text="Fiche Google Business optimisée — visibilité maximale"
            pulse={tick % 4 === 0}
          />
          <QuickInsight
            icon={<Star size={11} className="text-amber-500 shrink-0" />}
            text={`${3 + (tick % 3 === 0 ? 1 : 0)} avis clients en attente de réponse`}
            pulse={tick % 3 === 0}
          />
          <QuickInsight
            icon={<Zap size={11} className="text-primary shrink-0" />}
            text="Meilleur horaire de publication : aujourd'hui 18h30"
          />
          <QuickInsight
            icon={tick % 5 < 2 ? <AlertCircle size={11} className="text-amber-500 shrink-0" /> : <MessageSquare size={11} className="text-blue-500 shrink-0" />}
            text={tick % 5 < 2 ? 'Taux de réponse aux messages : 94% (objectif 100%)' : 'Engagement post Instagram +22% cette semaine'}
            pulse={tick % 5 === 0}
          />
        </div>
      </div>
    </div>
  );
}

// ── Quick insight row ─────────────────────────────────────────────────────────

function QuickInsight({
  icon,
  text,
  pulse = false,
}: {
  icon: React.ReactNode;
  text: string;
  pulse?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-2 rounded-lg px-2.5 py-1.5 transition-colors duration-500 ${
        pulse ? 'bg-primary/5' : 'bg-transparent'
      }`}
    >
      <div className="mt-0.5">{icon}</div>
      <p className="text-[11px] text-muted-foreground leading-snug">{text}</p>
    </div>
  );
}