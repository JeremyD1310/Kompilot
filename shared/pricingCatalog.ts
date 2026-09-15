export type BillingInterval = 'monthly' | 'yearly'
export type SubscriptionPlanId = 'pro' | 'multi' | 'agency'
export type PricingProductId = SubscriptionPlanId | 'enterprise' | 'pilot_guided_99' | 'service_onboarding' | 'service_local_audit' | 'service_analytics_setup' | 'service_team_training' | 'service_editorial_launch' | 'service_custom_quote'

export const PRICING_CATALOG_VERSION = 'pricing-2026-09-15'
export const TRIAL_DAYS = 14
export const PILOT_DURATION_DAYS = 30
export const PILOT_PRICE_EUR_HT = 99
export const ANNUAL_MONTHS_FREE = 2

export type ComparisonKey = 'establishments' | 'users' | 'ai' | 'sms' | 'content' | 'reviews' | 'messages' | 'geo' | 'reports' | 'whiteLabel' | 'multiClient' | 'support' | 'onboarding'

export interface SubscriptionPlanDefinition {
  id: SubscriptionPlanId
  name: string
  monthlyPriceEurHt: number
  annualPriceEurHt: number
  target: string
  tagline: string
  features: string[]
  comparison: Record<ComparisonKey, string>
}

export interface OneTimeProductDefinition {
  id: Exclude<PricingProductId, SubscriptionPlanId | 'enterprise'>
  name: string
  amountEurHt: number | null
  productType: 'guided_pilot' | 'service'
  description: string
  paymentRule: string
  pilotDays?: number
  creditEligible?: boolean
}

export const SUBSCRIPTION_PLANS: readonly SubscriptionPlanDefinition[] = [
  {
    id: 'pro', name: 'Kompilot Pro', monthlyPriceEurHt: 69, annualPriceEurHt: 690,
    target: 'Commerçants, indépendants, artisans, consultants et TPE avec un établissement.',
    tagline: 'Le cockpit essentiel pour piloter une présence locale avec méthode.',
    features: ['1 établissement', 'Creative Studio IA', 'Gestion et suggestions de réponses aux avis', 'Calendrier éditorial', 'Boîte de réception centralisée', 'Suivi de visibilité locale et GEO', 'Rapports standards', 'Crédits IA et SMS plafonnés', 'Support standard', 'Validation humaine avant diffusion'],
    comparison: { establishments: '1', users: '1', ai: 'À définir', sms: 'À définir', content: 'Inclus', reviews: 'Inclus', messages: 'Inclus', geo: 'Inclus', reports: 'Standards', whiteLabel: '—', multiClient: '—', support: 'Standard', onboarding: 'Guides produit' },
  },
  {
    id: 'multi', name: 'Kompilot Multi', monthlyPriceEurHt: 129, annualPriceEurHt: 1290,
    target: 'PME, réseaux locaux et entreprises gérant jusqu’à trois établissements.',
    tagline: 'Une vision consolidée pour coordonner plusieurs établissements.',
    features: ['Jusqu’à 3 établissements', 'Toutes les fonctionnalités Pro', 'Pilotage multi-établissements', 'Calendrier consolidé', 'Gestion centralisée des avis et messages', 'Comparaison des résultats par établissement', 'Droits utilisateurs supplémentaires', 'Rapports consolidés', 'Crédits supérieurs à Pro — volume à définir', 'Support prioritaire', 'Validation humaine avant diffusion'],
    comparison: { establishments: 'Jusqu’à 3', users: 'Supplémentaires', ai: 'Supérieurs à Pro — à définir', sms: 'À définir', content: 'Inclus', reviews: 'Centralisés', messages: 'Centralisés', geo: 'Inclus', reports: 'Consolidés', whiteLabel: '—', multiClient: '—', support: 'Prioritaire', onboarding: 'Guidé' },
  },
  {
    id: 'agency', name: 'Kompilot Agency', monthlyPriceEurHt: 229, annualPriceEurHt: 2290,
    target: 'Agences, consultants multi-clients et réseaux jusqu’à dix établissements ou espaces clients.',
    tagline: 'La vue multi-clients et la marque blanche pour les équipes qui déploient.',
    features: ['Jusqu’à 10 établissements ou workspaces', 'Toutes les fonctionnalités Multi', 'Gestion multi-clients', 'Rapports en marque blanche', 'Exports PDF personnalisés', 'Rôles et permissions', 'Vues consolidées', 'Crédits Agency — volume à définir', 'Support prioritaire', 'Accompagnement initial', 'Validation humaine avant diffusion'],
    comparison: { establishments: 'Jusqu’à 10', users: 'Rôles et permissions', ai: 'Crédits Agency — à définir', sms: 'À définir', content: 'Inclus', reviews: 'Multi-clients', messages: 'Multi-clients', geo: 'Inclus', reports: 'Marque blanche', whiteLabel: 'Inclus', multiClient: 'Inclus', support: 'Prioritaire', onboarding: 'Initial inclus' },
  },
]

export const ENTERPRISE_PLAN = {
  id: 'enterprise' as const, name: 'Kompilot Enterprise', priceLabel: 'Sur devis',
  target: 'Réseaux importants, franchises, groupes et organisations ayant des exigences spécifiques.',
  tagline: 'Un déploiement adapté à vos contraintes opérationnelles et de gouvernance.',
  features: ['Nombre d’établissements personnalisé', 'Intégrations spécifiques', 'Accompagnement au déploiement', 'Formation', 'Gouvernance et droits avancés', 'Volumes de crédits personnalisés', 'SLA et support dédiés', 'Personnalisation des rapports'],
  comparison: Object.fromEntries(['establishments', 'users', 'ai', 'sms', 'content', 'reviews', 'messages', 'geo'].map(key => [key, 'Sur devis'])) as Record<ComparisonKey, string>,
  ctaLabel: 'Demander une démonstration',
}

export const ONE_TIME_PRODUCTS: readonly OneTimeProductDefinition[] = [
  { id: 'pilot_guided_99', name: 'Pilote Kompilot — 30 jours accompagnés', amountEurHt: 99, productType: 'guided_pilot', pilotDays: PILOT_DURATION_DAYS, creditEligible: true, description: 'Rendez-vous de lancement, configuration d’un établissement, accès à Kompilot Pro pendant 30 jours, plan d’action initial, prise en main et rendez-vous de bilan.', paymentRule: 'Paiement comptant, sans renouvellement automatique' },
  { id: 'service_onboarding', name: 'Paramétrage et onboarding complet', amountEurHt: 199, productType: 'service', description: 'Mise en place guidée de votre espace et de vos premiers réglages.', paymentRule: 'Paiement intégral à la commande' },
  { id: 'service_local_audit', name: 'Audit SEO local et GEO', amountEurHt: 390, productType: 'service', description: 'Analyse documentée de votre visibilité locale et des prochaines priorités.', paymentRule: 'Paiement intégral à la commande' },
  { id: 'service_analytics_setup', name: 'Configuration GA4, GSC et conversions', amountEurHt: 390, productType: 'service', description: 'Configuration des outils de mesure et vérification des conversions.', paymentRule: 'Paiement intégral à la commande' },
  { id: 'service_team_training', name: 'Formation d’équipe', amountEurHt: 490, productType: 'service', description: 'Session de prise en main pour votre équipe.', paymentRule: 'Paiement intégral à la commande' },
  { id: 'service_editorial_launch', name: 'Pack de lancement éditorial', amountEurHt: 490, productType: 'service', description: 'Préparation d’un socle éditorial exploitable après validation.', paymentRule: 'Paiement intégral à la commande' },
  { id: 'service_custom_quote', name: 'Migration, intégration ou développement spécifique', amountEurHt: null, productType: 'service', description: 'Périmètre et devis obligatoires avant toute prestation sur mesure.', paymentRule: 'À partir de 1 000 € HT : 50 % à la commande, 50 % à la livraison' },
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
