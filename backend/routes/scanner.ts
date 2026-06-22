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
      const backendUrl = `https://${env.BLINK_PROJECT_ID || 'gbrhsehk'}.backend.blink.new`;
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
