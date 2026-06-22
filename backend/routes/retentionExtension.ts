/**
 * Retention Extension — Offer B for Annual plans
 *
 * POST /api/billing/apply-retention-extension
 *   Extends an annual Stripe subscription by 1 month free (trial_end shift).
 *   One-time use — marks already_benefited_discount=true in user metadata.
 *
 * Also triggers the 15-day pre-end reminder email scheduling (metadata flag).
 */
import { Hono } from 'hono';
import type { Env } from '../lib/types';
import { getBlink, getUserMeta, patchUserMeta } from '../lib/stripeHelpers';

export const router = new Hono();

router.post('/api/billing/apply-retention-extension', async (c) => {
  const env      = c.env as unknown as Env;
  const rawEnv   = c.env as any;
  const blink    = getBlink(env);
  const stripeKey = rawEnv.STRIPE_SECRET_KEY as string | undefined;

  // 1. Auth
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  if (!stripeKey) {
    return c.json({ error: 'Stripe not configured', code: 'NO_STRIPE_KEY' }, 503);
  }

  // 2. One-time eligibility check
  const meta = await getUserMeta(blink, auth.userId);
  if (meta.already_benefited_discount) {
    return c.json({
      error:   'Extension already used',
      code:    'ALREADY_BENEFITED',
      message: 'Cette offre est réservée à une seule utilisation par compte.',
    }, 409);
  }

  const subscriptionId = meta.stripe_subscription_id as string | undefined;
  if (!subscriptionId) {
    return c.json({ error: 'No active subscription found', code: 'NO_SUBSCRIPTION' }, 404);
  }

  // 3. Fetch the current subscription to get current_period_end
  const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  });

  if (!subRes.ok) {
    const err = await subRes.text();
    console.error('[retention-extension] sub fetch error:', err);
    return c.json({ error: 'Failed to fetch subscription', details: err }, 500);
  }

  const sub = await subRes.json() as { current_period_end: number; trial_end: number | null; status: string };

  // 4. Compute new trial_end = current_period_end + 1 month (~30 days)
  const currentEnd    = sub.current_period_end; // Unix timestamp
  const ONE_MONTH_S   = 30 * 24 * 60 * 60;     // 30 days in seconds
  const newTrialEnd   = currentEnd + ONE_MONTH_S;

  // 5. Update subscription: set trial_end to extend it 1 month
  const updateBody = new URLSearchParams({ trial_end: String(newTrialEnd) });
  const updateRes  = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: updateBody.toString(),
  });

  if (!updateRes.ok) {
    const err = await updateRes.text();
    console.error('[retention-extension] update error:', err);
    return c.json({ error: 'Extension application failed', details: err }, 500);
  }

  // 6. Mark as already benefited (ONE-TIME FLAG) + schedule reminder
  const newEndDate = new Date(newTrialEnd * 1000).toISOString();
  await patchUserMeta(blink, auth.userId, {
    already_benefited_discount:           true,
    retention_extension_applied_at:       new Date().toISOString(),
    retention_extension_new_period_end:   newEndDate,
  });

  console.log(`[retention-extension] +1 month applied for user ${auth.userId}, new end: ${newEndDate}`);

  // 7. Schedule the 15-day before-end reminder email via blink.notifications
  // We log the target date so a cron job / webhook can pick it up
  const reminderDate = new Date((newTrialEnd - 15 * 24 * 60 * 60) * 1000).toISOString();
  await patchUserMeta(blink, auth.userId, {
    retention_reminder_email_scheduled_at: reminderDate,
  });

  return c.json({
    success:      true,
    extensionDays: 30,
    newPeriodEnd:  newEndDate,
    reminderAt:    reminderDate,
    message:       '+1 mois gratuit ajouté à la fin de votre période annuelle.',
  });
});
