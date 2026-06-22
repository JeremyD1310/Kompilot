/**
 * PricingPageParts — Composants de la page /pricing
 *
 * Grille 3 plans uniquement (anciens plans free/pro 39€/expert 59€/franchise supprimés) :
 *   Pro (69€) · Agency (149€, phare) · Enterprise (devis)
 *
 * Les boutons Starter → planId='starter', Agency → planId='agency'
 * qui correspondent à PRICE_STARTER_ID et PRICE_AGENCY_ID côté Stripe backend.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@blinkdotnew/ui';
import { Check, ChevronDown, Shield, RefreshCw, Lock, Mail, Star, Zap } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { SubscriptionCheckoutPanel } from '../subscription/SubscriptionCheckoutPanel';
import { KOMPILOT_PLANS, type KompilotPlan, type KompilotPlanId } from '../landing/pricing/PricingData';

// ── Types ─────────────────────────────────────────────────────────────────────

// Ré-export pour compatibilité avec PricingPage.tsx
export type { KompilotPlan as Plan, KompilotPlanId as PlanId };
export { KOMPILOT_PLANS as PLANS };

// ── Couleurs ──────────────────────────────────────────────────────────────────

const TEAL   = '#0D9488';
const INDIGO = '#818CF8';

// ── PlanCard ──────────────────────────────────────────────────────────────────

interface PlanCardProps {
  plan: KompilotPlan;
  index: number;
  checkoutPlanId: KompilotPlanId | null;
  onCta: (plan: KompilotPlan) => void;
  onCancelCheckout: () => void;
}

export function PlanCard({ plan, index, checkoutPlanId, onCta, onCancelCheckout }: PlanCardProps) {
  const isAgency     = plan.popular;
  const isEnterprise = plan.id === 'enterprise';
  const isCheckedOut = checkoutPlanId === plan.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.09, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col relative"
      style={{
        borderRadius: 20,
        overflow: 'hidden',
        border: isAgency
          ? `1.5px solid ${INDIGO}55`
          : '1px solid rgba(255,255,255,0.08)',
        background: isAgency
          ? 'linear-gradient(160deg, #13193a 0%, #181e35 60%, #0f162e 100%)'
          : 'rgba(17,24,39,0.8)',
        boxShadow: isAgency
          ? '0 0 0 1px rgba(129,140,248,0.2), 0 24px 80px rgba(129,140,248,0.12), 0 4px 24px rgba(0,0,0,0.5)'
          : '0 4px 24px rgba(0,0,0,0.3)',
        transform: isAgency ? 'scale(1.025)' : undefined,
      }}
    >
      {/* Badge Agency */}
      {isAgency && (
        <div className="text-center text-white text-[11px] font-bold uppercase tracking-widest py-2.5"
          style={{ background: `linear-gradient(90deg, ${INDIGO}, #a78bfa)` }}>
          ⭐ Formule Phare — La plus choisie
        </div>
      )}

      <div className="flex flex-col flex-1 p-7 gap-0">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: isAgency ? `${INDIGO}22` : isEnterprise ? 'rgba(71,85,105,0.2)' : `${TEAL}22`,
              border: `1px solid ${isAgency ? INDIGO + '44' : isEnterprise ? '#47556944' : TEAL + '44'}`,
            }}>
            {isEnterprise ? <Mail size={14} color="#94a3b8" />
              : isAgency ? <Star size={14} color={INDIGO} />
              : <Zap size={14} color={TEAL} />}
          </div>
          <h3 className="text-lg font-extrabold" style={{ color: '#F1F5F9' }}>{plan.name}</h3>
        </div>

        <p className="text-sm mb-5 leading-relaxed" style={{ color: '#64748B' }}>{plan.tagline}</p>

        {/* Prix */}
        <div className="mb-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {plan.price !== null ? (
            <div className="flex items-end gap-1">
              <span className="font-black leading-none" style={{
                fontSize: 52, color: isAgency ? INDIGO : '#F1F5F9', letterSpacing: '-0.04em',
              }}>
                {plan.priceLabel}€
              </span>
              <span className="text-sm pb-2" style={{ color: '#64748B' }}>HT / mois</span>
            </div>
          ) : (
            <span className="font-black" style={{ fontSize: 34, color: '#94a3b8' }}>Sur devis</span>
          )}
        </div>

        {/* Bouton CTA */}
        {isEnterprise ? (
          <a
            href={plan.ctaHref}
            className="block text-center font-bold text-sm py-3 rounded-xl mb-6 transition-all hover:opacity-90"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#F1F5F9',
              textDecoration: 'none',
            }}
          >
            {plan.ctaLabel}
          </a>
        ) : (
          <Button
            className="w-full mb-6 font-bold text-sm py-3 rounded-xl"
            style={{
              background: isAgency
                ? `linear-gradient(135deg, ${INDIGO}, #a78bfa)`
                : `linear-gradient(135deg, ${TEAL}, #0f9d91)`,
              border: 'none',
              color: '#fff',
              boxShadow: isAgency ? '0 4px 20px rgba(129,140,248,0.4)' : '0 4px 16px rgba(13,148,136,0.3)',
              height: 46,
            }}
            onClick={() => onCta(plan)}
          >
            {plan.ctaLabel}
          </Button>
        )}

        {/* Checkout panel (inline, si sélectionné) */}
        <AnimatePresence>
          {isCheckedOut && !isEnterprise && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 overflow-hidden"
            >
              <SubscriptionCheckoutPanel
                planId={plan.id as 'starter' | 'agency'}
                planName={plan.name}
                onCancel={onCancelCheckout}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Features */}
        <ul className="flex flex-col gap-3 mt-auto">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: isAgency ? `${INDIGO}22` : `${TEAL}1a` }}>
                <Check size={10} color={isAgency ? INDIGO : TEAL} strokeWidth={3} />
              </span>
              <span className="text-[13px] leading-relaxed" style={{ color: '#CBD5E1' }}>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

// ── CreditPacksSection (gardée pour compatibilité) ────────────────────────────

export function CreditPacksSection() { return null; }

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  { q: 'Puis-je changer de plan à tout moment ?', a: "Oui, montez en Agency ou descendez en Pro à tout moment depuis vos paramètres. La facturation est ajustée au prorata." },
  { q: 'Les prix sont-ils HT ou TTC ?', a: "Tous les prix affichés sont Hors Taxes (HT). La TVA applicable sera affichée lors du paiement Stripe selon votre pays." },
  { q: "Qu'est-ce que la Marque Blanche Totale (Agency) ?", a: "Votre logo + domaine personnalisé sur toute l'interface client. Vos clients voient votre marque, pas Kompilot." },
  { q: 'Puis-je résilier à tout moment ?', a: "Absolument, sans engagement ni frais de résiliation. Un clic depuis vos paramètres suffit." },
  { q: 'Que sont les crédits IA ?', a: "Unités pour les générations IA avancées (visuels, analyses…). Illimités sur Agency sous réserve d'usage équitable." },
  { q: 'Comment fonctionne le plan Enterprise ?', a: "Contactez notre équipe sales@kompilot.fr pour un devis personnalisé selon votre volume de fiches, vos besoins d'API et votre SLA." },
];

function FAQItem({ q, a, i }: { q: string; a: string; i: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.06 }}
      className="border-b"
      style={{ borderColor: 'rgba(255,255,255,0.07)' }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between py-4 text-left gap-4 hover:opacity-80 transition-opacity"
      >
        <span className="font-semibold text-sm" style={{ color: '#E2E8F0' }}>{q}</span>
        <ChevronDown
          size={16} color="#64748B"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm leading-relaxed" style={{ color: '#64748B' }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function PricingFAQ() {
  return (
    <div className="max-w-2xl mx-auto mt-16 px-4">
      <h3 className="text-xl font-bold text-center mb-8" style={{ color: '#E2E8F0' }}>Questions fréquentes</h3>
      {FAQ_ITEMS.map((item, i) => <FAQItem key={i} q={item.q} a={item.a} i={i} />)}
    </div>
  );
}

// ── TrustStrip ────────────────────────────────────────────────────────────────

export function TrustStrip() {
  const items = [
    { icon: <Shield size={15} />, label: 'Paiement sécurisé Stripe' },
    { icon: <Lock size={15} />,   label: 'Données chiffrées & hébergées en Europe' },
    { icon: <RefreshCw size={15} />, label: 'Résiliation sans engagement' },
  ];
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 mt-10">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2 text-xs" style={{ color: '#475569' }}>
          {it.icon} {it.label}
        </div>
      ))}
    </div>
  );
}
