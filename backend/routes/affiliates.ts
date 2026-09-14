/**
 * affiliates.ts — Programme d'affiliation / parrainage agences
 *
 * POST   /api/affiliates/register    — génère un code de parrainage unique
 * GET    /api/affiliates/stats       — dashboard stats + conversions
 * GET    /api/affiliates/resolve/:code — résoudre un code (public, pour landing page /ref)
 * POST   /api/affiliates/track-click — enregistre un clic sur lien de parrainage
 * POST   /api/affiliates/convert     — enregistre une conversion (souscription payante)
 * GET    /api/affiliates/history     — historique détaillé des conversions
 */
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

function getUserId(h: string | undefined): string | null {
  if (!h?.startsWith('Bearer ')) return null;
  try { const p = h.split('.')[1]; return (JSON.parse(atob(p))).sub ?? null; } catch { return null; }
}

function getBlink(env: Env) {
  return createClient({
    projectId: env.BLINK_PROJECT_ID || 'presence-manager-saas-gbrhsehk',
    secretKey: env.BLINK_SECRET_KEY,
  });
}

// ── POST /api/affiliates/register ────────────────────────────────────────────

router.post('/api/affiliates/register', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const blink = getBlink(c.env as unknown as Env);

    // Check if already registered
    const existing = await blink.db.table('affiliates').list({
      where: { userId, isActive: '1' },
      limit: 1,
    });

    if (Array.isArray(existing) && existing.length > 0) {
      return c.json({ affiliate: existing[0], alreadyExists: true });
    }

    const code = `KOM${crypto.randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase()}`;
    const id = `aff_${Date.now()}_${crypto.randomUUID().substring(0, 6)}`;

    const affiliate = await blink.db.table('affiliates').create({
      id,
      userId,
      referralCode: code,
      commissionPercent: 20,
      totalReferrals: 0,
      totalConversions: 0,
      totalCommissionCents: 0,
      isActive: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return c.json({ affiliate, referralLink: `https://kompilot.fr/ref/${code}` }, 201);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ── GET /api/affiliates/stats ────────────────────────────────────────────────

router.get('/api/affiliates/stats', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const blink = getBlink(c.env as unknown as Env);

    const affiliates = await blink.db.table('affiliates').list({
      where: { userId, isActive: '1' },
      limit: 1,
    });

    const affiliate = Array.isArray(affiliates) && affiliates.length > 0 ? affiliates[0] : null;

    if (!affiliate) {
      return c.json({ registered: false, message: 'Pas encore inscrit au programme d\'affiliation' });
    }

    // Get clicks
    const clicks = await blink.db.table('affiliate_clicks').list({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: 'desc' },
      limit: 100,
    });

    const totalClicks = Array.isArray(clicks) ? clicks.length : 0;
    const convertedClicks = Array.isArray(clicks) ? clicks.filter((c: any) => Number(c.converted) > 0).length : 0;

    return c.json({
      affiliate: {
        id: affiliate.id,
        code: affiliate.referralCode,
        commissionPercent: Number(affiliate.commissionPercent),
        totalReferrals: Number(affiliate.totalReferrals),
        totalConversions: Number(affiliate.totalConversions),
        totalCommissionCents: Number(affiliate.totalCommissionCents),
        totalCommissionEuros: Number(affiliate.totalCommissionCents) / 100,
        totalClicks,
        convertedClicks,
        referralLink: `https://kompilot.fr/ref/${affiliate.referralCode}`,
        clicks: Array.isArray(clicks) ? clicks : [],
      },
      registered: true,
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ── POST /api/affiliates/track-click ─────────────────────────────────────────

router.post('/api/affiliates/track-click', async (c) => {
  try {
    const body = await c.req.json();
    const { affiliateId } = body;
    if (!affiliateId) return c.json({ error: 'affiliateId is required' }, 400);

    const blink = getBlink(c.env as unknown as Env);

    await blink.db.table('affiliate_clicks').create({
      id: `acl_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
      affiliateId,
      ipAddress: c.req.header('CF-Connecting-IP') || '',
      userAgent: c.req.header('User-Agent') || '',
      converted: 0,
      createdAt: new Date().toISOString(),
    });

    // Update referral count
    const existing = await blink.db.table('affiliates').get(affiliateId);
    if (existing) {
      await blink.db.table('affiliates').update(affiliateId, {
        totalReferrals: String(Number(existing.totalReferrals) + 1),
        updatedAt: new Date().toISOString(),
      });
    }

    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ── GET /api/affiliates/resolve/:code ───────────────────────────────────────

router.get('/api/affiliates/resolve/:code', async (c) => {
  try {
    const code = c.req.param('code');
    if (!code) return c.json({ error: 'Code required' }, 400);

    const blink = getBlink(c.env as unknown as Env);

    const affiliates = await blink.db.table('affiliates').list({
      where: { referralCode: code, isActive: '1' },
      limit: 1,
    });

    const affiliate = Array.isArray(affiliates) && affiliates.length > 0 ? affiliates[0] : null;

    if (!affiliate) {
      return c.json({ found: false, message: 'Code de parrainage invalide' }, 404);
    }

    return c.json({
      found: true,
      affiliate: {
        id: affiliate.id,
        code: affiliate.referralCode,
        commissionPercent: Number(affiliate.commissionPercent),
        totalConversions: Number(affiliate.totalConversions),
      },
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ── POST /api/affiliates/convert ────────────────────────────────────────────

router.post('/api/affiliates/convert', async (c) => {
  try {
    const body = await c.req.json();
    const { referralCode, newUserId = '', newUserEmail = '', planId = '', planAmountCents = 0 } = body;

    if (!referralCode) return c.json({ error: 'referralCode is required' }, 400);

    const blink = getBlink(c.env as unknown as Env);

    // Find affiliate
    const affiliates = await blink.db.table('affiliates').list({
      where: { referralCode, isActive: '1' },
      limit: 1,
    });

    const affiliate = Array.isArray(affiliates) && affiliates.length > 0 ? affiliates[0] : null;
    if (!affiliate) return c.json({ error: 'Invalid referral code' }, 404);

    // Prevent self-referral
    if (newUserId && newUserId === affiliate.userId) {
      return c.json({ error: 'Self-referral not allowed' }, 400);
    }

    // Calculate commission: commissionPercent% of plan amount
    const commissionPercent = Number(affiliate.commissionPercent);
    const commissionCents = Math.round((planAmountCents || 6900) * (commissionPercent / 100));

    // Update affiliate
    const prevConversions = Number(affiliate.totalConversions) || 0;
    const prevCommissionCents = Number(affiliate.totalCommissionCents) || 0;

    await blink.db.table('affiliates').update(affiliate.id, {
      totalConversions: String(prevConversions + 1),
      totalCommissionCents: String(prevCommissionCents + commissionCents),
      totalReferrals: String(Number(affiliate.totalReferrals) + 1),
      updatedAt: new Date().toISOString(),
    });

    // Mark the most recent click as converted
    const clicks = await blink.db.table('affiliate_clicks').list({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: 'desc' },
      limit: 1,
    });

    if (Array.isArray(clicks) && clicks.length > 0) {
      await blink.db.table('affiliate_clicks').update(clicks[0].id, { converted: 1 });
    }

    return c.json({
      success: true,
      commission: {
        percent: commissionPercent,
        amountCents: commissionCents,
        amountEuros: commissionCents / 100,
        totalCommissionEuros: (prevCommissionCents + commissionCents) / 100,
        totalConversions: prevConversions + 1,
      },
    }, 201);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ── GET /api/affiliates/history ─────────────────────────────────────────────

router.get('/api/affiliates/history', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const blink = getBlink(c.env as unknown as Env);

    const affiliates = await blink.db.table('affiliates').list({
      where: { userId, isActive: '1' },
      limit: 1,
    });

    const affiliate = Array.isArray(affiliates) && affiliates.length > 0 ? affiliates[0] : null;
    if (!affiliate) return c.json({ registered: false, history: [] });

    // Get all clicks marked as converted
    const converted = await blink.db.table('affiliate_clicks').list({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: 'desc' },
      limit: 50,
    });

    const convertedList = Array.isArray(converted)
      ? converted.filter((c: any) => Number(c.converted) > 0)
      : [];

    // Estimate per-conversion commission (total / conversions)
    const totalConversions = Number(affiliate.totalConversions) || 0;
    const totalCommissionCents = Number(affiliate.totalCommissionCents) || 0;
    const avgCommission = totalConversions > 0 ? Math.round(totalCommissionCents / totalConversions) : 0;

    return c.json({
      registered: true,
      history: convertedList.map((c: any) => ({
        id: c.id,
        convertedAt: c.createdAt,
        estimatedCommissionEuros: avgCommission / 100,
      })),
      summary: {
        totalConversions,
        totalCommissionEuros: totalCommissionCents / 100,
        avgCommissionEuros: avgCommission / 100,
        estimatedMRR: totalConversions > 0 ? Math.round((totalCommissionCents / 100) / (totalConversions || 1) * 5) : 0,
      },
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});
