/**
 * CountryBreakdownTable — Mini-table showing Meta Ads Location Fees by country.
 *
 * Displays: flag, country name, raw spend, fee rate, fee amount.
 * Premium dark-mode style, compact layout.
 */

import { motion } from 'framer-motion';

interface CountryFee {
  country: string;
  label: string;
  flag: string;
  raw_spend: number;
  fee_rate: number;
  fee_display: string;
  location_fee_amount: number;
  real_spend: number;
}

interface CountryBreakdownTableProps {
  countries: CountryFee[];
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

export function CountryBreakdownTable({
  countries,
  currency = 'EUR',
  loading = false,
}: CountryBreakdownTableProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 animate-pulse space-y-3">
        <div className="h-4 w-40 bg-muted rounded" />
        {[0, 1, 2].map(i => (
          <div key={i} className="h-10 w-full bg-muted/50 rounded" />
        ))}
      </div>
    );
  }

  if (countries.length === 0) return null;

  // Sort by fee amount descending
  const sorted = [...countries].sort((a, b) => b.location_fee_amount - a.location_fee_amount);

  // Total fees
  const totalFees = sorted.reduce((s, c) => s + c.location_fee_amount, 0);
  const totalSpend = sorted.reduce((s, c) => s + c.raw_spend, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] as const }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-sm font-bold text-foreground">Frais par pays</h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Location Fees Meta Ads — détail par pays de diffusion
        </p>
      </div>

      {/* Table */}
      <div className="px-5 pb-2">
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_80px_60px_80px] gap-2 px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          <span>Pays</span>
          <span className="text-right">Spend</span>
          <span className="text-center">Taux</span>
          <span className="text-right">Frais</span>
        </div>

        {/* Rows */}
        <div className="space-y-1">
          {sorted.map((row, i) => (
            <motion.div
              key={row.country}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
              className="grid grid-cols-[1fr_80px_60px_80px] gap-2 items-center px-3 py-2.5 rounded-xl hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base">{row.flag}</span>
                <span className="text-sm font-medium text-foreground truncate">{row.label}</span>
              </div>
              <span className="text-sm text-muted-foreground text-right font-mono">
                {formatCurrency(row.raw_spend, currency)}
              </span>
              <span className="text-xs text-amber-500 text-center font-bold">
                {row.fee_display}
              </span>
              <span className="text-sm font-bold text-amber-500 text-right font-mono">
                +{formatCurrency(row.location_fee_amount, currency)}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer total */}
      <div className="px-5 py-3 border-t border-border bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Total spend</span>
            <span className="text-xs font-mono text-muted-foreground">
              {formatCurrency(totalSpend, currency)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Total frais</span>
            <span className="text-sm font-black text-amber-500 font-mono">
              +{formatCurrency(totalFees, currency)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
