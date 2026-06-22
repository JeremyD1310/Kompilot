/**
 * Step7Serenity — Onboarding step showcasing two new protection systems:
 * 1. Sérénité Activée — the dashboard post counter + next post preview widget
 * 2. Safe Mode — automatic fallback when an external API fails
 *
 * The user clicks "Voir ma sérénité" to reveal the demo widget,
 * then clicks "Tester le Safe Mode" to see the error-protection simulation.
 * Both interactions are required to unlock "Suivant".
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp, CalendarDays, ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react';

interface Props { onComplete: () => void }

type SafePhase = 'idle' | 'error' | 'fallback';

export function Step7Serenity({ onComplete }: Props) {
  const [serenityVisible, setSerenityVisible] = useState(false);
  const [safePhase, setSafePhase] = useState<SafePhase>('idle');
  const [completedSerenity, setCompletedSerenity] = useState(false);
  const [completedSafe, setCompletedSafe] = useState(false);

  const handleShowSerenity = () => {
    setSerenityVisible(true);
    setCompletedSerenity(true);
    if (completedSafe) onComplete();
  };

  const handleSafeMode = () => {
    setSafePhase('error');
    setTimeout(() => {
      setSafePhase('fallback');
      setCompletedSafe(true);
      if (completedSerenity) onComplete();
    }, 1400);
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 px-3.5 py-3 flex items-start gap-2.5">
        <span className="text-base shrink-0">⚡</span>
        <p className="text-[11px] text-teal-800 dark:text-teal-300 leading-relaxed">
          <strong>SÉRÉNITÉ & PROTECTION :</strong> Deux nouveaux modules assurent votre tranquillité. Le tableau de bord affiche vos posts planifiés en temps réel, et le Safe Mode protège votre application si une API externe tombe en panne.
        </p>
      </div>

      {/* ── Block 1 : Sérénité Activée ── */}
      <div className="rounded-2xl border-2 border-teal-300 dark:border-teal-700 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/10 p-4 space-y-3">
        <p className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-widest">⚡ Widget Sérénité Activée</p>

        <AnimatePresence mode="wait">
          {!serenityVisible ? (
            <motion.button
              key="show-btn"
              onClick={handleShowSerenity}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-bold py-2.5 shadow-md transition-all active:scale-[0.98]"
            >
              <Zap size={14} /> Voir ma sérénité sur le dashboard
            </motion.button>
          ) : (
            <motion.div
              key="serenity-widget"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-2.5"
            >
              {/* Top row */}
              <div className="flex items-center gap-3 rounded-xl bg-card/80 border border-teal-200 dark:border-teal-800 px-3 py-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0">
                  <Zap size={15} className="text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-extrabold text-foreground leading-tight">
                    ⚡ Sérénité Activée — <span className="text-primary">12 posts planifiés</span> pour les 30 prochains jours.
                  </p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <TrendingUp size={9} className="text-emerald-500" />
                    Visibilité locale : <strong className="text-emerald-600">+124% ce mois-ci</strong>
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-lg px-2 py-1">
                  <CalendarDays size={10} /> Calendrier
                </div>
              </div>

              {/* Next post mini card */}
              <div className="flex items-start gap-2.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-card/60 px-3 py-2.5">
                <div className="flex flex-col gap-1 pt-0.5 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-blue-600" title="LinkedIn" />
                  <span className="w-2 h-2 rounded-full bg-pink-500" title="Instagram" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wide mb-0.5">Prochain post planifié</p>
                  <p className="text-[11px] text-foreground leading-snug line-clamp-2">
                    🚀 Découvrez notre nouvelle fonctionnalité IA qui va révolutionner votre présence sur les réseaux sociaux…
                  </p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className="text-[9px] font-semibold text-muted-foreground bg-muted/60 rounded-full px-1.5 py-0.5">Demain 09:00</span>
                  <span className="text-[9px] font-bold bg-primary/10 text-primary rounded-full px-1.5 py-0.5">Planifié</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Block 2 : Safe Mode ── */}
      <div className="rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/10 p-4 space-y-3">
        <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest">🛡️ Safe Mode — Protection API</p>

        <AnimatePresence mode="wait">
          {safePhase === 'idle' && (
            <motion.div key="idle" className="space-y-2">
              <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                Si ChatGPT, Gemini ou WhatsApp tombent en panne, <strong>l'app ne se bloque jamais</strong>. Elle bascule automatiquement sur les données en cache.
              </p>
              <motion.button
                onClick={handleSafeMode}
                whileTap={{ scale: 0.97 }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold py-2.5 shadow-md transition-all"
              >
                <ShieldCheck size={14} /> Simuler une panne API
              </motion.button>
            </motion.div>
          )}

          {safePhase === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800 px-3.5 py-3"
            >
              <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="text-xs font-bold text-red-700 dark:text-red-400">Erreur détectée : ChatGPT GEO timeout (503)</p>
                <p className="text-[11px] text-red-600 dark:text-red-500 mt-0.5 flex items-center gap-1">
                  <RefreshCw size={10} className="animate-spin" /> Activation du Safe Mode…
                </p>
              </div>
            </motion.div>
          )}

          {safePhase === 'fallback' && (
            <motion.div
              key="fallback"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-2"
            >
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/20 px-3 py-2.5">
                <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-amber-900 dark:text-amber-200">Optimisation en cours</p>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                    Analyse locale en cours d'optimisation. Résultats basés sur les dernières données disponibles.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2">
                <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  ✅ Navigation non bloquée — données de secours affichées automatiquement.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
