import { BACKEND_URL as KOMPILOT_BACKEND_URL } from '@/lib/backend';
/**
 * useMetaLocationFees — Hook for fetching Meta Ads location fee data.
 *
 * Connects to the backend /api/meta/location-fees/* endpoints.
 * Returns spend data with location fees, rates, and aggregate summaries.
 */

import { useQuery } from '@tanstack/react-query';
import { blink } from '../blink/client';

const BACKEND_URL = KOMPILOT_BACKEND_URL;

export interface LocationFeeRate {
  country: string;
  label: string;
  rate: number;
  displayRate: string;
  flag: string;
}

export interface CountryFee {
  country: string;
  label: string;
  flag: string;
  raw_spend: number;
  fee_rate: number;
  fee_display: string;
  location_fee_amount: number;
  real_spend: number;
}

export interface LocationFeesSummary {
  has_data: boolean;
  rates: LocationFeeRate[];
  supported_countries: string[];
  notice: string;
  aggregate: {
    total_raw_spend: number;
    total_location_fees: number;
    total_real_spend: number;
    by_country: Record<string, CountryFee>;
  };
}

async function fetchLocationFeesSummary(): Promise<LocationFeesSummary | null> {
  try {
    const token = await blink.auth.getValidToken();
    const res = await fetch(`${BACKEND_URL}/api/meta/location-fees/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function useMetaLocationFees() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['meta-location-fees'],
    queryFn: fetchLocationFeesSummary,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Convert by_country record to array for table component
  const countries = data?.aggregate?.by_country
    ? Object.values(data.aggregate.by_country)
    : [];

  return {
    summary: data,
    countries,
    rates: data?.rates ?? [],
    hasData: data?.has_data ?? false,
    notice: data?.notice ?? '',
    totalRawSpend: data?.aggregate?.total_raw_spend ?? 0,
    totalLocationFees: data?.aggregate?.total_location_fees ?? 0,
    totalRealSpend: data?.aggregate?.total_real_spend ?? 0,
    loading: isLoading,
    error: error as Error | null,
  };
}
