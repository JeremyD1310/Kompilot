export type BetaTestimonialCategory = 'agency' | 'marketing' | 'seo' | 'ecommerce';

export interface BetaTestimonial {
  id: string;
  initials: string;
  name: string;
  role: string;
  quote: string;
  category: BetaTestimonialCategory;
  betaTester: boolean;
  badge: 'Bêta-testeur' | 'Bêta-testeuse';
  publicationApproved: boolean;
}

/**
 * Publication consent is deliberately code-controlled. Set one entry to true
 * only after written consent has been confirmed by the Kompilot team.
 */
export const BETA_TESTIMONIAL_PUBLICATION: Record<string, boolean> = {
  julien: false,
  camille: false,
  marc: false,
  elodie: false,
};

export const BETA_TESTIMONIALS: BetaTestimonial[] = [
  {
    id: 'julien',
    initials: 'JR',
    name: 'Julien R.',
    role: 'Fondateur d’agence Growth',
    quote: 'Nous avons remplacé trois outils par Kompilot. La partie GEO nous donne une vraie avance pour préparer la visibilité de nos clients dans les moteurs IA, tout en réduisant fortement le temps consacré à la création de contenu.',
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
    quote: 'L’interface est fluide et la prise en main a été très rapide. La qualité du copywriting généré dépasse largement ce que nous obtenions avec des prompts classiques.',
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
    quote: 'Kompilot ne produit pas du contenu pour meubler. Les recommandations sont structurées, ciblées et directement exploitables sur plusieurs canaux pour nos clients.',
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
    quote: 'Kompilot comprend la logique des campagnes multi-plateformes sans nous enfermer dans une usine à gaz. Les scripts et les visuels nous permettent d’accélérer nos lancements de produits.',
    category: 'ecommerce',
    betaTester: true,
    badge: 'Bêta-testeuse',
    publicationApproved: BETA_TESTIMONIAL_PUBLICATION.elodie === true,
  },
];

export const getApprovedBetaTestimonials = () =>
  BETA_TESTIMONIALS.filter(testimonial => testimonial.publicationApproved === true);

export const getBetaTestimonial = (id: string) =>
  BETA_TESTIMONIALS.find(testimonial => testimonial.id === id);
