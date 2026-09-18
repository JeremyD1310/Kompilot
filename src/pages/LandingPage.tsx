import { useEffect, useMemo, useRef, useState } from 'react';
import { PWABanner } from '../components/layout/PWABanner';
import { createCheckoutSession } from '../lib/billingClient';
import type { BillingInterval, SubscriptionPlanId } from '../../shared/pricingCatalog';
import { useAuth } from '../hooks/useAuth';
import { PricingSection } from '../components/landing/PricingSection';
import { FAQSection } from '../components/landing/FAQSection';
import { LANDING_CSS } from '../components/landing/LandingPageStyles';
import { LandingNav } from '../components/landing/LandingNav';
import { LandingHero } from '../components/landing/LandingHero';
import { LandingFooter } from '../components/landing/LandingFooter';
import { IntegrationsSection } from '../components/landing/IntegrationsSection';
import { VisibilityLandingSections } from '../components/landing/VisibilityLandingSections';
import { BetaTestimonialsSection } from '../components/landing/BetaTestimonialsSection';
import { usePageSeo } from '../hooks/usePageSeo';
import { createKompilotGraph } from '../lib/seoData';
import { captureUtmParams, getUtmSector, track } from '../lib/tracking';
import { getSectorConfig } from '../components/landing/UTMSectorAdapter';
import { useNavigate } from '@tanstack/react-router';
import { blink } from '../blink/client';

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

/** Smooth-scroll to a section id */
function scrollTo(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function LandingPage() {
  const ref = useScrollReveal();
  const { user } = useAuth();
  const navigate = useNavigate();
  const title = 'Logiciel de visibilité locale et communication B2B | Kompilot';
  const description = 'Centralisez contenus, avis Google, réseaux sociaux et visibilité dans ChatGPT et Gemini avec Kompilot, le cockpit marketing des PME, commerces et agences. Essai gratuit 14 jours.';

  usePageSeo(title, description, '/', {
    structuredData: createKompilotGraph('/', title, false, description),
  });

  const cta = () => navigate({ to: user ? '/dashboard' : '/signup' });
  const utmParams = useMemo(() => { try { return captureUtmParams(); } catch { return {}; } }, []);
  const detectedSector = useMemo(() => getUtmSector(), []);
  const sectorConfig = useMemo(() => getSectorConfig(detectedSector), [detectedSector]);
  const [audience, setAudience] = useState<'commerce' | 'agency'>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('utm_audience') === 'agency' || params.get('utm_source')?.includes('agency') ? 'agency' : 'commerce';
    } catch { return 'commerce'; }
  });

  useEffect(() => {
    captureUtmParams();
    track('ViewContent', { sector: detectedSector ?? undefined, userType: audience, eventUrl: window.location.href }).catch(() => {});
  }, [audience, detectedSector, utmParams]);

  const handlePricingCta = async (planId: string, billing: BillingInterval) => {
    if (!user) {
      try { localStorage.setItem('kompilot_pending_plan', planId); } catch {}
      blink.auth.login(window.location.origin + '/subscription?plan=' + encodeURIComponent(planId));
      return;
    }
    try {
      const result = await createCheckoutSession(planId as SubscriptionPlanId, billing, {
        cgvAccepted: true,
        retractionWaived: false,
        cgvVersion: 'public-2026-09-14',
        acceptedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
      });
      if (result?.url) window.open(result.url, '_blank', 'noopener,noreferrer');
      else document.getElementById('tarifs')?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('[pricing] checkout session failed', error);
      window.location.assign(`/subscription?plan=${encodeURIComponent(planId)}`);
    }
  };

  return (
    <>
      <PWABanner />
      <div ref={ref} className="min-h-screen overflow-x-hidden" style={{ background: '#F8FAFC', color: '#0F172A', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <style>{LANDING_CSS}</style>
        <header><LandingNav audience={audience} setAudience={setAudience} onCta={cta} isLoggedIn={!!user} /></header>
        <main>
          <LandingHero onCta={cta} audience={audience} />
          {detectedSector && (
            <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-5 pb-4 text-sm" style={{ color: '#0F766E' }}>
              <span className="rounded-full px-3 py-1 font-semibold" style={{ background: '#CCFBF1' }}>{sectorConfig.badge}</span>
              {sectorConfig.platforms.map(platform => <span key={platform.name} className="rounded-full border px-3 py-1" style={{ borderColor: '#DDE7E9', background: '#FFFFFF', color: '#64748B' }}>{platform.logo} {platform.name}</span>)}
            </div>
          )}
          <VisibilityLandingSections onCta={cta} />
          <section className="border-y px-5 py-6" style={{ borderColor: '#E2E8F0', background: '#FFFFFF' }}>
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-[.14em]" style={{ color: '#0D9488' }}>Pour chaque organisation</p><p className="mt-1 text-sm" style={{ color: '#64748B' }}>Une vue simple pour les commerces, une vue multi-clients pour les agences.</p></div>
              <div className="flex rounded-full border p-1" style={{ borderColor: '#DDE7E9', background: '#F8FAFC' }}>
                {(['commerce', 'agency'] as const).map(value => <button key={value} type="button" onClick={() => setAudience(value)} className="rounded-full px-4 py-2 text-sm font-semibold transition" style={{ background: audience === value ? '#0D9488' : 'transparent', color: audience === value ? '#FFFFFF' : '#64748B' }}>{value === 'commerce' ? 'Commerces & PME' : 'Agences & freelances'}</button>)}
              </div>
            </div>
          </section>
          <PricingSection cta={handlePricingCta} audience={audience} />
          <IntegrationsSection />
          <FAQSection onCta={cta} />
          <BetaTestimonialsSection />
          <section className="px-5 py-20" style={{ background: '#0F172A' }}>
            <div className="mx-auto max-w-4xl text-center"><p className="text-xs font-bold uppercase tracking-[.16em]" style={{ color: '#5EEAD4' }}>Le prochain geste est simple</p><h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-5xl">Transformez votre visibilité en actions concrètes</h2><p className="mx-auto mt-5 max-w-2xl text-base leading-8" style={{ color: '#CBD5E1' }}>Centralisez vos contenus, avis et performances dans un cockpit conçu pour les entreprises locales.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><button type="button" onClick={cta} className="nc-pill" style={{ background: '#0D9488', boxShadow: '0 12px 30px rgba(13,148,136,.25)' }}>Commencer gratuitement</button><a href="/showcase" className="nc-btn-outline" style={{ color: '#E2E8F0', borderColor: 'rgba(255,255,255,.2)' }}>Réserver une démonstration</a></div></div>
          </section>
        </main>
        <LandingFooter />
        {!user && <div id="nc-cta-safe-zone" className="md:hidden" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9100, background: 'rgba(255,255,255,.96)', backdropFilter: 'blur(16px)', borderTop: '1px solid #E2E8F0', padding: '10px 12px' }}><button type="button" onClick={cta} className="nc-pill" style={{ width: '100%', justifyContent: 'center', padding: '12px 18px', fontSize: '.9rem' }}>Commencer gratuitement <span aria-hidden="true">→</span></button></div>}
      </div>
    </>
  );
}
