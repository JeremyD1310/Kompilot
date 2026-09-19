/**
 * campaignHealthAlerts.ts — Automated campaign health alert scheduler.
 *
 * Two triggers, both idempotent (track last sent in user metadata):
 *
 *   1. POST /api/campaign-health/alerts/check-and-send
 *      Cron-called every 6h. For each user with connected Meta/TikTok,
 *      fetches /api/campaign-health and sends an alert email if:
 *        - gapPercent > 25% (critical) OR gapPercent > 10% (warning + 48h since last alert)
 *        - No alert sent in the last 72h for this platform
 *
 *   2. POST /api/campaign-health/alerts/no-account-reminder
 *      Cron-called every 12h. For users who signed up 48-96h ago
 *      and haven't connected Meta OR TikTok → send "connect your ads" email.
 *      One-time per user (flag: campaign_reminder_sent in meta).
 */
import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';
import {
  buildCampaignHealthAlertEmail,
  buildAdAccountNotConnectedEmail,
} from '../lib/emailTemplates';

export const router = new Hono<{ Bindings: Env }>();

const ALERT_COOLDOWN_HOURS = 72;
const REMINDER_WINDOW_START_HOURS = 48;
const REMINDER_WINDOW_END_HOURS = 96;
const DASHBOARD_URL = 'https://kompilot.fr/dashboard';

// ── Helpers ────────────────────────────────────────────────────────────────────

function hoursSince(isoDate: string | undefined): number {
  if (!isoDate) return Infinity;
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60);
}

async function sendEmail(
  blink: ReturnType<typeof createClient>,
  email: string,
  subject: string,
  html: string,
  text: string,
): Promise<boolean> {
  try {
    await blink.notifications.email({
      to: email,
      subject,
      html,
      text,
    });
    return true;
  } catch (err: any) {
    console.error('[campaignHealthAlerts] Email send failed:', err.message);
    return false;
  }
}

// ── 1. Check health + send alert ──────────────────────────────────────────────

async function runCampaignHealthAlerts(env: Env & { BLINK_PROJECT_ID?: string; BLINK_SECRET_KEY?: string }) {
  const blink = createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });
  const results: { userId: string; email: string; platform: string; sent: boolean; reason: string }[] = [];
  const metaTokens = await blink.db.table<any>('oauth_tokens').list({ where: { provider: 'meta', status: 'active' }, select: ['userId'], limit: 500 });
  const tiktokTokens = await blink.db.table<any>('oauth_tokens').list({ where: { provider: 'tiktok_ads', status: 'active' }, select: ['userId'], limit: 500 });
  const tiktokBasicTokens = await blink.db.table<any>('oauth_tokens').list({ where: { provider: 'tiktok', status: 'active' }, select: ['userId'], limit: 500 });
  const metaUserIds = [...new Set(metaTokens.map((row: any) => row.userId).filter(Boolean))];
  const tiktokUserIds = [...new Set([...tiktokTokens, ...tiktokBasicTokens].map((row: any) => row.userId).filter(Boolean))];
  const allConnectedUserIds = [...new Set([...metaUserIds, ...tiktokUserIds])];
  for (const userId of allConnectedUserIds) {
    const user = await blink.db.table<any>('users').get(userId);
    if (!user?.email) continue;
    let meta: Record<string, any> = {}; try { meta = JSON.parse(user.metadata || '{}'); } catch { /* safe fallback */ }
    if (meta.lastCampaignAlertSentAt && hoursSince(meta.lastCampaignAlertSentAt) < ALERT_COOLDOWN_HOURS) { results.push({ userId, email: user.email, platform: 'any', sent: false, reason: 'cooldown' }); continue; }
    const start = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const leads = await blink.db.table<any>('captured_leads').list({ where: { userId }, limit: 500 });
    const capi = await blink.db.table<any>('meta_capi_events').list({ where: { userId }, limit: 500 });
    const recentLeads = leads.filter((row: any) => row.createdAt >= start); const recentCapi = capi.filter((row: any) => row.createdAt >= start);
    const totalConversions = recentLeads.length + recentCapi.filter((row: any) => Number(row.success) > 0).length;
    const matched = recentCapi.filter((row: any) => Number(row.success) > 0 && (() => { try { return JSON.parse(row.matchKeysUsed || '[]').length > 0; } catch { return false; } })()).length;
    const gapPercent = totalConversions ? Math.round((1 - matched / totalConversions) * 100) : null;
    if (gapPercent === null || totalConversions < 5 || gapPercent < 10) { results.push({ userId, email: user.email, platform: 'any', sent: false, reason: 'below_threshold_or_insufficient_data' }); continue; }
    const platform = metaUserIds.includes(userId) && tiktokUserIds.includes(userId) ? 'Meta et TikTok' : metaUserIds.includes(userId) ? 'Meta Ads' : 'TikTok Ads';
    const template = buildCampaignHealthAlertEmail({ firstName: (user.displayName || user.email.split('@')[0]).split(' ')[0], platform: platform as 'Meta Ads' | 'TikTok Ads' | 'Meta et TikTok', gapPercent, wastedAmount: 0, alertCount: Math.max(1, totalConversions - matched), dashboardUrl: DASHBOARD_URL });
    const sent = await sendEmail(blink, user.email, template.subject, template.html, template.text);
    if (sent) await blink.db.users.update(userId, { metadata: JSON.stringify({ ...meta, lastCampaignAlertSentAt: new Date().toISOString() }) });
    results.push({ userId, email: user.email, platform, sent, reason: sent ? 'sent' : 'email_failed' });
  }
  return { status: 'complete', checked: allConnectedUserIds.length, results };
}

export { runCampaignHealthAlerts };

router.post('/api/campaign-health/alerts/check-and-send', async (c) => {
  const env = c.env as unknown as Env & { BLINK_PROJECT_ID?: string; BLINK_SECRET_KEY?: string };

  try {
    const { checked, results } = await runCampaignHealthAlerts(env);
    return c.json({ status: 'complete', checked, results });
  } catch (err: any) {
    console.error('[campaignHealthAlerts] Fatal error:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// ── 2. No-ad-account reminder (48-96h post signup) ────────────────────────────

router.post('/api/campaign-health/alerts/no-account-reminder', async (c) => {
  const env = c.env as unknown as Env & { BLINK_PROJECT_ID?: string; BLINK_SECRET_KEY?: string };
  const blink = createClient({
    projectId: requireBlinkProjectId(env),
    secretKey: env.BLINK_SECRET_KEY,
  });

  const results: { userId: string; email: string; daysSinceSignup: number; sent: boolean; reason: string }[] = [];

  try {
    // Find users who signed up 48-96h ago
    const allUsers = await blink.db.table<{ id: string; email: string; display_name: string; metadata: string; created_at: string }>('users').list({
      limit: 500,
      select: ['id', 'email', 'display_name', 'metadata', 'created_at'],
    });

    const now = Date.now();

    for (const user of allUsers as any[]) {
      const userId = user.id || user.userId;
      if (!userId || !user.email) continue;

      const createdAt = user.created_at || user.createdAt;
      if (!createdAt) continue;

      const hoursSinceSignup = (now - new Date(createdAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceSignup < REMINDER_WINDOW_START_HOURS || hoursSinceSignup > REMINDER_WINDOW_END_HOURS) continue;

      let meta: Record<string, any> = {};
      try { meta = JSON.parse(user.metadata || '{}'); } catch {}

      // Already sent?
      if (meta.campaign_reminder_sent) {
        continue;
      }

      // Check if user already connected Meta or TikTok
      const hasMeta = metaUserIdsCache?.has(userId) ?? false;
      const hasTiktok = tiktokUserIdsCache?.has(userId) ?? false;

      if (!hasMeta && !hasTiktok) {
        // Still no connection → send reminder
        const firstName = (user.display_name || user.email.split('@')[0]).split(' ')[0];
        const daysSinceSignup = Math.floor(hoursSinceSignup / 24);

        const template = buildAdAccountNotConnectedEmail({
          firstName,
          daysSinceSignup,
          dashboardUrl: DASHBOARD_URL,
        });

        const sent = await sendEmail(blink, user.email, template.subject, template.html, template.text);

        if (sent) {
          const updatedMeta = { ...meta, campaign_reminder_sent: true, campaign_reminder_sent_at: new Date().toISOString() };
          try {
            await blink.db.table('users').update(userId, { metadata: JSON.stringify(updatedMeta) } as any);
          } catch {}
        }

        results.push({ userId, email: user.email, daysSinceSignup, sent, reason: sent ? 'sent' : 'email_failed' });
      }
    }

    return c.json({ status: 'complete', checked: (allUsers as any[]).length, results });
  } catch (err: any) {
    console.error('[campaignHealthAlerts] No-account reminder error:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// Cached sets for the reminder check (lazy-init)
let metaUserIdsCache: Set<string> | null = null;
let tiktokUserIdsCache: Set<string> | null = null;
