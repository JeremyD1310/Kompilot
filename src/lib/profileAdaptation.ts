/**
 * Profile adaptation utilities — drive UI variations based on smart onboarding profile.
 * Used by sidebar, cockpit, growth page to show/hide features.
 */

export type SmartProfileType = 'commerce' | 'agency' | null;
export type CommerceSector = 'restauration' | 'beaute' | 'retail' | 'autre' | null;

/**
 * Returns true when the "Anti-No Show" module should be prominently shown.
 * For restauration/beaute profiles only.
 */
export function shouldShowNoShowModule(smartProfile: SmartProfileType, sector: CommerceSector): boolean {
  if (smartProfile !== 'commerce') return false;
  return sector === 'restauration' || sector === 'beaute';
}

/**
 * Returns true when the white-label/agency options should be visible.
 */
export function shouldShowWhiteLabel(smartProfile: SmartProfileType): boolean {
  return smartProfile === 'agency';
}

/**
 * Returns true when the retail weather-based post module should be shown.
 */
export function shouldShowWeatherPosts(smartProfile: SmartProfileType, sector: CommerceSector): boolean {
  return smartProfile === 'commerce' && sector === 'retail';
}

/**
 * Returns true when ROI sliders (agency growth panel) should be visible.
 */
export function shouldShowROISliders(smartProfile: SmartProfileType): boolean {
  return smartProfile === 'agency';
}

/**
 * Get Mentor Copilote language mode for system prompt adjustments.
 */
export function getMentorLanguageMode(smartProfile: SmartProfileType, sector: CommerceSector): 'terrain' | 'agency' | 'default' {
  if (smartProfile === 'agency') return 'agency';
  if (smartProfile === 'commerce' && (sector === 'restauration' || sector === 'beaute')) return 'terrain';
  return 'default';
}

import type { MasterProfile, AppModule } from './sectorProfiles';
import { isModuleActive } from './sectorProfiles';

/** Check if a module is active for the given masterProfile (new system) */
export function isModuleEnabled(masterProfile: MasterProfile, module: AppModule): boolean {
  return isModuleActive(masterProfile, module);
}

/** Returns the Stripe script type for the given masterProfile */
export function getStripeScriptType(masterProfile: MasterProfile): 'standard' | 'btp' | 'conciergerie' | 'conseil' | 'agence' {
  const map: Record<string, 'standard' | 'btp' | 'conciergerie' | 'conseil' | 'agence'> = {
    flux: 'standard',
    chantier: 'btp',
    produits: 'standard',
    services_b2b: 'conseil',
    agence: 'agence',
  };
  return (masterProfile && map[masterProfile]) ? map[masterProfile] : 'standard';
}

/** Returns the ROI metric label for the given masterProfile */
export function getROIMetricLabel(masterProfile: MasterProfile): string {
  const map: Record<string, string> = {
    flux: 'Taux de tables / RDV honorés',
    chantier: 'Taux de conversion de devis',
    produits: 'Panier moyen & rotation des stocks',
    services_b2b: 'Valeur Vie Client (LTV)',
    agence: 'MRR & rétention clients agence',
  };
  return (masterProfile && map[masterProfile]) ? map[masterProfile] : 'Chiffre d\'affaires généré';
}

/** Returns whether the credits gauge should be visible (agencies only) */
export function shouldShowCreditsGauge(masterProfile: MasterProfile): boolean {
  return masterProfile === 'agence';
}

/** Returns whether a given UI section should be shown based on masterProfile */
export function getSectorUIConfig(masterProfile: MasterProfile): {
  showAntiNoShow: boolean;
  showFlashCoupons: boolean;
  showGeoZone: boolean;
  showLeadQualification: boolean;
  showWhiteLabel: boolean;
  showCreditsGauge: boolean;
} {
  return {
    showAntiNoShow: isModuleActive(masterProfile, 'anti_no_show'),
    showFlashCoupons: isModuleActive(masterProfile, 'flash_coupons'),
    showGeoZone: isModuleActive(masterProfile, 'geo_zone_max'),
    showLeadQualification: isModuleActive(masterProfile, 'lead_qualification'),
    showWhiteLabel: isModuleActive(masterProfile, 'white_label'),
    showCreditsGauge: masterProfile === 'agence',
  };
}
