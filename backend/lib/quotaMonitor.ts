/**
 * quotaMonitor.ts — Real-time quota consumption monitoring
 *
 * Called from the webhook handler whenever a user consumes credits.
 * When consumption reaches 80% of the plan-included quota, triggers:
 *   1. In-app notification (writes to user_notification_settings + metadata)
 *   2. Email alert via Blink Notifications API
 *   3. Pre-filled Stripe Checkout link for the credit pack (29€)
 *
 * Thresholds are configurable per quota type.
 */

import type { Env } from './types';
import { getBlink, getUserMeta, patchUserMeta } from './stripeHelpers';

// ── Types ────────────────────────────────────────────────────────────────────

export type QuotaType = 'ai_tokens' | 'search_credits' | 'luma_videos' | 'serpapi_queries';

export interface QuotaSnapshot {
  type: QuotaType;
  used: number;
  limit: number;
  remaining: number;
  usagePercent: number;
}

export interface QuotaAlertEvent {
  userId: string;
  quota: QuotaSnapshot;
  planId: string;
  threshold: number;        // e.g. 80
  alertedAt: string;        // ISO timestamp
  creditPackUrl?: string;   // pre-filled Stripe Checkout link
}

// ── Threshold config per quota type ──────────────────────────────────────────

const QUOTA_CONFIG: Record<QuotaType, {
  /** Display name for email/notification */
  label: string;
  /** Emoji for the notification */
  icon: string;
  /** Threshold percentage to trigger alert (80 = alert at 80% consumed) */
  alertThreshold: number;
  /** Metadata key for tracking when the last alert was sent */
  lastAlertMetaKey: string;
  /** Minimum hours between repeated alerts (prevent spam) */
  cooldownHours: number;
}> = {
  ai_tokens: {
    label: 'Crédits IA',
    icon: '🤖',
    alertThreshold: 80,
    lastAlertMetaKey: 'quota_alert_ai_tokens_at',
    cooldownHours: 48,
  },
  search_credits: {
    label: 'Crédits Recherche',
    icon: '🔍',
    alertThreshold: 80,
    lastAlertMetaKey: 'quota_alert_search_credits_at',
    cooldownHours: 48,
  },
  luma_videos: {
    label: 'Générations Vidéo Luma AI',
    icon: '🎬',
    alertThreshold: 80,
    lastAlertMetaKey: 'quota_alert_luma_videos_at',
    cooldownHours: 24,
  },
  serpapi_queries: {
    label: 'Requêtes SerpApi',
    icon: '📊',
    alertThreshold: 80,
    lastAlertMetaKey: 'quota_alert_serpapi_queries_at',
    cooldownHours: 24,
  },
};

// ── Plan quota limits ────────────────────────────────────────────────────────

export const PLAN_QUOTA_LIMITS: Record<string, Record<QuotaType, number>> = {
  free:        { ai_tokens: 50,   search_credits: 10,  luma_videos: 0,  serpapi_queries: 0 },
  starter:     { ai_tokens: 200,  search_credits: 50,  luma_videos: 5,  serpapi_queries: 100 },
  pro:         { ai_tokens: 200,  search_credits: 50,  luma_videos: 5,  serpapi_queries: 100 },
  agency:      { ai_tokens: 2000, search_credits: 500, luma_videos: 20, serpapi_queries: 500 },
  expert:      { ai_tokens: 2000, search_credits: 500, luma_videos: 20, serpapi_queries: 500 },
  enterprise:  { ai_tokens: 5000, search_credits: 1000, luma_videos: 50, serpapi_queries: 1000 },
};

// ── Core: Check quota and trigger alert if threshold crossed ─────────────────

/**
 * evaluateQuota — Check if a specific quota type has crossed the alert threshold.
 * If so, send notification + email. Returns the alert event if triggered, null otherwise.
 *
 * Call this after every quota consumption event:
 *   const alert = await evaluateQuota(env, userId, 'ai_tokens', 180, 200);
 *   if (alert) → an alert was sent
 */
export async function evaluateQuota(
  env: Env,
  userId: string,
  quotaType: QuotaType,
  used: number,
  limit: number,
): Promise<QuotaAlertEvent | null> {
  const config = QUOTA_CONFIG[quotaType];
  if (!config) return null;

  const remaining = Math.max(0, limit - used);
  const usagePercent = limit > 0 ? Math.round((used / limit) * 100) : 0;

  const snapshot: QuotaSnapshot = {
    type: quotaType,
    used,
    limit,
    remaining,
    usagePercent,
  };

  // Not yet at threshold → no alert
  if (usagePercent < config.alertThreshold) return null;

  const blink = getBlink(env);
  const meta = await getUserMeta(blink, userId);

  // Cooldown check — don't spam alerts
  const lastAlertAt = meta[config.lastAlertMetaKey] as string | undefined;
  if (lastAlertAt) {
    const hoursSinceLastAlert = (Date.now() - new Date(lastAlertAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastAlert < config.cooldownHours) {
      return null; // still in cooldown
    }
  }

  // All conditions met — trigger alert
  const planId = (meta.plan_id as string) || 'free';
  const alertAt = new Date().toISOString();

  const alertEvent: QuotaAlertEvent = {
    userId,
    quota: snapshot,
    planId,
    threshold: config.alertThreshold,
    alertedAt: alertAt,
  };

  // 1. Write alert timestamp to user metadata (for cooldown tracking)
  try {
    await patchUserMeta(blink, userId, {
      [config.lastAlertMetaKey]: alertAt,
      last_quota_alert_type: quotaType,
      last_quota_alert_percent: usagePercent,
    });
  } catch (err) {
    console.error('[quota-monitor] metadata update failed (non-fatal):', err);
  }

  // 2. Send in-app notification (via Blink Notifications API)
  try {
    await sendInAppNotification(env, userId, config, snapshot, planId);
  } catch (err) {
    console.error('[quota-monitor] in-app notification failed (non-fatal):', err);
  }

  // 3. Send email alert with pre-filled credit pack checkout link
  try {
    const creditPackUrl = await buildCreditPackCheckoutUrl(env, userId);
    alertEvent.creditPackUrl = creditPackUrl;
    await sendQuotaAlertEmail(env, userId, config, snapshot, planId, creditPackUrl);
  } catch (err) {
    console.error('[quota-monitor] email alert failed (non-fatal):', err);
  }

  console.warn(`[quota-monitor] ALERT: user ${userId} at ${usagePercent}% of ${quotaType} (${used}/${limit})`);
  return alertEvent;
}

// ── In-app notification ──────────────────────────────────────────────────────

async function sendInAppNotification(
  env: Env,
  userId: string,
  config: typeof QUOTA_CONFIG[QuotaType],
  snapshot: QuotaSnapshot,
  planId: string,
): Promise<void> {
  const blink = getBlink(env);

  // Store notification in metadata (the frontend reads these via useNotifications or similar)
  const notificationId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const notification = {
    id: notificationId,
    type: 'quota_alert',
    title: `${config.icon} ${config.label} — ${snapshot.usagePercent}% utilisés`,
    body: `Il vous reste ${snapshot.remaining} ${config.label.toLowerCase()} sur ${snapshot.limit}. ` +
          `Passez au Pack AIO Sync pour 50 générations vidéo + 500 requêtes en plus.`,
    actionUrl: '/account?tab=billing&highlight=credit_pack_aio',
    actionLabel: 'Voir le Pack AIO',
    read: false,
    createdAt: new Date().toISOString(),
  };

  // Append to notifications array in metadata
  const meta = await getUserMeta(blink, userId);
  const existing = (meta.notifications as any[]) || [];
  const updated = [...existing, notification].slice(-20); // keep last 20
  await patchUserMeta(blink, userId, { notifications: updated });
}

// ── Email alert ──────────────────────────────────────────────────────────────

async function sendQuotaAlertEmail(
  env: Env,
  userId: string,
  config: typeof QUOTA_CONFIG[QuotaType],
  snapshot: QuotaSnapshot,
  planId: string,
  creditPackUrl?: string,
): Promise<void> {
  const blink = getBlink(env);

  // Get user email
  const users = await blink.db.users.list({ where: { id: userId }, limit: 1 });
  const user = users?.[0] as any;
  if (!user?.email) return;

  const displayName = user.display_name || user.email.split('@')[0];
  const firstName = displayName.split(' ')[0];

  // Build email HTML
  const html = buildQuotaAlertEmailHtml({
    firstName,
    quotaLabel: config.label,
    quotaIcon: config.icon,
    usagePercent: snapshot.usagePercent,
    used: snapshot.used,
    limit: snapshot.limit,
    remaining: snapshot.remaining,
    planId,
    creditPackUrl: creditPackUrl || 'https://www.kompilot.fr/account?tab=billing',
  });

  // Send via Blink Notifications (built-in email service)
  try {
    await blink.notifications.email({
      to: user.email,
      subject: `${config.icon} ${config.label} à ${snapshot.usagePercent}% — Rechargez avant la coupure`,
      html,
    });
  } catch (err) {
    // Fallback: log the email content for debugging
    console.error('[quota-monitor] Blink email send failed:', err);
  }
}

// ── Pre-filled Stripe Checkout URL for credit pack ───────────────────────────

async function buildCreditPackCheckoutUrl(
  env: Env,
  userId: string,
): Promise<string | undefined> {
  const rawEnv = env as Record<string, string | undefined>;
  const stripeKey = rawEnv.STRIPE_SECRET_KEY;
  if (!stripeKey) return undefined;

  const blink = getBlink(env);
  const meta = await getUserMeta(blink, userId);
  const customerId = meta.stripe_customer_id as string | undefined;

  if (!customerId) return undefined; // can't pre-fill without a customer

  // Create a Stripe Checkout Session for the credit pack (expires in 24h)
  try {
    const params = new URLSearchParams({
      mode: 'payment',
      'line_items[0][price_data][currency]': 'eur',
      'line_items[0][price_data][product_data][name]': 'Pack AIO Sync & Creative Studio',
      'line_items[0][price_data][product_data][description]': '50 générations vidéo Luma AI + 500 requêtes SerpApi',
      'line_items[0][price_data][unit_amount]': '2900',
      'line_items[0][quantity]': '1',
      success_url: 'https://www.kompilot.fr/dashboard?checkout=credit_pack_aio',
      cancel_url: 'https://www.kompilot.fr/account?tab=billing',
      customer: customerId,
      'metadata[userId]': userId,
      'metadata[creditPack]': 'true',
      'metadata[packType]': 'aio_creative',
    });

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (res.ok) {
      const session = await res.json() as { url: string };
      return session.url;
    }
  } catch (err) {
    console.error('[quota-monitor] Failed to build checkout URL:', err);
  }

  return undefined;
}

// ── Email HTML template ──────────────────────────────────────────────────────

function buildQuotaAlertEmailHtml(params: {
  firstName: string;
  quotaLabel: string;
  quotaIcon: string;
  usagePercent: number;
  used: number;
  limit: number;
  remaining: number;
  planId: string;
  creditPackUrl: string;
}): string {
  const {
    firstName, quotaLabel, quotaIcon,
    usagePercent, used, limit, remaining,
    planId, creditPackUrl,
  } = params;

  const urgencyColor = usagePercent >= 95 ? '#EF4444' : usagePercent >= 80 ? '#F59E0B' : '#0D9488';
  const urgencyText = usagePercent >= 95
    ? 'Critique — vos crédits seront épuisés sous peu.'
    : `Attention — vous avez utilisé ${usagePercent}% de votre quota ${quotaLabel}.`;

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Inter,-apple-system,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0D9488,#0F766E);padding:28px 32px;text-align:center;">
      <p style="margin:0;font-size:28px;">${quotaIcon}</p>
      <h1 style="margin:8px 0 0;font-size:18px;font-weight:800;color:#FFFFFF;letter-spacing:-.02em;">
        ${quotaLabel} — Alerte Quota
      </h1>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.6;">
        Bonjour ${firstName},
      </p>
      <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">
        ${urgencyText}
      </p>

      <!-- Usage bar -->
      <div style="background:#F1F5F9;border-radius:12px;padding:20px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:13px;font-weight:600;color:#64748B;">Consommation</span>
          <span style="font-size:13px;font-weight:800;color:${urgencyColor};">${usagePercent}%</span>
        </div>
        <div style="background:#E2E8F0;border-radius:999px;height:10px;overflow:hidden;">
          <div style="background:${urgencyColor};height:100%;width:${usagePercent}%;border-radius:999px;transition:width .3s;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:8px;">
          <span style="font-size:12px;color:#94A3B8;">${used} utilisés</span>
          <span style="font-size:12px;color:#94A3B8;">${remaining} restants / ${limit}</span>
        </div>
      </div>

      <!-- Pack offer -->
      <div style="background:linear-gradient(135deg,rgba(13,148,136,.06),rgba(129,140,248,.06));border:1px solid rgba(13,148,136,.2);border-radius:14px;padding:24px;margin-bottom:24px;text-align:center;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#0D9488;text-transform:uppercase;letter-spacing:.06em;">
          Recharge Instantanée
        </p>
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#0F172A;">
          Pack AIO Sync &amp; Creative Studio
        </h2>
        <p style="margin:0 0 4px;font-size:28px;font-weight:900;color:#0D9488;">
          29 € HT
        </p>
        <ul style="list-style:none;padding:0;margin:12px 0 20px;text-align:left;">
          <li style="padding:6px 0;font-size:14px;color:#334155;">🎬 50 générations vidéo Luma AI</li>
          <li style="padding:6px 0;font-size:14px;color:#334155;">📊 500 requêtes SerpApi positionnement</li>
          <li style="padding:6px 0;font-size:14px;color:#334155;">⏱️ Crédits sans limite de durée</li>
        </ul>
        <a href="${creditPackUrl}" style="display:inline-block;background:linear-gradient(135deg,#0D9488,#0F766E);color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:12px;box-shadow:0 4px 16px rgba(13,148,136,.3);">
          Recharger maintenant →
        </a>
      </div>

      <!-- Plan info -->
      <p style="margin:0;font-size:12px;color:#94A3B8;text-align:center;line-height:1.5;">
        Votre forfait actuel : <strong style="color:#64748B;">${planId.charAt(0).toUpperCase() + planId.slice(1)}</strong><br>
        Ce pack s'ajoute à votre forfait. Aucun engagement.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#F8FAFC;padding:20px 32px;border-top:1px solid #E2E8F0;text-align:center;">
      <p style="margin:0;font-size:11px;color:#94A3B8;">
        Kompilot — Pilotage marketing automatisé pour professionnels<br>
        <a href="https://www.kompilot.fr/account" style="color:#0D9488;text-decoration:none;">Gérer mon compte</a>
        &nbsp;·&nbsp;
        <a href="mailto:support@kompilot.fr" style="color:#0D9488;text-decoration:none;">Support</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ── Batch evaluation — check all quota types for a user ─────────────────────

/**
 * evaluateAllQuotas — Check all quota types for a user.
 * Called after any consumption event to evaluate all thresholds.
 *
 * @param env - Cloudflare Worker environment
 * @param userId - Kompilot user ID
 * @param consumption - Map of quota type to current usage count
 */
export async function evaluateAllQuotas(
  env: Env,
  userId: string,
  consumption: Partial<Record<QuotaType, { used: number; limit: number }>>,
): Promise<QuotaAlertEvent[]> {
  const blink = getBlink(env);
  const meta = await getUserMeta(blink, userId);
  const planId = (meta.plan_id as string) || 'free';
  const planLimits = PLAN_QUOTA_LIMITS[planId] || PLAN_QUOTA_LIMITS.free;

  const alerts: QuotaAlertEvent[] = [];

  for (const [type, data] of Object.entries(consumption) as Array<[QuotaType, { used: number; limit: number } | undefined]>) {
    if (!data) continue;

    const limit = data.limit || planLimits[type] || 0;
    const alert = await evaluateQuota(env, userId, type, data.used, limit);
    if (alert) alerts.push(alert);
  }

  return alerts;
}
