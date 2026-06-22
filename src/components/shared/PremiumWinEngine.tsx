/**
 * PremiumWinEngine — Micro-animation dorée premium déclenchée sur gains financiers réels.
 *
 * Usage:
 *   const { triggerWin } = usePremiumWin();
 *   triggerWin({ type: 'coupon', amount: 47 });
 *   triggerWin({ type: 'noshowBlocked', amount: 130 });
 *
 * Design : scintillement doré subtil + toast copywriting maïeutique premium.
 * NON casino — éclat feutré, palette or mat, animation brève (1.8s).
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Coins } from 'lucide-react';

/* ── Types ────────────────────────────────────────────────────────────────── */

export type WinType = 'coupon' | 'noshowBlocked';

export interface WinEvent {
  type: WinType;
  amount: number; // euros
  label?: string; // optional override label
}

/* ── Particles ─────────────────────────────────────────────────────────────── */

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
  shape: 'circle' | 'diamond' | 'star';
}

function generateParticles(count = 24): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 6 + 3,
    delay: Math.random() * 0.6,
    duration: Math.random() * 0.8 + 1.2,
    opacity: Math.random() * 0.6 + 0.4,
    shape: (['circle', 'diamond', 'star'] as const)[Math.floor(Math.random() * 3)],
  }));
}

/* ── Golden overlay ─────────────────────────────────────────────────────────── */

function GoldenParticleOverlay({ active }: { active: boolean }) {
  const [particles] = useState(() => generateParticles(28));

  if (!active) return null;

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {/* Subtle golden radial glow from center */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.18, 0] }}
        transition={{ duration: 1.6, ease: 'easeOut' }}
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(212,175,55,0.22) 0%, transparent 70%)',
        }}
      />

      {/* Fine golden particles drifting up */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: '100%',
            width: p.size,
            height: p.size,
          }}
          initial={{ y: 0, opacity: 0, scale: 0.4 }}
          animate={{
            y: `-${60 + Math.random() * 40}vh`,
            opacity: [0, p.opacity, p.opacity * 0.6, 0],
            scale: [0.4, 1, 0.8],
            rotate: p.shape === 'diamond' ? [0, 45, 90] : [0, 180],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {p.shape === 'star' ? (
            <svg viewBox="0 0 24 24" width={p.size} height={p.size} fill="rgba(212,175,55,0.9)">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>
          ) : (
            <div
              className={p.shape === 'diamond' ? 'rotate-45' : 'rounded-full'}
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: `rgba(212,175,55,${p.opacity})`,
                boxShadow: `0 0 ${p.size}px rgba(212,175,55,0.5)`,
              }}
            />
          )}
        </motion.div>
      ))}

      {/* Top-edge golden shimmer line */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-[2px]"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: [0, 1, 1, 0], opacity: [0, 1, 0.6, 0] }}
        transition={{ duration: 1.4, ease: 'easeInOut' }}
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.9) 40%, rgba(255,215,0,1) 50%, rgba(212,175,55,0.9) 60%, transparent)',
          transformOrigin: 'center',
        }}
      />
    </div>,
    document.body
  );
}

/* ── Premium Toast ──────────────────────────────────────────────────────────── */

interface PremiumToastProps {
  event: WinEvent | null;
  onDismiss: () => void;
}

function PremiumToast({ event, onDismiss }: PremiumToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!event) return;
    timerRef.current = setTimeout(onDismiss, 4200);
    return () => clearTimeout(timerRef.current);
  }, [event, onDismiss]);

  const isCoupon = event?.type === 'coupon';

  const headline = isCoupon
    ? `Privilège client honoré.`
    : `Bouclier activé.`;

  const subline = isCoupon
    ? `Trésorerie augmentée de ${event?.amount ?? 0} €.`
    : `${event?.amount ?? 0} € de chiffre d'affaires qui restent là où ils doivent être : chez vous.`;

  const Icon = isCoupon ? Coins : ShieldCheck;
  const iconColor = isCoupon ? '#D4AF37' : '#0D9488';

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          className="fixed bottom-8 left-1/2 z-[9998] max-w-sm w-[calc(100vw-2rem)]"
          style={{ x: '-50%' }}
          initial={{ opacity: 0, y: 24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="relative overflow-hidden rounded-2xl px-5 py-4 flex items-start gap-4 cursor-pointer select-none"
            style={{
              background: 'linear-gradient(135deg, #0F1629 0%, #1a2235 100%)',
              border: '1px solid rgba(212,175,55,0.35)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.1), inset 0 1px 0 rgba(212,175,55,0.12)',
            }}
            onClick={onDismiss}
          >
            {/* Shimmer sweep */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 1.1, delay: 0.2, ease: 'easeOut' }}
              style={{
                background: 'linear-gradient(105deg, transparent 30%, rgba(212,175,55,0.08) 50%, transparent 70%)',
              }}
            />

            {/* Icon */}
            <div
              className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mt-0.5"
              style={{
                background: `${iconColor}18`,
                border: `1px solid ${iconColor}30`,
              }}
            >
              <Icon size={20} style={{ color: iconColor }} />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-bold leading-tight"
                style={{ color: '#D4AF37', fontVariantNumeric: 'tabular-nums' }}
              >
                {headline}
              </p>
              <p className="text-xs text-slate-300 mt-1 leading-snug">
                {subline}
              </p>
            </div>

            {/* Gold dot indicator */}
            <div className="shrink-0 flex flex-col items-end gap-1 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Public hook ────────────────────────────────────────────────────────────── */

let _trigger: ((event: WinEvent) => void) | null = null;

/**
 * Hook to trigger a Golden Win celebration from any component.
 * The PremiumWinProvider must be mounted in the tree (done in DashboardLayout).
 */
export function usePremiumWin() {
  const trigger = useCallback((event: WinEvent) => {
    if (_trigger) _trigger(event);
  }, []);

  return { triggerWin: trigger };
}

/* ── Provider (mount once in DashboardLayout or App) ────────────────────────── */

export function PremiumWinProvider({ children }: { children: React.ReactNode }) {
  const [activeEvent, setActiveEvent] = useState<WinEvent | null>(null);
  const [particlesActive, setParticlesActive] = useState(false);
  const particleTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleTrigger = useCallback((event: WinEvent) => {
    setActiveEvent(event);
    setParticlesActive(true);
    clearTimeout(particleTimerRef.current);
    particleTimerRef.current = setTimeout(() => setParticlesActive(false), 2000);
  }, []);

  // Register global trigger
  useEffect(() => {
    _trigger = handleTrigger;
    return () => { _trigger = null; };
  }, [handleTrigger]);

  return (
    <>
      {children}
      <GoldenParticleOverlay active={particlesActive} />
      <PremiumToast
        event={activeEvent}
        onDismiss={() => setActiveEvent(null)}
      />
    </>
  );
}

export default PremiumWinProvider;
