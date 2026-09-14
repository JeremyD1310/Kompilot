import { useEffect, useRef, useState } from 'react';
import { Building2, Store } from 'lucide-react';
import { blink } from '../blink/client';
import { useAuth } from '../hooks/useAuth';
import { PWABanner } from '../components/layout/PWABanner';
import { LandingNav } from '../components/landing/LandingNav';
import { LandingTestimonials } from '../components/landing/LandingTestimonials';
import { LandingFooter } from '../components/landing/LandingFooter';
import { AGENCY_REVIEWS, COMMERCE_REVIEWS } from '../data/testimonials';
import { usePageSeo } from '../hooks/usePageSeo';
import { createKompilotGraph } from '../lib/seoData';

type Audience = 'commerce' | 'agency';

export default function TestimonialsPage() {
  const { user } = useAuth();
  const [audience, setAudience] = useState<Audience>('commerce');
  const revealRef = useRef<HTMLDivElement>(null);

  usePageSeo('Retours utilisateurs Kompilot', 'Retrouvez les cas d’usage et retours documentés sur Kompilot, sans promesse de résultat généralisée.', '/temoignages', { structuredData: createKompilotGraph('/temoignages', 'Retours utilisateurs Kompilot') });

  const onCta = () => blink.auth.login(window.location.origin + '/dashboard');
  const reviews = audience === 'commerce' ? COMMERCE_REVIEWS : AGENCY_REVIEWS;

  useEffect(() => {
    const root = revealRef.current;
    if (!root) return;
    const revealElements = root.querySelectorAll<HTMLElement>('.sr');
    revealElements.forEach(element => element.classList.add('sr-in'));
  }, [audience]);

  return (
    <>
      <PWABanner />
      <div
        className="min-h-screen overflow-x-hidden"
        style={{
          backgroundColor: 'hsl(var(--landing-bg))',
          color: 'hsl(var(--landing-body))',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <header>
          <LandingNav audience={audience} setAudience={setAudience} onCta={onCta} isLoggedIn={!!user} />
        </header>

        <main>
          <section className="mx-auto max-w-6xl px-4 pb-4 pt-16 text-center md:pb-8 md:pt-24">
            <p className="nc-section-label mb-4">Cas d’usage · sans métriques non sourcées</p>
            <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-slate-100 md:text-6xl">
            Retours d’usage documentés sur Kompilot
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-400 md:text-lg">
            Kompilot est une plateforme SaaS de marketing local pour organiser contenus, avis clients et visibilité en ligne. Les exemples ci-dessous décrivent des usages ; ils ne constituent pas des témoignages nominatifs ni des garanties de performance.
            </p>
          </section>

          <div className="mx-auto flex max-w-xl gap-1 rounded-full border border-white/[0.09] bg-white/[0.04] p-1">
            <button
              type="button"
              onClick={() => setAudience('commerce')}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
              style={{
                background: audience === 'commerce' ? 'hsl(var(--landing-primary))' : 'transparent',
                color: audience === 'commerce' ? 'hsl(var(--landing-white))' : 'hsl(var(--landing-muted))',
              }}
            >
              <Store size={16} aria-hidden="true" />
              Commerçants
            </button>
            <button
              type="button"
              onClick={() => setAudience('agency')}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
              style={{
                background: audience === 'agency' ? '#818CF8' : 'transparent',
                color: audience === 'agency' ? '#fff' : 'hsl(var(--landing-muted))',
              }}
            >
              <Building2 size={16} aria-hidden="true" />
              Agences & freelances
            </button>
          </div>

          <div ref={revealRef}>
            <LandingTestimonials reviews={reviews} audience={audience} />
          </div>
        </main>

        <LandingFooter />
      </div>
    </>
  );
}
