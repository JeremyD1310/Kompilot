// ── AI strategy generation config ─────────────────────────────────────────────

export const STRATEGY_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    post_ideas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          hook: { type: 'string' },
          channel: { type: 'string' },
        },
        required: ['title', 'hook', 'channel'],
      },
    },
    hashtags: { type: 'array', items: { type: 'string' } },
    angles: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          description: { type: 'string' },
        },
        required: ['label', 'description'],
      },
    },
  },
  required: ['summary', 'post_ideas', 'hashtags', 'angles'],
} as const;

export function buildStrategyPrompt(transcribedText: string) {
  return `Tu es un stratège en content marketing pour les TPE/PME françaises.

Un entrepreneur vient de raconter son actualité de la semaine :
"${transcribedText}"

Génère une stratégie de contenu hebdomadaire complète basée sur ce témoignage :
1. Une synthèse percutante (2-3 phrases, ton dynamique)
2. Exactement 3 idées de posts exploitables (avec accroche prête à publier)
3. 6 hashtags tendance pertinents (secteur local + engagement)
4. 2 angles d'attaque différenciants pour se démarquer

Les idées de posts doivent être directement utilisables et variées en format (coulisses, conseil expert, storytelling).`;
}
