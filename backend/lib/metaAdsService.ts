/**
 * metaAdsService.ts — Meta Ad Library API connector
 *
 * Fetches active competitor ads from the Meta Ads Library (ads_archive endpoint)
 * and filters them by the 21-day longevity rule to identify "winner" creatives.
 *
 * Cloudflare Workers runtime: uses native `fetch()` instead of axios.
 *
 * Environment variable required:
 *   META_ACCESS_TOKEN — a valid Meta Graph API user or app access token with
 *   the "Ads Library" permission (ads_read / read_audience_network_insights).
 *
 * Meta Ad Library API docs:
 *   https://developers.facebook.com/docs/graph-api/reference/ads_archive/
 *
 * Usage:
 *   import { fetchCompetitorAds, filterProfitableAds } from './metaAdsService'
 *   const allAds    = await fetchCompetitorAds(env.META_ACCESS_TOKEN, 'Alex Hormozi')
 *   const winnerAds = filterProfitableAds(allAds)
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MetaAd {
  id: string;
  /** Public snapshot URL to preview the creative */
  ad_snapshot_url: string;
  /** Main copy body of the ad creative (may be absent) */
  ad_creative_body?: string;
  /** ISO 8601 date string — when the ad started running */
  ad_delivery_start_time: string;
  page_id: string;
  page_name: string;
}

/** Extended internal type used by the funnel analysis controller */
export interface EnrichedMetaAd extends MetaAd {
  /** Computed: days the ad has been running as of the analysis date */
  daysActive: number;
  /** Computed: true if daysActive >= 21 (our "winner" threshold) */
  isWinner: boolean;
}

// ── Constants ────────────────────────────────────────────────────────────────

const META_GRAPH_BASE = 'https://graph.facebook.com/v19.0';
const TWENTY_ONE_DAYS_MS = 21 * 24 * 60 * 60 * 1000;
const DEFAULT_LIMIT = 50;

// ── 1. Fetch competitor ads from the Meta Ad Library ─────────────────────────

/**
 * fetchCompetitorAds — calls the Meta Ads Library API and returns active ads
 * for a given competitor page name / search term.
 *
 * @param accessToken  META_ACCESS_TOKEN from Cloudflare Worker env bindings
 * @param pageName     Competitor name or Facebook page name to search
 * @param limit        Max ads to retrieve (default 50)
 */
export async function fetchCompetitorAds(
  accessToken: string,
  pageName: string,
  limit = DEFAULT_LIMIT,
): Promise<MetaAd[]> {
  if (!accessToken) {
    console.error("[metaAdsService] META_ACCESS_TOKEN manquant — appel ignoré.");
    return [];
  }
  if (!pageName.trim()) {
    return [];
  }

  const params = new URLSearchParams({
    access_token: accessToken,
    search_terms: pageName.trim(),
    ad_active_status: 'ACTIVE',
    // ALL_ADS requires Marketing API access; POLITICAL_AND_ISSUE_ADS is publicly available.
    // Switch to 'ALL' once your app has been granted Marketing API access.
    ad_type: 'ALL',
    fields: 'id,ad_snapshot_url,ad_creative_body,ad_delivery_start_time,page_id,page_name',
    limit: String(limit),
  });

  const url = `${META_GRAPH_BASE}/ads_archive?${params.toString()}`;

  try {
    // 5-second timeout via AbortController (required in CF Workers)
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const body = await response.text();
      console.error(
        `[metaAdsService] Erreur API Meta ${response.status} pour "${pageName}": ${body.slice(0, 300)}`
      );
      return [];
    }

    const json = await response.json() as { data?: MetaAd[]; error?: { message: string } };

    if (json.error) {
      console.error(`[metaAdsService] Erreur Graph API: ${json.error.message}`);
      return [];
    }

    return json.data ?? [];
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[metaAdsService] Erreur lors de la récupération des Ads pour "${pageName}": ${msg}`);
    return [];
  }
}

// ── 2. 21-day longevity filter — identifies "winner" creatives ───────────────

/**
 * filterProfitableAds — returns only ads that have been running for 21+ days.
 *
 * An advertiser rarely keeps a losing ad running beyond 3 weeks. A creative
 * still active after 21 days signals positive ROAS — hence "profitable / winner".
 *
 * @param ads  Array of MetaAd objects from fetchCompetitorAds
 */
export function filterProfitableAds(ads: MetaAd[]): MetaAd[] {
  const TODAY = Date.now();

  return ads.filter(ad => {
    if (!ad.ad_delivery_start_time) return false;

    const startDate = new Date(ad.ad_delivery_start_time).getTime();
    if (Number.isNaN(startDate)) return false;

    const timeDiff = TODAY - startDate;
    // Winner threshold: 21 days = 21 × 24 × 60 × 60 × 1000 ms
    return timeDiff >= TWENTY_ONE_DAYS_MS;
  });
}

// ── 3. Enrichment helper — adds computed fields for the frontend ─────────────

/**
 * enrichAds — attaches `daysActive` and `isWinner` to each ad.
 * Used by the funnel analysis controller before returning to the frontend.
 */
export function enrichAds(ads: MetaAd[]): EnrichedMetaAd[] {
  const TODAY = Date.now();

  return ads.map(ad => {
    const startMs = ad.ad_delivery_start_time
      ? new Date(ad.ad_delivery_start_time).getTime()
      : TODAY;

    const daysActive = Math.floor((TODAY - startMs) / (24 * 60 * 60 * 1000));

    return {
      ...ad,
      daysActive: Math.max(0, daysActive),
      isWinner: daysActive >= 21,
    };
  });
}

// ── 4. Dynamic performance score ─────────────────────────────────────────────

/**
 * computePerformanceScore — derives a 0-98 score from winner ad count.
 * Formula mirrors the original specification: min(60 + winnerCount × 4, 98).
 */
export function computePerformanceScore(winnerCount: number): number {
  return Math.min(60 + winnerCount * 4, 98);
}
