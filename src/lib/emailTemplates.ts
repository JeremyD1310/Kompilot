/**
 * Kompilot transactional email templates.
 * All styles are inline — no external stylesheets, no images.
 *
 * List-Unsubscribe instructions (add as mail headers on a backend/SMTP layer):
 *   List-Unsubscribe: <https://kompilot.app/unsubscribe?email={{EMAIL}}>, <mailto:unsubscribe@kompilot.app?subject=unsubscribe>
 *   List-Unsubscribe-Post: List-Unsubscribe=One-Click
 */

export const WELCOME_EMAIL_SUBJECT = "🚀 Bienvenue sur Kompilot ! Activez votre cockpit";
export const EMAIL_FROM = "Kompilot <welcome@kompilot.app>";
export const EMAIL_REPLY_TO = "support@kompilot.app";

// ── Milestone email helpers ───────────────────────────────────────────────────

export function getMilestoneEmailSubject(emoji: string, title: string): string {
  return `${emoji} ${title} — Kompilot`;
}

const TEAL = "#0D9488";
const DARK = "#0F172A";
const LIGHT_BG = "#F8FAFC";
const BORDER = "#E2E8F0";
const TEXT_MAIN = "#1E293B";
const TEXT_MUTED = "#64748B";

export function getWelcomeEmailHtml(displayName: string, dashboardUrl: string): string {
  const year = new Date().getFullYear();
  const name = displayName || "là";

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${WELCOME_EMAIL_SUBJECT}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;border:1px solid ${BORDER};overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:${DARK};padding:28px 36px;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#F8FAFC;letter-spacing:-0.3px;">Kompilot</p>
            <p style="margin:4px 0 0;font-size:13px;color:#94A3B8;">Votre copilote pour la présence en ligne</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 36px 28px;">
            <p style="margin:0 0 18px;font-size:18px;font-weight:700;color:${TEXT_MAIN};">Bienvenue, ${name} 👋</p>

            <p style="margin:0 0 16px;font-size:15px;color:${TEXT_MAIN};line-height:1.65;">
              Votre compte Kompilot est prêt. Vous pouvez désormais gérer votre réputation en ligne,
              suivre vos messages entrants et programmer vos publications — tout depuis un seul endroit.
            </p>

            <p style="margin:0 0 28px;font-size:15px;color:${TEXT_MAIN};line-height:1.65;">
              Pour commencer, accédez à votre tableau de bord et configurez votre premier canal.
              Cela ne prend que deux minutes.
            </p>

            <!-- CTA -->
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:${TEAL};border-radius:8px;">
                  <a href="${dashboardUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.2px;">
                    Accéder à mon tableau de bord →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:${TEXT_MUTED};line-height:1.6;">
              Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>
              <a href="${dashboardUrl}" style="color:${TEAL};word-break:break-all;">${dashboardUrl}</a>
            </p>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:0 36px;"><hr style="border:none;border-top:1px solid ${BORDER};margin:0;"/></td></tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 36px;background:${LIGHT_BG};">
            <p style="margin:0;font-size:12px;color:${TEXT_MUTED};line-height:1.6;text-align:center;">
              Vous recevez cet email car vous venez de créer un compte Kompilot.<br/>
              <a href="https://kompilot.app/unsubscribe" style="color:${TEXT_MUTED};">Se désabonner</a>
              &nbsp;·&nbsp;
              <a href="https://kompilot.app/privacy" style="color:${TEXT_MUTED};">Politique de confidentialité</a>
              <br/>© ${year} Kompilot
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function getWelcomeEmailText(displayName: string, dashboardUrl: string): string {
  const name = displayName || "là";
  const year = new Date().getFullYear();
  return `Bienvenue sur Kompilot, ${name} !

Votre compte est prêt. Vous pouvez désormais gérer votre réputation en ligne, suivre vos messages entrants et programmer vos publications depuis un seul endroit.

Pour commencer, accédez à votre tableau de bord :
${dashboardUrl}

---
Vous recevez cet email car vous venez de créer un compte Kompilot.
Se désabonner : https://kompilot.app/unsubscribe
© ${year} Kompilot`;
}

// ── Milestone email templates ─────────────────────────────────────────────────

export function getMilestoneEmailHtml(
  displayName: string,
  milestone: { emoji: string; title: string; body: string; actionLabel: string; actionHref: string },
  dashboardUrl: string,
): string {
  const year = new Date().getFullYear();
  const name = displayName || "là";
  const fullCtaUrl = `${dashboardUrl.replace(/\/$/, "")}${milestone.actionHref}`;

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${milestone.emoji} ${milestone.title}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;border:1px solid ${BORDER};overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:${DARK};padding:28px 36px;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#F8FAFC;letter-spacing:-0.3px;">Kompilot</p>
            <p style="margin:4px 0 0;font-size:13px;color:#94A3B8;">Votre copilote pour la présence en ligne</p>
          </td>
        </tr>

        <!-- Achievement banner -->
        <tr>
          <td style="background:linear-gradient(135deg,#0D9488 0%,#0F766E 100%);padding:32px 36px;text-align:center;">
            <p style="margin:0 0 10px;font-size:52px;line-height:1;">${milestone.emoji}</p>
            <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">${milestone.title}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 36px 28px;">
            <p style="margin:0 0 18px;font-size:18px;font-weight:700;color:${TEXT_MAIN};">Félicitations, ${name} ! 🎉</p>

            <p style="margin:0 0 24px;font-size:15px;color:${TEXT_MAIN};line-height:1.65;">
              ${milestone.body}
            </p>

            <p style="margin:0 0 28px;font-size:15px;color:${TEXT_MAIN};line-height:1.65;">
              Consultez votre tableau de bord pour voir l'impact de cette progression sur votre visibilité locale et découvrir les prochaines étapes recommandées par votre Copilote IA.
            </p>

            <!-- CTA -->
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:${TEAL};border-radius:8px;">
                  <a href="${fullCtaUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.2px;">
                    ${milestone.actionLabel} →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:${TEXT_MUTED};line-height:1.6;">
              Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>
              <a href="${fullCtaUrl}" style="color:${TEAL};word-break:break-all;">${fullCtaUrl}</a>
            </p>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:0 36px;"><hr style="border:none;border-top:1px solid ${BORDER};margin:0;"/></td></tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 36px;background:${LIGHT_BG};">
            <p style="margin:0;font-size:12px;color:${TEXT_MUTED};line-height:1.6;text-align:center;">
              Vous recevez cet email car votre établissement vient de franchir un cap de performance sur Kompilot.<br/>
              <a href="https://kompilot.app/unsubscribe" style="color:${TEXT_MUTED};">Se désabonner</a>
              &nbsp;·&nbsp;
              <a href="https://kompilot.app/privacy" style="color:${TEXT_MUTED};">Politique de confidentialité</a>
              <br/>© ${year} Kompilot
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function getMilestoneEmailText(
  displayName: string,
  milestone: { emoji: string; title: string; body: string; actionLabel: string; actionHref: string },
  dashboardUrl: string,
): string {
  const year = new Date().getFullYear();
  const name = displayName || "là";
  const fullCtaUrl = `${dashboardUrl.replace(/\/$/, "")}${milestone.actionHref}`;

  return `${milestone.emoji} ${milestone.title}

Félicitations, ${name} !

${milestone.body}

Consultez votre tableau de bord pour voir l'impact de cette progression sur votre visibilité locale et découvrir les prochaines étapes recommandées par votre Copilote IA.

${milestone.actionLabel} :
${fullCtaUrl}

---
Vous recevez cet email car votre établissement vient de franchir un cap de performance sur Kompilot.
Se désabonner : https://kompilot.app/unsubscribe
© ${year} Kompilot`;
}
