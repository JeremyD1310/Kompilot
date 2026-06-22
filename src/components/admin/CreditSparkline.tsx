/**
 * CreditSparkline — SVG mini bar chart for admin credit spend history.
 * Shows daily credit consumption over the last 7 days.
 */

interface Props {
  history: number[]; // 7-element array, Mon→Sun
  height?: number;
}

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export function CreditSparkline({ history, height = 48 }: Props) {
  const max = Math.max(...history, 1);
  const barWidth = 12;
  const gap = 6;
  const totalWidth = history.length * (barWidth + gap) - gap;
  const today = new Date().getDay(); // 0=Sun, 1=Mon...
  const todayIdx = today === 0 ? 6 : today - 1; // convert to Mon=0

  return (
    <div className="space-y-1.5">
      <svg
        width={totalWidth}
        height={height}
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
        style={{ maxWidth: `${totalWidth * 2}px` }}
      >
        {history.map((val, i) => {
          const barH = val === 0 ? 2 : Math.max(4, (val / max) * (height - 4));
          const x = i * (barWidth + gap);
          const y = height - barH;
          const isToday = i === todayIdx;
          const isEmpty = val === 0;

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={3}
                fill={isEmpty ? '#334155' : isToday ? '#8b5cf6' : '#4ade80'}
                opacity={isEmpty ? 0.5 : 1}
              />
              {val > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 3}
                  textAnchor="middle"
                  fontSize="7"
                  fill="#94a3b8"
                  fontWeight="600"
                >
                  {val}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Day labels */}
      <div className="flex gap-[6px] w-full" style={{ maxWidth: `${totalWidth * 2}px` }}>
        {DAY_LABELS.map((day, i) => (
          <div
            key={i}
            className={`flex-1 text-center text-[9px] font-bold ${
              i === todayIdx ? 'text-violet-400' : 'text-slate-600'
            }`}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
}
