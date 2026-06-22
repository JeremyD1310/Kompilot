/**
 * src/firebase/analytics.ts
 * Firebase Analytics event helpers for Kompilot.
 * All events follow the GA4 naming convention.
 * Functions are no-ops when Firebase is not configured.
 */
import { logEvent } from 'firebase/analytics';
import { getFirebaseAnalytics } from './client';

type EventParams = Record<string, string | number | boolean | undefined>;

async function track(eventName: string, params?: EventParams) {
  try {
    const analytics = await getFirebaseAnalytics();
    if (!analytics) return;
    logEvent(analytics, eventName, params);
  } catch (e) {
    // Silently fail — analytics should never crash the app
  }
}

// ── Auth events ──────────────────────────────────────────────────────────────

export const analyticsTrackSignup = (method: 'email' | 'google' | 'apple') =>
  track('sign_up', { method });

export const analyticsTrackLogin = (method: 'email' | 'google' | 'apple') =>
  track('login', { method });

export const analyticsTrackLogout = () =>
  track('user_logout');

// ── Onboarding events ────────────────────────────────────────────────────────

export const analyticsTrackOnboardingStart = () =>
  track('onboarding_start');

export const analyticsTrackOnboardingComplete = (sector: string) =>
  track('onboarding_complete', { sector });

// ── Content events ───────────────────────────────────────────────────────────

export const analyticsTrackPostCreated = (channel: string, status: string) =>
  track('post_created', { channel, status });

export const analyticsTrackPostPublished = (channel: string) =>
  track('post_published', { channel });

export const analyticsTrackPostScheduled = (channel: string) =>
  track('post_scheduled', { channel });

// ── Reviews events ───────────────────────────────────────────────────────────

export const analyticsTrackReviewReplied = (rating: number, platform: string) =>
  track('review_replied', { rating, platform });

export const analyticsTrackReviewRaidDetected = (count: number) =>
  track('review_raid_detected', { count });

// ── Geo / Visibility events ──────────────────────────────────────────────────

export const analyticsTrackGeoScan = (score: number, sector: string) =>
  track('geo_scan_complete', { score, sector });

export const analyticsTrackVisibilityScoreChange = (from: number, to: number) =>
  track('visibility_score_change', { from, to, delta: to - from });

// ── Agency events ────────────────────────────────────────────────────────────

export const analyticsTrackClientAdded = () =>
  track('agency_client_added');

export const analyticsTrackReportGenerated = (clientCount: number) =>
  track('agency_report_generated', { client_count: clientCount });

export const analyticsTrackCoworkMessage = (space: 'agence' | 'pro') =>
  track('cowork_message_sent', { space });

// ── Subscription events ──────────────────────────────────────────────────────

export const analyticsTrackUpgradeClick = (plan: string, source: string) =>
  track('upgrade_click', { plan, source });

export const analyticsTrackCheckoutStart = (plan: string, amount: number) =>
  track('begin_checkout', { plan, value: amount, currency: 'EUR' });

export const analyticsTrackSubscriptionActivated = (plan: string) =>
  track('purchase', { plan });

// ── Page view ────────────────────────────────────────────────────────────────

export const analyticsTrackPageView = (pageName: string, path: string) =>
  track('page_view', { page_title: pageName, page_path: path });

// ── SMS events ───────────────────────────────────────────────────────────────

export const analyticsTrackSMSSent = (count: number) =>
  track('sms_sent', { count });

// ── Generic ─────────────────────────────────────────────────────────────────

export const analyticsTrackEvent = (eventName: string, params?: EventParams) =>
  track(eventName, params);
