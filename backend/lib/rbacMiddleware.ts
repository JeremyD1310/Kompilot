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

export type KompilotRole = 'owner' | 'admin' | 'member' | 'guest';
export type StoredTeamRole = 'owner' | 'admin' | 'editor' | 'member' | 'guest' | 'viewer';

export const ROLE_LABELS: Record<KompilotRole, string> = {
  owner: 'Propriétaire',
  admin: 'Administrateur',
  member: 'Membre',
  guest: 'Invité (lecture seule)',
};

export const ROLE_PERMISSIONS: Record<KompilotRole, string[]> = {
  owner: ['*'],
  admin: ['billing.manage', 'team.manage', 'workspace.manage', 'settings.manage', 'content.manage', 'reports.view', 'dashboard.view'],
  member: [
    'content.create', 'content.edit', 'content.delete',
    'credits.consume', 'reports.view', 'inbox.read', 'inbox.reply',
    'calendar.manage', 'scan.launch',
  ],
  guest: ['reports.view', 'dashboard.view', 'inbox.read', 'calendar.view'],
};

export interface WorkspaceAuthorization {
  userId: string;
  ownerId: string;
  workspaceId?: string;
  role: KompilotRole;
  membership: Record<string, unknown>;
}

const ROLE_MAP: Record<StoredTeamRole, KompilotRole> = {
  owner: 'owner',
  admin: 'admin',
  editor: 'member',
  member: 'member',
  guest: 'guest',
  viewer: 'guest',
};

function requestedWorkspace(c: Context): string | undefined {
  return c.req.header('X-Workspace-Id') ?? c.req.query('workspaceId') ?? undefined;
}

function normalizeRole(value: unknown): KompilotRole | null {
  return typeof value === 'string' && value in ROLE_MAP ? ROLE_MAP[value as StoredTeamRole] : null;
}

function active(value: unknown): boolean {
  return value === undefined || value === null || value === '' || value === 'active' || value === 1 || value === '1';
}

function ownerFromLegacy(row: Record<string, unknown>): string | undefined {
  return typeof row.workspaceOwnerId === 'string' && row.workspaceOwnerId ? row.workspaceOwnerId : undefined;
}

/**
 * Resolve authorization only from the verified subject and server-side workspace tables.
 * User metadata is deliberately never read: it is writable by the account it describes.
 */
export async function resolveWorkspaceAuthorization(
  blink: any,
  userId: string,
  workspaceId?: string,
): Promise<WorkspaceAuthorization | null> {
  const teamMembers = blink.db.table<any>('team_members');
  const agencyMembers = blink.db.table<any>('agency_workspace_members');
  const workspaces = blink.db.table<any>('agency_workspaces');

  const legacyRows = await teamMembers.list({
    where: { AND: [{ memberUserId: userId }, { status: 'active' }] },
    limit: 500,
  }) as Record<string, unknown>[];

  const legacy = legacyRows.find((row) => {
    const ownerId = ownerFromLegacy(row);
    return active(row.status) && row.memberUserId === userId && (!workspaceId || ownerId === workspaceId);
  });
  if (legacy) {
    const ownerId = ownerFromLegacy(legacy);
    const role = normalizeRole(legacy.role);
    if (ownerId && role && legacy.memberUserId === userId) return { userId, ownerId, role, membership: legacy };
  }

  const ownedRows = await workspaces.list({
    where: workspaceId ? { AND: [{ ownerId: userId }, { id: workspaceId }] } : { ownerId: userId },
    limit: 500,
  }) as Record<string, unknown>[];
  const owned = ownedRows.find((row) => typeof row.id === 'string' && (!workspaceId || row.id === workspaceId));
  if (owned && typeof owned.id === 'string') {
    return {
      userId,
      ownerId: userId,
      workspaceId: owned.id,
      role: 'owner',
      membership: { id: `owner:${owned.id}`, workspaceId: owned.id, userId, role: 'owner', status: 'active' },
    };
  }

  const agencyRows = await agencyMembers.list({
    where: workspaceId ? { AND: [{ userId }, { workspaceId }, { status: 'active' }] } : { AND: [{ userId }, { status: 'active' }] },
    limit: 500,
  }) as Record<string, unknown>[];
  const agency = agencyRows.find((row) => typeof row.workspaceId === 'string' && (!workspaceId || row.workspaceId === workspaceId));
  if (agency && typeof agency.workspaceId === 'string') {
    const workspaceRows = await workspaces.list({ where: { id: agency.workspaceId }, limit: 1 }) as Record<string, unknown>[];
    const workspace = workspaceRows[0];
    if (!workspace || typeof workspace.ownerId !== 'string') throw new Error('WORKSPACE_AUTHORITY_UNAVAILABLE');
    const role = normalizeRole(agency.role);
    if (role) return { userId, ownerId: workspace.ownerId, workspaceId: agency.workspaceId, role, membership: agency };
  }

  return null;
}

export function requireRole(...roles: KompilotRole[]) {
  return async (c: Context, next: Next) => {
    const env = c.env as unknown as Env;
    const blink = getBlink(env);
    const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
    if (!auth.valid || !auth.userId) return c.json({ error: 'Unauthorized' }, 401);

    let authorization: WorkspaceAuthorization | null;
    try {
      authorization = await resolveWorkspaceAuthorization(blink, auth.userId, requestedWorkspace(c));
    } catch {
      return c.json({ error: 'AUTHORITY_UNAVAILABLE', message: 'Impossible de vérifier les autorisations.' }, 503);
    }

    if (!authorization) {
      return c.json({ error: 'FORBIDDEN', message: 'Aucun rôle actif pour cet espace de travail.', required_roles: roles.map((role) => ROLE_LABELS[role]) }, 403);
    }
    const ownerCanUseAdminRoute = authorization.role === 'owner' && roles.includes('admin');
    if (!roles.includes(authorization.role) && !ownerCanUseAdminRoute) {
      return c.json({
        error: 'FORBIDDEN',
        message: `Accès insuffisant. Rôle requis : ${roles.map((role) => ROLE_LABELS[role]).join(' ou ')}.`,
        your_role: ROLE_LABELS[authorization.role],
        required_roles: roles.map((role) => ROLE_LABELS[role]),
      }, 403);
    }

    c.set('userId', authorization.userId);
    c.set('userRole', authorization.role);
    c.set('workspaceOwnerId', authorization.ownerId);
    c.set('workspaceId', authorization.workspaceId);
    c.set('membership', authorization.membership);
    await next();
  };
}

export function hasPermission(role: KompilotRole, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role] ?? [];
  return perms.includes('*') || perms.includes(permission);
}

export function requirePermission(permission: string) {
  return async (c: Context, next: Next) => {
    const role = c.get('userRole') as KompilotRole | undefined;
    if (!role || !hasPermission(role, permission)) {
      return c.json({ error: 'FORBIDDEN', message: `Permission requise : ${permission}` }, 403);
    }
    await next();
  };
}
