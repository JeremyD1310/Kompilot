/**
 * Smart Post Studio — shared utilities, types, and constants
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PerformanceContext {
  topPlatform: string;
  bestPostTitle: string;
  engagementRate: number;
  reach: number;
  posts: number;
  topEngagementDay?: string;
  reachTrend?: 'up' | 'down';
}

export interface PostVariant {
  platform: 'Instagram' | 'Facebook' | 'LinkedIn';
  content: string;
  hashtags: string[];
  tip: string;
}

// ── Platform config ────────────────────────────────────────────────────────────

export const PLATFORM_CONFIG = {
  Instagram: {
    emoji: '📸',
    gradient: 'from-pink-500 to-orange-400',
    bg: 'bg-pink-50 border-pink-200',
    text: 'text-pink-700',
    maxChars: 2200,
    hint: 'Stories + Reels favorisés',
  },
  Facebook: {
    emoji: '📘',
    gradient: 'from-blue-600 to-blue-400',
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
    maxChars: 63206,
    hint: 'Portée organique + partage',
  },
  LinkedIn: {
    emoji: '💼',
    gradient: 'from-sky-700 to-sky-500',
    bg: 'bg-sky-50 border-sky-200',
    text: 'text-sky-700',
    maxChars: 3000,
    hint: 'Ton professionnel recommandé',
  },
} as const;

// ── Quick idea chips ────────────────────────────────────────────────────────────

export const QUICK_IDEAS = [
  { emoji: '🎉', text: 'Promotion flash' },
  { emoji: '🍽️', text: 'Plat / service du jour' },
  { emoji: '🌟', text: 'Témoignage client' },
  { emoji: '📅', text: 'Événement à venir' },
  { emoji: '🎁', text: 'Offre spéciale' },
  { emoji: '🛠️', text: 'Coulisses du métier' },
  { emoji: '✨', text: 'Avant / après' },
  { emoji: '🏆', text: 'Anniversaire / jalon' },
  { emoji: '❓', text: 'Question à la communauté' },
  { emoji: '📰', text: "Actualité de l'activité" },
];

// ── AI prompt builder ──────────────────────────────────────────────────────────

export function buildPostPrompt(
  idea: string,
  ctx: PerformanceContext,
  estName: string,
  sector: string,
): string {
  return `Tu es un expert en marketing des réseaux sociaux pour les TPE/PME françaises. Génère 3 publications optimisées pour "${estName}" (secteur : ${sector}).

Idée du gérant : "${idea}"

Contexte de performance :
- Plateforme la plus performante : ${ctx.topPlatform}
- Meilleur post récent : "${ctx.bestPostTitle}"
- Taux d'engagement : ${ctx.engagementRate}%
- Portée mensuelle : ${ctx.reach.toLocaleString('fr-FR')} personnes
- Nombre de posts ce mois : ${ctx.posts}
${ctx.topEngagementDay ? `- Meilleur jour d'engagement : ${ctx.topEngagementDay}` : ''}

IMPORTANT : Adapte le style et le ton à chaque plateforme. Pour ${ctx.topPlatform}, donne le meilleur contenu car c'est la plateforme principale.

Réponds EXACTEMENT dans ce format (respecte ### et les labels majuscules) :

### Instagram
CONTENU:
[Post Instagram accrocheur, émojis, ton authentique, 150-300 mots. Commence par une accroche percutante.]

HASHTAGS:
#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5 #hashtag6 #hashtag7 #hashtag8

CONSEIL:
[Un conseil précis pour maximiser les résultats : meilleur moment, format (Reel/Carrousel/Story), technique d'engagement.]

### Facebook
CONTENU:
[Post Facebook narratif, favorise le partage et la communauté, 100-250 mots. Ton chaleureux et conversationnel.]

HASHTAGS:
#hashtag1 #hashtag2 #hashtag3 #hashtag4

CONSEIL:
[Conseil Facebook spécifique : boost, groupe local, heure optimale.]

### LinkedIn
CONTENU:
[Post LinkedIn professionnel, 150-300 mots. Partage d'expertise, coulisses positives, ton inspirant et réel.]

HASHTAGS:
#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5

CONSEIL:
[Conseil LinkedIn : format idéal, heure B2B, invitation à l'interaction.]

Ne rajoute aucun texte avant "### Instagram" ni après le dernier CONSEIL.`;
}

// ── Response parser ────────────────────────────────────────────────────────────

export function parsePostVariants(raw: string): PostVariant[] {
  const platforms: Array<PostVariant['platform']> = ['Instagram', 'Facebook', 'LinkedIn'];
  const variants: PostVariant[] = [];

  for (const platform of platforms) {
    const regex = new RegExp(
      `### ${platform}[\\s\\S]*?(?=### (?:Instagram|Facebook|LinkedIn)|$)`,
      'i',
    );
    const match = raw.match(regex);
    if (!match) continue;

    const section = match[0];
    const contentMatch = section.match(/CONTENU:\s*([\s\S]*?)(?=HASHTAGS:|CONSEIL:|$)/i);
    const hashtagsMatch = section.match(/HASHTAGS:\s*([\s\S]*?)(?=CONSEIL:|$)/i);
    const tipMatch = section.match(/CONSEIL:\s*([\s\S]*?)(?=###|$)/i);

    const content = contentMatch?.[1]?.trim() ?? '';
    const hashtagsRaw = hashtagsMatch?.[1]?.trim() ?? '';
    const hashtags = hashtagsRaw
      .split(/\s+/)
      .filter((t) => t.startsWith('#'))
      .slice(0, 10);
    const tip = tipMatch?.[1]?.trim() ?? '';

    if (content) {
      variants.push({ platform, content, hashtags, tip });
    }
  }

  return variants;
}
