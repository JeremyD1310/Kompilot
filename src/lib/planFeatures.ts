/**
 * planFeatures.ts — Kompilot plan tier system
 *
 * Maps internal plan IDs (free / pro / expert) to marketing tiers
 * (Starter / Business / Franchise) and exposes a feature access matrix.
 *
 * Usage:
 *   const tier = getPlanTier(currentPlan.id, isDemoActive);
 *   if (canAccessFeature('geo_radar', tier)) { ... }
 */

// ── Plan tiers ────────────────────────────────────────────────────────────────

export type PlanTier = 'starter' | 'business' | 'franchise';

/** Maps internal DB plan ID → marketing tier */
export const PLAN_TIER_MAP: Record<string, PlanTier> = {
  free:   'starter',
  pro:    'business',
  expert: 'franchise',
};

/**
 * Returns the effective plan tier for the current user.
 * Demo users always get 'franchise' (full access).
 */
export function getPlanTier(planId: string, isDemoActive: boolean): PlanTier {
  if (isDemoActive) return 'franchise';
  return PLAN_TIER_MAP[planId] ?? 'starter';
}

// ── Feature keys ──────────────────────────────────────────────────────────────

export type FeatureKey =
  // ── Available on ALL plans ──
  | 'cockpit_ai'        // Cockpit IA + voice mic
  | 'calendar_classic'  // Standard post calendar
  | 'roi_counter'       // ROI / growth counter
  | 'multi_diffusion'   // Instagram + Facebook cross-posting
  // ── Business & Franchise only ──
  | 'geo_radar'         // GEO / GEA radar scan (ChatGPT, Gemini, Perplexity)
  | 'whatsapp_api'      // WhatsApp Business API unified inbox
  | 'bulk_calendar'     // 30-day bulk editorial calendar generation
  | 'youtube_shorts'    // YouTube Shorts + Google Maps cross-posting
  // ── Franchise only ──
  | 'team_management'   // Team role management (RGPD-safe)
  | 'multi_establish';  // Multi-establishment panel

// ── Access matrix ─────────────────────────────────────────────────────────────

const FEATURE_ACCESS: Record<FeatureKey, PlanTier[]> = {
  // All plans
  cockpit_ai:       ['starter', 'business', 'franchise'],
  calendar_classic: ['starter', 'business', 'franchise'],
  roi_counter:      ['starter', 'business', 'franchise'],
  multi_diffusion:  ['starter', 'business', 'franchise'],
  // Business+
  geo_radar:        ['business', 'franchise'],
  whatsapp_api:     ['business', 'franchise'],
  bulk_calendar:    ['business', 'franchise'],
  youtube_shorts:   ['business', 'franchise'],
  // Franchise only
  team_management:  ['franchise'],
  multi_establish:  ['franchise'],
};

export function canAccessFeature(feature: FeatureKey, tier: PlanTier): boolean {
  return FEATURE_ACCESS[feature]?.includes(tier) ?? true;
}

/** Returns the minimum tier required to access a feature */
export function requiredTierFor(feature: FeatureKey): PlanTier {
  const tiers = FEATURE_ACCESS[feature];
  return tiers?.[0] ?? 'starter';
}

// ── Tier labels & styles ──────────────────────────────────────────────────────

export const TIER_LABELS: Record<PlanTier, string> = {
  starter:   'Solo Starter',
  business:  'Solo Business',
  franchise: 'Franchise & Réseau',
};

export const TIER_BADGE_STYLES: Record<PlanTier, string> = {
  starter:   'text-slate-600 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-slate-800/40 dark:border-slate-700',
  business:  'text-teal-700 bg-teal-50 border-teal-200 dark:text-teal-300 dark:bg-teal-950/30 dark:border-teal-800/50',
  franchise: 'text-violet-700 bg-violet-50 border-violet-200 dark:text-violet-300 dark:bg-violet-950/30 dark:border-violet-800/50',
};

/** Returns the human-readable upgrade CTA for a locked feature */
export function getUpgradeCTA(feature: FeatureKey): string {
  const required = requiredTierFor(feature);
  return required === 'franchise'
    ? "Débloquer avec l'offre Franchise ✨"
    : "Débloquer avec l'offre Business ✨";
}

/** Returns the Stripe pre-select query param for the required upgrade */
export function getUpgradePlan(feature: FeatureKey): 'pro' | 'expert' {
  return requiredTierFor(feature) === 'franchise' ? 'expert' : 'pro';
}

// ── Onboarding step visibility ────────────────────────────────────────────────

/** Which guide step indices are shown per tier (matches GUIDE_STEPS array order) */
export const ONBOARDING_GUIDE_STEPS_BY_TIER: Record<PlanTier, number[]> = {
  starter:   [1, 5],          // Cockpit Vocal + ROI Counter (+ classic calendar injected)
  business:  [0, 1, 2, 3, 4, 5], // All except Équipe
  franchise: [0, 1, 2, 3, 4, 5, 6], // All 7
};

/** Which video chapter indices are shown per tier */
export const ONBOARDING_VIDEO_CHAPTERS_BY_TIER: Record<PlanTier, number[]> = {
  starter:   [1, 5],               // Cockpit + ROI (~60s)
  business:  [0, 1, 2, 3, 4, 5],   // GEO through ROI (~120s)
  franchise: [0, 1, 2, 3, 4, 5, 6], // All including Équipe (~150s)
};

/** Video simulation duration in seconds per tier */
export const ONBOARDING_VIDEO_DURATION_BY_TIER: Record<PlanTier, number> = {
  starter:   60,
  business:  120,
  franchise: 150,
};
