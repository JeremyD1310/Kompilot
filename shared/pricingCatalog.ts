export type BillingInterval = 'monthly' | 'yearly'
export type SubscriptionPlanId = 'pro' | 'multi' | 'agency'
export type CommercialPlanId = 'trial' | 'pilot' | SubscriptionPlanId | 'enterprise'
export type PricingProductId =
  | 'pilot_30d_once'
  | 'kompilot_ai_250_once' | 'kompilot_ai_750_once' | 'kompilot_ai_2000_once'
  | 'sms_topup_100' | 'sms_topup_500' | 'sms_topup_1500'
  | 'onboarding_once' | 'audit_seo_geo_once' | 'ga4_gsc_once' | 'training_once' | 'editorial_pack_once'
  | 'user_pro_monthly' | 'user_pro_annual' | 'user_multi_monthly' | 'user_multi_annual' | 'user_agency_monthly' | 'user_agency_annual'
  | 'location_multi_monthly' | 'location_multi_annual' | 'location_agency_monthly' | 'location_agency_annual'

export const PRICING_CATALOG_VERSION = 'pricing-2026-09-15-v3'
export const TRIAL_DAYS = 14
export const PILOT_DURATION_DAYS = 30
export const PILOT_PRICE_EUR_HT = 99
export const CREDIT_TOPUP_VALIDITY_MONTHS = 12
export const PILOT_CREDIT_COUPON_LOOKUP_KEY = 'kompilot_pilot_credit_99'

export type ComparisonKey = 'establishments' | 'users' | 'ai' | 'sms' | 'content' | 'reviews' | 'messages' | 'geo' | 'reports' | 'whiteLabel' | 'multiClient' | 'support' | 'onboarding'

export interface PlanEntitlements {
  users: number | null
  aiCredits: number | null
  smsCredits: number | null
  establishments: number | null
}

export interface SubscriptionPlanDefinition {
  id: SubscriptionPlanId
  name: string
  monthlyPriceEurHt: number
  annualPriceEurHt: number
  entitlements: PlanEntitlements
  target: string
  tagline: string
  features: string[]
  comparison: Record<ComparisonKey, string>
  stripeLookupKeys: Record<BillingInterval, string>
}

export interface TrialPlanDefinition {
  id: 'trial' | 'pilot'
  name: string
  durationDays: number
  entitlements: PlanEntitlements
  recurring: false
}

export const TRIAL_AND_PILOT_PLANS: readonly TrialPlanDefinition[] = [
  { id: 'trial', name: 'Essai gratuit', durationDays: TRIAL_DAYS, entitlements: { users: 1, aiCredits: 150, smsCredits: 10, establishments: 1 }, recurring: false },
  { id: 'pilot', name: 'Pilote 30 jours', durationDays: PILOT_DURATION_DAYS, entitlements: { users: 2, aiCredits: 300, smsCredits: 25, establishments: 1 }, recurring: false },
]

export const COMMERCIAL_PLAN_ENTITLEMENTS: Readonly<Record<CommercialPlanId, PlanEntitlements | null>> = {
  trial: TRIAL_AND_PILOT_PLANS[0].entitlements,
  pilot: TRIAL_AND_PILOT_PLANS[1].entitlements,
  pro: { users: 2, aiCredits: 500, smsCredits: 50, establishments: 1 },
  multi: { users: 5, aiCredits: 1500, smsCredits: 200, establishments: 3 },
  agency: { users: 15, aiCredits: 5000, smsCredits: 500, establishments: 10 },
  enterprise: null,
}

export function getPlanEntitlements(planId: unknown): PlanEntitlements | null {
  return COMMERCIAL_PLAN_ENTITLEMENTS[planId as CommercialPlanId] ?? null
}

const comparison = (values: Partial<Record<ComparisonKey, string>>): Record<ComparisonKey, string> => ({
  establishments: '—', users: '—', ai: '—', sms: '—', content: 'Inclus', reviews: 'Inclus', messages: 'Inclus', geo: 'Inclus', reports: 'Standards', whiteLabel: '—', multiClient: '—', support: 'Standard', onboarding: 'Guides produit', ...values,
})

export const SUBSCRIPTION_PLANS: readonly SubscriptionPlanDefinition[] = [
  {
    id: 'pro', name: 'Pro', monthlyPriceEurHt: 69, annualPriceEurHt: 690,
    entitlements: COMMERCIAL_PLAN_ENTITLEMENTS.pro!, target: 'TPE, indépendants et commerçants.', tagline: 'Le cockpit essentiel pour piloter votre présence locale.',
    stripeLookupKeys: { monthly: 'kompilot_pro_monthly', yearly: 'kompilot_pro_annual' },
    features: ['2 utilisateurs', '1 établissement', '500 crédits IA / mois', '50 SMS / mois', 'Validation humaine avant diffusion', 'Support standard'],
    comparison: comparison({ establishments: '1', users: '2', ai: '500 / mois', sms: '50 / mois' }),
  },
  {
    id: 'multi', name: 'Multi', monthlyPriceEurHt: 129, annualPriceEurHt: 1290,
    entitlements: COMMERCIAL_PLAN_ENTITLEMENTS.multi!, target: 'Équipes et entreprises multi-sites.', tagline: 'Une vue coordonnée pour vos équipes et établissements.',
    stripeLookupKeys: { monthly: 'kompilot_multi_monthly', yearly: 'kompilot_multi_annual' },
    features: ['5 utilisateurs', '3 établissements', '1 500 crédits IA / mois', '200 SMS / mois', 'Pilotage multi-établissements', 'Support prioritaire'],
    comparison: comparison({ establishments: '3', users: '5', ai: '1 500 / mois', sms: '200 / mois', multiClient: 'Inclus', support: 'Prioritaire' }),
  },
  {
    id: 'agency', name: 'Agency', monthlyPriceEurHt: 229, annualPriceEurHt: 2290,
    entitlements: COMMERCIAL_PLAN_ENTITLEMENTS.agency!, target: 'Agences, consultants et réseaux.', tagline: 'Le cockpit multi-clients pour déployer à grande échelle.',
    stripeLookupKeys: { monthly: 'kompilot_agency_monthly', yearly: 'kompilot_agency_annual' },
    features: ['15 utilisateurs', '10 établissements inclus · 25 max', '5 000 crédits IA / mois', '500 SMS / mois', 'Marque blanche et multi-clients', 'Support dédié'],
    comparison: comparison({ establishments: '10 inclus · 25 max', users: '15', ai: '5 000 / mois', sms: '500 / mois', whiteLabel: 'Inclus', multiClient: 'Inclus', support: 'Dédié' }),
  },
]

export const ENTERPRISE_PLAN = {
  id: 'enterprise' as const, name: 'Enterprise', priceLabel: 'Sur devis', target: 'Franchises, groupes et organisations.', tagline: 'Volumes, utilisateurs, établissements et gouvernance définis au devis.',
  features: ['Utilisateurs sur mesure', 'Crédits IA et SMS sur mesure', 'Établissements sur mesure', 'Intégrations et gouvernance avancées', 'SLA et support dédiés'],
  comparison: comparison(Object.fromEntries(Object.keys(comparison({})).map(key => [key, 'Sur devis']))), ctaLabel: 'Demander une démonstration',
}

export interface OneTimeProductDefinition {
  id: PricingProductId
  name: string
  amountEurHt: number | null
  productType: 'guided_pilot' | 'topup' | 'addon' | 'service'
  description: string
  paymentRule: string
  lookupKey: string
  creditType?: 'ai' | 'sms'
  creditAmount?: number
  pilotDays?: number
  creditEligible?: boolean
  recurring?: boolean
  planId?: SubscriptionPlanId
  billing?: BillingInterval
  maxTotal?: number
}

export const ONE_TIME_PRODUCTS: readonly OneTimeProductDefinition[] = [
  { id: 'pilot_30d_once', name: 'Pilote 30 jours', amountEurHt: 99, productType: 'guided_pilot', pilotDays: PILOT_DURATION_DAYS, creditEligible: true, lookupKey: 'kompilot_pilot_30d_once', description: '2 utilisateurs, 1 établissement, 300 crédits IA et 25 SMS.', paymentRule: 'Paiement comptant, sans renouvellement' },
  { id: 'kompilot_ai_250_once', name: 'Recharge 250 crédits IA', amountEurHt: 19, productType: 'topup', creditType: 'ai', creditAmount: 250, creditEligible: true, lookupKey: 'kompilot_ai_250_once', description: 'Recharge IA valable 12 mois.', paymentRule: 'Paiement comptant, sans renouvellement' },
  { id: 'kompilot_ai_750_once', name: 'Recharge 750 crédits IA', amountEurHt: 49, productType: 'topup', creditType: 'ai', creditAmount: 750, creditEligible: true, lookupKey: 'kompilot_ai_750_once', description: 'Recharge IA valable 12 mois.', paymentRule: 'Paiement comptant, sans renouvellement' },
  { id: 'kompilot_ai_2000_once', name: 'Recharge 2 000 crédits IA', amountEurHt: 99, productType: 'topup', creditType: 'ai', creditAmount: 2000, creditEligible: true, lookupKey: 'kompilot_ai_2000_once', description: 'Recharge IA valable 12 mois.', paymentRule: 'Paiement comptant, sans renouvellement' },
  { id: 'sms_topup_100', name: 'Recharge 100 SMS', amountEurHt: 15, productType: 'topup', creditType: 'sms', creditAmount: 100, creditEligible: true, lookupKey: 'kompilot_sms_100_once', description: 'Recharge SMS valable 12 mois.', paymentRule: 'Paiement comptant, sans renouvellement' },
  { id: 'sms_topup_500', name: 'Recharge 500 SMS', amountEurHt: 59, productType: 'topup', creditType: 'sms', creditAmount: 500, creditEligible: true, lookupKey: 'kompilot_sms_500_once', description: 'Recharge SMS valable 12 mois.', paymentRule: 'Paiement comptant, sans renouvellement' },
  { id: 'sms_topup_1500', name: 'Recharge 1 500 SMS', amountEurHt: 149, productType: 'topup', creditType: 'sms', creditAmount: 1500, creditEligible: true, lookupKey: 'kompilot_sms_1500_once', description: 'Recharge SMS valable 12 mois.', paymentRule: 'Paiement comptant, sans renouvellement' },
  { id: 'onboarding_once', name: 'Onboarding', amountEurHt: null, productType: 'service', lookupKey: 'kompilot_onboarding_once', description: 'Paramétrage guidé.', paymentRule: 'Sur devis ou commande' },
  { id: 'audit_seo_geo_once', name: 'Audit SEO / GEO', amountEurHt: null, productType: 'service', lookupKey: 'kompilot_audit_seo_geo_once', description: 'Audit documenté.', paymentRule: 'Sur devis ou commande' },
  { id: 'ga4_gsc_once', name: 'Configuration GA4 / GSC', amountEurHt: null, productType: 'service', lookupKey: 'kompilot_ga4_gsc_once', description: 'Configuration analytics.', paymentRule: 'Sur devis ou commande' },
  { id: 'training_once', name: 'Formation', amountEurHt: null, productType: 'service', lookupKey: 'kompilot_training_once', description: 'Formation d’équipe.', paymentRule: 'Sur devis ou commande' },
  { id: 'editorial_pack_once', name: 'Pack éditorial', amountEurHt: null, productType: 'service', lookupKey: 'kompilot_editorial_pack_once', description: 'Socle éditorial.', paymentRule: 'Sur devis ou commande' },
  ...([
    ['user_pro_monthly', 'kompilot_user_pro_monthly', 9, 'pro', 'monthly'], ['user_pro_annual', 'kompilot_user_pro_annual', 90, 'pro', 'yearly'],
    ['user_multi_monthly', 'kompilot_user_multi_monthly', 8, 'multi', 'monthly'], ['user_multi_annual', 'kompilot_user_multi_annual', 80, 'multi', 'yearly'],
    ['user_agency_monthly', 'kompilot_user_agency_monthly', 6, 'agency', 'monthly'], ['user_agency_annual', 'kompilot_user_agency_annual', 60, 'agency', 'yearly'],
  ] as const).map(([id, lookupKey, amountEurHt, planId, billing]) => ({ id, name: 'Utilisateur supplémentaire', amountEurHt, productType: 'addon' as const, lookupKey, planId, billing, recurring: true, description: 'Un accès nominatif supplémentaire.', paymentRule: 'Récurrent avec l’abonnement' })),
  ...([
    ['location_multi_monthly', 'kompilot_location_multi_monthly', 29, 'multi', 'monthly'], ['location_multi_annual', 'kompilot_location_multi_annual', 290, 'multi', 'yearly'],
    ['location_agency_monthly', 'kompilot_location_agency_monthly', 15, 'agency', 'monthly'], ['location_agency_annual', 'kompilot_location_agency_annual', 150, 'agency', 'yearly'],
  ] as const).map(([id, lookupKey, amountEurHt, planId, billing]) => ({ id, name: 'Établissement supplémentaire', amountEurHt, productType: 'addon' as const, lookupKey, planId, billing, recurring: true, maxTotal: planId === 'multi' ? 5 : 25, description: 'Un établissement supplémentaire dans la limite du plan.', paymentRule: 'Récurrent avec l’abonnement' })),
]

export type CreditActionId = 'short_text' | 'review_reply' | 'message_reply' | 'full_post' | 'email_sequence' | 'long_article' | 'image_generation' | 'local_seo_analysis' | 'geo_visibility_scan' | 'short_video' | 'full_ai_report'
export const AI_CREDIT_COSTS: Readonly<Record<CreditActionId, number>> = { short_text: 1, review_reply: 1, message_reply: 1, full_post: 3, email_sequence: 3, long_article: 10, image_generation: 5, local_seo_analysis: 10, geo_visibility_scan: 15, short_video: 25, full_ai_report: 15 }
export const SMS_CREDIT_COST = 1
export const CREDIT_ALERT_THRESHOLDS = [50, 80, 100] as const

export function formatPrice(amount: number): string { return `${amount.toLocaleString('fr-FR')} € HT` }
export function getSubscriptionLookupKey(planId: SubscriptionPlanId, billing: BillingInterval): string { return SUBSCRIPTION_PLANS.find(plan => plan.id === planId)!.stripeLookupKeys[billing] }
export function getOneTimeLookupKey(productId: PricingProductId): string | null { return ONE_TIME_PRODUCTS.find(product => product.id === productId)?.lookupKey ?? null }
/** Deprecated compatibility names: prices are resolved by lookup_key, never by client amount. */
export function getSubscriptionPriceEnvKey(planId: SubscriptionPlanId, billing: BillingInterval): string { return getSubscriptionLookupKey(planId, billing) }
export function getOneTimePriceEnvKey(productId: PricingProductId): string | null { return getOneTimeLookupKey(productId) }
export function resolveSubscriptionPlan(planId: unknown, billing: unknown) { const plan = SUBSCRIPTION_PLANS.find(item => item.id === planId); const interval = billing === 'yearly' || billing === 'monthly' ? billing : null; return plan && interval ? { plan, billing: interval, lookupKey: plan.stripeLookupKeys[interval] } : null }
export function resolveOneTimeProduct(productId: unknown) { return ONE_TIME_PRODUCTS.find(item => item.id === productId) ?? null }
