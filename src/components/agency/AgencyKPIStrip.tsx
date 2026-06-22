/**
 * AgencyKPIStrip — 7-card KPI summary strip for the agency dashboard.
 * Cards for unhandled reviews and avg GEO score include a 7-day SVG sparkline.
 */

/* ── Inline sparkline (no recharts dependency) ──────────────────────────── */
function Sparkline({ points, color, height = 28, width = 72 }: {
  points: number[];
  color: string;
  height?: number;
  width?: number;
}) {
  if (points.length < 2) return null;

  const nonZero = points.filter(p => p > 0);
  const min = nonZero.length > 0 ? Math.min(...nonZero) * 0.92 : 0;
  const max = nonZero.length > 0 ? Math.max(...nonZero) * 1.08 : 100;
  const range = max - min || 1;

  const toX = (i: number) => (i / (points.length - 1)) * width;
  const toY = (v: number) => height - ((v - min) / range) * height;

  const d = points
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`)
    .join(' ');

  const areaD = `${d} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: 'visible', display: 'block' }}
    >
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path d={areaD} fill={`url(#sg-${color.replace('#', '')})`} />
      {/* Line */}
      <path d={d} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      {/* Last dot */}
      <circle
        cx={toX(points.length - 1).toFixed(1)}
        cy={toY(points[points.length - 1]).toFixed(1)}
        r={2.5}
        fill={color}
      />
    </svg>
  );
}

/* ── Trend badge ─────────────────────────────────────────────────────────── */
function TrendBadge({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const first = points.find(p => p > 0) ?? 0;
  const last = points[points.length - 1];
  if (first === 0) return null;
  const delta = last - first;
  const pct = Math.abs(Math.round((delta / first) * 100));
  const up = delta >= 0;
  return (
    <span style={{
      fontSize: '.65rem',
      fontWeight: 700,
      color: up ? '#22C55E' : '#EF4444',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 1,
    }}>
      {up ? '▲' : '▼'} {pct}%
    </span>
  );
}

import { TermTooltip } from '../shared/TermTooltip';

/* ── Types ───────────────────────────────────────────────────────────────── */
interface KPICard {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  description: string;
  pulse?: boolean;
  sparkline?: number[];
  term?: string;
}

export interface AgencyKPIStripProps {
  totalClients: number;
  alertClients: number;
  avgScore: number;
  totalSmsSent?: number;
  totalLeads?: number;
  /** From useAgencyRealTimeKPIs */
  totalUnhandledReviews?: number;
  avgGeoScore?: number;
  weekTrend?: number[];
  clientsImproved?: number;
}

/* ── Component ───────────────────────────────────────────────────────────── */
export function AgencyKPIStrip({
  totalClients,
  alertClients,
  avgScore,
  totalSmsSent,
  totalLeads,
  totalUnhandledReviews,
  avgGeoScore,
  weekTrend = [],
  clientsImproved,
}: AgencyKPIStripProps) {
  const displayGeoScore = avgGeoScore ?? avgScore;

  const kpis: KPICard[] = [
    {
      label: 'Clients actifs',
      value: totalClients,
      icon: '🏢',
      color: '#6359F8',
      description: 'comptes gérés',
    },
    {
      label: 'Alertes avis',
      value: alertClients,
      icon: '🔴',
      color: '#EF4444',
      description: alertClients > 0 ? 'nécessitent une action' : 'aucun problème',
      pulse: alertClients > 0,
    },
    {
      label: 'Score G.E.O. moyen',
      value: `${displayGeoScore}%`,
      icon: '📈',
      color: displayGeoScore >= 70 ? '#22C55E' : displayGeoScore >= 50 ? '#F59E0B' : '#EF4444',
      description: 'sur tous les clients',
      sparkline: weekTrend.length >= 2 ? weekTrend : undefined,
      term: 'GEO',
    },
    {
      label: 'Avis non traités',
      value: totalUnhandledReviews ?? '--',
      icon: '💬',
      color: (totalUnhandledReviews ?? 0) > 5 ? '#EF4444' : (totalUnhandledReviews ?? 0) > 0 ? '#F59E0B' : '#22C55E',
      description: 'requièrent une réponse',
      pulse: (totalUnhandledReviews ?? 0) > 5,
      sparkline: weekTrend.length >= 2 ? weekTrend : undefined,
    },
    {
      label: 'SMS envoyés',
      value: totalSmsSent ?? '--',
      icon: '📱',
      color: '#0EA5E9',
      description: 'crédits utilisés',
    },
    {
      label: 'En progression',
      value: clientsImproved !== undefined ? clientsImproved : '--',
      icon: '📊',
      color: '#22C55E',
      description: 'clients 7j en hausse',
    },
    {
      label: 'Leads capturés',
      value: totalLeads ?? '--',
      icon: '👥',
      color: '#F59E0B',
      description: 'ce mois-ci',
    },
  ];

  return (
    <>
      <style>{`
        @keyframes kpi-pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.45); }
          70%  { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .kpi-pulse {
          animation: kpi-pulse-ring 1.8s ease-out infinite;
        }
      `}</style>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
          gap: 12,
          marginBottom: 28,
        }}
      >
        {kpis.map(k => (
          <div
            key={k.label}
            className={k.pulse ? 'kpi-pulse' : undefined}
            style={{
              background: 'hsl(var(--card))',
              border: `1px solid ${k.pulse ? 'rgba(239,68,68,0.4)' : 'hsl(var(--border))'}`,
              borderRadius: 14,
              padding: '14px 16px',
              transition: 'border-color 0.2s',
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
            }}
          >
            {/* Label row */}
            <p
              style={{
                color: 'hsl(var(--muted-foreground))',
                fontSize: '.65rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '.05em',
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>{k.icon}</span>
              <span>{k.label}</span>
              {k.term && <TermTooltip term={k.term} size="sm" />}
            </p>

            {/* Value + trend inline */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
              <p
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 900,
                  color: k.color,
                  lineHeight: 1,
                }}
              >
                {k.value}
              </p>
              {k.sparkline && <TrendBadge points={k.sparkline} />}
            </div>

            {/* Sparkline */}
            {k.sparkline && k.sparkline.length >= 2 && (
              <div style={{ margin: '4px 0 4px' }}>
                <Sparkline points={k.sparkline} color={k.color} />
              </div>
            )}

            {/* Description */}
            <p
              style={{
                fontSize: '.68rem',
                color: 'hsl(var(--muted-foreground))',
                fontWeight: 500,
                lineHeight: 1.3,
                margin: 0,
                opacity: 0.8,
              }}
            >
              {k.description}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
