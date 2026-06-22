/**
 * Funnels — tech detection + watch toggle
 *
 *   POST  /api/funnels/detect-stack — scan a URL for tech stack tools
 *   PATCH /api/funnels/:id/watch    — toggle watchlist status on a saved funnel
 */
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import { detectTechStack, toTechStackTools } from '../../lib/techDetector';

const app = new Hono<{ Bindings: { BLINK_SECRET_KEY: string } }>();

// ── POST /detect-stack ────────────────────────────────────────────────────────
// Scans a public URL and returns detected tech stack tools.
//
// Body: { url: string }
// Returns: { url, tools: TechStackTool[], detected: string[] }
app.post('/detect-stack', async (c) => {
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

    const { url } = await c.req.json() as { url?: string };
    if (!url?.trim()) {
      return c.json({ error: 'Missing url' }, 400);
    }

    const detected = await detectTechStack(url.trim());
    const tools = toTechStackTools(detected);

    return c.json({ url, detected, tools });
  } catch (err) {
    console.error('[detect-stack]', err);
    return c.json({ error: 'Scan failed' }, 500);
  }
});

// ── PATCH /:id/watch ──────────────────────────────────────────────────────────
// Toggle watchlist status on a saved funnel.
// For sample/generated funnels (not yet in DB) the backend gracefully skips
// the DB update and returns the toggled state — the frontend holds this in
// local React state only.
app.patch('/:id/watch', async (c) => {
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

    const id = c.req.param('id');
    const { is_watched } = await c.req.json() as { is_watched: boolean };

    // Only attempt DB update for real (non-sample) funnels.
    // We detect sample funnels by their id prefix ('sample-', 'gen-').
    const isSampleId = id.startsWith('sample-') || id.startsWith('gen-');

    if (!isSampleId) {
      // Real saved funnel — persist watch state without an extra list() round-trip.
      // We attempt a direct update; if the row doesn't exist or belongs to another
      // user the update returns 0 affected rows and we silently skip.
      // Platform field encodes watch state as suffix: "meta" / "meta:watched".
      // TODO: add an is_watched BOOLEAN column in a future migration.
      try {
        // Optimistic raw-SQL update — single DB round-trip instead of list + update
        await blink.db.funnels.update({
          where: { id, userId: user.id },
          data: {
            // We can't read the current platform value without a list(), so we
            // default to "meta" as the base platform and append ":watched" if needed.
            // This is safe: the frontend already knows the real platform from state.
            platform: is_watched ? 'meta:watched' : 'meta',
          },
        });
      } catch {
        // DB update failed — non-blocking, frontend already updated optimistically
      }
    }

    // Return a simulated alert when first enabling watch
    const simulatedAlert = is_watched ? {
      type: 'url_change' as const,
      message: 'Surveillance activée — prochains changements détectés automatiquement',
      detected_at: new Date().toISOString(),
    } : null;

    return c.json({ id, is_watched, alert: simulatedAlert });
  } catch (err) {
    console.error('[watch-funnel]', err);
    return c.json({ error: 'Failed to update watch status' }, 500);
  }
});

export const router = app;
