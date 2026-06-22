import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ScoreGaugeProps {
  score: number; // 0-100
  size?: number;
}

export function ScoreGauge({ score, size = 140 }: ScoreGaugeProps) {
  const [displayed, setDisplayed] = useState(0);

  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayed / 100) * circumference;

  useEffect(() => {
    const timeout = setTimeout(() => setDisplayed(score), 400);
    return () => clearTimeout(timeout);
  }, [score]);

  const color =
    score < 40 ? '#f87171' : score < 65 ? '#fbbf24' : '#0D9488';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Track */}
      <svg
        width={size}
        height={size}
        className="absolute inset-0 -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1e2d42"
          strokeWidth={10}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.4, ease: [0.34, 1.56, 0.64, 1], delay: 0.4 }}
          style={{ filter: `drop-shadow(0 0 8px ${color}60)` }}
        />
      </svg>

      {/* Center label */}
      <div className="relative flex flex-col items-center leading-none">
        <motion.span
          className="text-3xl font-black tabular-nums"
          style={{ color }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 300, damping: 20 }}
        >
          {score}%
        </motion.span>
        <span className="text-[10px] font-semibold text-[#64748b] mt-1 uppercase tracking-wider">
          Visibilité IA
        </span>
      </div>
    </div>
  );
}
