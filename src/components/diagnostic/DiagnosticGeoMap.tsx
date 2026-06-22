/**
 * DiagnosticGeoMap — SVG-based geo radar visualization.
 * Shows concentric rings, a center pin (the business), and colored
 * competitor dots (red/orange/green) to simulate a real GEO scan.
 */
import { useMemo } from 'react';

interface Dot {
  x: number; y: number;
  status: 'bad' | 'medium' | 'good';
  label: string;
}

const STATUS_COLORS = {
  bad:    { fill: '#EF4444', stroke: '#FCA5A5', label: '#991B1B' },
  medium: { fill: '#F59E0B', stroke: '#FCD34D', label: '#92400E' },
  good:   { fill: '#10B981', stroke: '#6EE7B7', label: '#065F46' },
};

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

function generateDots(score: number, seed: number): Dot[] {
  const rng = seededRandom(seed);
  const count = 12;
  const labels = [
    'Concurrent A', 'Concurrent B', 'Partenaire', 'Votre zone',
    'Quartier Nord', 'Quartier Sud', 'Centre-ville', 'Périphérie',
    'Rival 1', 'Rival 2', 'Allié', 'Voisin',
  ];
  return Array.from({ length: count }, (_, i) => {
    const angle = (rng() * Math.PI * 2);
    const dist = 30 + rng() * 95; // radius from center (0–125)
    const x = 150 + Math.cos(angle) * dist;
    const y = 150 + Math.sin(angle) * dist;
    // Distribute: low score → more red dots; high score → more green
    const roll = rng();
    let status: Dot['status'];
    if (score < 40)      status = roll < 0.6 ? 'bad' : roll < 0.85 ? 'medium' : 'good';
    else if (score < 65) status = roll < 0.35 ? 'bad' : roll < 0.7 ? 'medium' : 'good';
    else                 status = roll < 0.15 ? 'bad' : roll < 0.4 ? 'medium' : 'good';
    return { x: Math.round(x), y: Math.round(y), status, label: labels[i] };
  });
}

interface Props {
  score: number;
  businessName: string;
  city: string;
}

export function DiagnosticGeoMap({ score, businessName, city }: Props) {
  const dots = useMemo(() => generateDots(score, score * 17 + businessName.length), [score, businessName]);

  const badCount    = dots.filter(d => d.status === 'bad').length;
  const mediumCount = dots.filter(d => d.status === 'medium').length;
  const goodCount   = dots.filter(d => d.status === 'good').length;

  return (
    <div className="space-y-3">
      {/* Map SVG */}
      <div className="relative rounded-2xl overflow-hidden border border-border bg-slate-50 dark:bg-slate-900">
        {/* City label */}
        <div className="absolute top-3 left-3 z-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg px-2.5 py-1 border border-border">
          <p className="text-[10px] font-bold text-foreground">{city || 'Votre ville'}</p>
        </div>

        {/* Legend top-right */}
        <div className="absolute top-3 right-3 z-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-border space-y-0.5">
          {[
            { status: 'bad' as const,    label: 'Mauvais' },
            { status: 'medium' as const, label: 'Moyen' },
            { status: 'good' as const,   label: 'Excellent' },
          ].map(({ status, label }) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[status].fill }} />
              <span className="text-[9px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        <svg viewBox="0 0 300 300" className="w-full" style={{ maxHeight: 300 }}>
          {/* Street grid background */}
          {[60, 90, 120, 150, 180, 210, 240].map(v => (
            <g key={v} stroke="#e2e8f0" strokeWidth="0.5" opacity="0.5">
              <line x1={v} y1="0" x2={v} y2="300" />
              <line x1="0" y1={v} x2="300" y2={v} />
            </g>
          ))}

          {/* Concentric range rings */}
          {[40, 80, 120].map((r, i) => (
            <circle key={r} cx="150" cy="150" r={r}
              fill="none" stroke="#0D9488" strokeWidth="1"
              strokeDasharray="4 4" opacity={0.15 + i * 0.05} />
          ))}

          {/* Competitor dots */}
          {dots.map((d, i) => {
            const c = STATUS_COLORS[d.status];
            return (
              <g key={i}>
                <circle cx={d.x} cy={d.y} r="9" fill={c.fill} opacity="0.15" />
                <circle cx={d.x} cy={d.y} r="5.5" fill={c.fill} stroke={c.stroke} strokeWidth="1.5" />
              </g>
            );
          })}

          {/* Center: business location */}
          <circle cx="150" cy="150" r="16" fill="#0D9488" opacity="0.15" />
          <circle cx="150" cy="150" r="10" fill="#0D9488" stroke="white" strokeWidth="2" />
          {/* Pin icon */}
          <text x="150" y="154" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">📍</text>
        </svg>

        {/* Business label overlay */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground rounded-lg px-3 py-1 text-[10px] font-bold shadow-lg whitespace-nowrap">
          {businessName.length > 24 ? businessName.slice(0, 22) + '…' : businessName}
        </div>
      </div>

      {/* Legend counts */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Zones critiques', count: badCount,    color: 'text-red-600',   bg: 'bg-red-50 border-red-100' },
          { label: 'Zones moyennes',  count: mediumCount, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
          { label: 'Zones favorables',count: goodCount,   color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
        ].map(item => (
          <div key={item.label} className={`rounded-xl border px-3 py-2 text-center ${item.bg}`}>
            <p className={`text-lg font-extrabold ${item.color}`}>{item.count}</p>
            <p className="text-[9px] text-muted-foreground leading-tight">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
