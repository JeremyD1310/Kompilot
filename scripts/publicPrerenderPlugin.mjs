import fs from 'node:fs/promises'
import path from 'node:path'

const origin = 'https://www.kompilot.fr'
const lastModified = '2026-09-16'
const sectors = [
  ['restaurants', 'Restaurants'], ['boutiques', 'Boutiques et commerces'], ['beaute', 'Beauté et bien-être'], ['sport', 'Sport'],
  ['artisans', 'Artisans'], ['sante', 'Santé'], ['immobilier', 'Immobilier'], ['agences', 'Agences'],
]
const guides = [
  ['guide-visibilite-locale-pme', 'Visibilité locale pour PME : guide pratique | Kompilot', 'Comment améliorer la visibilité locale d’une PME ?', 'Une méthode pour fiabiliser les informations locales, publier utilement et mesurer sa présence.'],
  ['repondre-avis-google-ia', 'Répondre aux avis Google avec l’IA | Guide Kompilot', 'Comment répondre aux avis Google avec l’aide de l’IA ?', 'Personnaliser, relire et escalader les réponses aux avis avec une assistance IA encadrée.'],
  ['geo-visibilite-chatgpt-gemini', 'GEO : améliorer sa visibilité dans ChatGPT et Gemini', 'Comment améliorer la compréhension de son entreprise par les moteurs IA ?', 'Comprendre le GEO, la citabilité et les limites de toute visibilité dans les moteurs de réponse.'],
  ['communication-multi-etablissements', 'Communication multi-établissements : méthode et outils', 'Comment piloter la communication de plusieurs établissements ?', 'Une méthode de gouvernance pour séparer informations communes, données locales et validations.'],
  ['communication-agence-multi-clients', 'Communication multi-clients pour agences | Guide Kompilot', 'Comment une agence peut-elle centraliser sa communication multi-clients ?', 'Les principes d’espaces séparés, de rôles, de validation et de reporting pour une agence.'],
  ['calendrier-marketing-local', 'Calendrier marketing local : méthode et modèle', 'Comment construire un calendrier marketing local efficace ?', 'Une méthode réaliste pour articuler saisonnalité, actualités, recyclage et validation.'],
]
const comparisons = [
  ['kompilot-vs-chatgpt', 'Kompilot ou ChatGPT : quelles différences ?', 'Comparer un assistant généraliste et un logiciel métier sans opposer leurs usages complémentaires.'],
  ['plateforme-centralisee-vs-plusieurs-outils', 'Plateforme marketing centralisée ou plusieurs outils ?', 'Comparer coût total, temps, gouvernance, intégrations et spécialisation selon vos besoins.'],
  ['logiciel-marketing-local-pme', 'Comment choisir un logiciel de marketing local pour PME ?', 'Une grille neutre pour comparer contenus, avis, réseaux sociaux, validation et reporting.'],
]
const faq = [
  ['Qu’est-ce qu’un logiciel de visibilité locale ?', 'Il centralise les informations, contenus, avis et signaux de présence utiles à une entreprise locale.'],
  ['Kompilot garantit-il une apparition dans ChatGPT ou Gemini ?', 'Non. Kompilot améliore la clarté et l’organisation des informations, sans garantir une citation.'],
  ['Combien de temps dure l’essai gratuit ?', 'L’essai dure 14 jours, sans carte bancaire, avec 1 utilisateur, 1 établissement, 150 crédits IA et 10 SMS.'],
  ['Les publications sont-elles automatiques ?', 'Les actions sensibles restent soumises à une validation humaine avant diffusion.'],
]
const pages = [
  ['/', 'Logiciel de visibilité locale et communication B2B | Kompilot', 'Centralisez contenus, avis Google, réseaux sociaux et visibilité dans ChatGPT et Gemini avec Kompilot, le cockpit marketing des PME, commerces et agences. Essai gratuit 14 jours.', 'Pilotez votre visibilité locale depuis un seul cockpit IA', 'Kompilot est un logiciel SaaS B2B de visibilité locale et de communication multicanale. Les actions sensibles restent soumises à validation humaine.'],
  ['/a-propos', 'À propos de Kompilot | Notre mission et notre méthode', 'Découvrez la mission de Kompilot, son approche de la visibilité locale, le rôle de l’IA et l’importance de la validation humaine.', 'Kompilot, le cockpit de visibilité conçu pour les entreprises B2B', 'Kompilot centralise la communication pour réduire la dispersion des outils, clarifier les workflows et garder une validation humaine.'],
  ['/politique-editoriale', 'Politique éditoriale | Kompilot', 'Comment Kompilot produit, vérifie et met à jour ses contenus publics, avec une assistance IA encadrée.', 'Une politique éditoriale orientée vers la clarté', 'Les contenus publics de Kompilot sont relus, sourcés et corrigés lorsqu’une information vérifiable le nécessite.'],
  ['/features', 'Fonctionnalités Kompilot | Visibilité locale et communication B2B', 'Découvrez les fonctionnalités de Kompilot pour les contenus, avis, messages et pilotage multi-établissements.', 'Tout votre marketing opérationnel, réuni', 'Kompilot aide à préparer des contenus, organiser les avis et messages, suivre la visibilité locale et valider les actions.'],
  ['/local', 'Marketing local et GEO | Kompilot', 'Centralisez votre visibilité locale, vos avis Google et vos contenus avec Kompilot.', 'Pilotez votre marketing local depuis un seul cockpit', 'Kompilot organise les informations locales, les avis, les contenus et les signaux GEO sans promettre de résultat garanti.'],
  ['/pricing', 'Tarifs Kompilot — Pro, Multi et Agency', 'Comparez les offres Pro, Multi et Agency de Kompilot : périmètre, crédits IA, SMS et établissements.', 'Des offres claires pour piloter votre visibilité', 'Pro, Multi et Agency répondent à des périmètres différents. Le choix dépend du nombre d’établissements, d’utilisateurs et de canaux.'],
  ['/faq', 'FAQ Kompilot — Visibilité locale, GEO et validation humaine', 'Réponses aux questions sur la visibilité locale, le GEO, les avis, les offres et la validation humaine.', 'Questions fréquentes sur Kompilot', 'Retrouvez les réponses sur le GEO, les avis Google, les données, les multi-établissements, l’essai de 14 jours et la résiliation.'],
  ['/temoignages', 'Retours de bêta-testeurs Kompilot', 'Découvrez les retours publiés de bêta-testeurs utilisant Kompilot pour leurs contenus et leur visibilité.', 'Ils testent déjà Kompilot au quotidien', 'Les retours publiés sont identifiés comme des témoignages de bêta-testeurs et ne constituent pas une garantie de performance.'],
  ['/ressources', 'Ressources sur la visibilité locale, le SEO et le GEO | Kompilot', 'Guides pratiques de Kompilot sur la visibilité locale, les avis, le SEO local, le GEO et la communication multi-établissements.', 'Ressources pour piloter sa visibilité locale', 'Les guides Kompilot répondent aux questions des PME, commerces, réseaux et agences avec une méthode documentée.'],
  ['/cas-clients', 'Retours d’expérience et cas d’usage Kompilot', 'Modèles de cas d’usage issus de bêta-tests, publiés uniquement après validation des informations détaillées.', 'Retours d’expérience et cas d’usage Kompilot', 'Les premiers contenus de cas clients restent des modèles de brouillons jusqu’à validation documentaire.'],
]
for (const [slug, label] of sectors) pages.push([`/secteurs/${slug}`, `Kompilot pour ${label} | Visibilité locale`, `Une méthode Kompilot pour organiser contenus, avis et présence locale des ${label.toLowerCase()}.`, `Visibilité locale pour ${label}`, `Kompilot aide les ${label.toLowerCase()} à préparer leurs contenus, centraliser leurs avis et garder la validation humaine.`])
for (const [slug, title, heading, description] of guides) pages.push([`/ressources/${slug}`, title, description, heading, description])
for (const [slug, title, description] of comparisons) pages.push([`/comparatifs/${slug}`, title, description, title, description])

const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
const canonical = route => `${origin}${route === '/' ? '/' : route}`
const faqFor = route => route === '/' || route === '/faq' ? faq : []
function graph(route, title, description) {
  const nodes = [
    { '@type': 'Organization', '@id': `${origin}/#organization`, name: 'Kompilot', url: `${origin}/`, email: 'jeremy@kompilot.fr', description: 'Logiciel SaaS B2B de visibilité locale et de communication multicanale.', areaServed: 'France' },
    { '@type': 'WebSite', '@id': `${origin}/#website`, name: 'Kompilot', url: `${origin}/`, inLanguage: 'fr-FR', publisher: { '@id': `${origin}/#organization` } },
    { '@type': 'WebPage', '@id': `${canonical(route)}#webpage`, url: canonical(route), name: title, description, inLanguage: 'fr-FR', dateModified: lastModified },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kompilot', item: `${origin}/` }, ...(route === '/' ? [] : [{ '@type': 'ListItem', position: 2, name: title, item: canonical(route) }])] },
  ]
  if (route === '/' || route === '/pricing') nodes.push({ '@type': 'SoftwareApplication', '@id': `${origin}/#software`, name: 'Kompilot', applicationCategory: 'BusinessApplication', operatingSystem: 'Web', description: 'SaaS B2B de communication multicanale et visibilité locale.', offers: [['Pro', 69], ['Multi', 129], ['Agency', 229]].map(([name, price]) => ({ '@type': 'Offer', name: `Kompilot ${name}`, price: String(price), priceCurrency: 'EUR', url: `${origin}/pricing` })) })
  if (faqFor(route).length) nodes.push({ '@type': 'FAQPage', '@id': `${canonical(route)}#faq`, mainEntity: faqFor(route).map(([name, text]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text } })) })
  if (route.startsWith('/ressources/')) nodes.push({ '@type': 'Article', '@id': `${canonical(route)}#article`, headline: title, description, author: { '@type': 'Person', name: 'Jérémy Chevrier' }, publisher: { '@id': `${origin}/#organization` }, datePublished: lastModified, dateModified: lastModified, inLanguage: 'fr-FR' })
  if (route.startsWith('/secteurs/')) nodes.push({ '@type': 'Service', '@id': `${canonical(route)}#service`, name: title, description, provider: { '@id': `${origin}/#organization` }, areaServed: 'France' })
  return { '@context': 'https://schema.org', '@graph': nodes }
}

function publicPrerenderPlugin() {
  return {
    name: 'kompilot-public-prerender',
    apply: 'build',
    async closeBundle() {
      const dist = path.resolve(process.cwd(), 'dist')
      const template = await fs.readFile(path.join(dist, 'index.html'), 'utf8')
      for (const [route, title, description, heading, intro] of pages) {
        const routeCanonical = canonical(route)
        const questions = faqFor(route)
        const links = '<nav aria-label="Liens utiles"><a href="/features">Fonctionnalités</a> · <a href="/local">Visibilité locale</a> · <a href="/ressources">Ressources</a> · <a href="/pricing">Tarifs</a> · <a href="/faq">FAQ</a> · <a href="/signup">Essai 14 jours</a></nav>'
        const faqHtml = questions.length ? `<section aria-labelledby="faq-title"><h2 id="faq-title">Questions fréquentes</h2>${questions.map(([question, answer]) => `<article><h3>${esc(question)}</h3><p>${esc(answer)}</p></article>`).join('')}</section>` : ''
        const root = `<main lang="fr-FR"><article><p>Mis à jour le ${lastModified}</p><h1>${esc(heading)}</h1><p>${esc(intro)}</p>${links}${faqHtml}</article></main>`
        const meta = `<title>${esc(title)}</title><meta name="description" content="${esc(description)}"/><meta name="robots" content="${route.startsWith('/cas-clients/') ? 'noindex, nofollow' : 'index, follow'}"/><link rel="canonical" href="${routeCanonical}"/><meta property="og:title" content="${esc(title)}"/><meta property="og:description" content="${esc(description)}"/><meta property="og:url" content="${routeCanonical}"/>`
        const schema = `<script type="application/ld+json">${JSON.stringify(graph(route, title, description))}</script>`
        const html = template.replace(/<title>[\s\S]*?<\/title>/, meta).replace(/<meta name="description"[\s\S]*?(?=<\/head>)/, '').replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, schema).replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">${root}</div>`)
        const target = path.join(dist, route === '/' ? '' : route.replace(/^\//, ''), 'index.html')
        await fs.mkdir(path.dirname(target), { recursive: true })
        await fs.writeFile(target, html)
      }
    },
  }
}

export { publicPrerenderPlugin }
