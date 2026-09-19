import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();
type Row = Record<string, any>;
interface TrendSource { url?: string; title?: string; }

async function actor(c: any) {
  const blink = createClient({ projectId: requireBlinkProjectId(c.env), secretKey: c.env.BLINK_SECRET_KEY });
  const verified = await blink.auth.verifyToken(c.req.header('Authorization'));
  return verified.valid ? { blink, userId: verified.userId } : null;
}

const FALLBACK_TRENDS = [
  { id: 'fallback-local-proof', title: 'Preuves locales et coulisses', summary: 'Montrez les personnes, gestes et détails qui rendent votre établissement unique.', contentAngles: ['Une journée dans votre établissement', 'Avant/après d’un geste métier'], platforms: ['Instagram', 'TikTok', 'Facebook'], signal: 'Format en hausse', sourceType: 'fallback' },
  { id: 'fallback-education', title: 'Conseil utile en format court', summary: 'Répondez à une question fréquente avec une astuce immédiatement applicable.', contentAngles: ['Une erreur à éviter', 'Le conseil du professionnel'], platforms: ['LinkedIn', 'Instagram', 'Google Business'], signal: 'Fort potentiel d’engagement', sourceType: 'fallback' },
  { id: 'fallback-community', title: 'Ancrage local et communauté', summary: 'Reliez votre activité à la vie du quartier et invitez les habitants à participer.', contentAngles: ['Question aux habitants', 'Partenariat ou événement local'], platforms: ['Facebook', 'Instagram', 'Google Business'], signal: 'Pertinent pour le local', sourceType: 'fallback' },
];

function parseJson(text: string): any[] {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function sourceDetails(source: any): TrendSource {
  if (typeof source === 'string' && source.startsWith('http')) return { url: source };
  if (source && typeof source.url === 'string') return { url: source.url, title: typeof source.title === 'string' ? source.title : undefined };
  return {};
}

router.get('/api/content-trends', async (c) => {
  const user = await actor(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const sector = c.req.query('sector') || 'commerce local';
  const city = c.req.query('city') || 'France';
  const now = new Date().toISOString();
  try {
    const result = await user.blink.ai.generateText({
      search: true,
      model: 'openai/gpt-4.1-mini',
      maxTokens: 1600,
      messages: [
        { role: 'system', content: 'Tu es un analyste des tendances éditoriales pour les petites entreprises françaises. Utilise la recherche web pour repérer des signaux récents et vérifiables. Ne fabrique jamais de pourcentage, de source ou de fait. Retourne uniquement un tableau JSON.' },
        { role: 'user', content: `Date actuelle: ${now}. Secteur: ${sector}. Ville/pays: ${city}. Donne 4 tendances ou formats de contenu observés récemment, adaptés à ce secteur et à cette zone. Distingue un fait sourcé d’une recommandation éditoriale. Pour chaque élément, retourne exactement {"title":"", "summary":"", "contentAngles":[""], "platforms":["Instagram"], "signal":"En hausse|Pertinent localement|Format recommandé"}. Les sources web seront affichées séparément; ne mets pas d’URL inventée dans le JSON et n’invente aucun chiffre de croissance.` },
      ],
    });
    const sources = Array.isArray((result as any).sources) ? (result as any).sources.map(sourceDetails).filter((source: TrendSource) => Boolean(source.url)) : [];
    const trends = parseJson(result.text).slice(0, 5).filter(trend => trend && typeof trend === 'object' && String(trend.title || '').trim() && String(trend.summary || '').trim()).map((trend, index) => ({
      id: `trend-${index}-${Date.now()}`,
      title: String(trend.title || 'Signal éditorial récent'),
      summary: String(trend.summary || ''),
      contentAngles: Array.isArray(trend.contentAngles) ? trend.contentAngles.map(String).slice(0, 3) : [],
      platforms: Array.isArray(trend.platforms) ? trend.platforms.map(String).slice(0, 4) : [],
      signal: String(trend.signal || 'Format recommandé'),
      sourceType: 'live-web',
      sourceUrl: sources[index]?.url,
      sourceName: sources[index]?.title,
      observedAt: now,
    }));
    if (!trends.length) throw new Error('No trend data returned');
    return c.json({ trends, generatedAt: now, source: 'live-web', sources: sources.map((source: TrendSource) => source.url), sourceDetails: sources });
  } catch (error) {
    console.error('[content-trends] live search unavailable', error);
    return c.json({ trends: FALLBACK_TRENDS, generatedAt: now, source: 'fallback', warning: 'web-search-unavailable', sources: [], sourceDetails: [] });
  }
});

router.get('/api/content-trends/activity', async (c) => {
  const user = await actor(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const [posts, messages] = await Promise.allSettled([
      user.blink.db.table<Row>('scheduled_posts').list({ where: { userId: user.userId }, orderBy: { createdAt: 'desc' }, limit: 12 }),
      user.blink.db.table<Row>('messages').list({ where: { userId: user.userId }, orderBy: { createdAt: 'desc' }, limit: 8 }),
    ]);
    const recentPosts = posts.status === 'fulfilled' ? posts.value.map((post) => ({
      title: String(post.textContent || post.title || 'Publication sans titre').slice(0, 160),
      status: String(post.status || 'draft'),
      channels: String(post.channels || post.platform || ''),
      createdAt: String(post.createdAt || ''),
      scheduledAt: String(post.scheduledAt || ''),
      impressions: Number(post.impressions || 0),
      engagementRate: Number(post.engagementRate || 0),
    })) : [];
    const recentMessages = messages.status === 'fulfilled' ? messages.value.map((message) => ({
      subject: String(message.subject || message.content || message.text || 'Message récent').slice(0, 120),
      status: String(message.status || 'unread'),
      createdAt: String(message.createdAt || ''),
    })) : [];

    return c.json({
      recentPosts,
      recentMessages,
      totals: { posts: recentPosts.length, messages: recentMessages.length },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[content-trends/activity] unable to read recent activity', error);
    return c.json({ recentPosts: [], recentMessages: [], totals: { posts: 0, messages: 0 }, generatedAt: new Date().toISOString() });
  }
});

router.post('/api/content-trends/ideas', async (c) => {
  const user = await actor(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json() as { sector?: string; city?: string; tone?: string; objective?: string; language?: string; trends?: Row[]; activity?: Row };
  const trends = Array.isArray(body.trends) ? body.trends.slice(0, 5) : [];
  try {
    const result = await user.blink.ai.generateObject({
      model: 'openai/gpt-4.1-mini',
      maxTokens: 1400,
      prompt: `Tu es le stratège éditorial de Kompilot. Rédige exactement 3 idées de publications en ${body.language || 'français'}, concrètes et honnêtes pour une entreprise locale. Les tendances sont des angles, pas des faits à reprendre. N’invente ni offre, ni prix, ni statistique. Secteur: ${body.sector || 'commerce local'}. Zone: ${body.city || 'France'}. Ton: ${body.tone || 'engageant'}. Objectif: ${body.objective || 'engagement'}. Signaux d’activité du compte: ${JSON.stringify(body.activity || {})}. Tendances récentes: ${JSON.stringify(trends)}. Utilise une structure claire et une formulation actionnable.`,
      schema: {
        type: 'object',
        properties: {
          ideas: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                angle: { type: 'string' },
                caption: { type: 'string' },
                hashtags: { type: 'array', items: { type: 'string' } },
                visualHint: { type: 'string' },
              },
              required: ['angle', 'caption', 'hashtags', 'visualHint'],
            },
          },
        },
        required: ['ideas'],
      },
    });
    const rawIdeas = Array.isArray((result as any).object?.ideas) ? (result as any).object.ideas : [];
    const ideas = rawIdeas.slice(0, 3).filter((idea: any) => idea && String(idea.caption || '').trim()).map((idea: any, index: number) => ({
      angle: String(idea.angle || `Angle tendance ${index + 1}`),
      caption: String(idea.caption),
      hashtags: Array.isArray(idea.hashtags) ? idea.hashtags.map(String).filter(Boolean).slice(0, 6) : [],
      visualHint: String(idea.visualHint || 'Format court adapté à votre réseau'),
    }));
    if (!ideas.length) return c.json({ error: 'No content ideas returned' }, 502);
    return c.json({ ideas, source: 'blink-ai', generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('[content-trends/ideas] generation unavailable', error);
    return c.json({ error: error instanceof Error ? error.message : 'Unable to generate trend ideas' }, 502);
  }
});
