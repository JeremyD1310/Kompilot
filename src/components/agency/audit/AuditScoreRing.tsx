/**
 * AuditScoreRing.tsx — SVG donut score ring + priorityStyle helper
 */

export function scoreColor(s: number): string {
  if (s >= 75) return '#22C55E';
  if (s >= 50) return '#F59E0B';
  return '#EF4444';
}

export function priorityStyle(p: 'high' | 'medium' | 'low') {
  if (p === 'high') return { bg: 'rgba(239,68,68,.1)', border: 'rgba(239,68,68,.25)', text: '#EF4444', label: '🔴 Critique' };
  if (p === 'medium') return { bg: 'rgba(245,158,11,.1)', border: 'rgba(245,158,11,.25)', text: '#F59E0B', label: '🟡 Important' };
  return { bg: 'rgba(34,197,94,.1)', border: 'rgba(34,197,94,.25)', text: '#22C55E', label: '🟢 Opportunité' };
}

interface ScoreRingProps {
  score: number;
  size?: number;
  label: string;
}

export function AuditScoreRing({ score, size = 72, label }: ScoreRingProps) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ - (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="hsl(var(--muted))" strokeWidth={6}
          />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={color} strokeWidth={6}
            strokeDasharray={circ} strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-black" style={{ color }}>{score}</span>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground font-semibold text-center leading-tight">{label}</p>
    </div>
  );
}
