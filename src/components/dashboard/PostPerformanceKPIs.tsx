/**
 * PostPerformanceKPIs — Top KPI strip for the post performance dashboard.
 * Shows aggregated engagement, reach, clicks, and best-performing post.
 */
import { TrendingUp, Eye, MousePointerClick, Heart, BarChart3, ArrowUp, ArrowDown } from 'lucide-react';
import { type PostPerformanceMetrics, formatNumber } from './PostPerformanceData';
import { TermTooltip } from '../shared/TermTooltip';

interface Props {
  posts: PostPerformanceMetrics[];
}

interface KPICardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
  term?: string;
}

function KPICard({ label, value, subValue, trend, icon, color, bg, border, term }: KPICardProps) {
  return (
    <div style={{
      background: 'hsl(var(--card))',
      border: `1.5px solid ${border}`,
      borderRadius: 16, padding: '16px 18px',
      display: 'flex', flexDirection: 'column', gap: 10,
      flex: 1, minWidth: 160,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: '.7rem', fontWeight: 700, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            {label}
          </span>
          {term && <TermTooltip term={term} size="sm" />}
        </div>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      <div>
        <p style={{ fontWeight: 900, fontSize: '1.55rem', color: 'hsl(var(--foreground))', lineHeight: 1 }}>{value}</p>
        {subValue && <p style={{ fontSize: '.73rem', color: 'hsl(var(--muted-foreground))', marginTop: 3 }}>{subValue}</p>}
      </div>
      {trend !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {trend >= 0
            ? <ArrowUp size={13} style={{ color: '#16A34A' }} />
            : <ArrowDown size={13} style={{ color: '#DC2626' }} />}
          <span style={{ fontSize: '.73rem', fontWeight: 700, color: trend >= 0 ? '#16A34A' : '#DC2626' }}>
            {Math.abs(trend)}% vs semaine préc.
          </span>
        </div>
      )}
    </div>
  );
}

export function PostPerformanceKPIs({ posts }: Props) {
  const published = posts.filter(p => p.status === 'published');
  const totalReach = published.reduce((s, p) => s + p.reach, 0);
  const totalEngagement = published.reduce((s, p) => s + p.engagement, 0);
  const totalClicks = published.reduce((s, p) => s + p.clicks, 0);
  const avgEngRate = published.length > 0
    ? parseFloat(((totalEngagement / totalReach) * 100).toFixed(2))
    : 0;

  // Best post by engagement rate
  const best = [...published].sort((a, b) => b.engagementRate - a.engagementRate)[0];

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <KPICard
        label="Portée totale"
        value={formatNumber(totalReach)}
        subValue={`${published.length} posts publiés`}
        trend={+14}
        icon={<Eye size={16} />}
        color="#6359F8"
        bg="rgba(99,89,248,.12)"
        border="rgba(99,89,248,.2)"
      />
      <KPICard
        label="Engagement total"
        value={formatNumber(totalEngagement)}
        subValue={`Taux moy. ${avgEngRate}%`}
        trend={+8}
        icon={<Heart size={16} />}
        color="#E1306C"
        bg="rgba(225,48,108,.1)"
        border="rgba(225,48,108,.2)"
      />
      <KPICard
        label="Clics totaux"
        value={formatNumber(totalClicks)}
        subValue={`CTR moy. ${published.length > 0 ? (published.reduce((s, p) => s + p.ctr, 0) / published.length).toFixed(1) : 0}%`}
        trend={+22}
        icon={<MousePointerClick size={16} />}
        color="#0EA5E9"
        bg="rgba(14,165,233,.1)"
        border="rgba(14,165,233,.2)"
        term="CTR"
      />
      <KPICard
        label="Taux d'engagement"
        value={`${avgEngRate}%`}
        subValue="Moyenne tous canaux"
        trend={+3}
        icon={<TrendingUp size={16} />}
        color="#16A34A"
        bg="rgba(22,163,74,.1)"
        border="rgba(22,163,74,.2)"
        term="KPI"
      />
      {best && (
        <KPICard
          label="Meilleur post"
          value={`${best.engagementRate}%`}
          subValue={best.title.slice(0, 36) + (best.title.length > 36 ? '…' : '')}
          icon={<BarChart3 size={16} />}
          color="#F59E0B"
          bg="rgba(245,158,11,.1)"
          border="rgba(245,158,11,.2)"
        />
      )}
    </div>
  );
}
