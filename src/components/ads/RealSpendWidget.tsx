/**
 * RealSpendWidget — Analytics card showing real Meta Ads spend with location fees.
 *
 * Displays 3 metrics hierarchically:
 *   1. Spend API (raw Meta budget)
 *   2. Location Fees (cumulative tax)
 *   3. Total Facturé Réel (prominent — the real cost)
 */

import { motion } from 'framer-motion';
import { Euro, TrendingUp, Info, ArrowRight } from 'lucide-react';

interface RealSpendWidgetProps {
  rawSpend: number;
  locationFees: number;
  realSpend: number;
  currency?: string;
  loading?: boolean;
}

function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function RealSpendWidget({
  rawSpend,
  locationFees,
  realSpend,
  currency = 'EUR',
  loading = false,
}: RealSpendWidgetProps) {
  const feePercent = rawSpend > 0 ? ((locationFees / rawSpend) * 100).toFixed(1) : '0';

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 animate-pulse">
        <div className="h-4 w-32 bg-muted rounded mb-4" />
        <div className="h-10 w-24 bg-muted rounded mb-3" />
        <div className="h-3 w-full bg-muted rounded" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-0">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Euro size={15} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Dépenses Réelles Meta Ads</h3>
            <p className="text-[10px] text-muted-foreground">Inclut les Location Fees</p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="px-5 pb-5 space-y-3">
        {/* Raw Spend */}
        <div className="flex items-center justify-between py-2 border-b border-border/50">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Spend API</p>
            <p className="text-lg font-black text-foreground">{formatCurrency(rawSpend, currency)}</p>
          </div>
          <span className="text-[10px] text-muted-foreground">Budget brut Meta</span>
        </div>

        {/* Location Fees */}
        <div className="flex items-center justify-between py-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Location Fees
              </p>
              <p className="text-lg font-black text-amber-500">
                +{formatCurrency(locationFees, currency)}
              </p>
            </div>
            {/* Tooltip */}
            <div className="group relative">
              <button className="p-1 rounded hover:bg-muted/50 transition-colors">
                <Info size={12} className="text-muted-foreground" />
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-popover border border-border shadow-lg text-xs text-muted-foreground w-56 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <p className="font-bold text-foreground mb-1">Qu'est-ce que les Location Fees ?</p>
                <p>Depuis le 1er juillet 2026, Meta facture des frais réglementaires supplémentaires selon le pays de diffusion (2% à 5%). Ces frais ne sont pas inclus dans le "spend" de l'API Meta.</p>
              </div>
            </div>
          </div>
          <span className="text-xs text-amber-500/70 font-medium">+{feePercent}%</span>
        </div>

        {/* Real Total — Prominent */}
        <div className="rounded-xl bg-primary/5 border border-primary/15 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
                Total Facturé Réel
              </p>
              <p className="text-2xl font-black text-foreground">
                {formatCurrency(realSpend, currency)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp size={20} className="text-primary" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
