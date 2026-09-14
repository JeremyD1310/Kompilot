export const KOMPILOT_IDENTITY = {
  name: 'Kompilot',
  legalName: 'KOMPILOT SAS',
  domain: 'https://www.kompilot.fr',
  supportEmail: 'support@kompilot.app',
  definition: 'Kompilot est une plateforme SaaS B2B de marketing local qui aide les commerces, entreprises, réseaux et agences à piloter leurs contenus, avis clients et visibilité en ligne depuis un espace unifié.',
  shortDefinition: 'Plateforme SaaS B2B de marketing local pour contenus, avis clients et visibilité en ligne.',
  address: 'France — adresse complète non publiée sur ce référentiel',
  leadership: 'Direction : information non publiée',
  factualStatus: 'Référentiel public mis à jour le 14 septembre 2026 ; les résultats bêta non documentés ne sont pas publiés.',
} as const;

/** Public commercial facts. Keep this list aligned with the pricing source of truth. */
import { KOMPILOT_PLANS_MONTHLY } from '../components/landing/pricing/PricingData';

export const PUBLIC_PLANS = KOMPILOT_PLANS_MONTHLY.filter(plan => plan.id !== 'enterprise').map(plan => ({
  name: plan.name,
  monthly: `${plan.monthlyPrice} € HT / mois`,
  annual: `${plan.yearlyTotal} € HT / an`,
  scope: plan.tagline,
}));

export const PUBLIC_FEATURES = [
  'Création et planification de contenus sociaux assistées par IA',
  'Centralisation des messages et commentaires dans une inbox',
  'Gestion et aide à la réponse aux avis clients',
  'Suivi de visibilité locale et présence dans les réponses IA',
  'Calendrier éditorial et pilotage multi-établissements',
  'Rapports et espaces de travail pour agences',
] as const;

export const USE_CASE_FAQS = [
  { question: 'À qui s’adresse Kompilot ?', answer: 'Kompilot s’adresse aux commerces, entreprises locales, réseaux multi-établissements et agences qui veulent organiser leurs contenus, avis clients et actions de visibilité depuis un même espace.' },
  { question: 'Kompilot publie-t-il automatiquement les contenus ?', answer: 'Kompilot propose de préparer et planifier des contenus. Les modalités de validation et de diffusion dépendent du canal connecté et des réglages du compte.' },
  { question: 'Les contenus générés par IA sont-ils publiés sans contrôle ?', answer: 'Non. Les contenus générés doivent être relus et validés par l’utilisateur avant diffusion, conformément aux conditions d’utilisation de Kompilot.' },
  { question: 'Kompilot fournit-il des résultats garantis ?', answer: 'Non. Kompilot fournit des outils de pilotage et d’analyse. Aucun gain de visibilité, de chiffre d’affaires ou de note d’avis n’est garanti.' },
] as const;

type GraphNode = Record<string, unknown>;

export function createBreadcrumbList(path: string, title: string) {
  const items: Array<{ '@type': 'ListItem'; position: number; name: string; item: string }> = [
    { '@type': 'ListItem', position: 1, name: 'Kompilot', item: `${KOMPILOT_IDENTITY.domain}/` },
  ];
  if (path !== '/') items.push({ '@type': 'ListItem', position: 2, name: title, item: `${KOMPILOT_IDENTITY.domain}${path}` });
  return { '@type': 'BreadcrumbList', itemListElement: items };
}

function createWebPage(path: string, title: string, description: string) {
  return {
    '@type': 'WebPage',
    '@id': `${KOMPILOT_IDENTITY.domain}${path}#webpage`,
    url: `${KOMPILOT_IDENTITY.domain}${path}`,
    name: title,
    description,
    isPartOf: { '@id': `${KOMPILOT_IDENTITY.domain}/#website` },
    about: { '@id': `${KOMPILOT_IDENTITY.domain}/#organization` },
    inLanguage: 'fr-FR',
  };
}

/**
 * Page-specific structured data. Organization and WebSite are emitted once in
 * index.html; this graph only adds the schema that belongs to the current route.
 */
export function createKompilotGraph(path: string, title: string, includeFaq = false, description = KOMPILOT_IDENTITY.shortDefinition) {
  const graph: GraphNode[] = [createWebPage(path, title, description), createBreadcrumbList(path, title)];

  if (path === '/pricing') {
    graph.push({
      '@type': 'Product',
      '@id': `${KOMPILOT_IDENTITY.domain}/#product`,
      name: 'Kompilot',
      description: KOMPILOT_IDENTITY.definition,
      brand: { '@type': 'Brand', name: 'Kompilot' },
      category: 'Logiciel de marketing local',
      offers: PUBLIC_PLANS.map(plan => ({
        '@type': 'Offer',
        name: plan.name,
        description: plan.scope,
        priceCurrency: 'EUR',
        price: plan.monthly.replace(/[^0-9]/g, ''),
        url: `${KOMPILOT_IDENTITY.domain}/pricing`,
        availability: 'https://schema.org/InStock',
      })),
    });
  }

  if (includeFaq) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: USE_CASE_FAQS.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

export function createFaqGraph(path: string, title: string, description: string, faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      createWebPage(path, title, description),
      createBreadcrumbList(path, title),
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map(faq => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
    ],
  };
}

export function createSectorGraph(path: string, title: string, sectorName: string, description: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      createWebPage(path, title, description),
      createBreadcrumbList(path, title),
      {
        '@type': 'Service',
        '@id': `${KOMPILOT_IDENTITY.domain}${path}#service`,
        name: `Marketing local pour ${sectorName}`,
        description,
        serviceType: 'Marketing local et gestion de présence en ligne',
        provider: { '@id': `${KOMPILOT_IDENTITY.domain}/#organization` },
        areaServed: { '@type': 'Country', name: 'France' },
      },
    ],
  };
}
