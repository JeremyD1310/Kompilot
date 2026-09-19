/**
 * J+60 Deletion Warning email template.
 * Sent when inactive accounts approach data erasure (30-day and 7-day warnings).
 */

const BASE_URL = 'https://www.kompilot.fr';

const LOGO_SVG = `<svg width="36" height="36" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="8" fill="#0D9488"/>
  <path d="M8 16 C8 11 12 8 16 8 C20 8 24 11 24 16" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <circle cx="16" cy="16" r="3" fill="white"/>
  <path d="M13 22 L16 19 L19 22" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function wrapEmailHtml(headerTitle: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${headerTitle}</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#0D9488 0%,#0F766E 100%);padding:28px 32px 24px;">
      <div style="display:flex;align-items:center;gap:12px;">
        ${LOGO_SVG}
        <span style="color:white;font-size:20px;font-weight:800;letter-spacing:-0.3px;">Kompilot</span>
      </div>
    </div>
    <div style="padding:36px 32px;">
      ${body}
    </div>
    <div style="background:#F8FAFC;padding:20px 32px;border-top:1px solid #E2E8F0;text-align:center;">
      <p style="margin:0 0 6px;font-size:11px;color:#94A3B8;">
        Kompilot · 123 Rue de la Visibilité, 75001 Paris
      </p>
      <p style="margin:0;font-size:11px;color:#94A3B8;">
        <a href="${BASE_URL}/legal" style="color:#94A3B8;text-decoration:underline;">Mentions légales</a>
        &nbsp;·&nbsp;
        <a href="${BASE_URL}/privacy" style="color:#94A3B8;text-decoration:underline;">Confidentialité</a>
        &nbsp;·&nbsp;
        <a href="${BASE_URL}/subscription" style="color:#94A3B8;text-decoration:underline;">Se désabonner</a>
      </p>
      <p style="margin:8px 0 0;font-size:10px;color:#CBD5E1;">© ${new Date().getFullYear()} Kompilot. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>`;
}

// ── J+60 Deletion Warning (data erasure countdown) ───────────────────────────

export function getDataDeletionWarningHtml(
  firstName: string,
  daysRemaining: number,  // 30 or 7
  dashboardUrl: string = `${BASE_URL}/dashboard`,
): string {
  const isUrgent = daysRemaining <= 7;
  const headerEmoji = isUrgent ? '🚨' : '⚠️';
  const headerText = isUrgent
    ? `Suppression imminente dans ${daysRemaining} jours`
    : `Suppression de vos données dans ${daysRemaining} jours`;
  const headerSubtext = isUrgent
    ? 'Dernière chance de conserver votre espace Kompilot'
    : 'Réactivez votre compte pour conserver vos données';

  return wrapEmailHtml('Action requise — suppression de données', `
    <div style="text-align:center;margin:0 0 24px">
      <span style="font-size:40px">${headerEmoji}</span>
      <h1 style="color:#1E293B;font-size:20px;margin:12px 0 4px;font-weight:800">${headerText}</h1>
      <p style="color:#64748B;font-size:13px;margin:0">${headerSubtext}</p>
    </div>

    <p style="color:#1E293B;font-size:14px;margin:0 0 16px">Bonjour <strong>${firstName}</strong>,</p>

    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 16px">
      Votre compte Kompilot est inactif depuis un certain temps. Conformément à notre politique de confidentialité,
      vos données seront <strong>supprimées définitivement dans ${daysRemaining} jours</strong>.
    </p>

    <div style="background:${isUrgent ? '#FEF2F2' : '#FFFBEB'};border:1px solid ${isUrgent ? '#FCA5A5' : '#FDE68A'};border-radius:12px;padding:16px;margin:0 0 20px">
      <p style="color:${isUrgent ? '#991B1B' : '#92400E'};font-size:13px;margin:0 0 8px;font-weight:700">
        Données concernées :
      </p>
      <ul style="color:${isUrgent ? '#991B1B' : '#92400E'};font-size:12px;margin:0;padding-left:20px;line-height:1.8">
        <li>Historique des publications et contenus générés</li>
        <li>Réponses automatiques aux avis Google</li>
        <li>Données d'analyse et statistiques de visibilité</li>
        <li>Configuration des automatisations et alertes</li>
        <li>Liste de prospects et leads capturés</li>
      </ul>
    </div>

    <div style="text-align:center;margin:0 0 24px">
      <a href="${dashboardUrl}" style="display:inline-block;background:${isUrgent ? '#991B1B' : '#0D9488'};color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px">
        ${isUrgent ? '🚨 Réactiver mon compte maintenant' : 'Réactiver mon compte →'}
      </a>
    </div>

    <div style="background:#F8FAFC;border-radius:8px;padding:12px 16px;margin:0 0 16px">
      <p style="color:#64748B;font-size:12px;margin:0;line-height:1.6">
        💡 <strong>Besoin d'aide ?</strong> Répondez à cet email ou contactez-nous à
        <a href="mailto:support@kompilot.fr" style="color:#0D9488">support@kompilot.fr</a>.
        Nous pouvons prolonger la conservation de vos données sur demande.
      </p>
    </div>

    <p style="color:#94A3B8;font-size:12px;text-align:center;margin:0">
      Si vous ne souhaitez plus utiliser Kompilot, aucune action n'est requise — vos données seront supprimées automatiquement.
    </p>
  `);
}
