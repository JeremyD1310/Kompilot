/**
 * metaMarketing.ts — Routes API Marketing Meta pour Kompilot
 *
 * Routes :
 *   GET  /api/meta/check          — valide le token et retourne le statut
 *   GET  /api/meta/ad-accounts    — liste les comptes publicitaires
 *   GET  /api/meta/campaigns      — campagnes d'un compte (?accountId=act_XXX)
 *   GET  /api/meta/insights       — métriques (?objectId=XXX&datePreset=last_30d)
 *
 * Sécurité : les tokens Meta ne transitent jamais côté client.
 * Toutes les routes requièrent un JWT Blink valide.
 */

import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import {
  checkMetaConnection,
  getAdAccounts,
  getCampaigns,
  getAdInsights,
  MetaApiError,
} from '../lib/metaMarketingService';

interface Env {
  BLINK_SECRET_KEY: string;
  META_APP_ID: string;
  META_APP_SECRET: string;
  META_SYSTEM_USER_TOKEN: string;
}

export const router = new Hono<{ Bindings: Env }>();

// ── Middleware JWT Blink ───────────────────────────────────────────────────────

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
    if (!user) return c.json({ error: 'Token invalide ou expiré.' }, 401);
  } catch {
    return c.json({ error: 'Échec de la vérification du token Blink.' }, 401);
  }

  await next();
});

// ── GET /api/meta/check ───────────────────────────────────────────────────────

router.get('/api/meta/check', async (c) => {
  const token = c.env.META_SYSTEM_USER_TOKEN ?? '';
  if (!token) {
    return c.json({
      connected: false,
      error: 'META_SYSTEM_USER_TOKEN non configuré dans les secrets Cloudflare Workers.',
      checkedAt: new Date().toISOString(),
    }, 503);
  }
  try {
    const status = await checkMetaConnection(token);
    return c.json(status, status.connected ? 200 : 400);
  } catch (err) {
    const msg = err instanceof MetaApiError ? err.message : String(err);
    console.error('[/api/meta/check]', msg);
    return c.json({ connected: false, error: msg, checkedAt: new Date().toISOString() }, 500);
  }
});

// ── GET /api/meta/ad-accounts ─────────────────────────────────────────────────

router.get('/api/meta/ad-accounts', async (c) => {
  const token = c.env.META_SYSTEM_USER_TOKEN ?? '';
  if (!token) return c.json({ error: 'META_SYSTEM_USER_TOKEN non configuré.' }, 503);
  try {
    const accounts = await getAdAccounts(token);
    return c.json({ data: accounts, count: accounts.length });
  } catch (err) {
    if (err instanceof MetaApiError) return c.json({ error: err.message, code: err.code }, err.isTokenInvalid ? 401 : 400);
    return c.json({ error: String(err) }, 500);
  }
});

// ── GET /api/meta/campaigns ───────────────────────────────────────────────────

router.get('/api/meta/campaigns', async (c) => {
  const token = c.env.META_SYSTEM_USER_TOKEN ?? '';
  const accountId = c.req.query('accountId');
  const status = (c.req.query('status') ?? 'ALL') as 'ACTIVE' | 'PAUSED' | 'ALL';

  if (!token) return c.json({ error: 'META_SYSTEM_USER_TOKEN non configuré.' }, 503);
  if (!accountId) return c.json({ error: 'Paramètre accountId requis (ex: act_123456789).' }, 400);
  if (!accountId.startsWith('act_')) return c.json({ error: 'accountId doit être au format "act_XXXXXXXXXX".' }, 400);

  try {
    const campaigns = await getCampaigns(token, accountId, status);
    return c.json({ data: campaigns, count: campaigns.length, accountId });
  } catch (err) {
    if (err instanceof MetaApiError) return c.json({ error: err.message, code: err.code }, err.isTokenInvalid ? 401 : 400);
    return c.json({ error: String(err) }, 500);
  }
});

// ── GET /api/meta/insights ────────────────────────────────────────────────────

router.get('/api/meta/insights', async (c) => {
  const token = c.env.META_SYSTEM_USER_TOKEN ?? '';
  const objectId = c.req.query('objectId');
  const datePreset = (c.req.query('datePreset') ?? 'last_30d') as 'last_7d' | 'last_30d' | 'last_90d' | 'this_month';

  if (!token) return c.json({ error: 'META_SYSTEM_USER_TOKEN non configuré.' }, 503);
  if (!objectId) return c.json({ error: 'Paramètre objectId requis.' }, 400);

  const allowedPresets = ['last_7d', 'last_30d', 'last_90d', 'this_month'];
  if (!allowedPresets.includes(datePreset)) {
    return c.json({ error: `datePreset invalide. Valeurs acceptées : ${allowedPresets.join(', ')}.` }, 400);
  }

  try {
    const insights = await getAdInsights(token, objectId, datePreset);
    return c.json({ data: insights, count: insights.length, objectId, datePreset });
  } catch (err) {
    if (err instanceof MetaApiError) return c.json({ error: err.message, code: err.code }, err.isTokenInvalid ? 401 : 400);
    return c.json({ error: String(err) }, 500);
  }
});
