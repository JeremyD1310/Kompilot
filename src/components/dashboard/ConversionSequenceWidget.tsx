/**
 * ConversionSequenceWidget — Séquence de Conversion omnicanale.
 * Retrace graphiquement les 4 points de contact Kompilot ayant mené à l'encaissement :
 * GEO ➔ Social ➔ DM ➔ Caissier.
 * Affiche le canal le plus rentable du mois sous forme de recommandation maïeutique.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Share2, MessageCircle, CreditCard, TrendingUp, ChevronRight, ArrowRight, Info } from 'lucide-react';
import { Badge } from '@blinkdotnew/ui';

interface Touchpoint {
  id: string;
  label: string;
  sublabel: string;
  icon: typeof MapPin;
  color: string;
  bgColor: string;
  borderColor: string;
  conversions: number;
  revenue: number;
  pct: number;
  isBest?: boolean;
}

const TOUCHPOINTS: Touchpoint[] = [
  {
    id: 'geo',
    label: 'Référencement Local',
    sublabel: 'Google Maps · GEO',
    icon: MapPin,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800/50',
    conversions: 142,
    revenue: 4260,
    pct: 22,
  },
  {
    id: 'social',
    label: 'Réseaux Sociaux',
    sublabel: 'Instagram · Facebook',
    icon: Share2,
    color: 'text-violet-500',
    bgColor: 'bg-violet-50 dark:bg-violet-950/30',
    borderColor: 'border-violet-200 dark:border-violet-800/50',
    conversions: 89,
    revenue: 2670,
    pct: 18,
  },
  {
    id: 'dm',
    label: 'Message Direct',
    sublabel: 'DM · WhatsApp · SMS',
    icon: MessageCircle,
    color: 'text-teal-500',
    bgColor: 'bg-teal-50 dark:bg-teal-950/30',
    borderColor: 'border-teal-200 dark:border-teal-800/50',
    conversions: 211,
    revenue: 6330,
    pct: 41,
    isBest: true,
  },
  {
    id: 'caissier',
    label: 'Caissier',
    sublabel: 'Coupons · Empreintes',
    icon: CreditCard,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800/50',
    conversions: 97,
    revenue: 2910,
    pct: 19,
  },
];

const TOTAL_REVENUE = TOUCHPOINTS.reduce((sum, t) => sum + t.revenue, 0);
const BEST = TOUCHPOINTS.find(t => t.isBest)!;

export function ConversionSequenceWidget() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Collapsed header — always visible */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors text-left"
        onClick={() => setExpanded(v => !v)}
        type="button"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Séquence de Conversion</h3>
            <p className="text-xs text-muted-foreground">Attribution omnicanale · 30 derniers jours</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700 text-[11px]">
            {TOTAL_REVENUE.toLocaleString('fr-FR')} € attribués
          </Badge>
          <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-5 pb-5 pt-4 space-y-4">
              {/* Touchpoint flow */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {TOUCHPOINTS.map((tp, i) => {
                  const Icon = tp.icon;
                  return (
                    <div key={tp.id} className="relative">
                      <div className={`rounded-xl border ${tp.bgColor} ${tp.borderColor} p-3 flex flex-col items-center text-center gap-1.5 h-full ${tp.isBest ? 'ring-2 ring-amber-400/40' : ''}`}>
                        {tp.isBest && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[9px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap">
                            ★ MEILLEUR
                          </span>
                        )}
                        <div className={`w-8 h-8 rounded-lg ${tp.bgColor} border ${tp.borderColor} flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${tp.color}`} />
                        </div>
                        <p className="text-xs font-bold text-foreground leading-tight">{tp.label}</p>
                        <p className="text-[10px] text-muted-foreground">{tp.sublabel}</p>
                        <div className="mt-auto pt-1 space-y-0.5">
                          <p className={`text-sm font-extrabold ${tp.color}`}>
                            {tp.revenue.toLocaleString('fr-FR')} €
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {tp.conversions} conv. · {tp.pct}%
                          </p>
                        </div>
                      </div>
                      {/* Arrow connector on desktop */}
                      {i < TOUCHPOINTS.length - 1 && (
                        <div className="hidden sm:flex absolute top-1/2 -right-2.5 -translate-y-1/2 z-10 w-5 h-5 items-center justify-center">
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Progress bars */}
              <div className="space-y-2">
                {TOUCHPOINTS.map(tp => {
                  const Icon = tp.icon;
                  return (
                    <div key={tp.id} className="flex items-center gap-3">
                      <Icon className={`w-3.5 h-3.5 ${tp.color} shrink-0`} />
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${tp.id === 'geo' ? 'bg-blue-500' : tp.id === 'social' ? 'bg-violet-500' : tp.id === 'dm' ? 'bg-teal-500' : 'bg-emerald-500'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${tp.pct}%` }}
                          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-foreground w-8 text-right">{tp.pct}%</span>
                    </div>
                  );
                })}
              </div>

              {/* Premium recommendation */}
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 px-4 py-3.5 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0 mt-0.5">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    Canal le plus rentable ce mois :{' '}
                    <span className="text-amber-600 dark:text-amber-400">Message Direct (DM)</span>
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                    41% de vos encaissements proviennent de séquences DM + WhatsApp + SMS. <strong>Question :</strong> avez-vous activé la réactivation automatique des clients inactifs depuis 30 jours via ce canal ? Ce seul levier peut générer +18% de CA récurrent selon les performances de votre secteur.
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Info className="w-3 h-3 text-amber-500" />
                    <span className="text-[10px] text-amber-600 dark:text-amber-400">Attribution basée sur la dernière interaction avant encaissement</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
