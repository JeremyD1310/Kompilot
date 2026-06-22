/**
 * Funnels — AI copywriting routes
 *
 *   POST /api/funnels/generate-swipes — elite copywriter (system prompt + gpt-4.1)
 *   POST /api/funnels/ai-swipes       — simpler angle-based hook generator
 */
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';

const app = new Hono<{ Bindings: { BLINK_SECRET_KEY: string } }>();

// ── POST /generate-swipes ─────────────────────────────────────────────────────
// Elite AI copywriter: analyzes a competitor ad, extracts deep psychological
// structure (hook / story / offer) and rewrites it in 3 ready-to-use variations.
//
// Body: { competitorAdText: string, userBusinessDescription: string }
// Returns: { analysis, variations: [{ title, hook, body, cta }] }
app.post('/generate-swipes', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const blink = createClient({
      projectId: 'presence-manager-saas-gbrhsehk',
      secretKey: c.env.BLINK_SECRET_KEY,
    });

    const token = authHeader.split(' ')[1];
    const user = await blink.auth.verifyToken(token);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const body = await c.req.json();
    const { competitorAdText, userBusinessDescription } = body as {
      competitorAdText?: string;
      userBusinessDescription?: string;
    };

    if (!competitorAdText?.trim() || !userBusinessDescription?.trim()) {
      return c.json({ error: 'Données manquantes pour la génération.' }, 400);
    }

    const SYSTEM_PROMPT = `Tu es un copywriter d'élite spécialisé dans le growth marketing et les tunnels de vente B2B, SaaS et Infopreneuriat.\nTon rôle est d'analyser la publicité d'un concurrent, d'en extraire la structure psychologique profonde (le hook, l'histoire, l'offre),\npuis de la réécrire en 3 variations percutantes et prêtes à l'emploi adaptées au business de l'utilisateur.\n\nTu dois répondre EXCLUSIVEMENT au format JSON structurel suivant — sans texte avant ou après le JSON :\n{\n  \"analysis\": \"Résumé court de l'angle marketing du concurrent (2-3 phrases max)\",\n  \"variations\": [\n    {\n      \"title\": \"Variation 1: Directe & Rentrée dedans\",\n      \"hook\": \"Le hook accrocheur (1 ligne)\",\n      \"body\": \"Le corps du texte (3-5 lignes)\",\n      \"cta\": \"Le texte du bouton d'action\"\n    },\n    {\n      \"title\": \"Variation 2: Storytelling / Problème\",\n      \"hook\": \"Le hook accrocheur (1 ligne)\",\n      \"body\": \"Le corps du texte (3-5 lignes)\",\n      \"cta\": \"Le texte du bouton d'action\"\n    },\n    {\n      \"title\": \"Variation 3: Contre-intuitive / Curiosité\",\n      \"hook\": \"Le hook accrocheur (1 ligne)\",\n      \"body\": \"Le corps du texte (3-5 lignes)\",\n      \"cta\": \"Le texte du bouton d'action\"\n    }\n  ]\n}`;

    const USER_MESSAGE = `TEXTE DE LA PUB CONCURRENT :\n"${competitorAdText}"\n\nMON BUSINESS / MON OFFRE :\n"${userBusinessDescription}"`;

    const { text } = await blink.ai.generateText({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: USER_MESSAGE },
      ],
      model: 'gpt-4.1',
      maxTokens: 1200,
    });

    // Extract JSON block from the response (handles markdown code fences)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return c.json({ error: 'Format de réponse invalide — réessayez.' }, 500);
    }

    const aiResult = JSON.parse(jsonMatch[0]);
    return c.json(aiResult);
  } catch (err) {
    console.error('[generate-swipes]', err);
    return c.json({ error: 'Erreur interne du moteur IA.' }, 500);
  }
});

// ── POST /ai-swipes ───────────────────────────────────────────────────────────
// Generates AI-rewritten ad hooks inspired by competitor funnel ads.
app.post('/ai-swipes', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const blink = createClient({
      projectId: 'presence-manager-saas-gbrhsehk',
      secretKey: c.env.BLINK_SECRET_KEY,
    });

    const token = authHeader.split(' ')[1];
    const user = await blink.auth.verifyToken(token);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const body = await c.req.json();
    const { funnel_id, creator_name, domain_url, platform, source_ads = [], angle = 'result' } = body;

    if (!creator_name) {
      return c.json({ error: 'Missing creator_name' }, 400);
    }

    // Build prompt
    const adHooks = source_ads.length > 0
      ? source_ads.map((a: { hook: string; daysActive: number; format: string }) =>
          `- "${a.hook}" (${a.daysActive} jours actif, ${a.format})`
        ).join('\n')
      : '(aucune publicité source disponible)';

    const angleLabel: Record<string, string> = {
      curiosity: 'Curiosité — susciter une question irrésistible',
      pain: 'Douleur — toucher le problème profond',
      social_proof: 'Preuve sociale — s\'appuyer sur des résultats réels',
      result: 'Résultat — montrer la transformation finale',
    };

    const prompt = `Tu es un expert en copywriting publicitaire pour les funnels digitaux. Analyse les hooks publicitaires ci-dessous d'un concurrent (${creator_name}) et génère 3 hooks originaux inspirés de leur approche mais adaptés pour un concurrent différent.\n\nInformations sur le tunnel concurrent :\n- Créateur : ${creator_name}\n- Domaine : ${domain_url ?? 'non précisé'}\n- Plateforme : ${platform ?? 'meta'}\n\nHooks publicitaires du concurrent :\n${adHooks}\n\nAngle créatif demandé : ${angleLabel[angle] ?? angleLabel.result}\n\nGénère exactement 3 hooks publicitaires NOUVEAUX en français, numérotés 1), 2), 3). Chaque hook doit :\n- Être différent du concurrent mais s'inspirer de sa structure\n- Être percutant et adapté à la plateforme ${platform ?? 'meta'}\n- Faire maximum 2 lignes\n- Ne pas copier mot pour mot les hooks existants\n\nRéponds UNIQUEMENT avec les 3 hooks numérotés, sans introduction ni commentaire.`;

    const { text } = await blink.ai.generateText({
      prompt,
      model: 'gpt-4.1-mini',
      maxTokens: 400,
    });

    // Parse lines
    const lines = text
      .split('\n')
      .map((l: string) => l.trim())
      .filter((l: string) => /^[123][.)]\s/.test(l) || (l.length > 20 && /^[123]/.test(l)));

    const swipes = (lines.length >= 3 ? lines : text.split('\n').filter((l: string) => l.trim().length > 20))
      .slice(0, 3)
      .map((line: string, i: number) => ({
        id: `swipe-${Date.now()}-${i}`,
        hook: line.replace(/^[\d.)–\-]\s*/, '').trim(),
        format: (['video', 'image', 'carousel'] as const)[i % 3],
        angle,
      }));

    return c.json({ swipes, funnel_id, angle });
  } catch (err) {
    console.error('[ai-swipes]', err);
    return c.json({ error: 'Failed to generate swipes' }, 500);
  }
});

export const router = app;
