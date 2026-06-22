/**
 * reviewRaidDetector.ts — Server-side Review Raid Detection
 *
 * Rule: if a pro account receives more than 10 negative reviews (rating ≤ 2)
 * within a rolling 1-hour window, the account is flagged as "Raid Alert":
 *   - AI auto-responses are suspended for this establishment
 *   - An alert event is persisted in daily_analytics.extended_data
 *   - The route returns { raidDetected: true } so the client shows the banner
 *
 * Storage: daily_analytics.extended_data JSON field stores raid_events array.
 * The check window is purely in-memory for performance (sliding window per call).
 */

import { createClient } from '@blinkdotnew/sdk';

const RAID_THRESHOLD = 10;   // negative reviews in the window
const RAID_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function getBlink(env: Record<string, string>) {
  return createClient({
    projectId: env.BLINK_PROJECT_ID,
    secretKey: env.BLINK_SECRET_KEY,
  });
}

export interface ReviewEvent {
  id: string;
  rating: number;
  receivedAt: string; // ISO
  authorName?: string;
  text?: string;
}

export interface RaidCheckResult {
  raidDetected: boolean;
  negativeCountInWindow: number;
  threshold: number;
  windowHours: number;
  automationSuspended: boolean;
  detectedAt: string | null;
  suspiciousReviews: ReviewEvent[];
}

/**
 * Checks if a raid has occurred based on submitted recent reviews.
 * Also persists the raid state to daily_analytics for audit.
 *
 * @param env - CF Worker env bindings
 * @param userId - authenticated user ID
 * @param establishmentId - establishment being checked
 * @param recentReviews - array of recent review events to analyze
 */
export async function checkReviewRaid(
  env: Record<string, string>,
  userId: string,
  establishmentId: string,
  recentReviews: ReviewEvent[],
): Promise<RaidCheckResult> {
  const blink = getBlink(env);
  const now = Date.now();
  const windowStart = now - RAID_WINDOW_MS;

  // Filter: negative reviews (≤2★) received within the last hour
  const negativeInWindow = recentReviews.filter(r => {
    if (r.rating > 2) return false;
    const ts = new Date(r.receivedAt).getTime();
    return !isNaN(ts) && ts >= windowStart;
  });

  const raidDetected = negativeInWindow.length >= RAID_THRESHOLD;
  const detectedAt = raidDetected ? new Date().toISOString() : null;

  // Persist raid event to daily_analytics for admin audit trail
  if (raidDetected) {
    try {
      const snapshotDate = new Date().toISOString().slice(0, 10);
      const recordId = `da_${userId}_${establishmentId}_${snapshotDate}`;

      const rows = await blink.db.dailyAnalytics.list({
        where: { id: recordId },
        limit: 1,
      });
      const existing = rows?.[0] as any;

      const extendedData = existing?.extendedData
        ? (typeof existing.extendedData === 'string'
            ? JSON.parse(existing.extendedData)
            : existing.extendedData)
        : {};

      const raidEvents: any[] = extendedData.raid_events ?? [];
      raidEvents.push({
        detectedAt,
        negativeCount: negativeInWindow.length,
        threshold: RAID_THRESHOLD,
        suspiciousIds: negativeInWindow.map(r => r.id),
        automationSuspended: true,
      });
      // Keep last 20 raid events
      if (raidEvents.length > 20) raidEvents.splice(0, raidEvents.length - 20);

      const newExtended = JSON.stringify({
        ...extendedData,
        raid_events: raidEvents,
        last_raid_at: detectedAt,
        automation_suspended: true,
      });

      if (existing) {
        await blink.db.dailyAnalytics.update(recordId, {
          unhandledReviews: (Number(existing.unhandledReviews) || 0) + negativeInWindow.length,
          extendedData: newExtended,
        });
      } else {
        await blink.db.dailyAnalytics.create({
          id: recordId,
          establishmentId,
          userId,
          snapshotDate,
          geoScore: 0,
          unhandledReviews: negativeInWindow.length,
          postsPublished: 0,
          reviewsHandled: 0,
          smsSent: 0,
          localVisibility: 0,
          missingKeywords: '[]',
          noshowRevenueCents: 0,
          extendedData: newExtended,
        });
      }
    } catch (persistErr) {
      // Non-fatal: log but don't fail the detection
      console.error('[reviewRaidDetector] Failed to persist raid event:', persistErr);
    }
  }

  return {
    raidDetected,
    negativeCountInWindow: negativeInWindow.length,
    threshold: RAID_THRESHOLD,
    windowHours: RAID_WINDOW_MS / (60 * 60 * 1000),
    automationSuspended: raidDetected,
    detectedAt,
    suspiciousReviews: negativeInWindow,
  };
}

/**
 * Read-only: get the current raid state for an establishment from DB.
 */
export async function getRaidState(
  env: Record<string, string>,
  userId: string,
  establishmentId: string,
): Promise<{ raidActive: boolean; detectedAt: string | null; automationSuspended: boolean }> {
  const blink = getBlink(env);
  try {
    const snapshotDate = new Date().toISOString().slice(0, 10);
    const recordId = `da_${userId}_${establishmentId}_${snapshotDate}`;

    const rows = await blink.db.dailyAnalytics.list({
      where: { id: recordId },
      limit: 1,
    });
    const existing = rows?.[0] as any;
    if (!existing) return { raidActive: false, detectedAt: null, automationSuspended: false };

    const ext = existing.extendedData
      ? (typeof existing.extendedData === 'string'
          ? JSON.parse(existing.extendedData)
          : existing.extendedData)
      : {};

    return {
      raidActive: !!ext.last_raid_at,
      detectedAt: ext.last_raid_at ?? null,
      automationSuspended: !!ext.automation_suspended,
    };
  } catch {
    return { raidActive: false, detectedAt: null, automationSuspended: false };
  }
}

/**
 * Clear raid state (manual dismiss by user).
 */
export async function clearRaidState(
  env: Record<string, string>,
  userId: string,
  establishmentId: string,
): Promise<void> {
  const blink = getBlink(env);
  try {
    const snapshotDate = new Date().toISOString().slice(0, 10);
    const recordId = `da_${userId}_${establishmentId}_${snapshotDate}`;
    const rows = await blink.db.dailyAnalytics.list({ where: { id: recordId }, limit: 1 });
    const existing = rows?.[0] as any;
    if (!existing) return;

    const ext = existing.extendedData
      ? (typeof existing.extendedData === 'string'
          ? JSON.parse(existing.extendedData)
          : existing.extendedData)
      : {};

    await blink.db.dailyAnalytics.update(recordId, {
      extendedData: JSON.stringify({
        ...ext,
        automation_suspended: false,
        raid_cleared_at: new Date().toISOString(),
      }),
    });
  } catch (e) {
    console.error('[reviewRaidDetector] Failed to clear raid state:', e);
  }
}
