/**
 * coachTips.ts — Coach IA tips system
 *
 * GET    /api/coach-tips                — approved tips for rotation
 * POST   /api/coach-tips                — submit a new user tip (auth)
 * GET    /api/coach-tips/pending        — admin: pending tips
 * PATCH  /api/coach-tips/:id/moderate   — admin: approve/reject
 * DELETE /api/coach-tips/:id            — admin: delete
 * GET    /api/coach-tips/settings       — user settings (auth)
 * PUT    /api/coach-tips/settings       — update settings (auth)
 * POST   /api/coach-tips/:id/interact   — track view/like/click
 * GET    /api/coach-tips/analytics      — admin: aggregated analytics
 */

import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';

export const router = new Hono();

const getBlink = (env: Env) =>
  createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });

function getUserId(h: string | undefined): string | null {
  if (!h?.startsWith('Bearer ')) return null;
  try { const p = h.split('.')[1]; const d = JSON.parse(atob(p)); return d.sub ?? d.user_id ?? null; }
  catch { return null; }
}

// ── GET /api/coach-tips — approved tips ──────────────────────────────────────

router.get('/api/coach-tips', async (c) => {
  try {
    const blink = getBlink(c.env as Env);
    const category = c.req.query('category');

    const where: any = { status: 'approved' };
    if (category) where.category = category;

    const tips = await blink.db.table('coach_tips').list({
      where,
      orderBy: { priority: 'desc', createdAt: 'desc' },
      limit: 50,
    });

    return c.json({ tips });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ── POST /api/coach-tips — submit a new tip ──────────────────────────────────

router.post('/api/coach-tips', async (c) => {
  try {
    const blink = getBlink(c.env as Env);
    const userId = getUserId(c.req.header('Authorization'));
    const body = await c.req.json();
    const { category, title, content, platform } = body;

    if (!title || !content) {
      return c.json({ error: 'Titre et contenu requis' }, 400);
    }

    const tip = await blink.db.table('coach_tips').create({
      category: category || 'general',
      title: String(title).slice(0, 120),
      content: String(content).slice(0, 500),
      platform: platform || '',
      status: 'pending',
      submittedBy: userId || 'anonymous',
      submittedByName: 'Utilisateur',
      isSystem: false,
    });

    return c.json({ tip }, 201);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ── GET /api/coach-tips/pending — admin: pending tips ────────────────────────

router.get('/api/coach-tips/pending', async (c) => {
  try {
    const blink = getBlink(c.env as Env);

    const tips = await blink.db.table('coach_tips').list({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      limit: 100,
    });

    return c.json({ tips });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ── PATCH /api/coach-tips/:id/moderate — approve/reject ──────────────────────

router.patch('/api/coach-tips/:id/moderate', async (c) => {
  try {
    const blink = getBlink(c.env as Env);
    const id = c.req.param('id');
    const body = await c.req.json();
    const { status } = body;

    if (!['approved', 'rejected'].includes(status)) {
      return c.json({ error: 'Statut invalide' }, 400);
    }

    const tip = await blink.db.table('coach_tips').update(id, {
      status,
      updatedAt: new Date().toISOString(),
    });

    return c.json({ tip });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ── DELETE /api/coach-tips/:id ───────────────────────────────────────────────

router.delete('/api/coach-tips/:id', async (c) => {
  try {
    const blink = getBlink(c.env as Env);
    await blink.db.table('coach_tips').delete(c.req.param('id'));
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ── GET /api/coach-tips/settings ─────────────────────────────────────────────

router.get('/api/coach-tips/settings', async (c) => {
  try {
    const blink = getBlink(c.env as Env);
    const userId = getUserId(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Non authentifié' }, 401);

    const settings = await blink.db.table('coach_tip_settings').list({
      where: { userId },
      limit: 1,
    });

    if (settings.length === 0) {
      return c.json({
        settings: {
          userId,
          enabledCategories: ['Followers', 'Engagement', 'Visibilite', 'Contenu'],
          frequencySeconds: 4,
          isEnabled: true,
        },
      });
    }

    const s = settings[0];
    return c.json({
      settings: {
        ...s,
        enabledCategories: typeof s.enabledCategories === 'string'
          ? JSON.parse(s.enabledCategories)
          : s.enabledCategories,
        isEnabled: Number(s.isEnabled) > 0,
        frequencySeconds: Number(s.frequencySeconds) || 4,
      },
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ── PUT /api/coach-tips/settings ─────────────────────────────────────────────

router.put('/api/coach-tips/settings', async (c) => {
  try {
    const blink = getBlink(c.env as Env);
    const userId = getUserId(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Non authentifié' }, 401);

    const body = await c.req.json();
    const { enabledCategories, frequencySeconds, isEnabled } = body;

    const existing = await blink.db.table('coach_tip_settings').list({
      where: { userId },
      limit: 1,
    });

    const payload = {
      userId,
      enabledCategories: JSON.stringify(
        enabledCategories || ['Followers', 'Engagement', 'Visibilite', 'Contenu']
      ),
      frequencySeconds: frequencySeconds || 4,
      isEnabled: isEnabled !== false ? 1 : 0,
      updatedAt: new Date().toISOString(),
    };

    if (existing.length === 0) {
      const created = await blink.db.table('coach_tip_settings').create(payload);
      return c.json({ settings: created });
    } else {
      const updated = await blink.db.table('coach_tip_settings').update(existing[0].id, payload);
      return c.json({ settings: updated });
    }
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ── POST /api/coach-tips/:id/interact — track interaction ────────────────────

router.post('/api/coach-tips/:id/interact', async (c) => {
  try {
    const blink = getBlink(c.env as Env);
    const tipId = c.req.param('id');
    const body = await c.req.json();
    const { type } = body;
    const userId = getUserId(c.req.header('Authorization')) || 'anonymous';

    await blink.db.table('coach_tip_interactions').create({
      tipId,
      userId,
      interactionType: type || 'view',
    });

    const tip = await blink.db.table('coach_tips').get(tipId);
    if (tip) {
      const update: any = { updatedAt: new Date().toISOString() };
      if (type === 'like') update.likes = (Number(tip.likes) || 0) + 1;
      else if (type === 'click') update.clicks = (Number(tip.clicks) || 0) + 1;
      else update.views = (Number(tip.views) || 0) + 1;
      await blink.db.table('coach_tips').update(tipId, update);
    }

    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ── GET /api/coach-tips/analytics — admin analytics ──────────────────────────

router.get('/api/coach-tips/analytics', async (c) => {
  try {
    const blink = getBlink(c.env as Env);

    const allTips = await blink.db.table('coach_tips').list({
      orderBy: { views: 'desc' },
      limit: 200,
    });

    const pendingCount = allTips.filter((t: any) => t.status === 'pending').length;
    const totalViews = allTips.reduce((s: number, t: any) => s + (Number(t.views) || 0), 0);
    const totalLikes = allTips.reduce((s: number, t: any) => s + (Number(t.likes) || 0), 0);
    const totalClicks = allTips.reduce((s: number, t: any) => s + (Number(t.clicks) || 0), 0);
    const userSubmitted = allTips.filter((t: any) => Number(t.isSystem) === 0).length;

    const topTips = [...allTips]
      .sort((a: any, b: any) =>
        ((Number(b.views) || 0) + (Number(b.likes) || 0) * 3 + (Number(b.clicks) || 0) * 2) -
        ((Number(a.views) || 0) + (Number(a.likes) || 0) * 3 + (Number(a.clicks) || 0) * 2)
      )
      .slice(0, 10);

    const categoryBreakdown: Record<string, { count: number; views: number; likes: number }> = {};
    for (const tip of allTips) {
      const cat = (tip as any).category || 'general';
      if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { count: 0, views: 0, likes: 0 };
      categoryBreakdown[cat].count++;
      categoryBreakdown[cat].views += Number((tip as any).views) || 0;
      categoryBreakdown[cat].likes += Number((tip as any).likes) || 0;
    }

    return c.json({
      analytics: {
        totalTips: allTips.length,
        pendingCount,
        userSubmitted,
        totalViews,
        totalLikes,
        totalClicks,
        topTips,
        categoryBreakdown,
      },
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

export default router;
