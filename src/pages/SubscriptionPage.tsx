import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Page, PageHeader, PageTitle, PageDescription, PageBody, Button, toast } from '@blinkdotnew/ui';
import { Check, Zap, ShieldCheck, Sparkles, Mail, Lock } from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';
import { useUserProfile } from '../context/UserProfileContext';
import { useDemoMode } from '../context/DemoModeContext';
import { SubscriptionCheckoutPanel } from '../components/subscription/SubscriptionCheckoutPanel';
import { WelcomeModal } from '../components/subscription/WelcomeModal';
import { useWelcomeEmail } from '../hooks/useWelcomeEmail';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { ENTERPRISE_PLAN, SUBSCRIPTION_PLANS } from '../../shared/pricingCatalog';

// ── Helpers ───────────────────────────────────────────────────────────────────
function monthYearLabel() {
  const s = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// The subscription page mirrors the shared commercial catalogue so legacy
// pack names and prices cannot resurface in account billing UI.
const B2C_PLANS = SUBSCRIPTION_PLANS.map((plan, index) => ({
  id: plan.id,
  emoji: index === 0 ? '⚡' : index === 1 ? '✦' : '◆',
  name: plan.name,
  tagline: plan.tagline,
  price: plan.monthlyPriceEurHt,
  priceLabel: `${plan.monthlyPriceEurHt}€ / mois HT`,
  badgeLabel: plan.name,
  badgeClass: index === 0 ? 'bg-teal-100 text-teal-700 border-teal-200' : index === 1 ? 'bg-violet-100 text-violet-700 border-violet-200' : 'bg-amber-100 text-amber-800 border-amber-200',
  gradient: index === 0 ? 'from-teal-600 to-emerald-500' : index === 1 ? 'from-violet-600 to-indigo-500' : 'from-amber-600 to-orange-500',
  popular: plan.id === 'multi',
  features: plan.features.slice(0, 3),
  ctaLabel: `Choisir ${plan.name}`,
  ctaVariant: (plan.id === 'pro' ? 'outline' : 'default') as 'outline' | 'default',
  ctaNote: null,
  isFree: false,
  contactOnly: false,
}));

const B2B_PLANS = [
  ...B2C_PLANS,
  {
    id: 'enterprise', emoji: '◇', name: ENTERPRISE_PLAN.name, tagline: ENTERPRISE_PLAN.tagline,
    price: null, priceLabel: ENTERPRISE_PLAN.priceLabel, badgeLabel: 'Sur devis', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    gradient: 'from-slate-700 to-slate-900', popular: false, features: ENTERPRISE_PLAN.features.slice(0, 3),
    ctaLabel: ENTERPRISE_PLAN.ctaLabel, ctaVariant: 'outline' as const, ctaNote: null, isFree: false, contactOnly: true,
  },
];

// ── Credit packs ──────────────────────────────────────────────────────────────
// Removed CREDIT_PACKS as per edit instruction.

// ── Checkout target ───────────────────────────────────────────────────────────
type CheckoutTarget = {
  planName: string;
  priceHT: number;
  invoiceDesc: string;
  isSubscription: boolean;
  /** For real Stripe subscription checkout via SubscriptionCheckoutPanel */
  stripePlanId?: 'pro' | 'multi' | 'agency';
  billing: 'monthly' | 'yearly';
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
// Removed CreditPackCard as per edit instruction.

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { currentPlan, setPlan } = useSubscription();
  const { profileType, isB2C } = useUserProfile();
  const { isDemoActive } = useDemoMode();
  const { user } = useAuth();
  const { sendWelcomeEmail } = useWelcomeEmail();
  // Initialize billing mode from profile type (B2B users see HT pricing by default)
  const [billingMode, setBillingMode] = useState<'b2c' | 'b2b'>(() =>
    profileType === 'b2b' ? 'b2b' : 'b2c'
  );
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>(() => {
    try { return localStorage.getItem('kompilot_pending_billing') === 'yearly' ? 'yearly' : 'monthly'; } catch { return 'monthly'; }
  });
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
      try {
        localStorage.removeItem('kompilot_skip_trial');
      } catch {
        // Local storage may be unavailable in privacy mode.
      }
      setShowTrialRenunciation(true);
    }

    if (!pendingPlan && !skipTrial) return;

    if (pendingPlan) {
      // Clear the stored plan
      try {
        localStorage.removeItem('kompilot_pending_plan');
        localStorage.removeItem('kompilot_pending_billing');
      } catch {
        // Local storage may be unavailable in privacy mode.
      }
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
        stripePlanId: found.id === 'pro' || found.id === 'multi' || found.id === 'agency' ? found.id : undefined,
        billing: billingInterval,
      });
      const msg = skipTrial ? `⚡ Accès immédiat — finalisez votre abonnement` : `Plan ${found.name} sélectionné`;
      toast.success(msg, { description: 'Finalisez votre abonnement ci-dessous.' });
    } else if (skipTrial) {
      // User skipped trial from signup — open the canonical Pro plan by default
      setCheckout({
        planName: 'Pro',
        priceHT: 69,
        invoiceDesc: `Abonnement Pro – ${monthYearLabel()}`,
        isSubscription: true,
        stripePlanId: 'pro',
        billing: billingInterval,
      });
      toast.success('⚡ Accès immédiat activé', { description: 'Cochez la case de renonciation pour confirmer.' });
    }
  }, [billingInterval]);

  const creditsLabel = 'Consommation gérée par la facturation';

  const handleB2CPlanSelect = (plan: typeof B2C_PLANS[number]) => {
    if (isDemoActive) {
      toast('Mode démo : action simulée, aucun envoi réel.');
      return;
    }
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
      stripePlanId: plan.id === 'pro' || plan.id === 'multi' || plan.id === 'agency' ? plan.id : undefined,
      billing: billingInterval,
    });
  };

  const handleB2BPlanSelect = (plan: typeof B2B_PLANS[number]) => {
    if (isDemoActive) {
      toast('Mode démo : action simulée, aucun envoi réel.');
      return;
    }
    if (plan.isFree) {
      navigate({ to: '/signup' });
      return;
    }
    if (plan.contactOnly) {
      window.location.href = 'mailto:contact@kompilot.fr';
      return;
    }
    const stripePlanId = plan.id === 'pro' || plan.id === 'multi' || plan.id === 'agency' ? plan.id : undefined;
    if (!stripePlanId) return;
    setCheckout({
      planName: plan.name,
      priceHT: plan.price!,
      invoiceDesc: `Abonnement ${plan.name} – ${monthYearLabel()}`,
      isSubscription: true,
      stripePlanId,
      billing: billingInterval,
    });
  };

  // Removed openCreditsCheckout as per edit instruction.

  const handlePaymentSuccess = () => {
    if (!checkout) return;
    if (checkout.isSubscription) {
      const nameToId: Record<string, 'pro' | 'multi' | 'agency'> = { Pro: 'pro', Multi: 'multi', Agency: 'agency' };
      const pid = nameToId[checkout.planName];
      if (pid) setPlan(pid);
      setWelcomeModal({ open: true, planName: checkout.planName });
      sendWelcomeEmail(checkout.planName);
      toast.success(`🎉 Offre ${checkout.planName} activée !`, {
        description: 'Votre abonnement est maintenant actif.',
      });
    } else {
      toast.success('Paiement confirmé', {
        description: 'Les crédits seront ajoutés par le backend après confirmation Stripe.',
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
            Choisissez l'offre adaptée à votre activité — Pro, Agency ou Enterprise.
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
                <span className="ml-1 text-muted-foreground font-normal">
                  {isDemoActive ? '· accès démo' : `· ${currentPlan.price}€/mois`}
                </span>
              </p>
            </div>
            {isDemoActive ? (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700 ml-2">
                <span className='w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse' /> Plan Actif 🟢
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-bold text-green-700 ml-2">
                <span className='w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse' /> Actif
              </span>
            )}
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
              👤 Pro{' '}
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

          <div className="flex rounded-xl border border-border overflow-hidden w-fit mb-7" aria-label="Période de facturation">
            {(['monthly', 'yearly'] as const).map(interval => (
              <button key={interval} type="button" onClick={() => setBillingInterval(interval)} className={cn('px-5 py-2.5 text-sm font-semibold transition-all', billingInterval === interval ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70')}>
                {interval === 'monthly' ? 'Mensuel' : 'Annuel'}
              </button>
            ))}
          </div>

          {/* B2C pre-selection banner */}
          {isB2C && billingMode === 'b2c' && (
            <div style={{ background: 'linear-gradient(90deg, rgba(13,148,136,.08), rgba(45,212,191,.06))', border: '1px solid rgba(13,148,136,.25)', borderRadius: 14, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.2rem' }}>🚀</span>
              <div>
                <p style={{ fontSize: '.82rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                  Offre Pro recommandée pour vous
                </p>
                <p style={{ fontSize: '.75rem', color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>
                  L'offre <strong>Pro à 69€ HT/mois</strong> est idéale pour démarrer.
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
        {/* Removed Credit packs shop section as per edit instruction. */}

      </PageBody>

      {/* ── Stripe checkout (subscriptions use real Stripe + clickwrap) ── */}
      {checkout?.isSubscription && checkout.stripePlanId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md">
            <SubscriptionCheckoutPanel
              planId={checkout.stripePlanId}
              planName={checkout.planName}
              billing={checkout.billing}
              onCancel={() => setCheckout(null)}
              onCheckoutOpened={() => { setCheckout(null); setShowTrialRenunciation(false); }}
              showTrialRenunciation={showTrialRenunciation}
            />
          </div>
        </div>
      )}

      {/* ── Credit pack checkout uses old modal (one-time, no subscription) ── */}
      {/* Removed StripePaymentModal usage as per edit instruction. */}

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
