/**
 * DemoBanner — sticky top bar shown to demo/trial users.
 *
 * TWO DISTINCT MODES (strictly separated):
 *  1. Mode Démo Sandbox  (anonymous visitor, isDemoActive)  → session-scoped, resets on reload
 *  2. Mode Essai 14 jours (authenticated user, isTrialActive) → countdown from user.created_at
 *
 * Shows low-credit warning when < 20% AI credits remain.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, Rocket, Clock, MonitorPlay } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useDemoMode } from '../../context/DemoModeContext';
import { useCredits } from '../../context/CreditsContext';
import { useAuth } from '../../hooks/useAuth';

const DISMISS_KEY = 'kompilot_demo_banner_dismissed';

interface DemoBannerProps {
  /** Optional callback to open the premium TrialEndModal from outside */
  onUpgradeClick?: () => void;
}

export function DemoBanner({ onUpgradeClick }: DemoBannerProps = {}) {
  const navigate = useNavigate();
  const { isDemoActive, demoCreditTotal, deactivateDemo } = useDemoMode();
  const { credits, limit } = useCredits();
  const { user } = useAuth();

  // Strict separation: authenticated user = real trial, anonymous = demo sandbox
  const isAuthenticatedUser = !!user;

  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });

  if (!isDemoActive) return null;

  // Trial days for authenticated users: computed from user.created_at (DB source of truth)
  const trialDaysLeft = (() => {
    if (!isAuthenticatedUser) return null;
    const dbDate = (user as any)?.createdAt ?? (user as any)?.created_at;
    if (!dbDate) return null;
    const start = new Date(dbDate);
    const elapsed = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, 14 - elapsed);
  })();

  const handleExitDemo = () => {
    deactivateDemo();
    navigate({ to: '/' });
  };

  // When dismissed: show only a compact pill
  if (dismissed) {
    return (
      <div className="shrink-0 flex items-center justify-center gap-2 px-4 py-1 bg-emerald-500/10 border-b border-emerald-400/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <span className="text-[10px] font-bold text-emerald-700">
          {isAuthenticatedUser
            ? `Mode Essai Gratuit · ${trialDaysLeft ?? '–'}j restants · `
            : 'Mode Démo Sandbox · Données fictives · '}
          <button onClick={() => setDismissed(false)} className="underline hover:no-underline">
            {isAuthenticatedUser ? 'Upgrader' : 'Quitter la démo'}
          </button>
        </span>
      </div>
    );
  }

  const creditsNum = typeof credits === 'number' ? credits : limit;
  const creditsPercent = (creditsNum / demoCreditTotal) * 100;
  const isLowCredits = creditsPercent <= 20;

  const handleDismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* noop */ }
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="overflow-hidden shrink-0"
        >
          <div
            className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm ${
              isLowCredits
                ? 'bg-orange-500 text-white'
                : isAuthenticatedUser
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-500 text-white'
                  : 'bg-gradient-to-r from-violet-700 to-indigo-600 text-white'
            }`}
          >
            {/* Left: icon + message */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              {isLowCredits ? (
                <Zap size={15} className="shrink-0 animate-pulse" />
              ) : isAuthenticatedUser ? (
                <Clock size={15} className="shrink-0" />
              ) : (
                <MonitorPlay size={15} className="shrink-0" />
              )}

              {isLowCredits ? (
                <span className="text-xs font-semibold leading-tight">
                  <strong>⚡ Votre Copilote IA a travaillé dur !</strong>{' '}
                  <span className="hidden sm:inline">
                    Il ne vous reste plus que{' '}
                    <strong>{creditsNum} crédit{creditsNum !== 1 ? 's' : ''}</strong>.
                    Passez à l'offre complète pour continuer.
                  </span>
                </span>
              ) : isAuthenticatedUser ? (
                // ── AUTHENTICATED: Real 14-day trial countdown from DB ──
                <span className="text-xs font-semibold leading-tight">
                  <span className="hidden sm:inline">
                    🚀 <strong>Mode Essai Gratuit 14 jours</strong> — Il vous reste{' '}
                  </span>
                  <span className="sm:hidden">Essai · </span>
                  <strong className="inline-flex items-center gap-1">
                    <Clock size={12} />
                    {trialDaysLeft !== null ? `${trialDaysLeft} jour${trialDaysLeft !== 1 ? 's' : ''}` : '14 jours'}
                  </strong>
                  <span className="hidden sm:inline"> · Toutes vos vraies données sont sauvegardées.</span>
                </span>
              ) : (
                // ── ANONYMOUS: Demo Sandbox — no fake trial countdown ──
                <span className="text-xs font-semibold leading-tight">
                  <strong>🎮 Mode Démo Sandbox</strong>
                  <span className="hidden sm:inline">
                    {' '}— Données fictives, réinitialisées à chaque visite. Aucune donnée réelle n'est utilisée.
                  </span>
                </span>
              )}
            </div>

            {/* CTA + dismiss */}
            <div className="flex items-center gap-2 shrink-0">
              {isAuthenticatedUser ? (
                // Trial user CTA: upgrade
                onUpgradeClick ? (
                  <button
                    onClick={onUpgradeClick}
                    className={`flex items-center gap-1.5 rounded-full text-xs font-bold px-3 py-1.5 transition-all active:scale-[0.97] shadow-sm ${
                      isLowCredits
                        ? 'bg-white text-orange-600 hover:bg-orange-50'
                        : 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
                    }`}
                  >
                    {isLowCredits ? '🚀 Garder mes accès' : 'Passer à l\'offre complète'}
                  </button>
                ) : (
                  <Link
                    to="/subscription"
                    className="flex items-center gap-1.5 rounded-full text-xs font-bold px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-all shadow-sm"
                  >
                    Activer mon plan
                  </Link>
                )
              ) : (
                // Anonymous demo CTA: exit demo
                <button
                  onClick={handleExitDemo}
                  className="flex items-center gap-1.5 rounded-full text-xs font-bold px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-all shadow-sm"
                >
                  Créer mon compte →
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Masquer"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          {/* Low credits progress bar */}
          {isLowCredits && (
            <div className="h-0.5 bg-orange-600">
              <div
                className="h-full bg-white/60 transition-all duration-500"
                style={{ width: `${creditsPercent}%` }}
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
