/**
 * linkedinGenerator.ts — AI-powered LinkedIn post generation
 *
 * POST /api/linkedin/generate
 *   → Takes source content, AIO keywords, goal, and brand tone
 *   → Returns a structured LinkedIn post optimized for engagement
 *
 * Auth: JWT Blink required.
 */

import { Hono }           from 'hono';
import OpenAI             from 'openai';
import type { Env }       from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

// ── Master Prompt ───────────────────────────────────────────────────────────

const MASTER_PROMPT = `Chapeau : Tu es l'expert en copywriting B2B et en stratégie AIO (Artificial Intelligence Optimization) de la solution Kompilot. Ton objectif est de transformer des données brutes de performance SEO/AIO ou des articles de blog en un post LinkedIn ultra-engageant, percutant et optimisé pour le réseau professionnel.

CONTEXTE FOURNI PAR KOMPILOT :
- Sujet principal / Contenu source : {{source_content}}
- Mots-clés cibles / Intentions IA : {{keywords_aio}}
- Objectif du post : {{post_goal}}
- Ton de la marque : {{brand_tone}}
- Longueur souhaitée : {{post_length}}
- Type d'appel à l'action : {{cta_type}}

CONSIGNES DE STRUCTURATION DU POST (STYLE LINKEDIN DE HAUT NIVEAU) :
1. L'ACCROCHE (La "Hook") : Les 2 premières lignes doivent être percutantes. Pas de blabla, va droit au but, crée de la curiosité ou casse un mythe pour inciter à cliquer sur "...voir plus".
2. LE CORPS (Le "Meat") : Développe le sujet en utilisant le format "Bullet Points" ou "Listes aérées". Rends le contenu scannable. Utilise des phrases courtes. Supprime le jargon inutile. Adapte la longueur au format demandé.
3. LA VALEUR (Le "Takeaway") : Apporte une solution concrète ou une statistique marquante liée aux mots-clés AIO.
4. L'ACTION (Le "CTA") : Termine avec le type d'appel à l'action spécifié. Si "Question ouverte", pose une question engageante. Si "Invite DM", pousse vers la conversation privée. Si "Sondage", propose un choix A/B/C. Si "Tag & Partage", invite à taguer quelqu'un. Si "Newsletter", invite à s'inscrire. Si "Lien en bio", mentionne le lien dans la bio.

FORMAT DE LONGUEUR :
- Court (~300 caractères) : Va droit au but. 1 idée forte, 1 chiffre, 1 CTA. Style tweet long.
- Moyen (~800 caractères) : Équilibre entre profondeur et concision. 2-3 bullet points + CTA.
- Long (~1500 caractères) : Deep dive. Storytelling complet, données détaillées, multiple sections.
- Thread (Multi-part) : Structure en 3-5 parties numérotées (1/5, 2/5, etc.). Chaque partie = 1 idée distincte. Sépare chaque partie par "---".

RÈGLES STRICTES DE SÉCURITÉ & FORMATAGE :
- Pas de salutations corporate pompeuses ("Bonjour à tous", "Chers membres de mon réseau").
- Pas d'introduction ni de conclusion méta ("Voici votre post LinkedIn :"). Renvoie UNIQUEMENT le texte du post.
- Utilise au maximum 3 hashtags pertinents à la toute fin.
- Évite les émojis à chaque ligne. Utilise-les uniquement pour structurer visuellement les listes (maximum 4-5 émojis sur tout le post).

GÉNÈRE LE POST LINKEDIN DIRECTEMENT CI-DESSOUS :`;

// ── Types ───────────────────────────────────────────────────────────────────

interface GenerateRequest {
  sourceContent: string   // raw text, article, or performance data
  keywordsAio: string[]   // target AIO keywords
  postGoal: string        // e.g. "Générer des leads", "Notoriété"
  brandTone?: string      // e.g. "Expert mais accessible"
  postLength?: string     // e.g. "~300 car. · Punchy", "~800 car. · Équilibré", "~1500 car. · Deep dive", "Multi-part · Carousel-style"
  ctaType?: string        // e.g. "Question ouverte", "Invite DM", "Lien en bio", "Sondage", "Tag & Partage", "Newsletter"
}

// ── JWT Middleware ───────────────────────────────────────────────────────────

router.use('/api/linkedin/*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Non autorisé — JWT Blink requis.', code: 'UNAUTHORIZED' }, 401);
  }
  await next();
});

// ── POST /api/linkedin/generate ──────────────────────────────────────────────

router.post('/api/linkedin/generate', async (c) => {
  let body: GenerateRequest;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'JSON invalide.', code: 'INVALID_JSON' }, 400);
  }

  const { sourceContent, keywordsAio, postGoal, brandTone, postLength, ctaType } = body;

  // Validation
  if (!sourceContent?.trim()) {
    return c.json({ error: 'Le contenu source est requis.', code: 'VALIDATION_ERROR' }, 400);
  }
  if (!postGoal?.trim()) {
    return c.json({ error: 'L\'objectif du post est requis.', code: 'VALIDATION_ERROR' }, 400);
  }

  // Build prompt with variable substitution
  const formattedPrompt = MASTER_PROMPT
    .replace('{{source_content}}', sourceContent)
    .replace('{{keywords_aio}}', (keywordsAio || []).join(', ') || 'visibilité locale, AIO, SEO')
    .replace('{{post_goal}}', postGoal)
    .replace('{{brand_tone}}', brandTone || 'Expert et accessible')
    .replace('{{post_length}}', postLength || '~800 car. · Équilibré')
    .replace('{{cta_type}}', ctaType || 'Question ouverte');

  // Initialize OpenAI
  const raw = c.env as unknown as Record<string, string | undefined>;
  const apiKey = raw.OPENAI_API_KEY || '';

  if (!apiKey) {
    return c.json({
      error: 'OPENAI_API_KEY manquant dans les secrets du projet.',
      code: 'CONFIG_MISSING',
    }, 503);
  }

  const openai = new OpenAI({ apiKey });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Tu es un copywriter B2B d\'élite, spécialisé dans le marketing de contenu LinkedIn pour les PME et agences. Tu connais parfaitement les codes du réseau professionnel français et international. Tu optimises chaque post pour la visibilité AIO (Artificial Intelligence Optimization).' },
        { role: 'user', content: formattedPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const generatedPost = response.choices?.[0]?.message?.content?.trim() || '';

    if (!generatedPost) {
      return c.json({ error: 'Réponse vide du modèle.', code: 'EMPTY_RESPONSE' }, 502);
    }

    // Compute metadata
    const charCount = generatedPost.length;
    const wordCount = generatedPost.split(/\s+/).filter(Boolean).length;
    const hashtagMatch = generatedPost.match(/#[\w\u00C0-\u024F]+/g) || [];
    const hashtagCount = hashtagMatch.length;

    return c.json({
      success: true,
      post: generatedPost,
      metadata: {
        charCount,
        wordCount,
        hashtagCount,
        keywords: keywordsAio || [],
        goal: postGoal,
        tone: brandTone || 'Expert et accessible',
        postLength: postLength || '~800 car. · Équilibré',
        ctaType: ctaType || 'Question ouverte',
        model: 'gpt-4o',
        temperature: 0.7,
        generatedAt: new Date().toISOString(),
      },
    }, 200);
  } catch (err: any) {
    const errorMsg = err?.message || 'Erreur inconnue';
    console.error('[linkedinGenerator] OpenAI error:', errorMsg);
    return c.json({
      error: `Erreur de génération : ${errorMsg}`,
      code: 'GENERATION_FAILED',
    }, 502);
  }
});

export default router;
