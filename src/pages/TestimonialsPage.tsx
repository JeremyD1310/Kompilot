import { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { PWABanner } from '../components/layout/PWABanner';
import { LandingFooter } from '../components/landing/LandingFooter';
import { LandingNav } from '../components/landing/LandingNav';
import { BetaTestimonialCard } from '../components/landing/BetaTestimonialsSection';
import { getApprovedBetaTestimonials } from '../data/betaTestimonials';
import { useAnalytics } from '../hooks/useAnalytics';
import { useAuth } from '../hooks/useAuth';
import { usePageSeo } from '../hooks/usePageSeo';
import { createTestimonialsGraph } from '../lib/seoData';

const LAST_UPDATED = '14 septembre 2026';

export default function TestimonialsPage() {
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();
  const title = 'Avis et retours bêta Kompilot | Cockpit IA marketing';
  const description = 'Découvrez les retours de bêta-testeurs utilisant Kompilot pour leurs contenus, leur visibilité GEO et leurs campagnes marketing.';
  const approvedTestimonials = getApprovedBetaTestimonials();
  usePageSeo(title, description, '/temoignages', { structuredData: createTestimonialsGraph('/temoignages', title, description, approvedTestimonials) });

  const onCta = () => window.location.assign(user ? '/dashboard' : '/signup');
  if (approvedTestimonials.length !== 4) {
    console.error('[testimonials] expected exactly four approved beta testimonials');
  }
  useEffect(() => {
    trackEvent('testimonial_section_view', {
      page_path: window.location.pathname,
      section_name: 'beta_testimonials',
    });
    // Tracking is consent-gated in useAnalytics and this effect runs once per mount.
  }, [trackEvent]);
  const trackCta = (ctaName: 'signup' | 'demo', destination: '/signup' | '/demo') => {
    trackEvent('testimonial_cta_click', {
      cta_name: ctaName,
      cta_destination: destination,
      page_path: window.location.pathname,
      section_name: 'beta_testimonials',
    });
  };

  return (
    <>
      <PWABanner />
      <div className="min-h-screen overflow-x-hidden bg-[#0B1120] text-slate-100">
        <header><LandingNav audience="commerce" setAudience={() => undefined} onCta={onCta} isLoggedIn={!!user} /></header>
        <main>
          <section className="mx-auto max-w-6xl px-4 pb-12 pt-16 md:pb-16 md:pt-24">
            <p className="nc-section-label text-teal-300">RETOURS DE BÊTA-TESTEURS</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-slate-50 md:text-6xl">Ils testent déjà Kompilot au quotidien</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">Agences, équipes marketing, consultants et e-commerçants partagent leur expérience de Kompilot dans leurs activités quotidiennes.</p>
            <p className="mt-4 text-sm text-slate-500">Mis à jour le {LAST_UPDATED}. Ces témoignages décrivent une expérience de bêta-testeurs et non de clients payants.</p>
          </section>

          <section className="mx-auto max-w-6xl px-4 pb-20" aria-label="Témoignages de bêta-testeurs">
            <div className="grid gap-5 md:grid-cols-2 md:gap-7">{approvedTestimonials.map(testimonial => <BetaTestimonialCard key={testimonial.id} testimonial={testimonial} />)}</div>
            <p className="mx-auto mt-12 max-w-3xl text-center text-base leading-7 text-slate-300">À votre tour de centraliser, simplifier et accélérer votre communication.</p>
          </section>

          <section className="border-y border-white/10 bg-white/[0.03] px-4 py-16" aria-labelledby="beta-programme-title">
            <div className="mx-auto max-w-4xl"><h2 id="beta-programme-title" className="text-3xl font-black text-slate-50">Une plateforme de communication B2B testée sur le terrain</h2><p className="mt-5 text-base leading-7 text-slate-300">Les bêta-testeurs explorent la création de contenu assistée par IA, la communication multicanale, la visibilité SEO et GEO, la gestion de communication locale et les usages d’un outil marketing pour PME, agences et commerces.</p></div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-16"><div className="rounded-3xl border border-teal-300/20 bg-teal-300/[0.06] p-7 md:p-10"><p className="text-base font-semibold text-slate-200">Essai gratuit 14 jours</p><p className="mt-2 text-base text-slate-300">Sans carte bancaire · Activation immédiate · Vous gardez le contrôle</p><div className="mt-7 flex flex-col gap-3 sm:flex-row"><Link to="/signup" onClick={() => trackCta('signup', '/signup')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 font-bold text-white transition hover:bg-teal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300">Essayer Kompilot gratuitement <ArrowRight size={16} /></Link><Link to="/demo" onClick={() => trackCta('demo', '/demo')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-3 font-bold text-slate-100 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300">Explorer la démonstration</Link></div><div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-sm"><Link to="/features" className="text-teal-300 underline-offset-4 hover:underline">Voir les fonctionnalités</Link><Link to="/secteurs/agences" className="text-teal-300 underline-offset-4 hover:underline">Solutions pour agences</Link><Link to="/secteurs/immobilier" className="text-teal-300 underline-offset-4 hover:underline">Solutions sectorielles</Link></div></div></section>
        </main>
        <LandingFooter />
      </div>
    </>
  );
}
