/**
 * commandCenter.ts — Command Center + Kill-Switch for Kompilot SaaS.
 *
 * Endpoints:
 *   GET  /api/command-center/metrics              — aggregated dashboard KPIs
 *   POST /api/command-center/kill-switch/activate   — admin-targeted block
 *   POST /api/command-center/kill-switch/deactivate — reverse a block
 *   GET  /api/command-center/kill-switch/status     — current switch state(s)
 *
 * Kill-switch storage: stored as JSON flags inside `users.metadata` so no
 * new table is required. Global switch lives on the admin's own metadata.
 */
import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';
import { logActivity } from '../lib/activityLogger';

// ── Types ──────────────────────────────────────────────────────────────────────

interface KillSwitchPayload {
  target: 'all' | 'user_id';
  userId?: string;
  reason: string;
}

interface KillSwitchState {
  kill_switched: boolean;
  reason?: string;
  switched_at?: string;
  switched_by?: string;
  /** true when this user is covered by a global kill-switch */
  covered_by_global?: boolean;
  global_state?: {
    active: boolean;
    reason?: string;
    switched_at?: string;
    switched_by?: string;
  };
}

interface CommandCenterMetrics {
  users: {
    total: number;
    active: number;
    blocked: number;
  };
  campaigns: {
    total_active: number;
    total_impressions_30d: number;
    total_clicks_30d: number;
  };
  posts: {
    scheduled_this_week: number;
    published_this_week: number;
    drafts: number;
  };
  messages: {
    unread_total: number;
  };
  health: {
    alerts_active: number;
    alerts_critical: number;
    alerts_warning: number;
  };
  system: {
    status: 'green' | 'yellow' | 'red';
    components: {
      database: 'green' | 'yellow' | 'red';
      ai: 'green' | 'yellow' | 'red';
      stripe: 'green' | 'yellow' | 'red';
      meta: 'green' | 'yellow' | 'red';
    };
  };
}

// ── Router ─────────────────────────────────────────────────────────────────────

export const router = new Hono<{ Bindings: Env }>();

// ── Helpers ────────────────────────────────────────────────────────────────────

function getUserIdFromToken(h: string | undefined): string | null {
  if (!h?.startsWith('Bearer ')) return null;
  try {
    const p = h.split('.')[1];
    return (JSON.parse(atob(p))).sub ?? null;
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

const ADMIN_EMAILS = [
  'jeremy@kompilot.fr',
  'romain@kompilot.fr',
  'valentine@kompilot.fr',
  'admin@kompilot.com',
];

function isAdmin(email?: string): boolean {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  return ADMIN_EMAILS.includes(lower) || lower.endsWith('@kompilot.fr');
}

function parseMetadata(metaStr: string | undefined | null): Record<string, any> {
  if (!metaStr) return {};
  try { return JSON.parse(metaStr); } catch { return {}; }
}

/** First day of the current ISO week (Monday) as ISO 8601 date string. */
function mondayOfThisWeek(): string {
  const now = new Date();
  const day = now.getDay() || 7; // Sunday = 7
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

// ── 1. GET /api/command-center/unified ─────────────────────────────────────────
// Client-facing dashboard data. This endpoint is intentionally user-scoped and
// does not reuse the admin-only metrics endpoint below.
router.get('/api/command-center/unified', async (c) => {
  const blink = getBlink(c.env);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid || !auth.userId) return c.json({ error: 'Unauthorized' }, 401);

  const userId = auth.userId;
  const safeList = async <T,>(table: string, options: Record<string, unknown> = {}): Promise<T[]> => {
    try {
      return await blink.db.table<T>(table).list({ where: { userId }, limit: 100, ...options } as any);
    } catch (error) {
      console.error(`[commandCenter/unified] ${table} query failed`, error);
      return [];
    }
  };

  const [analytics, posts, messages, activity, espionAnalyses] = await Promise.all([
    safeList<any>('daily_analytics', { orderBy: { snapshotDate: 'desc' }, limit: 1 }),
    safeList<any>('scheduled_posts', { orderBy: { createdAt: 'desc' }, limit: 100 }),
    safeList<any>('messages', { orderBy: { createdAt: 'desc' }, limit: 100 }),
    safeList<any>('user_activity_logs', { orderBy: { createdAt: 'desc' }, limit: 20 }),
    safeList<any>('espion_analyses', { orderBy: { createdAt: 'desc' }, limit: 100 }),
  ]);

  const latest = analytics[0] ?? {};
  const publishedPosts = posts.filter((post: any) => post.status === 'published');
  const unreadMessages = messages.filter((message: any) => Number(message.isRead) === 0);
  const activityEvents = activity.slice(0, 10).map((event: any, index: number) => ({
    id: String(event.id ?? `activity-${index}`),
    type: event.actionCategory === 'social' ? 'post' : event.actionCategory === 'billing' ? 'campaign' : 'message',
    label: String(event.description || event.actionType || 'Activité Kompilot'),
    timestamp: String(event.createdAt || new Date().toISOString()),
  }));
  const maturityScores = espionAnalyses.map((row: any) => Number(row.maturityScore) || 0).filter((score: number) => score > 0);
  const espionMaturityScore = maturityScores.length ? Math.round(maturityScores.reduce((sum: number, score: number) => sum + score, 0) / maturityScores.length) : 0;

  return c.json({
    geoScore: Number(latest.geoScore) || 0,
    geoScoreTrend: 0,
    declaredRoas: 0,
    realRoas: 0,
    qualifiedLeads: 0,
    conversionRate: 0,
    postsThisWeek: publishedPosts.length,
    unreadMessages: unreadMessages.length,
    aiCreditsRemaining: 0,
    leads: [],
    activity: activityEvents,
    killSwitchActive: false,
    espionMaturityScore,
    espionMaturityCount: maturityScores.length,
  });
});

// ── 2. GET /api/command-center/metrics ─────────────────────────────────────────

router.get('/api/command-center/metrics', async (c) => {
  const blink = getBlink(c.env);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);
  if (!isAdmin(auth.email)) return c.json({ error: 'Admin access required' }, 403);

  try {
    // --- Users ---
    const allUsers = await blink.db.table<{ id: string; is_blocked: string; created_at: string }>('users').list({
      select: ['id', 'is_blocked', 'created_at'],
      limit: 500,
    });
    const totalUsers = allUsers.length;
    const blockedUsers = (allUsers as any[]).filter((u: any) => Number(u.isBlocked ?? u.is_blocked) > 0).length;
    const activeUsers = totalUsers - blockedUsers;

    // --- Campaigns (campaign_performance) ---
    const campaigns = await blink.db.table<{
      id: string;
      total_impressions: string;
      total_clicks: string;
      created_at: string;
    }>('campaign_performance').list({
      select: ['id', 'total_impressions', 'total_clicks', 'created_at'],
      limit: 500,
    });
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const recentCamps = (campaigns as any[]).filter(
      (c: any) => c.createdAt && c.createdAt >= thirtyDaysAgo,
    );
    const totalActive = campaigns.length;
    const totalImpressions30d = recentCamps.reduce(
      (s: number, c: any) => s + Number(c.totalImpressions ?? c.total_impressions ?? 0),
      0,
    );
    const totalClicks30d = recentCamps.reduce(
      (s: number, c: any) => s + Number(c.totalClicks ?? c.total_clicks ?? 0),
      0,
    );

    // --- Posts ---
    const monday = mondayOfThisWeek();
    const allPosts = await blink.db.table<{
      id: string;
      status: string;
      scheduled_at: string;
      created_at: string;
    }>('posts').list({
      select: ['id', 'status', 'scheduled_at', 'created_at'],
      limit: 500,
    });
    const scheduledThisWeek = (allPosts as any[]).filter(
      (p: any) => {
        const schedAt = p.scheduledAt ?? p.scheduled_at;
        return schedAt && schedAt >= monday;
      },
    ).length;
    const publishedThisWeek = (allPosts as any[]).filter(
      (p: any) => {
        const schedAt = p.scheduledAt ?? p.scheduled_at;
        return p.status === 'published' && schedAt && schedAt >= monday;
      },
    ).length;
    const drafts = (allPosts as any[]).filter(
      (p: any) => p.status === 'draft',
    ).length;

    // --- Messages (notifications_queue as proxy for pending alerts) ---
    const unread = await blink.db.table<{ id: string; status: string }>('notifications_queue').list({
      select: ['id', 'status'],
      limit: 500,
    });
    const unreadTotal = (unread as any[]).filter(
      (n: any) => n.status === 'sent', // sent but not yet acknowledged
    ).length;

    // --- Health alerts ---
    // Check for critical alerts in user_activity_logs (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentLogs = await blink.db.table<{
      id: string;
      severity: string;
      action_type: string;
      created_at: string;
    }>('user_activity_logs').list({
      select: ['id', 'severity', 'action_type', 'created_at'],
      limit: 500,
    });
    const criticalAlerts = (recentLogs as any[]).filter(
      (l: any) => l.severity === 'critical' && l.createdAt && l.createdAt >= sevenDaysAgo,
    ).length;
    const warningAlerts = (recentLogs as any[]).filter(
      (l: any) => l.severity === 'warning' && l.createdAt && l.createdAt >= sevenDaysAgo,
    ).length;

    // --- System status ---
    // Probe: check DB health (our own query just worked), AI health (list users ok),
    // Stripe health (check for recent failed payment events), Meta health (check oauth_tokens)
    let dbStatus: 'green' | 'yellow' | 'red' = 'green';
    let aiStatus: 'green' | 'yellow' | 'red' = 'green';
    let stripeStatus: 'green' | 'yellow' | 'red' = 'green';
    let metaStatus: 'green' | 'yellow' | 'red' = 'green';

    // AI check — try a simple DB call to verify API responsiveness
    try {
      await blink.db.table('users').list({ select: ['id'], limit: 1 });
    } catch {
      dbStatus = 'red';
    }

    // Stripe health — check for recent failed payment events
    const failedPayments = (recentLogs as any[]).filter(
      (l: any) =>
        l.actionType === 'billing.payment_failed' &&
        l.createdAt &&
        l.createdAt >= sevenDaysAgo &&
        l.severity === 'error',
    );
    if (failedPayments.length >= 5) {
      stripeStatus = 'red';
    } else if (failedPayments.length >= 2) {
      stripeStatus = 'yellow';
    }

    // Meta health — check if any active oauth tokens exist
    try {
      const metaTokens = await blink.db
        .table<{ id: string }>('oauth_tokens')
        .list({
          where: { provider: 'meta', status: 'active' },
          select: ['id'],
          limit: 1,
        });
      if (metaTokens.length === 0) metaStatus = 'yellow';
    } catch {
      metaStatus = 'yellow';
    }

    // Overall system status — worst component dictates
    const components = [dbStatus, aiStatus, stripeStatus, metaStatus];
    let systemStatus: 'green' | 'yellow' | 'red' = 'green';
    if (components.includes('red')) systemStatus = 'red';
    else if (components.includes('yellow')) systemStatus = 'yellow';

    const metrics: CommandCenterMetrics = {
      users: { total: totalUsers, active: activeUsers, blocked: blockedUsers },
      campaigns: {
        total_active: totalActive,
        total_impressions_30d: totalImpressions30d,
        total_clicks_30d: totalClicks30d,
      },
      posts: {
        scheduled_this_week: scheduledThisWeek,
        published_this_week: publishedThisWeek,
        drafts,
      },
      messages: { unread_total: unreadTotal },
      health: {
        alerts_active: criticalAlerts + warningAlerts,
        alerts_critical: criticalAlerts,
        alerts_warning: warningAlerts,
      },
      system: {
        status: systemStatus,
        components: {
          database: dbStatus,
          ai: aiStatus,
          stripe: stripeStatus,
          meta: metaStatus,
        },
      },
    };

    return c.json(metrics);
  } catch (err: any) {
    console.error('[commandCenter/metrics] Error:', err.message);
    return c.json({ error: err.message || 'Internal error' }, 500);
  }
});

// ── 2. POST /api/command-center/kill-switch/activate ───────────────────────────

router.post('/api/command-center/kill-switch/activate', async (c) => {
  const blink = getBlink(c.env);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);
  if (!isAdmin(auth.email)) return c.json({ error: 'Admin access required' }, 403);

  let body: KillSwitchPayload;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  if (!body.target || !body.reason) {
    return c.json({ error: 'Missing required fields: target, reason' }, 400);
  }
  if (!['all', 'user_id'].includes(body.target)) {
    return c.json({ error: 'target must be "all" or "user_id"' }, 400);
  }
  if (body.target === 'user_id' && !body.userId) {
    return c.json({ error: 'userId is required when target is "user_id"' }, 400);
  }

  const now = new Date().toISOString();
  const actorEmail = auth.email || 'unknown';
  const actorId = auth.userId;

  try {
    if (body.target === 'all') {
      // Global kill-switch: store on the actor's metadata as the canonical global state
      const actorUser = await blink.db.table<{ id: string; metadata: string }>('users').get(actorId);
      const meta = parseMetadata(actorUser?.metadata);

      meta.kill_switch_global = true;
      meta.kill_switch_global_reason = body.reason;
      meta.kill_switch_global_at = now;
      meta.kill_switch_global_by = actorEmail;

      await blink.db.table('users').update(actorId, {
        metadata: JSON.stringify(meta),
      } as any);

      // Log audit trail
      const auditId = `act_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await logActivity(blink, {
        userId: actorId,
        email: actorEmail,
        actionType: 'admin.kill_switch_activate',
        actionCategory: 'admin',
        description: `Global kill-switch ACTIVATED by ${actorEmail}: ${body.reason}`,
        metadata: { target: 'all', reason: body.reason, timestamp: now },
        ipAddress: c.req.header('CF-Connecting-IP') || '',
        userAgent: c.req.header('User-Agent') || '',
        severity: 'critical',
      });

      return c.json({
        success: true,
        target: 'all',
        audit_id: auditId,
        message: 'Global kill-switch activated. All users are now blocked.',
      });
    } else {
      // User-targeted kill-switch
      const targetId = body.userId!;
      const targetUser = await blink.db.table<{ id: string; email: string; metadata: string }>('users').get(targetId);
      if (!targetUser) {
        return c.json({ error: 'Target user not found' }, 404);
      }

      const meta = parseMetadata(targetUser.metadata);
      meta.kill_switched = true;
      meta.kill_switch_reason = body.reason;
      meta.kill_switch_at = now;
      meta.kill_switch_by = actorEmail;

      await blink.db.table('users').update(targetId, {
        metadata: JSON.stringify(meta),
      } as any);

      // Log audit trail
      const auditId = `act_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await logActivity(blink, {
        userId: actorId,
        email: actorEmail,
        actionType: 'admin.kill_switch_activate',
        actionCategory: 'admin',
        description: `Kill-switch ACTIVATED for user ${targetUser.email} by ${actorEmail}: ${body.reason}`,
        metadata: {
          target: 'user_id',
          targetUserId: targetId,
          targetEmail: targetUser.email,
          reason: body.reason,
          timestamp: now,
        },
        resourceType: 'user',
        resourceId: targetId,
        ipAddress: c.req.header('CF-Connecting-IP') || '',
        userAgent: c.req.header('User-Agent') || '',
        severity: 'critical',
      });

      return c.json({
        success: true,
        target: 'user_id',
        target_user_id: targetId,
        target_email: targetUser.email,
        audit_id: auditId,
        message: `User ${targetUser.email} has been kill-switched.`,
      });
    }
  } catch (err: any) {
    console.error('[commandCenter/kill-switch/activate] Error:', err.message);
    return c.json({ error: err.message || 'Internal error' }, 500);
  }
});

// ── 3. POST /api/command-center/kill-switch/deactivate ─────────────────────────

router.post('/api/command-center/kill-switch/deactivate', async (c) => {
  const blink = getBlink(c.env);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);
  if (!isAdmin(auth.email)) return c.json({ error: 'Admin access required' }, 403);

  let body: KillSwitchPayload;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  if (!body.target || !body.reason) {
    return c.json({ error: 'Missing required fields: target, reason' }, 400);
  }
  if (!['all', 'user_id'].includes(body.target)) {
    return c.json({ error: 'target must be "all" or "user_id"' }, 400);
  }
  if (body.target === 'user_id' && !body.userId) {
    return c.json({ error: 'userId is required when target is "user_id"' }, 400);
  }

  const now = new Date().toISOString();
  const actorEmail = auth.email || 'unknown';
  const actorId = auth.userId;

  try {
    if (body.target === 'all') {
      // Clear global kill-switch from actor's metadata
      const actorUser = await blink.db.table<{ id: string; metadata: string }>('users').get(actorId);
      const meta = parseMetadata(actorUser?.metadata);

      meta.kill_switch_global = false;
      meta.kill_switch_global_reason = undefined;
      meta.kill_switch_global_at = undefined;
      meta.kill_switch_global_by = undefined;

      await blink.db.table('users').update(actorId, {
        metadata: JSON.stringify(meta),
      } as any);

      const auditId = `act_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await logActivity(blink, {
        userId: actorId,
        email: actorEmail,
        actionType: 'admin.kill_switch_deactivate',
        actionCategory: 'admin',
        description: `Global kill-switch DEACTIVATED by ${actorEmail}: ${body.reason}`,
        metadata: { target: 'all', reason: body.reason, timestamp: now },
        ipAddress: c.req.header('CF-Connecting-IP') || '',
        userAgent: c.req.header('User-Agent') || '',
        severity: 'critical',
      });

      return c.json({
        success: true,
        target: 'all',
        audit_id: auditId,
        message: 'Global kill-switch deactivated. Users are no longer blocked.',
      });
    } else {
      const targetId = body.userId!;
      const targetUser = await blink.db.table<{ id: string; email: string; metadata: string }>('users').get(targetId);
      if (!targetUser) {
        return c.json({ error: 'Target user not found' }, 404);
      }

      const meta = parseMetadata(targetUser.metadata);
      meta.kill_switched = false;
      meta.kill_switch_reason = undefined;
      meta.kill_switch_at = undefined;
      meta.kill_switch_by = undefined;

      await blink.db.table('users').update(targetId, {
        metadata: JSON.stringify(meta),
      } as any);

      const auditId = `act_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await logActivity(blink, {
        userId: actorId,
        email: actorEmail,
        actionType: 'admin.kill_switch_deactivate',
        actionCategory: 'admin',
        description: `Kill-switch DEACTIVATED for user ${targetUser.email} by ${actorEmail}: ${body.reason}`,
        metadata: {
          target: 'user_id',
          targetUserId: targetId,
          targetEmail: targetUser.email,
          reason: body.reason,
          timestamp: now,
        },
        resourceType: 'user',
        resourceId: targetId,
        ipAddress: c.req.header('CF-Connecting-IP') || '',
        userAgent: c.req.header('User-Agent') || '',
        severity: 'critical',
      });

      return c.json({
        success: true,
        target: 'user_id',
        target_user_id: targetId,
        target_email: targetUser.email,
        audit_id: auditId,
        message: `User ${targetUser.email} kill-switch has been removed.`,
      });
    }
  } catch (err: any) {
    console.error('[commandCenter/kill-switch/deactivate] Error:', err.message);
    return c.json({ error: err.message || 'Internal error' }, 500);
  }
});

// ── 4. GET /api/command-center/kill-switch/status ──────────────────────────────

router.get('/api/command-center/kill-switch/status', async (c) => {
  const blink = getBlink(c.env);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const isAdminUser = isAdmin(auth.email);

  try {
    // First, resolve the global kill-switch state
    // Search across admin users' metadata for the global flag
    let globalActive = false;
    let globalReason: string | undefined;
    let globalAt: string | undefined;
    let globalBy: string | undefined;

    for (const adminEmail of ADMIN_EMAILS) {
      try {
        const users = await blink.db.table<{ id: string; email: string; metadata: string }>('users').list({
          where: { email: adminEmail },
          select: ['id', 'email', 'metadata'],
          limit: 1,
        });
        if (users.length > 0) {
          const meta = parseMetadata(users[0].metadata);
          if (meta.kill_switch_global === true) {
            globalActive = true;
            globalReason = meta.kill_switch_global_reason;
            globalAt = meta.kill_switch_global_at;
            globalBy = meta.kill_switch_global_by;
            break;
          }
        }
      } catch { /* continue to next admin email */ }
    }

    if (isAdminUser) {
      // Admin: return all kill-switched users + global state
      const allUsers = await blink.db.table<{
        id: string;
        email: string;
        display_name: string;
        metadata: string;
      }>('users').list({
        select: ['id', 'email', 'display_name', 'metadata'],
        limit: 500,
      });

      const killSwitchedUsers: Array<{
        user_id: string;
        email: string;
        display_name: string;
        switched_at?: string;
        switched_by?: string;
        reason?: string;
      }> = [];

      for (const u of allUsers as any[]) {
        const meta = parseMetadata(u.metadata);
        if (meta.kill_switched === true) {
          killSwitchedUsers.push({
            user_id: u.id,
            email: u.email || '',
            display_name: u.displayName || u.display_name || u.email?.split('@')[0] || '',
            switched_at: meta.kill_switch_at,
            switched_by: meta.kill_switch_by,
            reason: meta.kill_switch_reason,
          });
        }
        // If global kill-switch is active, all users are effectively kill-switched
        // but we only show explicit ones here; the global flag is surfaced separately
      }

      return c.json({
        global: {
          active: globalActive,
          reason: globalReason,
          switched_at: globalAt,
          switched_by: globalBy,
        },
        kill_switched_users: killSwitchedUsers,
        total_kill_switched: killSwitchedUsers.length + (globalActive ? allUsers.length : 0),
      });
    } else {
      // Regular user: return their own kill-switch state
      const userId = auth.userId;
      const user = await blink.db.table<{ id: string; metadata: string }>('users').get(userId);
      const meta = parseMetadata(user?.metadata);

      const state: KillSwitchState = {
        kill_switched: meta.kill_switched === true || globalActive,
        reason: meta.kill_switch_reason,
        switched_at: meta.kill_switch_at,
        switched_by: meta.kill_switch_by,
        covered_by_global: globalActive && meta.kill_switched !== true,
        global_state: {
          active: globalActive,
          reason: globalReason,
          switched_at: globalAt,
          switched_by: globalBy,
        },
      };

      return c.json(state);
    }
  } catch (err: any) {
    console.error('[commandCenter/kill-switch/status] Error:', err.message);
    return c.json({ error: err.message || 'Internal error' }, 500);
  }
});
