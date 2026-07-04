/**
 * metaLocationFees.ts — Meta Ads Location Fees calculation
 *
 * Effective July 1, 2026, Meta charges additional "Location Fees" (regulatory
 * operating costs) on ad spend in certain countries. These fees are NOT included
 * in the `spend` field returned by the Meta Ads API — they are billed separately.
 *
 * This module calculates the true cost of Meta Ads spend including location fees,
 * so Kompilot can display accurate ROAS and margins.
 *
 * Architecture:
 *   - LOCATION_FEE_RATES: single source of truth for all country tax rates
 *   - calculateRealMetaSpend(): takes raw API data, returns adjusted figures
 *   - calculateRealMetaSpendBatch(): processes array of campaign/country data
 *
 * @see https://www.facebook.com/business/help/location-fees
 */

// ── Location Fee Rate Registry ───────────────────────────────────────────────
// Single source of truth. To add a new country: add one entry here.
// Rates are decimals (0.03 = 3%). All values are percentages of the raw spend.

export interface LocationFeeRate {
  /** ISO 3166-1 alpha-2 country code */
  country: string;
  /** Display name in French */
  label: string;
  /** Rate as decimal (0.03 = 3%) */
  rate: number;
  /** Rate as human-readable percentage */
  displayRate: string;
  /** Flag emoji for UI */
  flag: string;
}

export const LOCATION_FEE_RATES: Record<string, LocationFeeRate> = {
  AT: { country: 'AT', label: 'Autriche',       rate: 0.05, displayRate: '5%', flag: '🇦🇹' },
  ES: { country: 'ES', label: 'Espagne',         rate: 0.03, displayRate: '3%', flag: '🇪🇸' },
  FR: { country: 'FR', label: 'France',          rate: 0.03, displayRate: '3%', flag: '🇫🇷' },
  IT: { country: 'IT', label: 'Italie',          rate: 0.03, displayRate: '3%', flag: '🇮🇹' },
  GB: { country: 'GB', label: 'Royaume-Uni',     rate: 0.02, displayRate: '2%', flag: '🇬🇧' },
  TR: { country: 'TR', label: 'Turquie',         rate: 0.05, displayRate: '5%', flag: '🇹🇷' },
};

/** All supported country codes */
export const LOCATION_FEE_COUNTRIES = Object.keys(LOCATION_FEE_RATES);

// ── Core Calculation Functions ───────────────────────────────────────────────

export interface SpendInput {
  /** ISO country code (e.g. 'FR', 'AT') */
  country?: string;
  /** Raw spend amount from Meta Ads API (in account currency, typically EUR or USD) */
  spend: number;
  /** Optional: campaign name for labeling */
  campaign_name?: string;
  /** Optional: any additional metadata to pass through */
  [key: string]: unknown;
}

export interface SpendResult {
  /** Original raw spend from Meta API */
  raw_spend: number;
  /** Location fee amount (tax) */
  location_fee_amount: number;
  /** Total real spend (raw + fee) */
  real_spend: number;
  /** Country code */
  country: string;
  /** Fee rate applied (0 if country not in registry) */
  fee_rate: number;
  /** Human-readable fee rate (e.g. '3%') */
  fee_display: string;
  /** Whether this country has a location fee */
  has_fee: boolean;
  /** Pass-through of any extra fields from input */
  metadata: Record<string, unknown>;
}

/**
 * Calculate real Meta Ads spend for a single entry.
 *
 * @param input - Object with at least `country` and `spend`
 * @returns SpendResult with adjusted figures
 *
 * @example
 * const result = calculateRealMetaSpend({ country: 'FR', spend: 1000 });
 * // { raw_spend: 1000, location_fee_amount: 30, real_spend: 1030, ... }
 */
export function calculateRealMetaSpend(input: SpendInput): SpendResult {
  const country = (input.country || '').toUpperCase().trim();
  const rawSpend = Number(input.spend) || 0;
  const feeInfo = LOCATION_FEE_RATES[country];

  if (!feeInfo || rawSpend <= 0) {
    return {
      raw_spend: rawSpend,
      location_fee_amount: 0,
      real_spend: rawSpend,
      country: country || 'UNKNOWN',
      fee_rate: 0,
      fee_display: '0%',
      has_fee: false,
      metadata: extractMetadata(input),
    };
  }

  const feeAmount = Math.round(rawSpend * feeInfo.rate * 100) / 100;

  return {
    raw_spend: rawSpend,
    location_fee_amount: feeAmount,
    real_spend: Math.round((rawSpend + feeAmount) * 100) / 100,
    country,
    fee_rate: feeInfo.rate,
    fee_display: feeInfo.displayRate,
    has_fee: true,
    metadata: extractMetadata(input),
  };
}

/**
 * Process an array of spend entries and calculate real spend for each.
 * Also returns an aggregate summary.
 *
 * @param entries - Array of SpendInput objects
 * @returns Array of SpendResult + aggregate summary
 */
export function calculateRealMetaSpendBatch(entries: SpendInput[]): {
  results: SpendResult[];
  aggregate: {
    total_raw_spend: number;
    total_location_fees: number;
    total_real_spend: number;
    by_country: Record<string, {
      country: string;
      label: string;
      flag: string;
      raw_spend: number;
      fee_rate: number;
      fee_display: string;
      location_fee_amount: number;
      real_spend: number;
    }>;
  };
} {
  const results = entries.map(calculateRealMetaSpend);

  // Aggregate by country
  const byCountry: Record<string, {
    country: string;
    label: string;
    flag: string;
    raw_spend: number;
    fee_rate: number;
    fee_display: string;
    location_fee_amount: number;
    real_spend: number;
  }> = {};

  for (const r of results) {
    if (!byCountry[r.country]) {
      const info = LOCATION_FEE_RATES[r.country];
      byCountry[r.country] = {
        country: r.country,
        label: info?.label || r.country,
        flag: info?.flag || '🏳️',
        raw_spend: 0,
        fee_rate: r.fee_rate,
        fee_display: r.fee_display,
        location_fee_amount: 0,
        real_spend: 0,
      };
    }
    byCountry[r.country].raw_spend += r.raw_spend;
    byCountry[r.country].location_fee_amount += r.location_fee_amount;
    byCountry[r.country].real_spend += r.real_spend;
  }

  // Round aggregates
  for (const agg of Object.values(byCountry)) {
    agg.raw_spend = Math.round(agg.raw_spend * 100) / 100;
    agg.location_fee_amount = Math.round(agg.location_fee_amount * 100) / 100;
    agg.real_spend = Math.round(agg.real_spend * 100) / 100;
  }

  const totalRaw = results.reduce((s, r) => s + r.raw_spend, 0);
  const totalFees = results.reduce((s, r) => s + r.location_fee_amount, 0);
  const totalReal = results.reduce((s, r) => s + r.real_spend, 0);

  return {
    results,
    aggregate: {
      total_raw_spend: Math.round(totalRaw * 100) / 100,
      total_location_fees: Math.round(totalFees * 100) / 100,
      total_real_spend: Math.round(totalReal * 100) / 100,
      by_country: byCountry,
    },
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Extract non-standard fields as metadata passthrough */
function extractMetadata(input: SpendInput): Record<string, unknown> {
  const { country, spend, ...rest } = input;
  return rest;
}

/**
 * Get a summary string for the location fee notice.
 * Used in UI banners and email notifications.
 */
export function getLocationFeeNotice(): string {
  const countries = Object.values(LOCATION_FEE_RATES)
    .map(f => `${f.flag} ${f.label} (${f.displayRate})`)
    .join(', ');
  return `Depuis le 1er juillet 2026, Meta facture des frais régionaux supplémentaires dans certains pays : ${countries}. Kompilot intègre désormais ces frais dans votre ROAS réel pour garantir la précision de vos données.`;
}