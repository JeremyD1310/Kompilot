/**
 * EmailNotificationService — Centralized email notifications for key events.
 *
 * Uses Blink SDK `blink.notifications.email()` (platform-provided, no API keys needed).
 * All emails are logged to `email_notification_log` table for audit.
 *
 * Events covered:
 *   - New user registration (welcome)
 *   - Password reset request
 *   - Failed login attempts (security alert)
 *   - Subscription changes
 *   - Critical system alerts
 */

import { ACTIONS } from './activityLogger';

interface BlinkClient {
  db: {
    table: <T>(name: string) => {
      create: (data: Partial<T>) => Promise<T>;
    };
  };
  notifications: {
    email: (opts: {
      to: string | string[];
      subject: string;
      html: string;
      text?: string;
      replyTo?: string;
    }) => Promise<{ success: boolean; messageId: string }>;
  };
}

interface EmailLogEntry {
  userId?: string;
  recipientEmail: string;
  notificationType: string;
  subject: string;
  status: string;
  messageId?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

async function logEmail(blink: BlinkClient, entry: EmailLogEntry): Promise<void> {
  try {
    await blink.db.table<{ id: string }>('email_notification_log').create({
      id: `enl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      user_id: entry.userId || '',
      recipient_email: entry.recipientEmail,
      notification_type: entry.notificationType,
      subject: entry.subject,
      status: entry.status,
      message_id: entry.messageId || '',
      error_message: entry.errorMessage || '',
      metadata: JSON.stringify(entry.metadata || {}),
    } as any);
  } catch (err) {
    console.error('[EmailNotificationService] Failed to log email:', err);
  }
}

// ── Templates ─────────────────────────────────────────────────────────────────

const KOMPILOT_BRAND = {
  logoUrl: 'https://kompilot.fr/og-image.png',
  primaryColor: '#0D9488',
  backgroundColor: '#0F172A',
  textColor: '#E2E8F0',
  mutedColor: '#64748B',
  siteUrl: 'https://kompilot.fr',
};

function wrapTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:${KOMPILOT_BRAND.backgroundColor};font-family:Inter,system-ui,-apple-system,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:32px 24px;">
  <div style="text-align:center;margin-bottom:28px;">
    <img src="${KOMPILOT_BRAND.logoUrl}" alt="Kompilot" height="40" style="height:40px;" />
  </div>
  ${content}
  <div style="margin-top:32px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
    <p style="color:${KOMPILOT_BRAND.mutedColor};font-size:11px;line-height:1.6;">
      © 2026 Kompilot — Fait avec ❤️ en France<br/>
      <a href="${KOMPILOT_BRAND.siteUrl}" style="color:${KOMPILOT_BRAND.primaryColor};text-decoration:none;">kompilot.fr</a>
      · <a href="${KOMPILOT_BRAND.siteUrl}/confidentialite" style="color:${KOMPILOT_BRAND.mutedColor};text-decoration:none;">Confidentialité</a>
      · <a href="${KOMPILOT_BRAND.siteUrl}/mentions-legales" style="color:${KOMPILOT_BRAND.mutedColor};text-decoration:none;">Mentions légales</a>
    </p>
  </div>
</div>
</body>
</html>`;
}

function buttonHtml(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:${KOMPILOT_BRAND.primaryColor};color:#fff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;box-shadow:0 4px 16px rgba(13,148,136,0.3);">${text}</a>`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Send welcome email after new user registration.
 */
export async function sendWelcomeEmail(
  blink: BlinkClient,
  params: { userId: string; email: string; displayName?: string },
): Promise<void> {
  const name = params.displayName || params.email.split('@')[0];
  const subject = `Bienvenue sur Kompilot, ${name} ! 🚀`;
  const html = wrapTemplate(`
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px 24px;">
      <h1 style="color:${KOMPILOT_BRAND.textColor};font-size:22px;font-weight:800;margin:0 0 12px;">Bienvenue, ${name} !</h1>
      <p style="color:${KOMPILOT_BRAND.mutedColor};font-size:14px;line-height:1.7;margin:0 0 20px;">
        Votre compte Kompilot est maintenant actif. Vous pouvez dès à présent gérer votre présence locale,
        planifier vos publications et suivre vos avis Google — le tout depuis un seul tableau de bord.
      </p>
      <div style="text-align:center;margin:24px 0;">
        ${buttonHtml('Accéder à mon tableau de bord', `${KOMPILOT_BRAND.siteUrl}/dashboard`)}
      </div>
      <p style="color:${KOMPILOT_BRAND.mutedColor};font-size:12px;line-height:1.6;margin:20px 0 0;">
        💡 <strong>Conseil :</strong> Connectez votre fiche Google Business en 2 minutes pour activer le suivi automatique de vos avis et votre score de visibilité locale.
      </p>
    </div>
  `);

  try {
    const result = await blink.notifications.email({
      to: params.email,
      subject,
      html,
      text: `Bienvenue sur Kompilot, ${name} ! Votre compte est actif. Accédez à votre tableau de bord : ${KOMPILOT_BRAND.siteUrl}/dashboard`,
      replyTo: 'support@kompilot.fr',
    });
    await logEmail(blink, {
      userId: params.userId,
      recipientEmail: params.email,
      notificationType: ACTIONS.AUTH_SIGNUP,
      subject,
      status: 'sent',
      messageId: result.messageId,
    });
  } catch (err: any) {
    await logEmail(blink, {
      userId: params.userId,
      recipientEmail: params.email,
      notificationType: ACTIONS.AUTH_SIGNUP,
      subject,
      status: 'failed',
      errorMessage: err?.message || String(err),
    });
  }
}

/**
 * Send password reset confirmation email.
 */
export async function sendPasswordResetEmail(
  blink: BlinkClient,
  params: { userId: string; email: string; resetUrl: string },
): Promise<void> {
  const subject = 'Réinitialisation de votre mot de passe Kompilot';
  const html = wrapTemplate(`
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px 24px;">
      <h1 style="color:${KOMPILOT_BRAND.textColor};font-size:20px;font-weight:800;margin:0 0 12px;">Mot de passe oublié 🔐</h1>
      <p style="color:${KOMPILOT_BRAND.mutedColor};font-size:14px;line-height:1.7;margin:0 0 20px;">
        Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe. Ce lien expire dans 1 heure.
      </p>
      <div style="text-align:center;margin:24px 0;">
        ${buttonHtml('Réinitialiser mon mot de passe', params.resetUrl)}
      </div>
      <p style="color:${KOMPILOT_BRAND.mutedColor};font-size:12px;line-height:1.6;margin:20px 0 0;">
        Si vous n'avez pas fait cette demande, ignorez cet email. Votre mot de passe actuel reste valide.
      </p>
    </div>
  `);

  try {
    const result = await blink.notifications.email({
      to: params.email,
      subject,
      html,
      text: `Réinitialisez votre mot de passe : ${params.resetUrl}`,
      replyTo: 'support@kompilot.fr',
    });
    await logEmail(blink, {
      userId: params.userId,
      recipientEmail: params.email,
      notificationType: ACTIONS.AUTH_PASSWORD_RESET_REQUEST,
      subject,
      status: 'sent',
      messageId: result.messageId,
    });
  } catch (err: any) {
    await logEmail(blink, {
      userId: params.userId,
      recipientEmail: params.email,
      notificationType: ACTIONS.AUTH_PASSWORD_RESET_REQUEST,
      subject,
      status: 'failed',
      errorMessage: err?.message || String(err),
    });
  }
}

/**
 * Send security alert for failed login attempts.
 */
export async function sendSecurityAlert(
  blink: BlinkClient,
  params: { userId?: string; email: string; failedAttempts: number; ipAddress?: string },
): Promise<void> {
  const subject = `⚠️ Alerte sécurité : ${params.failedAttempts} tentative(s) de connexion échouée(s)`;
  const html = wrapTemplate(`
    <div style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-radius:16px;padding:28px 24px;">
      <h1 style="color:#F87171;font-size:20px;font-weight:800;margin:0 0 12px;">Alerte de sécurité ⚠️</h1>
      <p style="color:${KOMPILOT_BRAND.mutedColor};font-size:14px;line-height:1.7;margin:0 0 16px;">
        <strong>${params.failedAttempts} tentative(s) de connexion échouée(s)</strong> ont été détectées sur votre compte Kompilot.
      </p>
      ${params.ipAddress ? `<p style="color:${KOMPILOT_BRAND.mutedColor};font-size:13px;margin:0 0 16px;">Adresse IP : <code style="color:${KOMPILOT_BRAND.textColor};background:rgba(255,255,255,0.06);padding:2px 6px;border-radius:4px;">${params.ipAddress}</code></p>` : ''}
      <div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:16px;margin:16px 0;">
        <p style="color:${KOMPILOT_BRAND.textColor};font-size:13px;font-weight:600;margin:0 0 8px;">Actions recommandées :</p>
        <ul style="color:${KOMPILOT_BRAND.mutedColor};font-size:13px;line-height:1.8;margin:0;padding-left:20px;">
          <li>Changez votre mot de passe si vous ne reconnaissez pas ces tentatives</li>
          <li>Activez l'authentification à deux facteurs pour plus de sécurité</li>
          <li>Vérifiez qu'aucun appareil inconnu n'est connecté à votre compte</li>
        </ul>
      </div>
      <div style="text-align:center;margin:24px 0;">
        ${buttonHtml('Sécuriser mon compte', `${KOMPILOT_BRAND.siteUrl}/account`)}
      </div>
    </div>
  `);

  try {
    const result = await blink.notifications.email({
      to: params.email,
      subject,
      html,
      text: `Alerte sécurité : ${params.failedAttempts} tentative(s) de connexion échouée(s) sur votre compte Kompilot. Sécurisez votre compte : ${KOMPILOT_BRAND.siteUrl}/account`,
      replyTo: 'support@kompilot.fr',
    });
    await logEmail(blink, {
      userId: params.userId,
      recipientEmail: params.email,
      notificationType: ACTIONS.AUTH_FAILED_LOGIN,
      subject,
      status: 'sent',
      messageId: result.messageId,
      metadata: { failedAttempts: params.failedAttempts, ipAddress: params.ipAddress },
    });
  } catch (err: any) {
    await logEmail(blink, {
      userId: params.userId,
      recipientEmail: params.email,
      notificationType: ACTIONS.AUTH_FAILED_LOGIN,
      subject,
      status: 'failed',
      errorMessage: err?.message || String(err),
    });
  }
}

/**
 * Send subscription change notification.
 */
export async function sendSubscriptionChangeEmail(
  blink: BlinkClient,
  params: { userId: string; email: string; planName: string; changeType: 'started' | 'cancelled' | 'changed' },
): Promise<void> {
  const titles: Record<string, string> = {
    started: `🎉 Votre abonnement ${params.planName} est activé !`,
    cancelled: `Votre abonnement ${params.planName} a été annulé`,
    changed: `Votre plan a été modifié : ${params.planName}`,
  };
  const subject = titles[params.changeType];
  const html = wrapTemplate(`
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px 24px;">
      <h1 style="color:${KOMPILOT_BRAND.textColor};font-size:20px;font-weight:800;margin:0 0 12px;">${subject}</h1>
      <p style="color:${KOMPILOT_BRAND.mutedColor};font-size:14px;line-height:1.7;margin:0 0 20px;">
        ${params.changeType === 'started'
          ? `Bienvenue dans l'offre ${params.planName} ! Vous avez maintenant accès à toutes les fonctionnalités de votre plan.`
          : params.changeType === 'cancelled'
          ? 'Votre accès restera actif jusqu\'à la fin de la période de facturation en cours.'
          : 'Votre nouveau plan est effectif immédiatement. Découvrez vos nouvelles fonctionnalités !'}
      </p>
      <div style="text-align:center;margin:24px 0;">
        ${buttonHtml('Gérer mon abonnement', `${KOMPILOT_BRAND.siteUrl}/subscription`)}
      </div>
    </div>
  `);

  try {
    const result = await blink.notifications.email({
      to: params.email,
      subject,
      html,
      replyTo: 'support@kompilot.fr',
    });
    await logEmail(blink, {
      userId: params.userId,
      recipientEmail: params.email,
      notificationType: `billing.subscription_${params.changeType}`,
      subject,
      status: 'sent',
      messageId: result.messageId,
    });
  } catch (err: any) {
    await logEmail(blink, {
      userId: params.userId,
      recipientEmail: params.email,
      notificationType: `billing.subscription_${params.changeType}`,
      subject,
      status: 'failed',
      errorMessage: err?.message || String(err),
    });
  }
}

/**
 * Send critical system alert to admin team.
 */
export async function sendAdminAlert(
  blink: BlinkClient,
  params: { subject: string; message: string; severity: 'warning' | 'error' | 'critical'; metadata?: Record<string, unknown> },
): Promise<void> {
  const adminEmails = ['jeremy@kompilot.fr', 'romain@kompilot.fr', 'valentine@kompilot.fr'];
  const severityEmoji = { warning: '⚠️', error: '🔴', critical: '🚨' };
  const subject = `${severityEmoji[params.severity]} [Kompilot] ${params.subject}`;

  const html = wrapTemplate(`
    <div style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-radius:16px;padding:28px 24px;">
      <h1 style="color:#F87171;font-size:18px;font-weight:800;margin:0 0 12px;">${severityEmoji[params.severity]} Alerte Système</h1>
      <p style="color:${KOMPILOT_BRAND.textColor};font-size:14px;font-weight:600;margin:0 0 8px;">${params.subject}</p>
      <p style="color:${KOMPILOT_BRAND.mutedColor};font-size:13px;line-height:1.7;margin:0 0 16px;">${params.message}</p>
      ${params.metadata ? `<pre style="color:${KOMPILOT_BRAND.mutedColor};font-size:11px;background:rgba(255,255,255,0.03);padding:12px;border-radius:8px;overflow-x:auto;">${JSON.stringify(params.metadata, null, 2)}</pre>` : ''}
      <p style="color:${KOMPILOT_BRAND.mutedColor};font-size:11px;margin:16px 0 0;">
        Sévérité : <strong style="color:${params.severity === 'critical' ? '#F87171' : params.severity === 'error' ? '#FB923C' : '#FBBF24'};">${params.severity.toUpperCase()}</strong>
        · ${new Date().toLocaleString('fr-FR')}
      </p>
    </div>
  `);

  try {
    await blink.notifications.email({
      to: adminEmails,
      subject,
      html,
      replyTo: 'support@kompilot.fr',
    });
    await logEmail(blink, {
      recipientEmail: adminEmails.join(','),
      notificationType: `admin.alert.${params.severity}`,
      subject,
      status: 'sent',
      metadata: params.metadata,
    });
  } catch (err: any) {
    await logEmail(blink, {
      recipientEmail: adminEmails.join(','),
      notificationType: `admin.alert.${params.severity}`,
      subject,
      status: 'failed',
      errorMessage: err?.message || String(err),
    });
  }
}
