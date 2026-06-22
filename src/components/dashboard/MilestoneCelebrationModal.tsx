/**
 * MilestoneCelebrationModal
 *
 * Full-screen celebration overlay triggered when the user crosses a major
 * Google Business milestone (Top 1, Top 3, 100+ reviews, 4.5+ rating).
 *
 * Features:
 *  - Animated confetti burst
 *  - Large emoji + title + motivational body
 *  - CTA button to navigate to the dashboard / google-maps
 *  - Auto-dismisses after 8s; manual close button
 *  - Each milestone fires ONCE per user session (localStorage dedup)
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, MapPin, Star, ArrowRight } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import type { LocalVisibilityData } from '../gmaps/LocalVisibilityWidget';

// ── Storage key ───────────────────────────────────────────────────────────────

const CELEBRATED_KEY = 'kompilot_celebrated_milestones_v1';

function getCelebrated(): Set<string> {
  try {
    const raw = localStorage.getItem(CELEBRATED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function markCelebrated(id: string) {
  try {
    const set = getCelebrated();
    set.add(id);
    localStorage.setItem(CELEBRATED_KEY, JSON.stringify([...set]));
  } catch { /* noop */ }
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface MilestoneEvent {
  id: string;
  emoji: string;
  badge: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  color: 'gold' | 'emerald' | 'amber';
}

// ── Milestone definitions ─────────────────────────────────────────────────────

function detectMilestone(data: LocalVisibilityData): MilestoneEvent | null {
  const celebrated = getCelebrated();

  if (!celebrated.has('rank_top1') && data.currentRank === 1) {
    return {
      id: 'rank_top1',
      emoji: '🥇',
      badge: 'N°1 DANS VOTRE ZONE',
      title: 'Vous êtes numéro 1 !',
      body: `Félicitations ! 🎉 Grâce à vos optimisations avec Kompilot, votre fiche Google vient d'atteindre la 1ère position sur "${data.primaryKeyword}". Un exploit que seulement les meilleurs commerces locaux atteignent !`,
      cta: 'Voir ma fiche Google',
      href: '/google-maps',
      color: 'gold',
    };
  }

  if (!celebrated.has('rank_top3') && data.currentRank <= 3 && data.currentRank > 1) {
    return {
      id: 'rank_top3',
      emoji: '🏆',
      badge: `TOP ${data.currentRank} LOCAL`,
      title: `Entrée dans le Top ${data.currentRank} ! `,
      body: `Félicitations ! Votre fiche a franchi un cap majeur : vous êtes désormais en ${data.currentRank}ème position sur "${data.primaryKeyword}" dans votre zone. Continuez à optimiser pour atteindre la 1ère place !`,
      cta: 'Voir mon tableau de bord',
      href: '/google-maps',
      color: 'emerald',
    };
  }

  if (!celebrated.has('reviews_100') && data.currentReviews >= 100) {
    return {
      id: 'reviews_100',
      emoji: '🎉',
      badge: '100 AVIS FRANCHIS',
      title: 'Cap des 100 avis dépassé !',
      body: `Incroyable ! Votre fiche compte désormais ${data.currentReviews} avis Google — dont ${data.copilotReplied} traités automatiquement par votre Copilote IA. Ce volume d'avis booste significativement votre référencement local.`,
      cta: 'Voir mes avis',
      href: '/google-maps',
      color: 'amber',
    };
  }

  if (!celebrated.has('rating_45') && data.avgRating >= 4.5) {
    return {
      id: 'rating_45',
      emoji: '⭐',
      badge: `NOTE ${data.avgRating}/5`,
      title: `Note moyenne ${data.avgRating}/5 atteinte !`,
      body: `Votre excellence de service est reconnue par Google. Une note de ${data.avgRating}/5 place votre établissement parmi les références de votre secteur et améliore directement votre visibilité dans le Pack Local.`,
      cta: 'Voir ma note',
      href: '/google-maps',
      color: 'amber',
    };
  }

  return null;
}

// ── Confetti particle ─────────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
  '#ec4899', '#ef4444', '#06b6d4', '#84cc16',
];

function ConfettiParticle({ i }: { i: number }) {
  const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
  const x = (Math.sin(i * 137.5) * 0.5 + 0.5) * 100; // deterministic spread
  const delay = (i * 40) % 600;
  const duration = 1200 + (i * 83) % 800;
  const size = 6 + (i * 7) % 8;

  return (
    <motion.div
      key={i}
      initial={{ opacity: 1, y: -20, x: `${x}vw`, rotate: 0, scale: 1 }}
      animate={{ opacity: 0, y: '110vh', x: `${x + (Math.cos(i) * 10)}vw`, rotate: 720, scale: 0.5 }}
      transition={{ duration: duration / 1000, delay: delay / 1000, ease: 'easeIn' }}
      className="fixed top-0 pointer-events-none z-[600]"
      style={{ width: size, height: size, backgroundColor: color, borderRadius: i % 3 === 0 ? '50%' : 2 }}
    />
  );
}

// ── Color palettes ────────────────────────────────────────────────────────────

const PALETTE = {
  // Gold: slate card bg + elegant golden border (not yellow bg)
  gold: {
    bg: 'bg-card dark:bg-card',
    border: 'border-amber-400/60 dark:border-amber-500/40',
    badge: 'bg-amber-500 text-white',
    icon: 'bg-amber-100/80 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    cta: 'bg-amber-500 hover:bg-amber-600 text-white',
    ring: 'ring-amber-400/20',
  },
  emerald: {
    bg: 'bg-card dark:bg-card',
    border: 'border-emerald-400/60 dark:border-emerald-500/40',
    badge: 'bg-emerald-500 text-white',
    icon: 'bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    cta: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    ring: 'ring-emerald-400/20',
  },
  amber: {
    bg: 'bg-card dark:bg-card',
    border: 'border-orange-400/60 dark:border-orange-500/40',
    badge: 'bg-orange-500 text-white',
    icon: 'bg-orange-100/80 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    cta: 'bg-orange-500 hover:bg-orange-600 text-white',
    ring: 'ring-orange-400/20',
  },
};

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  data: LocalVisibilityData;
  className?: string;
}

export function MilestoneCelebrationModal({ data }: Props) {
  const navigate = useNavigate();
  const [milestone, setMilestone] = useState<MilestoneEvent | null>(null);
  const [show, setShow] = useState(false);

  // Detect milestone on data mount (with 2s delay to avoid immediate popup)
  useEffect(() => {
    const timer = setTimeout(() => {
      const detected = detectMilestone(data);
      if (detected) {
        setMilestone(detected);
        setShow(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dismiss after 8s
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => setShow(false), 8000);
    return () => clearTimeout(timer);
  }, [show]);

  const handleClose = useCallback(() => {
    setShow(false);
  }, []);

  const handleCTA = useCallback(() => {
    if (!milestone) return;
    markCelebrated(milestone.id);
    setShow(false);
    navigate({ to: milestone.href as any });
  }, [milestone, navigate]);

  const handleDismiss = useCallback(() => {
    if (milestone) markCelebrated(milestone.id);
    setShow(false);
  }, [milestone]);

  const palette = PALETTE[milestone?.color ?? 'emerald'];

  return (
    <>
      {/* Confetti burst */}
      <AnimatePresence>
        {show && Array.from({ length: 30 }).map((_, i) => (
          <ConfettiParticle key={i} i={i} />
        ))}
      </AnimatePresence>

      {/* Backdrop + modal */}
      <AnimatePresence>
        {show && milestone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[550] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={handleDismiss}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              onClick={e => e.stopPropagation()}
              className={cn(
                'relative w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden',
                `ring-2 ${palette.ring}`,
                palette.bg,
                palette.border,
              )}
            >
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 z-10 p-2 rounded-xl text-muted-foreground hover:bg-black/10 transition-colors"
                aria-label="Fermer"
              >
                <X size={16} />
              </button>

              <div className="p-8 flex flex-col items-center text-center gap-5">
                {/* Emoji */}
                <motion.div
                  animate={{ scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-6xl leading-none select-none"
                >
                  {milestone.emoji}
                </motion.div>

                {/* Badge */}
                <span className={cn(
                  'text-[11px] font-extrabold tracking-widest px-3 py-1 rounded-full uppercase',
                  palette.badge,
                )}>
                  {milestone.badge}
                </span>

                {/* Title */}
                <h2 className="text-2xl font-extrabold text-foreground leading-tight">
                  {milestone.title}
                </h2>

                {/* Body */}
                <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                  {milestone.body}
                </p>

                {/* Stats row */}
                <div className="flex items-center gap-4 w-full">
                  <div className="flex-1 rounded-2xl border border-border bg-card/70 px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <MapPin size={12} className="text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Position</span>
                    </div>
                    <p className="text-2xl font-extrabold text-foreground">{data.currentRank}<sup className="text-sm font-bold">ème</sup></p>
                  </div>
                  <div className="flex-1 rounded-2xl border border-border bg-card/70 px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star size={12} className="text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Avis</span>
                    </div>
                    <p className="text-2xl font-extrabold text-foreground">{data.currentReviews}</p>
                  </div>
                  <div className="flex-1 rounded-2xl border border-border bg-card/70 px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Trophy size={12} className="text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Note</span>
                    </div>
                    <p className="text-2xl font-extrabold text-foreground">{data.avgRating}<span className="text-sm font-bold">/5</span></p>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={handleCTA}
                  className={cn(
                    'flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]',
                    palette.cta,
                  )}
                >
                  {milestone.cta}
                  <ArrowRight size={15} />
                </button>

                {/* Dismiss link */}
                <button
                  onClick={handleDismiss}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
