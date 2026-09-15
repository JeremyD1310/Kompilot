export type BillingInterval = 'monthly' | 'yearly'
export type SubscriptionPlanId = 'pro' | 'multi' | 'agency'
export type CommercialPlanId = 'trial' | 'pilot' | SubscriptionPlanId | 'enterprise'
export type PricingProductId = SubscriptionPlanId | 'enterprise' | 'pilot_guided_99' | 'ai_topup_250' | 'ai_topup_750' | 'ai_topup_2000' | 'sms_topup_100' | 'sms_topup_500' | 'sms_topup_1500' | 'addon_user_pro' | 'addon_user_multi' | 'addon_user_agency' | 'addon_establishment_multi' | 'addon_establishment_agency' | 'service_onboarding' | 'service_local_audit' | 'service_analytics_setup' | 'service_team_training' | 'service_editorial_launch' | 'service_custom_quote'

export const PRICING_CATALOG_VERSION = 'pricing-2026-09-15-v2'
export const TRIAL_DAYS = 14
export const PILOT_DURATION_DAYS = 30
export const PILOT_PRICE_EUR_HT = 99
export const ANNUAL_MONTHS_FREE = 2
export const CREDIT_TOPUP_VALIDITY_MONTHS = 12

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
}

export interface TrialPlanDefinition {
  id: Exclude<CommercialPlanId, SubscriptionPlanId | 'enterprise'>
  name: string
  durationDays: number
  entitlements: PlanEntitlements
  recurring: false
}

export const TRIAL_AND_PILOT_PLANS: readonly TrialPlanDefinition[] = [
  { id: 'trial', name: 'Essai gratuit', durationDays: 14, entitlements: { users: 1, aiCredits: 150, smsCredits: 10, establishments: 1 }, recurring: false },
  { id: 'pilot', name: 'Pilote accompagné', durationDays: 30, entitlements: { users: 2, aiCredits: 300, smsCredits: 25, establishments: 1 }, recurring: false },
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

export interface OneTimeProductDefinition {
  id: Exclude<PricingProductId, SubscriptionPlanId | 'enterprise'>
  name: string
  amountEurHt: number | null
  productType: 'guided_pilot' | 'topup' | 'addon' | 'service'
  description: string
  paymentRule: string
  creditType?: 'ai' | 'sms'
  creditAmount?: number
  pilotDays?: number
  creditEligible?: boolean
  recurring?: boolean
}

export type CreditActionId = 'short_text' | 'review_reply' | 'message_reply' | 'full_post' | 'email_sequence' | 'long_article' | 'image_generation' | 'local_seo_analysis' | 'geo_visibility_scan' | 'short_video' | 'full_ai_report'
export const AI_CREDIT_COSTS: Readonly<Record<CreditActionId, number>> = {
  short_text: 1, review_reply: 1, message_reply: 1, full_post: 3, email_sequence: 3,
  long_article: 10, image_generation: 5, local_seo_analysis: 10, geo_visibility_scan: 15,
  short_video: 25, full_ai_report: 15,
}
export const CREDIT_ACTION_LABELS: Readonly<Record<CreditActionId, string>> = {
  short_text: 'Génération ou reformulation d’un texte court', review_reply: 'Suggestion de réponse à un avis', message_reply: 'Suggestion de réponse à un message',
  full_post: 'Génération d’un post complet', email_sequence: 'Génération d’un email ou d’une séquence courte', long_article: 'Génération d’un article long',
  image_generation: 'Génération d’une image', local_seo_analysis: 'Analyse SEO locale d’une page', geo_visibility_scan: 'Scan GEO ou visibilité IA',
  short_video: 'Génération d’une vidéo courte', full_ai_report: 'Rapport complet généré par IA',
}
export const SMS_CREDIT_COST = 1
export const CREDIT_ALERT_THRESHOLDS = [50, 80, 100] as const

export const SUBSCRIPTION_PLANS: readonly SubscriptionPlanDefinition[] = [
  {
    id: 'pro', name: 'Kompilot Pro', monthlyPriceEurHt: 69, annualPriceEurHt: 690,
    entitlements: { users: 2, aiCredits: 500, smsCredits: 50, establishments: 1 },
    target: 'TPE, indépendants et commerçants avec un établissement.', tagline: 'Le cockpit essentiel pour piloter votre présence locale.',
    features: ['2 utilisateurs nominatifs', '500 crédits IA / mois', '50 crédits SMS / mois', '1 établissement', 'Validation humaine avant diffusion', 'Rôles propriétaire, administrateur et membre', 'Support standard'],
    comparison: { establishments: '1', users: '2', ai: '500 / mois', sms: '50 / mois', content: 'Inclus', reviews: 'Inclus', messages: 'Inclus', geo: 'Inclus', reports: 'Standards', whiteLabel: '—', multiClient: '—', support: 'Standard', onboarding: 'Guides produit' },
  },
  {
    id: 'multi', name: 'Kompilot Multi', monthlyPriceEurHt: 129, annualPriceEurHt: 1290,
    entitlements: { users: 5, aiCredits: 1500, smsCredits: 200, establishments: 3 },
    target: 'PME et réseaux locaux gérant plusieurs établissements.', tagline: 'Une vision consolidée pour coordonner plusieurs établissements.',
    features: ['5 utilisateurs nominatifs', '1 500 crédits IA / mois', '200 crédits SMS / mois', '3 établissements inclus', '29 € HT / établissement supplémentaire jusqu’à 5', 'Rapports consolidés', 'Support prioritaire'],
    comparison: { establishments: '3 inclus · 5 max', users: '5', ai: '1 500 / mois', sms: '200 / mois', content: 'Inclus', reviews: 'Centralisés', messages: 'Centralisés', geo: 'Inclus', reports: 'Consolidés', whiteLabel: '—', multiClient: '—', support: 'Prioritaire', onboarding: 'Guidé' },
  },
  {
    id: 'agency', name: 'Kompilot Agency', monthlyPriceEurHt: 229, annualPriceEurHt: 2290,
    entitlements: { users: 15, aiCredits: 5000, smsCredits: 500, establishments: 10 },
    target: 'Agences, consultants multi-clients et réseaux.', tagline: 'La vue multi-clients et la marque blanche pour les équipes qui déploient.',
    features: ['15 utilisateurs nominatifs', '5 000 crédits IA / mois', '500 crédits SMS / mois', '10 établissements inclus', '15 € HT / établissement supplémentaire de 11 à 25', 'Marque blanche, multi-clients et validation', 'Support prioritaire et onboarding initial'],
    comparison: { establishments: '10 inclus · 25 max', users: '15', ai: '5 000 / mois', sms: '500 / mois', content: 'Inclus', reviews: 'Multi-clients', messages: 'Multi-clients', geo: 'Inclus', reports: 'Marque blanche', whiteLabel: 'Inclus', multiClient: 'Inclus', support: 'Prioritaire', onboarding: 'Initial inclus' },
  },
]

export const ENTERPRISE_PLAN = {
  id: 'enterprise' as const, name: 'Kompilot Enterprise', priceLabel: 'Sur devis', target: 'Franchises, groupes et organisations ayant des exigences spécifiques.', tagline: 'Volumes, utilisateurs, établissements et gouvernance définis au devis.',
  features: ['Utilisateurs sur mesure', 'Crédits IA et SMS sur mesure', 'Établissements sur mesure', 'Intégrations et gouvernance avancées', 'SLA et support dédiés'],
  comparison: Object.fromEntries(['establishments', 'users', 'ai', 'sms', 'content', 'reviews', 'messages', 'geo', 'reports', 'whiteLabel', 'multiClient', 'support', 'onboarding'].map(key => [key, 'Sur devis'])) as Record<ComparisonKey, string>, ctaLabel: 'Demander une démonstration',
}

export const ONE_TIME_PRODUCTS: readonly OneTimeProductDefinition[] = [
  { id: 'pilot_guided_99', name: 'Pilote accompagné — 30 jours', amountEurHt: 99, productType: 'guided_pilot', pilotDays: PILOT_DURATION_DAYS, creditEligible: true, description: 'Deux utilisateurs, 300 crédits IA, 25 crédits SMS et un établissement pendant 30 jours, avec accompagnement.', paymentRule: 'Paiement comptant, sans renouvellement automatique' },
  { id: 'ai_topup_250', name: 'Recharge 250 crédits IA', amountEurHt: 19, productType: 'topup', creditType: 'ai', creditAmount: 250, creditEligible: true, description: 'Recharge ponctuelle valable 12 mois.', paymentRule: 'Paiement comptant, sans renouvellement automatique' },
  { id: 'ai_topup_750', name: 'Recharge 750 crédits IA', amountEurHt: 49, productType: 'topup', creditType: 'ai', creditAmount: 750, creditEligible: true, description: 'Recharge ponctuelle valable 12 mois.', paymentRule: 'Paiement comptant, sans renouvellement automatique' },
  { id: 'ai_topup_2000', name: 'Recharge 2 000 crédits IA', amountEurHt: 99, productType: 'topup', creditType: 'ai', creditAmount: 2000, creditEligible: true, description: 'Recharge ponctuelle valable 12 mois.', paymentRule: 'Paiement comptant, sans renouvellement automatique' },
  { id: 'sms_topup_100', name: 'Recharge 100 crédits SMS', amountEurHt: 15, productType: 'topup', creditType: 'sms', creditAmount: 100, creditEligible: true, description: 'Recharge ponctuelle valable 12 mois.', paymentRule: 'Paiement comptant, sans renouvellement automatique' },
  { id: 'sms_topup_500', name: 'Recharge 500 crédits SMS', amountEurHt: 59, productType: 'topup', creditType: 'sms', creditAmount: 500, creditEligible: true, description: 'Recharge ponctuelle valable 12 mois.', paymentRule: 'Paiement comptant, sans renouvellement automatique' },
  { id: 'sms_topup_1500', name: 'Recharge 1 500 crédits SMS', amountEurHt: 149, productType: 'topup', creditType: 'sms', creditAmount: 1500, creditEligible: true, description: 'Recharge ponctuelle valable 12 mois.', paymentRule: 'Paiement comptant, sans renouvellement automatique' },
  { id: 'addon_user_pro', name: 'Utilisateur supplémentaire — Pro', amountEurHt: 9, productType: 'addon', recurring: true, description: 'Un accès nominatif supplémentaire par mois.', paymentRule: 'Renouvellement mensuel avec l’abonnement' },
  { id: 'addon_user_multi', name: 'Utilisateur supplémentaire — Multi', amountEurHt: 8, productType: 'addon', recurring: true, description: 'Un accès nominatif supplémentaire par mois.', paymentRule: 'Renouvellement mensuel avec l’abonnement' },
  { id: 'addon_user_agency', name: 'Utilisateur supplémentaire — Agency', amountEurHt: 6, productType: 'addon', recurring: true, description: 'Un accès nominatif supplémentaire par mois.', paymentRule: 'Renouvellement mensuel avec l’abonnement' },
  { id: 'addon_establishment_multi', name: 'Établissement supplémentaire — Multi', amountEurHt: 29, productType: 'addon', recurring: true, description: 'Un établissement supplémentaire, dans la limite de cinq.', paymentRule: 'Renouvellement mensuel avec l’abonnement' },
  { id: 'addon_establishment_agency', name: 'Établissement supplémentaire — Agency', amountEurHt: 15, productType: 'addon', recurring: true, description: 'Un établissement supplémentaire entre 11 et 25.', paymentRule: 'Renouvellement mensuel avec l’abonnement' },
  { id: 'service_onboarding', name: 'Paramétrage et onboarding complet', amountEurHt: 199, productType: 'service', description: 'Mise en place guidée de votre espace.', paymentRule: 'Paiement intégral à la commande' },
  { id: 'service_local_audit', name: 'Audit SEO local et GEO', amountEurHt: 390, productType: 'service', description: 'Analyse documentée de votre visibilité.', paymentRule: 'Paiement intégral à la commande' },
  { id: 'service_analytics_setup', name: 'Configuration analytics et conversions', amountEurHt: 390, productType: 'service', description: 'Configuration des outils de mesure.', paymentRule: 'Paiement intégral à la commande' },
  { id: 'service_team_training', name: 'Formation d’équipe', amountEurHt: 490, productType: 'service', description: 'Session de prise en main.', paymentRule: 'Paiement intégral à la commande' },
  { id: 'service_editorial_launch', name: 'Pack de lancement éditorial', amountEurHt: 490, productType: 'service', description: 'Préparation d’un socle éditorial.', paymentRule: 'Paiement intégral à la commande' },
  { id: 'service_custom_quote', name: 'Migration ou développement spécifique', amountEurHt: null, productType: 'service', description: 'Périmètre et devis obligatoires.', paymentRule: 'Sur devis' },
]

export function formatPrice(amount: number): string { return `${amount.toLocaleString('fr-FR')} € HT` }
export function getSubscriptionPriceEnvKey(planId: SubscriptionPlanId, billing: BillingInterval): string { return `PRICE_${planId.toUpperCase()}_${billing.toUpperCase()}_ID` }
export function getOneTimePriceEnvKey(productId: Exclude<PricingProductId, SubscriptionPlanId | 'enterprise'>): string { return `PRICE_${productId.toUpperCase()}_ID` }
export function resolveSubscriptionPlan(planId: unknown, billing: unknown) {
  const plan = SUBSCRIPTION_PLANS.find(item => item.id === planId)
  const interval = billing === 'yearly' || billing === 'monthly' ? billing : null
  return plan && interval ? { plan, billing: interval, envKey: getSubscriptionPriceEnvKey(plan.id, interval) } : null
}
export function resolveOneTimeProduct(productId: unknown) { return ONE_TIME_PRODUCTS.find(item => item.id === productId) ?? null }
