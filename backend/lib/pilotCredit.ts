import { PILOT_PRICE_EUR_HT } from '../../shared/pricingCatalog'

export const PILOT_CREDIT_EUR_HT = PILOT_PRICE_EUR_HT

export type PilotCreditState = {
  pilotCreditApplied?: boolean
  pilotCreditAmountEurHt?: number
  pilotCreditSourceSessionId?: string
}

/** The guided pilot is credited once, and only against a yearly subscription. */
export function calculatePilotCredit(state: PilotCreditState, billing: unknown): number {
  if (billing !== 'yearly' || state.pilotCreditApplied === true) return 0
  return state.pilotCreditAmountEurHt === undefined ? PILOT_CREDIT_EUR_HT : Math.max(0, state.pilotCreditAmountEurHt)
}

export function buildPilotCreditAudit(state: PilotCreditState, billing: unknown, sessionId: string, now = new Date().toISOString()) {
  const amount = calculatePilotCredit(state, billing)
  if (!amount) return null
  return {
    pilotCreditApplied: true,
    pilotCreditAmountEurHt: amount,
    pilotCreditSourceSessionId: sessionId,
    pilotCreditAppliedAt: now,
    pilotCreditAudit: JSON.stringify({ amountEurHt: amount, sourceSessionId: sessionId, appliedAt: now, rule: 'guided-pilot-to-first-yearly-subscription' }),
  }
}
