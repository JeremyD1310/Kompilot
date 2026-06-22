/**
 * MockupPrimitives — Shared sub-components for AgencyDashboardMockup.
 * Sparkline SVG + ScorePill
 */

/** Responsive SVG sparkline with gradient fill */
export function Spark({ data, color }: { data: readonly number[] | number[]; color: string }) {
  const W = 120, H = 38;
  const min = Math.min(...data), max = Math.max(...data), rng = max - min || 1;
  const pts = data.map((v, idx) => {
    const x = (idx / (data.length - 1)) * W;
    const y = H - ((v - min) / rng) * (H - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const poly = pts.join(' ');
  const gid = `_ncg${color.replace('#', '')}`;
  const [lx, ly] = pts[pts.length - 1].split(',').map(Number);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${poly} ${W},${H} 0,${H}`} fill={`url(#${gid})`} />
      <polyline points={poly} fill="none" stroke={color} strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="2.8" fill={color} />
    </svg>
  );
}

/** Coloured score pill (Faible/Moyen/Élevé vulnerability) */
export function ScorePill({ score }: { score: number }) {
  const [c, bg, label] =
    score >= 65 ? ['#22C55E', 'rgba(34,197,94,.12)', 'Faible']
    : score >= 40 ? ['#F59E0B', 'rgba(245,158,11,.12)', 'Moyen']
    : ['#EF4444', 'rgba(239,68,68,.12)', 'Élevé'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: bg, border: `1px solid ${c}40`,
      borderRadius: 20, padding: '2px 8px',
      color: c, fontSize: '.6rem', fontWeight: 800, flexShrink: 0,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c, display: 'inline-block' }} />
      {label} ({score})
    </span>
  );
}
