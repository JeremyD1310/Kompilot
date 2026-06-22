/**
 * G.E.O. Guardrail Routes — Generative Engine Optimization
 *
 * Implements async scan scheduling with a hard cap of 1 scan/week/establishment
 * to control AI token costs at infrastructure level.
 *
 * Routes:
 *   POST /api/geo/scan          — enqueue a G.E.O. scan (rate-limited per establishment)
 *   GET  /api/geo/scan/:id      — poll scan status
 *   GET  /api/geo/quota         — check remaining weekly quota for an establishment
 */
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';

export const router = new Hono();

/* ── Constants ────────────────────────────────────────────────────────────── */

const GEO_SCAN_WEEK_LIMIT = 1;          // max scans per establishment per week
const GEO_SCAN_COST_TOKENS_CAP = 2000; // max tokens per scan (budget guardrail)
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function getBlink(env: Record<string, string>) {
  return createClient({
    projectId: env.BLINK_PROJECT_ID,
    secretKey: env.BLINK_SECRET_KEY,
  });
}

function getWeekKey(): string {
  const now = new Date();
  const yearWeek = `${now.getFullYear()}-W${Math.ceil(
    (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / MS_PER_WEEK
  )}`;
  return yearWeek;
}

/* ── GET /api/geo/quota ─────────────────────────────────────────────────── */

router.get('/api/geo/quota', async (c) => {
  const blink = getBlink(c.env as Record<string, string>);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const establishmentId = c.req.query('establishment_id');
  if (!establishmentId) return c.json({ error: 'establishment_id required' }, 400);

  const weekKey = getWeekKey();
  const scanKey = `geo_scan_count:${establishmentId}:${weekKey}`;

  // Check scans performed this week via KV-style metadata in DB
  try {
    const rows = await blink.db.scheduled_posts.list({
      where: {
        establishment_id: establishmentId,
        user_id: auth.userId,
        status: 'geo_scan',
        // Filter by current week (approximation via created_at)
      },
      limit: 10,
    });

    // Count scans created in the last 7 days
    const weekAgo = new Date(Date.now() - MS_PER_WEEK).toISOString();
    const scansThisWeek = (rows || []).filter(
      (r: any) => r.createdAt >= weekAgo
    ).length;

    return c.json({
      establishment_id: establishmentId,
      week: weekKey,
      scans_used: scansThisWeek,
      scans_limit: GEO_SCAN_WEEK_LIMIT,
      quota_remaining: Math.max(0, GEO_SCAN_WEEK_LIMIT - scansThisWeek),
      token_cap_per_scan: GEO_SCAN_COST_TOKENS_CAP,
      next_reset: new Date(
        Math.ceil(Date.now() / MS_PER_WEEK) * MS_PER_WEEK
      ).toISOString(),
    });
  } catch {
    return c.json({ error: 'Could not fetch quota' }, 500);
  }
});

/* ── POST /api/geo/scan ─────────────────────────────────────────────────── */

router.post('/api/geo/scan', async (c) => {
  const blink = getBlink(c.env as Record<string, string>);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json().catch(() => ({}));
  const { establishment_id, keywords = [], city = '' } = body as {
    establishment_id?: string;
    keywords?: string[];
    city?: string;
  };

  if (!establishment_id) return c.json({ error: 'establishment_id required' }, 400);

  // ── Rate limit check ────────────────────────────────────────────────────
  const weekAgo = new Date(Date.now() - MS_PER_WEEK).toISOString();
  try {
    const existingScans = await blink.db.scheduled_posts.list({
      where: {
        establishment_id,
        user_id: auth.userId,
        status: 'geo_scan',
      },
      limit: 5,
    });

    const scansThisWeek = (existingScans || []).filter(
      (r: any) => r.createdAt >= weekAgo
    ).length;

    if (scansThisWeek >= GEO_SCAN_WEEK_LIMIT) {
      return c.json({
        error: 'weekly_quota_exceeded',
        message: `Le scan G.E.O. est limité à ${GEO_SCAN_WEEK_LIMIT} fois par semaine par établissement pour maîtriser les coûts IA.`,
        next_reset: new Date(
          Math.ceil(Date.now() / MS_PER_WEEK) * MS_PER_WEEK
        ).toISOString(),
      }, 429);
    }
  } catch {
    // If rate-limit check fails, allow scan to proceed (fail-open for UX)
  }

  // ── Enqueue async scan via a scheduled_posts record ──────────────────
  // We reuse the scheduled_posts table with status='geo_scan' as a job queue.
  // A real implementation would use blink.queue; this is a minimal guardrail approach.
  try {
    const scanJob = await blink.db.scheduled_posts.create({
      id: `geo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId: auth.userId,
      establishmentId: establishment_id,
      textContent: JSON.stringify({
        type: 'geo_scan',
        keywords,
        city,
        tokenCap: GEO_SCAN_COST_TOKENS_CAP,
        scheduledAt: new Date().toISOString(),
      }),
      channels: '["geo_scan"]',
      status: 'geo_scan',
      scheduledAt: new Date(Date.now() + 60 * 1000).toISOString(), // process in 60s
    });

    return c.json({
      success: true,
      scan_id: (scanJob as any).id,
      message: 'Scan G.E.O. planifié. Les résultats seront disponibles sous quelques minutes.',
      token_cap: GEO_SCAN_COST_TOKENS_CAP,
      disclaimer: 'Ce scan est asynchrone et plafonné à ' + GEO_SCAN_COST_TOKENS_CAP + ' tokens pour maîtriser les coûts IA.',
    }, 202);
  } catch (err) {
    console.error('[GEO] scan enqueue error', err);
    return c.json({ error: 'Failed to schedule scan' }, 500);
  }
});

/* ── GET /api/geo/scan/:id ───────────────────────────────────────────────── */

router.get('/api/geo/scan/:id', async (c) => {
  const blink = getBlink(c.env as Record<string, string>);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const scanId = c.req.param('id');

  try {
    const rows = await blink.db.scheduled_posts.list({
      where: { id: scanId, userId: auth.userId },
      limit: 1,
    });
    const job = rows?.[0];
    if (!job) return c.json({ error: 'Scan not found' }, 404);

    const payload = JSON.parse((job as any).textContent || '{}');
    const status = (job as any).status;

    return c.json({
      scan_id: scanId,
      status: status === 'geo_scan' ? 'pending' : status === 'published' ? 'completed' : status,
      establishment_id: (job as any).establishmentId,
      scheduled_at: (job as any).scheduledAt,
      payload,
      token_cap: payload.tokenCap ?? GEO_SCAN_COST_TOKENS_CAP,
    });
  } catch {
    return c.json({ error: 'Could not fetch scan status' }, 500);
  }
});
