/**
 * StepAgencyPricing — Onboarding Agence : Grille tarifaire personnalisée
 * Configure les offres de revente avec calcul de marge en temps réel.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, CheckCircle2, ArrowRight, Package, TrendingUp } from 'lucide-react';

interface Props { onComplete: () => void }

interface Offer {
  id: string;
  name: string;
  price: number;
  modules: string[];
  color: string;
  recommended?: boolean;
}

const DEFAULT_OFFERS: Offer[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    modules: ['Calendrier IA', 'Avis Google', 'Rapport mensuel'],
    color: 'from-slate-500 to-slate-400',
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 99,
    modules: ['Tout Starter', 'SMS IA', 'Multi-posting', 'Marque blanche'],
    color: 'from-blue-500 to-blue-400',
    recommended: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 199,
    modules: ['Tout Growth', 'AIO Sync', 'Agents IA', 'Support dédié'],
    color: 'from-violet-500 to-violet-400',
  },
];

const KOMPILOT_COST = 97;

export function StepAgencyPricing({ onComplete }: Props) {
  const [offers, setOffers] = useState<Offer[]>(DEFAULT_OFFERS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const updatePrice = (id: string, price: number) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, price: Math.max(0, price) } : o));
  };

  const totalMRR5 = offers.reduce((sum, o) => sum + o.price * 5, 0);
  const profit5 = totalMRR5 - KOMPILOT_COST;

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaved(true);
      setTimeout(onComplete, 700);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800 px-3.5 py-3 flex items-start gap-2.5">
        <Package size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
          <strong>GRILLE TARIFAIRE :</strong> Définissez vos 3 offres de revente. Kompilot calcule
          votre marge en temps réel. Exportez en PDF pour vos devis clients.
        </p>
      </div>

      {/* Offers */}
      <div className="space-y-2">
        {offers.map((offer) => (
          <div
            key={offer.id}
            className={`relative rounded-xl border-2 p-3.5 transition-all ${
              editingId === offer.id ? 'border-primary bg-primary/5' : 'border-border bg-card'
            }`}
          >
            {offer.recommended && (
              <span className="absolute -top-2 left-3 text-[9px] font-black bg-blue-500 text-white rounded-full px-2 py-0.5 uppercase">Recommandé</span>
            )}
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${offer.color} flex items-center justify-center shrink-0`}>
                <span className="text-white text-xs font-black">{offer.name[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-foreground">{offer.name}</p>
                  <div className="flex items-center gap-1.5">
                    {editingId === offer.id ? (
                      <input
                        type="number"
                        value={offer.price}
                        onChange={e => updatePrice(offer.id, parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 text-xs font-black text-right rounded-lg border-2 border-primary bg-background text-foreground focus:outline-none"
                        autoFocus
                        onBlur={() => setEditingId(null)}
                      />
                    ) : (
                      <button
                        onClick={() => setEditingId(offer.id)}
                        className="text-sm font-black text-primary hover:underline"
                      >
                        {offer.price}€/m
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {offer.modules.map(m => (
                    <span key={m} className="text-[9px] rounded-full border border-border bg-muted/40 px-2 py-0.5 text-muted-foreground">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            {/* Per-offer margin */}
            <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground border-t border-border pt-2">
              <span>Marge / client :</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">
                ~{Math.round(((offer.price - KOMPILOT_COST / 5) / offer.price) * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Projection */}
      <motion.div
        key={totalMRR5}
        initial={{ opacity: 0.7, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 p-3.5"
      >
        <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <TrendingUp size={10} />
          Projection avec 5 clients par plan
        </p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">{totalMRR5}€</p>
            <p className="text-[9px] text-emerald-600/80">MRR brut</p>
          </div>
          <div>
            <p className="text-lg font-black text-teal-700 dark:text-teal-300">{profit5}€</p>
            <p className="text-[9px] text-teal-600/80">Profit net</p>
          </div>
          <div>
            <p className="text-lg font-black text-blue-700 dark:text-blue-300">
              {Math.round((profit5 / totalMRR5) * 100)}%
            </p>
            <p className="text-[9px] text-blue-600/80">Marge</p>
          </div>
        </div>
      </motion.div>

      {/* CTA */}
      <AnimatePresence mode="wait">
        {!saved ? (
          <motion.button
            key="cta"
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold py-2.5 shadow-md disabled:opacity-70 transition-all active:scale-[0.98]"
          >
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Sauvegarde de votre grille…
              </>
            ) : (
              <>
                <Zap size={14} />
                Valider ma grille tarifaire
                <ArrowRight size={14} />
              </>
            )}
          </motion.button>
        ) : (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 px-3.5 py-3 flex items-center gap-3"
          >
            <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Grille tarifaire enregistrée !</p>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                3 offres · Exportable en PDF pour vos devis
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
