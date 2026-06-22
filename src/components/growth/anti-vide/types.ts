/**
 * Anti-Vide Engine — Types, constantes et builders de prompts
 */

import type { GoogleReview } from '@/components/inbox/reviewsData';

/* ── Types ───────────────────────────────────────────────────── */
export type Mode      = 'hooks' | 'local-sync' | 'adapt';
export type Structure = 'AIDA' | 'PAS' | 'HOOK_REPULSIF';
export type Network   = 'instagram' | 'tiktok' | 'linkedin' | 'facebook';

/* ── Config structures AIDA/PAS ──────────────────────────────── */
export const STRUCTURE_LABELS: Record<Structure, { label: string; desc: string; emoji: string }> = {
  AIDA:          { label: 'AIDA',          desc: 'Attention → Intérêt → Désir → Action', emoji: '🎯' },
  PAS:           { label: 'PAS',           desc: 'Problème → Agitation → Solution',      emoji: '⚡' },
  HOOK_REPULSIF: { label: 'Hook Répulsif', desc: 'Première ligne qui stoppe le scroll',   emoji: '🔥' },
};

/* ── Config réseaux ──────────────────────────────────────────── */
export interface NetworkConfig {
  label: string;
  format: string;
  color: string;
  videoFormat: boolean;
}

export const NETWORK_CONFIG: Record<Network, NetworkConfig> = {
  instagram: { label: 'Instagram', format: 'Reels / Carrousel',       color: 'border-pink-400 text-pink-600 dark:text-pink-400',   videoFormat: true  },
  tiktok:    { label: 'TikTok',    format: 'Script vidéo court',       color: 'border-slate-700 text-slate-700 dark:text-slate-300', videoFormat: true  },
  linkedin:  { label: 'LinkedIn',  format: 'Post texte aéré',          color: 'border-blue-500 text-blue-600 dark:text-blue-400',   videoFormat: false },
  facebook:  { label: 'Facebook',  format: 'Post + CTA commentaire',   color: 'border-indigo-500 text-indigo-600 dark:text-indigo-400', videoFormat: false },
};

/* ── Événements locaux prédéfinis ────────────────────────────── */
export const LOCAL_EVENTS = [
  { id: 'weather_rain',   label: 'Pluie prévue demain',         emoji: '🌧️' },
  { id: 'weather_sun',    label: 'Beau temps ce week-end',       emoji: '☀️' },
  { id: 'market_day',     label: 'Marché local samedi matin',    emoji: '🛒' },
  { id: 'match_tonight',  label: 'Match de foot ce soir',        emoji: '⚽' },
  { id: 'bank_holiday',   label: 'Jour férié cette semaine',     emoji: '🎉' },
  { id: 'back_to_school', label: 'Rentrée des classes',          emoji: '🎒' },
] as const;

export type LocalEvent = typeof LOCAL_EVENTS[number];

/* ── Builders de prompts ─────────────────────────────────────── */

/** Règles de format par réseau */
function networkRules(network: Network, city: string): string {
  const rules: Record<Network, string> = {
    instagram: `
Format INSTAGRAM/REELS :
- Hook visuel : ligne 1 doit stopper le scroll en 1 seconde
- Inclure des indications de texte à l'écran entre [TEXTE_ÉCRAN : ...]
- Indiquer la durée par segment (ex: "0-3s : ...")
- Terminer par un CTA clair (ex: "Lien en bio →", "Commente X si tu veux le guide")
- Max 2200 caractères avec émojis stratégiques`,
    tiktok: `
Format TIKTOK :
- Script découpé : 0-3s (Hook), 3-15s (Valeur), 15-30s (Twist), 30-60s (CTA)
- Indications de texte à l'écran entre [TEXTE_ÉCRAN : ...]
- Voix off entre quotes "..."
- Ton : énergie haute, rythme rapide, authentique`,
    linkedin: `
Format LINKEDIN :
- Ligne 1 : question ou affirmation polarisante (pas de "Je suis ravi de...")
- Structure en courts paragraphes aérés (1-2 lignes chacun)
- Listes à puces pour les points clés (max 5 bullets)
- CTA final : question ouverte pour générer des commentaires
- Hashtags : 3-5 pertinents en fin de post`,
    facebook: `
Format FACEBOOK :
- Ouverture : anecdote courte ou question locale
- Corps : bénéfice concret pour les habitants de ${city}
- Ton : chaleureux, communautaire, accessible
- CTA : "Tague un ami qui...", "Dis-nous en commentaire..."
- Longueur : 150-300 mots`,
  };
  return rules[network];
}

/** Instructions par structure */
function structureInstructions(structure: Structure): string {
  const map: Record<Structure, string> = {
    AIDA: `
Structure AIDA obligatoire :
1. ATTENTION → Accroche percutante (fait surprenant, question, chiffre)
2. INTÉRÊT   → Pourquoi ça concerne le lecteur
3. DÉSIR     → Vision de la transformation / bénéfice vécu
4. ACTION    → CTA précis et unique`,
    PAS: `
Structure PAS obligatoire :
1. PROBLÈME   → Nomme la douleur exacte avec empathie
2. AGITATION  → Amplifie le problème (conséquences si rien n'est fait)
3. SOLUTION   → Présente l'établissement comme la solution évidente`,
    HOOK_REPULSIF: `
MODE "HOOK RÉPULSIF AU VIDE" :
Génère UNIQUEMENT les 3 premières lignes / secondes du contenu.
Objectifs :
- Stopper le scroll en moins de 1 seconde
- Créer une tension irrésistible (curiosité, peur de rater, défiance)
- Utiliser des formules éprouvées : "Arrêtez de faire X", "La vérité sur Y",
  "Ce que personne ne vous dit sur Z", "+X% de [résultat] grâce à..."
- NE PAS révéler la solution dans le hook
Génère 3 variantes différentes numérotées.`,
  };
  return map[structure];
}

export function buildHookPrompt(
  structure: Structure, topic: string, network: Network, name: string, city: string,
): string {
  return `Tu es un expert en copywriting social media pour TPE/PME françaises.
Établissement : ${name} à ${city}. Sujet : ${topic}. Réseau : ${NETWORK_CONFIG[network].format}.
${networkRules(network, city)}
${structureInstructions(structure)}
Génère le contenu directement, sans explication. Commence immédiatement.`;
}

export function buildReviewSyncPrompt(review: GoogleReview, network: Network, name: string): string {
  return `Tu es expert en social media pour TPE/PME françaises. Établissement : ${name}.
Un client (${review.authorName}) a laissé cet avis 5★ : "${review.text}"
Crée un post ${NETWORK_CONFIG[network].format} authentique pour valoriser ce témoignage.
- Ne pas inventer de propos non dits · CTA invitant d'autres avis
- Mention discrète "avec permission de ${review.authorName}"
Commence directement par le post.`;
}

export function buildEventSyncPrompt(
  event: LocalEvent, topic: string, network: Network, name: string, city: string,
): string {
  return `Tu es expert en marketing local pour TPE/PME françaises.
Établissement : ${name} à ${city}. Événement : ${event.label}. Offre liée : ${topic || 'non précisée'}.
Réseau : ${NETWORK_CONFIG[network].format}.
Génère un post qui surfe sur l'actualité locale de manière pertinente et créative.
Format vidéo si applicable (Instagram/TikTok). CTA local clair. Commence directement.`;
}

export function buildAdaptPrompt(original: string, networks: Network[]): string {
  return `Tu es expert en adaptation social media.
Contenu original :
"""
${original}
"""
Adapte ce contenu pour chaque réseau, en respectant leurs codes respectifs :
${networks.map(n => `- ${NETWORK_CONFIG[n].label} (${NETWORK_CONFIG[n].format})`).join('\n')}

Instagram/TikTok → script vidéo avec [TEXTE_ÉCRAN : ...]
LinkedIn/Facebook → texte aéré, listes à puces, CTA pour commentaires

Sépare chaque version par "═══ [NOM_RÉSEAU] ═══"
Commence directement.`;
}
