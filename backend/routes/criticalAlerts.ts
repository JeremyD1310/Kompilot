/**
 * Critical Alerts — SMS + Push doubling for high-priority events
 *
 * Covered events:
 *   - trial.expired        → trial period ended, user must upgrade
 *   - stripe.payment_failed → payment failure (grace period active)
 *   - app.raid_detected     → negative review raid detected on account
 *
 * Strategy: email is already sent by existing flows. This route DOUBLES
 * those alerts with an SMS (via a gateway env var) and/or a Web Push
 * notification so the merchant reads the alert within 5 minutes.
 */
import { Hono } from 'hono';
import type { Env } from '../lib/types';
import { getBlink } from '../lib/stripeHelpers';

export const router = new Hono();

// ── Types ─────────────────────────────────────────────────────────────────────

type AlertType = 'trial.expired' | 'stripe.payment_failed' | 'app.raid_detected';

interface AlertPayload {
  userId:    string;
  alertType: AlertType;
  /** Optional context — raid count, amount, etc. */
  metadata?: Record<string, string | number | boolean>;
}

// ── SMS content per alert ─────────────────────────────────────────────────────

const SMS_MESSAGES: Record<AlertType, (ctx: Record<string, string | number | boolean>) => string> = {
  'trial.expired': () =>
    '⚠️ Kompilot : Votre essai gratuit a expiré. Activez votre abonnement pour continuer à gérer votre présence en ligne : https://www.kompilot.com/account?tab=billing',
  'stripe.payment_failed': (ctx) =>
    `⚠️ Kompilot : Votre paiement${ctx.amount ? ` de ${ctx.amount}` : ''} a échoué. Régularisez votre abonnement en 2 min pour éviter la suspension : https://www.kompilot.com/account?tab=billing`,
  'app.raid_detected': (ctx) =>
    `🚨 Kompilot ALERTE : ${ctx.raidCount ?? 'Plusieurs'} avis négatifs détectés en quelques minutes sur votre fiche. Connectez-vous pour répondre immédiatement : https://www.kompilot.com/reviews`,
};

// ── Internal helper: send SMS via configurable gateway ────────────────────────

async function sendSmsAlert(
  phone: string,
  message: string,
  env: Record<string, string | undefined>,
): Promise<void> {
  // Optional SMS gateway — configure via Project Secrets (SMS_GATEWAY_URL, SMS_API_KEY, SMS_SENDER_ID)
  const smsGatewayUrl = env['SMS_GATEWAY_URL'];
  const smsApiKey     = env['SMS_API_KEY'];
  const smsSenderId   = env['SMS_SENDER_ID'] ?? 'Kompilot';

  if (!smsGatewayUrl || !smsApiKey) {
    console.warn('[criticalAlerts] SMS gateway not configured — skipping SMS');
    return;
  }

  try {
    const res = await fetch(smsGatewayUrl, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${smsApiKey}`,
      },
      body: JSON.stringify({
        to:      phone,
        from:    smsSenderId,
        message,
        // Standard fields — adjust to your SMS provider's schema
        type:    'transactional',
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[criticalAlerts] SMS gateway error ${res.status}: ${text}`);
    } else {
      console.log(`[criticalAlerts] SMS sent to ${phone.slice(0, 6)}***`);
    }
  } catch (err) {
    console.error('[criticalAlerts] SMS send error (non-fatal):', err);
  }
}

// ── Internal helper: store push notification for client-side pickup ───────────

async function storePushNotification(
  blink: ReturnType<typeof getBlink>,
  userId: string,
  alertType: AlertType,
  metadata: Record<string, string | number | boolean>,
): Promise<void> {
  try {
    // Store as an inbox message so the dashboard notification bell picks it up
    // immediately on next page load / real-time subscription.
    await blink.db.messages.create({
      id:          `alert_${alertType.replace('.', '_')}_${Date.now()}`,
      userId,
      senderName:  'Kompilot',
      senderEmail: 'noreply@kompilot.app',
      subject:     getAlertSubject(alertType, metadata),
      body:        SMS_MESSAGES[alertType](metadata),
      isRead:      0 as unknown as boolean,
      isArchived:  0 as unknown as boolean,
      isStarred:   0 as unknown as boolean,
    });
    console.log(`[criticalAlerts] Push inbox message stored for user ${userId}`);
  } catch (err) {
    console.error('[criticalAlerts] Inbox push error (non-fatal):', err);
  }
}

function getAlertSubject(
  alertType: AlertType,
  ctx: Record<string, string | number | boolean>,
): string {
  switch (alertType) {
    case 'trial.expired':        return '⚠️ Votre essai Kompilot a expiré';
    case 'stripe.payment_failed': return `⚠️ Paiement échoué${ctx.amount ? ` de ${ctx.amount}` : ''} — Action requise`;
    case 'app.raid_detected':    return `🚨 ALERTE : ${ctx.raidCount ?? 'Plusieurs'} avis négatifs en rafale détectés`;
  }
}

// ── POST /api/alerts/critical — internal endpoint (requires BLINK_SECRET_KEY) ─

router.post('/api/alerts/critical', async (c) => {
  const rawEnv   = c.env as Record<string, string | undefined>;
  const blink    = getBlink(c.env as unknown as Env);
  const authHeader = c.req.header('Authorization') ?? '';

  // Require secret key for internal callers (webhooks, cron jobs)
  if (authHeader !== `Bearer ${rawEnv.BLINK_SECRET_KEY}`) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  let body: AlertPayload;
  try {
    body = await c.req.json<AlertPayload>();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { userId, alertType, metadata = {} } = body;

  if (!userId || !alertType) {
    return c.json({ error: 'userId and alertType are required' }, 400);
  }

  const validTypes: AlertType[] = ['trial.expired', 'stripe.payment_failed', 'app.raid_detected'];
  if (!validTypes.includes(alertType)) {
    return c.json({ error: `Unknown alertType: ${alertType}` }, 400);
  }

  // Fetch user record to get phone number
  const userRows = await blink.db.users.list({ where: { id: userId }, limit: 1 });
  const user     = userRows[0] as any;

  if (!user) {
    console.warn(`[criticalAlerts] User ${userId} not found`);
    return c.json({ error: 'User not found' }, 404);
  }

  const userMeta  = JSON.parse(user.metadata ?? '{}') as Record<string, any>;
  const phone     = (user.phone ?? userMeta.phone ?? '') as string;
  const smsText   = SMS_MESSAGES[alertType](metadata);
  const results: { sms: boolean; push: boolean } = { sms: false, push: false };

  // 1. SMS alert
  if (phone && phone.length >= 8) {
    await sendSmsAlert(phone, smsText, rawEnv);
    results.sms = true;
  } else {
    console.warn(`[criticalAlerts] No phone for user ${userId} — SMS skipped`);
  }

  // 2. In-app push (inbox message)
  await storePushNotification(blink, userId, alertType, metadata);
  results.push = true;

  console.log(`[criticalAlerts] ${alertType} → user ${userId} | sms:${results.sms} push:${results.push}`);
  return c.json({ ok: true, alertType, userId, results });
});

// ── GET /api/alerts/critical/health — simple health check ─────────────────────

router.get('/api/alerts/critical/health', (c) => {
  const rawEnv = c.env as Record<string, string | undefined>;
  return c.json({
    status:        'ok',
    smsConfigured: !!(rawEnv.SMS_GATEWAY_URL && rawEnv.SMS_API_KEY),
    pushEnabled:   true,
  });
});
