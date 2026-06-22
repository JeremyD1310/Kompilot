/**
 * FeatureLock — wraps a UI section with an elegant lock overlay.
 *
 * Shown to Starter users when a Business/Franchise-only feature is rendered.
 * Clicking the overlay navigates to /subscription with the correct plan pre-selected.
 *
 * Usage:
 *   <FeatureLock feature="geo_radar" tier={currentTier}>
 *     <GeoRadarSection />
 *   </FeatureLock>
 */
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import {
  type FeatureKey,
  type PlanTier,
  canAccessFeature,
  getUpgradeCTA,
  getUpgradePlan,
  TIER_LABELS,
} from '../../lib/planFeatures';

interface FeatureLockProps {
  feature: FeatureKey;
  tier: PlanTier;
  children: ReactNode;
  /** Blur the underlying content instead of hiding it */
  blur?: boolean;
  /** Custom override message */
  label?: string;
  className?: string;
}

export function FeatureLock({
  feature,
  tier,
  children,
  blur = true,
  label,
  className = '',
}: FeatureLockProps) {
  // If the user has access, just render children
  if (canAccessFeature(feature, tier)) {
    return <>{children}</>;
  }

  const upgradePlan = getUpgradePlan(feature);
  const upgradeCTA = label ?? getUpgradeCTA(feature);
  const targetTierLabel = upgradePlan === 'expert' ? 'Franchise & Réseau' : 'Solo Business';

  return (
    <div className={`relative ${className}`}>
      {/* Blurred/faded children */}
      <div className={`${blur ? 'blur-sm opacity-50 pointer-events-none select-none' : 'opacity-40 pointer-events-none select-none'}`}>
        {children}
      </div>

      {/* Lock overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 z-10"
      >
        <div className="rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-xl p-5 space-y-3 max-w-xs w-full text-center">
          {/* Lock icon */}
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
              <Lock size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
          </div>

          {/* Current plan badge */}
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
              Votre offre : {TIER_LABELS[tier]}
            </p>
            <p className="text-sm font-extrabold text-foreground leading-tight">
              Fonctionnalité réservée à l'offre {targetTierLabel}
            </p>
          </div>

          {/* Upgrade CTA */}
          <Link
            to="/subscription"
            search={{ plan: upgradePlan } as any}
            className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-gradient-to-r from-primary to-emerald-500 text-white text-xs font-bold py-2.5 hover:from-primary/90 hover:to-emerald-600 transition-all active:scale-[0.98] shadow-md"
          >
            {upgradeCTA}
            <ArrowRight size={12} />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

// ── Sidebar lock indicator (inline padlock + text) ────────────────────────────

interface SidebarLockBadgeProps {
  feature: FeatureKey;
  tier: PlanTier;
}

/**
 * Tiny inline badge shown next to locked sidebar nav items.
 * Renders nothing when the user has access.
 */
export function SidebarLockBadge({ feature, tier }: SidebarLockBadgeProps) {
  if (canAccessFeature(feature, tier)) return null;

  return (
    <span className="ml-auto flex items-center gap-0.5 rounded-full border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/50 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
      <Lock size={8} /> Pro
    </span>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useFeatureAccess(feature: FeatureKey, tier: PlanTier) {
  const hasAccess = canAccessFeature(feature, tier);
  return {
    hasAccess,
    isLocked: !hasAccess,
    upgradeCTA: hasAccess ? null : getUpgradeCTA(feature),
    upgradePlan: hasAccess ? null : getUpgradePlan(feature),
  };
}
