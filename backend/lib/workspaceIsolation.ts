/**
 * workspaceIsolation.ts — Ensures data queries are scoped to the user's workspace.
 *
 * Provides helpers to enforce that members/guests only access data belonging
 * to their workspace owner (the agency admin).
 *
 * Usage in routes:
 *   const scope = getWorkspaceScope(c);
 *   const rows = await blink.db.establishments.list({ where: { userId: scope.ownerId } });
 */
import type { Context } from 'hono';
import type { KompilotRole } from './rbacMiddleware';

export interface WorkspaceScope {
  /** The userId to use in queries — always the workspace owner's ID */
  ownerId: string;
  /** The requesting user's own userId */
  requesterId: string;
  /** The requester's role in this workspace */
  role: KompilotRole;
  /** Whether the requester can modify data */
  canWrite: boolean;
  /** Whether the requester can consume credits */
  canConsumeCredits: boolean;
}

/**
 * Extract the workspace scope from a Hono context.
 * Must be called AFTER requireRole middleware (which sets userId, userRole, workspaceOwnerId).
 */
export function getWorkspaceScope(c: Context): WorkspaceScope {
  const userId = c.get('userId') as string;
  const role = (c.get('userRole') as KompilotRole) || 'member';
  const workspaceOwnerId = (c.get('workspaceOwnerId') as string) || userId;

  return {
    ownerId: workspaceOwnerId,
    requesterId: userId,
    role,
    canWrite: role === 'admin' || role === 'member',
    canConsumeCredits: role === 'admin' || role === 'member',
  };
}

/**
 * Enforce write access — returns an error response if the user is a guest.
 * Use this at the top of POST/PUT/DELETE route handlers.
 */
export function enforceWriteAccess(c: Context): Response | null {
  const scope = getWorkspaceScope(c);
  if (!scope.canWrite) {
    return c.json({
      error: 'FORBIDDEN',
      message: 'Les invités ont un accès en lecture seule. Contactez votre administrateur pour obtenir les droits d\'écriture.',
    }, 403);
  }
  return null;
}

/**
 * Build a where clause that scopes queries to the user's workspace.
 * For admin/owner: filter by their own userId.
 * For member/guest: filter by workspaceOwnerId.
 */
export function workspaceWhere(c: Context, extraWhere?: Record<string, any>): Record<string, any> {
  const scope = getWorkspaceScope(c);
  return {
    userId: scope.ownerId,
    ...extraWhere,
  };
}

/**
 * List of tables that should be workspace-scoped.
 * Used for audit purposes and documentation.
 */
export const WORKSPACE_SCOPED_TABLES = [
  'establishments',
  'posts',
  'scheduled_posts',
  'messages',
  'inbox_replies',
  'quick_reply_templates',
  'captured_leads',
  'daily_analytics',
  'initial_scans',
  'campaign_performance',
  'post_engagement_metrics',
  'referral_campaigns',
  'referral_links',
  'customer_personas',
  'creative_reports',
  'funnels',
  'funnel_nodes',
  'detected_threads',
  'reddit_trackers',
  'reddit_calendar_events',
];
