/**
 * ClickByClickGuide v3 — Guide interactif "clic-par-clic" enrichi.
 * Nouveautés v3 :
 * - Barre de recherche pour filtrer les steps
 * - Écran de récap final (score, niveaux, partage)
 * - Nouveaux steps Pro : SMS IA, AIO Sync, Recommandation
 * - Nouveaux steps Agence : Rapports PDF, Grille tarifaire, Pipeline
 * - Miniature cliquable pour naviguer entre steps
 * - Bouton de partage de progression
 */
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronRight, ChevronLeft, CheckCircle2, Zap,
  Trophy, Search, Sparkles,
} from 'lucide-react';
import { Button } from '@blinkdotnew/ui';
import { UNIVERSAL_STEPS, PRO_STEPS, AGENCY_STEPS, type GuideStep } from './guideData';
import { getLevel, XP_STORAGE_KEY, COMPLETED_STORAGE_KEY } from './guideHelpers';
import { RecapScreen } from './GuideRecapScreen';

// ── Types ──────────────────────────────────────────────────────────────────────

type ProfileMode = 'pro' | 'agency' | 'auto';

interface Props {
  open: boolean;
  onClose: () => void;
  profileMode?: ProfileMode;
  sector?: string;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function ClickByClickGuide({ open, onClose, profileMode = 'auto', sector }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(COMPLETED_STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [totalXP, setTotalXP] = useState(() => {
    try {
      return parseInt(localStorage.getItem(XP_STORAGE_KEY) ?? '0', 10) || 0;
    } catch {
      return 0;
    }
  });
  const [xpAnimation, setXpAnimation] = useState<number | null>(null);
  const [interactiveComplete, setInteractiveComplete] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [activeTab, setActiveTab] = useState<'universal' | 'specific'>('universal');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showRecap, setShowRecap] = useState(false);

  const mode = profileMode === 'auto' ? 'pro' : profileMode;
  const extraSteps = mode === 'agency' ? AGENCY_STEPS : PRO_STEPS;
  const universalSteps: GuideStep[] = UNIVERSAL_STEPS;
  const specificSteps: GuideStep[] = extraSteps;
  const allSteps = [...universalSteps, ...specificSteps];

  const baseSteps: GuideStep[] = activeTab === 'universal' ? universalSteps : specificSteps;

  const steps: GuideStep[] = useMemo(() => {
    if (!searchQuery.trim()) return baseSteps;
    const q = searchQuery.toLowerCase();
    return allSteps.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.subtitle.toLowerCase().includes(q) ||
      s.keywords?.some(k => k.includes(q))
    );
  }, [searchQuery, activeTab, baseSteps, allSteps]);

  useEffect(() => {
    if (open) { setCurrentStep(0); setShowRecap(false); }
  }, [open]);

  useEffect(() => {
    setInteractiveComplete(false);
    setShowTips(false);
  }, [currentStep, activeTab]);

  useEffect(() => {
    try { localStorage.setItem(XP_STORAGE_KEY, String(totalXP)); } catch { /* silent */ }
  }, [totalXP]);

  useEffect(() => {
    try { localStorage.setItem(COMPLETED_STORAGE_KEY, JSON.stringify([...completedSteps])); } catch { /* silent */ }
  }, [completedSteps]);

  if (!open) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const progress = steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;
  const { label: levelLabel, color: levelColor, nextXP } = getLevel(totalXP);
  const levelProgress = Math.min(((totalXP % 200) / 200) * 100, 100);
  const hasInteractive = !!step?.interactive;
  const canAdvance = !hasInteractive || interactiveComplete;

  const universalCompleted = universalSteps.filter(s => completedSteps.has(s.id)).length;
  const specificCompleted = specificSteps.filter(s => completedSteps.has(s.id)).length;
  const totalCompleted = completedSteps.size;
  const totalAll = allSteps.length;

  const handleInteractiveComplete = () => setInteractiveComplete(true);

  const handleNext = async () => {
    if (!canAdvance || !step) return;

    if (!completedSteps.has(step.id)) {
      const newCompleted = new Set([...completedSteps, step.id]);
      setCompletedSteps(newCompleted);
      setTotalXP(prev => prev + step.xp);
      setXpAnimation(step.xp);
      setTimeout(() => setXpAnimation(null), 1500);
    }

    if (step.id === 'notifications' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        try { await Notification.requestPermission(); } catch { /* silent */ }
      }
    }

    if (isLast) {
      setShowRecap(true);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const getCategoryBadge = (cat: GuideStep['category']) => {
    if (cat === 'pro')
      return <span className="text-[9px] font-black bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-full px-2 py-0.5 uppercase">Pro</span>;
    if (cat === 'agency')
      return <span className="text-[9px] font-black bg-violet-500/20 text-violet-400 border border-violet-500/30 rounded-full px-2 py-0.5 uppercase">Agence</span>;
    return null;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl bg-[#0F172A] border border-amber-500/30 text-white shadow-2xl overflow-hidden"
      >
        {/* Recap screen */}
        <AnimatePresence>
          {showRecap && (
            <RecapScreen
              totalXP={totalXP}
              completedCount={totalCompleted}
              totalCount={totalAll}
              mode={mode}
              onClose={onClose}
            />
          )}
        </AnimatePresence>

        {!showRecap && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  {step?.icon}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                      Guide {mode === 'agency' ? 'Agence' : 'Pro'}
                    </p>
                    {step && getCategoryBadge(step.category)}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {currentStep + 1}/{steps.length} étapes · {totalCompleted} terminées
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Search toggle */}
                <button
                  onClick={() => setShowSearch(prev => !prev)}
                  className={`p-1.5 rounded-lg transition-colors ${showSearch ? 'bg-amber-500/20 text-amber-400' : 'hover:bg-slate-800 text-slate-400'}`}
                >
                  <Search size={12} />
                </button>

                {/* XP badge */}
                <div className="relative">
                  <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
                    <Trophy size={10} className="text-amber-400" />
                    <span className={`text-[10px] font-black ${levelColor}`}>{totalXP} XP</span>
                  </div>
                  <AnimatePresence>
                    {xpAnimation !== null && (
                      <motion.div
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 0, y: -20 }}
                        exit={{ opacity: 0 }}
                        className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-black text-amber-400 whitespace-nowrap pointer-events-none"
                      >
                        +{xpAnimation} XP
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
                  <X size={13} className="text-slate-400" />
                </button>
              </div>
            </div>

            {/* Search bar */}
            <AnimatePresence>
              {showSearch && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden px-4 pb-2"
                >
                  <div className="relative">
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Rechercher une étape…"
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setCurrentStep(0); }}
                      className="w-full pl-8 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 transition-all"
                      autoFocus
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                        <X size={11} />
                      </button>
                    )}
                  </div>
                  {searchQuery && (
                    <p className="text-[10px] text-slate-500 mt-1">{steps.length} résultat{steps.length !== 1 ? 's' : ''} trouvé{steps.length !== 1 ? 's' : ''}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress bar */}
            <div className="h-0.5 bg-slate-800 mx-4">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>

            {/* Tab switcher — hide when searching */}
            {!searchQuery && (
              <div className="flex gap-1 px-4 pt-3 pb-1">
                {[
                  { key: 'universal' as const, label: 'Bases', completed: universalCompleted, total: universalSteps.length },
                  { key: 'specific' as const, label: mode === 'agency' ? 'Agence' : 'Pro', completed: specificCompleted, total: specificSteps.length },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => { setActiveTab(tab.key); setCurrentStep(0); }}
                    className={`flex items-center gap-1.5 flex-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-all ${
                      activeTab === tab.key
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800/50'
                    }`}
                  >
                    {tab.label}
                    <span className={`ml-auto text-[9px] rounded-full px-1.5 py-0.5 font-black ${
                      tab.completed === tab.total ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/80 text-slate-400'
                    }`}>
                      {tab.completed}/{tab.total}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Step dots */}
            {steps.length > 0 && (
              <div className="flex items-center justify-center gap-1 px-4 pt-1 pb-0.5">
                {steps.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setCurrentStep(i)}
                    title={s.title}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentStep ? 'w-4 bg-amber-500'
                      : completedSteps.has(s.id) ? 'w-2 bg-amber-500/50'
                      : 'w-1.5 bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Step content */}
            {steps.length === 0 ? (
              <div className="p-6 text-center">
                <Search size={24} className="mx-auto text-slate-600 mb-2" />
                <p className="text-sm text-slate-400">Aucune étape trouvée</p>
                <p className="text-[10px] text-slate-600 mt-1">Essayez un autre mot-clé</p>
              </div>
            ) : step ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeTab}-${step.id}`}
                  initial={{ x: 12, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -12, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="p-4 space-y-3 max-h-[55vh] overflow-y-auto"
                >
                  {/* Step title */}
                  <div>
                    <h3 className="font-bold text-sm leading-tight text-white">{step.title}</h3>
                    <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{step.subtitle}</p>
                  </div>

                  {/* XP reward badge */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 bg-amber-500/8 border border-amber-500/15 rounded-full px-2 py-0.5">
                      <Zap size={9} className="text-amber-400" />
                      <span className="text-[9px] font-black text-amber-400">+{step.xp} XP</span>
                    </div>
                    {completedSteps.has(step.id) && (
                      <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                        <CheckCircle2 size={9} className="text-emerald-400" />
                        <span className="text-[9px] font-black text-emerald-400">Complété</span>
                      </div>
                    )}
                  </div>

                  {/* Interactive component */}
                  {step.interactive && (
                    <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-3">
                      <step.interactive
                        onComplete={handleInteractiveComplete}
                        sector={sector}
                      />
                    </div>
                  )}

                  {/* Static content + action */}
                  {!step.interactive && step.content && (
                    <p className="text-slate-400 text-xs leading-relaxed">{step.content}</p>
                  )}

                  {!step.interactive && step.action && (
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                      <p className="text-amber-300 text-xs font-medium">
                        <span className="text-amber-500">&#x279C;</span> {step.action}
                      </p>
                    </div>
                  )}

                  {/* Pro tips toggle */}
                  {step.tips && step.tips.length > 0 && (
                    <div>
                      <button
                        onClick={() => setShowTips(prev => !prev)}
                        className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-400 transition-colors"
                      >
                        <Sparkles size={10} />
                        {showTips ? 'Masquer les conseils' : 'Voir les conseils Pro'}
                      </button>
                      <AnimatePresence>
                        {showTips && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-2"
                          >
                            <div className="space-y-1">
                              {step.tips.map((tip, i) => (
                                <div key={i} className="flex items-start gap-2 text-[10px] text-slate-400">
                                  <span className="text-amber-500 shrink-0 mt-0.5">&#x2023;</span>
                                  {tip}
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Interactive hint */}
                  {hasInteractive && !interactiveComplete && (
                    <p className="text-[10px] text-slate-500 text-center">
                      Complétez l'action ci-dessus pour débloquer la suite
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            ) : null}

            {/* Level indicator */}
            <div className="px-4 pb-2">
              <div className="flex items-center gap-1.5 rounded-lg bg-slate-800/60 px-3 py-1.5">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Niv.</span>
                <span className={`text-[10px] font-black ${levelColor}`}>{levelLabel}</span>
                <div className="flex-1 h-1 rounded-full bg-slate-700 overflow-hidden ml-1">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
                    animate={{ width: `${levelProgress}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <span className="text-[9px] text-slate-500 tabular-nums">{totalXP}/{nextXP}</span>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-2 px-4 pb-4">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  className="flex-1 h-9 text-xs border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
                >
                  <ChevronLeft size={13} className="mr-1" /> Précédent
                </Button>
              )}
              {steps.length > 0 && (
                <Button
                  onClick={handleNext}
                  disabled={!canAdvance}
                  className={`flex-1 h-9 text-xs font-bold transition-all ${
                    isLast
                      ? 'bg-amber-600 hover:bg-amber-500'
                      : canAdvance
                        ? 'bg-slate-700 hover:bg-slate-600'
                        : 'bg-slate-800 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {isLast ? (
                    <><Trophy size={13} className="mr-1" /> Voir mon bilan</>
                  ) : canAdvance ? (
                    <>Suivant <ChevronRight size={13} className="ml-1" /></>
                  ) : (
                    <>Complétez d'abord l'action</>
                  )}
                </Button>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
