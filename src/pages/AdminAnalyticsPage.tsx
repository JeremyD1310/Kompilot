/**
 * AdminAnalyticsPage — /admin/analytics
 * Financial KPIs + user plan management table (Stripe live data).
 * Restricted to admin@kompilot.com.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Euro, Users, TrendingUp, TrendingDown, Shield, RefreshCw,
  AlertTriangle, Clock, CheckCircle, XCircle, Crown, Zap,
  ChevronRight, Filter, Download, BarChart3,
} from 'lucide-react';
import { blink } from '../blink/client';
import { useAuth } from '../hooks/useAuth';
import { Link } from '@tanstack/react-router';

// ── Types ─────────────────────────────────────────────────────────────────────

interface KPI {
  mrr: number;
  mrrTrend: number[];
  newSubsThisWeek: number;
  trialSkipsThisWeek: number;
  noShowVolume: number;
  totalUsers: number;
  payingUsers: number;
  trialUsers: number;
  canceledUsers: number;
}

interface UserRow {
  id: string;
  email: string;
  displayName: string;
  sector: string;
  city: string;
  planId: string;
  status: 'trial' | 'paying' | 'canceled' | 'free';
  nextBillingDate: string | null;
  trialEnd: string | null;
  trialDaysLeft: number | null;
  createdAt: string;
  trialRenounced: boolean;
}

interface AnalyticsData {
  kpi: KPI;
  users: UserRow[];
  trialEndingSoon: UserRow[];
  stripeConfigured: boolean;
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status, trialDaysLeft }: { status: UserRow['status']; trialDaysLeft: number | null }) {
  const cfg: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    paying:   { label: 'Payant',   className: 'bg-emerald-900/60 text-emerald-300 border-emerald-700', icon: <CheckCircle size={10} /> },
    trial:    { label: `Essai${trialDaysLeft !== null ? ` (J-${trialDaysLeft})` : ''}`, className: 'bg-blue-900/60 text-blue-300 border-blue-700', icon: <Clock size={10} /> },
    canceled: { label: 'Résilié',  className: 'bg-red-900/60 text-red-300 border-red-700', icon: <XCircle size={10} /> },
    free:     { label: 'Gratuit',  className: 'bg-slate-700 text-slate-400 border-slate-600', icon: null },
  };
  const { label, className, icon } = cfg[status] || cfg.free;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border text-[10px] font-bold px-2 py-0.5 ${className}`}>
      {icon}{label}
    </span>
  );
}

// ── Plan badge ────────────────────────────────────────────────────────────────

function PlanBadge({ planId }: { planId: string }) {
  const isExpert = planId === 'expert' || planId === 'pro-commerce';
  const isPro    = planId === 'pro' || planId === 'solo';
  if (isExpert) return (
    <span className="inline-flex items-center gap-1 rounded-full border border-violet-700 bg-violet-900/60 text-violet-300 text-[10px] font-bold px-2 py-0.5">
      <Zap size={10} /> Expert
    </span>
  );
  if (isPro) return (
    <span className="inline-flex items-center gap-1 rounded-full border border-blue-700 bg-blue-900/60 text-blue-300 text-[10px] font-bold px-2 py-0.5">
      <Crown size={10} /> Pro
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-700 text-slate-400 text-[10px] font-bold px-2 py-0.5">
      Free
    </span>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KPICard({
  icon: Icon, label, value, sub, trend, gradient, glow,
}: {
  icon: typeof Euro; label: string; value: string; sub: string;
  trend?: 'up' | 'down' | null; gradient: string; glow: string;
}) {
  return (
    <div className={`relative rounded-2xl bg-gradient-to-br ${gradient} shadow-lg ${glow} p-5 overflow-hidden`}>
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
      <div className="absolute -bottom-3 right-4 w-12 h-12 rounded-full bg-white/10 pointer-events-none" />
      <div className="relative z-10">
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
          <Icon size={18} className="text-white" />
        </div>
        <div className="flex items-end gap-2">
          <p className="text-2xl font-extrabold text-white leading-none">{value}</p>
          {trend === 'up' && <TrendingUp size={14} className="text-white/70 mb-0.5" />}
          {trend === 'down' && <TrendingDown size={14} className="text-white/70 mb-0.5" />}
        </div>
        <p className="text-xs text-white/70 mt-1 leading-snug">{sub}</p>
        <p className="text-[11px] text-white/50 mt-1">{label}</p>
      </div>
    </div>
  );
}

// ── MRR Mini-chart ────────────────────────────────────────────────────────────

function MrrSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const months = ['M-2', 'M-1', 'Ce mois'];
  return (
    <div className="flex items-end gap-2 h-12">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[9px] text-slate-400 font-mono">{v.toFixed(0)}€</span>
          <div
            className="w-full rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400 opacity-80"
            style={{ height: `${(v / max) * 32}px`, minHeight: 4 }}
          />
          <span className="text-[9px] text-slate-600">{months[i]}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type FilterMode = 'all' | 'trial' | 'paying' | 'canceled' | 'trial-ending';

export default function AdminAnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [search, setSearch] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await blink.auth.getValidToken();
      const res = await fetch('https://gbrhsehk.backend.blink.new/api/admin/analytics-data', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json() as any;
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const json = await res.json() as AnalyticsData;
      setData(json);
      setLastRefresh(new Date());
    } catch (e: any) {
      setError(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Guard: only admin
  if (user && user.email !== 'admin@kompilot.com') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center space-y-3">
          <Shield size={40} className="text-red-400 mx-auto" />
          <p className="text-slate-300 font-semibold">Accès réservé à l'administrateur.</p>
          <Link to="/dashboard" className="text-teal-400 text-sm underline">Retour au dashboard</Link>
        </div>
      </div>
    );
  }

  // Filter logic
  const filteredUsers = (data?.users || []).filter(u => {
    const matchesFilter =
      filter === 'all' ? true :
      filter === 'trial' ? u.status === 'trial' :
      filter === 'paying' ? u.status === 'paying' :
      filter === 'canceled' ? u.status === 'canceled' :
      filter === 'trial-ending' ? (u.status === 'trial' && u.trialDaysLeft !== null && u.trialDaysLeft <= 3) :
      true;
    const q = search.toLowerCase();
    const matchesSearch = !search ||
      u.email.toLowerCase().includes(q) ||
      u.displayName.toLowerCase().includes(q) ||
      u.sector.toLowerCase().includes(q) ||
      u.city.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const kpi = data?.kpi;

  // CSV export
  const exportCSV = () => {
    if (!data) return;
    const header = 'Email,Nom,Secteur,Ville,Forfait,Statut,Prochain paiement,Essai jusqu\'au,Renoncé essai';
    const rows = filteredUsers.map(u =>
      [u.email, u.displayName, u.sector, u.city, u.planId, u.status,
       u.nextBillingDate ? new Date(u.nextBillingDate).toLocaleDateString('fr-FR') : '—',
       u.trialEnd ? new Date(u.trialEnd).toLocaleDateString('fr-FR') : '—',
       u.trialRenounced ? 'Oui' : 'Non'].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `kompilot-users-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
              <BarChart3 size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-100">Analytiques Financières</h1>
          </div>
          <p className="text-xs text-slate-500 ml-12">
            Données Stripe live · Mis à jour {lastRefresh.toLocaleTimeString('fr-FR')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!data?.stripeConfigured && (
            <span className="text-xs text-amber-400 bg-amber-900/30 border border-amber-700/40 rounded-lg px-3 py-1.5">
              ⚠️ Stripe non configuré — données simulées
            </span>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-700 hover:border-teal-500/50 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-teal-300 text-xs font-semibold px-4 py-2.5 transition-all disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Actualiser
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-800/50 bg-red-900/20 p-4 flex items-center gap-3">
          <AlertTriangle size={16} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
          <button onClick={fetchData} className="ml-auto text-xs text-red-400 underline">Réessayer</button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !data && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-800/60 animate-pulse" />
          ))}
        </div>
      )}

      {/* KPI Cards */}
      {kpi && (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <KPICard
              icon={Euro}
              label="MRR (Revenu Récurrent Mensuel)"
              value={`${kpi.mrr.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`}
              sub={`${kpi.payingUsers} abonnés actifs`}
              trend="up"
              gradient="from-emerald-600 to-teal-500"
              glow="shadow-emerald-500/25"
            />
            <KPICard
              icon={Users}
              label="Nouvelles Souscriptions (7j)"
              value={kpi.newSubsThisWeek.toString()}
              sub={`dont ${kpi.trialSkipsThisWeek} sans essai (accès immédiat)`}
              gradient="from-blue-600 to-indigo-500"
              glow="shadow-blue-500/25"
            />
            <KPICard
              icon={Shield}
              label='Volume "Bouclier Anti No-Show"'
              value={`${kpi.noShowVolume.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`}
              sub="Flux financiers sécurisés pros"
              gradient="from-violet-600 to-purple-500"
              glow="shadow-violet-500/25"
            />
            <KPICard
              icon={TrendingUp}
              label="Utilisateurs totaux"
              value={kpi.totalUsers.toString()}
              sub={`${kpi.trialUsers} en essai · ${kpi.canceledUsers} résiliés`}
              gradient="from-orange-600 to-amber-500"
              glow="shadow-orange-500/25"
            />
          </div>

          {/* MRR trend + trial alert */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* MRR 3-month sparkline */}
            <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-200">Tendance MRR — 3 derniers mois</p>
                <span className="text-xs text-emerald-400 font-semibold">Stripe live</span>
              </div>
              <MrrSparkline data={kpi.mrrTrend} />
            </div>

            {/* Trial ending soon */}
            <div className="rounded-2xl border border-amber-800/50 bg-amber-900/10 p-6 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-400" />
                <p className="text-sm font-bold text-amber-300">
                  Essais se terminant bientôt ({data.trialEndingSoon.length})
                </p>
                <button
                  onClick={() => setFilter('trial-ending')}
                  className="ml-auto text-[10px] text-amber-400 border border-amber-700/50 rounded-lg px-2 py-1 hover:bg-amber-900/30 transition-colors"
                >
                  Voir tous <ChevronRight size={10} className="inline" />
                </button>
              </div>
              {data.trialEndingSoon.length === 0 ? (
                <p className="text-xs text-slate-500">Aucun essai expirant dans les 3 prochains jours.</p>
              ) : (
                <div className="space-y-2">
                  {data.trialEndingSoon.slice(0, 5).map(u => (
                    <div key={u.id} className="flex items-center gap-3 text-xs">
                      <div className="w-7 h-7 rounded-full bg-amber-900/60 flex items-center justify-center text-[10px] font-bold text-amber-300 shrink-0">
                        {u.displayName.slice(0,2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-200 truncate">{u.displayName}</p>
                        <p className="text-slate-500 truncate">{u.sector} · {u.city}</p>
                      </div>
                      <span className="text-amber-400 font-bold whitespace-nowrap">
                        J-{u.trialDaysLeft}
                      </span>
                      <PlanBadge planId={u.planId} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Users table */}
      <div className="rounded-2xl border border-slate-700 bg-slate-800/40 overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-700 flex-wrap gap-y-3">
          <p className="text-sm font-bold text-slate-200 mr-2">État des forfaits</p>

          {/* Filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {([
              { id: 'all',          label: `Tous (${kpi?.totalUsers ?? '…'})` },
              { id: 'paying',       label: `Payants (${kpi?.payingUsers ?? '…'})` },
              { id: 'trial',        label: `Essai (${kpi?.trialUsers ?? '…'})` },
              { id: 'trial-ending', label: `⏰ Expire bientôt (${data?.trialEndingSoon.length ?? '…'})` },
              { id: 'canceled',     label: `Résiliés (${kpi?.canceledUsers ?? '…'})` },
            ] as { id: FilterMode; label: string }[]).map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`text-[11px] font-semibold rounded-full px-3 py-1 transition-all ${
                  filter === f.id
                    ? 'bg-teal-600 text-white'
                    : 'border border-slate-600 text-slate-400 hover:border-teal-500/50 hover:text-teal-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <input
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 w-44 transition-all"
            />
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 hover:border-teal-500/50 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-teal-300 text-xs font-semibold px-3 py-2 transition-all"
            >
              <Download size={12} /> CSV
            </button>
          </div>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-5 py-2.5 bg-slate-900/50 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          <span>Utilisateur</span>
          <span className="text-center">Secteur</span>
          <span className="text-center">Forfait</span>
          <span className="text-center">Statut</span>
          <span className="text-center">Prochain prélèvement</span>
          <span className="text-center">Essai renoncé</span>
        </div>

        {/* Rows */}
        {loading && data && (
          <div className="px-5 py-4 text-xs text-slate-500 animate-pulse">Actualisation…</div>
        )}
        {!loading && filteredUsers.length === 0 && (
          <div className="px-5 py-10 text-center text-xs text-slate-500">
            Aucun utilisateur correspondant.
          </div>
        )}
        {filteredUsers.map((u, i) => {
          const isEndingSoon = u.status === 'trial' && u.trialDaysLeft !== null && u.trialDaysLeft <= 3;
          return (
            <div
              key={u.id}
              className={`grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 items-center px-5 py-3.5 transition-colors ${
                isEndingSoon ? 'bg-amber-900/10' : 'hover:bg-slate-800/40'
              } ${i < filteredUsers.length - 1 ? 'border-b border-slate-800' : ''}`}
            >
              {/* User info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-extrabold shrink-0 ${
                  isEndingSoon ? 'bg-amber-900/60 text-amber-300' : 'bg-slate-700 text-slate-300'
                }`}>
                  {u.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-200 truncate">{u.displayName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                </div>
              </div>

              {/* Sector */}
              <span className="text-[11px] text-slate-400 whitespace-nowrap text-center">{u.sector}</span>

              {/* Plan */}
              <div className="flex justify-center"><PlanBadge planId={u.planId} /></div>

              {/* Status */}
              <div className="flex justify-center">
                <StatusBadge status={u.status} trialDaysLeft={u.trialDaysLeft} />
              </div>

              {/* Next billing */}
              <span className="text-[11px] text-slate-400 text-center whitespace-nowrap">
                {u.nextBillingDate
                  ? new Date(u.nextBillingDate).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' })
                  : '—'}
              </span>

              {/* Trial renounced */}
              <div className="flex justify-center">
                {u.trialRenounced ? (
                  <span className="text-[10px] text-teal-400 font-bold">⚡ Oui</span>
                ) : (
                  <span className="text-[10px] text-slate-600">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
