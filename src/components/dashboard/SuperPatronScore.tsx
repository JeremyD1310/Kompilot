/**
 * SuperPatronScore — Gamified local power level bar
 *
 * Score increases per action:
 * +5  when user validates monthly calendar
 * +10 when user uses a TikTok video script
 * +20 when GEO score goes green
 *
 * Persisted to localStorage('kompilot_super_patron_score')
 * Max score: 100 (level: "Légende Locale ⚡")
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@blinkdotnew/ui';

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'kompilot_super_patron_score';
const MAX_SCORE = 100;

// ── Helpers (exported) ────────────────────────────────────────────────────────

export function addSuperPatronPoints(amount: number): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const current = raw ? Math.min(parseInt(raw, 10) || 0, MAX_SCORE) : 0;
    const next = Math.min(current + amount, MAX_SCORE);
    localStorage.setItem(STORAGE_KEY, String(next));
    // Dispatch a custom event so any mounted hook re-reads
    window.dispatchEvent(new CustomEvent('superpatron:update', { detail: { score: next } }));
    return next;
  } catch {
    return 0;
  }
}

export function useSuperPatronScore() {
  const [score, setScore] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? Math.min(parseInt(raw, 10) || 0, MAX_SCORE) : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ score: number }>).detail;
      setScore(detail.score);
    };
    window.addEventListener('superpatron:update', handler);
    return () => window.removeEventListener('superpatron:update', handler);
  }, []);

  return score;
}

// ── Level label ───────────────────────────────────────────────────────────────

function getLevel(score: number): string {
  if (score >= 100) return '⚡ Légende Locale';
  if (score >= 80)  return '🔥 Super Patron Local';
  if (score >= 60)  return '🏆 Champion du Quartier';
  if (score >= 40)  return '🏅 Expert Local';
  if (score >= 20)  return '🌟 Commerçant Actif';
  return '⭐ Débutant Local';
}

// ── Confetti burst (CSS-only, no external dep) ────────────────────────────────

function ConfettiBurst() {
  const particles = Array.from({ length: 10 }, (_, i) => i);
  const colors = ['#14b8a6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899'];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {particles.map(i => (
        <motion.div
          key={i}
          className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
          style={{ backgroundColor: colors[i % colors.length] }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: (Math.cos((i / particles.length) * Math.PI * 2) * 80) + (Math.random() * 40 - 20),
            y: (Math.sin((i / particles.length) * Math.PI * 2) * 60) + (Math.random() * 30 - 15),
            opacity: 0,
            scale: 0.3,
          }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: i * 0.04 }}
        />
      ))}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface SuperPatronScoreProps {
  className?: string;
  recentGain?: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SuperPatronScore({ className, recentGain }: SuperPatronScoreProps) {
  const score = useSuperPatronScore();
  const [showConfetti, setShowConfetti] = useState(false);

  // Fire confetti + toast on recentGain
  const triggerGain = useCallback((gain: number) => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1000);
    toast.success(`+${gain} points ! 🏆`, {
      description: 'Votre commerce est plus visible que 80% des concurrents de votre quartier !',
    });
  }, []);

  useEffect(() => {
    if (recentGain && recentGain > 0) {
      triggerGain(recentGain);
    }
  }, [recentGain, triggerGain]);

  const pct = Math.min((score / MAX_SCORE) * 100, 100);
  const level = getLevel(score);

  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl border border-primary/20',
        'bg-gradient-to-br from-teal-500/8 via-background to-violet-500/8',
        'px-5 py-4 shadow-sm',
        className ?? '',
      ].join(' ')}
    >
      {/* Glow blobs */}
      <div className="pointer-events-none absolute -top-6 -right-6 w-28 h-28 rounded-full bg-teal-400/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-violet-400/15 blur-xl" />

      {/* Confetti */}
      <AnimatePresence>{showConfetti && <ConfettiBurst />}</AnimatePresence>

      {/* Title row */}
      <div className="relative flex items-center justify-between gap-3 mb-3">
        <span className="text-sm font-extrabold text-foreground leading-tight">
          Votre Niveau de Puissance Locale ⚡
        </span>
        <motion.span
          key={score}
          initial={{ scale: 1.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          className="shrink-0 text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-violet-500 rounded-full px-3 py-1 shadow-sm"
        >
          {score} pts
        </motion.span>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, #14b8a6 0%, #8b5cf6 100%)',
          }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
        />
        {/* Shine overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full pointer-events-none" />
      </div>

      {/* Level label */}
      <div className="relative mt-2 flex items-center justify-between">
        <motion.span
          key={level}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-xs font-bold text-muted-foreground"
        >
          {level}
        </motion.span>
        <span className="text-[10px] text-muted-foreground/60 font-medium">
          {score}/{MAX_SCORE}
        </span>
      </div>
    </div>
  );
}
