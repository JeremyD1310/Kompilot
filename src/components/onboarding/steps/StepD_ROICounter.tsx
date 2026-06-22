/**
 * StepD_ROICounter — ROI Growth Counter (final step)
 * Animates 3 KPI counters, takes average basket input, shows financial impact.
 */
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Phone, MapPin, CalendarCheck } from 'lucide-react';

interface Props { onComplete: () => void }

interface StatConfig {
  icon: React.ReactNode;
  target: number;
  label: string;
  color: string;
}

const STATS: StatConfig[] = [
  { icon: <Phone size={16} />, target: 23, label: 'appels générés', color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' },
  { icon: <MapPin size={16} />, target: 47, label: 'demandes d\'itinéraires', color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800' },
  { icon: <CalendarCheck size={16} />, target: 31, label: 'réservations', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' },
];

function AnimatedCounter({ target, running }: { target: number; running: boolean }) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const duration = 1500;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [running, target]);

  return <span>{value}</span>;
}

export function StepD_ROICounter({ onComplete }: Props) {
  const [running, setRunning] = useState(false);
  const [basket, setBasket] = useState(45);

  useEffect(() => {
    // Start counter animation after a brief delay
    const t = setTimeout(() => setRunning(true), 300);
    return () => clearTimeout(t);
  }, []);

  const totalActions = STATS.reduce((sum, s) => sum + s.target, 0); // 101 — but brief says 78
  const leads = 78; // per spec: "78 × 45€"
  const estimated = leads * basket;

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="text-center space-y-1 pb-1">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="text-3xl"
        >
          🎉
        </motion.div>
        <h3 className="text-sm font-extrabold text-foreground">Votre cockpit est prêt !</h3>
        <p className="text-[11px] text-muted-foreground">Voici ce que Kompilot a généré ce mois-ci :</p>
      </div>

      {/* KPI counters */}
      <div className="grid grid-cols-3 gap-2">
        {STATS.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={`rounded-2xl border px-2.5 py-3 flex flex-col items-center gap-1.5 ${stat.color}`}
          >
            <div className="opacity-80">{stat.icon}</div>
            <p className="text-xl font-extrabold text-foreground tabular-nums leading-none">
              <AnimatedCounter target={stat.target} running={running} />
            </p>
            <p className="text-[9px] text-center text-muted-foreground leading-tight">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Basket input + ROI calculation */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.35 }}
        className="rounded-2xl border border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-950/20 p-4 space-y-3"
      >
        <p className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-widest">
          💰 Calculateur de ROI
        </p>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-foreground whitespace-nowrap shrink-0">
            Panier moyen client (€)
          </label>
          <input
            type="number"
            min={1}
            value={basket}
            onChange={e => setBasket(Math.max(1, Number(e.target.value)))}
            className="w-20 rounded-xl border border-teal-300 dark:border-teal-700 bg-card text-center text-sm font-bold text-foreground px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all"
          />
        </div>

        {/* Estimation display */}
        <motion.div
          key={estimated}
          initial={{ scale: 0.97 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2 rounded-xl bg-card border border-teal-200 dark:border-teal-800 px-3 py-2.5"
        >
          <TrendingUp size={16} className="text-teal-600 shrink-0" />
          <p className="text-xs font-bold text-foreground">
            Estimation :{' '}
            <span className="text-teal-700 dark:text-teal-400">
              {leads} × {basket}€ ={' '}
            </span>
            <span className="text-lg font-extrabold text-teal-600 dark:text-teal-400">
              {estimated.toLocaleString('fr-FR')}€
            </span>{' '}
            générés
          </p>
        </motion.div>
      </motion.div>

      {/* CTA */}
      <motion.button
        onClick={onComplete}
        whileTap={{ scale: 0.97 }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.35 }}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-extrabold py-3 shadow-lg"
      >
        Réclamer mes crédits offerts et lancer mon essai gratuit 🚀
      </motion.button>
    </div>
  );
}
