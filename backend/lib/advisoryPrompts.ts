export const ADVISORY_PILLARS = ['social', 'seo', 'geo', 'sea', 'gea'] as const;

export const ADVISORY_SCHEMA = {
  type: 'object',
  properties: {
    overallScore: { type: 'number' },
    criticalCount: { type: 'number' },
    pillars: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', enum: [...ADVISORY_PILLARS] },
          label: { type: 'string' },
          score: { type: 'number' },
          status: { type: 'string', enum: ['critical', 'attention', 'opportunity', 'healthy'] },
          summary: { type: 'string' },
          signals: { type: 'array', items: { type: 'string' } },
          actions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' }, title: { type: 'string' }, detail: { type: 'string' },
                impact: { type: 'string', enum: ['high', 'medium', 'low'] },
                effort: { type: 'string', enum: ['low', 'medium', 'high'] },
              },
              required: ['id', 'title', 'detail', 'impact', 'effort'],
            },
          },
        },
        required: ['id', 'label', 'score', 'status', 'summary', 'signals', 'actions'],
      },
    },
  },
  required: ['overallScore', 'criticalCount', 'pillars'],
};

export function buildAdvisoryPrompt(context: Record<string, unknown>) {
  return `Tu es l'architecte conseil IA de Kompilot, une plateforme B2B de pilotage de présence et d'acquisition.

MISSION
Analyse le contexte réel de l'entreprise et produis un plan d'action priorisé sur cinq piliers : Social Media, SEO, GEO (visibilité dans les réponses IA), SEA et GEA (acquisition publicitaire assistée par IA).

RÈGLES MÉTIER
- Personnalise chaque conseil selon le secteur, la ville, la maturité, la taille, le NAF, la forme juridique et les données de registre disponibles.
- Ne présente le profil comme vérifié Pappers que si verificationSource vaut pappers. Si la source vaut luhn ou unknown, indique que la vérification registre reste à confirmer.
- Ne fabrique jamais de chiffre absent du contexte. Si une donnée manque, indique-le comme signal de mesure à mettre en place.
- Social Media : compare plateformes, formats, cadence, portée, engagement et propose des idées éditoriales et de modération.
- SEO : exploite visibilité organique, couverture service/ville, mots-clés, maillage interne et données locales.
- GEO : exploite trackers, mentions, citations et URL citées dans les moteurs IA ; recommande des preuves vérifiables.
- SEA : utilise uniquement les signaux disponibles de campagnes, CTR, CPA, ROAS, conversions et gaspillage budgétaire ; propose des arbitrages prudents.
- GEA : analyse rapports créatifs, tracking de conversions, variantes UGC et boucles d'acquisition IA.
- Retourne exactement les cinq piliers, avec 1 à 3 actions concrètes par pilier.
- Classe critical uniquement si un risque ou une perte mesurable est probable. Utilise attention pour un manque important, opportunity pour un levier, healthy si aucune action urgente n'est nécessaire.
- Les actions doivent être exécutables en moins de 30 jours, formulées avec un verbe d'action et un résultat attendu.
- Réponds uniquement avec un objet JSON conforme au schéma fourni. Français professionnel, phrases courtes.

CONTEXTE AGRÉGÉ
${JSON.stringify(context, null, 2)}`;
}
