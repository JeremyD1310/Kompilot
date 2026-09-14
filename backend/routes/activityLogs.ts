/**
 * Activity Logs API Routes
 *
 * POST /api/activity/log           — Log a user activity (fire-and-forget)
 * POST /api/activity/batch         — Log multiple activities at once
 * GET  /api/activity/logs          — Query activity logs (admin only)
 * GET  /api/activity/stats         — Activity statistics (admin only)
 * GET  /api/activity/emails        — Email notification log (admin only)
 * POST /api/activity/email/send    — Send a notification email (key events)
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createClient } from '@blinkdotnew/sdk';
import { logActivity, ACTIONS, type LogActivityParams, type ActivityCategory, type ActivitySeverity } from '../lib/activityLogger';
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendSecurityAlert,
  sendSubscriptionChangeEmail,
  sendAdminAlert,
} from '../lib/emailNotificationService';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

router.use('*', cors());

const getBlink = (env: Env) =>
  createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });

const ADMIN_EMAILS = ['jeremy@kompilot.fr', 'romain@kompilot.fr', 'valentine@kompilot.fr', 'admin@kompilot.com'];

function isAdminEmail(email?: string): boolean {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  return ADMIN_EMAILS.includes(lower) || lower.endsWith('@kompilot.fr');
}

// ── POST /api/activity/log — Log a single activity ─────────────────────────

router.post('/api/activity/log', async (c) => {
  try {
    const blink = getBlink(c.env);
    const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
    if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

    const body = await c.req.json<{
      actionType: string;
      actionCategory?: string;
      resourceType?: string;
      resourceId?: string;
      description?: string;
      metadata?: Record<string, unknown>;
      severity?: string;
    }>();

    if (!body.actionType) return c.json({ error: 'Missing actionType' }, 400);

    await logActivity(blink, {
      userId: auth.userId,
      email: auth.email || '',
      actionType: body.actionType,
      actionCategory: (body.actionCategory as ActivityCategory) || 'general',
      resourceType: body.resourceType,
      resourceId: body.resourceId,
      description: body.description,
      metadata: body.metadata,
      ipAddress: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || '',
      userAgent: c.req.header('User-Agent') || '',
      severity: (body.severity as ActivitySeverity) || 'info',
    });

    return c.json({ success: true });
  } catch (err: any) {
    console.error('[ActivityRoute] Error:', err);
    return c.json({ error: err?.message || 'Internal error' }, 500);
  }
});

// ── POST /api/activity/batch — Log multiple activities ─────────────────────

router.post('/api/activity/batch', async (c) => {
  try {
    const blink = getBlink(c.env);
    const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
    if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

    const body = await c.req.json<{ items: LogActivityParams[] }>();
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return c.json({ error: 'Missing items array' }, 400);
    }

    const items = body.items.slice(0, 50);
    await Promise.allSettled(
      items.map((item) =>
        logActivity(blink, {
          ...item,
          userId: item.userId || auth.userId,
          email: item.email || auth.email || '',
          ipAddress: c.req.header('CF-Connecting-IP') || '',
          userAgent: c.req.header('User-Agent') || '',
        }),
      ),
    );

    return c.json({ success: true, logged: items.length });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Internal error' }, 500);
  }
});

// ── GET /api/activity/logs — Query logs (admin only) ───────────────────────

router.get('/api/activity/logs', async (c) => {
  try {
    const blink = getBlink(c.env);
    const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
    if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);
    if (!isAdminEmail(auth.email)) return c.json({ error: 'Admin access required' }, 403);

    const userId = c.req.query('userId');
    const actionType = c.req.query('actionType');
    const category = c.req.query('category');
    const severity = c.req.query('severity');
    const limit = Math.min(parseInt(c.req.query('limit') || '100', 10), 500);
    const offset = parseInt(c.req.query('offset') || '0', 10);

    const where: Record<string, any> = {};
    if (userId) where.user_id = userId;
    if (actionType) where.action_type = actionType;
    if (category) where.action_category = category;
    if (severity) where.severity = severity;

    const logs = await blink.db.table<any>('user_activity_logs').list({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { created_at: 'desc' },
      limit,
      offset,
    });

    const countResult = await blink.db.table<any>('user_activity_logs').count({
      where: Object.keys(where).length > 0 ? where : undefined,
    });

    return c.json({ logs, total: countResult.count || logs.length, limit, offset });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Internal error' }, 500);
  }
});

// ── GET /api/activity/stats — Activity statistics (admin only) ─────────────

router.get('/api/activity/stats', async (c) => {
  try {
    const blink = getBlink(c.env);
    const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
    if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);
    if (!isAdminEmail(auth.email)) return c.json({ error: 'Admin access required' }, 403);

    const allLogs = await blink.db.table<any>('user_activity_logs').list({ limit: 2000 });
    const total = allLogs.length;

    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byAction: Record<string, number> = {};
    const byDay: Record<string, number> = {};

    for (const log of allLogs) {
      byCategory[log.action_category] = (byCategory[log.action_category] || 0) + 1;
      bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;
      byAction[log.action_type] = (byAction[log.action_type] || 0) + 1;
      const day = (log.created_at || '').slice(0, 10);
      if (day) byDay[day] = (byDay[day] || 0) + 1;
    }

    return c.json({ total, byCategory, bySeverity, byAction, byDay });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Internal error' }, 500);
  }
});

// ── GET /api/activity/emails — Email notification log (admin only) ─────────

router.get('/api/activity/emails', async (c) => {
  try {
    const blink = getBlink(c.env);
    const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
    if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);
    if (!isAdminEmail(auth.email)) return c.json({ error: 'Admin access required' }, 403);

    const limit = Math.min(parseInt(c.req.query('limit') || '100', 10), 500);
    const emails = await blink.db.table<any>('email_notification_log').list({
      orderBy: { created_at: 'desc' },
      limit,
    });

    return c.json({ emails, total: emails.length });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Internal error' }, 500);
  }
});

// ── POST /api/activity/email/send — Send notification email ────────────────

router.post('/api/activity/email/send', async (c) => {
  try {
    const blink = getBlink(c.env);
    const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
    if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

    const body = await c.req.json<{
      type: 'welcome' | 'password_reset' | 'security_alert' | 'subscription_change' | 'admin_alert';
      params: Record<string, any>;
    }>();

    switch (body.type) {
      case 'welcome':
        await sendWelcomeEmail(blink, body.params);
        break;
      case 'password_reset':
        await sendPasswordResetEmail(blink, body.params);
        break;
      case 'security_alert':
        await sendSecurityAlert(blink, body.params);
        break;
      case 'subscription_change':
        await sendSubscriptionChangeEmail(blink, body.params);
        break;
      case 'admin_alert':
        await sendAdminAlert(blink, body.params);
        break;
      default:
        return c.json({ error: 'Unknown email type' }, 400);
    }

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Internal error' }, 500);
  }
});

export { ACTIONS };
