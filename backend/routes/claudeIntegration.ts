/**
 * claudeIntegration.ts — Routes API Anthropic Claude pour Kompilot
 *
 * Expose des endpoints sécurisés (JWT Blink requis) permettant au frontend
 * d'accéder aux fonctions Claude sans exposer la clé ANTHROPIC_API_KEY.
 *
 * Routes :
 *   GET  /api/claude/check                 — test de connectivité
 *   POST /api/claude/coworking             — assistant co-working longue-contexte
 *   POST /api/claude/analyze-competitor    — analyse stratégique concurrent
 *   POST /api/claude/campaign-plan         — plan campagne 30 jours complet
 *   POST /api/claude/review-content        — audit qualité d'un texte
 *   POST /api/claude/audit-flash           — audit flash visibilité locale
 *
 * Sécurité :
 *   - La clé ANTHROPIC_API_KEY ne transite JAMAIS côté client
 *   - Toutes les routes requièrent un JWT Blink valide (Authorization: Bearer)
 */

import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import {
  checkClaudeConnection,
  coworkingAssist,
  analyzeCompetitorStrategy,
  generateDetailedCampaignPlan,
  reviewContentQuality,
  generateAuditFlash,
  ClaudeError,
} from '../lib/claudeService';

interface Env {
  BLINK_SECRET_KEY: string;
  ANTHROPIC_API_KEY: string;
}

export const router = new Hono<{ Bindings: Env }>();

// ── Middleware JWT Blink ───────────────────────────────────────────────────────

/**
 * Protège toutes les routes /api/claude/* avec un JWT Blink valide.
 */
router.use('/api/claude/*', async (c, next) => {
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

function getKey(env: Env): string | null {
  const key = env.ANTHROPIC_API_KEY ?? '';
  return (key && key.startsWith('sk-ant-')) ? key : null;
}

function handleClaudeError(err: unknown, c: { json: Function }) {
  if (err instanceof ClaudeError) {
    const status = err.isAuthError ? 401 : err.isQuotaError ? 429 : 400;
    return c.json({ error: err.message, errorType: err.errorType, statusCode: err.statusCode }, status);
  }
  console.error('[claudeIntegration] Erreur inattendue:', err);
  return c.json({ error: String(err) }, 500);
}

// ── GET /api/claude/check ─────────────────────────────────────────────────────

/**
 * Vérifie que la clé Anthropic est valide, le crédit disponible et
 * que CF Workers peut joindre api.anthropic.com.
 */
router.get('/api/claude/check', async (c) => {
  const key = c.env.ANTHROPIC_API_KEY ?? '';
  if (!key) {
    return c.json({
      connected: false,
      error: 'ANTHROPIC_API_KEY non configuré dans les secrets Cloudflare Workers.',
      checkedAt: new Date().toISOString(),
    }, 503);
  }
  const status = await checkClaudeConnection(key);
  return c.json(status, status.connected ? 200 : 400);
});

// ── POST /api/claude/coworking ────────────────────────────────────────────────

/**
 * Assistant co-working longue-contexte : analyse, rédaction, conseil.
 * Body JSON : { task, context?, role? }
 */
router.post('/api/claude/coworking', async (c) => {
  const key = getKey(c.env);
  if (!key) return c.json({ error: 'ANTHROPIC_API_KEY non configuré.' }, 503);

  const { task = '', context = '', role } = await c.req.json<{
    task?: string; context?: string; role?: string;
  }>();
  if (!task) return c.json({ error: 'Paramètre task requis.' }, 400);

  try {
    const result = await coworkingAssist(key, task, context, role);
    return c.json({ result, task });
  } catch (err) { return handleClaudeError(err, c); }
});

// ── POST /api/claude/analyze-competitor ───────────────────────────────────────

/**
 * Analyse stratégique d'un concurrent.
 * Body JSON : { competitorName, competitorData, ourStrengths }
 */
router.post('/api/claude/analyze-competitor', async (c) => {
  const key = getKey(c.env);
  if (!key) return c.json({ error: 'ANTHROPIC_API_KEY non configuré.' }, 503);

  const { competitorName = '', competitorData = '', ourStrengths = '' } = await c.req.json<{
    competitorName?: string; competitorData?: string; ourStrengths?: string;
  }>();
  if (!competitorName) return c.json({ error: 'Paramètre competitorName requis.' }, 400);

  try {
    const analysis = await analyzeCompetitorStrategy(key, competitorName, competitorData, ourStrengths);
    return c.json({ analysis, competitorName });
  } catch (err) { return handleClaudeError(err, c); }
});

// ── POST /api/claude/campaign-plan ───────────────────────────────────────────

/**
 * Plan de campagne marketing complet sur 30 jours.
 * Body JSON : { sector, objective, budget, city, channels }
 */
router.post('/api/claude/campaign-plan', async (c) => {
  const key = getKey(c.env);
  if (!key) return c.json({ error: 'ANTHROPIC_API_KEY non configuré.' }, 503);

  const {
    sector = 'commerce local', objective = 'attirer de nouveaux clients',
    budget = 500, city = 'France',
    channels = ['instagram', 'google', 'sms'],
  } = await c.req.json<{
    sector?: string; objective?: string; budget?: number; city?: string; channels?: string[];
  }>();

  try {
    const plan = await generateDetailedCampaignPlan(key, sector, objective, budget, city, channels);
    return c.json({ plan, sector, objective, budget, city, channels });
  } catch (err) { return handleClaudeError(err, c); }
});

// ── POST /api/claude/review-content ──────────────────────────────────────────

/**
 * Audit qualité d'un texte marketing.
 * Body JSON : { content, type, sector }
 */
router.post('/api/claude/review-content', async (c) => {
  const key = getKey(c.env);
  if (!key) return c.json({ error: 'ANTHROPIC_API_KEY non configuré.' }, 503);

  const { content = '', type = 'post', sector = 'commerce' } = await c.req.json<{
    content?: string; type?: string; sector?: string;
  }>();
  if (!content) return c.json({ error: 'Paramètre content requis.' }, 400);

  const allowedTypes = ['post', 'review_reply', 'description', 'ad'];
  if (!allowedTypes.includes(type)) {
    return c.json({ error: `type invalide. Valeurs : ${allowedTypes.join(', ')}.` }, 400);
  }

  try {
    const review = await reviewContentQuality(key, content, type as any, sector);
    return c.json({ review, type, sector });
  } catch (err) { return handleClaudeError(err, c); }
});

// ── POST /api/claude/audit-flash ─────────────────────────────────────────────

/**
 * Audit flash de visibilité locale.
 * Body JSON : { businessName, sector, city, issues }
 */
router.post('/api/claude/audit-flash', async (c) => {
  const key = getKey(c.env);
  if (!key) return c.json({ error: 'ANTHROPIC_API_KEY non configuré.' }, 503);

  const {
    businessName = '', sector = 'commerce', city = 'France', issues = [],
  } = await c.req.json<{
    businessName?: string; sector?: string; city?: string; issues?: string[];
  }>();
  if (!businessName) return c.json({ error: 'Paramètre businessName requis.' }, 400);

  try {
    const audit = await generateAuditFlash(key, businessName, sector, city, issues);
    return c.json({ audit, businessName, city });
  } catch (err) { return handleClaudeError(err, c); }
});
