import { useState, useEffect, useRef } from 'react';
import { Zap, ArrowRight, Search } from 'lucide-react';
import { HeroDashboardMockup } from './HeroDashboardMockup';
import { ReviewSimulator } from './ReviewSimulator';

interface LandingHeroProps {
  onCta: () => void;
  /** Optional override for the main hero CTA button (adaptive behavior) */
  onHeroCta?: () => void;
  heroSearch?: string;
  setHeroSearch?: (v: string) => void;
  audience: 'commerce' | 'agency';
}

// ── Hero copy per audience ────────────────────────────────────────────────────
const HERO_COPY = {
  commerce: {
    badge: '✦ Le cockpit de votre visibilité locale',
    h1Main: 'Pilotez toute votre visibilité locale',
    h1Gradient: 'depuis un seul cockpit IA.',
    sub: 'Kompilot aide les commerces, PME et agences à créer leurs contenus, gérer leurs avis et améliorer leur présence sur Google, ChatGPT, Gemini et les réseaux sociaux.',
    cta: 'Essayer gratuitement',
  },
  agency: {
    badge: '✦ Pilotage multi-clients et marque blanche',
    h1Main: 'Pilotez la visibilité locale de vos clients',
    h1Gradient: 'depuis un seul cockpit IA.',
    sub: 'Centralisez contenus, avis, SEO local, GEO et reporting pour chaque établissement, tout en gardant la validation finale.',
    cta: 'Découvrir Kompilot Agency',
  },
};

// ── 3-step blocks for commerce hero ──────────────────────────────────────────
const COMMERCE_STEPS = [
  { num: '01', icon: Search, title: 'Décrivez votre activité', desc: 'L\'IA apprend votre secteur, votre ton et vos objectifs en moins de 3 minutes.' },
  { num: '02', icon: Zap, title: 'Kompilot prépare vos actions', desc: 'Contenus, réponses et recommandations sont organisés selon vos priorités.' },
  { num: '03', icon: ArrowRight, title: 'Vous suivez les résultats', desc: 'Score de visibilité, nouveaux avis, reach — tout en temps réel sur votre tableau de bord.' },
];

// ── ChatGPT Simulator ────────────────────────────────────────────────────────
const BUSINESS_TEMPLATES = [
  { competitor: true, name: 'La Bonne Table', score: 94, reason: 'Fiche complète, 230+ avis, répond en <2h' },
  { competitor: false, name: 'Votre établissement', score: 12, reason: 'Fiche incomplète, 0 réponse aux avis, invisible sur les IA' },
  { competitor: true, name: 'Le Bistrot du Marché', score: 78, reason: '4,7★ Google, présent sur Perplexity et Gemini' },
];

const AI_RESPONSE_INTRO = (city: string) =>
  `🤖 Selon les données locales, le meilleur établissement à ${city} est `;

function ChatGPTSimulator({ city }: { city: string }) {
  const [step, setStep] = useState(0);
  const [typedQuery, setTypedQuery] = useState('');
  const [typedResponse, setTypedResponse] = useState('');
  const [showShimmer, setShowShimmer] = useState(false);
  const query = `Meilleur restaurant ${city}`;
  const aiIntro = AI_RESPONSE_INTRO(city);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Safety: sanitize city to prevent any injected content from reaching the DOM
    const safeCity = city.replace(/[<>'"&]/g, '').slice(0, 80);
    if (!safeCity) { setStep(0); setTypedQuery(''); setTypedResponse(''); setShowShimmer(false); return; }
    setStep(1);
    setTypedQuery('');
    setTypedResponse('');
    setShowShimmer(false);

    // Track all timer IDs so ALL can be cleared on unmount
    const timers: ReturnType<typeof setTimeout>[] = [];
    const after = (ms: number, fn: () => void) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
    };

    let i = 0;
    const safeQuery = `Meilleur restaurant ${safeCity}`;
    const safeIntro = AI_RESPONSE_INTRO(safeCity);
    const typeQuery = () => {
      i++;
      setTypedQuery(safeQuery.slice(0, i));
      if (i < safeQuery.length) {
        after(38, typeQuery);
      } else {
        after(500, () => {
          setStep(2);
          setShowShimmer(true);
          after(1200, () => {
            setShowShimmer(false);
            setStep(3);
            let j = 0;
            const typeResp = () => {
              j++;
              setTypedResponse(safeIntro.slice(0, j));
              if (j < safeIntro.length) {
                after(28, typeResp);
              } else {
                after(400, () => setStep(4));
              }
            };
            typeResp();
          });
        });
      }
    };
    after(300, typeQuery);
    // Cleanup ALL timers when city changes or component unmounts
    return () => timers.forEach(clearTimeout);
  }, [city]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      background: '#0D1117', borderRadius: 20,
      border: '1px solid rgba(255,255,255,.10)',
      overflow: 'hidden', maxWidth: 380, width: '100%',
      boxShadow: '0 20px 60px -10px rgba(0,0,0,.7), 0 0 0 1px rgba(13,148,136,.18)',
    }}>
      <div style={{ background: '#161B22', padding: '10px 14px 9px', display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ display: 'flex', gap: 6, marginRight: 12 }}>
          {['#FF5F57','#FFBD2E','#28CA41'].map(c => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, boxShadow: `0 0 4px ${c}55` }} />
          ))}
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <span style={{ color: '#8B949E', fontSize: '.65rem', fontWeight: 600, letterSpacing: '.03em' }}>
            ChatGPT — Recherche locale IA
          </span>
        </div>
      </div>

      <div style={{ padding: '14px 14px 16px', minHeight: 190, background: '#0D1117' }}>
        {step >= 1 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <div style={{
              background: 'rgba(13,148,136,.22)', border: '1px solid rgba(13,148,136,.35)',
              borderRadius: '16px 16px 3px 16px', padding: '8px 13px',
              color: '#2DD4BF', fontSize: '.78rem', fontWeight: 500, maxWidth: 260,
              fontFamily: '"SF Mono", ui-monospace, monospace', letterSpacing: '.01em',
            }}>
              {typedQuery}{step === 1 && <span style={{ animation: 'blink 1s infinite' }}>▋</span>}
            </div>
          </div>
        )}

        {showShimmer && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 12 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg, #0D9488 0%, #06B6D4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', flexShrink: 0 }}>🤖</div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7, paddingTop: 4 }}>
              {[90, 70, 50].map((w, i) => (
                <div key={i} style={{ height: 10, borderRadius: 6, width: `${w}%`, background: 'linear-gradient(90deg, rgba(255,255,255,.05) 25%, rgba(255,255,255,.12) 50%, rgba(255,255,255,.05) 75%)', backgroundSize: '200% 100%', animation: 'shimmerAI 1.4s infinite linear', animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {(step === 3 || step === 4) && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg, #0D9488 0%, #06B6D4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', flexShrink: 0 }}>🤖</div>
            <div style={{ flex: 1, paddingTop: 3 }}>
              <p style={{ color: '#E6EDF3', fontSize: '.78rem', fontFamily: '"SF Pro Text", system-ui, sans-serif', lineHeight: 1.65, margin: 0 }}>
                {typedResponse}
                {step === 3 && <span style={{ display: 'inline-block', width: 7, height: 13, background: '#2DD4BF', borderRadius: 2, marginLeft: 2, verticalAlign: 'middle', animation: 'blink .8s infinite' }} />}
              </p>
              {step === 3 && typedResponse.length > 20 && (
                <div style={{ marginTop: 8, height: 12, borderRadius: 6, width: '75%', background: 'linear-gradient(90deg, rgba(255,255,255,.04) 25%, rgba(255,255,255,.10) 50%, rgba(255,255,255,.04) 75%)', backgroundSize: '200% 100%', animation: 'shimmerAI 1.4s infinite linear' }} />
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {BUSINESS_TEMPLATES.map((biz, i) => (
              <div key={i} style={{
                background: biz.competitor ? 'rgba(255,255,255,.04)' : 'rgba(239,68,68,.07)',
                border: `1px solid ${biz.competitor ? 'rgba(255,255,255,.08)' : 'rgba(239,68,68,.28)'}`,
                borderRadius: 10, padding: '7px 10px',
                animation: 'fadeSlideIn .3s ease both', animationDelay: `${i * 100}ms`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ color: biz.competitor ? '#E2E8F0' : '#FCA5A5', fontSize: '.76rem', fontWeight: 700 }}>
                    {biz.competitor ? `${i + 1}. ` : '❌ '}{biz.name}
                  </span>
                  <span style={{
                    fontSize: '.62rem', fontWeight: 800, borderRadius: 9999, padding: '1px 6px',
                    background: biz.score >= 70 ? 'rgba(34,197,94,.15)' : biz.score >= 40 ? 'rgba(245,158,11,.15)' : 'rgba(239,68,68,.15)',
                    color: biz.score >= 70 ? '#4ADE80' : biz.score >= 40 ? '#FBBF24' : '#F87171',
                    border: `1px solid ${biz.score >= 70 ? 'rgba(34,197,94,.3)' : biz.score >= 40 ? 'rgba(245,158,11,.3)' : 'rgba(239,68,68,.3)'}`,
                  }}>
                    Score {biz.score}/100
                  </span>
                </div>
                <p style={{ color: '#8B949E', fontSize: '.65rem', margin: 0, lineHeight: 1.5 }}>{biz.reason}</p>
              </div>
            ))}
            <div style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.22)', borderRadius: 10, padding: '7px 10px', marginTop: 2 }}>
              <p style={{ color: '#FBBF24', fontSize: '.7rem', fontWeight: 700, margin: '0 0 2px' }}>💡 Gain manqué estimé</p>
              <p style={{ color: '#8B949E', fontSize: '.65rem', margin: 0 }}>
                Votre établissement perd ~<strong style={{ color: '#FCD34D' }}>1 840€/mois</strong> en clients qui choisissent vos concurrents sur les IA.
              </p>
            </div>
          </div>
        )}

        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 130, gap: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, rgba(13,148,136,.2), rgba(6,182,212,.1))', border: '1px solid rgba(13,148,136,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>🤖</div>
            <p style={{ color: '#6E7681', fontSize: '.73rem', textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
              Entrez votre ville ci-dessous<br />pour voir votre position sur ChatGPT
            </p>
          </div>
        )}
      </div>
      <style>{`
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes shimmerAI { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </div>
  );
}

// ── Exported standalone simulator section (used in LandingPage after HowItWorks) ──
export function HeroChatGPTSimulatorSection({ onCta }: { onCta: () => void }) {
  const [cityInput, setCityInput] = useState('');
  const [simulatedCity, setSimulatedCity] = useState('');

  const triggerSim = () => {
    const city = cityInput.trim();
    if (!city) return;
    setSimulatedCity('');
    setTimeout(() => setSimulatedCity(city), 50);
  };

  return (
    <section style={{
      padding: '56px 24px 48px',
      borderTop: '1px solid rgba(255,255,255,.05)',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(13,148,136,.07) 0%, transparent 60%)',
    }}>
      <div style={{ maxWidth: 840, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em', color: '#0D9488', marginBottom: 14 }}>
          Diagnostic gratuit
        </p>
        <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.3rem)', fontWeight: 800, letterSpacing: '-0.025em', color: '#F1F5F9', marginBottom: 12, lineHeight: 1.2 }}>
          Où êtes-vous sur ChatGPT & Gemini ?
        </h2>
        <p style={{ color: '#64748B', fontSize: '.93rem', marginBottom: 32, lineHeight: 1.7 }}>
          Tapez votre ville et découvrez votre score de visibilité IA versus vos concurrents locaux.
        </p>

        {/* City input */}
        <div style={{
          display: 'flex', maxWidth: 500, width: '100%', margin: '0 auto 20px',
          borderRadius: 9999, overflow: 'hidden',
          boxShadow: '0 4px 32px rgba(13,148,136,.20)',
          border: '1px solid rgba(45,212,191,.30)',
          background: 'rgba(255,255,255,.06)',
        }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '14px 20px', gap: 10, minWidth: 0 }}>
            <Search size={16} style={{ color: '#2DD4BF', flexShrink: 0 }} />
            <input
              value={cityInput}
              onChange={e => {
                // Strip any HTML/script injection attempts — only allow city-like chars
                const safe = e.target.value.replace(/[<>'"]/g, '').slice(0, 80);
                setCityInput(safe);
              }}
              onKeyDown={e => { if (e.key === 'Enter') triggerSim(); }}
              placeholder="Votre ville (ex: Lyon, Marseille...)"
              maxLength={80}
              style={{ background: 'none', border: 'none', outline: 'none', color: '#E2E8F0', fontSize: '.9rem', flex: 1, minWidth: 0 }}
            />
          </div>
          <button
            onClick={triggerSim}
            disabled={!cityInput.trim()}
            style={{
              background: cityInput.trim() ? 'linear-gradient(90deg, #0D9488, #0F766E)' : 'rgba(13,148,136,.25)',
              color: '#fff', padding: '0 24px', cursor: cityInput.trim() ? 'pointer' : 'not-allowed',
              fontWeight: 800, fontSize: '.85rem', whiteSpace: 'nowrap',
              border: 'none', display: 'flex', alignItems: 'center', gap: 7,
              transition: 'background .2s', flexShrink: 0,
            }}
          >
            Analyser →
          </button>
        </div>

        <p style={{ color: '#334155', fontSize: '.7rem', marginBottom: 28 }}>
          Résultat instantané · Gratuit · Sans inscription
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, width: '100%' }}>
          <ChatGPTSimulator city={simulatedCity} />
          <div style={{ marginTop: -18, position: 'relative', zIndex: 3, width: '100%', display: 'flex', justifyContent: 'center' }}>
            <ReviewSimulator />
          </div>
        </div>

        <div style={{ marginTop: 32 }}>
          <button
            onClick={onCta}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: '#0D9488', color: '#fff', fontWeight: 700,
              fontSize: '1rem', borderRadius: 9999,
              padding: '15px 36px', border: 'none', cursor: 'pointer',
              boxShadow: '0 0 32px rgba(13,148,136,.38)',
              transition: 'transform .2s, box-shadow .2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1.025)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 48px rgba(13,148,136,.55)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 32px rgba(13,148,136,.38)';
            }}
          >
            <Zap size={16} />
            Améliorer ma visibilité — Essai gratuit
            <ArrowRight size={15} />
          </button>
          <p style={{ color: '#334155', fontSize: '.73rem', marginTop: 10 }}>
            Sans CB · 7 jours offerts · Accès immédiat
          </p>
        </div>
      </div>
    </section>
  );
}

export function LandingHero({ onCta, onHeroCta, audience }: LandingHeroProps) {
  const copy = HERO_COPY[audience];

  return (
    <section id="hero" style={{ position: 'relative', overflow: 'hidden', padding: 'clamp(64px, 9vw, 118px) 20px clamp(72px, 9vw, 120px)', background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)' }}>
      <div style={{ position: 'absolute', top: -180, right: -120, width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,.10), transparent 68%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 1180, margin: '0 auto', position: 'relative', display: 'grid', gridTemplateColumns: 'minmax(0, .84fr) minmax(0, 1.16fr)', gap: 'clamp(36px, 7vw, 92px)', alignItems: 'center' }} className="landing-hero-grid">
        <div className="sr" style={{ textAlign: 'left' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid #99F6E4', color: '#0F766E', background: '#F0FDFA', borderRadius: 9999, padding: '8px 14px', fontSize: '.75rem', fontWeight: 800, letterSpacing: '.04em', marginBottom: 24 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#0D9488' }} />{copy.badge.replace('✦ ', '')}</div>
          <h1 style={{ fontSize: 'clamp(2.45rem, 5.5vw, 5rem)', fontWeight: 900, lineHeight: 1.02, letterSpacing: '-.055em', color: '#0F172A', margin: '0 0 24px', maxWidth: 680 }}>{copy.h1Main}{' '}<span style={{ color: '#0D9488' }}>{copy.h1Gradient}</span></h1>
          <p style={{ fontSize: 'clamp(1rem, 1.6vw, 1.15rem)', color: '#475569', lineHeight: 1.75, maxWidth: 560, margin: '0 0 28px' }}>{copy.sub}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}><button type="button" aria-label="Créer mon espace gratuitement" data-testid="home-signup-cta" className="nc-pill" style={{ background: '#0D9488', color: '#FFFFFF', padding: '16px 25px', fontSize: '.98rem', boxShadow: '0 12px 26px rgba(13,148,136,.20)' }} onClick={onHeroCta ?? onCta}><Zap size={17} /> {copy.cta} <ArrowRight size={16} /></button><a href="/showcase" className="nc-btn-outline" style={{ color: '#0F172A', borderColor: '#CBD5E1', background: '#FFFFFF', padding: '15px 20px' }}>Voir en action <ArrowRight size={15} /></a></div>
          <p style={{ color: '#64748B', fontSize: '.78rem', lineHeight: 1.7, margin: 0 }}>7 jours gratuits · Sans carte bancaire · Validation humaine avant publication</p>
        </div>
        <div className="sr d2" style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '0 4px' }}><div><p style={{ margin: 0, color: '#0F172A', fontSize: '.86rem', fontWeight: 800 }}>Votre cockpit Kompilot</p><p style={{ margin: '3px 0 0', color: '#64748B', fontSize: '.72rem' }}>Aperçu produit · données de démonstration</p></div><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#0F766E', fontSize: '.7rem', fontWeight: 700 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#14B8A6' }} /> En activité</span></div>
          <div style={{ perspective: '1400px' }}><div style={{ transform: 'rotateX(5deg)', transformOrigin: '50% 0%', borderRadius: 20, overflow: 'hidden', border: '1px solid #D7E3E5', background: '#FFFFFF', boxShadow: '0 28px 70px rgba(15,23,42,.16), 0 4px 12px rgba(15,23,42,.06)' }}><div style={{ background: '#F8FAFC', padding: '11px 15px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #E2E8F0' }}><div style={{ display: 'flex', gap: 6 }}>{['#F87171', '#FBBF24', '#34D399'].map(color => <span key={color} style={{ width: 9, height: 9, borderRadius: '50%', background: color }} />)}</div><div style={{ flex: 1, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 6, padding: '4px 12px', fontSize: '.68rem', color: '#94A3B8', textAlign: 'center' }}>app.kompilot.fr / cockpit</div></div><HeroDashboardMockup /></div></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, marginTop: 14 }} className="landing-hero-kpis">{[['3', 'avis à traiter'], ['4', 'contenus programmés'], ['+18%', 'visibilité Google'], ['72', 'score GEO']].map(([value, label]) => <div key={label} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '11px 12px' }}><strong style={{ display: 'block', color: '#0F172A', fontSize: '1rem' }}>{value}</strong><span style={{ display: 'block', marginTop: 3, color: '#64748B', fontSize: '.66rem', lineHeight: 1.35 }}>{label}</span></div>)}</div>
        </div>
      </div>
      <style>{`@media (max-width: 860px) { .landing-hero-grid { grid-template-columns: 1fr !important; gap: 42px !important; } .landing-hero-grid > div:first-child { text-align: center !important; } .landing-hero-grid > div:first-child p { margin-left: auto !important; margin-right: auto !important; } .landing-hero-grid > div:first-child > div:nth-child(2) { justify-content: center !important; } } @media (max-width: 520px) { .landing-hero-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; } }`}</style>
    </section>
  );
}
