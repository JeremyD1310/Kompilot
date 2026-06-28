/**
 * PricingAgencyPage — Page publique /pricing-agency
 * Affiche les offres Agency (149€) et Enterprise (Sur devis) côte à côte.
 */

import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Button } from '@blinkdotnew/ui';
import { ArrowLeft, Star, Mail, Check, Shield, Lock, RefreshCw, Zap } from 'lucide-react';
import { KompilotLogo } from '../components/brand/KompilotLogo';
import { SubscriptionCheckoutPanel } from '../components/subscription/SubscriptionCheckoutPanel';
import { PLANS } from '../components/pricing/PricingPageParts';
import type { KompilotPlanId } from '../components/landing/pricing/PricingData';
import { PricingFAQ } from '../components/pricing/PricingPageParts';

const INDIGO = '#818CF8';
const TEAL = '#0D9488';

export default function PricingAgencyPage() {
  const [checkoutPlanId, setCheckoutPlanId] = useState<KompilotPlanId | null>(null);

  const agencyPlan = PLANS.find(p => p.id === 'agency')!;
  const enterprisePlan = PLANS.find(p => p.id === 'enterprise')!;

  const handleCta = (planId: KompilotPlanId, ctaHref?: string) => {
    if (planId === 'enterprise') {
      window.location.href = ctaHref ?? 'mailto:sales@kompilot.fr';
      return;
    }
    setCheckoutPlanId(prev => prev === planId ? null : planId);
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
            <Link to="/pricing-pro">
              <Button size="sm" variant="outline" className="text-xs border-border text-foreground hover:bg-white/10">
                Plan Pro
              </Button>
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
          style={{ background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.3)', color: INDIGO }}>
          <Star size={12} /> Tarification Agences & Grands Comptes
        </div>

        <h1 className="font-black mb-4 leading-tight"
          style={{ fontSize: 'clamp(2rem,5vw,3.2rem)', letterSpacing: '-0.035em' }}>
          Multipliez vos clients,<br />pas vos outils.
        </h1>

        <p className="text-base max-w-lg mx-auto leading-relaxed" style={{ color: '#64748B' }}>
          Marque blanche · Multi-comptes · Support prioritaire 24/7 · Essai 14 jours inclus
        </p>
      </motion.div>

      {/* ── Grille 2 colonnes (Agency + Enterprise) ──────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid gap-5 items-start grid-cols-1 md:grid-cols-2">

          {/* ── Agency Card ───────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col relative"
            style={{
              borderRadius: 20,
              overflow: 'hidden',
              border: `1.5px solid ${INDIGO}55`,
              background: 'linear-gradient(160deg, #13193a 0%, #181e35 60%, #0f162e 100%)',
              boxShadow: `0 0 0 1px ${INDIGO}20, 0 24px 80px ${INDIGO}12, 0 4px 24px rgba(0,0,0,0.5)`,
              transform: 'scale(1.025)',
            }}
          >
            {/* Badge */}
            <div className="text-center text-white text-[11px] font-bold uppercase tracking-widest py-2.5"
              style={{ background: `linear-gradient(90deg, ${INDIGO}, #a78bfa)` }}>
              ⭐ Formule Phare — La plus choisie
            </div>

            <div className="flex flex-col flex-1 p-7 gap-0">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${INDIGO}22`, border: `1px solid ${INDIGO}44` }}>
                  <Star size={14} color={INDIGO} />
                </div>
                <h3 className="text-lg font-extrabold" style={{ color: '#F1F5F9' }}>{agencyPlan.name}</h3>
              </div>

              <p className="text-sm mb-5 leading-relaxed" style={{ color: '#64748B' }}>{agencyPlan.tagline}</p>

              <div className="mb-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-end gap-1">
                  <span className="font-black leading-none" style={{
                    fontSize: 52, color: INDIGO, letterSpacing: '-0.04em',
                  }}>
                    {agencyPlan.priceLabel}€
                  </span>
                  <span className="text-sm pb-2" style={{ color: '#64748B' }}>HT / mois</span>
                </div>
              </div>

              <Button
                className="w-full mb-6 font-bold text-sm py-3 rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${INDIGO}, #a78bfa)`,
                  border: 'none',
                  color: '#fff',
                  boxShadow: `0 4px 20px ${INDIGO}40`,
                  height: 46,
                }}
                onClick={() => handleCta('agency')}
              >
                {agencyPlan.ctaLabel}
              </Button>

              {checkoutPlanId === 'agency' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-5 overflow-hidden"
                >
                  <SubscriptionCheckoutPanel
                    planId="agency"
                    planName={agencyPlan.name}
                    onCancel={() => setCheckoutPlanId(null)}
                  />
                </motion.div>
              )}

              <ul className="flex flex-col gap-3 mt-auto">
                {agencyPlan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: `${INDIGO}22` }}>
                      <Check size={10} color={INDIGO} strokeWidth={3} />
                    </span>
                    <span className="text-[13px] leading-relaxed" style={{ color: '#CBD5E1' }}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* ── Enterprise Card ────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col relative"
            style={{
              borderRadius: 20,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(17,24,39,0.8)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            }}
          >
            <div className="flex flex-col flex-1 p-7 gap-0">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(71,85,105,0.2)', border: '1px solid #47556944' }}>
                  <Mail size={14} color="#94a3b8" />
                </div>
                <h3 className="text-lg font-extrabold" style={{ color: '#F1F5F9' }}>{enterprisePlan.name}</h3>
              </div>

              <p className="text-sm mb-5 leading-relaxed" style={{ color: '#64748B' }}>{enterprisePlan.tagline}</p>

              <div className="mb-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="font-black" style={{ fontSize: 34, color: '#94a3b8' }}>Sur devis</span>
              </div>

              <a
                href={enterprisePlan.ctaHref}
                className="block text-center font-bold text-sm py-3 rounded-xl mb-6 transition-all hover:opacity-90"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#F1F5F9',
                  textDecoration: 'none',
                }}
              >
                {enterprisePlan.ctaLabel}
              </a>

              <ul className="flex flex-col gap-3 mt-auto">
                {enterprisePlan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(71,85,105,0.2)' }}>
                      <Check size={10} color="#94a3b8" strokeWidth={3} />
                    </span>
                    <span className="text-[13px] leading-relaxed" style={{ color: '#CBD5E1' }}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>

        {/* Trust strip */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-10">
          {[
            { icon: <Shield size={15} />, label: 'Paiement sécurisé Stripe' },
            { icon: <Lock size={15} />, label: 'Données chiffrées & hébergées en Europe' },
            { icon: <RefreshCw size={15} />, label: 'Résiliation sans engagement' },
          ].map((it, i) => (
            <div key={i} className="flex items-center gap-2 text-xs" style={{ color: '#475569' }}>
              {it.icon} {it.label}
            </div>
          ))}
        </div>

        <PricingFAQ />

        <p className="text-center mt-12 text-xs" style={{ color: '#334155' }}>
          Tous les prix sont indiqués hors taxes (HT). TVA applicable selon votre pays.
          <br />
          Paiement sécurisé par Stripe · Données chiffrées · Hébergé en Europe · RGPD conforme.
        </p>
      </div>
    </div>
  );
}
