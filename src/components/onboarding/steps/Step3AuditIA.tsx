import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface Props { onComplete: () => void }

type Phase = 'idle' | 'scanning' | 'results' | 'quiz';

const SCAN_STEPS = [
  'Analyse des avis Google...',
  'Vérification Instagram...',
  'Scan des liens de réservation...',
];

export function Step3AuditIA({ onComplete }: Props) {
  const [phase, setPhase]     = useState<Phase>('idle');
  const [scanStep, setScanStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [answer, setAnswer]   = useState<null | 'wrong' | 'right'>(null);
  const [shake, setShake]     = useState(false);

  const handleScan = () => {
    setPhase('scanning');
    let step = 0;
    let prog = 0;
    const iv = setInterval(() => {
      prog += 4;
      setProgress(Math.min(prog, 100));
      if (prog % 34 === 0 && step < 2) { step++; setScanStep(step); }
      if (prog >= 100) { clearInterval(iv); setPhase('results'); setTimeout(() => setPhase('quiz'), 600); }
    }, 60);
  };

  const handleAnswer = (correct: boolean) => {
    if (answer) return;
    if (correct) { setAnswer('right'); onComplete(); }
    else { setAnswer('wrong'); setShake(true); setTimeout(() => setShake(false), 500); }
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3.5 py-3 flex items-start gap-2.5">
        <span className="text-base shrink-0">🌐</span>
        <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
          <strong>AUDIT IA FLASH :</strong> Analysez instantanément la santé numérique de votre commerce pour corriger vos points faibles avant vos concurrents.
        </p>
      </div>

      {/* Spotlight card */}
      <div className="relative rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/10 p-4">
        <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: '0 0 0 4px rgba(245,158,11,0.15), 0 0 40px rgba(245,158,11,0.1)' }} />
        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-2">⚡ Module Audit IA Flash</p>

        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.button
              key="scan-btn"
              onClick={handleScan}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold py-2.5 shadow-md active:scale-[0.98] transition-all"
              whileTap={{ scale: 0.97 }}
            >
              <Search size={14} /> 🔍 Tester ma visibilité
            </motion.button>
          )}

          {phase === 'scanning' && (
            <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">{SCAN_STEPS[scanStep]}</p>
              <div className="h-2 rounded-full bg-amber-200 dark:bg-amber-800 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </motion.div>
          )}

          {(phase === 'results' || phase === 'quiz') && (
            <motion.div key="results" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-2">
              {[
                { label: 'Avis Google', value: '4.2/5 ⭐', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
                { label: 'Posts réguliers', value: '68% 📸', color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200' },
                { label: 'Lien réservation', value: '❌ Manquant', color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
              ].map(s => (
                <div key={s.label} className={cn('rounded-xl border px-2 py-2 text-center', s.bg)}>
                  <p className={cn('text-xs font-extrabold', s.color)}>{s.value}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quiz */}
      <AnimatePresence>
        {phase === 'quiz' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-3.5 space-y-2.5"
          >
            <p className="text-xs font-bold text-foreground">
              🧠 Selon votre audit, quel est le levier prioritaire pour grimper sur Google Maps ?
            </p>
            {[
              { label: 'Publier un post classique', correct: false },
              { label: 'Récolter des avis réguliers et y répondre', correct: true },
            ].map(opt => (
              <motion.button
                key={opt.label}
                onClick={() => handleAnswer(opt.correct)}
                animate={shake && !opt.correct && answer === 'wrong' ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                transition={{ duration: 0.4 }}
                className={cn(
                  'w-full flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-all',
                  answer === 'right' && opt.correct ? 'border-emerald-400 bg-emerald-50 text-emerald-700' :
                  answer === 'wrong' && !opt.correct ? 'border-red-300 bg-red-50 text-red-600' :
                  answer === 'right' && !opt.correct ? 'border-border opacity-40' :
                  'border-border hover:border-primary/40 text-foreground'
                )}
              >
                <span className={cn(
                  'w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center',
                  answer === 'right' && opt.correct ? 'border-emerald-500 bg-emerald-500' :
                  answer === 'wrong' && !opt.correct ? 'border-red-400 bg-red-100' : 'border-muted-foreground/40'
                )}>
                  {answer === 'right' && opt.correct && (
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.2" strokeLinecap="round"/></svg>
                  )}
                </span>
                {opt.label}
              </motion.button>
            ))}
            <AnimatePresence>
              {answer === 'wrong' && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] text-red-600 font-semibold">
                  Ce n'est pas la bonne réponse 😅 Réessayez !
                </motion.p>
              )}
              {answer === 'right' && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] text-emerald-700 font-extrabold">
                  ✅ Bonne réponse ! Les avis Google sont votre levier #1.
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
