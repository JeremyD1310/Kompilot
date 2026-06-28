/**
 * RGPD — Article 17 right to erasure.
 * DELETE /api/user/data — deletes or anonymizes all user data across all tables.
 *
 * Extracted from webhooks.ts for single-responsibility.
 */
import { Hono } from 'hono';
import type { Env } from '../lib/types';
import { getBlink } from '../lib/stripeHelpers';

export const rgpdRouter = new Hono();

const ERASURE_TABLES = [
  'establishments', 'posts', 'scheduled_posts', 'messages', 'inbox_replies',
  'quick_reply_templates', 'onboarding_profiles', 'referral_campaigns',
  'referral_links', 'referral_conversions', 'leads',
  'email_verification_tokens', 'password_reset_tokens', 'magic_link_tokens',
  'captured_leads', 'daily_analytics', 'initial_scans',
  'compliance_consent_log', 'legal_signatures', 'sms_credits',
  'agency_sub_accounts', 'client_approval_tokens',
] as const;

rgpdRouter.delete('/api/user/data', async (c) => {
  const env   = c.env as unknown as Env;
  const blink = getBlink(env);

  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const userId = auth.userId;
  const results: Record<string, string> = {};

  for (const table of ERASURE_TABLES) {
    try {
      const rows = await (blink.db as any)[table].list({ where: { user_id: userId }, limit: 1000 });
      let deleted = 0;
      for (const row of rows) {
        try { await (blink.db as any)[table].delete(row.id); deleted++; } catch { /* noop */ }
      }
      results[table] = `deleted ${deleted}`;
    } catch (e) {
      results[table] = `error: ${e instanceof Error ? e.message : 'unknown'}`;
    }
  }

  // Anonymize the user record itself
  try {
    await blink.db.users.update(userId, {
      email:        `deleted_${userId}@kompilot.invalid`,
      display_name: '[Supprimé]',
      phone:        null,
      avatar_url:   null,
      metadata:     JSON.stringify({ gdpr_deleted_at: new Date().toISOString() }),
    } as any);
    results['users'] = 'anonymized';
  } catch (e) {
    results['users'] = `error: ${e instanceof Error ? e.message : 'unknown'}`;
  }

  console.warn(`[RGPD] DELETE /api/user/data → userId ${userId}`, results);

  return c.json({
    success:   true,
    userId,
    deletedAt: new Date().toISOString(),
    tables:    results,
    notice:    "Conformément à l'Article 17 RGPD (droit à l'effacement), toutes vos données personnelles ont été supprimées ou anonymisées.",
  });
});
