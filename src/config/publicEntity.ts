export const PUBLIC_ENTITY = {
  name: 'Kompilot',
  url: 'https://www.kompilot.fr',
  email: 'jeremy@kompilot.fr',
  language: 'fr-FR',
  market: 'France',
  category: 'Logiciel SaaS B2B',
  shortDescription: 'Kompilot est un logiciel SaaS B2B de visibilité locale et de communication multicanale.',
  description: 'Kompilot aide les PME, commerces, indépendants, réseaux multi-établissements et agences à préparer leurs contenus, centraliser leurs avis et messages, organiser leurs publications et suivre leur présence sur Google et dans les moteurs de réponse comme ChatGPT et Gemini. Les actions sensibles restent soumises à validation humaine.',
  promise: 'Pilotez votre visibilité locale depuis un seul cockpit IA.',
  founder: { name: 'Jérémy Chevrier', role: 'Fondateur de Kompilot' },
  serviceArea: 'France',
  logo: 'https://www.kompilot.fr/og-image.png',
  verifiedProfiles: [] as string[],
  trial: { days: 14, cardRequired: false, users: 1, establishments: 1, aiCredits: 150, sms: 10 },
  plans: [
    { id: 'pro', name: 'Pro', monthly: 69, annual: 690, establishments: 1, users: 2, aiCredits: 500, sms: 50 },
    { id: 'multi', name: 'Multi', monthly: 129, annual: 1290, establishments: 3, users: 5, aiCredits: 1500, sms: 200 },
    { id: 'agency', name: 'Agency', monthly: 229, annual: 2290, establishments: 10, users: 15, aiCredits: 5000, sms: 500 },
    { id: 'enterprise', name: 'Enterprise', monthly: null, annual: null, establishments: null, users: null, aiCredits: null, sms: null },
  ],
  sectors: [
    { slug: 'restaurants', label: 'Restaurants' },
    { slug: 'boutiques', label: 'Boutiques et commerces' },
    { slug: 'beaute', label: 'Beauté et bien-être' },
    { slug: 'sport', label: 'Sport' },
    { slug: 'artisans', label: 'Artisans' },
    { slug: 'sante', label: 'Santé' },
    { slug: 'immobilier', label: 'Immobilier' },
    { slug: 'agences', label: 'Agences' },
  ],
  pages: {
    features: '/features', local: '/local', pricing: '/pricing', faq: '/faq', resources: '/ressources', about: '/a-propos', editorial: '/politique-editoriale', testimonials: '/temoignages', signup: '/signup',
  },
  lastModified: '2026-09-16',
} as const;

export type PublicPlan = (typeof PUBLIC_ENTITY.plans)[number];
export type PublicSector = (typeof PUBLIC_ENTITY.sectors)[number];
