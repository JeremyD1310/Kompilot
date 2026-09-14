/**
 * Presences Routes — Track team online presence (check-in / check-out)
 *
 * GET    /api/presences          — List presences with optional date filter
 * POST   /api/presences          — Mark presence (type: check_in | check_out)
 * GET    /api/presences/export   — Export filtered presences as CSV
 * GET    /api/presences/:id      — Get a single presence record (detail view)
 * DELETE /api/presences/:id      — Delete a presence record
 */
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

function getUserId(h: string | undefined): string | null {
  if (!h?.startsWith('Bearer ')) return null;
  try {
    const p = h.split('.')[1];
    const d = JSON.parse(atob(p));
    return d.sub ?? d.user_id ?? null;
  } catch {
    return null;
  }
}

const getBlink = (env: Env) =>
  createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });

// ── Types ──────────────────────────────────────────────────────────────────

interface Presence {
  id: string;
  user_id: string;
  type: string;
  timestamp: string;
  date: string;
  notes: string;
  duration_minutes: number;
  created_at: string;
}

interface PresenceRow {
  id: string;
  userId: string;
  type: string;
  timestamp: string;
  date: string;
  notes: string;
  durationMinutes: number;
  createdAt: string;
}

// ── GET /api/presences — list presences (optional ?date=YYYY-MM-DD) ────────

router.get('/api/presences', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const blink = getBlink(env);

  const filterDate = c.req.query('date') || ''; // optional "YYYY-MM-DD"

  try {
    const table = blink.db.table<PresenceRow>('presences');
    const rows = await table.list({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      limit: 200,
    });

    // Client-side date filter (the SDK doesn't support date comparisons well)
    const filtered = filterDate
      ? rows.filter((r) => r.date === filterDate)
      : rows;

    return c.json({
      presences: filtered.map((r) => ({
        id: r.id,
        type: r.type,
        timestamp: r.timestamp,
        date: r.date,
        notes: r.notes || '',
        durationMinutes: Number(r.durationMinutes) || 0,
        createdAt: r.createdAt,
      })),
      total: filtered.length,
      filterDate: filterDate || null,
    });
  } catch (err: any) {
    console.error('[Presences] list error:', err.message);
    return c.json({ error: 'Failed to list presences' }, 500);
  }
});

// ── POST /api/presences — mark presence ───────────────────────────────────

router.post('/api/presences', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const blink = getBlink(env);

  let body: { type?: string; notes?: string; timestamp?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  const presenceType = body.type || 'check_in';
  if (!['check_in', 'check_out'].includes(presenceType)) {
    return c.json({ error: 'type must be "check_in" or "check_out"' }, 400);
  }

  const now = new Date();
  const timestamp = body.timestamp || now.toISOString();
  const date = timestamp.slice(0, 10); // "YYYY-MM-DD"
  const id = `pr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const table = blink.db.table<PresenceRow>('presences');

    // If check-in, look for the last check-in today to compute duration
    let durationMinutes = 0;
    if (presenceType === 'check_out') {
      const todayRows = await table.list({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        limit: 50,
      });
      const lastCheckIn = todayRows.find(
        (r) => r.date === date && r.type === 'check_in',
      );
      if (lastCheckIn) {
        const checkInTime = new Date(lastCheckIn.timestamp).getTime();
        const checkOutTime = new Date(timestamp).getTime();
        durationMinutes = Math.max(
          0,
          Math.round((checkOutTime - checkInTime) / 60000),
        );
      }
    }

    await table.create({
      id,
      userId,
      type: presenceType,
      timestamp,
      date,
      notes: body.notes || '',
      durationMinutes,
    });

    return c.json({
      id,
      type: presenceType,
      timestamp,
      date,
      notes: body.notes || '',
      durationMinutes,
    });
  } catch (err: any) {
    console.error('[Presences] create error:', err.message);
    return c.json({ error: 'Failed to record presence' }, 500);
  }
});

// ── GET /api/presences/export — CSV export ────────────────────────────────

router.get('/api/presences/export', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const blink = getBlink(env);

  const filterDate = c.req.query('date') || '';

  try {
    const table = blink.db.table<PresenceRow>('presences');
    const rows = await table.list({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      limit: 1000,
    });

    const filtered = filterDate
      ? rows.filter((r) => r.date === filterDate)
      : rows;

    // Build CSV
    const header = 'Date,Heure,Type,Notes,Durée (min)';
    const lines = filtered.map((r) => {
      const time = new Date(r.timestamp).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const type = r.type === 'check_in' ? 'Arrivée' : 'Départ';
      const notes = (r.notes || '').replace(/"/g, '""');
      const dur = Number(r.durationMinutes) || 0;
      return `${r.date},${time},${type},"${notes}",${dur}`;
    });

    const csv = [header, ...lines].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=presences-${filterDate || 'all'}.csv`,
      },
    });
  } catch (err: any) {
    console.error('[Presences] export error:', err.message);
    return c.json({ error: 'Failed to export presences' }, 500);
  }
});

// ── GET /api/presences/:id — get a single presence record ────────────────

router.get('/api/presences/:id', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const blink = getBlink(env);

  const id = c.req.param('id');
  if (!id) return c.json({ error: 'id is required' }, 400);

  try {
    const table = blink.db.table<PresenceRow>('presences');
    const record = await table.get(id);
    if (!record || record.userId !== userId) {
      return c.json({ error: 'Not found' }, 404);
    }

    return c.json({
      id: record.id,
      type: record.type,
      timestamp: record.timestamp,
      date: record.date,
      notes: record.notes || '',
      durationMinutes: Number(record.durationMinutes) || 0,
      createdAt: record.createdAt,
    });
  } catch (err: any) {
    console.error('[Presences] get error:', err.message);
    return c.json({ error: 'Failed to fetch presence' }, 500);
  }
});

// ── DELETE /api/presences/:id — delete a presence record ──────────────────

router.delete('/api/presences/:id', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const blink = getBlink(env);

  const id = c.req.param('id');
  if (!id) return c.json({ error: 'id is required' }, 400);

  try {
    const table = blink.db.table<PresenceRow>('presences');
    const record = await table.get(id);
    if (!record || record.userId !== userId) {
      return c.json({ error: 'Not found' }, 404);
    }
    await table.delete(id);
    return c.json({ success: true });
  } catch (err: any) {
    console.error('[Presences] delete error:', err.message);
    return c.json({ error: 'Failed to delete presence' }, 500);
  }
});
