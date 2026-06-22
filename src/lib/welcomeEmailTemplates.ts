/**
 * Welcome & Thank-you email templates
 * Triggered immediately after payment validation, adapted by plan type.
 *
 * B2C (Solo — Starter / Pro / Business / Expert): excitement + first action CTA
 * B2B (Franchise/Réseau): partnership framing + network deployment roadmap
 *
 * Both emails include:
 *  - [Nom_Utilisateur]          → firstName
 *  - [Nom_Enseigne]             → networkName  (B2B only)
 *  - [Nom_Offre]                → planName
 *  - [Liste_Options_Souscrites] → subscribedOptions[]
 *  - [Lien_Onboarding]          → onboardingLink
 *  - [Nombre_Crédits]           → aiCreditsBonus
 */

// ── Helpers ────────────────────────────────────────────────────────────────────

const BASE_URL = 'https://kompilot.blinkpowered.com';

const sharedFooter = `
  <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e2e8f0;text-align:center;">
    <p style="margin:0;font-size:12px;color:#94a3b8;">
      Kompilot · 123 Rue de la Visibilité, 75001 Paris<br/>
      <a href="${BASE_URL}/legal" style="color:#94a3b8;text-decoration:underline;">Mentions légales</a> &nbsp;·&nbsp;
      <a href="${BASE_URL}/privacy" style="color:#94a3b8;text-decoration:underline;">Politique de confidentialité</a> &nbsp;·&nbsp;
      <a href="${BASE_URL}/subscription" style="color:#94a3b8;text-decoration:underline;">Gérer mon abonnement</a>
    </p>
    <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1;">© ${new Date().getFullYear()} Kompilot. Tous droits réservés.</p>
  </div>
`;

function wrapHtml(body: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue chez Kompilot</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0d9488 0%,#0f766e 100%);padding:32px 40px 28px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <div style="width:40px;height:40px;background:rgba(255,255,255,0.2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;">🤖</div>
        <span style="color:white;font-size:18px;font-weight:800;letter-spacing:-0.3px;">Kompilot</span>
      </div>
    </div>
    <!-- Body -->
    <div style="padding:36px 40px;">
      ${body}
      ${sharedFooter}
    </div>
  </div>
</body>
</html>`;
}

/** Renders subscribed options as a clean HTML list */
function renderOptionsList(options: string[]): string {
  const rows = options
    .map(
      (opt, i) =>
        `<li style="display:flex;align-items:flex-start;gap:10px;padding:9px 0;${
          i < options.length - 1 ? 'border-bottom:1px solid #f1f5f9;' : ''
        }font-size:14px;color:#1e293b;line-height:1.4;">${opt}</li>`
    )
    .join('');
  return `<ul style="margin:0;padding:0;list-style:none;">${rows}</ul>`;
}

/** Renders the shared credits-bonus callout for both B2C and B2B */
function creditsBonus(credits: number): string {
  return `
    <div style="background:#fefce8;border:1px solid #fef08a;border-radius:10px;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0;font-size:14px;color:#713f12;line-height:1.5;">
        🎁 <strong>Bonus :</strong> <strong style="color:#0d9488;">${credits} crédits IA de bienvenue</strong> ont été ajoutés à votre solde pour tester immédiatement la génération de masse !
      </p>
    </div>
  `;
}

// ── Plan option mapper ─────────────────────────────────────────────────────────

/** Returns the list of activated marketing features for a given plan name. */
export function getPlanSubscribedOptions(planName: string): string[] {
  const type = detectWelcomeEmailType(planName);
  if (type === 'b2b-franchise') {
    return [
      '🏢 Panneau Tête de Réseau centralisé (multi-établissements)',
      '🌐 Cross-posting automatique Google Maps + YouTube Shorts',
      '💬 Boîte de réception unifiée WhatsApp/Meta (API officielle)',
      '🔍 Module GEO/GEA — Audit ChatGPT, Gemini & Perplexity + Conquête concurrentielle',
      '📄 Rapports PDF de performance réseau',
      '👥 Accès managers locaux sécurisés (sans visibilité financière)',
      '📅 Calendrier de contenu réseau & génération IA en masse',
      '🤝 Gestionnaire de compte dédié & formation équipes incluse',
    ];
  }

  const lower = planName.toLowerCase();

  // Expert / Business — full feature set
  if (lower.includes('expert') || lower.includes('business')) {
    return [
      '🤖 Génération IA de contenu en masse (30 publications/mois)',
      '🌐 Publication automatisée multi-réseaux illimitée',
      '📱 Stories Instagram & Facebook incluses ✨',
      '💬 Boîte de réception unifiée WhatsApp/Meta',
      '🔍 Module GEO/GEA — Audit ChatGPT, Gemini & Perplexity',
      '📢 Multi-diffusion YouTube Shorts & Google Maps',
      '📄 Rapports PDF analytiques avancés',
      '👥 Multi-utilisateurs & accès équipe sécurisés',
    ];
  }

  // Pro / Starter — essential set
  return [
    '🤖 Génération IA de légendes et contenus (15 publications/mois)',
    '🌐 Publication automatisée multi-réseaux (3 réseaux)',
    '💬 Boîte de réception unifiée WhatsApp/Meta',
    '🔍 Audit GEO — Visibilité ChatGPT & Gemini',
    '📅 Agenda éditorial & calendrier de publications',
    '📊 Tableau de bord de performance locale',
  ];
}

/** Returns the onboarding deep-link based on plan type. */
export function getOnboardingLink(planType: WelcomeEmailType): string {
  if (planType === 'b2b-franchise') {
    return `${BASE_URL}/establishments?onboarding=1`;
  }
  return `${BASE_URL}/cockpit?onboarding=1`;
}

// ── B2C template ───────────────────────────────────────────────────────────────

export interface B2CEmailParams {
  firstName: string;
  planName: string;
  aiCreditsBonus: number;
  email: string;
  subscribedOptions: string[];
  onboardingLink: string;
}

export function buildB2CWelcomeEmail(params: B2CEmailParams): { subject: string; html: string; text: string } {
  const { firstName, planName, aiCreditsBonus, subscribedOptions, onboardingLink } = params;

  const subject = `🎉 Félicitations ${firstName} ! Votre copilote IA est activé.`;

  const body = `
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#0f172a;line-height:1.2;">
      🎉 Félicitations !
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
      Offre <strong style="color:#0d9488;">${planName}</strong> activée
    </p>

    <p style="margin:0 0 20px;font-size:15px;color:#1e293b;line-height:1.7;">
      Bonjour <strong>${firstName}</strong>,
    </p>

    <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
      Toute l'équipe de Kompilot vous félicite ! Vous venez de franchir un cap majeur pour la visibilité de votre commerce. Votre abonnement à l'offre <strong style="color:#0d9488;">${planName}</strong> est officiellement actif.
    </p>

    <!-- Activated features -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin:0 0 24px;">
      <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px;">
        🔒 Les super-pouvoirs marketing activés sur votre compte
      </p>
      ${renderOptionsList(subscribedOptions)}
    </div>

    <!-- Onboarding callout -->
    <div style="background:linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%);border:1px solid #bbf7d0;border-radius:12px;padding:20px 24px;margin:0 0 28px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:0.5px;">
        ⚡️ Ne perdez pas une seconde !
      </p>
      <p style="margin:0;font-size:14px;color:#166534;line-height:1.6;">
        Vos futurs clients vous cherchent déjà sur <strong>ChatGPT</strong> et <strong>Google</strong>. Nous vous avons préparé un parcours de bienvenue sur-mesure pour configurer votre cockpit en moins de 2 minutes. Vous aurez le choix entre une <strong>présentation vidéo flash</strong> ou un <strong>guide interactif clic par clic</strong> pour ne louper aucune option.
      </p>
    </div>

    <!-- CTA button -->
    <div style="text-align:center;margin:0 0 28px;">
      <a href="${onboardingLink}"
         style="display:inline-block;background:linear-gradient(135deg,#0d9488,#0f766e);color:white;font-size:15px;font-weight:700;text-decoration:none;padding:16px 36px;border-radius:10px;box-shadow:0 4px 12px rgba(13,148,136,0.3);">
        Faire mes premiers pas dans mon Cockpit IA 🚀
      </a>
    </div>

    <!-- Credits bonus -->
    ${creditsBonus(aiCreditsBonus)}

    <!-- Quick links -->
    <div style="border-top:1px solid #e2e8f0;padding-top:20px;margin-top:4px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#475569;">Pour bien démarrer :</p>
      <table style="border-collapse:collapse;width:100%;">
        <tr>
          <td style="padding:6px 0;">
            <a href="${BASE_URL}/calendar" style="display:flex;align-items:center;gap:8px;text-decoration:none;color:#0d9488;font-size:13px;font-weight:600;">
              📅 Planifier mon premier post
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:6px 0;">
            <a href="${BASE_URL}/inbox" style="display:flex;align-items:center;gap:8px;text-decoration:none;color:#0d9488;font-size:13px;font-weight:600;">
              📬 Découvrir la boîte de réception unifiée
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:6px 0;">
            <a href="${BASE_URL}/performance" style="display:flex;align-items:center;gap:8px;text-decoration:none;color:#0d9488;font-size:13px;font-weight:600;">
              📊 Voir mes premières statistiques
            </a>
          </td>
        </tr>
      </table>
    </div>
  `;

  const text = `🎉 Félicitations ${firstName} ! Votre copilote IA est activé.

Bonjour ${firstName},

Toute l'équipe de Kompilot vous félicite ! Vous venez de franchir un cap majeur pour la visibilité de votre commerce. Votre abonnement à l'offre ${planName} est officiellement actif.

🔒 Les super-pouvoirs marketing qui viennent d'être activés sur votre compte :
${subscribedOptions.map(o => `  ${o}`).join('\n')}

⚡️ Ne perdez pas une seconde ! Vos futurs clients vous cherchent déjà sur ChatGPT et Google. Nous vous avons préparé un parcours de bienvenue sur-mesure pour configurer votre cockpit en moins de 2 minutes. Vous aurez le choix entre une présentation vidéo flash ou un guide interactif clic par clic pour ne louper aucune option.

👉 Faire mes premiers pas dans mon Cockpit IA :
${onboardingLink}

🎁 Bonus : ${aiCreditsBonus} crédits IA de bienvenue ont été ajoutés à votre solde pour tester immédiatement la génération de masse !

—
Kompilot · support@kompilot.app`;

  return { subject, html: wrapHtml(body), text };
}

// ── B2B Franchise/Réseau template ──────────────────────────────────────────────

export interface B2BEmailParams {
  firstName: string;
  networkName: string;
  planName: string;
  email: string;
  subscribedOptions: string[];
  onboardingLink: string;
  aiCreditsBonus: number;
}

export function buildB2BWelcomeEmail(params: B2BEmailParams): { subject: string; html: string; text: string } {
  const { firstName, networkName, planName, subscribedOptions, onboardingLink, aiCreditsBonus } = params;

  const subject = `🤝 Bienvenue chez Kompilot : Déploiement de votre réseau activé`;

  const body = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0f172a;line-height:1.25;">
      🤝 Bienvenue chez Kompilot
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
      Offre <strong style="color:#0d9488;">${planName}</strong> — Réseau <strong>${networkName}</strong>
    </p>

    <p style="margin:0 0 20px;font-size:15px;color:#1e293b;line-height:1.7;">
      Bonjour <strong>${firstName}</strong>,
    </p>

    <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
      Nous sommes honorés de vous compter parmi nos partenaires et vous félicitons pour le lancement opérationnel de la visibilité de votre réseau. Votre contrat cadre pour l'offre <strong style="color:#0d9488;">${planName}</strong> a bien été validé.
    </p>

    <!-- Activated network options -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin:0 0 24px;">
      <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px;">
        🏢 Récapitulatif des configurations et options réseau activées
      </p>
      ${renderOptionsList(subscribedOptions)}
    </div>

    <!-- Onboarding callout -->
    <div style="background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%);border:1px solid #bfdbfe;border-radius:12px;padding:20px 24px;margin:0 0 28px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:0.5px;">
        🚀 Initialisation de votre espace Tête de Réseau
      </p>
      <p style="margin:0;font-size:14px;color:#1e3a8a;line-height:1.6;">
        Vos accès administrateur sont ouverts. Pour vous permettre de prendre vos marques et de comprendre comment déployer sereinement l'outil sur l'ensemble de vos points de vente, nous vous invitons à lancer votre parcours de bienvenue (disponible en <strong>vidéo complète</strong> ou en <strong>mode pas à pas</strong>).
      </p>
    </div>

    <!-- CTA button -->
    <div style="text-align:center;margin:0 0 28px;">
      <a href="${onboardingLink}"
         style="display:inline-block;background:linear-gradient(135deg,#0d9488,#0f766e);color:white;font-size:15px;font-weight:700;text-decoration:none;padding:16px 36px;border-radius:10px;box-shadow:0 4px 12px rgba(13,148,136,0.3);">
        Ouvrir mon Panneau de Gestion Réseau 🏢
      </a>
    </div>

    <!-- Credits bonus -->
    ${creditsBonus(aiCreditsBonus)}

    <!-- Account manager note -->
    <div style="background:#fefce8;border:1px solid #fef9c3;border-radius:10px;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0;font-size:13px;color:#713f12;line-height:1.6;">
        📞 <strong>Note :</strong> Votre gestionnaire de compte dédié prendra contact avec vous par téléphone <strong>sous 24h</strong> pour planifier la formation de vos équipes et l'intégration de vos collaborateurs avec accès sécurisés.<br/>
        En attendant : <a href="mailto:enterprise@kompilot.app" style="color:#0d9488;font-weight:600;">enterprise@kompilot.app</a>
      </p>
    </div>
  `;

  const text = `🤝 Bienvenue chez Kompilot : Déploiement de votre réseau activé

Bonjour ${firstName},

Nous sommes honorés de vous compter parmi nos partenaires et vous félicitons pour le lancement opérationnel de la visibilité de votre réseau. Votre contrat cadre pour l'offre ${planName} a bien été validé.

🏢 Récapitulatif de vos configurations et options réseau activées :
${subscribedOptions.map(o => `  ${o}`).join('\n')}

🚀 Initialisation de votre espace Tête de Réseau :
Vos accès administrateur sont ouverts. Pour vous permettre de prendre vos marques et de comprendre comment déployer sereinement l'outil sur l'ensemble de vos points de vente, nous vous invitons à lancer votre parcours de bienvenue (disponible en vidéo complète ou en mode pas à pas).

👉 Ouvrir mon Panneau de Gestion Réseau :
${onboardingLink}

🎁 Bonus : ${aiCreditsBonus} crédits IA de bienvenue ont été ajoutés à votre solde pour tester immédiatement la génération de masse !

📞 Note : Votre gestionnaire de compte dédié prendra contact avec vous par téléphone sous 24h pour planifier la formation de vos équipes et l'intégration de vos collaborateurs avec accès sécurisés.

—
Kompilot · enterprise@kompilot.app`;

  return { subject, html: wrapHtml(body), text };
}

// ── Plan type detection ────────────────────────────────────────────────────────

/** Returns 'b2b-franchise' for Franchise/Réseau plans, 'b2c' for Solo plans */
export type WelcomeEmailType = 'b2c' | 'b2b-franchise';

export function detectWelcomeEmailType(planName: string): WelcomeEmailType {
  const lower = planName.toLowerCase();
  if (
    lower.includes('franchise') ||
    lower.includes('réseau') ||
    lower.includes('reseau') ||
    lower.includes('enterprise') ||
    lower.includes('entreprise') ||
    lower.includes('network')
  ) {
    return 'b2b-franchise';
  }
  return 'b2c';
}

/** AI credits bonus per plan */
export function getAICreditsBonusForPlan(planName: string): number {
  const lower = planName.toLowerCase();
  // B2B franchise gets premium credits
  if (detectWelcomeEmailType(planName) === 'b2b-franchise') return 200;
  if (lower.includes('business')) return 100;
  if (lower.includes('expert')) return 50;
  if (lower.includes('starter')) return 20;
  if (lower.includes('creator')) return 20;
  if (lower.includes('pro')) return 30;
  return 10;
}
