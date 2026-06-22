/**
 * sectorProfiles.ts — Point d'entrée public du système de polymorphisme B2B.
 * Re-exporte les types, données et helpers depuis les sous-modules.
 */

// ── Re-exports ───────────────────────────────────────────────────────────────
export type { MasterProfile, GranularSector, AppModule, LexiconDictionary, WalkthroughStep, MasterProfileConfig, CommerceSectorOption } from './sectors/types';
export { SECTOR_LEXICON_OVERRIDE, MASTER_PROFILE_LEXICON } from './sectors/lexicons';
export { MASTER_PROFILES, COMMERCE_SECTORS, SECTOR_TO_MASTER_PROFILE } from './sectors/profiles';

// ── Helpers ──────────────────────────────────────────────────────────────────
import type { MasterProfile, GranularSector, AppModule } from './sectors/types';
import type { LexiconDictionary } from './sectors/types';
import { LEXICON_STANDARD, SECTOR_LEXICON_OVERRIDE, MASTER_PROFILE_LEXICON } from './sectors/lexicons';
import { MASTER_PROFILES, SECTOR_TO_MASTER_PROFILE } from './sectors/profiles';

export function getMasterProfileConfig(masterProfile: MasterProfile) {
  if (!masterProfile) return null;
  return MASTER_PROFILES[masterProfile] ?? null;
}

export function getLexiconForSector(sector: GranularSector | null): LexiconDictionary {
  if (!sector) return LEXICON_STANDARD;
  if (SECTOR_LEXICON_OVERRIDE[sector]) return SECTOR_LEXICON_OVERRIDE[sector]!;
  const mp = SECTOR_TO_MASTER_PROFILE[sector];
  return mp ? (MASTER_PROFILE_LEXICON[mp] ?? LEXICON_STANDARD) : LEXICON_STANDARD;
}

export function isModuleActive(masterProfile: MasterProfile, module: AppModule): boolean {
  if (!masterProfile) return false;
  return MASTER_PROFILES[masterProfile]?.activatedModules.includes(module) ?? false;
}

export function getActivatedModules(masterProfile: MasterProfile): AppModule[] {
  if (!masterProfile) return [];
  return MASTER_PROFILES[masterProfile]?.activatedModules ?? [];
}

export function buildMentorSystemPrompt(
  masterProfile: MasterProfile,
  sector: GranularSector | null,
  establishmentName?: string,
): string {
  const lexicon = getLexiconForSector(sector);
  const config = getMasterProfileConfig(masterProfile);
  const biz = establishmentName ? `pour "${establishmentName}"` : 'pour ce commerce';
  const mode = config?.mentorMode ?? 'default';

  const modeSpecific: Record<string, string> = {
    terrain: `Tu parles le langage du terrain ${biz}. Mentionne "tables", "couverts", "RDV", "équipes en salle".`,
    chantier: `Tu t'adresses à un professionnel du bâtiment/artisanat ${biz}. Focus sur devis, zones d'intervention et qualification des projets.`,
    conciergerie: `Tu t'adresses à un gestionnaire de conciergerie/location ${biz}. Focus sur check-in/check-out, cautions et satisfaction voyageurs.`,
    services: `Tu t'adresses à un professionnel des services B2B ${biz}. Focus sur qualification leads, renouvellements de contrats et valeur vie client.`,
    agency: `Tu t'adresses à une agence marketing ${biz}. Focus sur ROI démontrable, gestion multi-clients, marque blanche et rapport G.E.O.`,
    default: `Tu conseilles ce commerce local ${biz} sur sa présence digitale et ses performances marketing.`,
  };

  return `Tu es le Copilote Marketing de Kompilot, expert en présence digitale locale. Direct, percutant, orienté ROI. Chaque réponse se termine par UNE action concrète. Réponses courtes (max 120 mots). Réponds toujours en français.

DICTIONNAIRE MÉTIER (utilise TOUJOURS ces termes) :
- "${lexicon.client}" au lieu de "client"
- "${lexicon.rendezvous}" au lieu de "rendez-vous"
- "${lexicon.vente}" au lieu de "vente"
- "${lexicon.offre}" au lieu de "offre"

${modeSpecific[mode] ?? modeSpecific.default}

FONCTIONNALITÉS CLÉS : Score G.E.O. (présence IA), Mode SOS Crise (fermeture urgente), Calendrier Événementiel (matchs/festivals), Anti-No Show Stripe, Coupons Flash IA, Avis Google.

Si l'utilisateur veut créer un post, génère le texte et ajoute : [POST_DRAFT]texte_ici[/POST_DRAFT]`;
}
