/**
 * Kompilot — Témoignages clients (données externalisées)
 *
 * Chaque entrée contient des données pour le composant LandingTestimonials.
 * Les avatars sont générés comme cercles colorés avec initiales.
 */
export interface Testimonial {
  name: string;
  role: string;
  company: string;
  sector: string;
  rating: number;
  text: string;
  avatarColor: string;
  metric: { value: string; label: string };
}

export const COMMERCE_REVIEWS: Testimonial[] = [
  {
    name: 'Cas d’usage à documenter', role: 'Commerce local · exemple bêta', company: 'Donnée non publiée', sector: 'Restauration', rating: 0,
    text: 'Préparer des contenus et suivre les avis dans un même espace, avec validation humaine avant toute diffusion.', avatarColor: '#0D9488', metric: { value: 'À documenter', label: 'aucun résultat généralisé' },
  },
  {
    name: 'Cas d’usage à documenter', role: 'Artisanat · exemple bêta', company: 'Donnée non publiée', sector: 'Artisanat', rating: 0,
    text: 'Utiliser le calendrier éditorial pour organiser les communications récurrentes sans multiplier les outils.', avatarColor: '#0A66C2', metric: { value: 'À documenter', label: 'aucun résultat généralisé' },
  },
  {
    name: 'Cas d’usage à documenter', role: 'Professionnel local · exemple bêta', company: 'Donnée non publiée', sector: 'Santé', rating: 0,
    text: 'Consulter les suggestions de contenu et le suivi de présence pour prioriser les prochaines actions.', avatarColor: '#E4405F', metric: { value: 'À documenter', label: 'aucun résultat généralisé' },
  },
];

export const AGENCY_REVIEWS: Testimonial[] = [
  {
    name: 'Cas d’usage à documenter', role: 'Agence digitale · exemple bêta', company: 'Donnée non publiée', sector: 'Agence Digitale', rating: 0,
    text: 'Présenter les actions de plusieurs clients depuis un espace de travail structuré.', avatarColor: '#818CF8', metric: { value: 'À documenter', label: 'aucun résultat généralisé' },
  },
  {
    name: 'Cas d’usage à documenter', role: 'Freelance marketing · exemple bêta', company: 'Donnée non publiée', sector: 'Freelance', rating: 0,
    text: 'Préparer les contenus et centraliser les retours clients dans un même espace.', avatarColor: '#F59E0B', metric: { value: 'À documenter', label: 'aucun résultat généralisé' },
  },
  {
    name: 'Cas d’usage à documenter', role: 'Agence SEO local · exemple bêta', company: 'Donnée non publiée', sector: 'SEO Local', rating: 0,
    text: 'Rendre les points de suivi plus lisibles grâce aux rapports et à une vue d’ensemble.', avatarColor: '#4285F4', metric: { value: 'À documenter', label: 'aucun résultat généralisé' },
  },
];
