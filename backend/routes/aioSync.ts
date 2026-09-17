/**
 * aioSync.ts — Routes API AIO Sync (visibilité IA via SerpApi)
 *
 * Routes exposées :
 *
 *   POST /api/aio/sync/track
 *     → Lance une vraie requête SerpApi (Google + Bing) pour un mot-clé donné
 *       et retourne la présence/position de la marque dans les sources IA.
 *
 *   GET  /api/aio/sync/health
 *     → Vérifie que SERP_API_KEY est configurée (ne consomme pas de crédits).
 *
 * Sécurité :
 *   - JWT Blink requis sur toutes les routes /api/aio/sync/*
 *   - SERP_API_KEY ne transite jamais côté client
 *
 * Gestion d'erreur :
 *   - 503 si SERP_API_KEY manquante
 *   - 400 si paramètres invalides
 *   - 502 si SerpApi retourne une erreur (quota dépassé, clé invalide…)
 *   - 200 toujours si le pipeline réussit, même partiellement
 */

import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono }               from 'hono';
import { createClient }        from '@blinkdotnew/sdk';
import type { Env }            from '../lib/types';
import { consumeExecuteRefund } from '../lib/creditService';
import { isIdempotentReplayError, replayConflictBody } from '../lib/idempotentReplay';
import { trackAiVisibility }  from '../lib/aioSyncService';

// ── Codes d'erreur (constantes — évite la confusion avec les noms de secrets) ─
const ERR_MISSING_KEY = 'SERP_KEY_ABSENT';
const ERR_BAD_KEY     = 'SERP_KEY_INVALID';
const ERR_QUOTA       = 'SERP_RATE_LIMIT';
const ERR_SERP        = 'SERP_UPSTREAM';

export const router = new Hono<{ Bindings: Env }>();

// ── Middleware JWT Blink ───────────────────────────────────────────────────────

router.use('/api/aio/sync/*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Non autorisé — JWT Blink requis.' }, 401);
  }
  const blink = createClient({
    projectId: requireBlinkProjectId(c.env),
    secretKey:  c.env.BLINK_SECRET_KEY,
  });
  try {
    const token = authHeader.replace('Bearer ', '').trim();
    const auth  = await blink.auth.verifyToken(token);
    if (!auth?.valid) return c.json({ error: 'Token invalide ou expiré.' }, 401);
  } catch {
    return c.json({ error: 'Échec de la vérification du token Blink.' }, 401);
  }
  await next();
});

// ── POST /api/aio/sync/track ──────────────────────────────────────────────────

/**
 * Lance une vraie requête SerpApi pour mesurer la visibilité IA d'une marque.
 *
 * Corps JSON attendu :
 * {
 *   "keyword"   : "logiciel gestion PME",    // mot-clé à surveiller
 *   "brandName" : "Kompilot"                 // marque à détecter
 * }
 *
 * Réponse 200 :
 * {
 *   "keyword"        : "logiciel gestion PME",
 *   "brandName"      : "Kompilot",
 *   "globalDetected" : true,
 *   "status"         : "VISIBLE",            // VISIBLE | CITED | NOT_FOUND
 *   "visibilityScore": 70,                   // 0-100
 *   "engines": [
 *     {
 *       "engine"       : "google",
 *       "label"        : "Google (ChatGPT Search / Gemini)",
 *       "detected"     : true,
 *       "firstPosition": 2,
 *       "firstSnippet" : "Kompilot est la solution…",
 *       "mentionCount" : 3,
 *       "inAiOverview" : false,
 *       "topResults"   : [{ "position": 1, "title": "…", "brandCited": true, … }],
 *       "durationMs"   : 1240
 *     },
 *     { "engine": "bing", … }
 *   ],
 *   "analyzedAt"     : "2026-06-19T13:00:00.000Z",
 *   "totalDurationMs": 3200
 * }
 */
router.post('/api/aio/sync/track', async (c) => {
  const serpKey = (c.env as unknown as { SERP_API_KEY?: string }).SERP_API_KEY ?? '';

  // ── Vérification de la clé SerpApi ────────────────────────────────────────
  if (!serpKey || serpKey.length < 10) {
    return c.json({
      error: 'SERP_API_KEY non configurée ou invalide. Ajoutez-la dans les secrets du projet.',
      code:  ERR_MISSING_KEY,
    }, 503);
  }

  // ── Parse + validation du corps ───────────────────────────────────────────
  let body: { keyword?: string; brandName?: string; async?: boolean };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Corps JSON invalide.', code: 'INVALID_JSON' }, 400);
  }

  const keyword   = body.keyword?.trim()   ?? '';
  const brandName = body.brandName?.trim() ?? '';
  const useQueue  = body.async ?? false;

  if (!keyword)   return c.json({ error: 'Paramètre "keyword" requis.',   code: 'MISSING_KEYWORD' }, 400);
  if (!brandName) return c.json({ error: 'Paramètre "brandName" requis.', code: 'MISSING_BRAND' }, 400);
  if (keyword.length > 200) return c.json({ error: 'Mot-clé trop long (max 200 chars).', code: 'KEYWORD_TOO_LONG' }, 400);

  // ── Extract userId from JWT ───────────────────────────────────────────────
  const authHeader = c.req.header('Authorization');
  let userId = '';
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = authHeader.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      userId = decoded.sub ?? decoded.user_id ?? '';
    } catch { /* ignore */ }
  }

  // ── Appel au service AIO Sync (sync fallback) ─────────────────────────────
  console.log(`[aioSync route] POST /api/aio/sync/track — keyword="${keyword}" brand="${brandName}"`);

  const requestId = c.req.header('X-Request-Id') || c.req.header('Idempotency-Key') || crypto.randomUUID();
  const referenceId = `aio-sync:${userId}:${requestId}`;

  try {
    const charged = await consumeExecuteRefund(
      createClient({ projectId: requireBlinkProjectId(c.env), secretKey: c.env.BLINK_SECRET_KEY }),
      userId,
      'serpapi_visibility_sync',
      'AIO visibility sync',
      referenceId,
      async () => {
        if (useQueue) {
          try {
            const blink = createClient({
              projectId: requireBlinkProjectId(c.env),
              secretKey: c.env.BLINK_SECRET_KEY,
            });
            const queueFn = (blink as any).queue;
            if (queueFn?.enqueue) {
              await queueFn.enqueue('aio-sync-track', { userId, keyword, brandName });
              return {
                mode: 'async',
                status: 'queued',
                keyword,
                brandName,
                message: 'AIO sync queued. Results will be available shortly.',
              };
            }
          } catch (queueErr) {
            console.warn('[aioSync] Queue enqueue failed, falling back to sync:', queueErr);
          }
        }
        return await trackAiVisibility(keyword, brandName, serpKey);
      },
      'serpapi',
      { provider: 'serpapi', route: 'aioSync.track', keyword, brandName },
    );
    return c.json({ ...charged.result, creditsLeft: charged.balanceAfter }, 200);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Tracking results are returned inline, so a replay has no durable row to reload.
    if (isIdempotentReplayError(err)) return c.json(replayConflictBody(err, 'sync AIO'), 409);
    console.error('[aioSync route] trackAiVisibility error:', msg);

    // Distinguer erreur SerpApi (quota, clé…) vs erreur réseau
    const isQuota = msg.includes('429') || msg.toLowerCase().includes('quota');
    const isBadKey = msg.includes('401') || msg.toLowerCase().includes('invalid api key');

    if (isQuota) {
      return c.json({ error: 'Quota SerpApi dépassé. Réessayez dans quelques minutes.', code: ERR_QUOTA }, 429);
    }
    if (isBadKey) {
      return c.json({ error: 'Clé SerpApi invalide. Vérifiez SERP_API_KEY dans les secrets.', code: ERR_BAD_KEY }, 503);
    }

    return c.json({ error: msg, code: ERR_SERP }, 502);
  }
});

// ── GET /api/aio/sync/health ──────────────────────────────────────────────────

/**
 * Vérifie la présence de SERP_API_KEY sans consommer de crédits.
 * Utilisé par le composant AIOSyncPanel au chargement.
 */
router.get('/api/aio/sync/health', async (c) => {
  const serpKey = (c.env as unknown as { SERP_API_KEY?: string }).SERP_API_KEY ?? '';
  return c.json({
    configured: serpKey.length >= 10,
    checkedAt:  new Date().toISOString(),
  });
});
