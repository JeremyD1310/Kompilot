/**
 * PricingProPage — Page publique /pricing-pro
 * Affiche UNIQUEMENT la carte Pro (69€ HT/mois), centrée élégamment.
 */

import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Button } from '@blinkdotnew/ui';
import { ArrowLeft, Zap, Check, Shield, Lock, RefreshCw } from 'lucide-react';
import { KompilotLogo } from '../components/brand/KompilotLogo';
import { SubscriptionCheckoutPanel } from '../components/subscription/SubscriptionCheckoutPanel';
import { PLANS } from '../components/pricing/PricingPageParts';
import type { KompilotPlanId } from '../components/landing/pricing/PricingData';
import { PricingFAQ } from '../components/pricing/PricingPageParts';

const TEAL = '#0D9488';

export default function PricingProPage() {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const plan = PLANS.find(p => p.id === 'starter')!;

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
            <Link to="/pricing-agency">
              <Button size="sm" variant="outline" className="text-xs border-border text-foreground hover:bg-white/10">
                Plans Agence
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
          style={{ background: 'rgba(13,148,136,0.12)', border: '1px solid rgba(13,148,136,0.3)', color: '#0D9488' }}>
          <Zap size={12} /> Tarification Professionnels
        </div>

        <h1 className="font-black mb-4 leading-tight"
          style={{ fontSize: 'clamp(2rem,5vw,3.2rem)', letterSpacing: '-0.035em' }}>
          L'IA qui gère votre présence,<br />pendant que vous gérez votre business.
        </h1>

        <p className="text-base max-w-lg mx-auto leading-relaxed" style={{ color: '#64748B' }}>
          Essai 14 jours inclus · Résiliation sans frais · Paiement sécurisé Stripe
        </p>
      </motion.div>

      {/* ── Carte Pro centrée ──────────────────────────────────────── */}
      <div className="max-w-md mx-auto px-4 sm:px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col relative"
          style={{
            borderRadius: 20,
            overflow: 'hidden',
            border: `1.5px solid ${TEAL}44`,
            background: 'rgba(17,24,39,0.8)',
            boxShadow: `0 0 0 1px ${TEAL}22, 0 24px 80px ${TEAL}12, 0 4px 24px rgba(0,0,0,0.5)`,
          }}
        >
          <div className="flex flex-col flex-1 p-7 gap-0">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${TEAL}22`, border: `1px solid ${TEAL}44` }}>
                <Zap size={14} color={TEAL} />
              </div>
              <h3 className="text-lg font-extrabold" style={{ color: '#F1F5F9' }}>{plan.name}</h3>
            </div>

            <p className="text-sm mb-5 leading-relaxed" style={{ color: '#64748B' }}>{plan.tagline}</p>

            {/* Prix */}
            <div className="mb-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-end gap-1">
                <span className="font-black leading-none" style={{
                  fontSize: 52, color: '#F1F5F9', letterSpacing: '-0.04em',
                }}>
                  {plan.priceLabel}€
                </span>
                <span className="text-sm pb-2" style={{ color: '#64748B' }}>HT / mois</span>
              </div>
            </div>

            {/* Bouton CTA */}
            <Button
              className="w-full mb-6 font-bold text-sm py-3 rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${TEAL}, #0f9d91)`,
                border: 'none',
                color: '#fff',
                boxShadow: '0 4px 16px rgba(13,148,136,0.3)',
                height: 46,
              }}
              onClick={() => setCheckoutOpen(prev => !prev)}
            >
              {plan.ctaLabel}
            </Button>

            {/* Checkout panel */}
            {checkoutOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-5 overflow-hidden"
              >
                <SubscriptionCheckoutPanel
                  planId="starter"
                  planName={plan.name}
                  onCancel={() => setCheckoutOpen(false)}
                />
              </motion.div>
            )}

            {/* Features */}
            <ul className="flex flex-col gap-3 mt-auto">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: `${TEAL}1a` }}>
                    <Check size={10} color={TEAL} strokeWidth={3} />
                  </span>
                  <span className="text-[13px] leading-relaxed" style={{ color: '#CBD5E1' }}>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

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
