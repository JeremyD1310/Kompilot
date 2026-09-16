/**
 * PricingPageParts — Composants de la page /pricing
 *
 * Grille tarifaire issue du catalogue canonique :
 *   Pro · Multi · Agency · Enterprise
 *
 * Les identifiants de plan sont ceux du catalogue partagé et de Stripe.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, toast } from '@blinkdotnew/ui'
import { Check, ChevronDown, Shield, RefreshCw, Lock, Mail, Star, Zap } from 'lucide-react'
import { SubscriptionCheckoutPanel } from '../subscription/SubscriptionCheckoutPanel'
import { LegalConsentBlock, isLegalConsentValid, type LegalConsentState, CGV_VERSION } from '../subscription/LegalConsentBlock'
import { createOneTimeCheckout } from '../../lib/billingClient'
import { SUBSCRIPTION_PLANS, ENTERPRISE_PLAN, TRIAL_AND_PILOT_PLANS, type BillingInterval, type CommercialPlanId } from '../../../shared/pricingCatalog' 
import { useStripeCheckout } from '../../hooks/useStripeCheckout' 

export type { BillingInterval }
export type Plan = {
  id: CommercialPlanId
  name: string
  tagline: string
  monthlyPrice: number | null
  priceLabel: string
  billingNote?: string
  features: string[]
  ctaLabel: string
  ctaHref?: string
  popular?: boolean
  entitlements?: { aiCredits: number | null; smsCredits: number | null }
  billing?: BillingInterval
}
export type PlanId = CommercialPlanId

export function getPlansForBilling(billing: BillingInterval): Plan[] {
  const recurring = SUBSCRIPTION_PLANS.map((p) => ({
    id: p.id, name: p.name, tagline: p.tagline,
    monthlyPrice: billing === 'monthly' ? p.monthlyPriceEurHt : p.annualPriceEurHt,
    priceLabel: String(billing === 'monthly' ? p.monthlyPriceEurHt : p.annualPriceEurHt),
    billingNote: billing === 'yearly' ? 'Facturation annuelle · 2 mois offerts' : 'Facturation mensuelle',
    features: p.features, ctaLabel: `Choisir ${p.name}`, popular: p.id === 'multi', entitlements: p.entitlements, billing,
  }))
  return [
    { id: 'trial', name: 'Essai gratuit', tagline: 'Découvrez Kompilot sans engagement.', monthlyPrice: 0, priceLabel: '0', billingNote: '14 jours · 150 crédits IA · 10 SMS', features: ['1 utilisateur', '1 établissement', '150 crédits IA', '10 SMS'], ctaLabel: 'Commencer gratuitement', entitlements: TRIAL_AND_PILOT_PLANS[0].entitlements },
    { id: 'pilot', name: 'Pilote 30 jours', tagline: 'Un accompagnement concret pour lancer votre cockpit.', monthlyPrice: 99, priceLabel: '99', billingNote: 'Paiement unique · 30 jours', features: ['2 utilisateurs', '1 établissement', '300 crédits IA', '25 SMS', 'Accompagnement guidé'], ctaLabel: 'Démarrer le pilote', entitlements: TRIAL_AND_PILOT_PLANS[1].entitlements },
    ...recurring,
    { id: 'enterprise', name: ENTERPRISE_PLAN.name, tagline: ENTERPRISE_PLAN.tagline, monthlyPrice: null, priceLabel: ENTERPRISE_PLAN.priceLabel, features: ENTERPRISE_PLAN.features, ctaLabel: ENTERPRISE_PLAN.ctaLabel, ctaHref: 'mailto:sales@kompilot.fr' },
  ]
}
export const PLANS = getPlansForBilling('monthly')

export function BillingToggle({ billing, onChange }: { billing: BillingInterval; onChange: (b: BillingInterval) => void }) {
  return <div className="flex items-center justify-center gap-3 mb-10"><button onClick={() => onChange('monthly')} className={`px-5 py-2.5 rounded-xl text-sm font-bold border ${billing === 'monthly' ? 'bg-primary/15 border-primary/40 text-primary' : 'border-border text-muted-foreground'}`}>Mensuel</button><button onClick={() => onChange('yearly')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border ${billing === 'yearly' ? 'bg-primary/15 border-primary/40 text-primary' : 'border-border text-muted-foreground'}`}>Annuel <span className="text-[10px]">1 mois offert</span></button></div>
}

export function PlanCard({ plan, index, checkoutPlanId, onCta, onCancelCheckout }: { plan: Plan; index: number; checkoutPlanId: CommercialPlanId | null; onCta: (p: Plan) => void; onCancelCheckout: () => void }) {
  const checked = checkoutPlanId === plan.id
  const enterprise = plan.id === 'enterprise'
  const [consent, setConsent] = useState<LegalConsentState>({ cgvAccepted: false, retractionWaived: false })
  const { startCheckout, loading } = useStripeCheckout()
  const startPilot = async () => {
    if (!isLegalConsentValid(consent)) return
    const result = await createOneTimeCheckout('pilot_30d_once', { ...consent, cgvVersion: CGV_VERSION, acceptedAt: new Date().toISOString(), userAgent: navigator.userAgent })
    if (result.url) window.open(result.url, '_blank', 'noopener,noreferrer')
    else toast.error('Paiement indisponible', { description: result.error || 'Veuillez réessayer.' })
  }
  const startRecurring = () => startCheckout(plan.id as 'pro' | 'multi' | 'agency', plan.billing ?? 'monthly', consent)
  return <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .06 }} className={`flex flex-col rounded-2xl border p-6 ${plan.popular ? 'border-primary shadow-xl shadow-primary/10' : 'border-border'} bg-card`}>
    {plan.popular && <div className="text-center -mt-6 -mx-6 mb-5 rounded-t-2xl bg-primary py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground">Formule phare</div>}
    <div className="flex items-center gap-2 mb-3">{enterprise ? <Mail size={16} className="text-muted-foreground" /> : plan.popular ? <Star size={16} className="text-primary" /> : <Zap size={16} className="text-primary" />}<h3 className="text-xl font-bold text-foreground">{plan.name}</h3></div>
    <p className="text-sm text-muted-foreground min-h-12">{plan.tagline}</p>
    <div className="my-5 border-b border-border pb-5">{plan.monthlyPrice === null ? <span className="text-3xl font-black text-foreground">Sur devis</span> : <><span className="text-5xl font-black text-foreground">{plan.priceLabel}€</span><span className="ml-1 text-sm text-muted-foreground">{plan.id === 'pilot' ? 'une fois' : 'HT / mois'}</span><p className="mt-2 text-xs text-muted-foreground">{plan.billingNote}</p></>}</div>
    {enterprise ? <a href={plan.ctaHref} className="mb-6 block rounded-xl border border-border py-3 text-center text-sm font-bold text-foreground hover:bg-muted">{plan.ctaLabel}</a> : plan.id === 'trial' ? <a href="/signup" className="mb-6 block rounded-xl bg-primary py-3 text-center text-sm font-bold text-primary-foreground hover:opacity-90">{plan.ctaLabel}</a> : <Button onClick={() => onCta(plan)} className="mb-6 w-full" disabled={loading}>{plan.ctaLabel}</Button>}
    <AnimatePresence>{checked && plan.id !== 'trial' && !enterprise && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-5 overflow-hidden">{plan.id === 'pilot' ? <div className="space-y-3"><LegalConsentBlock state={consent} onChange={setConsent} disabled={loading} /><Button onClick={startPilot} disabled={loading} className="w-full">{loading ? 'Redirection…' : 'Payer le pilote 99 € HT'}</Button></div> : <><LegalConsentBlock state={consent} onChange={setConsent} disabled={loading} /><SubscriptionCheckoutPanel planId={plan.id as 'pro' | 'multi' | 'agency'} planName={plan.name} billing={plan.billing} onCancel={onCancelCheckout} /></>}</motion.div>}</AnimatePresence>
    <ul className="mt-auto space-y-3">{plan.features.map((f) => <li key={f} className="flex gap-2 text-sm text-muted-foreground"><Check size={16} className="mt-0.5 shrink-0 text-primary" />{f}</li>)}</ul>
  </motion.div>
}

const FAQ_ITEMS = [{ q: 'Puis-je changer de plan à tout moment ?', a: 'Oui, les changements sont gérés depuis votre espace de facturation.' }, { q: 'Les prix sont-ils HT ou TTC ?', a: 'Tous les prix affichés sont hors taxes. La TVA applicable est calculée lors du paiement.' }, { q: 'Que sont les crédits IA et SMS ?', a: 'Chaque formule inclut un quota mensuel dédié, détaillé sur sa carte.' }, { q: 'Comment fonctionne Enterprise ?', a: 'Contactez sales@kompilot.fr pour un devis adapté à vos volumes.' }]
export function PricingFAQ() { const [open, setOpen] = useState<number | null>(null); return <div className="mx-auto mt-16 max-w-2xl px-4"><h3 className="mb-8 text-center text-xl font-bold text-foreground">Questions fréquentes</h3>{FAQ_ITEMS.map((item, i) => <div key={item.q} className="border-b border-border"><button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-foreground">{item.q}<ChevronDown size={16} className={open === i ? 'rotate-180' : ''} /></button>{open === i && <p className="pb-4 text-sm text-muted-foreground">{item.a}</p>}</div>)}</div> }
export function TrustStrip() { return <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground"><span><Shield size={15} className="mr-2 inline" />Paiement sécurisé Stripe</span><span><Lock size={15} className="mr-2 inline" />Données hébergées en Europe</span><span><RefreshCw size={15} className="mr-2 inline" />Sans engagement</span></div> }
export function CreditPacksSection() { return null }
