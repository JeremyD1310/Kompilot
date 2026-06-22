/**
 * usePlan — convenience hook that combines subscription + demo context
 * into a single plan-tier value for feature-gating throughout the app.
 *
 * Usage:
 *   const { tier, isDemoActive, canAccess } = usePlan();
 *   if (!canAccess('geo_radar')) { ... }
 */
import { useSubscription } from '../context/SubscriptionContext';
import { useDemoMode } from '../context/DemoModeContext';
import {
  getPlanTier,
  canAccessFeature,
  getUpgradeCTA,
  getUpgradePlan,
  ONBOARDING_GUIDE_STEPS_BY_TIER,
  ONBOARDING_VIDEO_CHAPTERS_BY_TIER,
  ONBOARDING_VIDEO_DURATION_BY_TIER,
  type PlanTier,
  type FeatureKey,
} from '../lib/planFeatures';

export type { PlanTier, FeatureKey };

export function usePlan() {
  const { currentPlan } = useSubscription();
  const { isDemoActive, demoTrialDaysRemaining } = useDemoMode();

  /** Effective tier: demo always gets franchise (full access) */
  const tier: PlanTier = getPlanTier(currentPlan.id, isDemoActive);

  /** True if the user can use this feature at their current tier */
  const canAccess = (feature: FeatureKey): boolean =>
    canAccessFeature(feature, tier);

  /** CTA text for a locked feature ("Débloquer avec l'offre Business ✨") */
  const lockCTA = (feature: FeatureKey): string | null =>
    canAccess(feature) ? null : getUpgradeCTA(feature);

  /** Stripe plan param for the upgrade redirect */
  const upgradePlanFor = (feature: FeatureKey) =>
    canAccess(feature) ? null : getUpgradePlan(feature);

  /** Filtered video chapter indices for the onboarding video player */
  const onboardingVideoChapters = ONBOARDING_VIDEO_CHAPTERS_BY_TIER[tier];

  /** Filtered guide step indices for the interactive click-by-click guide */
  const onboardingGuideSteps = ONBOARDING_GUIDE_STEPS_BY_TIER[tier];

  /** Simulated video duration for the onboarding player */
  const onboardingVideoDuration = ONBOARDING_VIDEO_DURATION_BY_TIER[tier];

  return {
    tier,
    planId: currentPlan.id,
    planName: currentPlan.name,
    isDemoActive,
    demoTrialDaysRemaining,
    canAccess,
    lockCTA,
    upgradePlanFor,
    onboardingVideoChapters,
    onboardingGuideSteps,
    onboardingVideoDuration,
    isStarter:   tier === 'starter',
    isBusiness:  tier === 'business',
    isFranchise: tier === 'franchise',
  };
}
