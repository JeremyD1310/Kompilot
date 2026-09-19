export const KOMPILOT_IDENTITY = {
  name: 'Kompilot',
  legalName: 'KOMPILOT SAS',
  domain: 'https://www.kompilot.fr',
  supportEmail: 'jeremy@kompilot.fr',
  definition: 'Kompilot est un logiciel SaaS B2B qui centralise la création de contenus, les avis clients, les réseaux sociaux et le suivi de la visibilité locale et GEO.',
  shortDefinition: 'Logiciel SaaS B2B de visibilité locale, communication multicanale et marketing assisté par IA.',
  address: 'France — adresse complète non publiée sur ce référentiel',
  leadership: 'Direction : information non publiée',
  lastModified: '2026-09-16',
} as const;

import { KOMPILOT_PLANS_MONTHLY } from '../components/landing/pricing/PricingData';

export const PUBLIC_PLANS = KOMPILOT_PLANS_MONTHLY
  .filter(plan => plan.id === 'pro' || plan.id === 'multi' || plan.id === 'agency' || plan.id === 'enterprise')
  .map(plan => ({
    name: plan.name,
    monthly: plan.monthlyPrice === null ? 'Sur devis' : `${plan.monthlyPrice} € HT / mois`,
    annual: plan.yearlyTotal === null ? 'Sur devis' : `${plan.yearlyTotal} € HT / an`,
    scope: plan.tagline,
  }));

export const PUBLIC_FEATURES = [
  'Création de contenus assistée par IA',
  'Calendrier éditorial',
  'Gestion des avis Google',
  'Boîte de réception centralisée',
  'Suivi de visibilité locale et GEO',
  'Validation humaine avant publication',
] as const;

export const FAQ_ITEMS = [
  { question: 'Qu’est-ce qu’un logiciel de visibilité locale ?', answer: 'Un logiciel de visibilité locale centralise les informations, contenus, avis et performances qui aident une entreprise à être trouvée par ses clients à proximité. Kompilot rassemble ces actions dans un cockpit destiné aux PME, commerces et agences.' },
  { question: 'Qu’est-ce que le GEO ?', answer: 'Le GEO, ou Generative Engine Optimization, consiste à structurer les informations et les contenus d’une entreprise afin d’aider les moteurs de réponse comme ChatGPT, Gemini et Perplexity à mieux la comprendre et, lorsque leurs critères le permettent, à la mentionner dans leurs réponses.' },
  { question: 'Kompilot garantit-il une apparition dans ChatGPT ou Gemini ?', answer: 'Non. Aucun outil ne peut garantir une citation dans un moteur de réponse. Kompilot aide à améliorer la clarté, la cohérence et la disponibilité des informations utilisées par les moteurs de recherche et les systèmes d’intelligence artificielle.' },
  { question: 'Quelle différence entre Kompilot et ChatGPT ?', answer: 'ChatGPT est un assistant généraliste. Kompilot est un logiciel métier qui organise les informations d’une entreprise, centralise ses canaux, prépare ses contenus, structure ses validations et suit ses actions de visibilité locale et multicanale.' },
  { question: 'Kompilot publie-t-il automatiquement ?', answer: 'Les contenus peuvent être préparés et planifiés dans Kompilot, mais la validation humaine reste obligatoire avant les publications, réponses, invitations et envois sensibles.' },
  { question: 'Kompilot peut-il aider à répondre aux avis Google ?', answer: 'Oui. Kompilot centralise les avis et prépare des propositions de réponses adaptées au contexte. L’utilisateur relit et valide chaque réponse avant son envoi.' },
  { question: 'Kompilot convient-il aux entreprises multi-établissements ?', answer: 'Oui. Les offres Multi et Agency permettent de gérer plusieurs établissements ou plusieurs clients depuis un même espace, avec des limites adaptées à chaque formule.' },
  { question: 'À quels secteurs Kompilot s’adresse-t-il ?', answer: 'Kompilot s’adresse notamment aux restaurants, boutiques, commerces, professionnels de la beauté, coachs sportifs, artisans, professionnels de santé et du bien-être, acteurs de l’immobilier, PME et agences marketing.' },
  { question: 'Combien de temps dure l’essai gratuit ?', answer: 'L’essai gratuit dure 14 jours et ne nécessite pas de carte bancaire. Il comprend un utilisateur, un établissement, 150 crédits IA et 10 SMS.' },
  { question: 'Les données de mon entreprise sont-elles protégées ?', answer: 'Kompilot applique des mesures de sécurité et de contrôle d’accès adaptées à un logiciel SaaS B2B. Les traitements de données et les prestataires utilisés doivent être décrits précisément dans la politique de confidentialité et les documents contractuels.' },
  { question: 'Puis-je résilier mon abonnement ?', answer: 'Les modalités de résiliation doivent correspondre aux conditions commerciales réellement appliquées. Afficher uniquement les conditions confirmées dans les CGV et dans le parcours Stripe.' },
] as const;

export const USE_CASE_FAQS = FAQ_ITEMS;

type GraphNode = Record<string, unknown>;

function createOrganization() {
  return {
    '@type': 'Organization',
    '@id': `${KOMPILOT_IDENTITY.domain}/#organization`,
    name: KOMPILOT_IDENTITY.name,
    legalName: KOMPILOT_IDENTITY.legalName,
    url: `${KOMPILOT_IDENTITY.domain}/`,
    logo: { '@type': 'ImageObject', url: `${KOMPILOT_IDENTITY.domain}/og-image.png`, width: 1200, height: 630 },
    description: KOMPILOT_IDENTITY.definition,
    email: KOMPILOT_IDENTITY.supportEmail,
    contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', email: KOMPILOT_IDENTITY.supportEmail, availableLanguage: ['fr'] },
    areaServed: { '@type': 'Country', name: 'France' },
  };
}

function createWebSite() {
  return {
    '@type': 'WebSite', '@id': `${KOMPILOT_IDENTITY.domain}/#website`, url: `${KOMPILOT_IDENTITY.domain}/`, name: 'Kompilot',
    description: 'Logiciel de visibilité locale, communication B2B et marketing assisté par IA.', publisher: { '@id': `${KOMPILOT_IDENTITY.domain}/#organization` }, inLanguage: 'fr-FR',
  };
}

function createWebPage(path: string, title: string, description: string) {
  const url = `${KOMPILOT_IDENTITY.domain}${path === '/' ? '/' : path}`;
  return { '@type': 'WebPage', '@id': `${url}#webpage`, url, name: title, description, isPartOf: { '@id': `${KOMPILOT_IDENTITY.domain}/#website` }, about: { '@id': `${KOMPILOT_IDENTITY.domain}/#software` }, publisher: { '@id': `${KOMPILOT_IDENTITY.domain}/#organization` }, inLanguage: 'fr-FR', dateModified: KOMPILOT_IDENTITY.lastModified };
}

function createSoftwareApplication() {
  const offers = KOMPILOT_PLANS_MONTHLY
    .filter(plan => plan.id === 'pro' || plan.id === 'multi' || plan.id === 'agency')
    .flatMap(plan => [
      { '@type': 'Offer', name: `Kompilot ${plan.name} mensuel`, url: `${KOMPILOT_IDENTITY.domain}/pricing`, price: `${plan.monthlyPrice}.00`, priceCurrency: 'EUR', priceSpecification: { '@type': 'UnitPriceSpecification', price: `${plan.monthlyPrice}.00`, priceCurrency: 'EUR', billingDuration: 'P1M', valueAddedTaxIncluded: false }, availability: 'https://schema.org/InStock' },
      { '@type': 'Offer', name: `Kompilot ${plan.name} annuel`, url: `${KOMPILOT_IDENTITY.domain}/pricing`, price: `${plan.yearlyTotal}.00`, priceCurrency: 'EUR', priceSpecification: { '@type': 'UnitPriceSpecification', price: `${plan.yearlyTotal}.00`, priceCurrency: 'EUR', billingDuration: 'P1Y', valueAddedTaxIncluded: false }, availability: 'https://schema.org/InStock' },
    ]);
  return {
    '@type': 'SoftwareApplication', '@id': `${KOMPILOT_IDENTITY.domain}/#software`, name: 'Kompilot', url: `${KOMPILOT_IDENTITY.domain}/`, applicationCategory: 'BusinessApplication', applicationSubCategory: 'Marketing local, communication B2B et gestion de visibilité', operatingSystem: 'Web', description: 'Kompilot est un cockpit marketing assisté par IA pour centraliser la création de contenus, les avis clients, les messages, les réseaux sociaux et le suivi de la visibilité sur Google, ChatGPT et Gemini.', publisher: { '@id': `${KOMPILOT_IDENTITY.domain}/#organization` }, inLanguage: 'fr-FR', featureList: [...PUBLIC_FEATURES, 'Gestion multi-établissements', 'Gestion multi-clients pour les agences'], offers,
  };
}

export function createBreadcrumbList(path: string, title: string) {
  const items: Array<{ '@type': 'ListItem'; position: number; name: string; item: string }> = [{ '@type': 'ListItem', position: 1, name: 'Kompilot', item: `${KOMPILOT_IDENTITY.domain}/` }];
  if (path !== '/') items.push({ '@type': 'ListItem', position: 2, name: title, item: `${KOMPILOT_IDENTITY.domain}${path}` });
  return { '@type': 'BreadcrumbList', itemListElement: items };
}

export function createKompilotGraph(path: string, title: string, includeFaq = false, description: string = KOMPILOT_IDENTITY.shortDefinition) {
  const graph: GraphNode[] = [createOrganization(), createWebSite(), createWebPage(path, title, description), createBreadcrumbList(path, title)];
  if (path === '/' || path === '/pricing') graph.push(createSoftwareApplication());
  if (includeFaq) graph.push({ '@type': 'FAQPage', '@id': `${KOMPILOT_IDENTITY.domain}/faq#faqpage`, url: `${KOMPILOT_IDENTITY.domain}/faq`, inLanguage: 'fr-FR', mainEntity: FAQ_ITEMS.map(faq => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })) });
  return { '@context': 'https://schema.org', '@graph': graph };
}

export function createFaqGraph(path: string, title: string, description: string, faqs: ReadonlyArray<{ question: string; answer: string }> = FAQ_ITEMS) {
  return { '@context': 'https://schema.org', '@graph': [createOrganization(), createWebSite(), createWebPage(path, title, description), createBreadcrumbList(path, title), { '@type': 'FAQPage', '@id': `${KOMPILOT_IDENTITY.domain}/faq#faqpage`, url: `${KOMPILOT_IDENTITY.domain}/faq`, inLanguage: 'fr-FR', mainEntity: faqs.map(faq => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })) }] };
}

export function createSectorGraph(path: string, title: string, sectorName: string, description: string) {
  return { '@context': 'https://schema.org', '@graph': [createOrganization(), createWebSite(), createWebPage(path, title, description), createBreadcrumbList(path, title), { '@type': 'Service', '@id': `${KOMPILOT_IDENTITY.domain}${path}#service`, name: `Marketing local pour ${sectorName}`, description, serviceType: 'Marketing local et gestion de présence en ligne', provider: { '@id': `${KOMPILOT_IDENTITY.domain}/#organization` }, areaServed: { '@type': 'Country', name: 'France' } }] };
}

export function createTestimonialsGraph(path: string, title: string, description: string, testimonials: ReadonlyArray<{ name: string; quote: string }>) {
  const graph = createKompilotGraph(path, title, false, description);
  graph['@graph'].push(...testimonials.map(testimonial => ({
    '@type': 'Review',
    itemReviewed: { '@id': `${KOMPILOT_IDENTITY.domain}/#software` },
    author: { '@type': 'Person', name: testimonial.name },
    reviewBody: testimonial.quote,
  })));
  return graph;
}
