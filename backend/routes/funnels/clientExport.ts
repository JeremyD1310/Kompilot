/**
 * Funnels — Client Export (White-label Report)
 *
 *   POST /api/funnels/:id/export        — generate export (returns token + PDF-ready data)
 *   GET  /api/funnels/export/:token     — public endpoint, serves report data (no auth)
 */
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';

const app = new Hono<{ Bindings: { BLINK_SECRET_KEY: string } }>();

// ── POST /api/funnels/:id/export ──────────────────────────────────────────────
app.post('/:id/export', async (c) => {
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

    const funnelId = c.req.param('id');
    const body = await c.req.json() as {
      agencyName?: string;
      agencyLogoUrl?: string;
      title?: string;
      summaryData?: object;
    };

    // Fetch funnel data
    const funnels = await blink.db.funnels.list({
      where: { id: funnelId, userId: user.id },
      limit: 1,
    });
    if (!funnels || funnels.length === 0) {
      return c.json({ error: 'Funnel not found' }, 404);
    }
    const funnel = funnels[0];

    // Generate unique report token
    const reportToken = crypto.randomUUID().replace(/-/g, '');

    // Expiry: 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch cached analysis if available
    let cachedAnalysis: object = {};
    try {
      const cacheRows = await blink.db.funnelAnalysisCache.list({
        where: { domainUrl: (funnel.domainUrl as string).toLowerCase().replace(/\/$/, '') },
        orderBy: { createdAt: 'desc' },
        limit: 1,
      });
      if (cacheRows && cacheRows.length > 0) {
        cachedAnalysis = JSON.parse(cacheRows[0].analysisData as string);
      }
    } catch { /* ok */ }

    // Fetch ghost emails count
    let ghostEmailCount = 0;
    try {
      const ghosts = await blink.db.funnelGhostEmails.list({
        where: { funnelId, userId: user.id },
      });
      ghostEmailCount = ghosts.length;
    } catch { /* ok */ }

    const summaryData = {
      funnelId,
      creatorName: funnel.creatorName,
      domainUrl: funnel.domainUrl,
      platform: funnel.platform,
      estimatedSpend: funnel.estimatedSpend,
      performanceScore: funnel.performanceScore,
      ghostEmailCount,
      analysis: cachedAnalysis,
      generatedAt: new Date().toISOString(),
      ...(body.summaryData ?? {}),
    };

    const reportId = crypto.randomUUID().replace(/-/g, '');
    await blink.db.clientExportReports.create({
      id: reportId,
      userId: user.id,
      funnelId,
      reportToken,
      agencyName: body.agencyName ?? null,
      agencyLogoUrl: body.agencyLogoUrl ?? null,
      title: body.title ?? `Rapport Concurrentiel — ${funnel.creatorName}`,
      summaryData: JSON.stringify(summaryData),
      expiresAt,
      viewCount: 0,
      createdAt: new Date().toISOString(),
    });

    // Build public frontend URL (strip the backend path, point to the app)
    const backendOrigin = new URL(c.req.url).origin;
    // In production, the frontend is on the same domain or www. subdomain.
    // We use a dedicated env var or fall back to detecting from the referer/origin header.
    const referer = c.req.header('Referer') ?? c.req.header('Origin') ?? '';
    let frontendOrigin = '';
    try {
      frontendOrigin = referer ? new URL(referer).origin : backendOrigin.replace('gbrhsehk.backend.', '');
    } catch {
      frontendOrigin = backendOrigin;
    }
    const publicUrl = `${frontendOrigin}/tunnel-report/${reportToken}`;

    return c.json({
      success: true,
      reportToken,
      publicUrl,
      expiresAt,
      summaryData,
    });
  } catch (err) {
    console.error('[client-export POST]', err);
    return c.json({ error: 'Failed to generate export' }, 500);
  }
});

// ── GET /api/funnels/export/:token ────────────────────────────────────────────
// Public — no auth required (serves white-label report data)
app.get('/export/:token', async (c) => {
  try {
    const blink = createClient({
      projectId: 'presence-manager-saas-gbrhsehk',
      secretKey: c.env.BLINK_SECRET_KEY,
    });

    const reportToken = c.req.param('token');

    const rows = await blink.db.clientExportReports.list({
      where: { reportToken },
      limit: 1,
    });

    if (!rows || rows.length === 0) {
      return c.json({ error: 'Report not found' }, 404);
    }

    const report = rows[0];

    // Check expiry
    if (report.expiresAt) {
      const exp = new Date(report.expiresAt as string).getTime();
      if (Date.now() > exp) {
        return c.json({ error: 'Report expired' }, 410);
      }
    }

    // Increment view count (fire-and-forget)
    blink.db.clientExportReports.update(report.id as string, {
      viewCount: Number(report.viewCount ?? 0) + 1,
    }).catch(() => {});

    return c.json({
      title: report.title,
      agencyName: report.agencyName,
      agencyLogoUrl: report.agencyLogoUrl,
      summaryData: JSON.parse(report.summaryData as string),
      expiresAt: report.expiresAt,
      viewCount: Number(report.viewCount ?? 0) + 1,
      createdAt: report.createdAt,
    });
  } catch (err) {
    console.error('[client-export GET token]', err);
    return c.json({ error: 'Failed to load report' }, 500);
  }
});

export const router = app;
