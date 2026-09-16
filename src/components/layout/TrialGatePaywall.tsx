/**
 * TrialGatePaywall — Shown when the 14-day trial expires without an active subscription.
 *
 * Beautiful, minimal paywall screen with Starter (69€) and Agency (149€) plans.
 * Pushes trial_status="expired" to Crisp so support can follow up.
 */

import { useEffect } from 'react';
import { Crown, Zap, CheckCircle2, ArrowRight, Shield } from 'lucide-react';

const STRIPE_CHECKOUT_STARTER = 'https://buy.stripe.com/placeholder_starter'; // Replace with real Stripe link
const STRIPE_CHECKOUT_AGENCY = 'https://buy.stripe.com/placeholder_agency';   // Replace with real Stripe link

const features = {
  starter: [
    'Gestion de 5 réseaux sociaux',
    '50 publications IA / mois',
    'Inbox unifiée',
    'Calendrier éditorial',
    'Réponses automatiques aux avis',
    'Support prioritaire',
  ],
  agency: [
    'Réseaux illimités',
    'Publications IA illimitées',
    'Inbox + Multi-utilisateurs',
    'Gestion multi-établissements (30)',
    'Rapports PDF blancs',
    'API & Webhooks',
    'Support dédié 24/7',
    'Badge Agency certifié',
  ],
};

function FeatureItem({ label }: { label: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <CheckCircle2 size={15} className="text-teal-400 mt-0.5 shrink-0" />
      <span className="text-sm text-slate-300">{label}</span>
    </li>
  );
}

export function TrialGatePaywall() {
  // Push trial_status="expired" to Crisp when paywall shows
  useEffect(() => {
    try {
      // @ts-expect-error Crisp global
      const crisp = window.$crisp as any[] | undefined;
      if (crisp) {
        crisp.push(['set', 'session:data', [['trial_status', 'expired']]]);
        crisp.push(['set', 'session:segments', [['kompilot-app', 'trial:expired']]]);
      }
    } catch { /* noop */ }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1120] overflow-y-auto">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(13,148,136,0.4) 1px, transparent 0)`,
        backgroundSize: '32px 32px',
      }} />

      <div className="relative z-10 w-full max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
            <Shield size={14} className="text-amber-400" />
            <span className="text-xs font-semibold text-amber-300">Période d'essai expirée</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
            Votre essai gratuit est terminé
          </h1>
          <p className="text-base text-slate-400 max-w-md mx-auto leading-relaxed">
            Continuez à booster votre visibilité locale avec Kompilot.
            Choisissez le plan adapté à vos besoins.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {/* Starter */}
          <div className="relative rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-sm p-7 flex flex-col">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Crown size={20} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Plan Starter</h3>
                <p className="text-xs text-slate-500">Pour les commerces indépendants</p>
              </div>
            </div>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-extrabold text-white">69€</span>
              <span className="text-sm text-slate-500">/mois</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {features.starter.map(f => <FeatureItem key={f} label={f} />)}
            </ul>
            <a
              href={STRIPE_CHECKOUT_STARTER}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm transition-colors"
            >
              Choisir Starter <ArrowRight size={16} />
            </a>
          </div>

          {/* Agency */}
          <div className="relative rounded-2xl border border-teal-500/30 bg-slate-900/60 backdrop-blur-sm p-7 flex flex-col ring-1 ring-teal-500/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-3 py-1 rounded-full bg-teal-500 text-[10px] font-bold text-white uppercase tracking-wider">
                Recommandé
              </span>
            </div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Zap size={20} className="text-violet-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Plan Agency</h3>
                <p className="text-xs text-slate-500">Pour les agences et multi-établissements</p>
              </div>
            </div>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-extrabold text-white">149€</span>
              <span className="text-sm text-slate-500">/mois</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {features.agency.map(f => <FeatureItem key={f} label={f} />)}
            </ul>
            <a
              href={STRIPE_CHECKOUT_AGENCY}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-colors"
            >
              Choisir Agency <ArrowRight size={16} />
            </a>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-600">
          Sans engagement · Annulation à tout moment · Paiement sécurisé par Stripe
        </p>
      </div>
    </div>
  );
}
