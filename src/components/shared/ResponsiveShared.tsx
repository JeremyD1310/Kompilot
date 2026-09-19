/**
 * ResponsiveShared — Shared responsive components for mobile-first design.
 * - MobileKpiCard: Condensed KPI for mobile (replaces complex charts)
 * - AgencyBadge: Visual indicator for Agency-plan features
 * - UpgradeCTA: Smooth upsell CTA for Starter users
 * - DetailButton: "Analyse détaillée" toggle for mobile
 * - PlanGate: Wraps content with plan-based access control
 */
import { type ReactNode } from 'react';
import { Crown, Zap, Lock, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ── Mobile KPI Card (condensed for mobile data-density) ─────────────────────

interface MobileKpiCardProps {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: ReactNode;
  accent?: string;
}

export function MobileKpiCard({ label, value, change, trend, icon, accent = 'bg-primary/10 text-primary' }: MobileKpiCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground';

  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-4 nc-hover-lift">
      <div className="flex items-center gap-2 mb-1.5">
        {icon && (
          <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>
            {icon}
          </div>
        )}
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 truncate">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-lg sm:text-xl font-extrabold tabular-nums">{value}</span>
        {change && (
          <span className={`text-[10px] sm:text-[11px] font-bold flex items-center gap-0.5 ${trendColor}`}>
            <TrendIcon size={10} />
            {change}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Agency Badge ────────────────────────────────────────────────────────────

interface AgencyBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function AgencyBadge({ className = '', size = 'sm' }: AgencyBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 font-bold rounded-full border ${
      size === 'sm' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'
    } bg-gradient-to-r from-amber-500/10 to-amber-400/5 border-amber-500/20 text-amber-600 dark:text-amber-400 ${className}`}>
      <Crown size={size === 'sm' ? 9 : 11} />
      Agency
    </span>
  );
}

// ── Upgrade CTA (for Starter users blocked from Agency features) ────────────

interface UpgradeCTAProps {
  feature?: string;
  compact?: boolean;
  onUpgrade?: () => void;
}

export function UpgradeCTA({ feature = 'cette fonctionnalité', compact = false, onUpgrade }: UpgradeCTAProps) {
  if (compact) {
    return (
      <button
        onClick={onUpgrade}
        className="w-full flex items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-transparent px-4 py-3 text-left cursor-pointer transition-all hover:border-amber-500/40 hover:bg-amber-500/10"
        style={{ minHeight: 44 }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <Lock size={14} className="text-amber-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground truncate">{feature}</p>
            <p className="text-[10px] text-muted-foreground">Passez au plan Agency</p>
          </div>
        </div>
        <ChevronRight size={16} className="text-amber-500 shrink-0" />
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent p-5 text-center">
      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
        <Crown size={20} className="text-amber-500" />
      </div>
      <h3 className="text-sm font-bold text-foreground mb-1">{feature}</h3>
      <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
        Cette fonctionnalité est disponible avec le plan Agency. Débloquez-la pour analyser vos performances en détail.
      </p>
      <button
        onClick={onUpgrade}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all bg-gradient-to-r from-amber-500 to-amber-400 text-white hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-500/20"
        style={{ minHeight: 44 }}
      >
        <Zap size={14} />
        Passer au plan Agency
      </button>
    </div>
  );
}

// ── Detail Button (mobile: show "Analyse détaillée" to expand) ──────────────

interface DetailButtonProps {
  isOpen: boolean;
  onClick: () => void;
  label?: string;
}

export function DetailButton({ isOpen, onClick, label }: DetailButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-muted/30 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer nc-desktop-hide"
      style={{ minHeight: 44 }}
    >
      <Zap size={12} />
      {isOpen ? 'Masquer les détails' : (label || 'Analyse détaillée')}
      <ChevronRight size={14} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
    </button>
  );
}

// ── Plan Gate (wraps content with plan check) ───────────────────────────────

interface PlanGateProps {
  currentPlan: string;
  requiredPlan: 'agency';
  children: ReactNode;
  fallback?: ReactNode;
  onUpgrade?: () => void;
}

export function PlanGate({ currentPlan, requiredPlan, children, fallback, onUpgrade }: PlanGateProps) {
  const hierarchy: Record<string, number> = { starter: 1, agency: 2 };
  const hasAccess = (hierarchy[currentPlan] || 0) >= (hierarchy[requiredPlan] || 0);

  if (hasAccess) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return <UpgradeCTA feature="Plan Agency requis" onUpgrade={onUpgrade} />;
}

// ── Responsive Grid (mobile-first, adapts columns) ──────────────────────────

interface ResponsiveGridProps {
  children: ReactNode;
  cols?: { mobile?: number; tablet?: number; desktop?: number };
  gap?: string;
  className?: string;
}

export function ResponsiveGrid({ children, cols = { mobile: 2, tablet: 4, desktop: 4 }, gap = 'gap-3', className = '' }: ResponsiveGridProps) {
  const gridCols = `grid-cols-${cols.mobile || 2} sm:grid-cols-${cols.tablet || 4} lg:grid-cols-${cols.desktop || 4}`;
  return (
    <div className={`grid ${gridCols} ${gap} ${className}`}>
      {children}
    </div>
  );
}
