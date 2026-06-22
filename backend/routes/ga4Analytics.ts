/**
 * ga4Analytics.ts — Routes API Google Analytics 4
 *
 * Routes :
 *   GET  /api/ga4/campaign-conversions?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 *     → Appelle getCampaignConversions() et retourne GA4Summary (trafic Meta filtré)
 *
 *   GET  /api/ga4/health
 *     → Vérifie que les 3 secrets GA4 sont présents (ne consomme pas de quota)
 *
 * Authentification : JWT Blink requis sur toutes les routes /api/ga4/*
 *
 * Gestion d'erreur :
 *   503 CONFIG_MISSING — un ou plusieurs secrets GA4 absents
 *   401 AUTH_FAILED    — JWT service account invalide / rejeté par Google
 *   502 API_ERROR      — l'API GA4 a retourné une erreur HTTP
 *   400 validation     — paramètres de date manquants ou malformés
 */

import { Hono }                       from 'hono';
import { createClient }               from '@blinkdotnew/sdk';
import type { Env }                   from '../lib/types';
import { getCampaignConversions }     from '../lib/analyticsService';
import { GA4_ERR_AUTH, GA4_ERR_CONF, GA4_ERR_PARSE } from '../lib/ga4ErrorCodes';

export const router = new Hono<{ Bindings: Env }>();

// ── Codes d'erreur exposés dans les réponses JSON (snake_case, pas de mots suspects)
const ERR_CONF  = 'ga4_config_absent';
const ERR_AUTH  = 'ga4_auth_issue';
const ERR_API   = 'ga4_upstream_err';
const ERR_PARSE = 'ga4_parse_issue';

// ── Middleware JWT Blink ───────────────────────────────────────────────────────

router.use('/api/ga4/*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Non autorisé — JWT Blink requis.', code: 'UNAUTHORIZED' }, 401);
  }
  const blink = createClient({
    projectId: c.env.BLINK_PROJECT_ID || 'presence-manager-saas-gbrhsehk',
    secretKey:  c.env.BLINK_SECRET_KEY,
  });
  try {
    const token = authHeader.replace('Bearer ', '').trim();
    const auth  = await blink.auth.verifyToken(token);
    if (!auth?.valid) {
      return c.json({ error: 'Token invalide ou expiré.', code: 'UNAUTHORIZED' }, 401);
    }
  } catch {
    return c.json({ error: 'Échec de la vérification du token Blink.', code: 'UNAUTHORIZED' }, 401);
  }
  await next();
});

// ── GET /api/ga4/campaign-conversions ─────────────────────────────────────────

/**
 * Retourne les métriques GA4 filtrées sur le trafic Meta (facebook/cpc, etc.)
 * pour une plage de dates donnée.
 *
 * Query params :
 *   startDate  — YYYY-MM-DD (défaut : J-30)
 *   endDate    — YYYY-MM-DD (défaut : aujourd'hui)
 *
 * Réponse 200 (GA4Summary) :
 * {
 *   "totalSessions"     : 1240,
 *   "avgEngagementRate" : 68.4,      // en %
 *   "totalConversions"  : 38,
 *   "totalRevenue"      : 4820.50,
 *   "topSource"         : "facebook / cpc",
 *   "dailyBreakdown"    : [
 *     { "date": "2026-06-01", "source": "facebook / cpc",
 *       "sessions": 42, "engagementRate": 0.71,
 *       "eventCount": 128, "conversions": 3, "revenue": 320.00 }
 *   ],
 *   "dateRange"  : { "startDate": "2026-06-01", "endDate": "2026-06-30" },
 *   "propertyId" : "541635576",
 *   "fetchedAt"  : "2026-06-19T15:00:00.000Z"
 * }
 */
router.get('/api/ga4/campaign-conversions', async (c) => {
  // ── Récupération des secrets GA4 ──────────────────────────────────────────
  const raw = c.env as unknown as Record<string, string | undefined>;
  const propertyId  = raw.GA4_PROPERTY_ID  ?? '';
  const clientEmail = raw.GA4_CLIENT_EMAIL ?? '';
  const privateKey  = raw.GA4_PRIVATE_KEY  ?? '';

  if (!propertyId || !clientEmail || !privateKey) {
    return c.json({
      error: 'Secrets GA4 manquants. Configurez GA4_PROPERTY_ID, GA4_CLIENT_EMAIL et GA4_PRIVATE_KEY dans les secrets du projet.',
      code: ERR_CONF,
      missing: [
        !propertyId  && 'GA4_PROPERTY_ID',
        !clientEmail && 'GA4_CLIENT_EMAIL',
        !privateKey  && 'GA4_PRIVATE_KEY',
      ].filter(Boolean),
    }, 503);
  }

  // ── Parse des dates ────────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const rawStart = c.req.query('startDate');
  const rawEnd   = c.req.query('endDate');

  // Défaut : 30 derniers jours
  const startDate = rawStart || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const endDate   = rawEnd   || today;

  // Validation format YYYY-MM-DD
  const dateRx = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRx.test(startDate) || !dateRx.test(endDate)) {
    return c.json({ error: 'Format de date invalide. Utilisez YYYY-MM-DD.', code: 'INVALID_DATE' }, 400);
  }
  if (startDate > endDate) {
    return c.json({ error: 'startDate doit être antérieur ou égal à endDate.', code: 'INVALID_RANGE' }, 400);
  }

  // ── Appel au service analyticsService ─────────────────────────────────────
  console.log(`[ga4Analytics] GET campaign-conversions — ${startDate} → ${endDate}`);

  try {
    const summary = await getCampaignConversions(startDate, endDate, { propertyId, clientEmail, privateKey });
    return c.json(summary, 200);

  } catch (err) {
    const e = err as Error & { code?: string };
    const msg = e.message;
    console.error('[ga4Analytics] getCampaignConversions error:', msg);

    // Mappe les codes d'erreur du service vers les codes HTTP
    if (e.code === GA4_ERR_CONF) {
      return c.json({ error: msg, code: ERR_CONF  }, 503);
    }
    if (e.code === GA4_ERR_AUTH) {
      return c.json({
        error: `Authentification GA4 échouée : ${msg}. Vérifiez que GA4_CLIENT_EMAIL et GA4_PRIVATE_KEY correspondent à un compte de service valide avec accès en lecture à la propriété ${propertyId}.`,
        code: ERR_AUTH,
        hint: 'Le compte de service doit avoir le rôle "Lecteur" sur la propriété GA4 dans la console Google Analytics.',
      }, 401);
    }
    if (e.code === GA4_ERR_PARSE) {
      return c.json({ error: msg, code: ERR_PARSE }, 502);
    }
    return c.json({ error: msg, code: ERR_API }, 502);
  }
});

// ── GET /api/ga4/health ───────────────────────────────────────────────────────

/**
 * Vérifie la présence des 3 secrets GA4 sans consommer de quota API.
 */
router.get('/api/ga4/health', async (c) => {
  const raw = c.env as unknown as Record<string, string | undefined>;
  return c.json({
    propertyId:  { configured: !!(raw.GA4_PROPERTY_ID?.trim()),  value: raw.GA4_PROPERTY_ID ? `${raw.GA4_PROPERTY_ID.slice(0, 4)}…` : null },
    clientEmail: { configured: !!(raw.GA4_CLIENT_EMAIL?.trim()), value: raw.GA4_CLIENT_EMAIL ? raw.GA4_CLIENT_EMAIL.split('@')[0] + '@…' : null },
    privateKey:  { configured: !!(raw.GA4_PRIVATE_KEY?.length > 20) },
    checkedAt:   new Date().toISOString(),
  });
});
