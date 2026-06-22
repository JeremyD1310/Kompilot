/**
 * metaCampaignExport.ts — Routes API pour l'export Calendar → Meta Ads Manager
 *
 * Expose deux endpoints sécurisés (JWT Blink requis) :
 *
 *   POST /api/meta/export-campaign
 *     → Crée une Draft Campaign + Ad Set dans Meta Ads Manager
 *       à partir d'une campagne validée dans le Calendar Kompilot.
 *
 *   GET  /api/meta/campaign-performance
 *     → Retourne les KPIs (dépenses, clics, impressions, CTR) de toutes
 *       les campagnes d'un compte Meta sur une période donnée.
 *
 * Sécurité :
 *   - META_SYSTEM_USER_TOKEN ne transite JAMAIS côté client
 *   - JWT Blink requis sur toutes les routes /api/meta/*
 *   - Validation des paramètres avant tout appel à l'API Graph
 */

import { Hono }          from 'hono';
import { createClient }  from '@blinkdotnew/sdk';
import {
  exportCampaignToMeta,
  fetchCampaignPerformance,
  type CampaignExportData,
} from '../lib/metaMarketingService';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Env {
  BLINK_SECRET_KEY: string;
  META_SYSTEM_USER_TOKEN: string;
  META_APP_ID: string;
}

export const router = new Hono<{ Bindings: Env }>();

// ── Middleware JWT Blink ───────────────────────────────────────────────────────

/**
 * Protège toutes les routes /api/meta/* avec un JWT Blink valide.
 * Le token Meta ne quitte jamais le serveur.
 */
router.use('/api/meta/*', async (c, next) => {
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
    if (!user) return c.json({ error: 'Token JWT invalide ou expiré.' }, 401);
  } catch {
    return c.json({ error: 'Échec de la vérification JWT Blink.' }, 401);
  }
  await next();
});

// ── Helper : récupérer et valider le token Meta ───────────────────────────────

function getMetaToken(env: Env): string | null {
  const token = env.META_SYSTEM_USER_TOKEN ?? '';
  return token.trim() ? token : null;
}

// ── POST /api/meta/export-campaign ────────────────────────────────────────────

/**
 * Exporte une campagne depuis le Calendar Kompilot vers Meta Ads Manager.
 *
 * Corps de requête attendu (CampaignExportData) :
 * {
 *   "adAccountId": "act_123456789",      // ID du compte publicitaire Meta
 *   "message":     "Texte de l'annonce", // Body copy
 *   "campaignName":"Nom de la campagne",
 *   "objective":   "REACH",              // ou LINK_CLICKS, POST_ENGAGEMENT…
 *   "dailyBudgetCents": 1000,            // 10€/jour en centimes
 *   "startDate":   "2025-07-01",
 *   "endDate":     "2025-07-31",         // optionnel
 *   "targetCountry": "FR",
 *   "ageMin": 25, "ageMax": 55,          // optionnels
 *   "genders": [1, 2],                   // optionnel — 0=tous
 *   "destinationUrl": "https://…",       // optionnel
 *   "imageUrl": "https://…"              // optionnel
 * }
 *
 * Réponse en cas de succès :
 * {
 *   "success": true,
 *   "campaignId": "120200000XXXXXXX",
 *   "adSetId": "120200000YYYYYYY",
 *   "adsManagerUrl": "https://adsmanager.facebook.com/…",
 *   "status": "PAUSED"
 * }
 */
router.post('/api/meta/export-campaign', async (c) => {
  const metaToken = getMetaToken(c.env);
  if (!metaToken) {
    return c.json({
      error: 'META_SYSTEM_USER_TOKEN non configuré dans les secrets Cloudflare Workers.',
      hint: 'Ajoutez le secret dans votre espace Blink → Intégrations → Meta.',
    }, 503);
  }

  // Parsing et validation du corps de requête
  let body: Partial<CampaignExportData & { adAccountId: string }>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Corps de requête JSON invalide.' }, 400);
  }

  const { adAccountId, message, campaignName, objective, dailyBudgetCents, startDate, targetCountry } = body;

  // Validation des champs obligatoires
  if (!adAccountId)        return c.json({ error: 'Paramètre adAccountId requis (ex: act_123456).' }, 400);
  if (!message)            return c.json({ error: 'Paramètre message requis (texte de l\'annonce).' }, 400);
  if (!campaignName)       return c.json({ error: 'Paramètre campaignName requis.' }, 400);
  if (!objective)          return c.json({ error: 'Paramètre objective requis (REACH, LINK_CLICKS, …).' }, 400);
  if (!dailyBudgetCents || isNaN(Number(dailyBudgetCents))) {
    return c.json({ error: 'Paramètre dailyBudgetCents requis (entier en centimes, ex: 1000 pour 10€).' }, 400);
  }
  if (!startDate)          return c.json({ error: 'Paramètre startDate requis (ISO: 2025-07-01).' }, 400);
  if (!targetCountry)      return c.json({ error: 'Paramètre targetCountry requis (ex: FR).' }, 400);

  // Validation des objectifs autorisés
  const VALID_OBJECTIVES = ['REACH', 'LINK_CLICKS', 'POST_ENGAGEMENT', 'CONVERSIONS', 'BRAND_AWARENESS'];
  if (!VALID_OBJECTIVES.includes(objective as string)) {
    return c.json({
      error: `Objectif invalide : "${objective}". Valeurs autorisées : ${VALID_OBJECTIVES.join(', ')}.`,
    }, 400);
  }

  // Normalisation de l'accountId (assure le préfixe act_)
  const normalizedAccountId = (adAccountId as string).startsWith('act_')
    ? adAccountId as string
    : `act_${adAccountId}`;

  const campaignData: CampaignExportData = {
    message:           message as string,
    campaignName:      campaignName as string,
    objective:         objective as CampaignExportData['objective'],
    dailyBudgetCents:  Number(dailyBudgetCents),
    startDate:         startDate as string,
    endDate:           body.endDate,
    targetCountry:     (targetCountry as string).toUpperCase(),
    ageMin:            body.ageMin,
    ageMax:            body.ageMax,
    genders:           body.genders,
    destinationUrl:    body.destinationUrl,
    imageUrl:          body.imageUrl,
  };

  console.log(`[metaCampaignExport] Export vers ${normalizedAccountId} — campagne: "${campaignName}" — objectif: ${objective}`);

  const result = await exportCampaignToMeta(metaToken, normalizedAccountId, campaignData);
  const status = result.success ? 200 : (result.metaErrorCode === 401 || result.metaErrorCode === 190 ? 401 : 400);

  return c.json(result, status);
});

// ── GET /api/meta/campaign-performance ───────────────────────────────────────

/**
 * Retourne les métriques de performance de toutes les campagnes Meta d'un compte.
 *
 * Query params :
 *   adAccountId  — ID du compte (ex: act_123456)
 *   datePreset   — last_7d | last_30d | this_month (défaut: last_30d)
 *
 * Réponse :
 * {
 *   "metrics": [
 *     {
 *       "campaignId": "120200000X",
 *       "campaignName": "Campagne Pizza Locale",
 *       "status": "ACTIVE",
 *       "spendEur": 45.30,
 *       "clicks": 312,
 *       "impressions": 18450,
 *       "ctrPct": 1.69,
 *       "cpcEur": 0.14,
 *       "cpmEur": 2.45,
 *       "reach": 12300,
 *       "dateRange": { "start": "2025-06-01", "end": "2025-06-30" }
 *     }
 *   ],
 *   "accountId": "act_123456",
 *   "datePreset": "last_30d",
 *   "fetchedAt": "2025-06-19T13:00:00.000Z"
 * }
 */
router.get('/api/meta/campaign-performance', async (c) => {
  const metaToken = getMetaToken(c.env);
  if (!metaToken) {
    return c.json({
      error: 'META_SYSTEM_USER_TOKEN non configuré.',
      metrics: [],
    }, 503);
  }

  const adAccountId = c.req.query('adAccountId');
  const datePreset  = c.req.query('datePreset') as 'last_7d' | 'last_30d' | 'this_month' | undefined;

  if (!adAccountId) {
    return c.json({ error: 'Query param adAccountId requis.', metrics: [] }, 400);
  }

  // Validation de datePreset
  const VALID_PRESETS = ['last_7d', 'last_30d', 'this_month'];
  const preset = VALID_PRESETS.includes(datePreset ?? '') ? datePreset! : 'last_30d';

  const normalizedAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;

  try {
    const metrics = await fetchCampaignPerformance(metaToken, normalizedAccountId, preset);
    return c.json({
      metrics,
      accountId:  normalizedAccountId,
      datePreset: preset,
      fetchedAt:  new Date().toISOString(),
    }, 200);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[metaCampaignExport] fetchCampaignPerformance error:', msg);
    return c.json({ error: msg, metrics: [] }, 400);
  }
});

// ── GET /api/meta/ad-accounts ─────────────────────────────────────────────────

/**
 * Liste les comptes publicitaires disponibles pour le System User Token.
 * Utilisé par le frontend pour laisser l'utilisateur choisir son compte.
 */
router.get('/api/meta/ad-accounts', async (c) => {
  const metaToken = getMetaToken(c.env);
  if (!metaToken) {
    return c.json({ error: 'META_SYSTEM_USER_TOKEN non configuré.', accounts: [] }, 503);
  }

  try {
    const { getAdAccounts } = await import('../lib/metaMarketingService');
    const accounts = await getAdAccounts(metaToken);
    return c.json({ accounts });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg, accounts: [] }, 400);
  }
});
