/**
 * ROICalculatorSection — Interactive ROI simulator above the pricing section.
 * Two sliders: No-shows/month × Average basket → net gain per month.
 */
import { useState, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';

function Slider({ label, min, max, step, value, onChange, formatValue }: {
  label: string; min: number; max: number; step: number;
  value: number; onChange: (v: number) => void;
  formatValue: (v: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '.82rem', color: '#94A3B8', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#F1F5F9', letterSpacing: '-0.02em' }}>
          {formatValue(value)}
        </span>
      </div>
      <div style={{ position: 'relative', height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 9999, cursor: 'pointer' }}>
        <div style={{ position: 'absolute', left: 0, width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #0D9488, #2DD4BF)', borderRadius: 9999, transition: 'width .1s' }} />
        <input
          type="range"
          min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            position: 'absolute', inset: 0, width: '100%', opacity: 0,
            cursor: 'pointer', height: '100%', margin: 0,
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '.7rem', color: '#334155' }}>{formatValue(min)}</span>
        <span style={{ fontSize: '.7rem', color: '#334155' }}>{formatValue(max)}</span>
      </div>
    </div>
  );
}

export function ROICalculatorSection() {
  const [noShows, setNoShows] = useState(8);
  const [basket, setBasket] = useState(65);

  const plan = 99; // Pro Commerce monthly cost

  const result = useMemo(() => {
    const recovered = noShows * basket;                     // revenue recovered from no-shows
    const timeSaved = Math.round(noShows * 0.4 + 12);     // hours saved (~0.4h per no-show + base)
    const netGain = recovered - plan;                       // net after plan cost
    const roi = Math.round((netGain / plan) * 100);
    return { recovered, timeSaved, netGain, roi };
  }, [noShows, basket]);

  return (
    <section style={{ padding: '80px 24px 0', borderTop: '1px solid rgba(255,255,255,.05)' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em', color: '#0D9488', marginBottom: 12 }}>
            Calculateur de ROI
          </p>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', fontWeight: 800, letterSpacing: '-0.025em', color: '#F1F5F9', lineHeight: 1.2, margin: 0 }}>
            Combien vous coûtent vos no-shows ?
          </h2>
          <p style={{ color: '#475569', fontSize: '.9rem', marginTop: 12 }}>
            Ajustez les curseurs — vos gains s'affichent en temps réel.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 28,
          background: 'rgba(255,255,255,.025)',
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 24,
          padding: '40px 36px',
        }}>
          {/* Left: sliders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <Slider
              label="No-shows / mois"
              min={1} max={40} step={1} value={noShows}
              onChange={setNoShows}
              formatValue={v => `${v} RDV manqués`}
            />
            <Slider
              label="Panier moyen"
              min={20} max={300} step={5} value={basket}
              onChange={setBasket}
              formatValue={v => `${v} €`}
            />

            {/* Plan cost hint */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(13,148,136,.08)', border: '1px solid rgba(13,148,136,.2)',
              borderRadius: 12, padding: '12px 16px',
            }}>
              <span style={{ fontSize: '.75rem', color: '#2DD4BF', fontWeight: 600, lineHeight: 1.5 }}>
                Plan Pro Commerce = {plan} €/mois — Coût pris en compte dans le calcul.
              </span>
            </div>
          </div>

          {/* Right: results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Net gain — primary metric */}
            <div style={{
              background: result.netGain > 0 ? 'rgba(13,148,136,.12)' : 'rgba(239,68,68,.08)',
              border: `1px solid ${result.netGain > 0 ? 'rgba(13,148,136,.35)' : 'rgba(239,68,68,.25)'}`,
              borderRadius: 18, padding: '28px 24px', textAlign: 'center',
            }}>
              <p style={{ fontSize: '.72rem', fontWeight: 700, color: result.netGain > 0 ? '#2DD4BF' : '#FCA5A5', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>
                Gain net / mois
              </p>
              <p style={{ fontSize: 'clamp(2.4rem, 5vw, 3.2rem)', fontWeight: 900, color: result.netGain > 0 ? '#2DD4BF' : '#FCA5A5', letterSpacing: '-0.04em', lineHeight: 1 }}>
                {result.netGain > 0 ? '+' : ''}{result.netGain.toLocaleString('fr-FR')} €
              </p>
              {result.roi > 0 && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10, background: 'rgba(13,148,136,.15)', borderRadius: 9999, padding: '4px 12px' }}>
                  <TrendingUp size={11} style={{ color: '#2DD4BF' }} />
                  <span style={{ fontSize: '.72rem', color: '#2DD4BF', fontWeight: 700 }}>ROI × {Math.round(result.roi / 100)}x</span>
                </div>
              )}
            </div>

            {/* Secondary metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '18px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: '.68rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>CA récupéré</p>
                <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.03em' }}>{result.recovered.toLocaleString('fr-FR')} €</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '18px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: '.68rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Heures économisées</p>
                <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.03em' }}>{result.timeSaved}h</p>
              </div>
            </div>

            <p style={{ fontSize: '.73rem', color: '#334155', textAlign: 'center', lineHeight: 1.5 }}>
              Calcul basé sur les empreintes bancaires Stripe + automatisations IA actives.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
