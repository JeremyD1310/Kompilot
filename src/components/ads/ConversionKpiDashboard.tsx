/**
 * ConversionKpiDashboard — Displays conversion funnel KPIs from appointment data.
 * Sources: Calendly, HighLevel, HubSpot via Instant Forms integration.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  CalendarCheck, TrendingUp, Users, Target, ArrowUpRight,
  Loader2, RefreshCw, CheckCircle2, Clock, XCircle, AlertCircle,
} from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import { blink } from '../../blink/client';

// ── Types ─────────────────────────────────────────────────────────────────────

interface KpiSummary {
  period: { days: number; from: string; to: string };
  kpis: {
    totalLeads: number;
    totalAppointments: number;
    conversionRate: number;
    totalConfigs: number;
    avgLeadsPerDay: number;
  };
  byStatus: Record<string, number>;
  byProvider: Record<string, number>;
  configSummary: { totalConfigLeads: number; totalConfigAppointments: number };
}

interface TimelinePoint {
  date: string;
  leads: number;
  appointments: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PROVIDER_META: Record<string, { name: string; icon: string; color: string }> = {
  calendly:  { name: 'Calendly',  icon: '📅', color: '#006BFF' },
  highlevel: { name: 'HighLevel', icon: '🔷', color: '#147BFF' },
  hubspot:   { name: 'HubSpot',   icon: '🟠', color: '#FF7A59' },
  none:      { name: 'Aucun',     icon: '📋', color: '#64748B' },
};

const STATUS_META: Record<string, { label: string; icon: React.ReactNode; color: string; cls: string }> = {
  pending:   { label: 'En attente', icon: <Clock size={12} />, color: '#F59E0B', cls: 'bg-amber-500/10 text-amber-600' },
  confirmed: { label: 'Confirmés',  icon: <CheckCircle2 size={12} />, color: '#10B981', cls: 'bg-emerald-500/10 text-emerald-600' },
  completed: { label: 'Terminés',   icon: <CheckCircle2 size={12} />, color: '#3B82F6', cls: 'bg-blue-500/10 text-blue-600' },
  cancelled: { label: 'Annulés',    icon: <XCircle size={12} />,      color: '#EF4444', cls: 'bg-red-500/10 text-red-600' },
};

// ── Fetchers ──────────────────────────────────────────────────────────────────

async function fetchSummary(days: number): Promise<KpiSummary> {
  const token = await blink.auth.getValidToken();
  const resp = await fetch(`/api/conversion-kpis/summary?days=${days}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error('Failed to fetch KPI summary');
  return resp.json();
}

async function fetchTimeline(days: number): Promise<TimelinePoint[]> {
  const token = await blink.auth.getValidToken();
  const resp = await fetch(`/api/conversion-kpis/timeline?days=${days}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error('Failed to fetch timeline');
  const data = await resp.json();
  return data.timeline || [];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ConversionKpiDashboard() {
  const [days, setDays] = useState(30);

  const { data: summary, isLoading: loadingSummary, refetch: refetchSummary } = useQuery({
    queryKey: ['conversionKpis', days],
    queryFn: () => fetchSummary(days),
  });

  const { data: timeline, isLoading: loadingTimeline } = useQuery({
    queryKey: ['conversionTimeline', days],
    queryFn: () => fetchTimeline(days),
  });

  const kpis = summary?.kpis;
  const loading = loadingSummary || loadingTimeline;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Target size={18} className="text-emerald-500" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-foreground">Conversion RDV</h3>
            <p className="text-[10px] text-muted-foreground">
              Leads → Rendez-vous · Calendly / HighLevel / HubSpot
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="text-xs border border-border bg-card rounded-lg px-2 py-1.5 text-foreground"
          >
            <option value={7}>7 jours</option>
            <option value={30}>30 jours</option>
            <option value={90}>90 jours</option>
          </select>
          <button
            onClick={() => { refetchSummary(); toast.success('Données actualisées'); }}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {loading && !summary ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : !summary || !kpis ? (
        <div className="text-center py-12">
          <CalendarCheck size={32} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Aucune donnée de conversion disponible</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            Configurez un formulaire Instant dans Meta Ads pour commencer à suivre les RDV.
          </p>
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard
              icon={<Users size={14} />}
              label="Total Leads"
              value={kpis.totalLeads}
              sub={`${kpis.avgLeadsPerDay}/jour`}
              accent="text-violet-600"
            />
            <KpiCard
              icon={<CalendarCheck size={14} />}
              label="RDV Confirmés"
              value={kpis.totalAppointments}
              sub="confirmés + terminés"
              accent="text-emerald-600"
            />
            <KpiCard
              icon={<Target size={14} />}
              label="Taux conversion"
              value={`${kpis.conversionRate}%`}
              sub="leads → RDV"
              accent={kpis.conversionRate >= 20 ? 'text-emerald-600' : 'text-amber-600'}
            />
            <KpiCard
              icon={<ArrowUpRight size={14} />}
              label="Formulaires actifs"
              value={kpis.totalConfigs}
              sub="configurations"
              accent="text-blue-600"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Timeline chart */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                <TrendingUp size={13} className="text-primary" /> Évolution leads / RDV
              </p>
              {timeline && timeline.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={timeline} margin={{ left: -10, right: 8, top: 4, bottom: 4 }}>
                    <defs>
                      <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradAppts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false} tickLine={false}
                      tickFormatter={(v) => {
                        const d = new Date(v);
                        return `${d.getDate()}/${d.getMonth() + 1}`;
                      }}
                    />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={24} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="rounded-lg border border-border bg-card shadow-lg px-3 py-2 text-xs">
                            <p className="font-bold text-foreground mb-1">{label}</p>
                            {payload.map((p, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                <span className="text-muted-foreground">{p.name}</span>
                                <span className="font-extrabold ml-auto">{p.value}</span>
                              </div>
                            ))}
                          </div>
                        );
                      }}
                    />
                    <Area type="monotone" dataKey="leads" name="Leads" stroke="#8B5CF6" strokeWidth={2} fill="url(#gradLeads)" dot={false} />
                    <Area type="monotone" dataKey="appointments" name="RDV" stroke="#10B981" strokeWidth={2} fill="url(#gradAppts)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">Aucune donnée sur cette période</p>
              )}
            </div>

            {/* Provider breakdown */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                <CalendarCheck size={13} className="text-emerald-500" /> RDV par fournisseur
              </p>
              {summary.byProvider && Object.keys(summary.byProvider).length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart
                      data={Object.entries(summary.byProvider)
                        .filter(([_, v]) => v > 0)
                        .map(([k, v]) => ({
                          name: PROVIDER_META[k]?.name || k,
                          count: v,
                          color: PROVIDER_META[k]?.color || '#64748B',
                        }))}
                      margin={{ left: -10, right: 8, top: 4, bottom: 4 }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={24} />
                      <Tooltip />
                      <Bar dataKey="count" name="RDV" radius={[6, 6, 0, 0]} maxBarSize={40}>
                        {Object.entries(summary.byProvider)
                          .filter(([_, v]) => v > 0)
                          .map(([k], i) => (
                            <Cell key={i} fill={PROVIDER_META[k]?.color || '#64748B'} fillOpacity={0.85} />
                          ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Status breakdown */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {Object.entries(summary.byStatus).map(([status, count]) => {
                      const meta = STATUS_META[status];
                      if (!meta || count === 0) return null;
                      return (
                        <span key={status} className={`inline-flex items-center gap-1.5 text-[10px] font-bold rounded-full px-2.5 py-1 ${meta.cls}`}>
                          {meta.icon} {meta.label}: {count}
                        </span>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">Aucun RDV enregistré</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, accent }: {
  icon: React.ReactNode; label: string; value: string | number; sub: string; accent: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card px-4 py-3 space-y-1"
    >
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-2xl font-extrabold tabular-nums ${accent}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </motion.div>
  );
}
