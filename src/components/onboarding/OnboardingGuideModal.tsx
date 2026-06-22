/**
 * OnboardingGuideModal — 4-step interactive tutorial + graduation screen.
 * Steps: A) GEO Radar Scan, B) Calendrier Sérénité, C) WhatsApp Inbox, D) ROI Counter
 * Hook API is backward-compatible: useOnboardingGuideModal(userId) → { show, close }
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Gift, SkipForward, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { StepA_GeoScan } from './steps/StepA_GeoScan';
import { StepB_CalendarSerenity } from './steps/StepB_CalendarSerenity';
import { StepC_WhatsAppInbox } from './steps/StepC_WhatsAppInbox';
import { StepD_ROICounter } from './steps/StepD_ROICounter';
import { GraduationScreen } from './GraduationScreen';

// ── Types ──────────────────────────────────────────────────────────────────────

interface OnboardingGuideModalProps {
  userId: string;
  onClose: () => void;
}

// Bumped to v4 so existing users see the new 4-step guide
const STORAGE_KEY = (uid: string) => `guide_modal_v4_${uid}`;

// Features listed in the skip warning
const MISSED_FEATURES = [
  { emoji: '🤖', label: 'Scan GEO / GEA — savoir qui prend vos clients sur ChatGPT' },
  { emoji: '📅', label: 'Mode Sérénité — 30 jours de posts générés en 1 clic' },
  { emoji: '💬', label: 'Inbox WhatsApp — répondre à tous vos clients au même endroit' },
  { emoji: '💰', label: 'Compteur ROI — mesurer le CA généré par vos posts' },
];

// ── Step definitions ───────────────────────────────────────────────────────────

type StepComponent = React.ComponentType<{ onComplete: () => void }>;

const STEPS: {
  tag: string; title: string; subtitle: string; color: string; Component: StepComponent;
}[] = [
  {
    tag: '🤖 Pilote Radar G.E.O.',
    title: 'Scan de Visibilité IA',
    subtitle: 'Analysez instantanément la présence de votre établissement sur les nouveaux moteurs de recherche et devancez vos concurrents locaux.',
    color: 'from-red-500 to-orange-500',
    Component: StepA_GeoScan,
  },
  {
    tag: '📅 Mode Sérénité',
    title: '1 mois de posts en 1 clic',
    subtitle: 'L\'IA génère 30 jours de publications (Images, Carrousels, Scripts TikTok) et remplit votre calendrier instantanément.',
    color: 'from-violet-500 to-indigo-600',
    Component: StepB_CalendarSerenity,
  },
  {
    tag: '💬 Messagerie Unique',
    title: 'API WhatsApp & Inbox Centralisé',
    subtitle: 'Recevez tous vos messages clients au même endroit — et laissez l\'IA rédiger la réponse parfaite avec votre lien de réservation.',
    color: 'from-[#075e54] to-[#25D366]',
    Component: StepC_WhatsAppInbox,
  },
  {
    tag: '💰 Compteur ROI',
    title: 'Votre Croissance en Chiffres Réels',
    subtitle: 'Entrez votre panier moyen et Kompilot calcule le chiffre d\'affaires généré par vos posts chaque mois.',
    color: 'from-teal-500 to-emerald-500',
    Component: StepD_ROICounter,
  },
];

// ── Modal ──────────────────────────────────────────────────────────────────────

export function OnboardingGuideModal({ userId, onClose }: OnboardingGuideModalProps) {
  const navigate  = useNavigate();
  const [step, setStep]     = useState(0);
  const [completed, setCompleted] = useState(false); // current step completed
  const [graduated, setGraduated] = useState(false);
  const [closing, setClosing]     = useState(false);
  const [skipConfirm, setSkipConfirm] = useState(false);
  const [cguAccepted, setCguAccepted] = useState(() => {
    return localStorage.getItem('kompilot_cgu_ai_v1') === '1';
  });

  const progressPct = ((step) / STEPS.length) * 100;
  const completedPct = ((step + (completed ? 1 : 0)) / STEPS.length) * 100;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY(userId), '1');
    setClosing(true);
    setTimeout(onClose, 280);
  };

  const handleNext = () => {
    if (!completed) return;
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
      setCompleted(false);
      setSkipConfirm(false);
    } else {
      setGraduated(true);
    }
  };

  const handleClaimBonus = () => {
    dismiss();
    navigate({ to: '/subscription' });
  };

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      {!closing && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[300] bg-black/65 backdrop-blur-sm"
            onClick={() => setSkipConfirm(false)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[301] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden pointer-events-auto max-h-[90vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {!graduated ? (
                <>
                  {/* Coloured header */}
                  <div className={`relative bg-gradient-to-r ${current.color} px-6 pt-6 pb-10 shrink-0`}>
                    {/* Top row: step counter (left) + close button (right) */}
                    <div className="flex items-center justify-between w-full mb-4">
                      <span className="text-[11px] font-bold text-white/80 leading-none">
                        Étape {step + 1} / {STEPS.length}
                      </span>
                      <button
                        onClick={dismiss}
                        aria-label="Fermer"
                        className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/35 flex items-center justify-center transition-colors"
                      >
                        <X size={14} className="text-white" />
                      </button>
                    </div>

                    <motion.div
                      key={`tag-${step}`}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/25 border border-white/30 px-3 py-1 text-xs font-bold text-white mb-2"
                    >
                      {current.tag}
                    </motion.div>

                    <motion.h2
                      key={`title-${step}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-xl font-extrabold text-white leading-tight mb-1"
                    >
                      {current.title}
                    </motion.h2>

                    <motion.p
                      key={`sub-${step}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="text-sm text-white/85 leading-relaxed max-w-sm"
                    >
                      {current.subtitle}
                    </motion.p>

                    {/* Progress bar + dots */}
                    <div className="absolute bottom-0 left-0 right-0 px-6 pb-3 space-y-2">
                      {/* Segmented dot indicators */}
                      <div className="flex items-center justify-center gap-1.5">
                        {STEPS.map((_, i) => (
                          <div
                            key={i}
                            className={`rounded-full transition-all duration-300 ${
                              i === step ? 'w-6 h-1.5 bg-white'
                              : i < step  ? 'w-1.5 h-1.5 bg-white/70'
                              : 'w-1.5 h-1.5 bg-white/30'
                            }`}
                          />
                        ))}
                      </div>
                      {/* Continuous progress bar */}
                      <div className="h-1 w-full rounded-full bg-white/20 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-white"
                          initial={{ width: `${progressPct}%` }}
                          animate={{ width: `${completedPct}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                      <p className="text-[9px] text-white/50 text-right font-semibold">
                        {Math.round(completedPct)}% complété
                      </p>
                    </div>
                  </div>

                  {/* Step content */}
                  <div className="px-5 pt-4 pb-2 overflow-y-auto flex-1">

                    {/* ── Welcome statement — Kompilot Money-First (step 0 only) ── */}
                    {step === 0 && (
                      <div className="mb-4 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 dark:border-emerald-800/50 px-4 py-3">
                        <p className="text-sm font-extrabold text-emerald-800 dark:text-emerald-300 leading-tight">
                          💰 Bienvenue. Kompilot n'est pas un outil de visibilité passive.
                        </p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 leading-relaxed">
                          C'est un <strong>moteur de génération de chiffre d'affaires</strong> — chaque euro sauvé par un no-show bloqué, activé par une relance IA ou capturé par un coupon est tracé en temps réel sur votre tableau de bord.
                        </p>
                      </div>
                    )}

                    {/* CGU acceptance banner — shown only on step 0 until accepted */}
                    {!cguAccepted && step === 0 && (
                      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/40 px-4 py-3 space-y-3">
                        <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                          ✅ Avant de commencer
                        </p>
                        <label className="flex items-start gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={cguAccepted}
                            onChange={e => {
                              if (e.target.checked) {
                                setCguAccepted(true);
                                localStorage.setItem('kompilot_cgu_ai_v1', '1');
                              }
                            }}
                            className="mt-0.5 h-4 w-4 rounded border-amber-300 text-primary accent-primary cursor-pointer"
                          />
                          <span className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed group-hover:text-amber-900 dark:group-hover:text-amber-200 transition-colors">
                            J'accepte les <a href="/legal" className="underline font-semibold" target="_blank">CGU</a> et je comprends que les réponses générées par l'IA doivent être relues avant envoi pour garantir la meilleure relation client.
                          </span>
                        </label>
                      </div>
                    )}

                    {/* Skip confirmation banner */}
                    <AnimatePresence>
                      {skipConfirm && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.98 }}
                          transition={{ duration: 0.2 }}
                          className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/40 p-4 space-y-3"
                        >
                          <div className="flex items-start gap-2.5">
                            <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-extrabold text-amber-800 dark:text-amber-300 leading-snug">
                                Vous risquez de passer à côté de fonctionnalités clés
                              </p>
                              <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                                Les commerçants qui terminent ce tutoriel obtiennent en moyenne <strong>2× plus de résultats</strong> dès le premier mois.
                              </p>
                            </div>
                          </div>
                          <ul className="space-y-1.5">
                            {MISSED_FEATURES.map((f, i) => (
                              <li key={i} className="flex items-center gap-2 text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                                <span className="text-sm shrink-0">{f.emoji}</span>
                                <span>{f.label}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => setSkipConfirm(false)}
                              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary text-white text-xs font-bold px-3 py-2 hover:bg-primary/90 transition-colors"
                            >
                              Continuer le tutoriel <ArrowRight size={12} />
                            </button>
                            <button
                              onClick={dismiss}
                              className="flex items-center gap-1 rounded-xl border border-amber-300 bg-white dark:bg-card text-amber-700 dark:text-amber-400 text-[10px] font-semibold px-3 py-2 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors shrink-0"
                            >
                              <SkipForward size={11} /> Ignorer quand même
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 14 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -14 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                      >
                        <current.Component onComplete={() => setCompleted(true)} />
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Footer */}
                  <div className="px-5 pb-5 pt-3 flex items-center justify-between gap-3 shrink-0 border-t border-border/40">
                    <button
                      onClick={() => setSkipConfirm(s => !s)}
                      className={`flex items-center gap-1.5 text-xs transition-colors shrink-0 ${
                        skipConfirm
                          ? 'text-amber-600 font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <SkipForward size={12} />
                      Passer
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                      {step > 0 && (
                        <button
                          onClick={() => { setStep(s => s - 1); setCompleted(true); setSkipConfirm(false); }}
                          className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                        >
                          Retour
                        </button>
                      )}
                      <motion.button
                        onClick={handleNext}
                        disabled={!completed || (!cguAccepted && step === 0)}
                        whileTap={{ scale: (completed && (cguAccepted || step !== 0)) ? 0.97 : 1 }}
                        className={`flex items-center gap-2 rounded-xl bg-gradient-to-r ${current.color} text-white px-5 py-2 text-sm font-bold shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        {isLast ? (
                          <><Gift size={14} /> Terminer & Réclamer mon bonus 🎁</>
                        ) : (
                          <>Suivant <ChevronRight size={15} /></>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </>
              ) : (
                // Graduation screen replaces modal content
                <div className="overflow-y-auto flex-1">
                  <GraduationScreen onClaimBonus={handleClaimBonus} />
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Hook (backward-compatible) ─────────────────────────────────────────────────

export function useOnboardingGuideModal(userId: string | undefined) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!userId) return;
    if (localStorage.getItem(STORAGE_KEY(userId))) return;
    const t = setTimeout(() => setShow(true), 1200);
    return () => clearTimeout(t);
  }, [userId]);

  const close = () => {
    if (userId) localStorage.setItem(STORAGE_KEY(userId), '1');
    setShow(false);
  };

  return { show, close };
}