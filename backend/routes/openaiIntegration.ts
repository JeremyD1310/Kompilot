/**
 * openaiIntegration.ts — Routes API OpenAI pour Kompilot
 *
 * Expose des endpoints sécurisés (JWT Blink requis) permettant au frontend
 * de tester la connexion OpenAI et d'accéder aux fonctions de génération.
 *
 * Routes :
 *   GET  /api/openai/check              — teste la connexion et la clé
 *   POST /api/openai/campaign-ideas     — génère des idées de campagnes
 *   POST /api/openai/suggest-content    — suggestions de posts réseaux sociaux
 *   POST /api/openai/optimize-seo       — optimisation SEO d'un texte
 *   POST /api/openai/generate-ad-copy   — rédaction texte publicitaire
 *
 * Sécurité :
 *   - La clé OPENAI_API_KEY ne transite JAMAIS côté client
 *   - Toutes les routes requièrent un JWT Blink valide (Authorization: Bearer)
 */

import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import {
  checkOpenAIConnection,
  generateCampaignIdeas,
  suggestContent,
  optimizeSEO,
  generateAdCopy,
  OpenAIError,
} from '../lib/openaiService';

interface Env {
  BLINK_SECRET_KEY: string;
  OPENAI_API_KEY: string;
}

export const router = new Hono<{ Bindings: Env }>();

// ── Middleware JWT Blink ───────────────────────────────────────────────────────

/**
 * Protège toutes les routes /api/openai/* avec un JWT Blink valide.
 * Retourne 401 si le header Authorization est absent ou invalide.
 */
router.use('/api/openai/*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Non autorisé — JWT Blink requis.' }, 401);
  }
  const blink = createClient({
    projectId: 'presence-manager-saas-gbrhsehk',
    secretKey: c.env.BLINK_SECRET_KEY,
  });
  try {
    const token = authHeader.replace('Bearer ', '').trim();
    const user = await blink.auth.verifyToken(token);
    if (!user) return c.json({ error: 'Token invalide ou expiré.' }, 401);
  } catch {
    return c.json({ error: 'Échec de la vérification du token Blink.' }, 401);
  }
  await next();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Retourne la clé ou une 503 si absente */
function getKey(c: { env: Env; json: Function }) {
  const key = c.env.OPENAI_API_KEY ?? '';
  if (!key || !key.startsWith('sk-')) return null;
  return key;
}

/** Gestionnaire d'erreur OpenAI unifié */
function handleOpenAIError(err: unknown, c: { json: Function }) {
  if (err instanceof OpenAIError) {
    const status = err.isAuthError ? 401 : err.isQuotaError ? 429 : 400;
    return c.json({ error: err.message, code: err.code, statusCode: err.statusCode }, status);
  }
  console.error('[openaiIntegration] Erreur inattendue:', err);
  return c.json({ error: String(err) }, 500);
}

// ── GET /api/openai/check — test de connexion ─────────────────────────────────

/**
 * Vérifie que la clé OpenAI est valide, que le quota est disponible
 * et que CF Workers peut joindre api.openai.com.
 */
router.get('/api/openai/check', async (c) => {
  const key = c.env.OPENAI_API_KEY ?? '';
  if (!key) {
    return c.json({
      connected: false,
      error: 'OPENAI_API_KEY non configuré dans les secrets Cloudflare Workers.',
      checkedAt: new Date().toISOString(),
    }, 503);
  }
  const status = await checkOpenAIConnection(key);
  return c.json(status, status.connected ? 200 : 400);
});

// ── POST /api/openai/campaign-ideas ───────────────────────────────────────────

/**
 * Génère 3 idées de campagnes publicitaires locales.
 * Body JSON : { sector, objective, city, budget }
 */
router.post('/api/openai/campaign-ideas', async (c) => {
  const key = getKey(c as any);
  if (!key) return c.json({ error: 'OPENAI_API_KEY non configuré.' }, 503);

  const body = await c.req.json() as {
    sector?: string; objective?: string; city?: string; budget?: number;
  };
  const { sector = 'commerce local', objective = 'attirer de nouveaux clients', city = 'France', budget = 500 } = body;

  try {
    const ideas = await generateCampaignIdeas(key, sector, objective, city, budget);
    return c.json({ ideas, sector, objective, city, budget });
  } catch (err) { return handleOpenAIError(err, c); }
});

// ── POST /api/openai/suggest-content ──────────────────────────────────────────

/**
 * Génère un post pour un réseau social donné.
 * Body JSON : { topic, platform, sector, tone? }
 */
router.post('/api/openai/suggest-content', async (c) => {
  const key = getKey(c as any);
  if (!key) return c.json({ error: 'OPENAI_API_KEY non configuré.' }, 503);

  const body = await c.req.json() as {
    topic?: string; platform?: string; sector?: string; tone?: string;
  };
  const { topic = '', platform = 'instagram', sector = 'commerce', tone = 'professionnel' } = body;
  if (!topic) return c.json({ error: 'Paramètre topic requis.' }, 400);

  const allowedPlatforms = ['instagram', 'facebook', 'google'];
  if (!allowedPlatforms.includes(platform)) {
    return c.json({ error: `platform invalide. Valeurs : ${allowedPlatforms.join(', ')}.` }, 400);
  }

  try {
    const content = await suggestContent(key, topic, platform as any, sector, tone);
    return c.json({ content, topic, platform, sector, tone });
  } catch (err) { return handleOpenAIError(err, c); }
});

// ── POST /api/openai/optimize-seo ─────────────────────────────────────────────

/**
 * Optimise un texte pour le SEO local et l'AEO.
 * Body JSON : { text, keywords, targetCity }
 */
router.post('/api/openai/optimize-seo', async (c) => {
  const key = getKey(c as any);
  if (!key) return c.json({ error: 'OPENAI_API_KEY non configuré.' }, 503);

  const body = await c.req.json() as {
    text?: string; keywords?: string[]; targetCity?: string;
  };
  const { text = '', keywords = [], targetCity = 'France' } = body;
  if (!text) return c.json({ error: 'Paramètre text requis.' }, 400);

  try {
    const optimized = await optimizeSEO(key, text, keywords, targetCity);
    return c.json({ optimized, original: text, keywords, targetCity });
  } catch (err) { return handleOpenAIError(err, c); }
});

// ── POST /api/openai/generate-ad-copy ─────────────────────────────────────────

/**
 * Génère un texte publicitaire structuré (headline + body + cta).
 * Body JSON : { product, targetAudience, platform, urgency? }
 */
router.post('/api/openai/generate-ad-copy', async (c) => {
  const key = getKey(c as any);
  if (!key) return c.json({ error: 'OPENAI_API_KEY non configuré.' }, 503);

  const body = await c.req.json() as {
    product?: string; targetAudience?: string; platform?: string; urgency?: boolean;
  };
  const { product = '', targetAudience = 'grand public', platform = 'facebook', urgency = false } = body;
  if (!product) return c.json({ error: 'Paramètre product requis.' }, 400);

  try {
    const adCopy = await generateAdCopy(key, product, targetAudience, platform as any, urgency);
    return c.json({ adCopy, product, platform });
  } catch (err) { return handleOpenAIError(err, c); }
});
