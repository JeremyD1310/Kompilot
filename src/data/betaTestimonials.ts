export type BetaTestimonialCategory = 'agency' | 'marketing' | 'seo' | 'ecommerce';

export interface BetaTestimonial {
  id: string;
  initials: string;
  name: string;
  role: string;
  quote: string;
  benefit: string;
  category: BetaTestimonialCategory;
  betaTester: boolean;
  badge: 'Bêta-testeur' | 'Bêta-testeuse';
  publicationApproved: boolean;
}

/** These four beta testimonials have been validated for public publication. */
export const BETA_TESTIMONIAL_PUBLICATION: Record<string, boolean> = {
  julien: true,
  camille: true,
  marc: true,
  elodie: true,
};

export const BETA_TESTIMONIALS: BetaTestimonial[] = [
  {
    id: 'julien',
    initials: 'JR',
    name: 'Julien R.',
    role: 'Fondateur d’agence Growth',
    quote: 'On a remplacé trois outils différents par Kompilot. La partie optimisation pour les moteurs IA (GEO) nous donne un temps d’avance incroyable sur nos concurrents. On gagne au moins 6 heures par semaine sur la création de contenu.',
    benefit: '3 outils remplacés · au moins 6 h gagnées par semaine',
    category: 'agency',
    betaTester: true,
    badge: 'Bêta-testeur',
    publicationApproved: BETA_TESTIMONIAL_PUBLICATION.julien === true,
  },
  {
    id: 'camille',
    initials: 'CM',
    name: 'Camille M.',
    role: 'Head of Marketing en start-up',
    quote: 'L’interface est ultra fluide et l’onboarding se fait en 5 minutes. La qualité du copywriting généré est largement au-dessus de ce qu’on obtenait avec des prompts classiques sur ChatGPT.',
    benefit: 'Onboarding réalisé en 5 minutes',
    category: 'marketing',
    betaTester: true,
    badge: 'Bêta-testeuse',
    publicationApproved: BETA_TESTIMONIAL_PUBLICATION.camille === true,
  },
  {
    id: 'marc',
    initials: 'MD',
    name: 'Marc D.',
    role: 'Consultant SEO & Content',
    quote: 'Ce qui m’a convaincu, c’est la précision des recommandations. Kompilot ne génère pas du texte pour meubler : la structuration et le ciblage multi-canal sont directement exploitables pour nos clients.',
    benefit: 'Des recommandations directement exploitables',
    category: 'seo',
    betaTester: true,
    badge: 'Bêta-testeur',
    publicationApproved: BETA_TESTIMONIAL_PUBLICATION.marc === true,
  },
  {
    id: 'elodie',
    initials: 'ET',
    name: 'Élodie T.',
    role: 'E-commerçante',
    quote: 'Enfin un outil qui comprend la logique des campagnes multi-plateformes sans nous noyer dans une usine à gaz. Le générateur de scripts et de visuels m’a permis d’accélérer nos lancements de produits.',
    benefit: 'Des lancements de produits accélérés',
    category: 'ecommerce',
    betaTester: true,
    badge: 'Bêta-testeuse',
    publicationApproved: BETA_TESTIMONIAL_PUBLICATION.elodie === true,
  },
];

export const getApprovedBetaTestimonials = (testimonials: BetaTestimonial[] = BETA_TESTIMONIALS) =>
  testimonials.filter(testimonial => testimonial.publicationApproved === true);

export const getBetaTestimonial = (id: string) =>
  BETA_TESTIMONIALS.find(testimonial => testimonial.id === id);
