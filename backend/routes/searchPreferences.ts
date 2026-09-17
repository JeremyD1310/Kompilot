/**
 * searchPreferences.ts — Saved search filter & highlight preferences
 *
 * GET  /api/search-preferences      — list saved filters for current user
 * POST /api/search-preferences      — save a named filter set
 * DELETE /api/search-preferences/:id — delete a saved filter set
 */
import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

function getUserId(h: string | undefined): string | null {
  if (!h?.startsWith('Bearer ')) return null;
  try {
    const payload = h.split('.')[1];
    return (JSON.parse(atob(payload))).sub ?? null;
  } catch {
    return null;
  }
}

function getBlink(env: Env) {
  return createClient({
    projectId: requireBlinkProjectId(env),
    secretKey: env.BLINK_SECRET_KEY,
  });
}

// ── GET /api/search-preferences ──────────────────────────────────────────────

router.get('/api/search-preferences', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const blink = getBlink(c.env as unknown as Env);
    const prefs = await (blink.db.table('search_preferences') as any).list({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      limit: 20,
    });
    return c.json({ preferences: Array.isArray(prefs) ? prefs : [] });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ── POST /api/search-preferences ─────────────────────────────────────────────

router.post('/api/search-preferences', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const body = await c.req.json();
    const { name, active_categories, highlight_style } = body;

    if (!name || !active_categories) {
      return c.json({ error: 'name and active_categories are required' }, 400);
    }

    const blink = getBlink(c.env as unknown as Env);
    const id = `sp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const created = await (blink.db.table('search_preferences') as any).create({
      id,
      userId,
      name,
      activeCategories: JSON.stringify(active_categories),
      highlightStyle: highlight_style || 'amber',
      createdAt: now,
      updatedAt: now,
    });

    return c.json({ preference: created }, 201);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ── DELETE /api/search-preferences/:id ───────────────────────────────────────

router.delete('/api/search-preferences/:id', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const prefId = c.req.param('id');
  if (!prefId) return c.json({ error: 'Missing id' }, 400);

  try {
    const blink = getBlink(c.env as unknown as Env);
    const existing = await (blink.db.table('search_preferences') as any).get(prefId);
    if (!existing) return c.json({ error: 'Not found' }, 404);
    if (existing.userId !== userId) return c.json({ error: 'Forbidden' }, 403);

    await (blink.db.table('search_preferences') as any).delete(prefId);
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});
