/**
 * highTouch.ts — High-touch lead detection & Slack/Discord alerts
 *
 * POST /api/leads/high-touch-check  — Analyze email domain on signup, flag agency profiles
 *
 * Called from the frontend after registration or from the onboarding flow.
 * Detects agency/business profiles by email domain analysis and sends
 * real-time alerts to the sales team.
 */
import { Hono } from 'hono';
import type { Env } from '../lib/types';
import { getBlink, getUserMeta, patchUserMeta } from '../lib/stripeHelpers';

export const router = new Hono();

// ── Domain analysis ──────────────────────────────────────────────────────────

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.fr', 'yahoo.co.uk',
  'hotmail.com', 'hotmail.fr', 'outlook.com', 'outlook.fr', 'live.com',
  'live.fr', 'free.fr', 'orange.fr', 'wanadoo.fr', 'laposte.net',
  'sfr.fr', 'numericable.fr', 'bbox.fr', 'proton.me', 'protonmail.com',
  'icloud.com', 'me.com', 'mac.com', 'aol.com', 'mail.com', 'gmx.com',
  'yandex.com', 'zoho.com', 'tutanota.com', 'disroot.org',
]);

const AGENCY_KEYWORDS = [
  'agence', 'agency', 'digital', 'marketing', 'communication', 'studio',
  'media', 'creative', 'web', 'seo', 'social', 'advertising', 'branding',
  'consulting', 'conseil', 'strategie', 'strategy', 'growth', 'performance',
  'ads', 'pixel', 'traffic', 'funnel', 'tunnel',
];

interface DomainAnalysis {
  email: string;
  domain: string;
  isFreeEmail: boolean;
  isBusinessEmail: boolean;
  isAgencyProfile: boolean;
  agencyKeywords: string[];
  highTouchScore: number; // 0-100
  shouldAlert: boolean;
}

function analyzeDomain(email: string): DomainAnalysis {
  const parts = email.toLowerCase().split('@');
  const domain = parts[1] || '';
  const localPart = parts[0] || '';
  const isFreeEmail = FREE_EMAIL_DOMAINS.has(domain);

  const fullText = `${domain} ${localPart}`.toLowerCase();
  const matchedKeywords = AGENCY_KEYWORDS.filter(kw => fullText.includes(kw));
  const isAgencyProfile = matchedKeywords.length > 0;

  // Score: business email (+30), agency keywords (+20 each, max 60), non-free (+10)
  let score = 0;
  if (!isFreeEmail) score += 30;
  if (isAgencyProfile) score += Math.min(matchedKeywords.length * 20, 60);
  if (!isFreeEmail && !isAgencyProfile) score += 10; // Unknown business

  return {
    email,
    domain,
    isFreeEmail,
    isBusinessEmail: !isFreeEmail,
    isAgencyProfile,
    agencyKeywords: matchedKeywords,
    highTouchScore: Math.min(score, 100),
    shouldAlert: score >= 50, // Alert for business emails or agency profiles
  };
}

// ── Alert dispatch ───────────────────────────────────────────────────────────

async function sendHighTouchAlert(env: any, analysis: DomainAnalysis, userId: string, displayName: string) {
  // Try Slack webhook (if configured in project secrets)
  const slackWebhookUrl = env['SLACK_HIGH_TOUCH_WEBHOOK'] as string | undefined;
  if (slackWebhookUrl) {
    try {
      const message = analysis.isAgencyProfile
        ? `🏢 *Lead qualifié détecté !*\n\n*${displayName}* (${analysis.email})\n*Mots-clés agence :* ${analysis.agencyKeywords.join(', ')}\n*Score :* ${analysis.highTouchScore}/100\n*User ID :* ${userId}\n\n→ Contacter sous 4h via LinkedIn`
        : `📧 *Email professionnel détecté*\n\n*${displayName}* (${analysis.email})\n*Domaine :* ${analysis.domain}\n*Score :* ${analysis.highTouchScore}/100\n*User ID :* ${userId}`;

      await fetch(slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      });
    } catch (err) {
      console.error('[high-touch] Slack alert error (non-fatal):', err);
    }
  }

  // Log to observability regardless
  try {
    const blink = getBlink(env as Env);
    await (blink as any).db.observabilityLogs.create({
      userId,
      action: 'high_touch_lead_detected',
      error_message: `Score: ${analysis.highTouchScore}, Agency: ${analysis.isAgencyProfile}, Domain: ${analysis.domain}`,
      severity: 'info',
      metadata: JSON.stringify({
        email: analysis.email,
        domain: analysis.domain,
        isAgencyProfile: analysis.isAgencyProfile,
        highTouchScore: analysis.highTouchScore,
        agencyKeywords: analysis.agencyKeywords,
      }),
    });
  } catch (err) {
    console.error('[high-touch] observability log error (non-fatal):', err);
  }
}

// ── Endpoint ─────────────────────────────────────────────────────────────────

router.post('/api/leads/high-touch-check', async (c) => {
  const env = c.env as unknown as Env;
  const blink = getBlink(env);

  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  let body: { email?: string; displayName?: string };
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const email = body.email || '';
  if (!email) return c.json({ error: 'Email required' }, 400);

  const analysis = analyzeDomain(email);
  const displayName = body.displayName || email.split('@')[0];

  // Store flags on user metadata
  await patchUserMeta(blink, auth.userId, {
    is_agency_profile: analysis.isAgencyProfile ? 'true' : 'false',
    is_business_email: analysis.isBusinessEmail ? 'true' : 'false',
    high_touch_score: analysis.highTouchScore,
    agency_keywords: JSON.stringify(analysis.agencyKeywords),
  });

  // Send alert if score is high enough
  if (analysis.shouldAlert) {
    await sendHighTouchAlert(c.env, analysis, auth.userId, displayName);
  }

  return c.json({
    analysis: {
      isAgencyProfile: analysis.isAgencyProfile,
      isBusinessEmail: analysis.isBusinessEmail,
      highTouchScore: analysis.highTouchScore,
      shouldAlert: analysis.shouldAlert,
    },
  });
});
