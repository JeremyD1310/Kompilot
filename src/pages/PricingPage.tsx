/**
 * PricingPage — Page publique /pricing de Kompilot
 *
 * Grille 3 plans uniquement : Pro (69€) · Agency (149€, phare) · Enterprise (devis)
 * Les anciens plans free/pro 39€/expert 59€/franchise sont supprimés.
 */

import { useState, useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Button } from '@blinkdotnew/ui';
import { ArrowLeft, Zap } from 'lucide-react';
import { KompilotLogo } from '../components/brand/KompilotLogo';
import { usePageSeo } from '../hooks/usePageSeo';
import { createKompilotGraph } from '../lib/seoData';
import {
  getPlansForBilling,
  PlanCard,
  PricingFAQ,
  TrustStrip,
  BillingToggle,
  type Plan,
  type BillingInterval,
} from '../components/pricing/PricingPageParts';
import type { KompilotPlanId } from '../components/landing/pricing/PricingData';

export default function PricingPage() {
  usePageSeo(
    'Tarifs Kompilot — Starter, Agency et Enterprise',
    'Comparez les tarifs et fonctionnalités de Kompilot pour les professionnels, équipes et agences : Starter, Agency et Enterprise.',
    '/pricing',
    { structuredData: createKompilotGraph('/pricing', 'Tarifs Kompilot') },
  );

  const [checkoutPlanId, setCheckoutPlanId] = useState<KompilotPlanId | null>(null);
  const [billing, setBilling] = useState<BillingInterval>('monthly');
  const plans = useMemo(() => getPlansForBilling(billing), [billing]);

  const handleCta = (plan: Plan) => {
    if (plan.id === 'enterprise') {
      window.location.href = plan.ctaHref ?? 'mailto:sales@kompilot.fr';
      return;
    }
    // Toggle checkout inline panel
    setCheckoutPlanId(prev => prev === plan.id ? null : plan.id as KompilotPlanId);
  };

  return (
    <div className="min-h-screen" style={{ background: '#0F172A', color: '#F1F5F9' }}>

      {/* ── Nav ───────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-30 border-b"
        style={{
          borderColor: 'rgba(255,255,255,0.06)',
          backgroundColor: 'rgba(11,17,32,0.92)',
          backdropFilter: 'blur(18px)',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/">
            <KompilotLogo variant="full" height={40} textColor="#F1F5F9" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={14} /> Accueil
            </Link>
            <Link to="/dashboard">
              <Button size="sm" variant="outline" className="text-xs border-border text-foreground hover:bg-white/10">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center pt-20 pb-4 px-6"
      >
        <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
          style={{ background: 'rgba(13,148,136,0.12)', border: '1px solid rgba(13,148,136,0.3)', color: '#0D9488' }}>
          <Zap size={12} /> Tarification B2B transparente
        </div>

        <h1 className="font-black mb-4 leading-tight"
          style={{ fontSize: 'clamp(2rem,5vw,3.2rem)', letterSpacing: '-0.035em' }}>
          L'infrastructure IA qui fait croître<br />vos clients et vos revenus.
        </h1>

        <p className="text-base max-w-lg mx-auto leading-relaxed" style={{ color: '#64748B' }}>
          3 formules B2B · Essai 7 jours inclus · Résiliation sans frais à tout moment
        </p>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-6" style={{ color: '#94A3B8' }}>
          <strong style={{ color: '#CBD5E1' }}>Kompilot</strong> est une plateforme SaaS B2B de marketing local pour contenus, avis clients et visibilité en ligne. Les tarifs et le périmètre affichés sont ceux publiés dans cette page ; aucun résultat commercial n’est garanti.
        </p>
      </motion.div>

      {/* ── Toggle Mensuel / Annuel ──────────────────────────────── */}
      <BillingToggle billing={billing} onChange={setBilling} />

      {/* ── Grille des plans ──────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div
          className="grid gap-5 items-start"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          }}
        >
          {plans.map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              index={i}
              checkoutPlanId={checkoutPlanId}
              onCta={handleCta}
              onCancelCheckout={() => setCheckoutPlanId(null)}
            />
          ))}
        </div>

        <TrustStrip />
        <PricingFAQ />

        {/* Note légale */}
        <p className="text-center mt-12 text-xs" style={{ color: '#334155' }}>
          Tous les prix sont indiqués hors taxes (HT). TVA applicable selon votre pays.
          <br />
          Paiement sécurisé par Stripe · Données chiffrées · Hébergé en Europe · RGPD conforme.
        </p>
      </div>
    </div>
  );
}
