import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

router.get('/api/rbac/me', async (c) => {
  const blink = createClient({
    projectId: requireBlinkProjectId(c.env),
    secretKey: c.env.BLINK_SECRET_KEY,
  });
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: auth.error || 'Unauthorized' }, 401);

  const permissions = ['admin.access', 'posts.read', 'posts.create', 'posts.update', 'posts.delete', 'billing.manage', 'agency.manage', 'partner_api.manage'];
  return c.json({
    userId: auth.userId,
    email: auth.email,
    role: auth.appRole || 'member',
    permissions: permissions.filter(permission => {
      try { return blink.auth.can(permission); } catch { return false; }
    }),
  });
});
