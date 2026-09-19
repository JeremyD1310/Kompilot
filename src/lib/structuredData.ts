import { PUBLIC_ENTITY, type PublicPlan } from '../config/publicEntity';

export type FaqEntry = { question: string; answer: string };
export type BreadcrumbEntry = { name: string; path: string };

const origin = PUBLIC_ENTITY.url;
const organizationId = `${origin}/#organization`;

export function organizationSchema() {
  return { '@type': 'Organization', '@id': organizationId, name: PUBLIC_ENTITY.name, url: `${origin}/`, logo: PUBLIC_ENTITY.logo, description: PUBLIC_ENTITY.description, email: PUBLIC_ENTITY.email, areaServed: PUBLIC_ENTITY.serviceArea, contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', email: PUBLIC_ENTITY.email, availableLanguage: ['fr-FR'] } };
}

export function websiteSchema() {
  return { '@type': 'WebSite', '@id': `${origin}/#website`, name: PUBLIC_ENTITY.name, url: `${origin}/`, inLanguage: PUBLIC_ENTITY.language, publisher: { '@id': organizationId } };
}

export function personSchema() {
  return { '@type': 'Person', '@id': `${origin}/a-propos#founder`, name: PUBLIC_ENTITY.founder.name, jobTitle: PUBLIC_ENTITY.founder.role, worksFor: { '@id': organizationId }, email: PUBLIC_ENTITY.email, url: `${origin}/a-propos` };
}

export function softwareSchema(offers = PUBLIC_ENTITY.plans.filter((plan): plan is Exclude<PublicPlan, { monthly: null }> => plan.monthly !== null)) {
  return { '@type': 'SoftwareApplication', '@id': `${origin}/#software`, name: PUBLIC_ENTITY.name, applicationCategory: 'BusinessApplication', operatingSystem: 'Web', description: PUBLIC_ENTITY.description, inLanguage: PUBLIC_ENTITY.language, featureList: ['Visibilité locale', 'Contenus assistés par IA', 'Avis et messages', 'SEO local et GEO', 'Calendrier éditorial', 'Gestion multi-établissements', 'Gestion multi-clients', 'Validation humaine'], offers: offers.map(plan => ({ '@type': 'Offer', name: `Kompilot ${plan.name}`, url: `${origin}/pricing`, price: String(plan.monthly), priceCurrency: 'EUR', priceSpecification: { '@type': 'UnitPriceSpecification', price: String(plan.monthly), priceCurrency: 'EUR', billingDuration: 'P1M', valueAddedTaxIncluded: false } })) };
}

export function breadcrumbs(entries: BreadcrumbEntry[]) {
  return { '@type': 'BreadcrumbList', itemListElement: entries.map((entry, index) => ({ '@type': 'ListItem', position: index + 1, name: entry.name, item: `${origin}${entry.path}` })) };
}

export function faqSchema(faqs: FaqEntry[]) {
  return { '@type': 'FAQPage', mainEntity: faqs.map(faq => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })) };
}

export function articleSchema(path: string, title: string, description: string, datePublished: string, dateModified: string) {
  return { '@type': 'Article', '@id': `${origin}${path}#article`, headline: title, description, url: `${origin}${path}`, mainEntityOfPage: `${origin}${path}`, inLanguage: PUBLIC_ENTITY.language, datePublished, dateModified, author: { '@type': 'Person', name: PUBLIC_ENTITY.founder.name, url: `${origin}/a-propos` }, publisher: { '@id': organizationId } };
}

export function publicGraph(nodes: Record<string, unknown>[]) {
  return { '@context': 'https://schema.org', '@graph': [organizationSchema(), websiteSchema(), ...nodes] };
}

export function pageSchema(path: string, title: string, description: string, extra: Record<string, unknown>[] = []) {
  return publicGraph([{ '@type': 'WebPage', '@id': `${origin}${path}#webpage`, url: `${origin}${path}`, name: title, description, inLanguage: PUBLIC_ENTITY.language, dateModified: PUBLIC_ENTITY.lastModified, isPartOf: { '@id': `${origin}/#website` }, about: { '@id': `${origin}/#software` } }, breadcrumbs([{ name: 'Kompilot', path: '/' }, { name: title, path }]), ...extra]);
}
