import { describe, expect, it } from 'vitest'
import { resolveNewPlan, resolveOneTimeProduct } from '../../backend/lib/pricingCatalog'
import { buildPilotCreditAudit, calculatePilotCredit } from '../../backend/lib/pilotCredit'

describe('canonical Kompilot pricing catalog', () => {
  it('rejects unknown plans and aliases', () => {
    expect(resolveNewPlan('starter', 'monthly')).toBeNull()
    expect(resolveNewPlan('pro-plus', 'monthly')).toBeNull()
  })
  it('maps only monthly/yearly canonical Stripe lookup keys', () => {
    expect(resolveNewPlan('pro', 'monthly')?.lookupKey).toBe('kompilot_pro_monthly')
    expect(resolveNewPlan('multi', 'yearly')?.lookupKey).toBe('kompilot_multi_annual')
    expect(resolveNewPlan('agency', 'weekly')).toBeNull()
  })
  it('accepts only canonical one-time products and preserves pilot metadata', () => {
    expect(resolveOneTimeProduct('pilot_30d_once')?.definition).toMatchObject({ amount: 9900, pilotDays: 30, creditEligible: true })
    expect(resolveOneTimeProduct('pilot_guided_99')).toBeNull()
    expect(resolveOneTimeProduct('custom_quote')).toBeNull()
    expect(resolveOneTimeProduct('service_custom_quote')).toBeNull()
    expect(resolveOneTimeProduct('onboarding_once')?.definition.productType).toBe('service')
  })
  it('pilot is a one-time product with no renewal semantics', () => {
    expect(resolveOneTimeProduct('pilot_guided_99')?.definition).not.toHaveProperty('recurring')
  })
  it('calculates the €99 annual credit once and is idempotent', () => {
    expect(calculatePilotCredit({ pilot_status: 'active' } as any, 'monthly')).toBe(0)
    expect(calculatePilotCredit({}, 'yearly')).toBe(99)
    const audit = buildPilotCreditAudit({ pilot_status: 'active' } as any, 'yearly', 'cs_123', '2026-09-15T00:00:00.000Z')
    expect(audit).toMatchObject({ pilotCreditApplied: true, pilotCreditAmountEurHt: 99, pilotCreditSourceSessionId: 'cs_123' })
    expect(calculatePilotCredit({ pilotCreditApplied: true }, 'yearly')).toBe(0)
    expect(buildPilotCreditAudit({ pilotCreditApplied: true }, 'yearly', 'cs_456')).toBeNull()
  })
})
