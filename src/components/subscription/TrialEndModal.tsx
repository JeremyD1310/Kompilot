/**
 * TrialEndModal — Premium "end-of-trial" paywall.
 *
 * Design: dark #1E293B bg, emerald #10B981 accents.
 * Instead of a generic pricing grid, shows a personalised VALUE RECAP:
 *   "En {N} jours, votre Kompilot a travaillé pour vous :"
 *   – posts generated, reviews answered, leads captured
 * Then a single CTA: "Activer mon Copilote — 59€/mois"
 * Opens Stripe Checkout in a new tab (pre-filled with user data).
 * On payment confirmed: emerald confetti + instant Pro status, no logout.
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Zap, FileText, Star, Users, ArrowRight,
  CheckCircle2, Lock, Rocket, ExternalLink,
} from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import { useDemoMode } from '../../context/DemoModeContext';
import { useEstablishment } from '../../context/EstablishmentContext';
import { useAuth } from '../../hooks/useAuth';
import { useTrialMetrics } from '../../hooks/useTrialMetrics';
import { launchConfetti } from '../../lib/confetti';

// ── Emerald-only confetti ──────────────────────────────────────────────────────
function launchEmeraldConfetti() {
  const EMERALD = ['#10B981', '#34D399', '#6EE7B7', '#064E3B', '#059669', '#A7F3D0'];
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99999;';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;
  const particles = Array.from({ length: 180 }, () => ({
    x: Math.random() * canvas.width,
    y: -10 - Math.random() * 120,
    vx: (Math.random() - 0.5) * 6,
    vy: Math.random() * 4 + 3,
    w: Math.random() * 14 + 6,
    h: Math.random() * 5 + 3,
    color: EMERALD[Math.floor(Math.random() * EMERALD.length)],
    angle: Math.random() * Math.PI * 2,
    angularV: (Math.random() - 0.5) * 0.2,
    opacity: 1,
  }));
  let frame = 0;
  function draw() {
    if (frame > 260) { canvas.remove(); return; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      p.vy += 0.13;
      p.x += p.vx + Math.sin(frame * 0.04 + p.y * 0.008) * 0.4;
      p.y += p.vy;
      p.angle += p.angularV;
      if (frame > 160) p.opacity = Math.max(0, p.opacity - 0.016);
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    frame++;
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}

// ── Animated counting number ───────────────────────────────────────────────────
function AnimatedCount({ target, delay = 0 }: { target: number; delay?: number }) {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (startedRef.current) return;
      startedRef.current = true;
      let current = 0;
      const step = Math.max(1, Math.ceil(target / 40));
      const id = setInterval(() => {
        current = Math.min(current + step, target);
        setValue(current);
        if (current >= target) clearInterval(id);
      }, 35);
    }, delay);
    return () => clearTimeout(t);
  }, [target, delay]);

  return <span className="tabular-nums">{value}</span>;
}

// ── Metric card ────────────────────────────────────────────────────────────────
function MetricCard({
  icon: Icon,
  value,
  label,
  sublabel,
  color,
  delay,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  sublabel: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start gap-3 rounded-2xl bg-white/5 border border-white/8 px-4 py-3.5"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-black text-white leading-none">
          <AnimatedCount target={value} delay={delay * 1000} />
        </p>
        <p className="text-[13px] font-semibold text-slate-200 mt-0.5 leading-snug">{label}</p>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{sublabel}</p>
      </div>
      <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-1" />
    </motion.div>
  );
}

// ── Stripe URL builder ────────────────────────────────────────────────────────
// Replace STRIPE_PAYMENT_LINK with your real Stripe Payment Link.
// Pre-fills email and client_reference_id for easy reconciliation.
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/test_kompilot_pro'; // ← replace

function buildStripeUrl(email: string, clientId: string, estName: string): string {
  try {
    const base = STRIPE_PAYMENT_LINK;
    const params = new URLSearchParams({
      prefilled_email: email,
      client_reference_id: clientId,
      // Stripe Payment Links accept these query params
    });
    return `${base}?${params.toString()}`;
  } catch {
    return STRIPE_PAYMENT_LINK;
  }
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface TrialEndModalProps {
  open: boolean;
  onClose: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────
export function TrialEndModal({ open, onClose }: TrialEndModalProps) {
  const { setPlan } = useSubscription();
  const { deactivateDemo, demoTrialDaysRemaining } = useDemoMode();
  const { activeEstablishment } = useEstablishment();
  const { user } = useAuth();
  const metrics = useTrialMetrics();

  // Screen: 'bilan' | 'processing' | 'success'
  const [screen, setScreen] = useState<'bilan' | 'processing' | 'success'>('bilan');
  const [stripeOpened, setStripeOpened] = useState(false);

  // Reset screen when re-opened
  useEffect(() => {
    if (open) { setScreen('bilan'); setStripeOpened(false); }
  }, [open]);

  const city = activeEstablishment?.city || 'votre ville';
  const estName = activeEstablishment?.name || 'votre établissement';
  const daysUsed = metrics.daysActive;

  // How many days since start (minimum 3, max 14)
  const daysClamped = Math.min(14, Math.max(3, daysUsed));

  const handleStripeClick = () => {
    const email = user?.email ?? '';
    const clientId = user?.id ?? 'guest';
    const url = buildStripeUrl(email, clientId, estName);
    window.open(url, '_blank', 'noopener,noreferrer');
    setStripeOpened(true);
  };

  const handleConfirmPayment = () => {
    setScreen('processing');
    // Simulate payment confirmation (replace with real webhook / polling in production)
    setTimeout(() => {
      setPlan('pro');
      deactivateDemo();
      setScreen('success');
      launchEmeraldConfetti();
    }, 1800);
  };

  const handleClose = () => {
    if (screen === 'success') {
      // Brief delay so user sees success, then close
      setTimeout(onClose, 400);
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[700] bg-black/80 backdrop-blur-md"
            onClick={screen !== 'processing' ? handleClose : undefined}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="fixed inset-0 z-[701] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-[500px] rounded-3xl overflow-hidden shadow-2xl shadow-black/60"
              style={{ background: '#1E293B' }}
              onClick={e => e.stopPropagation()}
            >
              <AnimatePresence mode="wait">

                {/* ── BILAN screen ── */}
                {screen === 'bilan' && (
                  <motion.div
                    key="bilan"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                  >
                    {/* Header */}
                    <div className="relative px-6 pt-7 pb-5 border-b border-white/8">
                      {/* Close */}
                      <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        aria-label="Fermer"
                      >
                        <X size={15} className="text-slate-300" />
                      </button>

                      {/* Lock badge */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                          <Lock size={14} className="text-emerald-400" />
                        </div>
                        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">
                          Essai gratuit terminé
                        </span>
                      </div>

                      <h2 className="text-2xl font-black text-white leading-tight">
                        En{' '}
                        <span className="text-emerald-400">{daysClamped} jours</span>,{' '}
                        votre Kompilot<br />a travaillé pour vous :
                      </h2>
                    </div>

                    {/* Metrics */}
                    <div className="px-5 py-5 space-y-3">
                      {metrics.isLoading ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
                          ))}
                        </div>
                      ) : (
                        <>
                          <MetricCard
                            icon={FileText}
                            value={metrics.postsGenerated}
                            label="Posts optimisés et planifiés par l'IA."
                            sublabel="Rédigés, visuels adaptés, horaires optimisés."
                            color="bg-emerald-500/80"
                            delay={0.05}
                          />
                          <MetricCard
                            icon={Star}
                            value={metrics.reviewsAnswered}
                            label="Réponses automatiques aux avis Google Maps."
                            sublabel="Chaque avis traité = fidélité renforcée."
                            color="bg-amber-500/80"
                            delay={0.12}
                          />
                          <MetricCard
                            icon={Users}
                            value={metrics.leadsDetected}
                            label="Nouveaux clients potentiels détectés par le scan GEO."
                            sublabel="Personnes qui cherchaient vos services en ce moment."
                            color="bg-blue-500/80"
                            delay={0.19}
                          />
                        </>
                      )}

                      {/* Impact sentence */}
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.32 }}
                        className="rounded-2xl border border-emerald-500/25 bg-emerald-500/8 px-4 py-3.5"
                      >
                        <p className="text-sm text-slate-200 leading-relaxed">
                          Ne laissez pas votre moteur de croissance s'arrêter.{' '}
                          Activez votre abonnement complet pour continuer à dominer{' '}
                          <strong className="text-emerald-300">{city}</strong>.
                        </p>
                      </motion.div>
                    </div>

                    {/* CTA zone */}
                    <div className="px-5 pb-6 space-y-3">
                      {/* Primary CTA */}
                      <motion.button
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        onClick={handleStripeClick}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center justify-center gap-3 rounded-2xl text-white text-[15px] font-black py-4 transition-all active:scale-[0.98] shadow-lg shadow-emerald-900/40"
                        style={{ background: 'linear-gradient(135deg, #059669 0%, #10B981 60%, #34D399 100%)' }}
                      >
                        <Zap size={18} className="fill-white" />
                        Activer mon Copilote — 59€/mois
                        <ExternalLink size={14} className="opacity-70" />
                      </motion.button>

                      {/* Confirm payment if Stripe was opened */}
                      <AnimatePresence>
                        {stripeOpened && (
                          <motion.button
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            onClick={handleConfirmPayment}
                            className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/10 text-emerald-300 text-sm font-bold py-3 transition-all hover:bg-emerald-500/20 hover:border-emerald-500"
                          >
                            <CheckCircle2 size={15} />
                            ✅ J'ai effectué mon paiement — Activer Pro
                          </motion.button>
                        )}
                      </AnimatePresence>

                      {/* Trust badges */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center justify-center gap-4 pt-1"
                      >
                        {['🔒 Paiement sécurisé', '✋ Sans engagement', '⚡ Accès immédiat'].map(b => (
                          <span key={b} className="text-[10px] text-slate-400 font-medium">{b}</span>
                        ))}
                      </motion.div>

                      {/* Secondary skip */}
                      <button
                        onClick={handleClose}
                        className="w-full text-[11px] text-slate-500 hover:text-slate-400 transition-colors py-1 text-center"
                      >
                        Continuer sans activer (accès limité)
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ── PROCESSING screen ── */}
                {screen === 'processing' && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-6 px-8 py-16 text-center"
                  >
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Rocket size={24} className="text-emerald-400" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xl font-extrabold text-white">Activation en cours…</p>
                      <p className="text-sm text-slate-400">
                        Mise à jour de votre compte · Aucune déconnexion
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* ── SUCCESS screen ── */}
                {screen === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center gap-5 px-8 py-14 text-center"
                  >
                    {/* Pulsing ring */}
                    <div className="relative">
                      <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                        className="w-24 h-24 rounded-full flex items-center justify-center"
                        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.25) 0%, transparent 70%)' }}
                      >
                        <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/40">
                          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                            <motion.path
                              d="M8 18l7 7 13-14"
                              stroke="white"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
                            />
                          </svg>
                        </div>
                      </motion.div>
                      {/* Pulse ring */}
                      <motion.div
                        initial={{ scale: 1, opacity: 0.6 }}
                        animate={{ scale: 1.8, opacity: 0 }}
                        transition={{ delay: 0.1, duration: 0.7, ease: 'easeOut' }}
                        className="absolute inset-0 rounded-full border-2 border-emerald-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-3xl font-black text-white"
                      >
                        Bienvenue en Pro 🚀
                      </motion.p>
                      <motion.p
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-base text-slate-300 leading-relaxed max-w-xs mx-auto"
                      >
                        Votre Copilote est maintenant actif à{' '}
                        <strong className="text-emerald-300">100% de sa puissance</strong>{' '}
                        pour <strong>{estName}</strong>.
                      </motion.p>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="grid grid-cols-3 gap-2 w-full max-w-sm"
                    >
                      {[
                        { emoji: '♾️', label: 'Posts illimités' },
                        { emoji: '🤖', label: 'IA activée' },
                        { emoji: '📊', label: 'Analytics Pro' },
                      ].map(f => (
                        <div
                          key={f.label}
                          className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-2 py-2.5 text-center"
                        >
                          <div className="text-xl mb-1">{f.emoji}</div>
                          <p className="text-[10px] font-bold text-emerald-300 leading-tight">{f.label}</p>
                        </div>
                      ))}
                    </motion.div>

                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.55 }}
                      onClick={handleClose}
                      className="mt-2 flex items-center gap-2 rounded-2xl px-8 py-3 text-sm font-bold text-white transition-all"
                      style={{ background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)' }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Accéder à mon tableau de bord Pro <ArrowRight size={15} />
                    </motion.button>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}