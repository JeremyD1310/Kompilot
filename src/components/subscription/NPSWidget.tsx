/**
 * NPSWidget — Micro-NPS in-app affiché à J+7 post-inscription.
 *
 * Score ≥ 8 → propose un lien avis Google/Trustpilot pré-rempli
 * Score ≤ 6 → ouvre le chat de support directement
 * Score 7   → remerciement simple
 *
 * Affiché une seule fois (persisted in localStorage).
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Heart, MessageCircle, ExternalLink } from 'lucide-react';
import { Button } from '@blinkdotnew/ui';
import { useAuth } from '../../hooks/useAuth';

/* ── Storage ─────────────────────────────────────────────────── */
const NPS_KEY = 'kompilot_nps_v1';

function shouldShowNPS(createdAt: Date | null): boolean {
  if (!createdAt) return false;
  const daysSince = (Date.now() - createdAt.getTime()) / 86400000;
  return daysSince >= 7;
}

function isAlreadyDone(): boolean {
  try { return !!localStorage.getItem(NPS_KEY); } catch { return true; }
}

function markDone(score: number) {
  try { localStorage.setItem(NPS_KEY, JSON.stringify({ score, ts: Date.now() })); } catch { /* noop */ }
}

/* ── Component ─────────────────────────────────────────────────── */
export function NPSWidget() {
  const { user } = useAuth();
  const [show,    setShow]    = useState(false);
  const [score,   setScore]   = useState<number | null>(null);
  const [phase,   setPhase]   = useState<'rating' | 'promoter' | 'detractor' | 'neutral' | 'done'>('rating');

  useEffect(() => {
    if (!user || isAlreadyDone()) return;
    const createdAt = user.createdAt ? new Date(user.createdAt) : null;
    if (shouldShowNPS(createdAt)) {
      // Delay 30s after page load to avoid jarring UX
      const t = setTimeout(() => setShow(true), 30000);
      return () => clearTimeout(t);
    }
  }, [user]);

  const handleScore = (n: number) => {
    setScore(n);
    markDone(n);
    if (n >= 8)      setPhase('promoter');
    else if (n <= 6) setPhase('detractor');
    else             setPhase('neutral');
  };

  const handleClose = () => {
    if (score === null) markDone(-1);
    setShow(false);
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[800] w-[360px] max-w-[calc(100vw-32px)]"
      >
        <div className="rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 shadow-2xl shadow-black/20 overflow-hidden">

          {/* Close */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                30 secondes de votre avis
              </span>
            </div>
            <button onClick={handleClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          <div className="p-4">
            <AnimatePresence mode="wait">

              {/* ── Phase 1 : Notation ─────────────────────────────── */}
              {phase === 'rating' && (
                <motion.div key="rating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Recommanderiez-vous Kompilot à un collègue commerçant ?
                    </p>
                    <p className="text-xs text-slate-500 mt-1">1 = Pas du tout · 10 = Absolument</p>
                  </div>
                  <div className="grid grid-cols-10 gap-1">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                      <button
                        key={n}
                        onClick={() => handleScore(n)}
                        className={`h-8 rounded-lg text-xs font-bold transition-all hover:scale-105 ${
                          n <= 6
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100'
                            : n <= 8
                            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 hover:bg-amber-100'
                            : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── Phase 2 : Promoteur (≥8) ──────────────────────── */}
              {phase === 'promoter' && (
                <motion.div key="promoter" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-500 fill-pink-500 shrink-0" />
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Merci, vous nous faites chaud au cœur !</p>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Votre avis aide les autres commerçants à découvrir Kompilot. 2 minutes pour partager votre expérience ?
                  </p>
                  <div className="flex gap-2">
                    <a
                      href="https://g.page/r/kompilot/review"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button size="sm" className="w-full h-9 gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-white" /> Avis Google
                        <ExternalLink className="w-3 h-3 ml-auto" />
                      </Button>
                    </a>
                    <Button size="sm" variant="outline" className="h-9 text-xs" onClick={handleClose}>
                      Plus tard
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ── Phase 3 : Détracteur (≤6) ─────────────────────── */}
              {phase === 'detractor' && (
                <motion.div key="detractor" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-teal-500 shrink-0" />
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Merci pour votre honnêteté.</p>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Nous voulons vraiment améliorer votre expérience. Un conseiller peut vous rappeler dans l'heure si vous souhaitez.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 h-9 gap-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold"
                      onClick={() => {
                        // Open support chat
                        const chatBtn = document.querySelector<HTMLElement>('[data-chat-open]');
                        chatBtn?.click();
                        handleClose();
                      }}
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Parler au support
                    </Button>
                    <Button size="sm" variant="outline" className="h-9 text-xs" onClick={handleClose}>
                      Non merci
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ── Phase 4 : Neutre (7) ────────────────────────── */}
              {phase === 'neutral' && (
                <motion.div key="neutral" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Merci pour votre retour !</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Nous travaillons en permanence à améliorer Kompilot. Revenez dans quelques semaines !
                  </p>
                  <Button size="sm" onClick={handleClose} className="w-full h-9 text-xs">
                    Parfait, continuons !
                  </Button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
