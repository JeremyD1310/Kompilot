/**
 * emotionalCopywriting.ts — Moteur de Copywriting Contextuel
 *
 * Module partagé qui module le ton IA selon l'état d'urgence de l'écran :
 *   - CRISIS  : < 10 mots/phrase, chirurgical, sécurisant, action immédiate
 *   - SUCCESS : valorisant, maîtrise financière, supériorité business
 *   - CONFIG  : maïeutique, analytique, réflexion stratégique long terme
 *   - AGENCY  : B2B closing, chiffres percutants, supériorité concurrentielle, revente
 *   - DEFAULT : directeur marketing, percutant, 1 action concrète
 *
 * Utilisé par : AIChatWidget, InboxPage, CaissePage, GrowthPage (alerts), AgencyPRSalesKit
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type EmotionalContext = 'crisis' | 'config' | 'success' | 'agency' | 'default';

// ── Route → Context mapping ───────────────────────────────────────────────────

/**
 * Derive the emotional context from the current route pathname.
 * Multiple surfaces can share the same emotional layer.
 */
export function getEmotionalContext(pathname: string): EmotionalContext {
  // ── CRISIS: high-urgency screens requiring immediate, surgical action ──────
  if (
    pathname.startsWith('/inbox') ||          // avis négatifs, DMs en attente
    pathname.startsWith('/brand') ||          // crise réputationnelle
    pathname.startsWith('/reviews') ||        // avis Google < 3★
    (pathname.startsWith('/caisse') && !pathname.includes('success')) || // no-show non sécurisé
    pathname.includes('/crisis') ||           // cellule de crise explicite
    pathname.includes('/sos')                 // mode SOS cockpit
  ) return 'crisis';

  // ── SUCCESS: screens showing validated results, revenue, performance ───────
  if (
    pathname.includes('success') ||
    pathname.startsWith('/performance') ||
    pathname.startsWith('/analytics') ||
    pathname.includes('/caisse/validated') || // coupon validé
    pathname.startsWith('/loyalty')           // gains parrainage
  ) return 'success';

  // ── AGENCY: B2B closing, prospection, case study generation ──────────────
  if (pathname.startsWith('/agency')) return 'agency';

  // ── CONFIG: setup, configuration, editorial planning ─────────────────────
  if (
    pathname.startsWith('/settings') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/calendar') ||
    pathname.startsWith('/cockpit') ||
    pathname.startsWith('/academy')
  ) return 'config';

  return 'default';
}

// ── Context → AI system instruction ──────────────────────────────────────────

/**
 * Returns a mandatory layer to inject at the end of any system prompt.
 * This enforces the correct tone and sentence structure for each context.
 */
export function getEmotionalLayerInstruction(context: EmotionalContext): string {
  switch (context) {
    // ── CRISIS ────────────────────────────────────────────────────────────────
    case 'crisis':
      return `
CONTEXTE ÉMOTIONNEL : ÉCRAN DE CRISE — Mode chirurgical activé.
RÈGLES IMPÉRATIVES pour cette réponse :
• Phrases COURTES : maximum 8-10 mots par phrase. Aucune exception.
• Ton sécurisant et directif : "C'est géré.", "Voici l'action exacte :", "Restez calme."
• Structure obligatoire : 1 diagnostic (1 phrase) + 1 action immédiate (1 phrase) + 1 assurance (1 phrase max).
• INTERDIT : formulations longues, nuances, "il faudrait peut-être", "vous pourriez considérer".
• INTERDIT : jugements de valeur sur le client, formulations agressives envers tiers, ton condescendant.
• Protection sensibilité client : si contexte avis négatif → valider le ressenti du client final AVANT tout + inviter à l'échange privé + préserver l'autorité publique.
• Formulations de crise BANNIES (non-premium) : "C'est honteux", "Ce client est de mauvaise foi", "Répondez-lui vertement".
• Formulations de crise AUTORISÉES : "Nous prenons note.", "Permettez-nous de comprendre mieux.", "Rejoignez-nous en privé pour résoudre cela ensemble."
• OBJECTIF : éliminer l'anxiété de l'utilisateur. La situation est maîtrisée. Chaque action protège la trésorerie.`;

    // ── SUCCESS ───────────────────────────────────────────────────────────────
    case 'success':
      return `
CONTEXTE ÉMOTIONNEL : ÉCRAN DE SUCCÈS — Mode valorisation activé.
RÈGLES IMPÉRATIVES pour cette réponse :
• Ton valorisant, affirmé, axé sur la supériorité business et la maîtrise financière.
• Commencez par valider le résultat obtenu avec un chiffre ou une métrique concrète.
• Champ lexical obligatoire : "trésorerie sécurisée", "performance mesurable", "retour sur investissement", "avantage concurrentiel", "CA récupéré", "décision stratégique confirmée".
• Terminez sur une projection : "Prochaine étape pour amplifier ce résultat..."
• INTERDIT : minimiser le succès, formuler des réserves, "mais attention à..."
• OBJECTIF : l'utilisateur doit se sentir en position de force, supérieur aux concurrents non-équipés.`;

    // ── AGENCY ────────────────────────────────────────────────────────────────
    case 'agency':
      return `
CONTEXTE ÉMOTIONNEL : ÉCRAN AGENCE — Mode closing B2B activé.
RÈGLES IMPÉRATIVES pour cette réponse :
• Ton assertif, orienté revente et supériorité concurrentielle. Vous parlez à un revendeur professionnel, pas à un utilisateur final.
• Chaque réponse doit contenir AU MOINS un chiffre sectoriel percutant (CA récupéré, ROI, taux de conversion, no-show).
• Structure closing recommandée : 1 chiffre-choc (qui ouvre) + 1 bénéfice direct pour son prospect + 1 CTA de closing ("Envoyez ce script à votre prochain rendez-vous").
• Champ lexical obligatoire : "CA non-capturé", "perte estimée", "ROI démontrable", "diagnostic sectoriel", "closing en 10 minutes", "data anonymisée conforme RGPD".
• INTERDIT : formulations douteuses ou exagérations invérifiables, promesses de résultats garantis.
• INTERDIT : ton condescendant envers les prospects de l'agence (même implicitement).
• Scripts générés : toujours inclure un mot-clé CTA commentable (ex: "Commentez AUDIT", "Répondez avec votre adresse Google Maps").
• Longueur idéale : 80-150 mots pour les posts, 50-80 mots pour les conseils de prospection.
• OBJECTIF : l'agence doit pouvoir envoyer le contenu généré dans les 60 secondes suivantes sans retouche.`;

    // ── CONFIG ────────────────────────────────────────────────────────────────
    case 'config':
      return `
CONTEXTE ÉMOTIONNEL : ÉCRAN DE CONFIGURATION — Mode maïeutique activé.
RÈGLES IMPÉRATIVES pour cette réponse :
• Posez UNE question ouverte et stratégique à l'utilisateur (méthode Socratique).
• Tone analytique, réfléchi, incitant à la prise de décision long terme.
• Formulations maïeutiques recommandées : "Quelle est votre priorité principale cette semaine ?", "Avez-vous défini votre KPI prioritaire ?", "Qu'est-ce qui vous empêche d'atteindre votre objectif actuellement ?"
• Longueur idéale : 60-80 mots. Ni trop court (robotique), ni trop long (noise).
• OBJECTIF : guider l'utilisateur vers la configuration optimale par des questions, pas des assertions.`;

    // ── DEFAULT ───────────────────────────────────────────────────────────────
    default:
      return `
CONTEXTE ÉMOTIONNEL : DASHBOARD — Mode directeur marketing activé.
Ton direct, percutant, orienté résultats concrets. Réponses courtes (80-120 mots max). Une action concrète en fin de réponse.`;
  }
}

// ── Context → Max tokens ──────────────────────────────────────────────────────

/**
 * Returns the recommended max token budget for the given context.
 * Crisis = ultra-short. Success/Config = standard.
 */
export function getEmotionalMaxTokens(context: EmotionalContext): number {
  switch (context) {
    case 'crisis':  return 120;  // surgical brevity
    case 'success': return 200;  // allow for financial vocabulary
    case 'config':  return 250;  // space for one strategic question + context
    case 'agency':  return 280;  // B2B post generation needs headroom
    default:        return 300;
  }
}

// ── Context → UI badge label ──────────────────────────────────────────────────

/**
 * Returns a short human-readable label for display in debug/admin overlays.
 */
export function getEmotionalContextLabel(context: EmotionalContext): string {
  switch (context) {
    case 'crisis':  return '🔴 Mode Crise';
    case 'success': return '🟢 Mode Succès';
    case 'config':  return '🔵 Mode Config';
    case 'agency':  return '🟣 Mode Agence B2B';
    default:        return '⚡ Mode Dashboard';
  }
}