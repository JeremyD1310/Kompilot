/**
 * activityClient — Standalone client-side activity logger.
 *
 * Unlike useActivityLogger (hook), this can be called from non-component code
 * like utility functions, event handlers outside React, and auth callbacks.
 *
 * Usage:
 *   import { logActivityClient, sendEmailNotification } from '../lib/activityClient';
 *   logActivityClient('auth.login', { description: 'User logged in via email' });
 */

import { blink } from '../blink/client';

const BACKEND_URL = 'https://gbrhsehk.backend.blink.new';

interface LogOptions {
  actionCategory?: string;
  resourceType?: string;
  resourceId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}

/**
 * Log a user activity event. Fire-and-forget — never throws.
 */
export async function logActivityClient(
  actionType: string,
  options: LogOptions = {},
): Promise<void> {
  try {
    const token = await blink.auth.getValidToken().catch(() => null);
    if (!token) return;

    fetch(`${BACKEND_URL}/api/activity/log`, {
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
    }).catch(() => {});
  } catch {
    // Silent swallow — logging must never break the app
  }
}

/**
 * Send an email notification via the backend.
 */
export async function sendEmailNotification(
  type: 'welcome' | 'password_reset' | 'security_alert' | 'subscription_change' | 'admin_alert',
  params: Record<string, any>,
): Promise<void> {
  try {
    const token = await blink.auth.getValidToken().catch(() => null);
    if (!token) return;

    fetch(`${BACKEND_URL}/api/activity/email/send`, {
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
}

/**
 * Predefined action types.
 */
export const ACTIONS = {
  AUTH_LOGIN: 'auth.login',
  AUTH_SIGNUP: 'auth.signup',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_PASSWORD_RESET_REQUEST: 'auth.password_reset_request',
  AUTH_PASSWORD_RESET_COMPLETE: 'auth.password_reset_complete',
  AUTH_EMAIL_VERIFIED: 'auth.email_verified',
  AUTH_FAILED_LOGIN: 'auth.failed_login',
  AUTH_GOOGLE_LOGIN: 'auth.google_login',
  CONTENT_POST_CREATED: 'content.post_created',
  CONTENT_POST_SCHEDULED: 'content.post_scheduled',
  CONTENT_POST_PUBLISHED: 'content.post_published',
  CONTENT_AI_GENERATED: 'content.ai_generated',
  BILLING_SUBSCRIPTION_STARTED: 'billing.subscription_started',
  BILLING_SUBSCRIPTION_CANCELLED: 'billing.subscription_cancelled',
  BILLING_PAYMENT_FAILED: 'billing.payment_failed',
  BILLING_PLAN_CHANGED: 'billing.plan_changed',
  SETTINGS_PROFILE_UPDATED: 'settings.profile_updated',
  SETTINGS_PASSWORD_CHANGED: 'settings.password_changed',
  SETTINGS_TEAM_MEMBER_INVITED: 'settings.team_member_invited',
  SECURITY_SUSPICIOUS_ACTIVITY: 'security.suspicious_activity',
  SECURITY_FAILED_LOGIN: 'security.failed_login',
  ADMIN_IMPERSONATE_START: 'admin.impersonate_start',
  ADMIN_IMPERSONATE_STOP: 'admin.impersonate_stop',
} as const;
