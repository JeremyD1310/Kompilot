/**
 * previewWidgets — Sub-components for DashboardPreviewOverlay
 * AnimatedCounter hook, Sparkline chart, StarRating, KPICard, LiveFeed, BlurOverlay
 */
import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ActivityItem } from './DashboardPreviewOverlay';

// ── Animated counter hook ─────────────────────────────────────────────────────

export function useAnimatedCounter(target: number, active: boolean, durationMs = 2400): number {
  const [value, setValue] = useState(0);
  const raf = useRef<number>();

  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const p = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [active, target, durationMs]);

  return value;
}

// ── Sparkline chart ───────────────────────────────────────────────────────────

export function Sparkline({ active }: { active: boolean }) {
  const points = useMemo(() => {
    const w = 120, h = 36;
    const data = [0.1, 0.2, 0.15, 0.35, 0.3, 0.5, 0.45, 0.65, 0.7, 0.85, 0.9, 1.0];
    return data.map((v, i) => `${(i / (data.length - 1)) * w},${h - v * h * 0.85}`).join(' ');
  }, []);

  const filledPoints = active ? `0,36 ${points} 120,36` : '0,36 0,36';

  return (
    <svg width={120} height={36} viewBox="0 0 120 36" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0D9488" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#0D9488" stopOpacity={0} />
        </linearGradient>
      </defs>
      <motion.polygon
        points={filledPoints}
        fill="url(#spark-fill)"
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ duration: 1.5 }}
      />
      {active && (
        <motion.polyline
          points={points}
          fill="none"
          stroke="#0D9488"
          strokeWidth={1.8}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, ease: 'easeOut' }}
        />
      )}
    </svg>
  );
}

// ── Star rating ───────────────────────────────────────────────────────────────

export function StarRating({ rating, active }: { rating: number; active: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const partial = !filled && rating > star - 1;
        const fillPct = partial ? (rating - (star - 1)) * 100 : filled ? 100 : 0;
        return (
          <motion.span
            key={star}
            initial={{ scale: 0, opacity: 0 }}
            animate={active ? { scale: [0, 1.4, 1], opacity: [0, 1, 1] } : { scale: 0, opacity: 0 }}
            transition={{ delay: active ? (star - 1) * 0.18 : 0, duration: 0.45, ease: 'backOut' }}
            style={{ fontSize: '1.1rem', lineHeight: 1, position: 'relative', display: 'inline-block' }}
          >
            <span style={{ color: '#334155' }}>★</span>
            {active && (
              <span style={{ position: 'absolute', left: 0, top: 0, overflow: 'hidden', width: `${fillPct}%`, color: '#FBBF24' }}>★</span>
            )}
          </motion.span>
        );
      })}
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

export function KPICard({
  active, done, label, children, accentColor, glowColor,
}: {
  active: boolean; done: boolean; label: string; children: React.ReactNode;
  accentColor: string; glowColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0.15, filter: 'blur(8px) saturate(0.2)' }}
      animate={{
        opacity: active || done ? 1 : 0.15,
        filter: active || done ? 'blur(0px) saturate(1)' : 'blur(8px) saturate(0.2)',
        scale: active ? 1.02 : 1,
      }}
      transition={{ duration: 0.6 }}
      style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(10,16,32,0.99))',
        border: `1px solid ${active ? accentColor : done ? 'rgba(16,185,129,.25)' : 'rgba(255,255,255,.05)'}`,
        borderRadius: 14, padding: '14px 16px', flex: 1, minWidth: 0,
        position: 'relative', overflow: 'hidden',
        boxShadow: active ? `0 0 32px ${glowColor}` : 'none',
        transition: 'box-shadow .4s',
      }}
    >
      {active && (
        <motion.div
          style={{
            position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%',
            background: `linear-gradient(90deg, transparent, ${glowColor}, transparent)`,
            pointerEvents: 'none',
          }}
          animate={{ left: '200%' }}
          transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 0.8 }}
        />
      )}
      <p style={{ color: '#64748B', fontSize: '.66rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 0 8px' }}>
        {done ? '✓ ' : active ? '⚡ ' : ''}{label}
      </p>
      {children}
    </motion.div>
  );
}

// ── Live Activity Feed ────────────────────────────────────────────────────────

export function LiveFeed({ active, items }: { active: boolean; items: ActivityItem[] }) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    let count = 0;
    const iv = setInterval(() => {
      count += 1;
      setVisibleCount(count);
      if (count >= items.length) clearInterval(iv);
    }, 900);
    return () => clearInterval(iv);
  }, [active, items]);

  return (
    <div style={{
      background: 'rgba(15,23,42,0.9)',
      border: `1px solid ${active ? 'rgba(6,182,212,.3)' : 'rgba(255,255,255,.05)'}`,
      borderRadius: 14, padding: '12px 14px', marginTop: 10, minHeight: 90,
      boxShadow: active ? '0 0 24px rgba(6,182,212,.08)' : 'none', transition: 'all .4s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: active ? '#10B981' : '#334155',
          boxShadow: active ? '0 0 8px #10B981' : 'none', transition: 'all .4s',
          animation: active ? 'livePulse 1.4s ease-in-out infinite' : 'none',
        }} />
        <span style={{ color: active ? '#6EE7B7' : '#334155', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', transition: 'color .4s' }}>
          Live Activity
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {active && items.slice(0, visibleCount).map((item, i) => (
          <motion.div
            key={i} initial={{ opacity: 0, x: -10, y: 4 }} animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}
          >
            <span style={{ fontSize: '.85rem', flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#CBD5E1', fontSize: '.72rem', fontWeight: 500, margin: 0, lineHeight: 1.4 }}>{item.text}</p>
              <p style={{ color: '#475569', fontSize: '.62rem', margin: '1px 0 0' }}>{item.time}</p>
            </div>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.color, flexShrink: 0, marginTop: 4 }} />
          </motion.div>
        ))}
        {!active && <span style={{ color: '#475569', fontSize: '.7rem', fontStyle: 'italic', opacity: 0.4 }}>Collecte des données en cours…</span>}
        {active && visibleCount < items.length && (
          <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity }} style={{ color: '#475569', fontSize: '.65rem', fontStyle: 'italic' }}>
            ⏳ Collecte en cours…
          </motion.span>
        )}
      </div>
    </div>
  );
}

// ── Blur overlay ──────────────────────────────────────────────────────────────

export function BlurOverlay({ blurLevel, progress }: { blurLevel: number; progress: number }) {
  return (
    <motion.div
      style={{
        position: 'absolute', inset: 0, zIndex: 10, borderRadius: 18,
        backdropFilter: `blur(${blurLevel}px) saturate(0.6) brightness(0.55)`,
        WebkitBackdropFilter: `blur(${blurLevel}px) saturate(0.6) brightness(0.55)`,
        background: 'rgba(8,14,28,0.45)', pointerEvents: 'none',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 12, padding: 24, transition: 'backdrop-filter .8s, background .8s',
      }}
    >
      <motion.div style={{ textAlign: 'center' }} animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(6,182,212,.12)', border: '1px solid rgba(6,182,212,.3)',
          borderRadius: 20, padding: '6px 16px', marginBottom: 6,
        }}>
          <span style={{ color: '#06B6D4', fontSize: '.75rem', fontWeight: 700 }}>⚡ Analyse en cours</span>
          <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }} style={{ color: '#06B6D4', fontSize: '.75rem' }}>…</motion.span>
        </div>
        <p style={{ color: '#94A3B8', fontSize: '.72rem', margin: 0, lineHeight: 1.5 }}>Génération de votre espace personnalisé</p>
      </motion.div>
      <svg width={56} height={56} viewBox="0 0 56 56">
        <circle cx={28} cy={28} r={22} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={3} />
        <circle
          cx={28} cy={28} r={22} fill="none" stroke="#06B6D4" strokeWidth={3}
          strokeLinecap="round" strokeDasharray={138.2}
          strokeDashoffset={138.2 * (1 - progress)}
          transform="rotate(-90 28 28)"
          style={{ transition: 'stroke-dashoffset .6s ease' }}
        />
        <text x={28} y={33} textAnchor="middle" fill="#E2E8F0" fontSize={11} fontWeight={700}>
          {Math.round(progress * 100)}%
        </text>
      </svg>
    </motion.div>
  );
}
