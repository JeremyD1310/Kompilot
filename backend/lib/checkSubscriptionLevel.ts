/**
 * checkSubscriptionLevel.ts — Plan-tier guard middleware
 *
 * Enforces minimum subscription level (starter / agency / expert)
 * before allowing access to a route.
 *
 * Plan hierarchy: expert (3) > agency (2) > starter (1)
 *
 * Usage:
 *   router.post('/api/campaigns/:id/schedule', checkSubscriptionLevel('agency'), handler);
 */
import { requireBlinkProjectId } from './blinkConfig';
import type { Context, Next } from 'hono';
import { createClient } from '@blinkdotnew/sdk';

type PlanType = 'starter' | 'agency' | 'expert';

const PLAN_HIERARCHY: Record<PlanType, number> = {
  starter: 1,
  agency: 2,
  expert: 3,
};

function getBlink(env: Record<string, string>) {
  return createClient({
    projectId: requireBlinkProjectId(env),
    secretKey: env.BLINK_SECRET_KEY,
  });
}

/**
 * Returns a Hono middleware that rejects users whose plan tier
 * is below `requiredPlan`.
 */
export function checkSubscriptionLevel(requiredPlan: PlanType) {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) return c.json({ error: 'Non autorisé' }, 401);

    const env = c.env as Record<string, string>;
    const blink = getBlink(env);
    const auth = await blink.auth.verifyToken(authHeader);
    if (!auth.valid) return c.json({ error: 'Non autorisé' }, 401);

    const userId = auth.userId;

    // Look up user metadata for plan info
    try {
      const rows = await (blink as any).db.table<{ id: string; metadata: string }>('users').list({
        where: { id: userId },
        limit: 1,
      });

      if (rows.length === 0) {
        return c.json({ error: 'Utilisateur non trouvé' }, 404);
      }

      const metadata = JSON.parse(rows[0].metadata || '{}');
      const userPlan: PlanType = (metadata.plan as PlanType) || 'starter';

      if ((PLAN_HIERARCHY[userPlan] ?? 1) < (PLAN_HIERARCHY[requiredPlan] ?? 1)) {
        const planLabel = requiredPlan === 'agency' ? 'Agency' : 'Expert';
        return c.json({
          error: 'Plan insuffisant',
          code: 'UPGRADE_REQUIRED',
          currentPlan: userPlan,
          requiredPlan,
          message: `Cette fonctionnalité nécessite le plan ${planLabel}. Passez au plan supérieur pour y accéder.`,
        }, 403);
      }

      // Store plan + userId in context for downstream handlers
      c.set('userPlan', userPlan);
      c.set('userId', userId);
    } catch (err: any) {
      console.error('[checkSubscriptionLevel] metadata lookup error:', err.message);
      // Fail-open to starter (don't block on transient DB errors)
      c.set('userPlan', 'starter');
      c.set('userId', userId);
    }

    await next();
  };
}
