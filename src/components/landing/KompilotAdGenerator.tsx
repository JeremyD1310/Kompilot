import { useState } from 'react';

// ── Données sectorielles ──────────────────────────────────────────────────────
const KOMPILOT_SECTORS = {
  beaute_coiffure: {
    title: 'Beauté & Coiffure',
    hookFirst: 'Boostez la prise de RDV',
    hookAccent: 'en salon grâce aux ads',
    cta: 'Je remplis mon salon',
    tools: ['Planity', 'Treatwell', 'Flexy', 'Fresha'],
  },
  sante_medical: {
    title: 'Santé & Médical',
    hookFirst: 'Automatisez vos prises',
    hookAccent: 'de consultations en cabinet',
    cta: 'Je réduis mes No-Shows',
    tools: ['Doctolib', 'Maiia', 'Keldoc', 'InzeeCare'],
  },
  fitness_wellness: {
    title: 'Fitness & Wellness',
    hookFirst: 'Multipliez les réservations',
    hookAccent: 'de vos cours en studio',
    cta: 'Je remplis mes sessions',
    tools: ['Mindbody', 'Zenoti', 'Resawod', 'Decoplus'],
  },
  restauration: {
    title: 'Restauration',
    hookFirst: 'Maximisez vos réservations',
    hookAccent: 'de tables midi et soir',
    cta: 'Je booste mes couverts',
    tools: ['TheFork', 'ZenChef', 'Guestonline', 'Lightspeed'],
  },
  immobilier: {
    title: 'Immobilier',
    hookFirst: 'Captez des mandats',
    hookAccent: 'exclusifs qualifiés en continu',
    cta: 'Je trouve de nouveaux vendeurs',
    tools: ['NéoSphère', 'Hektor', 'Adapt immo', 'Interkab'],
  },
  juridique_conseil: {
    title: 'Juridique & Conseil',
    hookFirst: 'Sécurisez vos premiers',
    hookAccent: 'rendez-vous clients qualifiés',
    cta: 'Je développe mon cabinet',
    tools: ['Secib', 'Jarvis Legal', 'Diapaz', 'JurisLink'],
  },
  btp_artisanat: {
    title: 'BTP & Artisanat',
    hookFirst: 'Recevez des demandes',
    hookAccent: 'de devis de chantiers locaux',
    cta: 'Je signe de nouveaux chantiers',
    tools: ['Habitatpresto', 'Travaux.com', 'Probat', 'Obat'],
  },
  automobile: {
    title: 'Automobile & Garage',
    hookFirst: 'Maximisez les passages',
    hookAccent: 'atelier via ciblage local',
    cta: 'Je génère des entrées atelier',
    tools: ['Identifier', 'Vroomly', 'Allogarage', 'Darva'],
  },
} as const;

type SectorKey = keyof typeof KOMPILOT_SECTORS;

// ── Composant ─────────────────────────────────────────────────────────────────
export function KompilotAdGenerator({ variant = 'landing' }: { variant?: 'landing' | 'dashboard' }) {
  const [selectedSector, setSelectedSector] = useState<SectorKey>('beaute_coiffure');
  const [animKey, setAnimKey] = useState(0);
  const activeSector = KOMPILOT_SECTORS[selectedSector];

  const handleSectorChange = (key: SectorKey) => {
    setSelectedSector(key);
    setAnimKey(k => k + 1); // retrigger card animation
  };

  return (
    <section style={{
      padding: variant === 'dashboard' ? '0' : 'clamp(40px, 6vw, 64px) 16px',
      maxWidth: variant === 'dashboard' ? '100%' : 1080,
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <span style={{
          display: 'inline-block',
          background: 'rgba(13,148,136,.12)',
          border: '1px solid rgba(13,148,136,.25)',
          color: '#0D9488',
          borderRadius: 9999,
          padding: '4px 14px',
          fontSize: '.75rem',
          fontWeight: 700,
          marginBottom: 14,
          letterSpacing: '.06em',
          textTransform: 'uppercase',
        }}>
          Creative Studio IA
        </span>
        <h2 style={{
          fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)',
          fontWeight: 800,
          color: '#F1F5F9',
          lineHeight: 1.25,
          margin: '0 0 10px',
        }}>
          Vos annonces adaptées à chaque secteur,
          <br />
          <span style={{ color: '#0D9488' }}>générées automatiquement.</span>
        </h2>
        <p style={{ color: '#64748B', fontSize: '.93rem', maxWidth: 500, margin: '0 auto' }}>
          Sélectionnez votre secteur — Kompilot génère le visuel publicitaire et les accroches adaptés.
        </p>
      </div>

      {/* Layout: selector + card preview */}
      <div style={{
        display: 'flex',
        gap: 32,
        alignItems: 'flex-start',
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}>

        {/* ── Sector pill selector ── */}
        <div style={{ flex: '1 1 300px', maxWidth: 380 }}>
          <p style={{
            fontSize: '.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            color: '#475569',
            marginBottom: 12,
          }}>
            Secteur d'activité cible
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(Object.entries(KOMPILOT_SECTORS) as [SectorKey, typeof KOMPILOT_SECTORS[SectorKey]][]).map(([key, val]) => {
              const isActive = selectedSector === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSectorChange(key)}
                  style={{
                    background: isActive ? 'rgba(13,148,136,.18)' : 'rgba(255,255,255,.04)',
                    border: `1px solid ${isActive ? 'rgba(13,148,136,.55)' : 'rgba(255,255,255,.08)'}`,
                    color: isActive ? '#2DD4BF' : '#94A3B8',
                    borderRadius: 9999,
                    padding: '6px 14px',
                    fontSize: '.78rem',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all .18s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {val.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Ad card preview ── */}
        <div
          key={animKey}
          style={{
            flex: '0 0 auto',
            width: 'min(100%, 300px)',
            aspectRatio: '4/5',
            background: 'linear-gradient(135deg, #020617 0%, #0F172A 60%, #1e1b4b 100%)',
            padding: 24,
            borderRadius: 24,
            boxShadow: '0 24px 64px -12px rgba(0,0,0,.7), 0 0 0 1px rgba(13,148,136,.18)',
            border: '1px solid rgba(255,255,255,.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            animation: 'fadeSlideInAd .35s ease both',
          }}
        >
          {/* Watermark */}
          <div style={{
            position: 'absolute', top: 14, right: 14,
            fontSize: '.6rem', color: 'rgba(255,255,255,.12)',
            fontFamily: 'ui-monospace, monospace',
            letterSpacing: '.12em',
            fontWeight: 700,
          }}>
            KOMPILOT ENGINE v2
          </div>

          {/* Header / Hook */}
          <div style={{ marginTop: 8 }}>
            <div style={{
              fontSize: '.68rem', fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '.12em',
              color: '#38BDF8', marginBottom: 10,
            }}>
              Creative Studio
            </div>
            <h3 style={{
              fontSize: '1.25rem', fontWeight: 900, lineHeight: 1.3,
              color: '#F8FAFC', margin: 0, letterSpacing: '-.02em',
            }}>
              {activeSector.hookFirst}{' '}
              <br />
              <span style={{
                background: 'linear-gradient(90deg, #22D3EE, #818CF8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {activeSector.hookAccent}
              </span>
            </h3>
          </div>

          {/* Tools grid */}
          <div style={{ margin: 'auto 0', padding: '16px 0' }}>
            <p style={{
              fontSize: '.65rem', color: '#475569',
              textAlign: 'center', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '.08em',
              marginBottom: 10,
            }}>
              Compatible avec vos outils métiers
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {activeSector.tools.map((tool, idx) => (
                <div key={idx} style={{
                  background: '#FFFFFF',
                  color: '#0F172A',
                  fontWeight: 700,
                  fontSize: '.72rem',
                  padding: '7px 10px',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  boxShadow: '0 2px 8px rgba(0,0,0,.25)',
                }}>
                  <span style={{ color: '#3B82F6', fontSize: '.65rem' }}>⚡</span>
                  {tool}
                </div>
              ))}
            </div>
          </div>

          {/* CTA button */}
          <button style={{
            width: '100%',
            background: 'linear-gradient(90deg, #22D3EE, #6366F1)',
            color: '#fff',
            fontWeight: 800,
            fontSize: '.82rem',
            padding: '12px 16px',
            borderRadius: 14,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(99,102,241,.35)',
            letterSpacing: '-.01em',
          }}>
            {activeSector.cta}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideInAd {
          from { opacity: 0; transform: translateY(10px) scale(.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </section>
  );
}
