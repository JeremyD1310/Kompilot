/**
 * MetaAdsTab — Location Fees + real spend analytics for Meta Ads.
 *
 * Displays:
 *   - MetaLocationFeesBanner (informative, dismissible)
 *   - RealSpendWidget (3 metrics: Spend API / Location Fees / Total Réel)
 *   - CountryBreakdownTable (fee detail by country)
 */

import { MetaLocationFeesBanner } from '../../components/ads/MetaLocationFeesBanner';
import { RealSpendWidget } from '../../components/ads/RealSpendWidget';
import { CountryBreakdownTable } from '../../components/ads/CountryBreakdownTable';
import { useMetaLocationFees } from '../../hooks/useMetaLocationFees';
import { EmptyState } from '@blinkdotnew/ui';
import { Globe } from 'lucide-react';

export function MetaAdsTab() {
  const {
    countries,
    hasData,
    totalRawSpend,
    totalLocationFees,
    totalRealSpend,
    loading,
  } = useMetaLocationFees();

  return (
    <div className="space-y-6">
      <MetaLocationFeesBanner />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RealSpendWidget
          rawSpend={totalRawSpend}
          locationFees={totalLocationFees}
          realSpend={totalRealSpend}
          loading={loading}
        />

        {hasData && countries.length > 0 ? (
          <CountryBreakdownTable countries={countries} loading={loading} />
        ) : (
          <div className="rounded-2xl border border-border bg-card flex items-center justify-center min-h-[200px]">
            <EmptyState
              icon={<Globe />}
              title="Aucune campagne Meta Ads détectée"
              description="Connectez votre compte Meta Ads pour voir les Location Fees par pays."
            />
          </div>
        )}
      </div>

      {/* Rates reference card */}
      {!loading && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-bold text-foreground mb-3">
            Barème des Location Fees Meta (depuis le 1er juillet 2026)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { flag: '🇦🇹', label: 'Autriche', rate: '5%' },
              { flag: '🇪🇸', label: 'Espagne', rate: '3%' },
              { flag: '🇫🇷', label: 'France', rate: '3%' },
              { flag: '🇮🇹', label: 'Italie', rate: '3%' },
              { flag: '🇬🇧', label: 'Royaume-Uni', rate: '2%' },
              { flag: '🇹🇷', label: 'Turquie', rate: '5%' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 rounded-xl bg-muted/30 px-3 py-2.5"
              >
                <span className="text-lg">{item.flag}</span>
                <div>
                  <p className="text-xs font-medium text-foreground">{item.label}</p>
                  <p className="text-xs font-bold text-amber-500">{item.rate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
