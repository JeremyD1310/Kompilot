/**
 * StripeTestCheckout — Panneau de test du tunnel d'achat Stripe (Mode Test)
 *
 * Permet de valider de bout en bout :
 *   1. La création d'une Checkout Session via /api/billing/checkout
 *   2. L'ouverture de Stripe Checkout dans un nouvel onglet
 *   3. Le webhook de retour (checkout.session.completed)
 *   4. La mise à jour du statut d'abonnement dans Kompilot
 *
 * Cartes de test Stripe (mode test) :
 *   ✅ Paiement réussi     : 4242 4242 4242 4242
 *   ❌ Refus carte         : 4000 0000 0000 0002
 *   🔐 3D Secure requis    : 4000 0025 0000 3155
 *   💸 Fonds insuffisants  : 4000 0000 0000 9995
 *
 * Usage :
 *   Intégrer dans BillingTab ou SettingsPage pour valider l'intégration Stripe.
 *   Ce composant est visible uniquement en mode test (STRIPE_PUBLIC_KEY commence par pk_test_).
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Skeleton, toast } from '@blinkdotnew/ui';
import {
  CreditCard, ExternalLink, CheckCircle2, AlertCircle,
  RefreshCw, Zap, ShieldCheck, Info,
} from 'lucide-react';
import { createCheckoutSession, fetchBillingStatus, type BillingStatus } from '../../lib/billingClient';
import { CGV_VERSION } from '../subscription/LegalConsentBlock';

// ── Plan de test ──────────────────────────────────────────────────────────────

interface TestPlan {
  id: 'starter' | 'agency';
  name: string;
  price: string;
  description: string;
  color: string;
  features: string[];
}

const TEST_PLANS: TestPlan[] = [
  {
    id: 'starter',
    name: 'Pro — 69€/mois',
    price: '69€ HT/mois',
    description: 'Forfait B2B pour consultants solos, freelances et commerçants',
    color: 'border-teal-200 dark:border-teal-800',
    features: ['Campaign Calendar standard', 'Claude Cowork 20 générations/mois', 'AIO Sync 5 mots-clés', 'Meta Ads 1 compte connecté'],
  },
  {
    id: 'agency',
    name: 'Agency — 149€/mois',
    price: '149€ HT/mois',
    description: 'Solution complète pour agences et équipes — jusqu\'à 30 fiches clients',
    color: 'border-indigo-200 dark:border-indigo-800',
    features: ['Claude Cowork ILLIMITÉ', 'Marque Blanche Totale', 'Campaign Calendar Avancé + Meta Drafts', 'Moteur Prospection IA (100 audits PDF)'],
  },
];

// ── Cartes de test Stripe ─────────────────────────────────────────────────────

const TEST_CARDS = [
  { number: '4242 4242 4242 4242', result: 'Succès', icon: '✅', color: 'text-emerald-600' },
  { number: '4000 0000 0000 0002', result: 'Carte refusée', icon: '❌', color: 'text-red-500' },
  { number: '4000 0025 0000 3155', result: '3D Secure', icon: '🔐', color: 'text-blue-500' },
  { number: '4000 0000 0000 9995', result: 'Fonds insuff.', icon: '💸', color: 'text-orange-500' },
];

// ── Composant principal ───────────────────────────────────────────────────────

export function StripeTestCheckout() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [status, setStatus]           = useState<BillingStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [lastCheckoutUrl, setLastCheckoutUrl] = useState<string | null>(null);

  // ── Lancer le tunnel de checkout de test ─────────────────────────────────

  async function handleCheckout(planId: 'starter' | 'agency') {
    if (loadingPlan) return;
    setLoadingPlan(planId);
    setLastCheckoutUrl(null);

    try {
      // Consentement légal simulé pour le test (en production, l'utilisateur coche les cases)
      const legalConsent = {
        cgvAccepted:      true,
        retractionWaived: true,
        cgvVersion:       CGV_VERSION,
        acceptedAt:       new Date().toISOString(),
        userAgent:        navigator.userAgent,
        renouncedTrial:   false,
      };

      const result = await createCheckoutSession(planId, legalConsent);

      if (result.url && !result.fallback) {
        // ✅ URL Checkout reçue → ouvrir dans un nouvel onglet
        // IMPORTANT : window.open() doit être appelé depuis un event handler direct
        // (ici via onClick) pour ne pas être bloqué par les popup blockers.
        setLastCheckoutUrl(result.url);
        window.open(result.url, '_blank', 'noopener,noreferrer');
        toast.success('Stripe Checkout ouvert', {
          description: `Mode test — utilisez la carte 4242 4242 4242 4242 pour simuler un paiement.`,
        });
      } else if (result.fallback) {
        // ⚠️ Prix Stripe non configurés → les env vars STRIPE_PRICE_PRO/EXPERT sont manquantes
        toast.error('Prix Stripe non configurés', {
          description: `Ajoutez STRIPE_PRICE_${planId.toUpperCase()} dans les secrets Cloudflare Workers.`,
        });
      } else if (result.code === 'MISSING_LEGAL_CONSENT') {
        toast.error('Consentement légal requis', {
          description: 'En production, l\'utilisateur doit cocher les cases CGV.',
        });
      } else {
        toast.error('Erreur Stripe', {
          description: result.error ?? 'Vérifiez STRIPE_SECRET_KEY dans les secrets backend.',
        });
      }
    } catch (err) {
      toast.error('Erreur réseau', {
        description: err instanceof Error ? err.message : 'Impossible de contacter le backend.',
      });
    } finally {
      setLoadingPlan(null);
    }
  }

  // ── Vérifier le statut d'abonnement ─────────────────────────────────────

  async function handleCheckStatus() {
    setLoadingStatus(true);
    try {
      const billing = await fetchBillingStatus();
      setStatus(billing);
      toast.success('Statut récupéré', {
        description: `Abonnement : ${billing.status} — Plan : ${billing.planId ?? 'aucun'}`,
      });
    } catch {
      toast.error('Erreur lors de la récupération du statut');
    } finally {
      setLoadingStatus(false);
    }
  }

  // ── Statut badge couleur ──────────────────────────────────────────────────

  function StatusBadge({ s }: { s: BillingStatus }) {
    const map: Record<string, { label: string; cls: string }> = {
      active:         { label: 'Actif',             cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      payment_failed: { label: 'Paiement échoué',   cls: 'bg-red-100 text-red-700 border-red-200' },
      grace:          { label: 'Période de grâce',  cls: 'bg-orange-100 text-orange-700 border-orange-200' },
      cancelled:      { label: 'Résilié',            cls: 'bg-muted text-muted-foreground border-border' },
      unpaid:         { label: 'Impayé',             cls: 'bg-red-100 text-red-700 border-red-200' },
    };
    const cfg = map[s.status] ?? map['active'];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.cls}`}>
        {cfg.label}
      </span>
    );
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center shrink-0 shadow">
          <CreditCard className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold">Tunnel d'achat Stripe — Mode Test</h3>
          <p className="text-xs text-muted-foreground">Validez le circuit bout en bout sans paiement réel</p>
        </div>
        <Badge className="ml-auto bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400">
          TEST MODE
        </Badge>
      </div>

      {/* ── Avertissement mode test ───────────────────────────────────── */}
      <div className="flex items-start gap-2.5 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-900 p-3 text-sm">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-blue-800 dark:text-blue-300">
          <p className="font-semibold">Mode test activé (pk_test_...)</p>
          <p className="text-xs mt-0.5 opacity-80">
            Aucun débit réel. Utilisez les cartes de test ci-dessous. Les webhooks fonctionnent normalement.
          </p>
        </div>
      </div>

      {/* ── Plans B2B ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TEST_PLANS.map(plan => (
          <Card key={plan.id} className={`${plan.color} border-2`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold">{plan.name}</CardTitle>
                <span className="text-sm font-bold text-foreground">{plan.price}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{plan.description}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleCheckout(plan.id)}
                disabled={loadingPlan !== null}
                size="sm"
                className={`w-full gap-2 ${
                  plan.id === 'expert'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-violet-600 hover:bg-violet-700 text-white'
                }`}
              >
                {loadingPlan === plan.id
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Ouverture…</>
                  : <><Zap className="w-4 h-4" /> Tester le paiement {plan.name}</>
                }
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Cartes de test ───────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-muted-foreground" />
            Cartes de test Stripe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {TEST_CARDS.map(card => (
              <div key={card.number} className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
                <span className="text-base">{card.icon}</span>
                <div className="min-w-0">
                  <p className="text-[11px] font-mono font-bold tracking-tight truncate">{card.number}</p>
                  <p className={`text-[10px] font-medium ${card.color}`}>{card.result}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Expiration : toute date future. CVC : n'importe quels 3 chiffres.
          </p>
        </CardContent>
      </Card>

      {/* ── Vérification statut ─────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-semibold">Statut d'abonnement</p>
              <p className="text-xs text-muted-foreground">Vérifie en temps réel via /api/billing/status</p>
            </div>
            <Button onClick={handleCheckStatus} disabled={loadingStatus} size="sm" variant="outline" className="gap-2">
              {loadingStatus ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Vérifier
            </Button>
          </div>

          {loadingStatus && <Skeleton className="h-16 w-full rounded-lg" />}

          {status && (
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <StatusBadge s={status} />
                <span className="text-[11px] text-muted-foreground">Plan : <strong>{status.planId ?? 'aucun'}</strong></span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <p className="text-muted-foreground">Customer Stripe</p>
                  <p className="font-medium">{status.hasStripeCustomer ? '✅ Créé' : '⬜ Aucun'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Subscription ID</p>
                  <p className="font-mono truncate">{status.stripeSubscriptionId ?? '—'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Lien vers la dernière session créée */}
          {lastCheckoutUrl && (
            <div className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50/50 dark:bg-violet-950/20 dark:border-violet-900 px-3 py-2">
              <CheckCircle2 className="w-4 h-4 text-violet-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-violet-700 dark:text-violet-400">Session Checkout créée</p>
                <p className="text-[10px] text-muted-foreground truncate">{lastCheckoutUrl}</p>
              </div>
              <button
                onClick={() => window.open(lastCheckoutUrl, '_blank', 'noopener,noreferrer')}
                className="text-violet-600 hover:text-violet-700 shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Guide webhooks ───────────────────────────────────────────── */}
      <Card className="border-dashed">
        <CardContent className="py-4">
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Configurer les webhooks Stripe</p>
              <p className="text-xs text-muted-foreground mt-1">
                Pour recevoir les événements de paiement, créez un webhook dans votre{' '}
                <a href="https://dashboard.stripe.com/test/webhooks" target="_blank" rel="noopener noreferrer"
                  className="text-violet-600 underline">Dashboard Stripe</a>{' '}
                vers l'URL :
              </p>
              <code className="mt-1.5 block text-[11px] bg-muted rounded px-2 py-1 font-mono break-all">
                https://gbrhsehk.backend.blink.new/api/webhooks/stripe
              </code>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Événements à activer :{' '}
                <span className="font-mono">checkout.session.completed</span>,{' '}
                <span className="font-mono">invoice.paid</span>,{' '}
                <span className="font-mono">customer.subscription.deleted</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
