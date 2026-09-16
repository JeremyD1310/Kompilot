import { useEffect, type ReactNode } from 'react';
import { ArrowRight, Quote } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { trackEvent } from '../../hooks/useAnalytics';
import { getApprovedBetaTestimonials, getBetaTestimonial, type BetaTestimonial } from '../../data/betaTestimonials';

const testimonialViewKeys = new Set<string>();

function trackTestimonialSectionView() {
  const key = `${window.location.pathname}:beta_testimonials`;
  if (testimonialViewKeys.has(key)) return;
  testimonialViewKeys.add(key);
  trackEvent('testimonial_section_view', {
    page_path: window.location.pathname,
    section_name: 'beta_testimonials',
  });
}

function trackTestimonialCta(ctaName: 'signup' | 'demo', destination: '/signup' | '/demo') {
  trackEvent('testimonial_cta_click', {
    cta_name: ctaName,
    cta_destination: destination,
    page_path: window.location.pathname,
    section_name: 'beta_testimonials',
  });
}

export function BetaTestimonialCard({ testimonial }: { testimonial: BetaTestimonial }) {
  const quoteId = `beta-quote-${testimonial.id}`;

  return (
    <article className="flex min-h-[390px] flex-col rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-[0_18px_50px_rgba(2,6,23,.2)] transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07] md:p-7">
      <div className="flex items-center justify-between gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-teal-300/20 bg-teal-300/[0.08] text-teal-200" aria-hidden="true"><Quote size={18} /></div>
        <span className="rounded-full border border-teal-300/20 bg-teal-300/[0.08] px-3 py-1 text-xs font-semibold text-teal-200">Bêta-testeur Kompilot</span>
      </div>
      <blockquote id={quoteId} className="mt-7 text-base leading-7 text-slate-200">
        « {testimonial.quote} »
      </blockquote>
      <p className="mt-6 rounded-2xl border border-teal-300/15 bg-teal-300/[0.06] px-4 py-3 text-base font-bold leading-6 text-teal-100">{testimonial.benefit}</p>
      <footer className="mt-auto flex items-center gap-3 pt-7" aria-describedby={quoteId}>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-400/15 text-sm font-bold text-teal-100 ring-1 ring-teal-300/20" aria-label={`Avatar textuel de ${testimonial.name}`} role="img">{testimonial.initials}</div>
        <div>
          <p className="font-bold text-slate-100">{testimonial.name}</p>
          <p className="text-base text-slate-300">{testimonial.role}</p>
        </div>
      </footer>
    </article>
  );
}

function CtaLink({ type, to, children }: { type: 'signup' | 'demo'; to: '/signup' | '/demo'; children: ReactNode }) {
  const className = type === 'signup'
    ? 'bg-teal-600 text-slate-50 hover:bg-teal-500'
    : 'border border-slate-400/30 text-slate-100 hover:bg-white/10';

  return <Link to={to} onClick={() => trackTestimonialCta(type, to)} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${className}`}>{children}</Link>;
}

export function BetaContextualQuote({ id, children }: { id: string; children: string }) {
  const testimonial = getBetaTestimonial(id);
  if (!testimonial || testimonial.publicationApproved !== true) return null;
  return <aside className="mt-8 max-w-xl rounded-2xl border border-white/10 bg-white/[0.04] p-5"><p className="text-sm leading-6 text-slate-300">« {children} »</p><Link to="/temoignages" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-teal-300 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300">Voir tous les témoignages <ArrowRight size={14} /></Link></aside>;
}

export function BetaTestimonialsSection() {
  const testimonials = getApprovedBetaTestimonials();

  useEffect(() => {
    trackTestimonialSectionView();
    // Tracking is consent-gated in useAnalytics and this effect runs once per mount.
  }, []);

  return (
    <section id="temoignages" className="landing-section overflow-hidden bg-[#0F172A] text-slate-100" aria-labelledby="beta-testimonials-title">
      <div className="landing-container py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="nc-section-label text-teal-300">RETOURS DE BÊTA-TESTEURS</p>
          <h2 id="beta-testimonials-title" className="mt-4 text-3xl font-black tracking-tight text-slate-50 md:text-5xl">Ils testent déjà Kompilot au quotidien</h2>
          <p className="mt-5 text-base leading-7 text-slate-300 md:text-lg">Agences, équipes marketing, consultants et e-commerçants partagent leur expérience de Kompilot dans leurs activités quotidiennes.</p>
          <p className="mt-4 text-base leading-7 text-slate-300">Kompilot est une plateforme de communication B2B qui réunit création de contenu assistée par IA, communication multicanale, visibilité SEO et GEO et gestion de communication locale pour les PME, les agences et les commerces.</p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 md:gap-7">{testimonials.map(testimonial => <BetaTestimonialCard key={testimonial.id} testimonial={testimonial} />)}</div>
        <p className="mx-auto mt-12 max-w-3xl text-center text-base leading-7 text-slate-300">À votre tour de centraliser, simplifier et accélérer votre communication.</p>

        <div className="mx-auto mt-8 max-w-3xl rounded-3xl border border-white/10 bg-slate-950/40 p-7 text-center md:p-9">
          <p className="text-base font-semibold text-slate-200">Essai gratuit 14 jours</p>
          <p className="mt-2 text-base text-slate-300">Sans carte bancaire · Activation immédiate · Vous gardez le contrôle</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <CtaLink type="signup" to="/signup">Essayer Kompilot gratuitement <ArrowRight size={16} /></CtaLink>
            <CtaLink type="demo" to="/demo">Explorer la démonstration</CtaLink>
          </div>
        </div>
      </div>
    </section>
  );
}
