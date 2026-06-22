import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Globe, Star, MessageSquare, Euro, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { useEstablishment } from '../../context/EstablishmentContext';
import { useAPIConnections } from '../settings/APIConnectionStatus';
import { Link } from '@tanstack/react-router';

interface CockpitMetric {
  id: string;
  label: string;
  value: string;
  delta: number;
  deltaLabel: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

// ── Animated value that flashes on update ────────────────────────────────────

function FlashValue({ value, className = '' }: { value: string; className?: string }) {
  const [flash, setFlash] = useState(false);
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current !== value) {
      setFlash(true);
      prevRef.current = value;
      const t = setTimeout(() => setFlash(false), 700);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <span className={`tabular-nums transition-colors duration-300 ${flash ? 'text-primary' : ''} ${className}`}>
      {value}
    </span>
  );
}

function DeltaBadge({ delta, label }: { delta: number; label: string }) {
  const positive = delta >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
        positive
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'bg-red-50 text-red-700 border border-red-200'
      }`}
    >
      {positive ? (
        <TrendingUp size={10} strokeWidth={3} />
      ) : (
        <TrendingDown size={10} strokeWidth={3} />
      )}
      {positive ? '+' : ''}
      {delta}% {label}
    </span>
  );
}

export function MetricsCockpit() {
  const { activeEstablishment } = useEstablishment();
  const { hasGBP, hasStripe } = useAPIConnections();
  const kpi = activeEstablishment.kpi;
  const hasMissingConnections = !hasGBP || !hasStripe;

  // Live oscillation tick
  const [tick, setTick] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const tickInterval = setInterval(() => setTick(t => t + 1), 15_000);
    const refreshInterval = setInterval(() => setLastUpdated(new Date()), 30_000);
    return () => {
      clearInterval(tickInterval);
      clearInterval(refreshInterval);
    };
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTick(t => t + 1);
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }, 800);
  };

  const relativeTime = (() => {
    const diff = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
    if (diff < 60) return `il y a ${diff}s`;
    return `il y a ${Math.floor(diff / 60)}min`;
  })();

  // Live oscillating values
  const geoScore = Math.min(100, Math.round(kpi.engagement * 9 + 20 + Math.sin(tick * 0.4) * 1.5));
  const reviewCount = 48 + Math.round(kpi.reachChange / 2) + (tick % 7 === 0 ? 1 : 0);
  const leadsCount = 112 + Math.round(kpi.viewsChange) + (tick % 5 === 0 ? 1 : 0);
  const revenue = 2500 + kpi.views / 10 + Math.sin(tick * 0.2) * 12;

  const metrics: CockpitMetric[] = [
    {
      id: 'geo',
      label: 'Visibilité G.E.O.',
      value: `${geoScore}%`,
      delta: 12,
      deltaLabel: 'vs période préc.',
      icon: Globe,
      iconColor: 'text-teal-600',
      iconBg: 'bg-teal-50',
    },
    {
      id: 'reviews',
      label: 'Avis Google Maps',
      value: String(reviewCount),
      delta: 24,
      deltaLabel: 'vs période préc.',
      icon: Star,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-50',
    },
    {
      id: 'leads',
      label: 'Leads WhatsApp',
      value: String(leadsCount),
      delta: 8,
      deltaLabel: 'vs période préc.',
      icon: MessageSquare,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
    },
    {
      id: 'revenue',
      label: "Chiffre d'Affaires estimé",
      value: `${revenue.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
      delta: 18,
      deltaLabel: 'vs période préc.',
      icon: Euro,
      iconColor: 'text-violet-600',
      iconBg: 'bg-violet-50',
    },
  ];

  return (
    <div className="space-y-3">
      {/* Connection warning banner */}
      {hasMissingConnections && (
        <Link to="/setup">
          <div className="flex items-center gap-3 rounded-xl border border-amber-200/80 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/60 px-4 py-3 hover:bg-amber-100/80 dark:hover:bg-amber-950/30 transition-colors cursor-pointer group">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-xs font-medium text-amber-800 dark:text-amber-300 flex-1 leading-snug">
              ⚠️ Complétez vos connexions pour permettre au Copilote de publier vos posts et sécuriser vos réservations.
              {!hasGBP && !hasStripe ? ' Google Business et Stripe manquants.' : !hasGBP ? ' Google Business manquant.' : ' Stripe Connect manquant.'}
            </p>
            <ArrowRight size={14} className="text-amber-600 dark:text-amber-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h2 className="text-sm font-bold text-foreground">Tableau de bord cockpit</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground bg-muted/60 rounded-full px-2.5 py-1 font-medium flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            {relativeTime}
          </span>
          <button
            onClick={handleRefresh}
            className="w-6 h-6 rounded-lg border border-border flex items-center justify-center hover:bg-muted/60 transition-colors"
            title="Actualiser les métriques"
          >
            <RefreshCw size={11} className={`text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* ── SPECIAL CARD: Secured Revenue ── */}
        <div className="relative rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-4 flex flex-col gap-3 hover:shadow-md transition-all duration-200 cursor-default group">
          {/* Pulse dot — indicates live data */}
          <span className="absolute top-3 right-3 relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Euro size={18} className="text-emerald-600" strokeWidth={2} />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
              <TrendingUp size={10} strokeWidth={3} />
              +14%
            </span>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums leading-none tracking-tight">
              1 420 €
            </p>
            <p className="text-xs text-emerald-800/70 dark:text-emerald-300/60 mt-1 font-medium">Généré ce mois par le Copilote</p>
          </div>
          <p className="text-[10px] font-bold text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-tight">💰 Chiffre d'Affaires Sécurisé</p>
        </div>

        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.id}
              className="relative rounded-2xl border border-border bg-card p-4 flex flex-col gap-3 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-default group"
            >
              {/* Top row: icon + badge */}
              <div className="flex items-start justify-between">
                <div className={`w-9 h-9 rounded-xl ${m.iconBg} flex items-center justify-center shrink-0`}>
                  <Icon size={18} className={m.iconColor} strokeWidth={2} />
                </div>
                <DeltaBadge delta={m.delta} label={m.deltaLabel} />
              </div>

              {/* Value with flash animation */}
              <div>
                <p className="text-2xl font-extrabold text-foreground leading-none tracking-tight">
                  <FlashValue value={m.value} />
                </p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">{m.label}</p>
              </div>

              {/* Subtle bottom accent line on hover */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
