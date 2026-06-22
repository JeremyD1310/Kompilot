/**
 * Data Export & Agency Aggregation routes
 *
 * Endpoints:
 *   GET  /api/agency/aggregate          — agrégation consommation pour tous les sous-comptes
 *   GET  /api/agency/export/json        — export JSON propre pour PDF/CSV
 *   POST /api/analytics/initial-scan    — enregistre le premier Deep Scan
 *   POST /api/analytics/daily-snapshot  — snapshot quotidien des métriques
 *   POST /api/legal/signature           — log clickwrap immutable
 *   GET  /api/legal/signature/:userId   — vérifie la signature d'un utilisateur
 */
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

const getBlink = (env: Env) =>
  createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });

// ── Auth helper ───────────────────────────────────────────────────────────────
async function requireAuth(c: any, blink: ReturnType<typeof getBlink>): Promise<string | null> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.slice(7);
    const user = await blink.auth.verifyToken(token);
    return user?.id ?? null;
  } catch {
    return null;
  }
}

// ── POST /api/analytics/initial-scan ─────────────────────────────────────────
// Enregistre le premier Deep Scan d'un établissement (immuable — ignoré si déjà existant)
router.post('/api/analytics/initial-scan', async (c) => {
  const blink = getBlink(c.env);
  const userId = await requireAuth(c, blink);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json<{
    establishment_id: string;
    geo_score: number;
    unhandled_reviews: number;
    missing_keywords: string[];
    raw_scan_data?: Record<string, unknown>;
  }>();

  if (!body.establishment_id) return c.json({ error: 'establishment_id required' }, 400);

  // Vérifier si un scan initial existe déjà (immuabilité)
  const existing = await blink.db.initialScans.list({
    where: { establishmentId: body.establishment_id },
    limit: 1,
  });

  if (existing.length > 0) {
    return c.json({ already_exists: true, scan: existing[0] }, 200);
  }

  const scan = await blink.db.initialScans.create({
    id: crypto.randomUUID(),
    establishmentId: body.establishment_id,
    userId,
    geoScore: body.geo_score ?? 0,
    unhandledReviews: body.unhandled_reviews ?? 0,
    missingKeywords: JSON.stringify(body.missing_keywords ?? []),
    rawScanData: JSON.stringify(body.raw_scan_data ?? {}),
    scannedAt: new Date().toISOString(),
  });

  return c.json({ success: true, scan }, 201);
});

// ── POST /api/analytics/daily-snapshot ───────────────────────────────────────
// Upsert du snapshot quotidien (une ligne par établissement par jour)
router.post('/api/analytics/daily-snapshot', async (c) => {
  const blink = getBlink(c.env);
  const userId = await requireAuth(c, blink);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json<{
    establishment_id: string;
    snapshot_date?: string; // YYYY-MM-DD, default today
    geo_score?: number;
    unhandled_reviews?: number;
    posts_published?: number;
    reviews_handled?: number;
    sms_sent?: number;
    local_visibility?: number;
    missing_keywords?: string[];
    noshow_revenue_cents?: number;
    extended_data?: Record<string, unknown>;
  }>();

  if (!body.establishment_id) return c.json({ error: 'establishment_id required' }, 400);

  const snapshotDate = body.snapshot_date ?? new Date().toISOString().slice(0, 10);

  // Upsert via create (le UNIQUE constraint sur establishment_id + snapshot_date
  // est géré côté DB — on tente un update si le create échoue)
  const existing = await blink.db.dailyAnalytics.list({
    where: { establishmentId: body.establishment_id, snapshotDate },
    limit: 1,
  });

  const payload = {
    establishmentId: body.establishment_id,
    userId,
    snapshotDate,
    geoScore: body.geo_score ?? 0,
    unhandledReviews: body.unhandled_reviews ?? 0,
    postsPublished: body.posts_published ?? 0,
    reviewsHandled: body.reviews_handled ?? 0,
    smsSent: body.sms_sent ?? 0,
    localVisibility: body.local_visibility ?? 0,
    missingKeywords: JSON.stringify(body.missing_keywords ?? []),
    noshowRevenueCents: body.noshow_revenue_cents ?? 0,
    extendedData: JSON.stringify(body.extended_data ?? {}),
  };

  let record;
  if (existing.length > 0) {
    record = await blink.db.dailyAnalytics.update(existing[0].id as string, payload);
  } else {
    record = await blink.db.dailyAnalytics.create({ id: crypto.randomUUID(), ...payload });
  }

  return c.json({ success: true, record }, 200);
});

// ── POST /api/legal/signature ─────────────────────────────────────────────────
// Log immuable du consentement clickwrap
router.post('/api/legal/signature', async (c) => {
  const blink = getBlink(c.env);
  const userId = await requireAuth(c, blink);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json<{
    cgv_version_accepted: string;
    plan_id?: string;
    checkout_type?: string;
    signature_metadata?: Record<string, unknown>;
  }>();

  if (!body.cgv_version_accepted) {
    return c.json({ error: 'cgv_version_accepted required' }, 400);
  }

  // Extraire IP réelle (CF-Connecting-IP > X-Forwarded-For > fallback)
  const ipAddress =
    c.req.header('CF-Connecting-IP') ??
    c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ??
    '0.0.0.0';

  const userAgent = c.req.header('User-Agent') ?? '';
  const signedAt = new Date().toISOString();

  const signature = await blink.db.legalSignatures.create({
    id: crypto.randomUUID(),
    userId,
    ipAddress,
    signedAt,
    cgvVersionAccepted: body.cgv_version_accepted,
    retractionWaiver: 1,
    planId: body.plan_id ?? null,
    checkoutType: body.checkout_type ?? 'paywall',
    userAgent,
    signatureMetadata: JSON.stringify(body.signature_metadata ?? {}),
  });

  return c.json({ success: true, signature_id: signature.id, signed_at: signedAt }, 201);
});

// ── GET /api/legal/signature/:userId ─────────────────────────────────────────
// Vérifie qu'un utilisateur a signé les CGV (pour audit)
router.get('/api/legal/signature/:userId', async (c) => {
  const blink = getBlink(c.env);
  const requesterId = await requireAuth(c, blink);
  if (!requesterId) return c.json({ error: 'Unauthorized' }, 401);

  const targetUserId = c.req.param('userId');

  const signatures = await blink.db.legalSignatures.list({
    where: { userId: targetUserId },
    orderBy: { signedAt: 'desc' },
    limit: 10,
  });

  return c.json({
    user_id: targetUserId,
    has_signed: signatures.length > 0,
    latest_signature: signatures[0] ?? null,
    total_signatures: signatures.length,
  });
});

// ── GET /api/agency/aggregate ─────────────────────────────────────────────────
// Agrégation des métriques de consommation pour tous les sous-comptes d'une agence
router.get('/api/agency/aggregate', async (c) => {
  const blink = getBlink(c.env);
  const agencyUserId = await requireAuth(c, blink);
  if (!agencyUserId) return c.json({ error: 'Unauthorized' }, 401);

  const since = c.req.query('since') ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const until = c.req.query('until') ?? new Date().toISOString().slice(0, 10);

  // Récupérer tous les sous-comptes actifs de l'agence
  const subAccounts = await blink.db.agencySubAccounts.list({
    where: { agencyUserId, isActive: '1' },
  });

  if (subAccounts.length === 0) {
    return c.json({ agency_user_id: agencyUserId, sub_accounts: [], totals: buildEmptyTotals(), period: { since, until } });
  }

  const clientUserIds = subAccounts.map((sa: any) => sa.clientUserId as string);

  // Agréger les daily_analytics pour chaque client sur la période
  const aggregatedClients = await Promise.all(
    clientUserIds.map(async (clientUserId: string) => {
      const subAccount = subAccounts.find((sa: any) => sa.clientUserId === clientUserId);

      const dailyRows = await blink.db.dailyAnalytics.list({
        where: { userId: clientUserId },
        orderBy: { snapshotDate: 'desc' },
        limit: 90,
      });

      const filtered = dailyRows.filter((r: any) =>
        r.snapshotDate >= since && r.snapshotDate <= until
      );

      const totals = filtered.reduce(
        (acc: any, row: any) => ({
          sms_sent: acc.sms_sent + (Number(row.smsSent) || 0),
          reviews_handled: acc.reviews_handled + (Number(row.reviewsHandled) || 0),
          posts_published: acc.posts_published + (Number(row.postsPublished) || 0),
          noshow_revenue_cents: acc.noshow_revenue_cents + (Number(row.noshowRevenueCents) || 0),
        }),
        { sms_sent: 0, reviews_handled: 0, posts_published: 0, noshow_revenue_cents: 0 }
      );

      // Score GEO actuel (dernier snapshot)
      const latestGeoScore = dailyRows[0] ? Number(dailyRows[0].geoScore) : 0;

      // Score initial (initial_scan)
      const initialScan = await blink.db.initialScans.list({
        where: { userId: clientUserId },
        orderBy: { scannedAt: 'asc' },
        limit: 1,
      });
      const initialGeoScore = initialScan[0] ? Number((initialScan[0] as any).geoScore) : null;

      return {
        client_user_id: clientUserId,
        client_name: (subAccount as any)?.clientName ?? 'Client',
        plan_id: (subAccount as any)?.planId ?? null,
        geo_score_current: latestGeoScore,
        geo_score_initial: initialGeoScore,
        geo_score_delta: initialGeoScore !== null ? latestGeoScore - initialGeoScore : null,
        period_totals: totals,
        daily_count: filtered.length,
      };
    })
  );

  // Totaux globaux de l'agence
  const agencyTotals = aggregatedClients.reduce(
    (acc: any, client: any) => ({
      total_sms_sent: acc.total_sms_sent + client.period_totals.sms_sent,
      total_reviews_handled: acc.total_reviews_handled + client.period_totals.reviews_handled,
      total_posts_published: acc.total_posts_published + client.period_totals.posts_published,
      total_noshow_revenue_cents: acc.total_noshow_revenue_cents + client.period_totals.noshow_revenue_cents,
      clients_with_improvement: acc.clients_with_improvement + (client.geo_score_delta !== null && client.geo_score_delta > 0 ? 1 : 0),
    }),
    { total_sms_sent: 0, total_reviews_handled: 0, total_posts_published: 0, total_noshow_revenue_cents: 0, clients_with_improvement: 0 }
  );

  return c.json({
    agency_user_id: agencyUserId,
    period: { since, until },
    sub_accounts_count: subAccounts.length,
    sub_accounts: aggregatedClients,
    totals: agencyTotals,
  });
});

// ── GET /api/agency/export/json ───────────────────────────────────────────────
// Export JSON structuré pour génération PDF/CSV
router.get('/api/agency/export/json', async (c) => {
  const blink = getBlink(c.env);
  const agencyUserId = await requireAuth(c, blink);
  if (!agencyUserId) return c.json({ error: 'Unauthorized' }, 401);

  const since = c.req.query('since') ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const until = c.req.query('until') ?? new Date().toISOString().slice(0, 10);
  const format = c.req.query('format') ?? 'agency'; // 'agency' | 'pro'

  if (format === 'pro') {
    // Export Pro : données d'un seul compte commerçant
    const establishments = await blink.db.establishments.list({
      where: { userId: agencyUserId },
    });

    const reportData = await Promise.all(
      establishments.map(async (est: any) => {
        const initialScan = await blink.db.initialScans.list({
          where: { establishmentId: est.id },
          orderBy: { scannedAt: 'asc' },
          limit: 1,
        });

        const recentAnalytics = await blink.db.dailyAnalytics.list({
          where: { establishmentId: est.id },
          orderBy: { snapshotDate: 'desc' },
          limit: 30,
        });

        const filtered = recentAnalytics.filter((r: any) =>
          r.snapshotDate >= since && r.snapshotDate <= until
        );

        const totals = filtered.reduce(
          (acc: any, row: any) => ({
            sms_sent: acc.sms_sent + (Number(row.smsSent) || 0),
            reviews_handled: acc.reviews_handled + (Number(row.reviewsHandled) || 0),
            posts_published: acc.posts_published + (Number(row.postsPublished) || 0),
            noshow_revenue_eur: (acc.noshow_revenue_eur * 100 + (Number(row.noshowRevenueCents) || 0)) / 100,
          }),
          { sms_sent: 0, reviews_handled: 0, posts_published: 0, noshow_revenue_eur: 0 }
        );

        const initial = initialScan[0] as any;
        const latest = recentAnalytics[0] as any;

        return {
          establishment: {
            id: est.id,
            name: est.name,
            activity: est.activity,
            city: est.city,
            siret: est.siret ?? null,
          },
          before_after: {
            geo_score_initial: initial ? Number(initial.geoScore) : null,
            geo_score_current: latest ? Number(latest.geoScore) : null,
            unhandled_reviews_initial: initial ? Number(initial.unhandledReviews) : null,
            unhandled_reviews_current: latest ? Number(latest.unhandledReviews) : null,
            missing_keywords_initial: initial ? JSON.parse(initial.missingKeywords || '[]') : [],
            scan_date: initial ? initial.scannedAt : null,
          },
          period_performance: {
            since,
            until,
            ...totals,
            daily_snapshots: filtered.length,
          },
        };
      })
    );

    return c.json({
      report_type: 'pro',
      generated_at: new Date().toISOString(),
      user_id: agencyUserId,
      period: { since, until },
      establishments: reportData,
    });
  }

  // Export Agence : vue consolidée de tous les clients
  // Réutilise la logique d'agrégation via fetch interne
  const subAccounts = await blink.db.agencySubAccounts.list({
    where: { agencyUserId, isActive: '1' },
  });

  const clientReports = await Promise.all(
    (subAccounts as any[]).map(async (sa: any) => {
      const clientUserId = sa.clientUserId as string;
      const estList = await blink.db.establishments.list({ where: { userId: clientUserId } });

      const dailyRows = await blink.db.dailyAnalytics.list({
        where: { userId: clientUserId },
        orderBy: { snapshotDate: 'desc' },
        limit: 90,
      });

      const filtered = dailyRows.filter((r: any) =>
        r.snapshotDate >= since && r.snapshotDate <= until
      );

      const totals = filtered.reduce(
        (acc: any, row: any) => ({
          sms_sent: acc.sms_sent + (Number(row.smsSent) || 0),
          reviews_handled: acc.reviews_handled + (Number(row.reviewsHandled) || 0),
          posts_published: acc.posts_published + (Number(row.postsPublished) || 0),
          noshow_revenue_eur: acc.noshow_revenue_eur + (Number(row.noshowRevenueCents) || 0) / 100,
        }),
        { sms_sent: 0, reviews_handled: 0, posts_published: 0, noshow_revenue_eur: 0 }
      );

      const initialScans = await blink.db.initialScans.list({
        where: { userId: clientUserId },
        orderBy: { scannedAt: 'asc' },
        limit: 1,
      });

      const latestDaily = dailyRows[0] as any;
      const initialScan = initialScans[0] as any;

      return {
        client: {
          user_id: clientUserId,
          name: sa.clientName,
          plan_id: sa.planId ?? null,
          establishments_count: estList.length,
        },
        before_after: {
          geo_score_initial: initialScan ? Number(initialScan.geoScore) : null,
          geo_score_current: latestDaily ? Number(latestDaily.geoScore) : null,
          geo_delta: initialScan && latestDaily
            ? Number(latestDaily.geoScore) - Number(initialScan.geoScore)
            : null,
          scan_date: initialScan ? initialScan.scannedAt : null,
        },
        period_totals: { since, until, ...totals },
        legal_compliance: {
          // Le frontend vérifie /api/legal/signature/:userId pour chaque client
          signature_check_url: `/api/legal/signature/${clientUserId}`,
        },
      };
    })
  );

  // Totaux agence consolidés
  const consolidated = clientReports.reduce(
    (acc: any, r: any) => ({
      total_sms: acc.total_sms + r.period_totals.sms_sent,
      total_reviews: acc.total_reviews + r.period_totals.reviews_handled,
      total_posts: acc.total_posts + r.period_totals.posts_published,
      total_noshow_eur: Math.round((acc.total_noshow_eur + r.period_totals.noshow_revenue_eur) * 100) / 100,
    }),
    { total_sms: 0, total_reviews: 0, total_posts: 0, total_noshow_eur: 0 }
  );

  return c.json({
    report_type: 'agency',
    generated_at: new Date().toISOString(),
    agency_user_id: agencyUserId,
    period: { since, until },
    clients_count: subAccounts.length,
    consolidated_totals: consolidated,
    clients: clientReports,
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildEmptyTotals() {
  return {
    total_sms_sent: 0,
    total_reviews_handled: 0,
    total_posts_published: 0,
    total_noshow_revenue_cents: 0,
    clients_with_improvement: 0,
  };
}
