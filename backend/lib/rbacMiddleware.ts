/**
 * rbacMiddleware.ts — Role-Based Access Control for Kompilot
 *
 * Enforces admin/member/guest access rules at the API level.
 *
 * Role hierarchy:
 *   admin  → full access (manage members, billing, content, reports)
 *   member → assigned workspaces, content creation, credit consumption
 *   guest  → read-only on own workspace, no content creation, no credits
 *
 * Usage:
 *   app.use('/api/billing/*', requireRole('admin'));
 *   app.use('/api/team/*', requireRole('admin'));
 *   app.use('/api/cockpit/*', requireRole('admin', 'member'));
 */
import type { Context, Next } from 'hono';
import type { Env } from './types';
import { getBlink } from './stripeHelpers';

export type KompilotRole = 'admin' | 'member' | 'guest';

export const ROLE_LABELS: Record<KompilotRole, string> = {
  admin: 'Administrateur',
  member: 'Membre',
  guest: 'Invité (lecture seule)',
};

export const ROLE_PERMISSIONS: Record<KompilotRole, string[]> = {
  admin:  ['*'], // Full access
  member: [
    'content.create', 'content.edit', 'content.delete',
    'credits.consume',
    'reports.view',
    'inbox.read', 'inbox.reply',
    'calendar.manage',
    'scan.launch',
  ],
  guest:  [
    'reports.view',
    'dashboard.view',
    'inbox.read',
    'calendar.view',
  ],
};

/**
 * Returns a Hono middleware that requires the user to have one of the specified roles.
 * Checks team_members table for the user's role in the workspace.
 * If the workspace owner (admin) is making the request, auto-approve.
 */
export function requireRole(...roles: KompilotRole[]) {
  return async (c: Context, next: Next) => {
    const env = c.env as unknown as Env;
    const blink = getBlink(env);

    const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
    if (!auth.valid) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = auth.userId;

    // Check if user is the workspace owner (implicit admin)
    // The workspace owner is identified by their own userId
    const meta = await (async () => {
      try {
        const rows = await (blink as any).db.users.list({ where: { id: userId }, limit: 1 });
        return rows[0] ? JSON.parse(rows[0].metadata ?? '{}') : {};
      } catch { return {}; }
    })();

    // Platform admins and workspace owners are always admin
    const userRole = meta.role as string | undefined;
    if (userRole === 'admin' || userRole === 'agency') {
      c.set('userId', userId);
      c.set('userRole', 'admin' as KompilotRole);
      await next();
      return;
    }

    // Check team_members table for role
    try {
      const memberships = await (blink as any).db.teamMembers.list({
        where: {
          AND: [
            { memberUserId: userId },
            { status: 'active' },
          ],
        },
        limit: 1,
      });

      const membership = memberships[0];
      const role = (membership?.role as KompilotRole) || 'member';

      if (!roles.includes(role)) {
        return c.json({
          error: 'FORBIDDEN',
          message: `Accès insuffisant. Rôle requis : ${roles.map(r => ROLE_LABELS[r]).join(' ou ')}.`,
          your_role: ROLE_LABELS[role] || role,
          required_roles: roles.map(r => ROLE_LABELS[r]),
        }, 403);
      }

      c.set('userId', userId);
      c.set('userRole', role);
      c.set('workspaceOwnerId', membership?.workspaceOwnerId || userId);
      c.set('membership', membership);
    } catch {
      // If team_members lookup fails, default to member-level access
      // (for users without team memberships — solo accounts)
      if (!roles.includes('member') && !roles.includes('admin')) {
        return c.json({ error: 'FORBIDDEN', message: 'Accès insuffisant.' }, 403);
      }
      c.set('userId', userId);
      c.set('userRole', 'member' as KompilotRole);
    }

    await next();
  };
}

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: KompilotRole, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes('*') || perms.includes(permission);
}

/**
 * Middleware that checks a specific permission (more granular than role check).
 */
export function requirePermission(permission: string) {
  return async (c: Context, next: Next) => {
    const role = (c.get('userRole') as KompilotRole) || 'member';
    if (!hasPermission(role, permission)) {
      return c.json({
        error: 'FORBIDDEN',
        message: `Permission requise : ${permission}`,
        your_role: ROLE_LABELS[role],
      }, 403);
    }
    await next();
  };
}
