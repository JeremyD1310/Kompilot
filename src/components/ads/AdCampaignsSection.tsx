import { useState } from 'react';
import { TrendingUp, Megaphone, PlusCircle, Eye, CalendarCheck, Euro, Zap } from 'lucide-react';
import { Button } from '@blinkdotnew/ui';
import {
  ResponsiveContainer,
  BarChart, Bar,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  Cell,
} from 'recharts';
import { LocalAdsModal } from './LocalAdsModal';

// ── Data ──────────────────────────────────────────────────────────────────────

const MOCK_CAMPAIGNS = [
  { id: '1', name: '🌸 Printemps',     fullName: '🌸 Offre Printemps — -30%',       budget: 50,  reachNum: 2480,  appointments: 8,  revenueNum: 320,  status: 'active' },
  { id: '2', name: '🎂 Anniversaire',  fullName: '🎂 Promo Anniversaire Clients',    budget: 30,  reachNum: 1150,  appointments: 4,  revenueNum: 160,  status: 'ended'  },
  { id: '3', name: '⚡ Flash Promo',   fullName: '⚡ Flash Promo Week-end',           budget: 100, reachNum: 5920,  appointments: 19, revenueNum: 760,  status: 'ended'  },
];

// Simulated 7-day cumulative reach trend per campaign (index = day 1–7)
const TREND_DATA = [
  { day: 'J1', '🌸 Printemps': 180,  '🎂 Anniversaire': 90,   '⚡ Flash Promo': 520  },
  { day: 'J2', '🌸 Printemps': 510,  '🎂 Anniversaire': 240,  '⚡ Flash Promo': 1240 },
  { day: 'J3', '🌸 Printemps': 890,  '🎂 Anniversaire': 430,  '⚡ Flash Promo': 2180 },
  { day: 'J4', '🌸 Printemps': 1320, '🎂 Anniversaire': 680,  '⚡ Flash Promo': 3250 },
  { day: 'J5', '🌸 Printemps': 1740, '🎂 Anniversaire': 890,  '⚡ Flash Promo': 4400 },
  { day: 'J6', '🌸 Printemps': 2150, '🎂 Anniversaire': 1040, '⚡ Flash Promo': 5310 },
  { day: 'J7', '🌸 Printemps': 2480, '🎂 Anniversaire': 1150, '⚡ Flash Promo': 5920 },
];

const CHART_COLORS = ['#7c3aed', '#0d9488', '#f59e0b'];

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  active: { label: '● Active',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ended:  { label: '■ Terminée', cls: 'bg-muted text-muted-foreground border-border' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString('fr-FR');

// ── Custom tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, unit = '' }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; unit?: string
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card shadow-lg px-3 py-2 text-xs space-y-1">
      <p className="font-bold text-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="font-extrabold text-foreground ml-auto pl-3 tabular-nums">{fmt(p.value)}{unit}</span>
        </div>
      ))}
    </div>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, accentCls }: {
  icon: React.ReactNode; label: string; value: string; sub: string; accentCls: string
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-card px-4 py-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-2xl font-extrabold tabular-nums ${accentCls}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AdCampaignsSection() {
  const [modalOpen, setModalOpen] = useState(false);

  const totalReach       = MOCK_CAMPAIGNS.reduce((s, c) => s + c.reachNum, 0);
  const totalAppointments = MOCK_CAMPAIGNS.reduce((s, c) => s + c.appointments, 0);
  const totalRevenue     = MOCK_CAMPAIGNS.reduce((s, c) => s + c.revenueNum, 0);
  const totalBudget      = MOCK_CAMPAIGNS.reduce((s, c) => s + c.budget, 0);
  const roi              = (totalRevenue / totalBudget).toFixed(1);

  // Data for per-campaign bar charts
  const barData = MOCK_CAMPAIGNS.map((c, i) => ({
    name: c.name,
    reach: c.reachNum,
    rdv: c.appointments,
    ca: c.revenueNum,
    color: CHART_COLORS[i],
  }));

  return (
    <>
      <div className="space-y-4">

        {/* ── Header card ──────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border bg-gradient-to-r from-violet-50/60 to-emerald-50/60 dark:from-violet-950/20 dark:to-emerald-950/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center shadow-sm">
                <Megaphone size={15} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-foreground">Performances des campagnes publicitaires</p>
                <p className="text-[11px] text-muted-foreground">Facebook & Instagram Ads · Acquisition payante locale</p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
              className="gap-1.5 text-xs font-bold bg-gradient-to-r from-violet-600 to-emerald-500 border-0 text-white hover:from-violet-700 hover:to-emerald-600 shadow-sm shrink-0"
            >
              <PlusCircle size={13} /> Nouvelle campagne
            </Button>
          </div>

          {/* ── KPI summary ──────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 border-b border-border">
            <KpiCard
              icon={<Eye size={12} />}
              label="Portée totale"
              value={fmt(totalReach)}
              sub="personnes atteintes"
              accentCls="text-violet-600"
            />
            <KpiCard
              icon={<CalendarCheck size={12} />}
              label="RDV générés"
              value={String(totalAppointments)}
              sub="réservations issues des ads"
              accentCls="text-emerald-600"
            />
            <KpiCard
              icon={<Euro size={12} />}
              label="CA généré"
              value={`${fmt(totalRevenue)} €`}
              sub="chiffre d'affaires attributé"
              accentCls="text-emerald-600"
            />
            <KpiCard
              icon={<Zap size={12} />}
              label="ROI moyen"
              value={`× ${roi}`}
              sub={`pour ${totalBudget} € investis`}
              accentCls="text-amber-600"
            />
          </div>

          {/* ── Charts ───────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-border">

            {/* Chart 1 — Portée locale par campagne (horizontal bar) */}
            <div className="px-5 py-4 space-y-2">
              <div className="flex items-center gap-1.5">
                <Eye size={13} className="text-violet-500 shrink-0" />
                <p className="text-xs font-bold text-foreground">Portée locale par campagne</p>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 24, top: 4, bottom: 4 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => fmt(v)} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                  <Bar dataKey="reach" name="Portée" radius={[0, 6, 6, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={index} fill={CHART_COLORS[index]} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 2 — RDV + CA par campagne (grouped vertical bar) */}
            <div className="px-5 py-4 space-y-2">
              <div className="flex items-center gap-1.5">
                <CalendarCheck size={13} className="text-emerald-500 shrink-0" />
                <p className="text-xs font-bold text-foreground">RDV générés & CA par campagne</p>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={barData} margin={{ left: -10, right: 8, top: 4, bottom: 4 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="rdv" orientation="left"  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={22} />
                  <YAxis yAxisId="ca"  orientation="right" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={36} tickFormatter={v => `${v}€`} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
                  <Bar yAxisId="rdv" dataKey="rdv" name="RDV"       fill="#0d9488" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar yAxisId="ca"  dataKey="ca"  name="CA (€)"    fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3 — Cumulative reach trend over 7 days (full width area) */}
          <div className="px-5 py-4 border-t border-border space-y-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp size={13} className="text-primary shrink-0" />
              <p className="text-xs font-bold text-foreground">Évolution de la portée sur 7 jours</p>
              <span className="text-[10px] text-muted-foreground ml-1">(portée cumulée par campagne)</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={TREND_DATA} margin={{ left: -10, right: 8, top: 4, bottom: 4 }}>
                <defs>
                  {MOCK_CAMPAIGNS.map((c, i) => (
                    <linearGradient key={c.id} id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={CHART_COLORS[i]} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={CHART_COLORS[i]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={36} tickFormatter={v => fmt(v)} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
                {MOCK_CAMPAIGNS.map((c, i) => (
                  <Area
                    key={c.id}
                    type="monotone"
                    dataKey={c.name}
                    stroke={CHART_COLORS[i]}
                    strokeWidth={2}
                    fill={`url(#grad${i})`}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* ── Table ────────────────────────────────────────────── */}
          <div className="border-t border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Campagne</th>
                  <th className="text-right px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Budget 💳</th>
                  <th className="text-right px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Portée locale</th>
                  <th className="text-right px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide hidden md:table-cell">RDV</th>
                  <th className="text-right px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">CA 💶</th>
                  <th className="text-right px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Statut</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_CAMPAIGNS.map((c, i) => {
                  const st = STATUS_STYLES[c.status];
                  return (
                    <tr key={c.id} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/5'}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i] }} />
                          <div>
                            <p className="text-sm font-semibold text-foreground leading-tight">{c.fullName}</p>
                            <p className="text-[10px] text-muted-foreground">7 jours · Facebook & Instagram</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-bold text-foreground tabular-nums">{c.budget} €</span>
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        <span className="text-sm font-semibold text-violet-600 tabular-nums">{fmt(c.reachNum)}</span>
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        <span className="text-sm font-bold text-emerald-600 tabular-nums">{c.appointments}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-extrabold text-emerald-600 tabular-nums">{fmt(c.revenueNum)} €</span>
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-muted/30">
                  <td className="px-5 py-3 text-xs font-bold text-muted-foreground">Total</td>
                  <td className="px-4 py-3 text-right text-xs font-extrabold text-foreground tabular-nums">{totalBudget} €</td>
                  <td className="px-4 py-3 hidden sm:table-cell" />
                  <td className="px-4 py-3 text-right text-xs font-extrabold text-emerald-600 tabular-nums hidden md:table-cell">{totalAppointments} RDV</td>
                  <td className="px-4 py-3 text-right text-xs font-extrabold text-emerald-600 tabular-nums">{fmt(totalRevenue)} €</td>
                  <td className="px-4 py-3 hidden sm:table-cell" />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* ROI footer */}
          <div className="px-5 py-3 border-t border-border bg-muted/10 flex items-center gap-2">
            <TrendingUp size={13} className="text-primary shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              ROI moyen constaté : <strong className="text-foreground">× {roi}</strong> — chaque euro investi génère en moyenne {roi} € de chiffre d'affaires.
            </p>
          </div>
        </div>
      </div>

      <LocalAdsModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
