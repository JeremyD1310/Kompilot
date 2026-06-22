/**
 * StepB_CalendarSerenity — AI Calendar "Sérénité"
 * Pick a monthly goal → generate 30 days of posts → plan them all.
 */
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface Props { onComplete: () => void }

const GOALS = [
  { id: 'clients',    label: '🎁 Attirer de nouveaux clients' },
  { id: 'fideliser',  label: '💬 Fidéliser mes clients' },
  { id: 'notoriete',  label: '🌟 Renforcer ma notoriété locale' },
];

const MINI_CARDS = [
  { platform: 'Instagram 📸', text: '✨ Découvrez notre offre exclusive ce mois-ci — réservez dès maintenant !', color: 'border-pink-300 bg-pink-50 dark:bg-pink-950/20 dark:border-pink-800' },
  { platform: 'TikTok 🎬',    text: '🎬 Coulisses : comment notre équipe prépare votre visite chaque matin…', color: 'border-zinc-300 bg-zinc-50 dark:bg-zinc-800/40 dark:border-zinc-700' },
  { platform: 'Google Maps 🗺️', text: '📍 Retrouvez-nous facilement — lien itinéraire en bio !', color: 'border-blue-300 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800' },
  { platform: 'Instagram 📸', text: '⭐ Merci à nos clients pour vos avis ! Votre confiance nous touche.', color: 'border-pink-300 bg-pink-50 dark:bg-pink-950/20 dark:border-pink-800' },
  { platform: 'TikTok 🎬',    text: '💡 3 conseils que personne ne vous dit sur notre secteur — thread !', color: 'border-zinc-300 bg-zinc-50 dark:bg-zinc-800/40 dark:border-zinc-700' },
  { platform: 'Google Maps 🗺️', text: '🗺️ Nouveau : réservez directement depuis Google Maps !', color: 'border-blue-300 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800' },
  { platform: 'Instagram 📸', text: '🎉 Offre spéciale week-end — disponibilités limitées, réservez vite.', color: 'border-pink-300 bg-pink-50 dark:bg-pink-950/20 dark:border-pink-800' },
  { platform: 'TikTok 🎬',    text: '🔥 Avant / Après : le résultat qui a tout changé pour ce client.', color: 'border-zinc-300 bg-zinc-50 dark:bg-zinc-800/40 dark:border-zinc-700' },
  { platform: 'Google Maps 🗺️', text: '📢 Répondre aux avis Google = +15 % de clics. On vous explique.', color: 'border-blue-300 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800' },
  { platform: 'Instagram 📸', text: '💬 FAQ du mois : vos questions, nos réponses en stories !', color: 'border-pink-300 bg-pink-50 dark:bg-pink-950/20 dark:border-pink-800' },
  { platform: 'TikTok 🎬',    text: '🌟 Portrait de notre équipe — les visages derrière votre satisfaction.', color: 'border-zinc-300 bg-zinc-50 dark:bg-zinc-800/40 dark:border-zinc-700' },
  { platform: 'Google Maps 🗺️', text: '🏆 Classés #1 dans votre quartier cette semaine — merci à vous !', color: 'border-blue-300 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800' },
];

type Phase = 'goal' | 'ready' | 'generating' | 'done';

export function StepB_CalendarSerenity({ onComplete }: Props) {
  const [goal, setGoal] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('goal');
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleGoal = (id: string) => {
    setGoal(id);
    setPhase('ready');
  };

  const handleGenerate = () => {
    setPhase('generating');
    let prog = 0;
    intervalRef.current = setInterval(() => {
      prog += 3;
      setProgress(Math.min(prog, 100));
      if (prog >= 100) {
        clearInterval(intervalRef.current!);
        setTimeout(() => setPhase('done'), 300);
      }
    }, 45); // ~1.5s
  };

  return (
    <div className="space-y-4">
      {/* Intro banner */}
      <div className="rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 px-3.5 py-3 flex items-start gap-2.5">
        <span className="text-base shrink-0">📅</span>
        <p className="text-[11px] text-violet-800 dark:text-violet-300 leading-relaxed">
          <strong>MODE SÉRÉNITÉ :</strong> L'IA génère votre calendrier complet avec scripts TikTok,
          posts Google Maps et visuels Instagram — 30 jours en 1 clic.
        </p>
      </div>

      <div className="rounded-2xl border-2 border-violet-300 dark:border-violet-700 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/10 p-4 space-y-3">
        <p className="text-[10px] font-bold text-violet-700 dark:text-violet-400 uppercase tracking-widest">
          📅 Générateur de calendrier IA
        </p>

        <AnimatePresence mode="wait">
          {/* Step 1 — Pick goal */}
          {phase === 'goal' && (
            <motion.div
              key="goal"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-2"
            >
              <p className="text-xs font-semibold text-foreground">
                Quel est votre objectif ce mois-ci ?
              </p>
              {GOALS.map(g => (
                <motion.button
                  key={g.id}
                  onClick={() => handleGoal(g.id)}
                  whileTap={{ scale: 0.97 }}
                  className="w-full rounded-xl border border-violet-300 dark:border-violet-700 bg-card hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:border-violet-500 text-left text-xs font-semibold text-foreground px-3 py-2.5 transition-all"
                >
                  {g.label}
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Step 2 — Generate button */}
          {phase === 'ready' && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-3"
            >
              <p className="text-xs text-violet-700 dark:text-violet-300 font-semibold">
                ✅ Objectif sélectionné :{' '}
                <span className="font-bold">{GOALS.find(g => g.id === goal)?.label}</span>
              </p>
              <motion.button
                onClick={handleGenerate}
                whileTap={{ scale: 0.97 }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-bold py-2.5 shadow-md"
              >
                <Sparkles size={14} /> ✨ Générer 30 jours de posts
              </motion.button>
            </motion.div>
          )}

          {/* Generating animation */}
          {phase === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500" />
                </span>
                <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                  Génération en cours…
                </p>
              </div>
              <div className="h-2 rounded-full bg-violet-200 dark:bg-violet-800 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.08 }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground text-right">{progress}%</p>
            </motion.div>
          )}

          {/* Done — mini calendar grid */}
          {phase === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              <p className="text-xs font-bold text-violet-700 dark:text-violet-300">
                ✅ 30 posts générés — aperçu :
              </p>
              <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-0.5">
                {MINI_CARDS.map((card, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04, duration: 0.2 }}
                    className={`rounded-xl border px-2 py-2 ${card.color}`}
                  >
                    <p className="text-[9px] font-bold text-foreground/70 mb-0.5">{card.platform}</p>
                    <p className="text-[9px] text-foreground/80 leading-snug line-clamp-2">{card.text}</p>
                  </motion.div>
                ))}
              </div>

              <motion.button
                onClick={onComplete}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-bold py-2.5 shadow-md"
              >
                Tout planifier 🚀
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
