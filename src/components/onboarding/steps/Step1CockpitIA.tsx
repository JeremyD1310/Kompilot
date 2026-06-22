import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Sparkles } from 'lucide-react';

interface Props { onComplete: () => void }

export function Step1CockpitIA({ onComplete }: Props) {
  const [text, setText] = useState('Notre brunch du dimanche, ambiance chaleureuse...');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [dot, setDot] = useState(0);

  const handleGenerate = () => {
    if (done) return;
    setLoading(true);
    let d = 0;
    const t = setInterval(() => { d = (d + 1) % 4; setDot(d); }, 350);
    setTimeout(() => {
      clearInterval(t);
      setLoading(false);
      setDone(true);
      onComplete();
    }, 1400);
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 px-3.5 py-3 flex items-start gap-2.5">
        <span className="text-base shrink-0">💡</span>
        <p className="text-[11px] text-violet-800 dark:text-violet-300 leading-relaxed">
          <strong>COCKPIT IA :</strong> Dictez une idée au micro en 10 secondes. L'IA se charge de rédiger un texte percutant, adapté à votre secteur et optimisé pour capter l'attention.
        </p>
      </div>

      {/* Mic + tooltip */}
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-violet-400"
          />
          <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
            <Mic size={20} className="text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 dark:bg-violet-900/40 border border-violet-300 dark:border-violet-700 px-2.5 py-1 mb-2">
            <span className="text-[10px] font-bold text-violet-700 dark:text-violet-300">👆 Étape 1 : Votre première idée</span>
          </div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            disabled={done}
            rows={2}
            className="w-full text-xs rounded-xl border border-border bg-background px-3 py-2 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-violet-400/40 disabled:opacity-60"
          />
        </div>
      </div>

      {/* Generate button */}
      <AnimatePresence mode="wait">
        {!done ? (
          <motion.button
            key="btn"
            onClick={handleGenerate}
            disabled={loading || !text.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-bold py-2.5 shadow-md disabled:opacity-60 transition-all active:scale-[0.98]"
            whileTap={{ scale: 0.97 }}
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} className="animate-spin" />
                L'IA rédige{'...'.slice(0, dot + 1)}
              </span>
            ) : (
              <>🎙️ Lancer la génération IA</>
            )}
          </motion.button>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* AI output */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 px-3.5 py-3">
              <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 leading-relaxed">
                ☀️ Rejoignez-nous ce dimanche pour notre brunch signature ! Ambiance cosy garantie 🍳✨ Réservez votre table dès maintenant (lien en bio)
              </p>
            </div>
            {/* Badge */}
            <div className="flex items-center justify-center gap-2">
              <div className="relative">
                {[0,1,2,3,4,5,6,7].map(i => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0, x: Math.cos(i * 45 * Math.PI / 180) * 22, y: Math.sin(i * 45 * Math.PI / 180) * 22 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="absolute w-2 h-2 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{ background: ['#8b5cf6','#10b981','#f59e0b','#3b82f6','#ec4899','#f97316','#06b6d4','#84cc16'][i] }}
                  />
                ))}
                <span className="relative inline-flex items-center gap-1.5 text-xs font-extrabold rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 px-3 py-1.5">
                  🎓 Cockpit IA Maîtrisé !
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
