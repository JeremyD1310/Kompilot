/**
 * TestClientGuide — Optimised test client onboarding flow.
 *
 * A floating interactive panel that appears on the dashboard for new users
 * during their trial period. Guides them through 5 key platform actions
 * with contextual hints, progress tracking, and celebration on completion.
 *
 * Persists state in localStorage so it survives page reloads.
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import {
  X, Check, Rocket, CalendarDays, MessageSquare, Star,
  Sparkles, ChevronRight, PartyPopper, Play,
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'kompilot_test_guide_v1';
const DISMISSED_KEY = 'kompilot_test_guide_dismissed';

interface GuideStep {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  color: string;
}

const STEPS: GuideStep[] = [
  {
    id: 'connect',
    icon: <Rocket size={16} />,
    title: 'Connectez un réseau social',
    description: 'Liez Facebook, Instagram ou LinkedIn pour publier en 1 clic.',
    href: '/settings',
    actionLabel: 'Connecter',
    color: 'bg-violet-500',
  },
  {
    id: 'post',
    icon: <CalendarDays size={16} />,
    title: 'Planifiez votre premier post',
    description: "L'IA génère un post optimisé pour votre secteur. Validez en 1 clic.",
    href: '/calendar',
    actionLabel: 'Créer un post',
    color: 'bg-blue-500',
  },
  {
    id: 'inbox',
    icon: <MessageSquare size={16} />,
    title: 'Découvrez votre inbox unifiée',
    description: 'Tous vos messages et avis Google centralisés au même endroit.',
    href: '/inbox',
    actionLabel: 'Voir l\'inbox',
    color: 'bg-emerald-500',
  },
  {
    id: 'reviews',
    icon: <Star size={16} />,
    title: 'Répondez à un avis Google',
    description: "L'IA rédige une réponse professionnelle adaptée au ton de l'avis.",
    href: '/inbox',
    actionLabel: 'Gérer les avis',
    color: 'bg-amber-500',
  },
  {
    id: 'geo',
    icon: <Sparkles size={16} />,
    title: 'Analysez votre score G.E.O.',
    description: 'Découvrez votre visibilité sur ChatGPT, Gemini et Google Maps.',
    href: '/geo-authority',
    actionLabel: 'Voir mon score',
    color: 'bg-teal-500',
  },
];

// ── State helpers ──────────────────────────────────────────────────────────────

interface GuideState {
  completed: Set<string>;
  currentStep: number;
}

function loadState(): GuideState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        completed: new Set(parsed.completed ?? []),
        currentStep: parsed.currentStep ?? 0,
      };
    }
  } catch { /* noop */ }
  return { completed: new Set(), currentStep: 0 };
}

function saveState(state: GuideState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      completed: Array.from(state.completed),
      currentStep: state.currentStep,
    }));
  } catch { /* noop */ }
}

function isDismissed(): boolean {
  try { return localStorage.getItem(DISMISSED_KEY) === '1'; } catch { return false; }
}

function dismiss() {
  try { localStorage.setItem(DISMISSED_KEY, '1'); } catch { /* noop */ }
}

// ── Step Item ──────────────────────────────────────────────────────────────────

function StepItem({ step, done, active, index, onMark }: {
  step: GuideStep;
  done: boolean;
  active: boolean;
  index: number;
  onMark: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.25 }}
      className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all ${
        done ? 'opacity-60' : active ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/50'
      }`}
    >
      {/* Status indicator */}
      <div className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
        done ? 'bg-green-500 scale-110' : `${step.color} opacity-80`
      }`}>
        {done ? <Check size={12} className="text-white" strokeWidth={3} /> : step.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-tight ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {step.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{step.description}</p>

        {/* Action */}
        {!done && (
          <div className="flex items-center gap-2 mt-2">
            <Link
              to={step.href}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
            >
              <Play size={10} />
              {step.actionLabel}
              <ChevronRight size={12} />
            </Link>
            <button
              onClick={() => onMark(step.id)}
              className="text-[11px] text-muted-foreground hover:text-green-600 underline transition-colors"
            >
              Marquer fait
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Celebration overlay ────────────────────────────────────────────────────────

function CelebrationBanner({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
        backgroundSize: '16px 16px',
      }} />
      <div className="relative flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <PartyPopper size={20} />
        </div>
        <div className="flex-1">
          <p className="font-extrabold text-base">Bravo, vous êtes prêt !</p>
          <p className="text-sm text-white/80 mt-1 leading-relaxed">
            Vous avez exploré toutes les fonctionnalités clés de Kompilot. Votre moteur de croissance est opérationnel.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 bg-white text-emerald-700 rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-white/90 transition-colors"
            >
              <Rocket size={12} />
              Accéder au cockpit
            </Link>
            <button
              onClick={onClose}
              className="text-xs text-white/60 hover:text-white transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function TestClientGuide() {
  const [state, setState] = useState<GuideState>(loadState);
  const [dismissed, setDismissed] = useState(isDismissed);
  const [collapsed, setCollapsed] = useState(false);

  const completedCount = state.completed.size;
  const totalSteps = STEPS.length;
  const allDone = completedCount >= totalSteps;
  const progress = (completedCount / totalSteps) * 100;

  // Persist on change
  useEffect(() => { saveState(state); }, [state]);

  const handleMark = useCallback((id: string) => {
    setState(prev => {
      const next = new Set(prev.completed);
      next.add(id);
      // Advance current step
      const nextStep = STEPS.findIndex(s => !next.has(s.id));
      return { completed: next, currentStep: nextStep >= 0 ? nextStep : prev.currentStep };
    });
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    dismiss();
  }, []);

  const handleReset = useCallback(() => {
    setState({ completed: new Set(), currentStep: 0 });
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
  }, []);

  if (dismissed && !allDone) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Rocket size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-foreground">Guide de démarrage rapide</p>
              <p className="text-[11px] text-muted-foreground">
                {allDone ? 'Parcours terminé !' : `${completedCount}/${totalSteps} étapes complétées`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!allDone && (
              <button
                onClick={handleReset}
                className="text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition-colors"
                title="Réinitialiser"
              >
                Reset
              </button>
            )}
            <button
              onClick={() => setCollapsed(c => !c)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronRight size={14} className={`transition-transform ${collapsed ? '' : 'rotate-90'}`} />
            </button>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
              title="Fermer le guide"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mx-4 h-1.5 bg-muted rounded-full overflow-hidden mb-3">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Steps */}
        <AnimatePresence>
          {!collapsed && !allDone && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-2 pb-3 space-y-1">
                {STEPS.map((step, i) => (
                  <StepItem
                    key={step.id}
                    step={step}
                    done={state.completed.has(step.id)}
                    active={i === state.currentStep}
                    index={i}
                    onMark={handleMark}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Celebration */}
        <AnimatePresence>
          {allDone && !dismissed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-3"
            >
              <CelebrationBanner onClose={handleDismiss} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
