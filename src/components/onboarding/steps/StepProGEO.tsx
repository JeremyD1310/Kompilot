/**
 * StepProGEO — Onboarding step Pro: Visibilité GEO + IA locale
 * Montre le scan de visibilité IA (ChatGPT, Gemini, Perplexity) avec appel-à-action.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Sparkles, ArrowRight, TrendingUp } from 'lucide-react';

interface Props { onComplete: () => void; sector?: string }

const GEO_PLATFORMS = [
  { name: 'Google IA', icon: '🔍', score: 34, color: 'from-blue-500 to-blue-400', textColor: 'text-blue-600 dark:text-blue-400' },
  { name: 'ChatGPT', icon: '🤖', score: 18, color: 'from-emerald-500 to-emerald-400', textColor: 'text-emerald-600 dark:text-emerald-400' },
  { name: 'Perplexity', icon: '⚡', score: 11, color: 'from-violet-500 to-violet-400', textColor: 'text-violet-600 dark:text-violet-400' },
];

const ACTIONS = [
  { icon: '📝', title: 'Citations manquantes', desc: '12 annuaires non renseignés', urgent: true },
  { icon: '⭐', title: 'Mots-clés enrichis', desc: 'Optimiser votre fiche Google', urgent: false },
  { icon: '📸', title: 'Photos manquantes', desc: 'Ajoutez 5 photos pour +18% de clics', urgent: false },
];

export function StepProGEO({ onComplete, sector = 'votre secteur' }: Props) {
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleScan = () => {
    setScanning(true);
    let p = 0;
    const interval = setInterval(() => {
      p += 4;
      setProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(interval);
        setScanning(false);
        setScanned(true);
        setTimeout(onComplete, 800);
      }
    }, 60);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-950/30 dark:to-violet-950/20 border border-blue-200 dark:border-blue-800 px-3.5 py-3 flex items-start gap-2.5">
        <MapPin size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
          <strong>RADAR G.E.O. IA :</strong> Votre commerce est-il visible sur ChatGPT, Gemini & Google IA ?
          Découvrez votre score en direct et les actions prioritaires.
        </p>
      </div>

      {/* Score overview */}
      <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4 space-y-3 relative overflow-hidden">
        {scanning && (
          <motion.div
            initial={{ top: '0%' }}
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
            className="absolute left-0 right-0 h-px bg-teal-400/70 shadow-[0_0_8px_2px_rgba(45,212,191,0.4)] pointer-events-none"
          />
        )}

        <p className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">
          🤖 Score GEO simulé pour {sector}
        </p>

        <div className="space-y-2.5">
          {GEO_PLATFORMS.map((platform, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                  <span>{platform.icon}</span>
                  {platform.name}
                </span>
                <span className={`font-bold tabular-nums ${platform.textColor}`}>
                  {scanned ? platform.score : '??'}<span className="text-xs text-zinc-500">/100</span>
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${platform.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: scanned ? `${platform.score}%` : scanning ? `${progress * 0.3}%` : 0 }}
                  transition={{ duration: 0.7, delay: scanned ? i * 0.15 : 0, ease: 'easeOut' }}
                />
              </div>
            </div>
          ))}
        </div>

        <AnimatePresence>
          {scanned && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 flex items-center gap-2"
            >
              <span className="text-sm">⚠️</span>
              <p className="text-[11px] text-red-400 font-semibold">
                Score moyen : 21/100 — Vos concurrents captent vos clients sur l'IA.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Priority actions — show after scan */}
      <AnimatePresence>
        {scanned && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp size={11} />
              Actions prioritaires détectées
            </p>
            {ACTIONS.map((action, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 ${
                  action.urgent
                    ? 'border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800'
                    : 'border-border bg-muted/30'
                }`}
              >
                <span className="text-base">{action.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold ${action.urgent ? 'text-orange-700 dark:text-orange-300' : 'text-foreground'}`}>
                    {action.title}
                    {action.urgent && <span className="ml-1.5 text-[9px] font-black bg-orange-500 text-white rounded-full px-1.5 py-0.5 uppercase">Urgent</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{action.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      {!scanned && (
        <button
          onClick={handleScan}
          disabled={scanning}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-bold py-2.5 shadow-md disabled:opacity-70 transition-all active:scale-[0.98]"
        >
          {scanning ? (
            <>
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              Scan en cours… {progress}%
            </>
          ) : (
            <>
              <Sparkles size={14} />
              Lancer mon scan GEO IA
              <ArrowRight size={14} />
            </>
          )}
        </button>
      )}
    </div>
  );
}
