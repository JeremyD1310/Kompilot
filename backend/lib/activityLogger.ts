/**
 * ActivityLogger — Server-side audit logging for user actions.
 *
 * Writes to `user_activity_logs` table (Blink DB).
 * Provides structured logging for security, compliance, and debugging.
 *
 * Usage:
 *   await logActivity(blink, {
 *     userId: 'user_123',
 *     email: 'user@example.com',
 *     actionType: 'auth.login',
 *     actionCategory: 'auth',
 *     description: 'User logged in via email',
 *     severity: 'info',
 *   });
 */

export type ActivityCategory =
  | 'auth'
  | 'content'
  | 'billing'
  | 'admin'
  | 'settings'
  | 'security'
  | 'api'
  | 'general';

export type ActivitySeverity = 'info' | 'warning' | 'error' | 'critical';

export interface LogActivityParams {
  userId: string;
  email?: string;
  actionType: string;
  actionCategory?: ActivityCategory;
  resourceType?: string;
  resourceId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  severity?: ActivitySeverity;
}

interface BlinkClient {
  db: {
    table: <T>(name: string) => {
      create: (data: Partial<T>) => Promise<T>;
      list: (opts?: any) => Promise<T[]>;
      count: (opts?: any) => Promise<{ count: number }>;
    };
  };
}

/**
 * Log a user activity event. Fire-and-forget — never throws.
 */
export async function logActivity(
  blink: BlinkClient,
  params: LogActivityParams,
): Promise<void> {
  try {
    await blink.db.table<{ id: string }>('user_activity_logs').create({
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      user_id: params.userId,
      email: params.email || '',
      action_type: params.actionType,
      action_category: params.actionCategory || 'general',
      resource_type: params.resourceType || '',
      resource_id: params.resourceId || '',
      description: params.description || '',
      metadata: JSON.stringify(params.metadata || {}),
      ip_address: params.ipAddress || '',
      user_agent: params.userAgent || '',
      session_id: params.sessionId || '',
      severity: params.severity || 'info',
    } as any);
  } catch (err) {
    // Never let logging failures break the main flow
    console.error('[ActivityLogger] Failed to log:', err);
  }
}

/**
 * Predefined action types for consistency across the app.
 */
export const ACTIONS = {
  // Auth
  AUTH_LOGIN: 'auth.login',
  AUTH_SIGNUP: 'auth.signup',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_PASSWORD_RESET_REQUEST: 'auth.password_reset_request',
  AUTH_PASSWORD_RESET_COMPLETE: 'auth.password_reset_complete',
  AUTH_EMAIL_VERIFIED: 'auth.email_verified',
  AUTH_FAILED_LOGIN: 'auth.failed_login',
  AUTH_SESSION_EXPIRED: 'auth.session_expired',
  AUTH_GOOGLE_LOGIN: 'auth.google_login',

  // Content
  CONTENT_POST_CREATED: 'content.post_created',
  CONTENT_POST_SCHEDULED: 'content.post_scheduled',
  CONTENT_POST_PUBLISHED: 'content.post_published',
  CONTENT_POST_DELETED: 'content.post_deleted',
  CONTENT_POST_FAILED: 'content.post_failed',
  CONTENT_AI_GENERATED: 'content.ai_generated',
  CONTENT_IMAGE_UPLOADED: 'content.image_uploaded',

  // Reviews
  REVIEW_REPLY_SENT: 'review.reply_sent',
  REVIEW_REQUEST_SENT: 'review.request_sent',

  // Inbox
  INBOX_MESSAGE_READ: 'inbox.message_read',
  INBOX_REPLY_SENT: 'inbox.reply_sent',

  // Billing
  BILLING_SUBSCRIPTION_STARTED: 'billing.subscription_started',
  BILLING_SUBSCRIPTION_CANCELLED: 'billing.subscription_cancelled',
  BILLING_PAYMENT_FAILED: 'billing.payment_failed',
  BILLING_PLAN_CHANGED: 'billing.plan_changed',
  BILLING_CREDIT_PURCHASED: 'billing.credit_purchased',

  // Settings
  SETTINGS_PROFILE_UPDATED: 'settings.profile_updated',
  SETTINGS_PASSWORD_CHANGED: 'settings.password_changed',
  SETTINGS_ESTABLISHMENT_CREATED: 'settings.establishment_created',
  SETTINGS_TEAM_MEMBER_INVITED: 'settings.team_member_invited',
  SETTINGS_API_KEY_CONFIGURED: 'settings.api_key_configured',

  // Security
  SECURITY_SUSPICIOUS_ACTIVITY: 'security.suspicious_activity',
  SECURITY_RATE_LIMIT_HIT: 'security.rate_limit_hit',
  SECURITY_UNAUTHORIZED_ACCESS: 'security.unauthorized_access',

  // Admin
  ADMIN_IMPERSONATE_START: 'admin.impersonate_start',
  ADMIN_IMPERSONATE_STOP: 'admin.impersonate_stop',
  ADMIN_USER_BLOCKED: 'admin.user_blocked',
  ADMIN_SETTINGS_CHANGED: 'admin.settings_changed',
} as const;
