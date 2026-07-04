/**
 * Shared types and constants for UnifiedOnboardingFlow.
 */

export type Step = 0 | 1 | 2 | 3 | 4;
export type ProfileType = 'commerce' | 'agency';

export interface OnboardingData {
  businessName: string;
  city: string;
  sector: string;
  profileType: ProfileType;
  goal: string;
  connectorDone: boolean;
}

export const SECTORS = [
  { id: 'restauration', label: 'Restauration', emoji: '🍽️', type: 'commerce' as ProfileType },
  { id: 'beaute', label: 'Beauté & Bien-être', emoji: '💅', type: 'commerce' as ProfileType },
  { id: 'sante', label: 'Santé & Médical', emoji: '🏥', type: 'commerce' as ProfileType },
  { id: 'immobilier', label: 'Immobilier', emoji: '🏠', type: 'commerce' as ProfileType },
  { id: 'sport', label: 'Sport & Fitness', emoji: '🏋️', type: 'commerce' as ProfileType },
  { id: 'artisan', label: 'Artisanat & BTP', emoji: '🔧', type: 'commerce' as ProfileType },
  { id: 'commerce', label: 'Commerce de proximité', emoji: '🛍️', type: 'commerce' as ProfileType },
  { id: 'ecommerce', label: 'E-commerce', emoji: '📦', type: 'commerce' as ProfileType },
  { id: 'automobile', label: 'Automobile', emoji: '🚗', type: 'commerce' as ProfileType },
  { id: 'agence', label: 'Agence marketing', emoji: '🏢', type: 'agency' as ProfileType },
  { id: 'freelance', label: 'Freelance / Consultant', emoji: '💼', type: 'agency' as ProfileType },
  { id: 'autre', label: 'Autre secteur', emoji: '🏪', type: 'commerce' as ProfileType },
];

export const GOALS = [
  { id: 'visibility', label: 'Visibilité locale', desc: 'Score GEO, référencement IA, fiche Google', color: '#0D9488' },
  { id: 'revenue', label: 'Protéger mon CA', desc: 'Anti no-show, relances SMS, fidélisation', color: '#F59E0B' },
  { id: 'content', label: 'Automatiser mon contenu', desc: 'Calendrier IA, posts auto, visuels', color: '#818CF8' },
  { id: 'clients', label: 'Attirer des clients', desc: 'Prospection IA, publicités, parrainage', color: '#EC4899' },
];

export const CONNECTORS: Record<string, { label: string; icon: string; desc: string }> = {
  restauration: { label: 'Google My Business', icon: '📍', desc: 'Synchronisez votre fiche et vos avis' },
  beaute: { label: 'Planity + Google', icon: '📅', desc: 'Réservations et avis automatisés' },
  immobilier: { label: 'Google + SeLoger', icon: '🏠', desc: 'Indexation et visibilité IA' },
  agence: { label: 'Meta Business Manager', icon: '📊', desc: 'Gestion multi-clients centralisée' },
  default: { label: 'Google My Business', icon: '📍', desc: 'Synchronisez votre fiche et vos avis' },
};

export const STEP_META = [
  { label: 'Identité', iconKey: 'MapPin' },
  { label: 'Objectif', iconKey: 'Target' },
  { label: 'Connexion', iconKey: 'Plug' },
  { label: '1ère action', iconKey: 'Sparkles' },
  { label: 'C\'est parti', iconKey: 'PartyPopper' },
];
