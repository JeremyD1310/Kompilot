/**
 * Funnels — CRUD on user-saved funnels
 *
 *   GET    /api/funnels       — list user's saved funnels
 *   POST   /api/funnels       — save a funnel
 *   DELETE /api/funnels/:id   — delete a saved funnel
 */
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';

const app = new Hono<{ Bindings: { BLINK_SECRET_KEY: string } }>();

// ── GET / (user saved funnels) ────────────────────────────────────────────────
app.get('/', async (c) => {
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

    const funnels = await blink.db.funnels.list({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return c.json({ funnels });
  } catch (err) {
    return c.json({ error: 'Failed to fetch funnels' }, 500);
  }
});

// ── POST / (save a funnel) ────────────────────────────────────────────────────
app.post('/', async (c) => {
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

    const body = await c.req.json();
    const { creator_name, domain_url, estimated_spend, performance_score, platform, nodes } = body;

    const id = crypto.randomUUID().replace(/-/g, '');

    const funnel = await blink.db.funnels.create({
      id,
      userId: user.id,
      creatorName: creator_name,
      domainUrl: domain_url,
      estimatedSpend: estimated_spend ?? 0,
      performanceScore: performance_score ?? 0,
      platform: platform ?? 'meta',
      isSample: 0,
    });

    // Save nodes
    if (Array.isArray(nodes) && nodes.length > 0) {
      await Promise.all(nodes.map((node: Record<string, unknown>) =>
        blink.db.funnelNodes.create({
          id: crypto.randomUUID().replace(/-/g, ''),
          funnelId: id,
          userId: user.id,
          type: node.type as string,
          title: node.title as string,
          url: node.url as string | undefined,
          metadata: JSON.stringify(node.metadata ?? {}),
          positionOrder: node.position_order as number ?? 0,
        })
      ));
    }

    return c.json({ funnel, id }, 201);
  } catch (err) {
    return c.json({ error: 'Failed to save funnel' }, 500);
  }
});

// ── DELETE /:id ───────────────────────────────────────────────────────────────
app.delete('/:id', async (c) => {
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
    await blink.db.funnels.delete({ where: { id, userId: user.id } });
    await blink.db.funnelNodes.deleteMany({ where: { funnelId: id, userId: user.id } });

    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: 'Failed to delete funnel' }, 500);
  }
});

export const router = app;
