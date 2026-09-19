/**
 * scanner.ts — GeoScanner Rate-Limited Routes
 *
 * Public routes (no auth):
 *   GET  /api/scanner/quota         — check remaining free scans (read-only)
 *   POST /api/scanner/scan          — validate quota + increment before scan
 *
 * Authenticated routes:
 *   POST /api/scanner/deep-scan/check   — rate-limit gate for Deep Scans (3/IP/SIRET/hour)
 *   POST /api/scanner/raid/check        — review raid detection (10 neg reviews/hour → alert)
 *   GET  /api/scanner/raid/state        — get current raid state for establishment
 *   POST /api/scanner/raid/clear        — manually clear raid alert
 */
import { Hono } from 'hono';
import { requireBlinkProjectId, requireBackendUrl } from '../lib/blinkConfig';
import {
  checkAndIncrementScanQuota,
  getScanQuota,
} from '../lib/scanRateLimiter';
import { checkDeepScanQuota } from '../lib/deepScanRateLimiter';
import { checkReviewRaid, getRaidState, clearRaidState } from '../lib/reviewRaidDetector';
import { getBlink } from '../lib/stripeHelpers';

export const router = new Hono();

// ── GET /api/scanner/quota — read-only quota check ──────────────────────────

router.get('/api/scanner/quota', async (c) => {
  const env = c.env as Record<string, string>;

  // Extract client IP
  const ip =
    c.req.header('CF-Connecting-IP') ||
    c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ||
    c.req.header('X-Real-IP') ||
    '0.0.0.0';

  const fingerprint = c.req.header('X-Browser-FP') || '';

  const quota = await getScanQuota(env, ip, fingerprint);

  return c.json(quota);
});

// ── POST /api/scanner/scan — check + increment scan quota ────────────────────

router.post('/api/scanner/scan', async (c) => {
  const env = c.env as Record<string, string>;

  // Extract client IP (Cloudflare header takes precedence)
  const ip =
    c.req.header('CF-Connecting-IP') ||
    c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ||
    c.req.header('X-Real-IP') ||
    '0.0.0.0';

  const fingerprint = c.req.header('X-Browser-FP') || '';

  const result = await checkAndIncrementScanQuota(env, ip, fingerprint);

  if (!result.allowed) {
    return c.json({
      allowed: false,
      scansUsed: result.scansUsed,
      scansLimit: result.scansLimit,
      scansRemaining: 0,
      resetsAt: result.resetsAt,
      message: result.message,
    }, 429);
  }

  return c.json({
    allowed: true,
    scansUsed: result.scansUsed,
    scansLimit: result.scansLimit,
    scansRemaining: result.scansRemaining,
    resetsAt: result.resetsAt,
    message: null,
  }, 200);
});

// ── POST /api/scanner/deep-scan/check — authenticated Deep Scan rate-limit ───
// Max 3 Deep Scans per IP per hour AND per SIRET per hour.

router.post('/api/scanner/deep-scan/check', async (c) => {
  const env = c.env as Record<string, string>;
  const blink = getBlink(env as any);

  // Auth required for deep scans
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const ip =
    c.req.header('CF-Connecting-IP') ||
    c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ||
    c.req.header('X-Real-IP') ||
    '0.0.0.0';

  const body = await c.req.json<{ siret?: string }>().catch(() => ({}));
  const siret = body?.siret;

  const result = await checkDeepScanQuota(env, ip, siret);

  if (!result.allowed) {
    return c.json({
      allowed: false,
      scansUsed: result.scansUsed,
      scansLimit: result.scansLimit,
      scansRemaining: 0,
      resetsAt: result.resetsAt,
      blockedBy: result.blockedBy,
      message: result.message,
    }, 429);
  }

  return c.json({
    allowed: true,
    scansUsed: result.scansUsed,
    scansLimit: result.scansLimit,
    scansRemaining: result.scansRemaining,
    resetsAt: result.resetsAt,
    blockedBy: null,
    message: null,
  }, 200);
});

// ── POST /api/scanner/raid/check — review raid detection ─────────────────────
// Sends recent reviews, gets back raid status. Suspends AI auto-responses if raid detected.

router.post('/api/scanner/raid/check', async (c) => {
  const env = c.env as Record<string, string>;
  const blink = getBlink(env as any);

  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json<{
    establishmentId: string;
    reviews: Array<{ id: string; rating: number; receivedAt: string; authorName?: string; text?: string }>;
  }>();

  if (!body?.establishmentId || !Array.isArray(body?.reviews)) {
    return c.json({ error: 'establishmentId and reviews[] required' }, 400);
  }

  const result = await checkReviewRaid(env, auth.userId, body.establishmentId, body.reviews);

  // 🚨 If a raid is newly detected, fire critical alert (SMS + push)
  if (result.raidDetected) {
    try {
      const backendUrl = requireBackendUrl(env);
      await fetch(`${backendUrl}/api/alerts/critical`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${env.BLINK_SECRET_KEY}`,
        },
        body: JSON.stringify({
          userId:    auth.userId,
          alertType: 'app.raid_detected',
          metadata:  {
            raidCount:       result.suspiciousCount ?? result.raidCount ?? 0,
            establishmentId: body.establishmentId,
          },
        }),
      });
    } catch (ae) {
      console.error('[scanner/raid] critical alert dispatch error (non-fatal):', ae);
    }
  }

  return c.json(result, result.raidDetected ? 200 : 200);
});

// ── GET /api/scanner/raid/state — read current raid state ─────────────────────

router.get('/api/scanner/raid/state', async (c) => {
  const env = c.env as Record<string, string>;
  const blink = getBlink(env as any);

  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const establishmentId = c.req.query('establishmentId');
  if (!establishmentId) return c.json({ error: 'establishmentId required' }, 400);

  const state = await getRaidState(env, auth.userId, establishmentId);
  return c.json(state);
});

// ── POST /api/scanner/raid/clear — manually clear raid alert ──────────────────

router.post('/api/scanner/raid/clear', async (c) => {
  const env = c.env as Record<string, string>;
  const blink = getBlink(env as any);

  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json<{ establishmentId: string }>();
  if (!body?.establishmentId) return c.json({ error: 'establishmentId required' }, 400);

  await clearRaidState(env, auth.userId, body.establishmentId);
  return c.json({ success: true, message: 'Alerte Raid levée. Automatisations IA réactivées.' });
});

// ── POST /api/scanner/lead-capture — Email capture from GeoScanner ──────────
// Public (no auth) — saves email lead from the landing page scan form.
// The `leads` table stores business_name, email, scan_data, visibility_score.

router.post('/api/scanner/lead-capture', async (c) => {
  const env = c.env as Record<string, string>;
  const blink = getBlink(env as any);

  let body: { email?: string; query?: string; source?: string };
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  if (!body?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return c.json({ error: 'Valid email required' }, 400);
  }

  const leadId = `lead_scan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  try {
    // Check if email already exists to avoid duplicates
    const existing = await blink.db.leads.list({
      where: { email: body.email.trim().toLowerCase() },
      limit: 1,
    }) as any[];

    if (existing.length > 0) {
      // Update existing lead with new scan data
      await blink.db.leads.update(existing[0].id, {
        scanData: JSON.stringify({
          lastQuery: body.query || '',
          lastSource: body.source || 'geo_scanner',
          lastScannedAt: new Date().toISOString(),
        }),
        updatedAt: new Date().toISOString(),
      } as any);
      return c.json({ success: true, id: existing[0].id, updated: true });
    }

    // Create new lead
    await blink.db.leads.create({
      id: leadId,
      businessName: body.query || 'GeoScanner Lead',
      email: body.email.trim().toLowerCase(),
      status: 'Lead_Audit',
      scanData: JSON.stringify({
        query: body.query || '',
        source: body.source || 'geo_scanner_email_capture',
        capturedAt: new Date().toISOString(),
      }),
    } as any);

    console.warn(`[scanner/lead-capture] New lead: ${body.email} from ${body.source || 'geo_scanner'}`);
    return c.json({ success: true, id: leadId, created: true });
  } catch (err) {
    console.error('[scanner/lead-capture] Error:', err);
    return c.json({ error: 'Failed to save lead' }, 500);
  }
});
