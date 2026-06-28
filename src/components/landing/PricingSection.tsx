/**
 * PricingSection — Grille tarifaire B2B Kompilot
 *
 * 3 forfaits uniquement : Pro (69€) · Agency (149€, formule phare) · Enterprise (devis)
 * Supprime définitivement les anciens plans 49€/99€/299€/599€.
 *
 * Design :
 *   • Fond dark navy (#0F172A) — cohérent avec le reste de la landing
 *   • Carte Agency : ring lumineux indigo + badge "Formule Phare" + scale légère
 *   • Responsive 1→3 colonnes
 */

import { Check, Mail, Zap, Star } from 'lucide-react';
import { KOMPILOT_PLANS, type KompilotPlan } from './pricing/PricingData';

// ── Constantes de style ───────────────────────────────────────────────────────

const BG    = '#0F172A';
const BG1   = '#11182B';
const BG2   = '#161E32';
const BORD  = 'rgba(255,255,255,0.07)';
const BORD2 = 'rgba(255,255,255,0.12)';
const TEXT  = '#F1F5F9';
const MUTED = '#64748B';
const TEAL  = '#0D9488';
const INDIGO = '#818CF8';

// ── Carte de plan ─────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  onCta,
}: {
  plan: KompilotPlan;
  onCta: (planId: string) => void;
}) {
  const isAgency     = plan.popular;
  const isEnterprise = plan.id === 'enterprise';

  const cardStyle: React.CSSProperties = {
    background:    isAgency ? 'linear-gradient(160deg, #13193a 0%, #181E35 60%, #0f162e 100%)' : BG2,
    border:        isAgency ? `1.5px solid ${INDIGO}55` : `1px solid ${BORD}`,
    borderRadius:  20,
    padding:       isAgency ? '0 0 28px' : '28px 28px',
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           0,
    position:      'relative' as const,
    overflow:      'hidden',
    boxShadow:     isAgency
      ? '0 0 0 1px rgba(129,140,248,0.25), 0 24px 80px rgba(129,140,248,0.12), 0 4px 24px rgba(0,0,0,0.5)'
      : '0 4px 24px rgba(0,0,0,0.3)',
    flex: '1 1 300px',
    maxWidth: 440,
    transform: isAgency ? 'scale(1.025)' : 'scale(1)',
    transition: 'box-shadow 0.2s, transform 0.2s',
  };

  return (
    <div style={cardStyle}>
      {/* Badge "Formule Phare" (Agency uniquement) */}
      {isAgency && (
        <div style={{
          background: `linear-gradient(90deg, ${INDIGO}, #a78bfa)`,
          padding: '10px 24px',
          textAlign: 'center',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#fff',
          marginBottom: 0,
        }}>
          ⭐ Formule Phare — La plus choisie
        </div>
      )}

      <div style={{ padding: isAgency ? '24px 28px 0' : '0 0 0' }}>
        {/* Nom + tagline */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: isAgency ? `${INDIGO}22` : isEnterprise ? 'rgba(71,85,105,0.2)' : `${TEAL}22`,
              border: `1px solid ${isAgency ? INDIGO + '44' : isEnterprise ? '#47556944' : TEAL + '44'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isEnterprise
                ? <Mail size={15} color="#94a3b8" />
                : isAgency
                ? <Star size={15} color={INDIGO} />
                : <Zap size={15} color={TEAL} />}
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: TEXT }}>{plan.name}</span>
          </div>
          <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.55, marginBottom: 0 }}>
            {plan.tagline}
          </p>
        </div>

        {/* Prix */}
        <div style={{ marginBottom: 22, paddingBottom: 20, borderBottom: `1px solid ${BORD}` }}>
          {plan.price !== null ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
              <span style={{
                fontSize: 48, fontWeight: 900, lineHeight: 1,
                color: isAgency ? INDIGO : TEXT,
                letterSpacing: '-0.03em',
              }}>
                {plan.priceLabel}€
              </span>
              <span style={{ fontSize: 13, color: MUTED, marginBottom: 6 }}>HT / mois</span>
            </div>
          ) : (
            <span style={{
              fontSize: 32, fontWeight: 900, color: '#94a3b8', lineHeight: 1,
            }}>
              Sur devis
            </span>
          )}
        </div>

        {/* CTA */}
        {isEnterprise ? (
          <a
            href={plan.ctaHref}
            style={{
              display: 'block', textAlign: 'center', width: '100%',
              padding: '13px 0', borderRadius: 12, fontSize: 14, fontWeight: 700,
              background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORD2}`,
              color: TEXT, textDecoration: 'none', marginBottom: 24,
              cursor: 'pointer', transition: 'background 0.15s',
            }}
          >
            {plan.ctaLabel}
          </a>
        ) : (
          <button
            onClick={() => onCta(plan.id)}
            style={{
              display: 'block', width: '100%',
              padding: '14px 0', borderRadius: 12, fontSize: 14, fontWeight: 800,
              background: isAgency
                ? `linear-gradient(135deg, ${INDIGO}, #a78bfa)`
                : `linear-gradient(135deg, ${TEAL}, #0f9d91)`,
              border: 'none', color: '#fff', marginBottom: 24,
              cursor: 'pointer', letterSpacing: '0.01em',
              boxShadow: isAgency
                ? '0 4px 20px rgba(129,140,248,0.4)'
                : '0 4px 16px rgba(13,148,136,0.35)',
              transition: 'opacity 0.15s',
            }}
          >
            {plan.ctaLabel}
          </button>
        )}

        {/* Liste de features */}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
          {plan.features.map((f, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{
                flexShrink: 0, marginTop: 1,
                width: 18, height: 18, borderRadius: '50%',
                background: isAgency ? `${INDIGO}22` : `${TEAL}1a`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Check size={11} color={isAgency ? INDIGO : TEAL} strokeWidth={3} />
              </span>
              <span style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.5 }}>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface PricingSectionProps {
  cta: (planId: string) => void;
  /** Filter plans by audience tab: 'commerce' = Pro only, 'agency' = Agency + Enterprise */
  audience?: 'commerce' | 'agency';
}

export function PricingSection({ cta, audience }: PricingSectionProps) {
  const filteredPlans = audience === 'commerce'
    ? KOMPILOT_PLANS.filter(p => p.id === 'starter')
    : audience === 'agency'
      ? KOMPILOT_PLANS.filter(p => p.id === 'agency' || p.id === 'enterprise')
      : KOMPILOT_PLANS;

  return (
    <section
      id="tarifs"
      style={{
        background: BG,
        padding: '72px 24px 80px',
      }}
    >
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>

        {/* En-tête */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: `${TEAL}18`, border: `1px solid ${TEAL}40`,
            borderRadius: 40, padding: '5px 16px', marginBottom: 18,
          }}>
            <Zap size={13} color={TEAL} />
            <span style={{ fontSize: 12, fontWeight: 700, color: TEAL, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Tarification B2B
            </span>
          </div>
          <h2 style={{
            fontSize: 'clamp(1.9rem, 4.5vw, 2.8rem)', fontWeight: 900,
            color: TEXT, letterSpacing: '-0.03em', marginBottom: 14, lineHeight: 1.15,
          }}>
            {audience === 'agency'
              ? <>L'infrastructure IA qui fait croître<br />vos clients et vos revenus.</>
              : <>L'IA qui gère votre présence,<br />pendant que vous gérez votre business.</>}
          </h2>
          <p style={{ fontSize: '1rem', color: MUTED, maxWidth: 520, margin: '0 auto', lineHeight: 1.6 }}>
            Prix HT · Facturation mensuelle · Résiliation sans frais à tout moment · Essai 14 jours inclus
          </p>
        </div>

        {/* Grille des plans filtrés */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 20,
          justifyContent: 'center',
          alignItems: 'stretch',
        }}>
          {filteredPlans.map(plan => (
            <PlanCard key={plan.id} plan={plan} onCta={cta} />
          ))}
        </div>

        {/* Note de bas */}
        <p style={{
          textAlign: 'center', marginTop: 40,
          fontSize: 12, color: '#334155', lineHeight: 1.6,
        }}>
          Tous les prix sont indiqués hors taxes. TVA applicable selon votre pays de résidence.
          <br />
          Paiement sécurisé par Stripe · Données chiffrées · Hébergé en Europe.
        </p>
      </div>
    </section>
  );
}
