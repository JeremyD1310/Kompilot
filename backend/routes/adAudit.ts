/**
 * adAudit.ts — Ad Performance Audit Route
 *
 * Routes :
 *   POST /api/ad-audit/generate
 *     → Fetches GA4 CPC data, merges with user-provided ad spend / ROAS targets,
 *       and returns a structured 5-section audit analysis.
 *
 *   GET  /api/ad-audit/cpc-data?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 *     → Raw GA4 CPC analytics (useful for the frontend to display before generating the audit)
 *
 * Auth: JWT Blink required on all routes.
 */

import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono }           from 'hono';
import { createClient }   from '@blinkdotnew/sdk';
import type { Env }       from '../lib/types';
import { getCpcAnalytics } from '../lib/ga4CpcService';
import {
  GA4_ERR_AUTH, GA4_ERR_CONF, GA4_ERR_API,
} from '../lib/ga4ErrorCodes';

export const router = new Hono<{ Bindings: Env }>();

// ── Error codes ────────────────────────────────────────────────────────────────
const ERR_CONF  = 'ga4_config_absent';
const ERR_AUTH  = 'ga4_auth_issue';
const ERR_API   = 'ga4_upstream_err';

// ── Server-side error logging helper ───────────────────────────────────────────
/** Logs errors to observability_logs for debugging (fire-and-forget) */
async function logAuditError(
  env: Record<string, string | undefined>,
  opts: {
    action: string;
    errorMessage: string;
    errorCode: string;
    sector?: string;
    channels?: string;
    metadata?: Record<string, unknown>;
  }
) {
  try {
    const blink = createClient({
      projectId: requireBlinkProjectId(env),
      secretKey:  env.BLINK_SECRET_KEY,
    });
    await blink.db.table<{ id: string }>('observability_logs').create({
      action: opts.action,
      error_message: opts.errorMessage.slice(0, 1000),
      error_code: opts.errorCode,
      provider: 'ad_audit',
      metadata: JSON.stringify({
        sector: opts.sector || '',
        channels: opts.channels || '',
        ...opts.metadata,
      }),
      severity: 'error',
    });
  } catch {
    // swallow — logging should never break the request
  }
}

// ── JWT Middleware ──────────────────────────────────────────────────────────────

router.use('/api/ad-audit/*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Non autorisé — JWT Blink requis.', code: 'UNAUTHORIZED' }, 401);
  }
  const blink = createClient({
    projectId: requireBlinkProjectId(c.env),
    secretKey:  c.env.BLINK_SECRET_KEY,
  });
  try {
    const token = authHeader.replace('Bearer ', '').trim();
    const auth  = await blink.auth.verifyToken(token);
    if (!auth?.valid) {
      return c.json({ error: 'Token invalide ou expiré.', code: 'UNAUTHORIZED' }, 401);
    }
  } catch {
    return c.json({ error: 'Échec vérification token Blink.', code: 'UNAUTHORIZED' }, 401);
  }
  await next();
});

// ── GET /api/ad-audit/cpc-data ─────────────────────────────────────────────────

router.get('/api/ad-audit/cpc-data', async (c) => {
  const raw = c.env as unknown as Record<string, string | undefined>;
  const propertyId  = raw.GA4_PROPERTY_ID  ?? '';
  const clientEmail = raw.GA4_CLIENT_EMAIL ?? '';
  const privateKey  = raw.GA4_PRIVATE_KEY  ?? '';

  if (!propertyId || !clientEmail || !privateKey) {
    return c.json({
      error: 'Secrets GA4 manquants. Configurez GA4_PROPERTY_ID, GA4_CLIENT_EMAIL et GA4_PRIVATE_KEY.',
      code: ERR_CONF,
      missing: [
        !propertyId  && 'GA4_PROPERTY_ID',
        !clientEmail && 'GA4_CLIENT_EMAIL',
        !privateKey  && 'GA4_PRIVATE_KEY',
      ].filter(Boolean),
    }, 503);
  }

  const today     = new Date().toISOString().slice(0, 10);
  const startDate = c.req.query('startDate') || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const endDate   = c.req.query('endDate')   || today;

  const dateRx = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRx.test(startDate) || !dateRx.test(endDate)) {
    return c.json({ error: 'Format de date invalide. Utilisez YYYY-MM-DD.', code: 'INVALID_DATE' }, 400);
  }

  try {
    const data = await getCpcAnalytics(startDate, endDate, { propertyId, clientEmail, privateKey });
    return c.json(data, 200);
  } catch (err) {
    const e = err as Error & { code?: string };
    console.error('[adAudit] getCpcAnalytics error:', e.message);

    // Log to observability_logs for debugging
    await logAuditError(c.env as unknown as Record<string, string | undefined>, {
      action: 'ad_audit_cpc_data_error',
      errorMessage: e.message,
      errorCode: e.code ?? ERR_API,
      metadata: { startDate, endDate, propertyId: propertyId ? `${propertyId.slice(0, 4)}…` : '' },
    });

    if (e.code === GA4_ERR_CONF) return c.json({ error: e.message, code: ERR_CONF }, 503);
    if (e.code === GA4_ERR_AUTH) return c.json({ error: e.message, code: ERR_AUTH, hint: 'Vérifiez les credentials du compte de service GA4.' }, 401);
    return c.json({ error: e.message, code: ERR_API }, 502);
  }
});

// ── POST /api/ad-audit/generate ────────────────────────────────────────────────

interface AuditRequest {
  sector: string;              // e.g. "E-commerce Mode"
  adChannels: string;          // e.g. "Meta Ads, Google Ads"
  adSpend: number;             // monthly budget in EUR
  targetRoas: number;          // break-even ROAS
  displayedRoas?: string;      // e.g. "Meta 2.8 / Google 4.1"
  cpcTrend?: string;           // e.g. "+15% hausse" or "Stable"
  churnRate?: string;          // e.g. "5%"
  ltv?: string;                // e.g. "120€"
  startDate?: string;
  endDate?: string;
}

router.post('/api/ad-audit/generate', async (c) => {
  let body: AuditRequest;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'JSON invalide.' }, 400);
  }

  const { sector, adChannels, adSpend, targetRoas, displayedRoas, cpcTrend, churnRate, ltv } = body;

  if (!sector || !adChannels || !adSpend || !targetRoas) {
    const missing = [
      !sector && 'sector',
      !adChannels && 'adChannels',
      !adSpend && 'adSpend',
      !targetRoas && 'targetRoas',
    ].filter(Boolean).join(', ');

    // Log validation error to observability_logs
    await logAuditError(c.env as unknown as Record<string, string | undefined>, {
      action: 'ad_audit_validation_error',
      errorMessage: `Champs requis manquants : ${missing}`,
      errorCode: 'VALIDATION_ERROR',
      sector,
      channels: adChannels,
      metadata: { adSpend, targetRoas },
    });

    return c.json({
      error: 'Champs requis manquants : sector, adChannels, adSpend, targetRoas',
      code: 'VALIDATION_ERROR',
    }, 400);
  }

  // ── Fetch GA4 data ───────────────────────────────────────────────────────────
  const raw = c.env as unknown as Record<string, string | undefined>;
  const propertyId  = raw.GA4_PROPERTY_ID  ?? '';
  const clientEmail = raw.GA4_CLIENT_EMAIL ?? '';
  const privateKey  = raw.GA4_PRIVATE_KEY  ?? '';

  if (!propertyId || !clientEmail || !privateKey) {
    return c.json({
      error: 'Secrets GA4 manquants. Impossible de récupérer les données analytiques.',
      code: ERR_CONF,
    }, 503);
  }

  const today     = new Date().toISOString().slice(0, 10);
  const startDate = body.startDate || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const endDate   = body.endDate   || today;

  let ga4Data;
  try {
    ga4Data = await getCpcAnalytics(startDate, endDate, { propertyId, clientEmail, privateKey });
  } catch (err) {
    const e = err as Error & { code?: string };
    console.error('[adAudit] generate — GA4 fetch error:', e.message);

    // Log to observability_logs with sector + channels for granular debugging
    await logAuditError(c.env as unknown as Record<string, string | undefined>, {
      action: 'ad_audit_generate_error',
      errorMessage: e.message,
      errorCode: e.code ?? ERR_API,
      sector,
      channels: adChannels,
      metadata: { startDate, endDate, adSpend, targetRoas },
    });

    return c.json({ error: `Erreur GA4 : ${e.message}`, code: e.code ?? ERR_API }, 502);
  }

  // ── Compute derived metrics ──────────────────────────────────────────────────
  const realRoas = adSpend > 0 ? (ga4Data.cpcRevenue / adSpend) : 0;
  const mer      = adSpend > 0 ? (ga4Data.totalSiteRevenue / adSpend) : 0;
  const convRate = ga4Data.cpcSessions > 0 ? (ga4Data.cpcConversions / ga4Data.cpcSessions * 100) : 0;
  const cpa      = ga4Data.cpcConversions > 0 ? (adSpend / ga4Data.cpcConversions) : 0;

  // ── Build the structured audit response ──────────────────────────────────────
  const audit = {
    inputs: {
      sector, adChannels, adSpend, targetRoas,
      displayedRoas: displayedRoas ?? 'Non fourni',
      cpcTrend:      cpcTrend      ?? 'Non fourni',
      churnRate:     churnRate     ?? 'Non fourni',
      ltv:           ltv           ?? 'Non fourni',
    },
    ga4: {
      cpcSessions:          ga4Data.cpcSessions,
      cpcEngagementRate:    ga4Data.cpcEngagementRate,
      cpcConversions:       ga4Data.cpcConversions,
      cpcRevenue:           ga4Data.cpcRevenue,
      totalSiteRevenue:     ga4Data.totalSiteRevenue,
      totalSiteSessions:    ga4Data.totalSiteSessions,
      sources:              ga4Data.sources,
      dateRange:            ga4Data.dateRange,
    },
    computed: {
      realRoas:      Math.round(realRoas * 100) / 100,
      mer:           Math.round(mer * 100) / 100,
      conversionRate: Math.round(convRate * 100) / 100,
      cpa:           Math.round(cpa * 100) / 100,
    },
    generatedAt: new Date().toISOString(),
  };

  return c.json(audit, 200);
});

export default router;
