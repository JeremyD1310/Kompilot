/**
 * Step6BulkCalendar — Onboarding step demonstrating the 30-day bulk calendar generator.
 * The user picks an objective + frequency, watches a mock "generation" animation,
 * then sees a mini calendar grid with 3 draft posts appear.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CalendarDays, CheckCircle2 } from 'lucide-react';

interface Props { onComplete: () => void }

const OBJECTIVES = [
  { id: 'promo',     emoji: '🎁', label: 'Promo du mois' },
  { id: 'notoriete', emoji: '🌟', label: 'Notoriété locale' },
  { id: 'engage',    emoji: '💬', label: 'Engagement' },
];

const FREQUENCIES = [
  { id: '2_week', label: '2 / semaine', count: 8 },
  { id: '3_week', label: '3 / semaine', count: 12 },
  { id: 'daily',  label: 'Quotidien',   count: 30 },
];

// Mini draft posts shown after generation
const DRAFT_POSTS = [
  { date: '2 juin',  theme: '🎁 Offre',      text: '🎁 Découvrez notre offre exclusive ce mois-ci — réservez maintenant !', color: 'border-orange-300 bg-orange-50 dark:bg-orange-950/20' },
  { date: '5 juin',  theme: '📸 Coulisses',  text: '👀 Derrière les coulisses : voici comment notre équipe prépare votre satisfaction chaque jour.', color: 'border-violet-300 bg-violet-50 dark:bg-violet-950/20' },
  { date: '9 juin',  theme: '⭐ Avis',       text: '⭐ Merci à nos clients pour vos avis chaleureux ! Votre confiance nous pousse à faire toujours mieux.', color: 'border-teal-300 bg-teal-50 dark:bg-teal-950/20' },
];

type Phase = 'config' | 'generating' | 'result';

const GEN_STEPS = [
  'Analyse de votre secteur…',
  'Planification des créneaux optimaux…',
  'Rédaction des contenus IA…',
];

export function Step6BulkCalendar({ onComplete }: Props) {
  const [objective, setObjective] = useState('promo');
  const [frequency, setFrequency] = useState('3_week');
  const [phase, setPhase] = useState<Phase>('config');
  const [genStep, setGenStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const selectedFreq = FREQUENCIES.find(f => f.id === frequency)!;

  const handleGenerate = () => {
    setPhase('generating');
    let step = 0;
    let prog = 0;
    const iv = setInterval(() => {
      prog += 3;
      setProgress(Math.min(prog, 100));
      if (prog === 34) { step = 1; setGenStep(1); }
      if (prog === 67) { step = 2; setGenStep(2); }
      if (prog >= 100) {
        clearInterval(iv);
        setTimeout(() => { setPhase('result'); setDone(true); onComplete(); }, 300);
      }
    }, 40);
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 px-3.5 py-3 flex items-start gap-2.5">
        <span className="text-base shrink-0">📅</span>
        <p className="text-[11px] text-violet-800 dark:text-violet-300 leading-relaxed">
          <strong>CALENDRIER EN MASSE :</strong> Générez un mois complet de contenus en 1 clic. L'IA planifie une stratégie équilibrée sur tous vos réseaux, adaptée à votre objectif du mois.
        </p>
      </div>

      {/* Config phase */}
      <AnimatePresence mode="wait">
        {phase === 'config' && (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-3.5"
          >
            {/* Objective */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Objectif du mois</p>
              <div className="grid grid-cols-3 gap-2">
                {OBJECTIVES.map(obj => (
                  <button
                    key={obj.id}
                    onClick={() => setObjective(obj.id)}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2.5 text-center transition-all text-xs font-semibold active:scale-[0.97] ${
                      objective === obj.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    <span className="text-lg">{obj.emoji}</span>
                    <span className="leading-tight text-[10px]">{obj.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Frequency */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Fréquence</p>
              <div className="flex gap-2">
                {FREQUENCIES.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFrequency(f.id)}
                    className={`flex-1 rounded-xl border-2 py-2 text-[10px] font-bold transition-all ${
                      frequency === f.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {f.label}
                    <span className="block font-normal opacity-70">{f.count} posts</span>
                  </button>
                ))}
              </div>
            </div>

            {/* CTA */}
            <motion.button
              onClick={handleGenerate}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-primary text-white text-sm font-extrabold py-3 shadow-lg shadow-violet-200 dark:shadow-violet-900/30 active:scale-[0.98] transition-all"
            >
              <Sparkles size={15} />
              ✨ Générer {selectedFreq.count} posts en 1 clic
            </motion.button>
          </motion.div>
        )}

        {/* Generating phase */}
        {phase === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border-2 border-violet-300 bg-gradient-to-br from-violet-50 to-primary/5 dark:from-violet-950/30 dark:to-primary/5 p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles size={16} className="text-violet-600" />
              </motion.div>
              <p className="text-xs font-extrabold text-violet-800 dark:text-violet-300">L'IA génère votre calendrier…</p>
            </div>

            {/* Step list */}
            <div className="space-y-1.5">
              {GEN_STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold transition-colors ${
                    genStep > i ? 'bg-emerald-500 text-white' : genStep === i ? 'bg-primary text-white animate-pulse' : 'bg-muted text-muted-foreground'
                  }`}>
                    {genStep > i ? '✓' : i + 1}
                  </div>
                  <p className={`text-[11px] transition-colors ${genStep >= i ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>{s}</p>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="h-2 rounded-full bg-violet-200 dark:bg-violet-800 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-primary"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.08 }}
              />
            </div>
          </motion.div>
        )}

        {/* Result phase */}
        {phase === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3"
          >
            {/* Success badge */}
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <p className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                {selectedFreq.count} posts générés et prêts à valider ! 🎉
              </p>
            </div>

            {/* Mini calendar grid */}
            <div className="grid grid-cols-3 gap-2">
              {DRAFT_POSTS.map((post, i) => (
                <motion.div
                  key={post.date}
                  initial={{ opacity: 0, scale: 0.9, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: i * 0.12, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className={`rounded-xl border-2 p-2.5 space-y-1.5 ${post.color}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-muted-foreground bg-muted/60 rounded-full px-1.5 py-0.5">{post.date}</span>
                    <span className="text-[8px] font-bold text-white rounded-full px-1.5 py-0.5 bg-foreground/70">{post.theme}</span>
                  </div>
                  <p className="text-[10px] text-foreground leading-snug line-clamp-3">{post.text}</p>
                </motion.div>
              ))}
            </div>

            {/* Action hint */}
            <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
              <CalendarDays size={13} className="text-primary shrink-0" />
              <p className="text-[11px] text-primary font-semibold">
                Validez tout d'un clic ou modifiez post par post avant planification.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
