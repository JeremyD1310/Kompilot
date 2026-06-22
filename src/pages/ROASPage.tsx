/**
 * ROASPage — Performances & ROAS
 * KPI cards, simulateur de canal publicitaire, graphique de rentabilité.
 */
import { useState, useMemo } from 'react';
import { TrendingUp, DollarSign, Target, Users, ChevronDown, BarChart2 } from 'lucide-react';
import { useOnboardingProfile } from '../hooks/useOnboardingProfile';
import { AdTruthDetector } from '../components/roas/AdTruthDetector';
import { TermTooltip } from '../components/shared/TermTooltip';

// ── Channel data ──────────────────────────────────────────────────────────────

type Channel = 'google' | 'meta' | 'local';

interface ChannelData {
  label: string;
  emoji: string;
  budget: number;
  revenue: number;
  cac: number;
  conversionRate: number;
  description: string;
  color: string;
}

const CHANNELS: Record<Channel, ChannelData> = {
  google: {
    label: 'Google Ads',
    emoji: '🔍',
    budget: 380,
    revenue: 2660,
    cac: 12,
    conversionRate: 4.2,
    description: 'Forte intention d\'achat — trafic qualifié en recherche active',
    color: '#4285F4',
  },
  meta: {
    label: 'Meta Ads',
    emoji: '📘',
    budget: 450,
    revenue: 2700,
    cac: 15,
    conversionRate: 2.8,
    description: 'Large audience — idéal pour notoriété et remarketing visuel',
    color: '#1877F2',
  },
  local: {
    label: 'Local Ads',
    emoji: '📍',
    budget: 200,
    revenue: 1800,
    cac: 8,
    conversionRate: 6.5,
    description: 'Ciblage hyper-local — ROI maximal pour les commerces de proximité',
    color: '#0D9488',
  },
};

// ── Simulated 30-day chart data ───────────────────────────────────────────────

function generateChartData(channel: Channel) {
  const { budget, revenue } = CHANNELS[channel];
  const days = 30;
  const dailyBudget = budget / days;
  const dailyRevenue = revenue / days;
  const data: { day: number; spend: number; gains: number }[] = [];

  let cumulSpend = 0;
  let cumulGains = 0;
  for (let d = 1; d <= days; d++) {
    const noise = 0.8 + Math.random() * 0.4;
    cumulSpend += dailyBudget * noise;
    cumulGains += dailyRevenue * noise;
    if (d % 3 === 0 || d === 1 || d === days) {
      data.push({ day: d, spend: Math.round(cumulSpend), gains: Math.round(cumulGains) });
    }
  }
  return data;
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  badge?: { text: string; color: string };
  trend?: number;
  /** Clé glossaire pour le badge tooltip */
  term?: string;
}

function KPICard({ icon, label, value, sub, badge, trend, term }: KPICardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          {icon}
        </div>
        {badge && (
          <span
            className="px-2.5 py-1 rounded-full text-xs font-black"
            style={{ background: badge.color + '20', color: badge.color }}
          >
            {badge.text}
          </span>
        )}
        {trend !== undefined && (
          <span className={`text-xs font-bold ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-black text-foreground leading-tight">{value}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-xs font-semibold text-muted-foreground">{label}</p>
          {term && <TermTooltip term={term} size="sm" />}
        </div>
        {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ── Bar chart (pure CSS/Tailwind) ─────────────────────────────────────────────

function ROASChart({ channel }: { channel: Channel }) {
  const data = useMemo(() => generateChartData(channel), [channel]);
  const maxVal = Math.max(...data.map(d => d.gains));

  const { color } = CHANNELS[channel];

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
          <span className="text-foreground font-semibold">Gains cumulés</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-400" />
          <span className="text-foreground font-semibold">Dépenses cumulées</span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-48">
        <div className="absolute inset-0 flex items-end gap-1 pb-6">
          {data.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              {/* Gains bar */}
              <div className="w-full flex flex-col justify-end" style={{ height: '160px' }}>
                <div
                  className="w-full rounded-t-sm transition-all duration-700"
                  style={{
                    height: `${(d.gains / maxVal) * 100}%`,
                    background: color,
                    opacity: 0.85,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Spend line overlay */}
        <div className="absolute inset-0 flex items-end pb-6 pointer-events-none">
          <svg className="w-full h-[160px]" preserveAspectRatio="none">
            <polyline
              points={data.map((d, i) => {
                const x = ((i + 0.5) / data.length) * 100;
                const y = 100 - (d.spend / maxVal) * 100;
                return `${x}% ${y}%`;
              }).join(' ')}
              fill="none"
              stroke="#EF4444"
              strokeWidth="2"
              strokeDasharray="5,3"
            />
          </svg>
        </div>

        {/* X axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[9px] text-muted-foreground px-1">
          <span>J1</span>
          <span>J10</span>
          <span>J20</span>
          <span>J30</span>
        </div>
      </div>

      {/* Breakeven indicator */}
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>Seuil de rentabilité atteint au <strong className="text-foreground">jour 4</strong> — rentable dès les premières dépenses</span>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ROASPage() {
  const profile = useOnboardingProfile();
  const [activeChannel, setActiveChannel] = useState<Channel>('meta');

  const ch = CHANNELS[activeChannel];
  const roas = +(ch.revenue / ch.budget).toFixed(1);
  const roasColor = roas >= 5 ? '#0D9488' : roas >= 3 ? '#F59E0B' : '#EF4444';

  const sectorLabel = profile?.sector ?? 'votre secteur';

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <TrendingUp size={20} className="text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-foreground">Performances & ROAS</h1>
                <TermTooltip term="ROAS" size="md" />
              </div>
              <p className="text-sm text-muted-foreground">Simulez l'impact de vos campagnes publicitaires</p>
            </div>
          </div>
          <div className="sm:ml-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/8 border border-primary/20">
            <BarChart2 size={13} className="text-primary" />
            <span className="text-xs font-semibold text-primary">{sectorLabel}</span>
          </div>
        </div>

        {/* ── Channel selector ───────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Simuler le canal publicitaire</p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(CHANNELS) as [Channel, ChannelData][]).map(([key, data]) => (
              <button
                key={key}
                onClick={() => setActiveChannel(key)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                  activeChannel === key
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted/40'
                }`}
              >
                <span className="text-xl">{data.emoji}</span>
                <span className="text-xs font-bold leading-tight">{data.label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center italic">{ch.description}</p>
        </div>

        {/* ── KPI Cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            icon={<DollarSign size={16} />}
            label="Budget Publicitaire"
            value={`${ch.budget} €`}
            sub="Mensuel estimé"
            trend={-3}
          />
          <KPICard
            icon={<TrendingUp size={16} />}
            label="Chiffre d'Affaires Généré"
            value={`${ch.revenue.toLocaleString('fr-FR')} €`}
            sub="Attributé aux campagnes"
            trend={12}
          />
          <KPICard
            icon={<Target size={16} />}
            label="ROAS Global"
            value={`x${roas}`}
            sub={`Taux de conversion : ${ch.conversionRate}%`}
            badge={{ text: roas >= 5 ? '🔥 Excellent' : roas >= 3 ? '✅ Bon' : '⚠️ À améliorer', color: roasColor }}
            term="ROAS"
          />
          <KPICard
            icon={<Users size={16} />}
            label="Coût d'Acquisition Client"
            value={`${ch.cac} €`}
            sub="Par nouveau client converti"
            trend={-8}
          />
        </div>

        {/* ── Chart ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-base text-foreground">Courbe de Rentabilité — 30 derniers jours</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Dépenses cumulées vs gains cumulés sur le mois</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-muted text-muted-foreground">
              {ch.emoji} {ch.label}
              <ChevronDown size={12} />
            </div>
          </div>
          <ROASChart channel={activeChannel} />
        </div>

        {/* ── Insight strip ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Coût par clic moyen', value: '0,42 €', sub: `vs secteur : 0,68 €`, positive: true },
            { label: 'Taux de conversion', value: `${ch.conversionRate}%`, sub: 'Benchmark secteur : 2,1%', positive: ch.conversionRate > 2.1 },
            { label: 'Retour sur 90 jours', value: `${(roas * 1.15).toFixed(1)}x`, sub: 'Projection lissée', positive: true },
          ].map((item, i) => (
            <div key={i} className="rounded-xl border border-border bg-card px-4 py-3 flex flex-col gap-1">
              <p className="text-xs text-muted-foreground font-semibold">{item.label}</p>
              <p className="text-lg font-black text-foreground">{item.value}</p>
              <p className={`text-[11px] font-medium ${item.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                {item.positive ? '▲' : '▼'} {item.sub}
              </p>
            </div>
          ))}
        </div>

        {/* ── Ad Truth Detector ───────────────────────────────────── */}
        <AdTruthDetector activeChannel={activeChannel} />

      </div>
    </div>
  );
}
