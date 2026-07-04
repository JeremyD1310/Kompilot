/**
 * quotaMiddleware.ts — Standardized quota enforcement middleware
 *
 * Provides a unified QUOTA_EXCEEDED response format across all feature endpoints.
 * Integrates with the existing apiQuotas system and the quotaMonitor for 80% alerts.
 *
 * Response format (HTTP 403):
 * {
 *   error: "QUOTA_EXCEEDED",
 *   feature: "aio_keywords" | "ai_credits" | "team_seats" | "creative_credits" | "history_months",
 *   message: "Vous avez atteint la limite de votre plan actuel.",
 *   current: number,
 *   limit: number,
 *   upsell_action: {
 *     type: "modal_upgrade" | "stripe_checkout" | "addon_activate",
 *     target_plan?: "agency",
 *     target_addon?: "creative_premium" | "white_label",
 *     price_suggested?: "9€/mois",
 *     stripe_checkout_url?: string
 *   }
 * }
 */

import type { Context, Next } from 'hono';
import type { Env } from './types';
import { getBlink, getUserMeta } from './stripeHelpers';

// ── Feature quota definitions ────────────────────────────────────────────────

export type QuotaFeature =
  | 'aio_keywords'
  | 'ai_credits'
  | 'creative_credits'
  | 'team_seats'
  | 'history_months'
  | 'search_credits'
  | 'luma_videos'
  | 'serpapi_queries';

export interface QuotaDefinition {
  feature: QuotaFeature;
  label: string;
  /** Metadata key for the usage counter */
  usageKey: string;
  /** Metadata key for the limit */
  limitKey: string;
  /** Plan-based limits */
  planLimits: Record<string, number>;
  /** Upsell action when quota exceeded */
  upsell: {
    type: 'modal_upgrade' | 'stripe_checkout' | 'addon_activate';
    target_plan?: string;
    target_addon?: string;
    price_suggested?: string;
    stripe_env_key?: string; // env var for Stripe checkout URL
  };
}

export const QUOTA_DEFINITIONS: Record<QuotaFeature, QuotaDefinition> = {
  aio_keywords: {
    feature: 'aio_keywords',
    label: 'Mots-clés AIO Sync',
    usageKey: 'aio_keywords_used',
    limitKey: 'aio_keywords_limit',
    planLimits: { free: 5, starter: 20, pro: 20, agency: 150, expert: 150, enterprise: 500 },
    upsell: {
      type: 'addon_activate',
      target_addon: 'aio_keywords_pack',
      price_suggested: '15€/mois',
    },
  },
  ai_credits: {
    feature: 'ai_credits',
    label: 'Crédits IA',
    usageKey: 'quota_ai_tokens_used',
    limitKey: 'quota_ai_tokens_left',
    planLimits: { free: 50, starter: 200, pro: 200, agency: 2000, expert: 2000, enterprise: 5000 },
    upsell: {
      type: 'stripe_checkout',
      price_suggested: '19€ (100 crédits)',
    },
  },
  creative_credits: {
    feature: 'creative_credits',
    label: 'Crédits Creative Studio',
    usageKey: 'creative_credits_used',
    limitKey: 'creative_credits_limit',
    planLimits: { free: 0, starter: 100, pro: 100, agency: 300, expert: 300, enterprise: 1000 },
    upsell: {
      type: 'stripe_checkout',
      price_suggested: '29€ (100 crédits)',
    },
  },
  team_seats: {
    feature: 'team_seats',
    label: 'Utilisateurs (Seats)',
    usageKey: 'team_seats_used',
    limitKey: 'team_seats_limit',
    planLimits: { free: 1, starter: 1, pro: 1, agency: 3, expert: 3, enterprise: 20 },
    upsell: {
      type: 'modal_upgrade',
      target_plan: 'agency',
      price_suggested: '19€/mois par seat supplémentaire',
    },
  },
  history_months: {
    feature: 'history_months',
    label: 'Historique des données',
    usageKey: 'history_months',
    limitKey: 'history_months_limit',
    planLimits: { free: 1, starter: 1, pro: 1, agency: 999, expert: 999, enterprise: 999 },
    upsell: {
      type: 'addon_activate',
      target_addon: 'history_12m',
      price_suggested: '19€/mois',
    },
  },
  search_credits: {
    feature: 'search_credits',
    label: 'Crédits Recherche',
    usageKey: 'quota_search_credits_used',
    limitKey: 'quota_search_credits_left',
    planLimits: { free: 10, starter: 50, pro: 50, agency: 500, expert: 500, enterprise: 1000 },
    upsell: {
      type: 'stripe_checkout',
      price_suggested: '29€ (500 requêtes)',
    },
  },
  luma_videos: {
    feature: 'luma_videos',
    label: 'Générations Vidéo Luma AI',
    usageKey: 'luma_videos_used',
    limitKey: 'luma_videos_limit',
    planLimits: { free: 0, starter: 5, pro: 5, agency: 20, expert: 20, enterprise: 50 },
    upsell: {
      type: 'stripe_checkout',
      price_suggested: '29€ (50 vidéos)',
    },
  },
  serpapi_queries: {
    feature: 'serpapi_queries',
    label: 'Requêtes SerpApi',
    usageKey: 'serpapi_queries_used',
    limitKey: 'serpapi_queries_limit',
    planLimits: { free: 0, starter: 100, pro: 100, agency: 500, expert: 500, enterprise: 1000 },
    upsell: {
      type: 'stripe_checkout',
      price_suggested: '29€ (500 requêtes)',
    },
  },
};

// ── Middleware factory ───────────────────────────────────────────────────────

/**
 * Creates a Hono middleware that checks if the user has quota remaining for a feature.
 * Returns HTTP 403 with structured QUOTA_EXCEEDED payload if limit reached.
 *
 * @param feature - The quota feature to check
 * @param amount - How many units this operation consumes (default 1)
 */
export function checkUserQuota(feature: QuotaFeature, amount = 1) {
  return async (c: Context, next: Next) => {
    const env = c.env as unknown as Env;
    const blink = getBlink(env);

    const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
    if (!auth.valid) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const def = QUOTA_DEFINITIONS[feature];
    const meta = await getUserMeta(blink, auth.userId);
    const planId = (meta.plan_id as string) || 'free';

    // Get current usage and limit
    const usageRaw = meta[def.usageKey];
    const limitRaw = meta[def.limitKey];

    // Default limit from plan if not set
    const planLimit = def.planLimits[planId] ?? def.planLimits.free ?? 0;
    const currentUsage = typeof usageRaw === 'number' ? usageRaw : 0;
    const limit = typeof limitRaw === 'number' ? limitRaw : planLimit;

    // Check if operation would exceed limit
    if (currentUsage + amount > limit) {
      // Build Stripe checkout URL if applicable
      let stripeCheckoutUrl: string | undefined;
      if (def.upsell.type === 'stripe_checkout') {
        // Return the URL prefix — frontend will append customer ID
        stripeCheckoutUrl = `/api/billing/credit-pack`;
      }

      return c.json({
        error: 'QUOTA_EXCEEDED',
        feature: def.feature,
        message: `Vous avez atteint la limite de votre plan actuel (${def.label}).`,
        current: currentUsage,
        limit,
        amount_requested: amount,
        upsell_action: {
          type: def.upsell.type,
          target_plan: def.upsell.target_plan,
          target_addon: def.upsell.target_addon,
          price_suggested: def.upsell.price_suggested,
          stripe_checkout_url: stripeCheckoutUrl,
        },
      }, 403);
    }

    // Attach quota info to context for downstream handlers
    c.set('quotaFeature', feature);
    c.set('quotaUsage', currentUsage);
    c.set('quotaLimit', limit);
    c.set('userId', auth.userId);
    c.set('userMeta', meta);

    await next();
  };
}

// ── Unified usage endpoint ───────────────────────────────────────────────────

/**
 * Returns a unified usage report across all quota features.
 * Mount this as a standalone route: app.get('/api/v1/usage', unifiedUsageReport)
 */
export async function unifiedUsageReport(c: Context) {
  const env = c.env as unknown as Env;
  const blink = getBlink(env);

  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const meta = await getUserMeta(blink, auth.userId);
  const planId = (meta.plan_id as string) || 'free';

  const report: Record<string, {
    feature: string;
    label: string;
    current: number;
    limit: number;
    remaining: number;
    usage_percent: number;
    is_exceeded: boolean;
  }> = {};

  for (const [key, def] of Object.entries(QUOTA_DEFINITIONS)) {
    const planLimit = def.planLimits[planId] ?? def.planLimits.free ?? 0;
    const usageRaw = meta[def.usageKey];
    const limitRaw = meta[def.limitKey];
    const current = typeof usageRaw === 'number' ? usageRaw : 0;
    const limit = typeof limitRaw === 'number' ? limitRaw : planLimit;
    const remaining = Math.max(0, limit - current);
    const percent = limit > 0 ? Math.min(100, Math.round((current / limit) * 100)) : 0;

    report[key] = {
      feature: def.feature,
      label: def.label,
      current,
      limit,
      remaining,
      usage_percent: percent,
      is_exceeded: current >= limit,
    };
  }

  return c.json({
    planId,
    quotas: report,
    addons: meta.addons || {},
    billing_interval: meta.billing_interval || 'monthly',
  });
}
