/**
 * Funnels — Ghost Email Tracking routes
 *
 *   GET  /api/funnels/:id/ghost-emails          — list ghost emails for a funnel
 *   POST /api/funnels/:id/ghost-emails/register — register the tracking email address
 */
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';

const app = new Hono<{ Bindings: { BLINK_SECRET_KEY: string } }>();

function buildTrackingEmail(funnelId: string): string {
  return `track-${funnelId.slice(0, 8)}@spy.kompilot.com`;
}

// ── GET /:id/ghost-emails ──────────────────────────────────────────────────────
app.get('/:id/ghost-emails', async (c) => {
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
    const trackingEmail = buildTrackingEmail(funnelId);

    const emails = await blink.db.funnelGhostEmails.list({
      where: { funnelId, userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return c.json({ trackingEmail, emails });
  } catch (err) {
    console.error('[ghost-emails GET]', err);
    return c.json({ error: 'Failed to fetch ghost emails' }, 500);
  }
});

// ── POST /:id/ghost-emails/register ───────────────────────────────────────────
app.post('/:id/ghost-emails/register', async (c) => {
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
    const trackingEmail = buildTrackingEmail(funnelId);

    const record = await blink.db.funnelGhostEmails.create({
      id: crypto.randomUUID().replace(/-/g, ''),
      funnelId,
      userId: user.id,
      trackingEmail,
      createdAt: new Date().toISOString(),
    });

    return c.json({ trackingEmail, record }, 201);
  } catch (err) {
    console.error('[ghost-emails POST register]', err);
    return c.json({ error: 'Failed to register tracking email' }, 500);
  }
});

export const router = app;
