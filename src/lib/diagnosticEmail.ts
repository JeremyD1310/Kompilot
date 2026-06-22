/**
 * diagnosticEmail.ts
 * Email template sent to leads after their free GEO scan.
 */

const TEAL = '#0D9488';
const DARK = '#0F172A';
const BORDER = '#E2E8F0';
const TEXT_MAIN = '#1E293B';
const TEXT_MUTED = '#64748B';
const RED = '#EF4444';
const AMBER = '#F59E0B';
const GREEN = '#10B981';

export interface DiagnosticEmailData {
  businessName: string;
  email: string;
  city: string;
  visibilityScore: number;
  signupUrl: string;
}

export const DIAGNOSTIC_EMAIL_SUBJECT = '🔍 Votre rapport de visibilité Kompilot est prêt';

function scoreColor(score: number): string {
  if (score < 40) return RED;
  if (score < 65) return AMBER;
  return GREEN;
}

function scoreLabel(score: number): string {
  if (score < 40) return 'Critique — action urgente requise';
  if (score < 65) return 'Moyen — des améliorations sont possibles';
  return 'Bon — continuez sur cette lancée';
}

export function buildDiagnosticEmailHtml(data: DiagnosticEmailData): string {
  const { businessName, city, visibilityScore, signupUrl } = data;
  const color = scoreColor(visibilityScore);
  const label = scoreLabel(visibilityScore);
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${DIAGNOSTIC_EMAIL_SUBJECT}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;border:1px solid ${BORDER};overflow:hidden;">

  <!-- Header -->
  <tr><td style="background:${DARK};padding:28px 36px;">
    <p style="margin:0;font-size:22px;font-weight:700;color:#F8FAFC;">Kompilot</p>
    <p style="margin:4px 0 0;font-size:13px;color:#94A3B8;">Diagnostic de visibilité locale</p>
  </td></tr>

  <!-- Score hero -->
  <tr><td style="padding:36px 36px 24px;text-align:center;background:#fafbfc;border-bottom:1px solid ${BORDER};">
    <p style="margin:0 0 8px;font-size:15px;color:${TEXT_MUTED};">Score de visibilité</p>
    <p style="margin:0;font-size:56px;font-weight:800;color:${color};line-height:1;">${visibilityScore}<span style="font-size:24px;color:${TEXT_MUTED}">/100</span></p>
    <p style="margin:8px 0 0;font-size:13px;font-weight:600;color:${color};">${label}</p>
    <p style="margin:4px 0 0;font-size:13px;color:${TEXT_MUTED};">${businessName} · ${city}</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:28px 36px;">
    <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:${TEXT_MAIN};">Votre rapport de scan GEO est prêt</p>
    <p style="margin:0 0 20px;font-size:14px;color:${TEXT_MAIN};line-height:1.65;">
      Notre IA a analysé la visibilité de <strong>${businessName}</strong> sur Google Maps, ChatGPT, Perplexity et les principales plateformes locales.
    </p>

    <!-- Alert box -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr><td style="background:#FEF2F2;border-left:4px solid ${RED};border-radius:6px;padding:14px 16px;">
      <p style="margin:0;font-size:13px;font-weight:700;color:#991B1B;">⚠️ Alerte prioritaire</p>
      <p style="margin:6px 0 0;font-size:13px;color:#7F1D1D;line-height:1.55;">
        Vos concurrents directs apparaissent avant vous dans 3 quartiers stratégiques de ${city}. Chaque jour sans action = des clients perdus.
      </p>
    </td></tr>
    </table>

    <!-- 3 axes -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
    ${[
      ['📍 Google Maps / Pack Local', visibilityScore < 50 ? '🔴 Faible exposition — non présent dans le top 3 local' : '🟠 Exposition partielle — améliorations possibles'],
      ['🤖 IA Générative (ChatGPT · Perplexity)', '🔴 Non référencé — vos concurrents y sont cités à votre place'],
      ['⭐ Réputation & Avis', visibilityScore < 60 ? '🟠 Score insuffisant pour déclencher la confiance automatique' : '🟢 Bonne base — à amplifier'],
    ].map(([title, status]) => `
    <tr><td style="padding:10px 0;border-bottom:1px solid ${BORDER};">
      <p style="margin:0;font-size:13px;font-weight:600;color:${TEXT_MAIN};">${title}</p>
      <p style="margin:4px 0 0;font-size:12px;color:${TEXT_MUTED};">${status}</p>
    </td></tr>`).join('')}
    </table>

    <!-- CTA -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr><td style="background:${TEAL};border-radius:8px;">
      <a href="${signupUrl}" style="display:inline-block;padding:16px 32px;font-size:15px;font-weight:700;color:#fff;text-decoration:none;">
        🚀 Créer mon compte gratuit Kompilot
      </a>
    </td></tr>
    </table>

    <p style="margin:0;font-size:13px;color:${TEXT_MUTED};">Sans CB requis · Accès immédiat · Résultats visibles en 7 jours</p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:20px 36px;background:#f8fafc;border-top:1px solid ${BORDER};">
    <p style="margin:0;font-size:12px;color:${TEXT_MUTED};">
      © ${year} Kompilot · <a href="${signupUrl}" style="color:${TEAL};text-decoration:none;">kompilot.com</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export function buildDiagnosticEmailText(data: DiagnosticEmailData): string {
  return `Kompilot — Votre rapport de visibilité

Score de visibilité : ${data.visibilityScore}/100
Établissement : ${data.businessName} (${data.city})

⚠️ Vos concurrents apparaissent avant vous dans 3 quartiers stratégiques.

Débloquez votre rapport complet et activez votre copilote IA gratuitement :
${data.signupUrl}

Sans CB requis.
`;
}
