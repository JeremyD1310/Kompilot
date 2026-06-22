/**
 * Onboarding welcome email sequence — event-driven, no cron.
 *
 * POST /api/onboarding/welcome-email  — send J0 + schedule J3 flag
 * POST /api/onboarding/j3-reminder    — send J3 if conditions met (called at login)
 */
import { Hono } from 'hono';
import type { Env } from '../lib/types';
import { getBlink } from '../lib/stripeHelpers';
import { buildWelcomeEmail, buildWelcomeJ3Email } from '../lib/emailTemplates';

export const router = new Hono();

const DASHBOARD_URL = 'https://kompilot.blinkpowered.com/dashboard';

// ── Rate-limit helper: 1 email per userId per 24h via DB ────────────────────

async function wasEmailSentRecently(
  blink: ReturnType<typeof getBlink>,
  userId: string,
  emailType: 'j0' | 'j3',
): Promise<boolean> {
  try {
    const profiles = await blink.db.onboardingProfiles.list({
      where: { userId },
      limit: 1,
    });
    const profile = profiles[0] as Record<string, any> | undefined;
    if (!profile) return false;

    const field = emailType === 'j0' ? 'welcome_j0_sent_at' : 'welcome_j3_sent_at';
    const extended: Record<string, any> = JSON.parse(
      (profile as any).extended_data ?? profile.objective ?? '{}',
    );
    // We store timestamps in the profile's objective JSON blob (extended metadata)
    const sentAt: string | undefined = (profile as any)[field] ?? extended[field];
    if (!sentAt) return false;

    const elapsed = Date.now() - new Date(sentAt).getTime();
    return elapsed < 24 * 60 * 60 * 1000; // 24h
  } catch {
    return false;
  }
}

// ── Store email sent timestamp in onboarding_profiles ───────────────────────
// We persist via a dedicated DB update on onboarding_profiles.
// Since the table has no JSON column, we encode timestamps into the `objective`
// field as a JSON-extended string: "time,reviews|{"j0":"2024-...","j3":"2024-..."}"

async function markEmailSent(
  blink: ReturnType<typeof getBlink>,
  userId: string,
  emailType: 'j0' | 'j3',
): Promise<void> {
  try {
    const profiles = await blink.db.onboardingProfiles.list({
      where: { userId },
      limit: 1,
    });
    const profile = profiles[0] as Record<string, any> | undefined;
    if (!profile) return;

    // Parse existing meta suffix from objective field: "objectives|{json}"
    const raw: string = (profile as any).objective ?? '';
    const sepIdx = raw.lastIndexOf('|{');
    const objectivePart = sepIdx !== -1 ? raw.slice(0, sepIdx) : raw;
    let meta: Record<string, string> = {};
    if (sepIdx !== -1) {
      try { meta = JSON.parse(raw.slice(sepIdx + 1)); } catch { meta = {}; }
    }

    meta[`welcome_${emailType}_sent_at`] = new Date().toISOString();
    if (emailType === 'j0') meta['welcome_j3_scheduled'] = 'true';

    const newObjective = `${objectivePart}|${JSON.stringify(meta)}`;
    await (blink.db as any).onboardingProfiles.update(profile.id, {
      objective: newObjective,
    });
  } catch (e) {
    console.error('[onboarding] markEmailSent error (non-fatal):', e);
  }
}

// ── POST /api/onboarding/welcome-email  (J0) ────────────────────────────────

router.post('/api/onboarding/welcome-email', async (c) => {
  const env   = c.env as unknown as Env;
  const blink = getBlink(env);

  // Auth check
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  let body: {
    userId: string;
    sector: string;
    objective: string;
    displayName: string;
    email: string;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { userId, sector, objective, displayName, email } = body;

  if (!userId || !sector || !email) {
    return c.json({ error: 'userId, sector, and email are required' }, 422);
  }

  // Security: user can only trigger their own welcome email
  if (auth.userId !== userId) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  // Rate-limit: skip if already sent in last 24h
  const alreadySent = await wasEmailSentRecently(blink, userId, 'j0');
  if (alreadySent) {
    console.log(`[onboarding] J0 already sent recently for user ${userId} — skipping`);
    return c.json({ skipped: true, reason: 'rate_limit' });
  }

  // Build & send J0 email
  const { subject, html, text } = buildWelcomeEmail({
    displayName: displayName || email.split('@')[0],
    sector,
    objective,
    dashboardUrl: DASHBOARD_URL,
  });

  try {
    await blink.notifications.email({
      to:      email,
      replyTo: 'support@kompilot.com',
      subject,
      html,
      text,
    });
    console.log(`[onboarding] J0 welcome email sent → ${email} (sector: ${sector})`);
  } catch (e) {
    console.error('[onboarding] J0 email send error:', e);
    return c.json({ error: 'Email delivery failed' }, 500);
  }

  // Mark J0 as sent + schedule J3 flag
  await markEmailSent(blink, userId, 'j0');

  return c.json({ success: true, emailType: 'j0', sentTo: email });
});

// ── POST /api/onboarding/j3-reminder  (J3 — event-driven) ───────────────────
// Called from the frontend on app open, when localStorage indicates onboarding
// was done 3+ days ago and J3 hasn't been sent yet.

router.post('/api/onboarding/j3-reminder', async (c) => {
  const env   = c.env as unknown as Env;
  const blink = getBlink(env);

  // Auth check
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const userId = auth.userId;

  // Fetch onboarding profile + user
  const [profiles, users] = await Promise.all([
    blink.db.onboardingProfiles.list({ where: { userId }, limit: 1 }),
    blink.db.users.list({ where: { id: userId }, limit: 1 }),
  ]);

  const profile = profiles[0] as Record<string, any> | undefined;
  const user    = users[0] as Record<string, any> | undefined;

  if (!profile || !user?.email) {
    return c.json({ skipped: true, reason: 'no_profile' });
  }

  // Check: J0 was sent (J3 scheduled flag exists)
  const raw: string = (profile as any).objective ?? '';
  const sepIdx = raw.lastIndexOf('|{');
  let meta: Record<string, string> = {};
  if (sepIdx !== -1) {
    try { meta = JSON.parse(raw.slice(sepIdx + 1)); } catch { meta = {}; }
  }

  if (!meta['welcome_j3_scheduled'] || meta['welcome_j3_sent_at']) {
    return c.json({ skipped: true, reason: meta['welcome_j3_sent_at'] ? 'already_sent' : 'j0_not_sent' });
  }

  // Check: 3+ days since J0
  const j0SentAt = meta['welcome_j0_sent_at'];
  if (!j0SentAt) {
    return c.json({ skipped: true, reason: 'j0_timestamp_missing' });
  }
  const daysSinceJ0 = (Date.now() - new Date(j0SentAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceJ0 < 3) {
    return c.json({ skipped: true, reason: 'too_early', daysSinceJ0: Math.floor(daysSinceJ0) });
  }

  // Extract raw sector from objective field
  const sector: string = (profile as any).sector ?? 'commerce';

  // Build & send J3 email
  const { subject, html, text } = buildWelcomeJ3Email({
    displayName: user.display_name ?? user.email.split('@')[0],
    sector,
    dashboardUrl: DASHBOARD_URL,
  });

  try {
    await blink.notifications.email({
      to:      user.email,
      replyTo: 'support@kompilot.com',
      subject,
      html,
      text,
    });
    console.log(`[onboarding] J3 reminder sent → ${user.email} (day ${Math.floor(daysSinceJ0)} since J0)`);
  } catch (e) {
    console.error('[onboarding] J3 email send error:', e);
    return c.json({ error: 'Email delivery failed' }, 500);
  }

  // Mark J3 as sent
  await markEmailSent(blink, userId, 'j3');

  return c.json({ success: true, emailType: 'j3', sentTo: user.email });
});
