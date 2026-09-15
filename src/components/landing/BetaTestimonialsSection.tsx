import type { ReactNode } from 'react';
import { ArrowRight, Building2, Megaphone, Search, ShoppingBag, Quote } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { trackEvent } from '../../hooks/useAnalytics';
import { BETA_TESTIMONIALS, getApprovedBetaTestimonials, getBetaTestimonial, type BetaTestimonial, type BetaTestimonialCategory } from '../../data/betaTestimonials';

const categoryStyles: Record<BetaTestimonialCategory, { icon: typeof Building2; accent: string; avatar: string }> = {
  agency: { icon: Building2, accent: 'border-violet-300/20 bg-violet-300/[0.08] text-violet-200', avatar: 'bg-violet-500/20 text-violet-200 ring-violet-300/20' },
  marketing: { icon: Megaphone, accent: 'border-teal-300/20 bg-teal-300/[0.08] text-teal-200', avatar: 'bg-teal-500/20 text-teal-200 ring-teal-300/20' },
  seo: { icon: Search, accent: 'border-sky-300/20 bg-sky-300/[0.08] text-sky-200', avatar: 'bg-sky-500/20 text-sky-200 ring-sky-300/20' },
  ecommerce: { icon: ShoppingBag, accent: 'border-amber-300/20 bg-amber-300/[0.08] text-amber-200', avatar: 'bg-amber-500/20 text-amber-200 ring-amber-300/20' },
};

function trackTestimonialCta(ctaType: 'signup' | 'demo', destination: '/signup' | '/demo') {
  trackEvent('testimonial_cta_click', {
    cta_type: ctaType,
    testimonial_section: 'beta_testimonials',
    destination,
  });
}

export function BetaTestimonialCard({ testimonial }: { testimonial: BetaTestimonial }) {
  const style = categoryStyles[testimonial.category];
  const Icon = style.icon;
  const quoteId = `beta-quote-${testimonial.id}`;

  return (
    <article className="flex min-h-[280px] flex-col rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-[0_18px_50px_rgba(2,6,23,.2)] transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07] md:p-7">
      <div className="flex items-center justify-between gap-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${style.accent}`} aria-hidden="true"><Icon size={18} /></div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${style.accent}`}>{testimonial.badge}</span>
      </div>
      <Quote className="mt-6 text-slate-500/70" size={28} aria-hidden="true" />
      <blockquote id={quoteId} className="mt-2 max-w-[42rem] text-[1rem] leading-7 text-slate-200">
        « {testimonial.quote} »
      </blockquote>
      <footer className="mt-auto flex items-center gap-3 pt-7" aria-describedby={quoteId}>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-1 ${style.avatar}`} aria-label={`Avatar textuel de ${testimonial.name}`} role="img">{testimonial.initials}</div>
        <div>
          <p className="font-bold text-slate-100">{testimonial.name}</p>
          <p className="text-sm text-slate-400">{testimonial.role}</p>
          <p className="mt-1 text-xs text-slate-500">Domaine : {testimonial.category === 'ecommerce' ? 'e-commerce' : testimonial.category}</p>
        </div>
      </footer>
    </article>
  );
}

function CtaLink({ type, to, children }: { type: 'signup' | 'demo'; to: '/signup' | '/demo'; children: ReactNode }) {
  return <Link to={to} onClick={() => trackTestimonialCta(type, to)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" style={type === 'signup' ? { background: '#0D9488', color: '#F8FAFC' } : { border: '1px solid rgba(148,163,184,.3)', color: '#E2E8F0' }}>{children}</Link>;
}

export function BetaContextualQuote({ id, children }: { id: string; children: string }) {
  const testimonial = getBetaTestimonial(id);
  if (!testimonial || testimonial.publicationApproved !== true) return null;
  return <aside className="mt-8 max-w-xl rounded-2xl border border-white/10 bg-white/[0.04] p-5"><p className="text-sm leading-6 text-slate-300">« {children} »</p><Link to="/temoignages" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-teal-300 underline-offset-4 hover:underline">Voir tous les témoignages <ArrowRight size={14} /></Link></aside>;
}

export function BetaTestimonialsSection() {
  const testimonials = getApprovedBetaTestimonials();

  return (
    <section id="temoignages" className="landing-section overflow-hidden bg-[#0F172A] text-slate-100" aria-labelledby="beta-testimonials-title">
      <div className="landing-container py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="nc-section-label text-teal-300">Retours de bêta-testeurs</p>
          <h2 id="beta-testimonials-title" className="mt-4 text-3xl font-black tracking-tight text-slate-50 md:text-5xl">Déjà adopté par ceux qui pilotent leur visibilité</h2>
          <p className="mt-5 text-base leading-7 text-slate-300 md:text-lg">Agences, équipes marketing, consultants et e-commerçants testent Kompilot dans leurs activités quotidiennes.</p>
        </div>

        {testimonials.length > 0 ? <div className="mt-12 grid gap-5 md:grid-cols-2 md:gap-7">{testimonials.map(testimonial => <BetaTestimonialCard key={testimonial.id} testimonial={testimonial} />)}</div> : <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-5 text-center text-sm leading-6 text-amber-100">Aperçu en attente d’autorisation de publication. Les retours seront affichés après confirmation humaine de l’autorisation écrite de chaque bêta-testeur.</div>}
        <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-5 text-slate-500">{BETA_TESTIMONIALS.length} retours préparés pour publication · aucun témoignage n’est affiché sans autorisation écrite confirmée.</p>

        <div className="mx-auto mt-14 max-w-3xl rounded-3xl border border-white/10 bg-slate-950/40 p-7 text-center md:p-9">
          <h3 className="text-2xl font-black text-slate-50 md:text-3xl">À votre tour de tester le cockpit</h3>
          <p className="mt-3 text-sm text-slate-400">Sans carte bancaire · Vous gardez la validation finale</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <CtaLink type="signup" to="/signup">Tester Kompilot pendant 7 jours <ArrowRight size={16} /></CtaLink>
            <CtaLink type="demo" to="/demo">Explorer la démonstration</CtaLink>
          </div>
        </div>
      </div>
    </section>
  );
}
