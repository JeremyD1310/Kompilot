/**
 * BillingTab — Smart router: detects account type and renders the appropriate
 * billing dashboard.
 *
 * - Agency / agency_owner → AgencyBillingDashboard (centralized/connected mode,
 *   consolidated sub-account table, white-label protection, no Kompilot branding
 *   on client-facing documents)
 * - Pro / other           → ProBillingDashboard (direct Stripe invoices, portal, PDF)
 */

import { useState, useEffect } from 'react';
import {
  Card, CardHeader, CardTitle, CardContent, Button, Badge, Skeleton,
} from '@blinkdotnew/ui';
import {
  CreditCard, ChevronDown, ChevronUp, Zap, Check, Sparkles,
  ArrowUpCircle, AlertTriangle, ExternalLink,
  ShieldCheck, Loader2,
} from 'lucide-react';
import { PLANS, type PlanId, type Plan, useSubscription } from '../../context/SubscriptionContext';
import { BillingHistorySection } from '../subscription/BillingHistorySection';
import { CreditsTopUpSection } from '../subscription/CreditsTopUpSection';
import { toast } from '@blinkdotnew/ui';
import { useWelcomeEmail } from '../../hooks/useWelcomeEmail';
import { useStripeCheckout } from '../../hooks/useStripeCheckout';
import { useStripeWebhookStatus } from '../../hooks/useStripeWebhookStatus';
import { SubscriptionStatusBanner } from '../subscription/SubscriptionStatusBanner';
import { BillingPortalButton } from '../subscription/BillingPortalButton';
import {
  LegalConsentBlock,
  isLegalConsentValid,
  type LegalConsentState,
} from '../subscription/LegalConsentBlock';
import {
  getPaymentFailed,
  getGracePeriodEnd,
} from '../../lib/billingStorage';
import {
  createBillingPortalSession,
  portalErrorLabel,
  fetchBillingStatus,
  type BillingStatus,
} from '../../lib/billingClient';
import { useAuth } from '../../hooks/useAuth';
import { ProBillingDashboard } from './ProBillingDashboard';
import { AgencyBillingDashboard } from './AgencyBillingDashboard';
import { CurrentPlanBadge } from '../subscription/CurrentPlanBadge';
import type { BillingInterval } from '../../../shared/pricingCatalog';

// ── Helpers ───────────────────────────────────────────────────────────────────

function isAgencyRole(role?: string | null): boolean {
  return role === 'agency' || role === 'agency_owner' || role === 'freelance_agency';
}

// ── Customer Portal Card ──────────────────────────────────────────────────────

function CustomerPortalCard() {
  const [loading, setLoading] = useState(false);
  const gracePeriodEnd = getGracePeriodEnd();
  const paymentFailed  = getPaymentFailed();
  const { subscriptionStatus } = useSubscription();

  const isCancelled = subscriptionStatus === 'cancelled' || subscriptionStatus === 'unpaid';

  const graceRemaining = (() => {
    if (!gracePeriodEnd) return null;
    const ms = gracePeriodEnd.getTime() - Date.now();
    const days = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
    return days;
  })();

  const handlePortal = async () => {
    setLoading(true);
    try {
      const result = await createBillingPortalSession();
      if (result.url) {
        window.open(result.url, '_blank', 'noopener,noreferrer');
      } else {
        const label = portalErrorLabel(result.error!);
        toast.error('Portail inaccessible', { description: label });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-2xl border-primary/30 bg-gradient-to-br from-primary/5 to-teal-50/30 shadow-sm overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-primary to-teal-400" />
      <CardHeader className="pb-3 pt-5">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <ShieldCheck size={14} className="text-white" />
          </div>
          Gérer mon abonnement et mes factures
          <span className="ml-auto shrink-0 text-[10px] font-bold bg-primary/10 text-primary rounded-full px-2.5 py-0.5 border border-primary/20">
            Portail sécurisé
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pb-5">
        {paymentFailed && graceRemaining !== null && (
          <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-300/60 px-4 py-3">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-900">
                Paiement refusé — {graceRemaining} jour{graceRemaining !== 1 ? 's' : ''} de grâce restant{graceRemaining !== 1 ? 's' : ''}
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                Mettez à jour votre carte de paiement pour maintenir vos services actifs.
              </p>
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
            <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-900">Abonnement inactif</p>
              <p className="text-[11px] text-red-700 mt-0.5 leading-relaxed">
                Les agents IA et scans automatiques sont suspendus. Réactivez votre plan pour les relancer immédiatement.
              </p>
            </div>
          </div>
        )}

        <ul className="space-y-1.5">
          {[
            'Mettre à jour votre carte bancaire',
            'Télécharger vos factures PDF',
            'Changer ou annuler votre plan',
            "Voir l'historique de paiements",
          ].map(item => (
            <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Check size={12} className="text-primary shrink-0" strokeWidth={2.5} />
              {item}
            </li>
          ))}
        </ul>

        <Button
          onClick={handlePortal}
          disabled={loading}
          className="w-full h-11 gap-2 rounded-xl text-sm font-bold shadow-sm"
        >
          {loading ? (
            <><Loader2 size={15} className="animate-spin" /> Ouverture du portail…</>
          ) : (
            <><CreditCard size={15} /> Gérer mon abonnement et mes factures <ExternalLink size={12} /></>
          )}
        </Button>

        <p className="text-center text-[10px] text-muted-foreground/60">
          Portail sécurisé par Stripe · Aucune donnée bancaire stockée sur nos serveurs
        </p>
      </CardContent>
    </Card>
  );
}

// ── Plan picker ───────────────────────────────────────────────────────────────

const PLAN_HIGHLIGHTS: Record<string, string[]> = {
  pro:    ['1 établissement', '1 utilisateur', 'Crédits IA inclus', 'Boîte de réception'],
  multi:  ['3 établissements', '3 utilisateurs', 'Crédits IA renforcés', 'Gestion multi-sites'],
  agency: ['10 établissements', '5 utilisateurs', 'Crédits IA avancés', 'Rapports PDF'],
};

function PlanOption({ plan, isCurrent, isRecommended, onSelect, checkoutLoading, isPending }: {
  plan: Plan; isCurrent: boolean; isRecommended?: boolean; onSelect: (id: PlanId) => void; checkoutLoading?: boolean; isPending?: boolean;
}) {
  const isExpert = plan.id === 'agency';
  const highlights = PLAN_HIGHLIGHTS[plan.id] ?? [];

  return (
    <div className={`relative rounded-xl border p-4 transition-all ${
      isCurrent
        ? 'border-primary/30 bg-primary/[0.03]'
        : isPending
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
          : isExpert
            ? 'border-violet-300 bg-violet-50/30 hover:border-violet-400'
            : isRecommended
              ? 'border-primary shadow-sm hover:shadow-md'
              : 'border-border hover:border-primary/40'
    }`}>
      {isRecommended && !isCurrent && (
        <span className="absolute -top-2.5 left-3 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5">
          ⭐ Populaire
        </span>
      )}
      {isExpert && !isCurrent && (
        <span className="absolute -top-2.5 left-3 rounded-full bg-violet-600 text-white text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5">
          <Sparkles size={8} className="inline mr-0.5" />Stories incluses
        </span>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-sm font-bold text-foreground">{plan.name}</p>
            {isCurrent && <Badge variant="secondary" className="text-[10px] py-0">Actuel</Badge>}
          </div>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-2xl font-extrabold text-foreground">{plan.price}€</span>
            <span className="text-xs text-muted-foreground">/mois TTC</span>
          </div>
          <ul className="space-y-0.5">
            {highlights.map(h => (
              <li key={h} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Check size={11} className="text-green-500 shrink-0" strokeWidth={2.5} />{h}
              </li>
            ))}
          </ul>
        </div>
        <div className="shrink-0 mt-1">
          {isCurrent ? (
            <div className="flex items-center gap-1 rounded-lg bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5">
              <Check size={12} strokeWidth={2.5} /> Actif
            </div>
          ) : plan.price === 0 ? (
            <Button size="sm" variant="ghost" onClick={() => onSelect(plan.id)} className="text-xs h-8">Rétrograder</Button>
          ) : (
            <Button size="sm" onClick={() => onSelect(plan.id)} disabled={checkoutLoading}
              className={`gap-1.5 text-xs h-8 ${isExpert ? 'bg-violet-600 hover:bg-violet-700 text-white' : ''}`}>
              {checkoutLoading ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
              {checkoutLoading ? 'Ouverture…' : `Choisir ${plan.name}`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function UpgradeSection() {
  const { currentPlan } = useSubscription();
  const { sendWelcomeEmail } = useWelcomeEmail();
  const { startCheckout, loading: checkoutLoading } = useStripeCheckout();
  const [expanded, setExpanded] = useState(false);
  const [pendingPlanId, setPendingPlanId] = useState<PlanId | null>(null);
  const [billing, setBilling] = useState<BillingInterval>('monthly');
  const [legalConsent, setLegalConsent] = useState<LegalConsentState>({
    cgvAccepted: false,
    retractionWaived: false,
  });

  const handleSelect = async (id: PlanId) => {
    if (id === currentPlan.id) return;
    const plan = PLANS.find(p => p.id === id)!;
    // Paid plan → show legal consent block first, then checkout
    setPendingPlanId(id);
    setLegalConsent({ cgvAccepted: false, retractionWaived: false });
  };

  const handleConfirmCheckout = async () => {
    if (!pendingPlanId || !isLegalConsentValid(legalConsent)) return;
    const plan = PLANS.find(p => p.id === pendingPlanId)!;
    await startCheckout(pendingPlanId, billing, legalConsent);
    sendWelcomeEmail(`Offre ${plan.name}`);
  };

  const upgradePlans = PLANS.filter(p => p.price > currentPlan.price);
  const hasUpgrades = upgradePlans.length > 0;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <CreditCard size={14} className="text-primary" />
              </div>
              Abonnement actuel
            </CardTitle>
            {hasUpgrades && (
              <button onClick={() => setExpanded(v => !v)}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                {expanded ? <><ChevronUp size={14} /> Masquer les offres</> : <><ArrowUpCircle size={14} /> Changer d'offre</>}
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-muted/40 border border-border px-5 py-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-base font-bold text-foreground">{currentPlan.name}</p>
                <Badge variant={currentPlan.id === 'pro' ? 'default' : 'outline'} className="rounded-full text-xs">
                  {currentPlan.name}
                </Badge>
                <span className="flex items-center gap-1 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Actif
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {currentPlan.unlimited
                    ? `Réseaux illimités · ${currentPlan.maxPosts} posts/mois · ${currentPlan.price}€/mois`
                    : `${currentPlan.maxNetworks} réseaux · ${currentPlan.maxPosts} posts/mois · ${currentPlan.price}€/mois`}
              </p>
            </div>
            {hasUpgrades && !expanded && (
              <Button size="sm" onClick={() => setExpanded(true)} className="gap-1.5 shrink-0">
                <Zap size={13} /> Upgrader
              </Button>
            )}
          </div>


          {expanded && (
            <div className="space-y-3 pt-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Choisissez votre offre</p>
              <div className="grid grid-cols-1 gap-3">
                {PLANS.map(plan => (
                  <PlanOption key={plan.id} plan={plan} isCurrent={currentPlan.id === plan.id}
                    isRecommended={plan.id === 'multi'} onSelect={handleSelect}
                    checkoutLoading={checkoutLoading && plan.id === pendingPlanId}
                    isPending={pendingPlanId === plan.id} />
                ))}
              </div>

              {/* ── Clickwrap légal — affiché dès qu'un plan payant est sélectionné ── */}
              {pendingPlanId && (
                <div className="space-y-3 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2 pb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <p className="text-xs font-semibold text-foreground">
                      Offre {PLANS.find(p => p.id === pendingPlanId)?.name} sélectionnée — validez votre consentement pour continuer
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2" aria-label="Période de facturation">
                    {(['monthly', 'yearly'] as const).map(interval => (
                      <Button
                        key={interval}
                        type="button"
                        size="sm"
                        variant={billing === interval ? 'default' : 'outline'}
                        onClick={() => setBilling(interval)}
                        disabled={checkoutLoading}
                      >
                        {interval === 'monthly' ? 'Mensuel' : 'Annuel'}
                      </Button>
                    ))}
                  </div>

                  <LegalConsentBlock
                    state={legalConsent}
                    onChange={setLegalConsent}
                    disabled={checkoutLoading}
                  />

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-9"
                      onClick={() => setPendingPlanId(null)}
                      disabled={checkoutLoading}
                    >
                      Annuler
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleConfirmCheckout}
                      disabled={!isLegalConsentValid(legalConsent) || checkoutLoading}
                      className="flex-1 gap-1.5 text-xs h-9"
                    >
                      {checkoutLoading
                        ? <><Loader2 size={12} className="animate-spin" /> Ouverture…</>
                        : <><Zap size={12} /> Confirmer et payer</>
                      }
                    </Button>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground text-center pt-1">
                Prix TTC · Résiliation sans engagement · Facture générée automatiquement
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stripe Checkout opens in a new tab via useStripeCheckout hook */}
    </>
  );
}

// ── Classic Pro billing (non-agency) ──────────────────────────────────────────

function ClassicProBilling() {
  return (
    <div className="space-y-6 max-w-2xl">
      <CustomerPortalCard />
      <UpgradeSection />
      <CreditsTopUpSection />
      <BillingHistorySection />
    </div>
  );
}

// ── Main exported tab — role-aware router ──────────────────────────────────────

export function BillingTab() {
  const { user, isLoading } = useAuth();
  const { data: subStatus } = useStripeWebhookStatus();
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [billingStatusLoading, setBillingStatusLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setBillingStatusLoading(true);
    fetchBillingStatus()
      .then((data) => { if (!cancelled) setBillingStatus(data); })
      .catch(() => { /* non-fatal — badge won't render */ })
      .finally(() => { if (!cancelled) setBillingStatusLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-52 w-full rounded-2xl" />
      </div>
    );
  }

  // Agency accounts → dedicated agency billing dashboard (white-label compliant)
  if (isAgencyRole(user?.role)) {
    return <AgencyBillingDashboard />;
  }

  const showStatusBanner = subStatus && subStatus.status !== 'active';

  // Pro / standard accounts → direct Stripe invoices + classic billing
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Current plan badge — live from backend */}
      <div className="flex items-center gap-2">
        {billingStatusLoading ? (
          <Skeleton className="h-6 w-24 rounded-full" />
        ) : billingStatus ? (
          <CurrentPlanBadge
            planId={billingStatus.planId}
            status={billingStatus.status}
          />
        ) : null}
      </div>
      {/* Live subscription status banner (past_due, canceling, trial, none) */}
      {showStatusBanner && (
        <div className="rounded-xl overflow-hidden border border-border">
          <SubscriptionStatusBanner />
        </div>
      )}
      {/* Portal button — always visible for quick access */}
      {subStatus?.isActive && (
        <BillingPortalButton variant="full" />
      )}
      {/* Pro-specific: inline invoice list + portal */}
      <ProBillingDashboard />
      {/* Classic: plan picker, credits top-up, payment method */}
      <UpgradeSection />
      <CreditsTopUpSection />
    </div>
  );
}
