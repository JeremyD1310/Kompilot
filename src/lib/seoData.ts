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
export const PUBLIC_PLANS = [
  { name: 'Starter', monthly: '69 € HT / mois', annual: '759 € HT / an', scope: 'Fonctionnalités de pilotage pour une activité locale, avec périmètre détaillé dans l’espace client et les conditions contractuelles.' },
  { name: 'Agency', monthly: '149 € HT / mois', annual: '1 639 € HT / an', scope: 'Fonctionnalités pour équipes et agences, avec options de marque blanche et de reporting selon le périmètre souscrit.' },
  { name: 'Enterprise', monthly: 'Sur devis', annual: 'Sur devis', scope: 'Périmètre, volumes, support et conditions définis au cas par cas ; aucune promesse de résultat n’est publiée ici.' },
] as const;

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

export function createBreadcrumbList(path: string, title: string) {
  const items: Array<{ '@type': 'ListItem'; position: number; name: string; item: string }> = [
    { '@type': 'ListItem', position: 1, name: 'Kompilot', item: `${KOMPILOT_IDENTITY.domain}/` },
  ];
  if (path !== '/') items.push({ '@type': 'ListItem', position: 2, name: title, item: `${KOMPILOT_IDENTITY.domain}${path}` });
  return { '@type': 'BreadcrumbList', itemListElement: items };
}

export function createKompilotGraph(path: string, title: string, includeFaq = false) {
  const organization = {
    '@type': 'Organization',
    '@id': `${KOMPILOT_IDENTITY.domain}/#organization`,
    name: KOMPILOT_IDENTITY.legalName,
    legalName: KOMPILOT_IDENTITY.legalName,
    url: KOMPILOT_IDENTITY.domain,
    description: KOMPILOT_IDENTITY.shortDefinition,
    logo: `${KOMPILOT_IDENTITY.domain}/og-image.png`,
    email: KOMPILOT_IDENTITY.supportEmail,
    address: { '@type': 'PostalAddress', addressCountry: 'FR' },
  };
  const website = {
    '@type': 'WebSite',
    '@id': `${KOMPILOT_IDENTITY.domain}/#website`,
    name: KOMPILOT_IDENTITY.name,
    url: KOMPILOT_IDENTITY.domain,
    publisher: { '@id': `${KOMPILOT_IDENTITY.domain}/#organization` },
    inLanguage: 'fr-FR',
  };
  const software = {
    '@type': 'SoftwareApplication',
    '@id': `${KOMPILOT_IDENTITY.domain}/#software`,
    name: KOMPILOT_IDENTITY.name,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: KOMPILOT_IDENTITY.definition,
    url: KOMPILOT_IDENTITY.domain,
    publisher: { '@id': `${KOMPILOT_IDENTITY.domain}/#organization` },
  };
  const product = {
    '@type': 'Product',
    '@id': `${KOMPILOT_IDENTITY.domain}/#product`,
    name: 'Kompilot',
    description: KOMPILOT_IDENTITY.definition,
    brand: { '@type': 'Brand', name: 'Kompilot' },
    category: 'Logiciel de marketing local',
    offers: PUBLIC_PLANS.filter(plan => plan.name !== 'Enterprise').map(plan => ({
      '@type': 'Offer',
      name: plan.name,
      description: plan.scope,
      priceCurrency: 'EUR',
      price: plan.name === 'Starter' ? '69' : '149',
      url: `${KOMPILOT_IDENTITY.domain}/pricing`,
      availability: 'https://schema.org/InStock',
    })),
  };
  const graph: Record<string, unknown>[] = [organization, website, software, product, createBreadcrumbList(path, title)];
  if (includeFaq) graph.push({ '@type': 'FAQPage', mainEntity: USE_CASE_FAQS.map(faq => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })) });
  return { '@context': 'https://schema.org', '@graph': graph };
}
