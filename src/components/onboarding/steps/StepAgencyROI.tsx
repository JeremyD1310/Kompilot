/**
 * StepAgencyROI — Onboarding step Agence : Simulateur ROI multi-clients
 * Montre à l'agence son potentiel de revenus avec Kompilot en marque blanche.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, ArrowRight, Euro } from 'lucide-react';

interface Props { onComplete: () => void }

const PLANS = [
  { id: 'starter', label: 'Starter', priceClient: 49, color: 'bg-slate-500' },
  { id: 'growth', label: 'Growth', priceClient: 99, color: 'bg-blue-500', popular: true },
  { id: 'premium', label: 'Premium', priceClient: 199, color: 'bg-violet-500' },
];

export function StepAgencyROI({ onComplete }: Props) {
  const [clientCount, setClientCount] = useState(5);
  const [selectedPlan, setSelectedPlan] = useState('growth');
  const plan = PLANS.find(p => p.id === selectedPlan)!;

  const mrr = clientCount * plan.priceClient;
  const kompilotCost = 97; // agency plan cost
  const profit = mrr - kompilotCost;
  const margin = Math.round((profit / mrr) * 100);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800 px-3.5 py-3 flex items-start gap-2.5">
        <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
          <strong>SIMULATEUR ROI AGENCE :</strong> Voyez exactement combien votre agence peut
          générer chaque mois en revendant Kompilot sous votre marque.
        </p>
      </div>

      {/* Plan selector */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          Votre offre client
        </p>
        <div className="grid grid-cols-3 gap-2">
          {PLANS.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPlan(p.id)}
              className={`relative flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 px-2 text-center transition-all ${
                selectedPlan === p.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
              }`}
            >
              {p.popular && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-black bg-blue-500 text-white rounded-full px-2 py-0.5 uppercase whitespace-nowrap">
                  Populaire
                </span>
              )}
              <div className={`w-5 h-5 rounded-md ${p.color} flex items-center justify-center`}>
                <span className="text-white text-[8px] font-black">€</span>
              </div>
              <span className="text-[10px] font-bold text-foreground">{p.label}</span>
              <span className="text-xs font-black text-primary">{p.priceClient}€/m</span>
            </button>
          ))}
        </div>
      </div>

      {/* Client count slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Users size={11} />
            Nombre de clients
          </p>
          <span className="text-base font-black text-primary">{clientCount}</span>
        </div>
        <input
          type="range"
          min="1"
          max="50"
          value={clientCount}
          onChange={e => setClientCount(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none bg-muted cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>1 client</span>
          <span>25 clients</span>
          <span>50 clients</span>
        </div>
      </div>

      {/* ROI result */}
      <motion.div
        key={`${clientCount}-${selectedPlan}`}
        initial={{ opacity: 0.7, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 p-4 space-y-3"
      >
        <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
          Votre potentiel mensuel
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">{mrr}€</p>
            <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">MRR total</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black text-teal-700 dark:text-teal-300">{profit}€</p>
            <p className="text-[10px] text-teal-600/80 dark:text-teal-400/80">Profit net</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black text-blue-700 dark:text-blue-300">{margin}%</p>
            <p className="text-[10px] text-blue-600/80 dark:text-blue-400/80">Marge</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-white/60 dark:bg-white/5 border border-emerald-200/60 dark:border-emerald-800/40 px-3 py-2">
          <Euro size={12} className="text-emerald-600 shrink-0" />
          <p className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold">
            Coût Kompilot Agency : {kompilotCost}€/mois tout inclus, clients illimités
          </p>
        </div>
      </motion.div>

      {/* Yearly projection */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-3.5 py-3 flex items-center gap-3">
        <span className="text-xl">🚀</span>
        <div>
          <p className="text-xs font-black text-amber-800 dark:text-amber-300">
            Projection annuelle : {(profit * 12).toLocaleString()}€
          </p>
          <p className="text-[10px] text-amber-700 dark:text-amber-400">
            avec {clientCount} clients au plan {plan.label}
          </p>
        </div>
      </div>

      <button
        onClick={onComplete}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold py-2.5 shadow-md transition-all active:scale-[0.98]"
      >
        Configurer mon agence
        <ArrowRight size={14} />
      </button>
    </div>
  );
}
