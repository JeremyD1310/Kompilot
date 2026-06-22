/**
 * PostPerformanceCharts — Recharts-based visualisations for post performance.
 * - Weekly trend line (reach / engagement / clicks)
 * - Channel comparison bar chart
 */
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import { type WeeklyTrend, type ChannelSummary, CHANNEL_META, formatNumber } from './PostPerformanceData';

// ── Custom tooltip ─────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: 12, padding: '10px 14px',
      boxShadow: '0 4px 24px rgba(0,0,0,.12)',
      minWidth: 140,
    }}>
      <p style={{ fontSize: '.75rem', fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: 6 }}>{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
          <span style={{ fontSize: '.72rem', color: 'hsl(var(--muted-foreground))' }}>{entry.name}</span>
          <span style={{ fontSize: '.72rem', fontWeight: 700, color: 'hsl(var(--foreground))', marginLeft: 'auto' }}>
            {formatNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Weekly trend chart ────────────────────────────────────────────────────────
interface TrendChartProps {
  data: WeeklyTrend[];
  activeMetric: 'reach' | 'engagement' | 'clicks';
}

const METRIC_CONFIG = {
  reach:      { label: 'Portée',      color: '#6359F8', gradient: 'rgba(99,89,248,.15)' },
  engagement: { label: 'Engagement',  color: '#E1306C', gradient: 'rgba(225,48,108,.12)' },
  clicks:     { label: 'Clics',       color: '#0EA5E9', gradient: 'rgba(14,165,233,.12)' },
};

export function WeeklyTrendChart({ data, activeMetric }: TrendChartProps) {
  const cfg = METRIC_CONFIG[activeMetric];
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad_${activeMetric}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={cfg.color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={cfg.color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={formatNumber} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={40} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey={activeMetric}
          name={cfg.label}
          stroke={cfg.color}
          strokeWidth={2.5}
          fill={`url(#grad_${activeMetric})`}
          dot={{ r: 3, fill: cfg.color, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: cfg.color, stroke: '#fff', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Channel comparison bar chart ──────────────────────────────────────────────
interface ChannelBarProps {
  summaries: ChannelSummary[];
}

export function ChannelBarChart({ summaries }: ChannelBarProps) {
  const data = summaries.map(s => ({
    name: CHANNEL_META[s.channel]?.label ?? s.channel,
    Portée: s.totalReach,
    Engagement: s.totalEngagement,
    Clics: s.totalClicks,
    fill: CHANNEL_META[s.channel]?.color ?? '#6359F8',
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: -16, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={formatNumber} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={40} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        <Bar dataKey="Portée"      fill="#6359F8" radius={[4,4,0,0]} maxBarSize={28} />
        <Bar dataKey="Engagement"  fill="#E1306C" radius={[4,4,0,0]} maxBarSize={28} />
        <Bar dataKey="Clics"       fill="#0EA5E9" radius={[4,4,0,0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Engagement rate mini-bar per channel ──────────────────────────────────────
export function EngagementRateList({ summaries }: ChannelBarProps) {
  const max = Math.max(...summaries.map(s => s.avgEngagementRate), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {summaries.map(s => {
        const meta = CHANNEL_META[s.channel];
        const pct = (s.avgEngagementRate / max) * 100;
        return (
          <div key={s.channel}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: '.78rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                {meta?.label ?? s.channel}
              </span>
              <span style={{ fontSize: '.75rem', fontWeight: 800, color: meta?.color ?? '#6359F8' }}>
                {s.avgEngagementRate}%
              </span>
            </div>
            <div style={{ height: 6, background: 'hsl(var(--muted))', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${pct}%`,
                background: meta?.color ?? '#6359F8',
                borderRadius: 3, transition: 'width .6s ease',
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
