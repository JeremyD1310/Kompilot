export function filterGoogleMapsContent(text: string): string {
  // Remove phone numbers (French formats)
  let cleaned = text.replace(/(?:(?:\+|00)33|0)\s*[1-9](?:[\s.\-]?\d{2}){4}/g, '');
  // Remove raw http/https URLs
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '');
  // Remove orphaned parentheses or brackets left after URL removal
  cleaned = cleaned.replace(/\(\s*\)/g, '').replace(/\[\s*\]/g, '');
  // Collapse multiple spaces/newlines
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  return cleaned;
}

export const POST_TYPES = [
  { id: 'promotion', label: 'Promotion 🏷️' },
  { id: 'coulisses', label: 'Savoir-faire / Coulisses 🛠️' },
  { id: 'evenement', label: 'Actualité 📅' },
];

export const IDEA_SUGGESTIONS = [
  "Offre flash du week-end 🏷️",
  "Coulisses de notre atelier 🛠️",
  "Plat du jour à emporter 🍽️",
  "Témoignage client du mois ⭐",
  "Nouveau produit en avant-première 🎁",
  "Agenda de la semaine 📅",
  "Tips / Conseil du jour 💡",
  "Événement local auquel on participe 🗓️",
  "Heure d'ouverture spéciale 🕐",
];

export const TONES = [
  { id: 'professionnel', label: 'Professionnel' },
  { id: 'amical', label: 'Amical' },
  { id: 'vendeur', label: 'Vendeur' },
  { id: 'humoristique', label: 'Humoristique' },
];

export const CHANNELS: { id: string; label: string; emoji: string; color: string }[] = [
  { id: 'instagram', label: 'Instagram',    emoji: '📸', color: 'from-orange-400 to-purple-600' },
  { id: 'facebook',  label: 'Facebook',     emoji: '👥', color: 'from-blue-500 to-blue-700' },
  { id: 'google',    label: 'Google Maps',  emoji: '📍', color: 'from-red-400 to-red-600' },
  { id: 'youtube',   label: 'YouTube Shorts', emoji: '▶️', color: 'from-red-500 to-red-700' },
  { id: 'linkedin',  label: 'LinkedIn',     emoji: '💼', color: 'from-blue-600 to-blue-800' },
];
