/**
 * Team seats middleware route
 *   POST /api/billing/check-seats — Verify available seats before inviting a collaborator
 *
 * Seat limits by plan:
 *   starter    → 2 users max (included)
 *   pro        → 3 users max (included) · +10€/month per additional seat
 *   agency_pro → 5 users max
 *   enterprise → 20 users max
 */
import { Hono } from 'hono';
import type { Env } from '../../lib/types';
import { getBlink, getUserMeta } from '../../lib/stripeHelpers';

export const router = new Hono();

// ── Team Seats middleware — POST /api/billing/check-seats ─────────────────
//
// Vérifie si l'organisation a encore des sièges disponibles selon son plan.
// Appelé avant d'inviter un collaborateur (TeamInviteModal).

router.post('/api/billing/check-seats', async (c) => {
  const env   = c.env as unknown as Env;
  const blink = getBlink(env);

  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const SEAT_LIMITS: Record<string, number> = {
    starter:    2,
    pro:        3,   // 3 inclus, +10€/mois par siège supplémentaire
    agency_pro: 5,
    enterprise: 20,
  };

  // Récupère le plan actuel depuis les métadonnées utilisateur
  const meta = await getUserMeta(blink, auth.userId);
  const planTier: string = (meta.plan_tier as string | undefined) ?? 'starter';
  const maxSeats = SEAT_LIMITS[planTier] ?? 2;

  // Compte les membres actifs (status = accepted ou pending) liés à ce workspace
  const members = await blink.db.team_members.list({
    where: { workspaceOwnerId: auth.userId },
    limit: 100,
  });
  // +1 pour le propriétaire lui-même
  const currentSeats = (members?.length ?? 0) + 1;

  if (currentSeats >= maxSeats) {
    return c.json({
      allowed: false,
      currentSeats,
      maxSeats,
      planTier,
      error: `Limite de sièges atteinte (${currentSeats}/${maxSeats}). Passez à un forfait supérieur sur Kompilot pour inviter d'autres collaborateurs. Chaque siège supplémentaire sur le plan Pro est facturé +10€/mois.`,
      upgradeRequired: true,
    }, 403);
  }

  return c.json({
    allowed: true,
    currentSeats,
    maxSeats,
    planTier,
    remainingSeats: maxSeats - currentSeats,
  });
});
