import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

interface Props { onComplete: () => void }

const BUDGETS = [
  { label: '5€/jour', reach: 1200 },
  { label: '10€/jour', reach: 2400 },
  { label: '20€/jour', reach: 4800 },
];

export function Step5MicroAds({ onComplete }: Props) {
  const [radius, setRadius]   = useState(10);
  const [budget, setBudget]   = useState('');

  const isComplete = !!budget;

  const handleRadius = (v: number) => {
    setRadius(v);
    if (budget) onComplete();
  };

  const handleBudget = (b: string) => {
    setBudget(b);
    onComplete();
  };

  const selectedBudget = BUDGETS.find(b => b.label === budget);
  const estimatedReach = selectedBudget ? Math.round(selectedBudget.reach * (radius / 10)) : 0;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 px-3.5 py-3 flex items-start gap-2.5">
        <span className="text-base shrink-0">🚀</span>
        <p className="text-[11px] text-orange-800 dark:text-orange-300 leading-relaxed">
          <strong>PUBLICITÉ IA :</strong> Lancez une campagne publicitaire locale sur Meta et Google en 3 clics. Définissez votre budget et votre rayon géographique, l'IA cible automatiquement les clients potentiels autour de vous.
        </p>
      </div>

      {/* Radius map visual */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <p className="text-xs font-bold text-foreground">📍 Rayon de ciblage : <span className="text-primary">{radius} km</span></p>
        {/* Visual map circle */}
        <div className="flex items-center justify-center py-3">
          <div className="relative flex items-center justify-center">
            {[1, 0.65, 0.38].map((scale, i) => (
              <div
                key={i}
                className="absolute rounded-full border border-primary/20 bg-primary/5"
                style={{ width: `${scale * 120}px`, height: `${scale * 120}px` }}
              />
            ))}
            <div className="relative w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md z-10">
              <span className="text-white text-base">📍</span>
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <input
            type="range"
            min={5} max={30} step={5}
            value={radius}
            onChange={e => handleRadius(Number(e.target.value))}
            className="w-full accent-primary cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-muted-foreground">
            {[5,10,15,20,25,30].map(v => <span key={v}>{v}km</span>)}
          </div>
        </div>
      </div>

      {/* Budget selector */}
      <div>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2">💰 Budget quotidien</p>
        <div className="grid grid-cols-3 gap-2">
          {BUDGETS.map(b => (
            <button
              key={b.label}
              onClick={() => handleBudget(b.label)}
              className={cn(
                'rounded-xl border-2 py-2.5 text-xs font-bold transition-all',
                budget === b.label
                  ? 'border-primary bg-primary/5 text-primary shadow-sm'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40'
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Confirmation */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 px-3.5 py-3 space-y-1"
          >
            <p className="text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300">
              🎯 Campagne prête ! Vous ciblez le bon périmètre pour attirer du monde en boutique.
            </p>
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
              Portée estimée : <strong>~{estimatedReach.toLocaleString('fr-FR')} personnes</strong> dans un rayon de {radius} km
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
