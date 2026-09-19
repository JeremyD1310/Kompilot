import { describe, expect, test } from 'bun:test';
import { SUBSCRIPTION_PLANS } from '../../shared/pricingCatalog';
import { getPlanTier, getUpgradePlan, PLAN_TIER_MAP } from '../../src/lib/planFeatures';

describe('canonical commercial plan guards', () => {
  test('keeps the published order and maps every paid plan explicitly', () => {
    expect(SUBSCRIPTION_PLANS.map(plan => plan.id)).toEqual(['pro', 'multi', 'agency']);
    expect(PLAN_TIER_MAP).toEqual({ pro: 'starter', multi: 'business', agency: 'franchise' });
    expect(getPlanTier('multi', false)).toBe('business');
    expect(getPlanTier('agency', false)).toBe('franchise');
  });

  test('routes upgrades to canonical plan identifiers', () => {
    expect(getUpgradePlan('geo_radar')).toBe('multi');
    expect(getUpgradePlan('team_management')).toBe('agency');
  });
});
