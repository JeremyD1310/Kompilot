import { useEffect, useMemo, useRef, useState } from 'react';
import { PWABanner } from '../components/layout/PWABanner';
import { blink } from '../blink/client';
import { createCheckoutSession } from '../lib/billingClient';
import { useAuth } from '../hooks/useAuth';
import { PricingSection } from '../components/landing/PricingSection';
import { KompilotAdGenerator } from '../components/landing/KompilotAdGenerator';
import { FAQSection } from '../components/landing/FAQSection';
import { LANDING_CSS } from '../components/landing/LandingPageStyles';
import { LandingNav } from '../components/landing/LandingNav';
import { LandingHero } from '../components/landing/LandingHero';
import { LandingAgencyTab } from '../components/landing/LandingAgencyTab';
import { LandingTestimonials } from '../components/landing/LandingTestimonials';
import { LandingFooter } from '../components/landing/LandingFooter';
import { IntegrationsSection } from '../components/landing/IntegrationsSection';
import { DemoCtaBanner } from '../components/landing/DemoCtaBanner';
import { DemoNotificationEngine } from '../components/layout/DemoNotificationEngine';
import { GeoScannerFlash } from '../components/landing/GeoScannerFlash';
import { captureUtmParams, getUtmSector, track } from '../lib/tracking';
import { getSectorConfig } from '../components/landing/UTMSectorAdapter';

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const els = ref.current.querySelectorAll<HTMLElement>('.sr');
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('sr-in'); }),
      { threshold: 0.08 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
  return ref;
}

const COMMERCE_REVIEWS = [
  { name: 'Sophie R.', role: 'Restauratrice, Lyon', rating: 5, text: "En 3 semaines je suis passée de 12 à 47 avis Google (+292%). L'IA génère des réponses personnalisées en 1 clic — mes clients me complimentent même sur la qualité des réponses !" },
  { name: 'Marc D.', role: 'Artisan plombier, Bordeaux', rating: 5, text: "Je mettais 3h/semaine sur les réseaux. Maintenant je planifie tout le lundi en 20 minutes. J'ai gagné 4 nouveaux clients en 1 mois grâce à ma visibilité Google améliorée." },
  { name: 'Amandine L.', role: 'Coach nutritionniste, Paris', rating: 5, text: "En 6 semaines, mon score de visibilité IA est passé de 18 à 74/100. Je suis maintenant citée par ChatGPT quand on cherche 'coach nutrition Paris'. Ça m'a apporté 8 nouveaux clients." },
];

const AGENCY_REVIEWS = [
  { name: 'Julien M.', role: 'Directeur Agence Digitale, Paris', rating: 5, text: "Grâce à la marque blanche de Kompilot, mon agence a packagé une offre de visibilité locale et l'a ajoutée à 15 contrats en moins d'un mois. Nos clients adorent les rapports automatisés à notre nom." },
  { name: 'Sarah K.', role: 'Freelance Marketing Digital', rating: 5, text: "J'ai triplé mon MRR en 3 mois. L'IA génère les posts, optimise le G.E.O. et répond aux avis pour mes 12 clients — en arrière-plan pendant que je me concentre sur la stratégie." },
  { name: 'Thomas B.', role: 'Fondateur, Agence SEO Local', rating: 5, text: "Le tableau de bord multi-clients et les rapports PDF brandés ont révolutionné notre façon de présenter les résultats. Nos clients perçoivent la valeur immédiatement." },
];

/** Smooth-scroll to a section id */
function scrollTo(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function LandingPage() {
  const ref = useScrollReveal();
  const { user } = useAuth();
  const cta = () => blink.auth.login(window.location.origin + '/dashboard');

  // ── UTM / Sector detection ─────────────────────────────────────────────────
  const utmParams = useMemo(() => { try { return captureUtmParams(); } catch { return {}; } }, []);
  const detectedSector = useMemo(() => getUtmSector(), []);
  const sectorConfig = useMemo(() => getSectorConfig(detectedSector), [detectedSector]);

  // Détecter l'audience depuis utm_source ou paramètre
  const [audience, setAudience] = useState<'commerce' | 'agency'>(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const src = sp.get('utm_source') ?? '';
      if (src.includes('agency') || sp.get('utm_audience') === 'agency') return 'agency';
    } catch {}
    return 'commerce';
  });
  const [heroSearch, setHeroSearch] = useState('');

  // Capturer les UTMs au montage
  useEffect(() => {
    captureUtmParams();
    // ViewContent sur la landing page
    track('ViewContent', {
      sector: detectedSector ?? undefined,
      userType: audience,
      eventUrl: window.location.href,
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Adaptive CTA for the hero main button:
   * - Agence audience → scrolls to #agency infrastructure section
   * - Authenticated Pro user (commerce) → scrolls to #how-to-start onboarding
   * - Non-authenticated → falls through to default login (undefined = fallback to onCta)
   */
  const heroCtaOverride: (() => void) | undefined =
    audience === 'agency'
      ? () => scrollTo('agency')
      : user
      ? () => scrollTo('how-to-start')
      : undefined;

  const handlePricingCta = async (planId: string) => {
    if (!user) {
      try { localStorage.setItem('kompilot_pending_plan', planId); } catch {}
      blink.auth.login(window.location.origin + '/subscription?plan=' + encodeURIComponent(planId));
      return;
    }
    try {
      const result = await createCheckoutSession(planId);
      if (result?.url) {
        window.open(result.url, '_blank', 'noopener,noreferrer');
      } else {
        // Fallback SPA navigation (hash anchor scroll)
        const el = document.getElementById('tarifs');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      console.error('[pricing] checkout session failed', err);
      // SPA navigate to subscription page instead of full reload
      window.location.assign(`/subscription?plan=${encodeURIComponent(planId)}`);
    }
  };

  const reviews = audience === 'commerce' ? COMMERCE_REVIEWS : AGENCY_REVIEWS;

  return (
    <>
    <PWABanner />
    <div ref={ref} style={{ backgroundColor: '#0B1120', color: '#E2E8F0', fontFamily: 'Inter, system-ui, sans-serif' }} className="min-h-screen overflow-x-hidden">
      <style>{LANDING_CSS}</style>

      <LandingNav audience={audience} setAudience={setAudience} onCta={cta} isLoggedIn={!!user} />

      <LandingHero onCta={cta} onHeroCta={heroCtaOverride} heroSearch={heroSearch} setHeroSearch={setHeroSearch} audience={audience} />

      {/* ── UTM Sector Banner (s'affiche uniquement si utm_sector détecté) ── */}
      {detectedSector && (
        <div style={{
          background: 'rgba(13,148,136,.12)', border: '1px solid rgba(13,148,136,.3)',
          borderRadius: 12, padding: '10px 18px', maxWidth: 760, margin: '0 auto 12px',
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '.75rem', fontWeight: 700, color: '#0D9488' }}>
            {sectorConfig.badge}
          </span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {sectorConfig.platforms.map(p => (
              <span key={p.name} style={{
                fontSize: '.65rem', fontWeight: 700, color: '#94a3b8',
                background: 'rgba(255,255,255,.06)', borderRadius: 6, padding: '2px 8px',
                border: '1px solid rgba(255,255,255,.08)',
              }}>
                {p.logo} {p.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── GEO SCANNER FLASH ── */}
      <div style={{ paddingBottom: 40 }}>
        <GeoScannerFlash onCta={cta} />
      </div>

      {/* STICKY TABS */}
      <div style={{ position:'sticky',top:64,zIndex:30,background:'rgba(11,17,32,.97)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,.07)',padding:'8px 12px' }}>
        <div style={{ maxWidth:560,margin:'0 auto',display:'flex',gap:3,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.09)',borderRadius:9999,padding:3,overflow:'hidden' }}>
          <button className="nc-tab-btn" onClick={() => { setAudience('commerce'); track('ViewContent', { userType: 'commerce', sector: detectedSector ?? undefined, eventUrl: window.location.href }).catch(() => {}); }} style={{ background:audience==='commerce'?'#0D9488':'transparent',color:audience==='commerce'?'#fff':'#64748B',boxShadow:audience==='commerce'?'0 2px 12px rgba(13,148,136,.35)':'none' }}>🏪 Commerçants & Réseaux</button>
          <button className="nc-tab-btn" onClick={() => { setAudience('agency'); track('ViewContent', { userType: 'agency', sector: detectedSector ?? undefined, eventUrl: window.location.href }).catch(() => {}); }} style={{ background:audience==='agency'?'#818CF8':'transparent',color:audience==='agency'?'#fff':'#64748B',boxShadow:audience==='agency'?'0 2px 12px rgba(129,140,248,.35)':'none' }}>🏢 Agences & Freelances</button>
        </div>
      </div>

      {/* COMMERCE TAB — Creative Studio sectoriel */}
      {audience === 'commerce' && (
        <div id="commerce" style={{ borderTop: '1px solid rgba(255,255,255,.05)' }}>
          <KompilotAdGenerator />
        </div>
      )}

      {/* AGENCY TAB */}
      {audience === 'agency' && (
        <div id="agency">
          <LandingAgencyTab onCta={cta} />
        </div>
      )}

      <LandingTestimonials reviews={reviews} audience={audience} />

      <div id="pricing">
        <PricingSection cta={handlePricingCta} />
      </div>

      <IntegrationsSection />

      <div id="faq">
        <FAQSection />
      </div>

      <LandingFooter />

      {/* ── Demo mode overlays ── */}
      <DemoCtaBanner />
      <DemoNotificationEngine />

      {/* ── Sticky mobile CTA bar ── */}
      {/* z-index 9100 guarantees it renders above any third-party chat widget (max ~9000).
          pointer-events: all + isolation: isolate prevent overlay interference.
          The 100px safe-zone padding keeps a clear tap area around the button. */}
      {!user && (
        <div
          id="nc-cta-safe-zone"
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            zIndex: 9100,
            isolation: 'isolate',
            pointerEvents: 'all',
            background: 'rgba(11,17,32,.97)', backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255,255,255,.08)',
            padding: '10px 16px',
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {/* Left — tagline */}
          <div style={{ minWidth: 0 }}>
            <p style={{ color: '#E2E8F0', fontWeight: 700, fontSize: '.82rem', margin: 0, lineHeight: 1.3 }}>
              Essai gratuit 14 jours
            </p>
            <p style={{ color: '#475569', fontSize: '.7rem', margin: 0 }}>Sans carte bancaire</p>
          </div>

          {/* Center — primary CTA button + micro-copy */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <button
              onClick={cta}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: 'linear-gradient(135deg, #0D9488, #0f766e)',
                color: '#fff', fontWeight: 700,
                fontSize: '.85rem', borderRadius: 12,
                padding: '13px 22px', border: 'none', cursor: 'pointer',
                boxShadow: '0 0 28px rgba(13,148,136,.55)',
                whiteSpace: 'nowrap',
                transition: 'transform .15s, box-shadow .15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.03)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
            >
              Démarrer gratuitement →
            </button>
            <p style={{ color: '#475569', fontSize: '.65rem', margin: 0, textAlign: 'center' }}>
              Annulation en 1 clic · Pas de carte requise 14 jours
            </p>
          </div>

          {/* Right — spacer to keep button perfectly centered */}
          <div style={{ justifySelf: 'end' }} />
        </div>
      )}
    </div>
    </>
  );
}
