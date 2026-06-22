/**
 * termGlossary — Glossaire des termes marketing/tech complexes.
 * Utilisé par TermTooltip et TermBadge pour afficher une explication Pro.
 */

export interface TermDefinition {
  term: string;
  fullName: string;
  definition: string;
  example?: string;
  relatedTerms?: string[];
  proTip?: string;
  category: 'seo' | 'ads' | 'analytics' | 'ai' | 'social' | 'local' | 'general';
}

export const TERM_GLOSSARY: Record<string, TermDefinition> = {
  // ── IA & Nouveaux moteurs ─────────────────────────────────────────────────
  AIO: {
    term: 'AIO',
    fullName: 'AI Optimization',
    definition:
      "L'AIO (AI Optimization) consiste à optimiser votre contenu pour qu'il soit cité par les moteurs de recherche conversationnels comme ChatGPT, Perplexity, Gemini ou Claude. Contrairement au SEO classique, l'AIO mise sur des réponses claires, des données structurées et une autorité sémantique forte.",
    example:
      "Ex : Un restaurant qui répond structurellement à « Meilleur burger Paris 8e » a plus de chances d'être cité par ChatGPT.",
    proTip:
      "Activez l'AIO Sync Kompilot pour injecter automatiquement vos mots-clés locaux dans les moteurs IA.",
    relatedTerms: ['SEO', 'GEA', 'GEO'],
    category: 'ai',
  },
  GEA: {
    term: 'GEA',
    fullName: 'Generative Engine Advertising',
    definition:
      "Le GEA (Generative Engine Advertising) est la publicité au sein des réponses générées par l'IA. Votre contenu est mis en avant dans les résultats de ChatGPT, Gemini ou Perplexity grâce à un boost payant — l'équivalent de Google Ads, mais pour les IA génératives.",
    example:
      "Ex : Investir 100 € de GEA peut générer ~3 500 impressions dans les réponses IA locales.",
    proTip:
      "Combinez SEO classique + AIO Sync + GEA pour une présence omnicanale maximale.",
    relatedTerms: ['AIO', 'SEA', 'GEO'],
    category: 'ai',
  },

  // ── SEO & Visibilité locale ───────────────────────────────────────────────
  SEO: {
    term: 'SEO',
    fullName: 'Search Engine Optimization',
    definition:
      "Le SEO (Search Engine Optimization) désigne l'ensemble des techniques visant à améliorer le positionnement d'un site web dans les résultats naturels (organiques) des moteurs de recherche comme Google. Il comprend l'optimisation technique, le contenu et les liens entrants.",
    example:
      "Ex : Publier régulièrement sur Google Business Profile améliore votre SEO local.",
    proTip:
      "Le SEO local passe d'abord par une fiche Google Business complète et des avis récents.",
    relatedTerms: ['GEO', 'AIO', 'SMO'],
    category: 'seo',
  },
  GEO: {
    term: 'GEO',
    fullName: 'Geo-référencement / SEO Local',
    definition:
      "Le GEO (ou géo-référencement) correspond à l'optimisation de votre visibilité dans les recherches locales : résultats « near me », carte Google Maps, Pack Local. Il repose sur la cohérence de vos données NAP (Nom, Adresse, Téléphone) sur toutes les plateformes.",
    example:
      "Ex : Un salon de coiffure avec un score GEO de 85/100 apparaît dans le Pack Local Google pour « coiffeur Paris 15 ».",
    proTip:
      "Synchronisez vos citations sur 50+ annuaires locaux via Kompilot pour maximiser votre score GEO.",
    relatedTerms: ['SEO', 'GEA', 'AIO'],
    category: 'local',
  },

  // ── Publicité payante ─────────────────────────────────────────────────────
  SEA: {
    term: 'SEA',
    fullName: 'Search Engine Advertising',
    definition:
      "Le SEA (Search Engine Advertising) désigne les liens sponsorisés dans les moteurs de recherche, principalement Google Ads. Vous payez à chaque clic (CPC) pour apparaître en tête des résultats sur des mots-clés ciblés.",
    example:
      "Ex : Une campagne SEA sur « plombier urgence Paris » peut générer 50 appels/mois pour 200 € de budget.",
    proTip:
      "Associez SEA + ROAS Detector pour optimiser votre retour sur investissement publicitaire.",
    relatedTerms: ['ROAS', 'CPC', 'CPM', 'CTR'],
    category: 'ads',
  },
  ROAS: {
    term: 'ROAS',
    fullName: 'Return On Ad Spend',
    definition:
      "Le ROAS (Return On Ad Spend) mesure le chiffre d'affaires généré pour chaque euro investi en publicité. Formule : CA généré ÷ Dépense publicitaire. Un ROAS de 4 signifie que vous générez 4 € pour chaque 1 € dépensé.",
    example:
      "Ex : Si vous dépensez 500 € en Meta Ads et générez 2 000 € de CA, votre ROAS est de 4×.",
    proTip:
      "Un ROAS inférieur à 2× indique que votre campagne coûte trop cher par rapport aux résultats.",
    relatedTerms: ['ROI', 'CPC', 'CPM', 'SEA'],
    category: 'ads',
  },
  CPC: {
    term: 'CPC',
    fullName: 'Coût Par Clic',
    definition:
      "Le CPC (Coût Par Clic) est le montant payé à chaque fois qu'un internaute clique sur votre annonce publicitaire. C'est le modèle de tarification principal de Google Ads et Meta Ads.",
    example:
      "Ex : Un CPC de 0,80 € pour « restaurant pizza Lyon » est considéré comme raisonnable.",
    proTip:
      "Optimisez vos landing pages pour convertir les clics en clients — un CPC faible ne suffit pas sans bonne conversion.",
    relatedTerms: ['CPM', 'CTR', 'ROAS', 'SEA'],
    category: 'ads',
  },
  CPM: {
    term: 'CPM',
    fullName: 'Coût Pour Mille impressions',
    definition:
      "Le CPM (Coût Pour Mille impressions) est le prix payé pour 1 000 affichages de votre publicité, indépendamment du nombre de clics. Utilisé principalement pour les campagnes de notoriété sur Meta, YouTube ou display.",
    example:
      "Ex : Un CPM de 5 € signifie que 10 000 personnes voient votre pub pour 50 €.",
    proTip:
      "Le CPM est idéal pour le branding ; préférez le CPC pour générer du trafic ciblé.",
    relatedTerms: ['CPC', 'CTR', 'ROAS'],
    category: 'ads',
  },
  CTR: {
    term: 'CTR',
    fullName: 'Taux de Clic (Click-Through Rate)',
    definition:
      "Le CTR (Click-Through Rate) mesure le pourcentage de personnes qui cliquent sur votre annonce ou publication par rapport au nombre total de personnes qui l'ont vue. Formule : Clics ÷ Impressions × 100.",
    example:
      "Ex : 50 clics pour 1 000 impressions = CTR de 5%. Un bon CTR Meta est généralement entre 1% et 3%.",
    proTip:
      "Améliorez votre CTR avec des visuels accrocheurs et des CTA clairs (« Réserver maintenant »).",
    relatedTerms: ['CPC', 'CPM', 'ROAS'],
    category: 'analytics',
  },
  ROI: {
    term: 'ROI',
    fullName: 'Retour sur Investissement',
    definition:
      "Le ROI (Return on Investment) mesure la rentabilité globale d'un investissement. Formule : (Gain – Coût) ÷ Coût × 100. Contrairement au ROAS qui se concentre sur la pub, le ROI prend en compte tous les coûts (production, outil, temps, etc.).",
    example:
      "Ex : Investir 200 € dans un outil marketing et générer 1 200 € de CA supplémentaire = ROI de 500%.",
    proTip:
      "Mesurez le ROI de Kompilot en comparant votre CA avant/après 3 mois d'utilisation.",
    relatedTerms: ['ROAS', 'KPI'],
    category: 'analytics',
  },

  // ── Métriques & Analyse ───────────────────────────────────────────────────
  KPI: {
    term: 'KPI',
    fullName: 'Indicateur Clé de Performance',
    definition:
      "Un KPI (Key Performance Indicator) est une métrique quantifiable utilisée pour évaluer la performance d'une action ou d'une stratégie par rapport à des objectifs définis. Il peut mesurer la croissance, l'engagement, les ventes ou la visibilité.",
    example:
      "Ex : Vos KPIs de présence : score GEO, nombre d'avis Google, publications mensuelles, taux d'engagement.",
    proTip:
      "Définissez 3 à 5 KPIs prioritaires et revoyez-les chaque semaine pour rester focus.",
    relatedTerms: ['ROI', 'ROAS', 'CTR'],
    category: 'analytics',
  },

  // ── Social Media ──────────────────────────────────────────────────────────
  SMO: {
    term: 'SMO',
    fullName: 'Social Media Optimization',
    definition:
      "Le SMO (Social Media Optimization) regroupe les pratiques visant à maximiser votre visibilité et engagement sur les réseaux sociaux (Instagram, Facebook, TikTok, LinkedIn). Il inclut la fréquence de publication, l'utilisation des hashtags, les formats (Reels, Stories) et les interactions.",
    example:
      "Ex : Publier 4× par semaine avec des Reels fait partie d'une stratégie SMO efficace.",
    proTip:
      "Synchronisez votre calendrier SMO avec les événements locaux pour maximiser l'engagement.",
    relatedTerms: ['SEO', 'UGC'],
    category: 'social',
  },
  UGC: {
    term: 'UGC',
    fullName: 'User-Generated Content',
    definition:
      "L'UGC (User-Generated Content) désigne tout contenu créé spontanément par vos clients : photos, avis, vidéos, témoignages. C'est l'une des formes les plus puissantes de preuve sociale et de marketing authentique.",
    example:
      "Ex : Un client qui poste une photo de votre plat en vous taguant génère de l'UGC précieux.",
    proTip:
      "Encouragez l'UGC avec des incentives (concours, mention sur votre page) pour multiplier votre reach organique.",
    relatedTerms: ['SMO', 'CTR'],
    category: 'social',
  },

  // ── Termes généraux ───────────────────────────────────────────────────────
  NAP: {
    term: 'NAP',
    fullName: 'Name, Address, Phone',
    definition:
      "NAP signifie Nom, Adresse, Téléphone. La cohérence de ces 3 informations sur toutes vos plateformes en ligne (Google, Facebook, annuaires) est un facteur crucial pour le référencement local. Toute incohérence pénalise votre score GEO.",
    example:
      "Ex : Si votre adresse est « 12 rue de la Paix » sur Google mais « 12 rue Paix » sur Yelp, votre score GEO baisse.",
    proTip:
      "Utilisez l'outil de synchronisation NAP Kompilot pour corriger vos données sur 50+ annuaires en 1 clic.",
    relatedTerms: ['GEO', 'SEO'],
    category: 'local',
  },
  SEM: {
    term: 'SEM',
    fullName: 'Search Engine Marketing',
    definition:
      "Le SEM (Search Engine Marketing) est le terme global qui englobe à la fois le SEO (référencement naturel) et le SEA (publicité payante sur les moteurs de recherche). Il désigne toutes les actions marketing sur les moteurs de recherche.",
    example:
      "Ex : Une stratégie SEM complète combine un blog optimisé SEO + des campagnes Google Ads SEA.",
    proTip:
      "Pour les petites entreprises, commencez par le SEO local avant d'investir dans le SEA.",
    relatedTerms: ['SEO', 'SEA', 'GEO'],
    category: 'seo',
  },
};

// Lookup by uppercase term key
export function getTerm(key: string): TermDefinition | undefined {
  return TERM_GLOSSARY[key.toUpperCase()];
}

// Category labels
export const CATEGORY_LABELS: Record<TermDefinition['category'], string> = {
  seo: 'SEO & Visibilité',
  ads: 'Publicité',
  analytics: 'Analytics',
  ai: 'IA & Nouveaux Moteurs',
  social: 'Réseaux Sociaux',
  local: 'Local & Géo',
  general: 'Général',
};

export const CATEGORY_COLORS: Record<TermDefinition['category'], string> = {
  seo: 'bg-blue-500/15 text-blue-600 border-blue-500/20',
  ads: 'bg-orange-500/15 text-orange-600 border-orange-500/20',
  analytics: 'bg-purple-500/15 text-purple-600 border-purple-500/20',
  ai: 'bg-teal-500/15 text-teal-600 border-teal-500/20',
  social: 'bg-pink-500/15 text-pink-600 border-pink-500/20',
  local: 'bg-green-500/15 text-green-600 border-green-500/20',
  general: 'bg-gray-500/15 text-gray-600 border-gray-500/20',
};
