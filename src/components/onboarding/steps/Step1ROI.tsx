import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart2 } from 'lucide-react';

const SECTORS = [
  { value: 'restaurant', label: '🍽️ Restaurant' },
  { value: 'beaute', label: '💅 Beauté & Bien-être' },
  { value: 'commerce', label: '🛍️ Commerce / Retail' },
  { value: 'sante', label: '🏥 Santé & Médical' },
  { value: 'sport', label: '🏋️ Sport & Fitness' },
  { value: 'artisan', label: '🔨 Artisan' },
];

export function Step1ROI() {
  const [basket, setBasket] = useState('45');
  const [sector, setSector] = useState('restaurant');
  const roiEstimate = Math.round(Number(basket) * 12 * 4.3);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-foreground/70 mb-1.5">Panier moyen client</label>
          <div className="relative">
            <input
              type="number"
              value={basket}
              onChange={e => setBasket(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/40 px-3 pr-8 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400/60"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">€</span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-foreground/70 mb-1.5">Secteur d'activité</label>
          <select
            value={sector}
            onChange={e => setSector(e.target.value)}
            className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400/60 appearance-none"
          >
            {SECTORS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <motion.div
        key={roiEstimate}
        initial={{ scale: 0.96, opacity: 0.7 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200/60 p-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shrink-0 shadow-md shadow-teal-200">
            <BarChart2 size={18} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-0.5">Predictive ROI estimé</p>
            <p className="text-2xl font-extrabold text-teal-800 leading-none">
              +{roiEstimate.toLocaleString('fr-FR')} €<span className="text-sm font-bold">/an</span>
            </p>
            <p className="text-[11px] text-teal-600 mt-1">Basé sur 12 posts/mois · Taux de conversion moyen du secteur</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Posts/mois', value: '12' },
            { label: 'Nouveaux clients', value: '+8' },
            { label: 'CA additionnel', value: `${Math.round(roiEstimate / 12).toLocaleString('fr-FR')} €/m` },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl bg-white/70 px-2 py-1.5">
              <p className="text-xs font-extrabold text-teal-800">{stat.value}</p>
              <p className="text-[10px] text-teal-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
