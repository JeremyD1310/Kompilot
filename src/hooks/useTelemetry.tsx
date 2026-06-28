/**
 * useTelemetry — Lightweight event tracking for customer care health scoring.
 *
 * Reports key user actions to the backend without impacting performance.
 * Non-blocking: fires-and-forgets, never blocks the UI.
 *
 * Usage:
 *   const track = useTelemetry();
 *   track('creative_studio_generation_click', { type: 'ugc_script' });
 *   track('api_connection_failed', { integration: 'meta', error: 'token_expired' });
 */
import { useCallback, useRef } from 'react';
import { blink } from '../blink/client';

// ── Event types ───────────────────────────────────────────────────────────────

export type TelemetryEvent =
  | 'api_connection_failed'
  | 'api_connection_restored'
  | 'creative_studio_generation_click'
  | 'creative_studio_generation_complete'
  | 'creative_studio_generation_error'
  | 'campaign_calendar_export'
  | 'campaign_calendar_post_created'
  | 'inbox_reply_sent'
  | 'inbox_ai_draft_used'
  | 'review_reply_sent'
  | 'review_ai_draft_used'
  | 'onboarding_step_completed'
  | 'onboarding_skipped'
  | 'sandbox_toggle_activated'
  | 'paywall_viewed'
  | 'credit_pack_clicked'
  | 'share_case_study_exported'
  | 'account_health_banner_viewed'
  | 'account_health_banner_cta_clicked';

export interface TelemetryPayload {
  [key: string]: string | number | boolean | undefined;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Rate-limited telemetry hook. Max 1 event per 500ms to prevent spam.
 * Events are sent to the backend's observability_logs table.
 */
export function useTelemetry() {
  const lastEventTime = useRef(0);

  const track = useCallback(async (event: TelemetryEvent, payload?: TelemetryPayload) => {
    // Rate limit: 500ms cooldown
    const now = Date.now();
    if (now - lastEventTime.current < 500) return;
    lastEventTime.current = now;

    // Fire-and-forget — never block the UI
    try {
      const user = await blink.auth.me().catch(() => null);
      const userId = user?.id || 'anonymous';

      await (blink.db as any).observabilityLogs.create({
        id: `tel_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId,
        action: event,
        provider: 'frontend_telemetry',
        errorMessage: 'ok',
        metadata: JSON.stringify({
          ...payload,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent.slice(0, 100),
          url: window.location.pathname,
        }),
        severity: event.includes('failed') || event.includes('error') ? 'warn' : 'info',
      });
    } catch {
      // Silently ignore — telemetry should never break the app
    }
  }, []);

  return track;
}

// ── HOC: Track page views automatically ───────────────────────────────────────

/**
 * Wrap a component to automatically fire a page_view event on mount.
 * Usage: const TrackedPage = withPageTracking(MyPage, 'dashboard');
 */
export function withPageTracking<P extends object>(
  Component: React.ComponentType<P>,
  pageName: string,
) {
  return function TrackedComponent(props: P) {
    const track = useTelemetry();
    const tracked = useRef(false);

    if (!tracked.current) {
      tracked.current = true;
      // Don't await — fire and forget
      track('account_health_banner_viewed', { page: pageName });
    }

    return <Component {...props} />;
  };
}
