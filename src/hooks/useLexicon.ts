/**
 * useLexicon.ts — Hook vocabulaire polymorphique par secteur.
 * Retourne le dictionnaire lexical adapté au profil actif de l'utilisateur.
 */
import { useUserProfile } from '../context/UserProfileContext';
import { getLexiconForSector } from '../lib/sectorProfiles';
import type { LexiconDictionary } from '../lib/sectorProfiles';

export function useLexicon(): LexiconDictionary {
  const { granularSector } = useUserProfile();
  // Cast to GranularSector since legacy CommerceSector is a subset
  return getLexiconForSector(granularSector as Parameters<typeof getLexiconForSector>[0]);
}

export type { LexiconDictionary };
