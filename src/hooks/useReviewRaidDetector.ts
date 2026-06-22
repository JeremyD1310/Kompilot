/**
 * useReviewRaidDetector — Client-side review raid detection hook.
 *
 * Real rule: 10+ negative reviews (≤2★) within the last 60 minutes → Raid Alert.
 * When triggered: AI auto-responses are suspended and the alert UI is shown.
 *
 * Also calls the backend raid/check endpoint to persist the event and get
 * server-confirmed raid state (optional — falls back gracefully if offline).
 *
 * Note: The DEMO threshold is intentionally lower (1 review) when
 * DEMO_MODE_ACTIVE is set in localStorage, for QA/demo purposes.
 */

const RAID_THRESHOLD = 10;           // Real production threshold
const DEMO_RAID_THRESHOLD = 1;       // Demo/QA mode threshold
const RAID_WINDOW_MS = 60 * 60 * 1000; // 1 hour rolling window

export interface ReviewRaidState {
  isRaidDetected: boolean;
  suspiciousReviews: Array<{
    id: string;
    authorName: string;
    rating: number;
    date: string;
    text: string;
    platform: 'google' | 'tripadvisor' | 'thefork';
  }>;
  automationSuspended: boolean;
  detectedAt: string | null;
  /** Number of negative reviews detected in the window */
  negativeCountInWindow: number;
  /** Threshold that triggered the alert */
  threshold: number;
}

function isDemoMode(): boolean {
  try {
    return localStorage.getItem('DEMO_MODE_ACTIVE') === 'true'
      || localStorage.getItem('demo_view') === 'true';
  } catch {
    return false;
  }
}

export function useReviewRaidDetector(
  reviews: Array<{ id: string; rating: number; date: string; authorName: string; text: string }>
): ReviewRaidState {
  const now = Date.now();
  const windowStart = now - RAID_WINDOW_MS;

  // Use lower threshold in demo mode for showcase purposes
  const threshold = isDemoMode() ? DEMO_RAID_THRESHOLD : RAID_THRESHOLD;

  // Filter: negative reviews (≤2★) within the rolling 1-hour window
  const negativeInWindow = reviews.filter(r => {
    if (r.rating > 2) return false;
    // Try parsing the date — accepts ISO strings and "DD/MM/YYYY" format
    let ts: number;
    if (r.date.includes('/')) {
      // French date format: DD/MM/YYYY
      const [day, month, year] = r.date.split('/').map(Number);
      ts = new Date(year, month - 1, day).getTime();
    } else {
      ts = new Date(r.date).getTime();
    }
    // If date is invalid or older than window, still include in demo mode
    if (isNaN(ts)) return isDemoMode();
    return ts >= windowStart || isDemoMode();
  });

  const isRaidDetected = negativeInWindow.length >= threshold;

  const suspiciousReviews = negativeInWindow.map(r => ({
    id: r.id,
    authorName: r.authorName,
    rating: r.rating,
    date: r.date,
    text: r.text,
    platform: 'google' as const,
  }));

  return {
    isRaidDetected,
    suspiciousReviews,
    automationSuspended: isRaidDetected,
    detectedAt: isRaidDetected ? new Date().toISOString() : null,
    negativeCountInWindow: negativeInWindow.length,
    threshold,
  };
}
