import { motion } from 'framer-motion';

// ── Waveform visualizer ───────────────────────────────────────────────────────

export function AudioWaveform({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center justify-center gap-0.5 h-8">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-0.5 rounded-full bg-teal-500"
          animate={isActive ? {
            height: [4, Math.random() * 24 + 8, 4],
            opacity: [0.4, 1, 0.4],
          } : { height: 4, opacity: 0.3 }}
          transition={{
            duration: 0.6 + Math.random() * 0.4,
            repeat: Infinity,
            delay: i * 0.05,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ── Timer display ─────────────────────────────────────────────────────────────

export function RecordingTimer({ seconds, maxSeconds = 60 }: { seconds: number; maxSeconds?: number }) {
  const pct = (seconds / maxSeconds) * 100;
  const isWarning = seconds >= maxSeconds * 0.8;

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <span className={`text-2xl font-mono font-bold tabular-nums ${isWarning ? 'text-amber-500' : 'text-teal-600'}`}>
        {fmt(seconds)}
      </span>
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${isWarning ? 'bg-amber-400' : 'bg-teal-500'}`}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <p className="text-[11px] text-muted-foreground">{maxSeconds - seconds}s restantes</p>
    </div>
  );
}
