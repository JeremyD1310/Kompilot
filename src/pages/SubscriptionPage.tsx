import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Page, PageHeader, PageTitle, PageDescription, PageBody, Button, toast } from '@blinkdotnew/ui';
import { Check, Zap, ShieldCheck, Sparkles, Package, Mail, Lock } from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';
import { useCredits } from '../context/CreditsContext';
import { useUserProfile } from '../context/UserProfileContext';
import { useDemoMode } from '../context/DemoModeContext';
import { StripePaymentModal } from '../components/subscription/StripePaymentModal';
import { SubscriptionCheckoutPanel } from '../components/subscription/SubscriptionCheckoutPanel';
import { WelcomeModal } from '../components/subscription/WelcomeModal';
import { useWelcomeEmail } from '../hooks/useWelcomeEmail';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';

// ── Helpers ───────────────────────────────────────────────────────────────────
function monthYearLabel() {
  const s = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── B2C Plans ─────────────────────────────────────────────────────────────────
const B2C_PLANS = [
  {
    id: 'starter',
    emoji: '⚡',
    name: 'Starter',
    tagline: 'Pour une activité locale qui veut piloter sa présence.',
    price: 69,
    priceLabel: '69€ / mois HT',
    badgeLabel: 'Starter',
    badgeClass: 'bg-teal-100 text-teal-700 border-teal-200',
    gradient: 'from-teal-600 to-emerald-500',
    popular: false,
    features: ['Pilotage de présence locale', 'Contenus préparés par l’IA', 'Calendrier éditorial', 'Boîte de réception unifiée'],
    ctaLabel: 'Choisir Starter',
    ctaVariant: 'outline' as const,
    ctaNote: null,
    isFree: false,
    contactOnly: false,
  },
  {
    id: 'agency',
    emoji: '✦',
    name: 'Agency',
    tagline: 'Pour les équipes et agences qui gèrent plusieurs clients.',
    price: 149,
    priceLabel: '149€ / mois HT',
    badgeLabel: 'Formule phare',
    badgeClass: 'bg-violet-100 text-violet-700 border-violet-200',
    gradient: 'from-violet-600 to-indigo-500',
    popular: true,
    features: ['Multi-comptes et multi-établissements', 'Marque blanche et reporting client', 'Contenus préparés par l’IA', 'Support prioritaire'],
    ctaLabel: 'Choisir Agency',
    ctaVariant: 'default' as const,
    ctaNote: null,
    isFree: false,
    contactOnly: false,
  },
  {
    id: 'enterprise',
    emoji: '◈',
    name: 'Enterprise',
    tagline: 'Pour les réseaux et besoins sur mesure.',
    price: null as null | number,
    priceLabel: 'Sur devis HT',
    badgeLabel: 'Entreprise',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    gradient: 'from-slate-700 to-slate-500',
    popular: false,
    features: ['Périmètre fonctionnel sur mesure', 'Accompagnement dédié', 'SLA et intégrations personnalisées'],
    ctaLabel: 'Nous contacter',
    ctaVariant: 'outline' as const,
    ctaNote: null,
    isFree: false,
    contactOnly: true,
  },
] as const;

// The same canonical catalogue is used for professional accounts. Keeping one
// shape here avoids old subscription prices resurfacing through profile tabs.
const B2B_PLANS = B2C_PLANS;

// ── Credit packs ──────────────────────────────────────────────────────────────
const CREDIT_PACKS = [
  { id: 'starter',  label: 'Pack Starter',  credits: 5,  priceTTC: 4.99,  color: 'from-slate-500 to-slate-400',  badge: null,        desc: 'Pour tester sans engagement' },
  { id: 'boost',    label: 'Pack Boost',    credits: 20, priceTTC: 14.99, color: 'from-primary to-teal-400',      badge: 'Populaire', desc: 'Le meilleur rapport qualité/prix' },
  { id: 'business', label: 'Pack Business', credits: 50, priceTTC: 29.99, color: 'from-violet-600 to-violet-400', badge: null,        desc: 'Pour les pros qui publient souvent' },
];

// ── Checkout target ───────────────────────────────────────────────────────────
type CheckoutTarget = {
  planName: string;
  priceHT: number;
  invoiceDesc: string;
  isSubscription: boolean;
  creditsToAdd?: number;
  /** For real Stripe subscription checkout via SubscriptionCheckoutPanel */
  stripePlanId?: 'starter' | 'agency';
};

// ── Plan card ─────────────────────────────────────────────────────────────────
type PlanDef = (typeof B2C_PLANS)[number] | (typeof B2B_PLANS)[number];

function PlanCard({ plan, onSelect }: { plan: PlanDef; onSelect: () => void }) {
  return (
    <div className={cn(
      'relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-200 bg-card',
      plan.popular
        ? 'border-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.2)] scale-[1.02]'
        : 'border-border hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5',
    )}>
      {/* Popular banner */}
      {plan.popular && (
        <div className="bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-widest text-center py-1.5">
          ⭐ Mis en avant
        </div>
      )}

      {/* Gradient header */}
      <div className={cn('relative bg-gradient-to-br px-5 pt-5 pb-6 overflow-hidden', plan.gradient)}>
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-black/10 pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between gap-2">
          <div>
            <span className="text-2xl leading-none">{plan.emoji}</span>
            <h3 className="text-white font-extrabold text-lg mt-1 leading-tight">{plan.name}</h3>
            <p className="text-white/75 text-xs mt-0.5">{plan.tagline}</p>
          </div>
          <span className={cn('shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold mt-0.5', plan.badgeClass)}>
            {plan.badgeLabel}
          </span>
        </div>
        <div className="relative z-10 mt-4">
          {plan.price !== null ? (
            <div className="flex items-baseline gap-1">
              <span className="text-white text-3xl font-extrabold">{plan.price}€</span>
              <span className="text-white/70 text-sm">/ mois</span>
            </div>
          ) : (
            <span className="text-white text-xl font-extrabold">{plan.priceLabel}</span>
          )}
        </div>
      </div>

      {/* Features + CTA */}
      <div className="px-5 py-5 flex flex-col flex-1 gap-5">
        <ul className="space-y-2.5 flex-1">
          {plan.features.map((f, idx) => {
            const isQuota = idx === 0 && (f.includes('Posts') || f.includes('Stories'));
            return (
              <li key={f} className={isQuota ? 'flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-2.5 py-1.5 -mx-0.5' : 'flex items-start gap-2.5'}>
                <Check size={14} className={isQuota ? 'shrink-0 text-green-600 mt-0' : 'shrink-0 text-green-500 mt-0.5'} strokeWidth={2.5} />
                <span className={isQuota ? 'text-xs text-green-800 font-bold leading-snug' : 'text-xs text-foreground leading-snug'}>{f}</span>
              </li>
            );
          })}
        </ul>

        <div className="space-y-2">
          <Button
            onClick={onSelect}
            variant={plan.ctaVariant}
            className="w-full gap-2"
          >
            {plan.contactOnly && <Mail size={14} />}
            {!plan.contactOnly && !plan.isFree && <Zap size={14} />}
            {plan.ctaLabel}
          </Button>
          {plan.isFree && (
            <p className="text-center text-[11px] text-muted-foreground">
              {(plan as typeof B2C_PLANS[0]).ctaNote}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Credit pack card ──────────────────────────────────────────────────────────
function CreditPackCard({ pack, onBuy }: { pack: typeof CREDIT_PACKS[0]; onBuy: () => void }) {
  return (
    <div className={cn(
      'relative rounded-2xl border overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg',
      pack.badge ? 'border-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.2)]' : 'border-border',
    )}>
      <div className={cn('bg-gradient-to-br px-5 py-5 relative overflow-hidden', pack.color)}>
        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
        {pack.badge && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-white/20 text-white rounded-full px-2.5 py-0.5 mb-2">
            ⭐ {pack.badge}
          </span>
        )}
        <div className="flex items-end justify-between gap-2 relative z-10">
          <div>
            <p className="text-white/80 text-xs font-semibold">{pack.label}</p>
            <p className="text-white text-3xl font-extrabold leading-tight">{pack.credits}</p>
            <p className="text-white/80 text-xs">crédits</p>
          </div>
          <div className="text-right">
            <p className="text-white text-xl font-extrabold">{pack.priceTTC}€</p>
            <p className="text-white/70 text-[11px]">TTC · paiement unique</p>
          </div>
        </div>
      </div>
      <div className="px-5 py-4 flex-1 flex flex-col gap-3 bg-card">
        <p className="text-xs text-muted-foreground">{pack.desc}</p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Check size={12} className="text-green-500 shrink-0" /> Sans abonnement
          <span className="mx-1">·</span>
          <Check size={12} className="text-green-500 shrink-0" /> Valable 12 mois
        </div>
        <Button onClick={onBuy} variant={pack.badge ? 'default' : 'outline'} className="w-full gap-2 mt-auto">
          <Package size={14} /> Acheter ce pack
        </Button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { currentPlan, setPlan } = useSubscription();
  const { credits, addCredits } = useCredits();
  const { profileType, isB2C } = useUserProfile();
  const { isDemoActive } = useDemoMode();
  const { user } = useAuth();
  const { sendWelcomeEmail } = useWelcomeEmail();
  // Initialize billing mode from profile type (B2B users see HT pricing by default)
  const [billingMode, setBillingMode] = useState<'b2c' | 'b2b'>(() =>
    profileType === 'b2b' ? 'b2b' : 'b2c'
  );
  const [checkout, setCheckout] = useState<CheckoutTarget | null>(null);
  const [welcomeModal, setWelcomeModal] = useState<{ open: boolean; planName: string }>({ open: false, planName: '' });
  // Detected from localStorage when user checked "skip trial" on signup
  const [showTrialRenunciation, setShowTrialRenunciation] = useState(false);

  // Keep billingMode in sync if profileType changes
  useEffect(() => {
    if (profileType === 'b2b') setBillingMode('b2b');
    else if (profileType === 'b2c') setBillingMode('b2c');
  }, [profileType]);

  // Auto-trigger checkout if redirected from landing page with ?plan= param
  // Also detect if user checked "skip trial" on signup (kompilot_skip_trial in localStorage)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pendingPlan = params.get('plan') || (() => {
      try { return localStorage.getItem('kompilot_pending_plan'); } catch { return null; }
    })();

    // Detect trial-skip intent from signup screen
    const skipTrial = (() => {
      try { return localStorage.getItem('kompilot_skip_trial') === 'true'; } catch { return false; }
    })();
    if (skipTrial) {
      try { localStorage.removeItem('kompilot_skip_trial'); } catch {}
      setShowTrialRenunciation(true);
    }

    if (!pendingPlan && !skipTrial) return;

    if (pendingPlan) {
      // Clear the stored plan
      try { localStorage.removeItem('kompilot_pending_plan'); } catch {}
      // Remove ?plan from URL without page reload
      const url = new URL(window.location.href);
      url.searchParams.delete('plan');
      window.history.replaceState({}, '', url.toString());
    }

    // Map planId → checkout
    const allPlans = [...B2C_PLANS, ...B2B_PLANS];
    const found = pendingPlan ? allPlans.find(p =>
      p.id === pendingPlan ||
      p.name.toLowerCase().replace(/\s+/g, '-') === pendingPlan.toLowerCase()
    ) : null;

    if (found && !found.isFree && !(found as any).contactOnly && found.price != null) {
      const priceHT = found.price!;
      setCheckout({
        planName: found.name,
        priceHT,
        invoiceDesc: `Abonnement ${found.name} – ${monthYearLabel()}`,
        isSubscription: true,
        stripePlanId: found.id === 'starter' ? 'starter' : 'agency',
      });
      const msg = skipTrial ? `⚡ Accès immédiat — finalisez votre abonnement` : `Plan ${found.name} sélectionné`;
      toast.success(msg, { description: 'Finalisez votre abonnement ci-dessous.' });
    } else if (skipTrial) {
      // User skipped trial from signup — open the canonical Pro plan by default
      setCheckout({
        planName: 'Starter',
        priceHT: 69,
        invoiceDesc: `Abonnement Starter – ${monthYearLabel()}`,
        isSubscription: true,
        stripePlanId: 'starter',
      });
      toast.success('⚡ Accès immédiat activé', { description: 'Cochez la case de renonciation pour confirmer.' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const creditsLabel = credits === 'unlimited' ? 'Illimité' : `${credits} crédits restants`;

  const handleB2CPlanSelect = (plan: typeof B2C_PLANS[number]) => {
    if (plan.contactOnly) {
      window.location.href = 'mailto:sales@kompilot.fr';
      return;
    }
    const priceHT = plan.price!;
    setCheckout({
      planName: plan.name,
      priceHT,
      invoiceDesc: `Abonnement ${plan.name} – ${monthYearLabel()}`,
      isSubscription: true,
      stripePlanId: plan.id === 'starter' ? 'starter' : 'agency',
    });
  };

  const handleB2BPlanSelect = (plan: typeof B2B_PLANS[number]) => {
    if (plan.isFree) {
      navigate({ to: '/signup' });
      return;
    }
    if (plan.contactOnly) {
      window.location.href = 'mailto:contact@kompilot.fr';
      return;
    }
    const stripePlanId: 'starter' | 'agency' =
      plan.id === 'starter' ? 'starter' : 'agency';
    setCheckout({
      planName: plan.name,
      priceHT: plan.price!,
      invoiceDesc: `Abonnement ${plan.name} – ${monthYearLabel()}`,
      isSubscription: true,
      stripePlanId,
    });
  };

  const openCreditsCheckout = (pack: typeof CREDIT_PACKS[0]) => {
    setCheckout({
      planName: `${pack.label} — ${pack.credits} crédits`,
      priceHT: parseFloat((pack.priceTTC / 1.2).toFixed(2)),
      invoiceDesc: `${pack.label} – ${pack.credits} crédits`,
      isSubscription: false,
      creditsToAdd: pack.credits,
    });
  };

  const handlePaymentSuccess = () => {
    if (!checkout) return;
    if (checkout.isSubscription) {
      const nameToId: Record<string, string> = { Starter: 'starter', Agency: 'agency' };
      const pid = nameToId[checkout.planName];
      if (pid) setPlan(pid as 'starter' | 'agency');
      setWelcomeModal({ open: true, planName: checkout.planName });
      sendWelcomeEmail(checkout.planName);
      toast.success(`🎉 Offre ${checkout.planName} activée !`, {
        description: 'Votre abonnement est maintenant actif.',
      });
    } else {
      if (checkout.creditsToAdd) addCredits(checkout.creditsToAdd);
      toast.success(`+${checkout.creditsToAdd} crédits ajoutés !`, {
        description: 'Votre solde a été mis à jour en temps réel.',
      });
    }
    setCheckout(null);
  };

  return (
    <Page>
      <PageHeader>
        <div>
          <PageTitle className="flex items-center gap-2">
            <Zap size={22} className="text-primary" /> Mon Abonnement
          </PageTitle>
          <PageDescription>
            Choisissez l'offre adaptée à votre activité — Starter, Agency ou Enterprise.
          </PageDescription>
        </div>
      </PageHeader>

      <PageBody className="space-y-10">

        {/* -- Demo mode notice -- */}
        {isDemoActive && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-300/60 bg-gradient-to-r from-emerald-50 to-teal-50/60 px-5 py-4">
            <span className="text-2xl shrink-0">🎁</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-emerald-800">Accès Démo Total activé</p>
              <p className="text-xs text-emerald-700/80 mt-0.5">
                Vous bénéficiez de toutes les fonctionnalités de l'offre <strong>Agency</strong> gratuitement pendant cette démonstration.
              </p>
            </div>
            <span className="shrink-0 flex items-center gap-1.5 rounded-full bg-emerald-500 text-white px-3 py-1 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Accès Démo Total
            </span>
          </div>
        )}

        {/* -- Current plan + credits badge -- */}
        <div className="flex flex-wrap items-center gap-3">
          <div className={cn(
            'flex items-center gap-3 rounded-2xl border bg-card px-5 py-4',
            isDemoActive ? 'border-emerald-300/60 bg-gradient-to-r from-emerald-50/60 to-teal-50/40' : 'border-border',
          )}>
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isDemoActive ? "bg-emerald-100" : "bg-primary/10")}>
              <ShieldCheck size={16} className={isDemoActive ? "text-emerald-600" : "text-primary"} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Offre actuelle</p>
              <p className="text-sm font-bold text-foreground">
                {isDemoActive ? 'Agency' : currentPlan.name}
                {isDemoActive ? (
                  <span className="ml-1 text-muted-foreground font-normal">· accès démo</span>
) : currentPlan.price > 0 ? (
                  <span className="ml-1 text-muted-foreground font-normal">· {currentPlan.price}€/mois</span>
                ) : null}
              </p>
            </div>
            {isDemoActive ? (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700 ml-2">
                <span className='w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse' /> Plan Actif 🟢
              </span>
            ) : currentPlan.id !== 'free' ? (
              <span className="flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-bold text-green-700 ml-2">
                <span className='w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse' /> Actif
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isDemoActive ? "bg-emerald-100" : "bg-amber-100")}>
              <Zap size={16} className={isDemoActive ? "text-emerald-600" : "text-amber-600"} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Solde de crédits</p>
              <p className="text-sm font-bold text-foreground">
                {isDemoActive ? '999 / 999 crédits 🟢' : creditsLabel}
              </p>
            </div>
          </div>
        </div>


        {/* ── Billing mode tabs ── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Offres mensuelles
          </h2>

          <div className="flex rounded-xl border border-border overflow-hidden w-fit mb-7">
            <button
              onClick={() => setBillingMode('b2c')}
              className={cn(
                'px-5 py-2.5 text-sm font-semibold transition-all',
                billingMode === 'b2c'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70',
              )}
            >
              👤 Starter{' '}
              <span className="ml-1 text-[10px] font-bold opacity-70">HT</span>
            </button>
            <button
              onClick={() => setBillingMode('b2b')}
              className={cn(
                'px-5 py-2.5 text-sm font-semibold transition-all',
                billingMode === 'b2b'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70',
              )}
            >
              💼 Agency / Enterprise{' '}
              <span className="ml-1 text-[10px] font-bold opacity-70">HT</span>
            </button>
          </div>

          {/* B2C pre-selection banner */}
          {isB2C && billingMode === 'b2c' && (
            <div style={{ background: 'linear-gradient(90deg, rgba(13,148,136,.08), rgba(45,212,191,.06))', border: '1px solid rgba(13,148,136,.25)', borderRadius: 14, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.2rem' }}>🚀</span>
              <div>
                <p style={{ fontSize: '.82rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                  Offre Starter recommandée pour vous
                </p>
                <p style={{ fontSize: '.75rem', color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>
                  L'offre <strong>Starter à 69€ HT/mois</strong> est idéale pour démarrer.
                </p>
              </div>
            </div>
          )}

          {/* B2C plans */}
          {billingMode === 'b2c' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start max-w-2xl">
              {B2C_PLANS.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onSelect={() => handleB2CPlanSelect(plan)}
                />
              ))}
            </div>
          )}

          {/* B2B plans */}
          {billingMode === 'b2b' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
              {B2B_PLANS.map((plan) => {
                const isActiveDemoPlan = isDemoActive && plan.id === 'agency';
                const isOtherDemoPlan = isDemoActive && plan.id !== 'agency';
                return (
                  <div key={plan.id} className="relative">
                    {/* Active demo overlay for Agency plan */}
                    {isActiveDemoPlan && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-emerald-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Plan Actif 🟢 · Accès Démo Total
                      </div>
                    )}
                    <div className={cn(
                      'transition-all duration-200',
                      isActiveDemoPlan ? 'ring-2 ring-emerald-400 ring-offset-2 rounded-2xl shadow-lg' : '',
                      isOtherDemoPlan ? 'opacity-50' : '',
                    )}>
                      <PlanCard
                        plan={plan}
                        onSelect={isOtherDemoPlan ? () => {} : () => handleB2BPlanSelect(plan)}
                      />
                    </div>
                    {/* "Inclus" overlay for non-Agency plans in demo mode */}
                    {isOtherDemoPlan && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/40 backdrop-blur-[1px] z-10">
                        <span className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2 text-xs font-bold text-muted-foreground shadow-sm">
                          <Lock size={12} /> Inclus dans le Mode Démo
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-5">
            {billingMode === 'b2c'
              ? 'Prix HT · Paiement sécurisé · Résiliation à tout moment'
              : "Prix HT · Paiement sécurisé · Enterprise sur devis · Résiliation à tout moment"}
          </p>
        </section>

        {/* ── Credit packs shop ── */}
        <section>
          <div className="flex items-center gap-3 mb-1">
            <Sparkles size={18} className="text-primary" />
            <h2 className="text-lg font-extrabold text-foreground">Besoin de publier ponctuellement ?</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-5 ml-7">
            Achetez des crédits sans engagement. Chaque crédit = 1 publication (Post ou Story) planifiée avec l'IA.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {CREDIT_PACKS.map((pack) => (
              <CreditPackCard key={pack.id} pack={pack} onBuy={() => openCreditsCheckout(pack)} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Prix TTC · Paiement unique · Valable 12 mois · Sans abonnement requis
          </p>
        </section>

      </PageBody>

      {/* ── Stripe checkout (subscriptions use real Stripe + clickwrap) ── */}
      {checkout?.isSubscription && checkout.stripePlanId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md">
            <SubscriptionCheckoutPanel
              planId={checkout.stripePlanId}
              planName={checkout.planName}
              onCancel={() => setCheckout(null)}
              onCheckoutOpened={() => { setCheckout(null); setShowTrialRenunciation(false); }}
              showTrialRenunciation={showTrialRenunciation}
            />
          </div>
        </div>
      )}

      {/* ── Credit pack checkout uses old modal (one-time, no subscription) ── */}
      {checkout && !checkout.isSubscription && (
        <StripePaymentModal
          open={!!checkout}
          onClose={() => setCheckout(null)}
          planName={checkout.planName}
          priceHT={checkout.priceHT}
          invoiceDesc={checkout.invoiceDesc}
          isSubscription={false}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* ── Welcome modal (post-payment) ── */}
      <WelcomeModal
        open={welcomeModal.open}
        onClose={() => setWelcomeModal({ open: false, planName: '' })}
        planName={welcomeModal.planName}
        firstName={user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0]}
      />
    </Page>
  );
}
