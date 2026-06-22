/**
 * DMSalesWidget
 * Shows the "Ventes réelles générées via messages privés" metric in the dashboard.
 * Highlights the ROI of the automated DM trigger system.
 */
import { useState } from 'react';
import { MessageSquare, TrendingUp, ArrowRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from '@tanstack/react-router';

interface DmStat {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}

// Simulated data — in production this would come from referral_conversions + trigger analytics
const STATS: DmStat[] = [
  { label: 'Messages auto envoyés', value: '47',  sub: 'ce mois',      color: 'text-primary'       },
  { label: 'Taux de conversion',    value: '34%', sub: 'clics → vente', color: 'text-emerald-600'   },
  { label: 'Ventes générées',       value: '16',  sub: 'via DM auto',   color: 'text-amber-600'     },
  { label: 'CA estimé',             value: '640 €', sub: '+12% vs mois dernier', color: 'text-teal-600' },
];

const RECENT_TRIGGERS = [
  { keyword: 'RESERVER', name: 'Sophie M.',   time: 'Il y a 2h',  converted: true,  amount: 45 },
  { keyword: 'MENU',     name: '@julien.chef', time: 'Il y a 5h',  converted: false, amount: 0 },
  { keyword: 'PROMO',    name: 'Thomas L.',   time: 'Il y a 8h',  converted: true,  amount: 38 },
  { keyword: 'RESERVER', name: '@marie_lbd',  time: 'Hier',       converted: true,  amount: 52 },
];

export function DMSalesWidget() {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-teal-50/50 dark:to-teal-950/20">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
          <MessageSquare size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            Ventes via Messages Privés
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
              <Zap size={8} /> Automatique
            </span>
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            Conversions générées par vos déclencheurs de commentaire → DM
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 shrink-0">
          <TrendingUp size={12} />
          +12%
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-border/60 border-b border-border/60">
        {STATS.map(stat => (
          <div key={stat.label} className="flex flex-col gap-0.5 px-4 py-3">
            <p className={`text-xl font-extrabold tracking-tight leading-none ${stat.color}`}>
              {stat.value}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{stat.label}</p>
            {stat.sub && <p className="text-[9px] text-muted-foreground/60">{stat.sub}</p>}
          </div>
        ))}
      </div>

      {/* Recent triggers */}
      <div className="px-5 py-3.5 space-y-2.5">
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-2 text-xs font-semibold text-foreground hover:text-primary transition-colors w-full"
        >
          <span className="flex-1 text-left">Derniers déclenchements</span>
          <span className="text-[10px] text-muted-foreground font-normal">
            {expanded ? 'Masquer' : 'Voir tout'}
          </span>
          <ArrowRight size={12} className={`text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>

        {(expanded ? RECENT_TRIGGERS : RECENT_TRIGGERS.slice(0, 2)).map((tr, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-teal-200 flex items-center justify-center shrink-0 text-[10px] font-bold text-primary">
              {tr.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-foreground truncate">{tr.name}</span>
                <span className="text-[10px] font-bold bg-muted text-muted-foreground rounded px-1 font-mono">{tr.keyword}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{tr.time}</p>
            </div>
            <div className="shrink-0 text-right">
              {tr.converted ? (
                <span className="text-[11px] font-bold text-emerald-600">+{tr.amount} €</span>
              ) : (
                <span className="text-[10px] text-muted-foreground">En attente</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA footer */}
      <div className="px-5 pb-4">
        <Link
          to="/inbox"
          className="flex items-center justify-center gap-2 w-full rounded-xl border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors py-2 text-xs font-semibold"
        >
          <Zap size={12} />
          Gérer mes Triggers de Vente
          <ArrowRight size={12} />
        </Link>
      </div>
    </motion.div>
  );
}
