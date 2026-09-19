/**
 * PricingPlanCard — Single pricing plan card with popular/scale variants.
 * GEA features are highlighted in amber/yellow.
 */
import React from 'react';
import { Check } from 'lucide-react';

export function PlanCard({ plan, onCta }: {
  plan: any;
  onCta: (planId: string) => void;
}) {
  const popular = plan.popular;
  const isScale = plan.isScale;

  const cardStyle: React.CSSProperties = {
    borderRadius: 20,
    background: '#131E30',
    border: popular
      ? '1px solid rgba(13,148,136,.5)'
      : isScale
      ? '1px solid #818CF8'
      : '1px solid rgba(255,255,255,.07)',
    boxShadow: popular
      ? '0 0 0 2px rgba(13,148,136,.22), 0 16px 48px rgba(0,0,0,.45)'
      : '0 8px 32px rgba(0,0,0,.35)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    transform: popular ? 'scale(1.03)' : 'none',
    transition: 'transform .2s, box-shadow .2s',
    position: 'relative',
  };

  if (isScale) {
    cardStyle.backgroundImage = 'linear-gradient(#131E30, #131E30), linear-gradient(135deg, #6359F8, #818CF8)';
    cardStyle.backgroundOrigin = 'border-box';
    cardStyle.backgroundClip = 'content-box, border-box';
  }

  return (
    <div style={cardStyle} className={popular ? 'nc-price-card popular' : 'nc-price-card'}>
      {/* Popular banner */}
      {popular && !plan.agencyPlan && (
        <div style={{
          background: '#0D9488', color: '#fff',
          fontSize: '.7rem', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '.1em',
          textAlign: 'center', padding: '11px 0',
        }}>
          ⭐ Populaire
        </div>
      )}
      {plan.id === 'agency-growth' && (
        <div style={{
          background: '#818CF8', color: '#fff',
          fontSize: '.7rem', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '.1em',
          textAlign: 'center', padding: '11px 0',
        }}>
          ⭐ Recommandé
        </div>
      )}

      <div style={{ padding: '32px 28px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F1F5F9', margin: 0 }}>{plan.name}</h3>
          <p style={{
            color: '#475569', fontSize: '.7rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '.1em',
            marginTop: 8, marginBottom: 0,
          }}>
            {plan.badge}
          </p>
        </div>

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 28 }}>
          <span style={{
            fontSize: plan.price === 'Sur mesure' ? '2rem' : '3rem',
            fontWeight: 900, color: '#F1F5F9',
            letterSpacing: '-0.04em', lineHeight: 1,
          }}>
            {plan.price}
            {plan.price !== 'Sur mesure' && <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>€</span>}
          </span>
          {plan.priceSub && (
            <span style={{ color: '#475569', fontSize: '.82rem' }}>{plan.priceSub}</span>
          )}
        </div>

        {/* Features */}
        <ul style={{
          listStyle: 'none', padding: 0,
          margin: '0 0 32px',
          display: 'flex', flexDirection: 'column', gap: 10,
          flex: 1,
        }}>
          {plan.features.map((feat: string) => {
            const isGEA     = feat.includes('G.E.A.');
            const isFire    = feat.startsWith('🔥');   // Machine à Clients badge
            const isRadar   = feat.startsWith('🔍');   // Competitor Radar
            const isGEOAlert = feat.includes('Alertes de détournement G.E.O.');
            const isROIReport = feat.startsWith('📊'); // ROI weekly report
            const isSpecial = isGEA || isFire || isRadar || isGEOAlert || isROIReport;

            const textColor  = isFire ? '#FCA5A5' : isRadar ? '#A5F3FC' : isGEA ? '#FCD34D' : isGEOAlert ? '#6EE7B7' : isROIReport ? '#86EFAC' : '#CBD5E1';
            const checkColor = isFire ? '#EF4444' : isRadar ? '#0EA5E9' : isGEA ? '#F59E0B' : isGEOAlert ? '#10B981' : isROIReport ? '#22C55E' : '#0D9488';
            const displayText = feat.startsWith('✓ ') ? feat.slice(2) : feat;

            return (
              <li key={feat} style={{
                display: 'flex', alignItems: 'start', gap: 9, fontSize: '.85rem',
                ...(isFire ? {
                  background: 'rgba(239,68,68,.07)',
                  border: '1px solid rgba(239,68,68,.2)',
                  borderRadius: 8, padding: '7px 10px', margin: '2px 0',
                } : {}),
              }}>
                <Check
                  size={13}
                  style={{ color: checkColor, flexShrink: 0, marginTop: 4 }}
                  strokeWidth={3}
                />
                <span style={{ color: textColor, lineHeight: 1.4, fontWeight: isSpecial ? 700 : 400 }}>
                  {displayText}
                </span>
              </li>
            );
          })}
        </ul>

        {/* CTA */}
        {plan.href ? (
          <a
            href={plan.href}
            style={{
              display: 'block', textAlign: 'center', textDecoration: 'none',
              background: 'linear-gradient(135deg, #6359F8, #818CF8)', color: '#fff', fontWeight: 700,
              border: 'none', borderRadius: 12, padding: '14px 0',
              fontSize: '.92rem', cursor: 'pointer',
              transition: 'opacity .2s',
              boxShadow: '0 4px 20px rgba(99,89,248,.35)', width: '100%',
            }}
            className="hover:opacity-90"
          >
            {plan.cta}
          </a>
        ) : (
          <button
            onClick={() => onCta(plan.id)}
            className="hover:opacity-90"
            style={popular
              ? {
                  background: plan.agencyPlan ? '#818CF8' : '#0D9488',
                  color: '#fff', fontWeight: 700,
                  border: 'none', borderRadius: 12, padding: '14px 0',
                  fontSize: '.92rem', cursor: 'pointer',
                  transition: 'opacity .2s',
                  boxShadow: plan.agencyPlan
                    ? '0 4px 20px rgba(129,140,248,.35)'
                    : '0 4px 20px rgba(13,148,136,.35)',
                  width: '100%',
                }
              : {
                  background: 'transparent', color: '#94A3B8', fontWeight: 600,
                  border: '1px solid rgba(255,255,255,.1)', borderRadius: 12,
                  padding: '14px 0', fontSize: '.92rem', cursor: 'pointer',
                  transition: 'all .2s', width: '100%',
                }
            }
          >
            {plan.cta}
          </button>
        )}

        {/* Micro-copy reassurance */}
        {!plan.href && plan.price !== 'Sur mesure' && (
          <p style={{
            textAlign: 'center',
            color: '#475569',
            fontSize: '.7rem',
            margin: '8px 0 0',
            lineHeight: 1.5,
          }}>
            Annulation en 1 clic · Pas de carte bancaire requise pendant 14 jours
          </p>
        )}
      </div>
    </div>
  );
}
