/**
 * PricingROISimulator — Inline ROI calculator with two sliders and a result panel.
 * Includes the private RangeSlider helper component.
 */
import { useState, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';

/* ── RangeSlider ───────────────────────────────────────────────────────────── */

function RangeSlider({ label, min, max, step, value, onChange, fmt }: {
  label: string; min: number; max: number; step: number;
  value: number; onChange: (v: number) => void;
  fmt: (v: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '.81rem', color: '#94A3B8', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#F1F5F9', letterSpacing: '-0.02em' }}>
          {fmt(value)}
        </span>
      </div>
      <div style={{ position: 'relative', height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 9999 }}>
        <div style={{ position: 'absolute', left: 0, width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #0D9488, #2DD4BF)', borderRadius: 9999, transition: 'width .08s' }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', height: '100%', margin: 0 }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '.68rem', color: '#334155' }}>{fmt(min)}</span>
        <span style={{ fontSize: '.68rem', color: '#334155' }}>{fmt(max)}</span>
      </div>
    </div>
  );
}

/* ── InlineROISimulator ────────────────────────────────────────────────────── */

export function InlineROISimulator() {
  const [noShows, setNoShows] = useState(8);
  const [basket, setBasket] = useState(65);
  const PLAN_COST = 99;

  const { recovered, netGain, roi } = useMemo(() => {
    const recovered = noShows * basket;
    const netGain = recovered - PLAN_COST;
    const roi = Math.round((netGain / PLAN_COST) * 100);
    return { recovered, netGain, roi };
  }, [noShows, basket]);

  return (
    <div style={{
      background: 'rgba(255,255,255,.025)',
      border: '1px solid rgba(13,148,136,.2)',
      borderRadius: 20,
      padding: '32px 32px 28px',
      marginBottom: 48,
      maxWidth: 800,
      margin: '0 auto 48px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(13,148,136,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <TrendingUp size={15} style={{ color: '#0D9488' }} />
        </div>
        <p style={{ fontSize: '.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.12em', color: '#0D9488', margin: 0 }}>
          Simulateur de ROI — Calculez vos gains
        </p>
      </div>
      <p style={{ fontSize: '.82rem', color: '#475569', marginBottom: 28, marginLeft: 42 }}>
        Ajustez les curseurs pour voir ce que Kompilot récupère pour vous chaque mois.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 28 }}>
        {/* Sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <RangeSlider
            label="No-shows / mois"
            min={1} max={40} step={1} value={noShows} onChange={setNoShows}
            fmt={v => `${v} RDV manqués`}
          />
          <RangeSlider
            label="Panier moyen"
            min={20} max={300} step={5} value={basket} onChange={setBasket}
            fmt={v => `${v} €`}
          />
          <p style={{ fontSize: '.72rem', color: '#334155', lineHeight: 1.5, margin: 0 }}>
            Plan Pro Commerce inclus à {PLAN_COST} €/mois — Coût déduit du calcul.
          </p>
        </div>

        {/* Result */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            background: netGain > 0 ? 'rgba(13,148,136,.12)' : 'rgba(239,68,68,.08)',
            border: `1px solid ${netGain > 0 ? 'rgba(13,148,136,.35)' : 'rgba(239,68,68,.25)'}`,
            borderRadius: 16, padding: '22px 20px', textAlign: 'center',
          }}>
            <p style={{ fontSize: '.68rem', fontWeight: 700, color: netGain > 0 ? '#2DD4BF' : '#FCA5A5', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>
              Gain net / mois
            </p>
            <p style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, color: netGain > 0 ? '#2DD4BF' : '#FCA5A5', letterSpacing: '-0.04em', lineHeight: 1, margin: 0 }}>
              {netGain > 0 ? '+' : ''}{netGain.toLocaleString('fr-FR')} €
            </p>
            {roi > 0 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10, background: 'rgba(13,148,136,.15)', borderRadius: 9999, padding: '4px 12px' }}>
                <TrendingUp size={10} style={{ color: '#2DD4BF' }} />
                <span style={{ fontSize: '.7rem', color: '#2DD4BF', fontWeight: 700 }}>ROI × {Math.round(roi / 100)}x</span>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
              <p style={{ fontSize: '.64rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>CA récupéré</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.03em', margin: 0 }}>{recovered.toLocaleString('fr-FR')} €</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
              <p style={{ fontSize: '.64rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Coût plan</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#64748B', letterSpacing: '-0.03em', margin: 0 }}>{PLAN_COST} €</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
