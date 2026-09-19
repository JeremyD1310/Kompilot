/**
 * Trial Onboarding Email Sequence — J0 through J+30
 *
 * POST /api/trial-sequence/check-and-send  — Check user's trial stage + send appropriate email
 *              (called at login / dashboard load — non-blocking)
 *
 * This route replaces the previous ad-hoc J0/J3 logic in onboarding.ts with a
 * complete sequence covering J0 → J1 → J2 → J4 → J6 → J14 → J+14 → J+30.
 *
 * Each email is idempotent: it tracks sent timestamps in the user's metadata
 * and only fires once per stage.
 */
import { Hono } from 'hono';
import type { Env } from '../lib/types';
import { requireBackendUrl } from '../lib/blinkConfig';
import { getBlink, getUserMeta, patchUserMeta } from '../lib/stripeHelpers';
import { TRIAL_DAYS } from '../../shared/pricingCatalog';
import {
  buildWelcomeEmail,
  buildJ1InactiveEmail,
  buildJ2AhaMomentEmail,
  buildJ4ROIEmail,
  buildJ6UrgencyEmail,
  buildJ7ExpirationEmail,
  buildJ14WinBackEmail,
  buildJ30SecondChanceEmail,
} from '../lib/emailTemplates';

export const router = new Hono();

const DASHBOARD_URL = 'https://www.kompilot.fr/dashboard';
const BASE_URL = 'https://www.kompilot.fr';

// ── Helpers ────────────────────────────────────────────────────────────────────

function hoursSince(isoDate: string | undefined): number {
  if (!isoDate) return Infinity;
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60);
}

function daysSince(isoDate: string | undefined): number {
  return hoursSince(isoDate) / 24;
}

function formatDateFR(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ── Main check-and-send endpoint ───────────────────────────────────────────────

router.post('/api/trial-sequence/check-and-send', async (c) => {
  const env = c.env as unknown as Env;
  const rawEnv = c.env as any;
  const blink = getBlink(env);

  // Auth required
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const userId = auth.userId;
  const meta = await getUserMeta(blink, userId);

  // Extract email metadata (stored in user meta or auth profile)
  const email = (meta.email as string) || '';
  if (!email) return c.json({ status: 'no_email' });

  const displayName = (meta.display_name as string) || email.split('@')[0];
  const firstName = displayName.split(' ')[0] || 'là';
  const sector = (meta.onboarding_sector as string) || (meta.industry as string) || 'commerce';
  const isAgency = email.includes('agency') || email.includes('agence') || (meta.plan_id as string) === 'agency';
  const createdAt = (meta.created_at as string) || new Date().toISOString();

  // Canonical trial end date from the shared commercial catalog.
  const trialEnd = meta.trial_end
    ? new Date(meta.trial_end as string)
    : new Date(new Date(createdAt).getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const trialEndStr = trialEnd.toISOString();

  // Sent tracking keys in meta
  // NOTE: Also check legacy keys from the old onboarding.ts flow to avoid double-sending
  const sent = {
    j0: (meta.email_seq_j0_sent || meta.welcome_j0_sent_at) as string | undefined,
    j1: meta.email_seq_j1_sent as string | undefined,
    j2: meta.email_seq_j2_sent as string | undefined,
    j4: meta.email_seq_j4_sent as string | undefined,
    j6: meta.email_seq_j6_sent as string | undefined,
    j7: meta.email_seq_j7_sent as string | undefined,
    j14: meta.email_seq_j14_sent as string | undefined,
    j30: meta.email_seq_j30_sent as string | undefined,
  };

  // Activation tracking
  const hasConnectedAccount = !!(meta.google_business_connected || meta.meta_pixel_id || meta.instagram_connected);
  const hasCreatedPost = !!(meta.first_post_created || meta.posts_count > 0);
  const subscriptionStatus = (meta.subscription_status as string) || 'trialing';
  const daysSinceCreation = daysSince(createdAt);

  const emailsSent: string[] = [];

  // Helper: send email + mark sent
  async function sendEmail(
    stage: keyof typeof sent,
    emailData: { subject: string; html: string; text: string },
    targetEmail: string = email,
  ) {
    if (sent[stage]) return; // Already sent

    try {
      const notifications = (blink as any).notifications;
      if (notifications?.email) {
        await notifications.email({
          to: targetEmail,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        });
      }
      await patchUserMeta(blink, userId, {
        [`email_seq_${stage}_sent`]: new Date().toISOString(),
      });
      emailsSent.push(stage);
    } catch (err) {
      console.error(`[trial-sequence] ${stage} email error:`, err);
    }
  }

  // ── J0 — Welcome (immediate, if not sent) ────────────────────────────────
  if (!sent.j0 && daysSinceCreation < 1) {
    const emailData = buildWelcomeEmail({ displayName, sector, objective: '' });
    await sendEmail('j0', emailData);
  }

  // ── J1 — Inactive after 24h (0 actions) ─────────────────────────────────
  if (!sent.j1 && daysSinceCreation >= 1 && daysSinceCreation < 2 && !hasConnectedAccount) {
    const emailData = buildJ1InactiveEmail({ firstName });
    await sendEmail('j1', emailData);
  }

  // ── J2 — Aha Moment (first success detected) ────────────────────────────
  if (!sent.j2 && (hasConnectedAccount || hasCreatedPost)) {
    const nextFeature = hasCreatedPost ? 'aio_sync' : 'creative_studio';
    const successAction = hasCreatedPost
      ? 'Votre premier post a été publié avec succès'
      : 'Votre compte Google Business est maintenant connecté';
    const emailData = buildJ2AhaMomentEmail({ firstName, successAction, nextFeature });
    await sendEmail('j2', emailData);
  }

  // ── J4 — ROI / Mid-trial ────────────────────────────────────────────────
  if (!sent.j4 && daysSinceCreation >= 3.5 && daysSinceCreation < 5) {
    const emailData = buildJ4ROIEmail({ firstName, isAgency });
    await sendEmail('j4', emailData);
  }

  // ── J6 — Urgency (24h before expiry) ────────────────────────────────────
  const hoursUntilExpiry = (trialEnd.getTime() - Date.now()) / (1000 * 60 * 60);
  if (!sent.j6 && hoursUntilExpiry > 0 && hoursUntilExpiry <= 36 && subscriptionStatus === 'trialing') {
    // Generate magic link
    let magicLinkUrl = `${BASE_URL}/extend-trial?expired=true`; // fallback

    try {
      const backendUrl = requireBackendUrl(rawEnv);
      const secretKey = rawEnv.BLINK_SECRET_KEY as string | undefined;
      const genRes = await fetch(`${backendUrl}/api/trial/extension/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${secretKey}`,
        },
        body: JSON.stringify({ userId, email }),
      });
      if (genRes.ok) {
        const genData = await genRes.json() as { magicLinkUrl?: string };
        if (genData.magicLinkUrl) magicLinkUrl = genData.magicLinkUrl;
      }
    } catch (err) {
      console.error('[trial-sequence] magic link generation error:', err);
    }

    const planName = isAgency ? 'Agency' : 'Starter';
    const emailData = buildJ6UrgencyEmail({
      firstName,
      planName,
      magicLinkUrl,
      trialEndDate: formatDateFR(trialEnd),
    });
    await sendEmail('j6', emailData);
  }

  // ── J14 — Expiration (trial ended, no subscription) ─────────────────────
  if (!sent.j7 && hoursUntilExpiry <= 0 && subscriptionStatus === 'trialing') {
    const emailData = buildJ7ExpirationEmail({ firstName });
    await sendEmail('j7', emailData);

    // Mark account as paused
    await patchUserMeta(blink, userId, {
      subscription_status: 'trial_expired',
    });
  }

  // ── J+14 — Win-back (14 days post-expiry, non-converted) ───────────────
  if (!sent.j14 && subscriptionStatus === 'trial_expired' && hoursUntilExpiry <= -14 * 24) {
    const emailData = buildJ14WinBackEmail({
      firstName,
      noveltyTitle: 'Le Creative Studio génère maintenant des vidéos Reels',
      noveltyDesc: 'Décrivez votre offre en 1 phrase → l\'IA crée un Reel vertical prêt à publier sur Instagram et TikTok. Testé par +200 commerces, taux de vue moyen de 3 400.',
    });
    await sendEmail('j14', emailData);
  }

  // ── J+30 — Second Chance (30 days post-expiry, non-converted) ──────────
  if (!sent.j30 && subscriptionStatus === 'trial_expired' && hoursUntilExpiry <= -30 * 24) {
    const emailData = buildJ30SecondChanceEmail({
      firstName,
      offerType: 'reactivation_3days',
    });
    await sendEmail('j30', emailData);
  }

  return c.json({
    status: 'checked',
    emailsSent,
    daysSinceCreation: Math.round(daysSinceCreation * 10) / 10,
    subscriptionStatus,
    trialEnd: trialEndStr,
  });
});
