import { BACKEND_URL as KOMPILOT_BACKEND_URL } from '@/lib/backend';
/**
 * useActivityLogger — Frontend hook for logging user activities.
 *
 * Sends activity events to the backend `/api/activity/log` endpoint.
 * Fire-and-forget — never blocks the UI or throws.
 *
 * Usage:
 *   const { log } = useActivityLogger();
 *   log('content.post_created', { resourceType: 'post', resourceId: postId, description: 'Created a new post' });
 *
 *   // Or use the shorthand methods:
 *   logAuth('auth.login');
 *   logContent('content.post_scheduled', postId);
 *   logBilling('billing.plan_changed');
 */

import { useCallback, useRef } from 'react';
import { blink } from '../blink/client';

type ActivityCategory = 'auth' | 'content' | 'billing' | 'admin' | 'settings' | 'security' | 'api' | 'general';
type ActivitySeverity = 'info' | 'warning' | 'error' | 'critical';

interface LogOptions {
  actionCategory?: ActivityCategory;
  resourceType?: string;
  resourceId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  severity?: ActivitySeverity;
}

/**
 * Predefined action types for consistency.
 * Mirrors backend/lib/activityLogger.ts ACTIONS.
 */
export const ACTIVITY_ACTIONS = {
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

/**
 * Get the backend URL for the current project.
 */
function getBackendUrl(): string {
  return KOMPILOT_BACKEND_URL;
}

export function useActivityLogger() {
  const pendingRef = useRef<Promise<any>[]>([]);

  /**
   * Core log function — fire-and-forget.
   */
  const log = useCallback(async (actionType: string, options: LogOptions = {}) => {
    try {
      const token = await blink.auth.getValidToken().catch(() => null);
      if (!token) return; // Silent skip if not authenticated

      const p = fetch(`${getBackendUrl()}/api/activity/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          actionType,
          actionCategory: options.actionCategory || actionType.split('.')[0],
          resourceType: options.resourceType,
          resourceId: options.resourceId,
          description: options.description,
          metadata: options.metadata,
          severity: options.severity || 'info',
        }),
      }).catch(() => {}); // Silent swallow

      pendingRef.current.push(p);
      p.finally(() => {
        pendingRef.current = pendingRef.current.filter(x => x !== p);
      });
    } catch {
      // Silent swallow — logging must never break the app
    }
  }, []);

  // ── Category helpers ─────────────────────────────────────────────────────

  const logAuth = useCallback((action: string, options?: Omit<LogOptions, 'actionCategory'>) => {
    return log(action, { ...options, actionCategory: 'auth' });
  }, [log]);

  const logContent = useCallback((action: string, resourceId?: string, options?: Omit<LogOptions, 'actionCategory' | 'resourceId'>) => {
    return log(action, { ...options, actionCategory: 'content', resourceType: 'post', resourceId });
  }, [log]);

  const logBilling = useCallback((action: string, options?: Omit<LogOptions, 'actionCategory'>) => {
    return log(action, { ...options, actionCategory: 'billing' });
  }, [log]);

  const logSettings = useCallback((action: string, options?: Omit<LogOptions, 'actionCategory'>) => {
    return log(action, { ...options, actionCategory: 'settings' });
  }, [log]);

  const logSecurity = useCallback((action: string, options?: Omit<LogOptions, 'actionCategory'>) => {
    return log(action, { ...options, actionCategory: 'security', severity: options?.severity || 'warning' });
  }, [log]);

  const logAdmin = useCallback((action: string, options?: Omit<LogOptions, 'actionCategory'>) => {
    return log(action, { ...options, actionCategory: 'admin' });
  }, [log]);

  /**
   * Send an email notification via the backend.
   */
  const sendEmail = useCallback(async (
    type: 'welcome' | 'password_reset' | 'security_alert' | 'subscription_change' | 'admin_alert',
    params: Record<string, any>,
  ) => {
    try {
      const token = await blink.auth.getValidToken().catch(() => null);
      if (!token) return;

      fetch(`${getBackendUrl()}/api/activity/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ type, params }),
      }).catch(() => {});
    } catch {
      // Silent swallow
    }
  }, []);

  return {
    log,
    logAuth,
    logContent,
    logBilling,
    logSettings,
    logSecurity,
    logAdmin,
    sendEmail,
    ACTIONS: ACTIVITY_ACTIONS,
  };
}
