import type { AdvisoryReport } from '../lib/advisoryTypes';

export const ADVISORY_DEMO_REPORT: AdvisoryReport = {
  generatedAt: '2026-08-01T09:30:00.000Z',
  overallScore: 68,
  criticalCount: 1,
  business: {
    name: 'Maison Éclat',
    sector: 'Beauté / Coiffure',
    city: 'Lyon',
    siret: '552 100 458 00024',
    maturity: 'developing',
    profileVerified: true,
  },
  sources: ['Profil entreprise vérifié', 'Google Analytics 4', 'Meta', 'TikTok', 'Suivi GEO Kompilot'],
  pillars: [
    {
      id: 'social', label: 'Social Media', score: 74, status: 'opportunity',
      summary: 'Les Reels génèrent 2,4× plus d’engagement que les posts statiques, mais la cadence est irrégulière.',
      signals: ['Engagement moyen : 6,8%', 'Meilleur format : vidéo courte', 'Dernière publication : il y a 5 jours'],
      actions: [
        { id: 'social-1', title: 'Planifier 3 Reels locaux cette semaine', detail: 'Décliner vos avis clients en vidéos de 15 secondes avec un appel à la réservation.', impact: 'high', effort: 'low', href: '/calendrier' },
        { id: 'social-2', title: 'Répondre aux commentaires sous 2 heures', detail: 'Votre taux de réponse est inférieur à celui des acteurs les mieux classés dans votre ville.', impact: 'medium', effort: 'low', href: '/inbox' },
      ],
    },
    {
      id: 'seo', label: 'SEO', score: 61, status: 'attention',
      summary: 'Votre fiche locale est visible, mais trois pages stratégiques ne ciblent pas encore vos services prioritaires.',
      signals: ['62% des mots-clés suivis en page 1', '3 pages sans lien interne entrant', 'Trafic organique : +8% sur 30 jours'],
      actions: [
        { id: 'seo-1', title: 'Créer une page “coloration Lyon”', detail: 'Construire une page service dédiée avec preuve sociale, tarifs et données locales.', impact: 'high', effort: 'medium', href: '/seo-local' },
        { id: 'seo-2', title: 'Renforcer le maillage interne', detail: 'Ajouter des liens depuis vos pages les plus visitées vers les services à marge élevée.', impact: 'medium', effort: 'low', href: '/geo-authority' },
      ],
    },
    {
      id: 'geo', label: 'GEO', score: 58, status: 'critical',
      summary: 'Maison Éclat est citée par ChatGPT, mais absente des réponses Gemini sur les requêtes locales prioritaires.',
      signals: ['Visibilité IA : 58/100', '4 citations détectées sur 10 requêtes', 'Manque de preuves structurées sur le site'],
      actions: [
        { id: 'geo-1', title: 'Publier une FAQ locale structurée', detail: 'Répondre aux questions “meilleur salon” et “prix coloration” avec des données vérifiables.', impact: 'high', effort: 'low', href: '/aio' },
        { id: 'geo-2', title: 'Obtenir 3 mentions locales fiables', detail: 'Cibler des annuaires et médias lyonnais pertinents plutôt que des liens génériques.', impact: 'high', effort: 'medium', href: '/geo-command-center' },
      ],
    },
    {
      id: 'sea', label: 'SEA', score: 79, status: 'healthy',
      summary: 'Le ROAS est solide. Le principal levier est de réallouer une partie du budget des campagnes génériques.',
      signals: ['ROAS moyen : 4,2×', 'CPA : 18,40€', 'Campagne marque : 6,1× ROAS'],
      actions: [
        { id: 'sea-1', title: 'Réallouer 15% vers les requêtes à forte intention', detail: 'Déplacer le budget depuis les audiences larges vers les mots-clés “réserver” et “près de moi”.', impact: 'medium', effort: 'low', href: '/roas' },
      ],
    },
    {
      id: 'gea', label: 'GEA', score: 46, status: 'attention',
      summary: 'Vos campagnes IA sont prometteuses, mais le tracking des conversions n’est pas encore complet.',
      signals: ['Tracking conversion : partiel', '1 boucle d’acquisition automatisée active', 'Créatifs UGC non testés'],
      actions: [
        { id: 'gea-1', title: 'Finaliser le suivi des conversions', detail: 'Relier les formulaires et appels aux campagnes pour piloter le coût par rendez-vous.', impact: 'high', effort: 'medium', href: '/meta-capi' },
        { id: 'gea-2', title: 'Tester 3 variantes UGC', detail: 'Comparer preuve sociale, avant/après et bénéfice concret sur une même audience.', impact: 'medium', effort: 'medium', href: '/creative-factory' },
      ],
    },
  ],
};
