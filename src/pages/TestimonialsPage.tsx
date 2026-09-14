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
import { createKompilotGraph } from '../lib/seoData';

const LAST_UPDATED = '14 septembre 2026';

export default function TestimonialsPage() {
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();
  const title = 'Avis et retours bêta Kompilot | Cockpit IA marketing';
  const description = 'Découvrez les retours de bêta-testeurs utilisant Kompilot pour leurs contenus, leur visibilité GEO et leurs campagnes marketing.';
  usePageSeo(title, description, '/temoignages', { structuredData: createKompilotGraph('/temoignages', title, false, description) });

  const onCta = () => window.location.assign(user ? '/dashboard' : '/signup');
  const approvedTestimonials = getApprovedBetaTestimonials();
  const trackCta = (ctaType: 'signup' | 'demo', destination: '/signup' | '/demo') => {
    trackEvent('testimonial_cta_click', { cta_type: ctaType, testimonial_section: 'beta_testimonials', destination });
  };

  return (
    <>
      <PWABanner />
      <div className="min-h-screen overflow-x-hidden bg-[#0B1120] text-slate-100">
        <header><LandingNav audience="commerce" setAudience={() => undefined} onCta={onCta} isLoggedIn={!!user} /></header>
        <main>
          <section className="mx-auto max-w-6xl px-4 pb-12 pt-16 md:pb-16 md:pt-24">
            <p className="nc-section-label text-teal-300">Retours de bêta-testeurs</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-slate-50 md:text-6xl">Ils testent Kompilot dans leurs activités quotidiennes</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">Ces retours proviennent d’utilisateurs ayant testé Kompilot avant ou pendant sa phase de lancement. Les résultats peuvent varier selon l’activité, les canaux connectés et l’utilisation de la plateforme.</p>
            <p className="mt-4 text-sm text-slate-500">Mis à jour le {LAST_UPDATED}. Ces quatre retours ne représentent pas l’ensemble des utilisateurs.</p>
          </section>

          <section className="mx-auto max-w-6xl px-4 pb-20" aria-label="Témoignages de bêta-testeurs">
            {approvedTestimonials.length > 0 ? <div className="grid gap-5 md:grid-cols-2 md:gap-7">{approvedTestimonials.map(testimonial => <BetaTestimonialCard key={testimonial.id} testimonial={testimonial} />)}</div> : <p className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-5 text-sm leading-6 text-amber-100">Aperçu en attente d’autorisation de publication. Aucun témoignage n’est affiché avant confirmation humaine de l’autorisation écrite.</p>}
          </section>

          <section className="border-y border-white/10 bg-white/[0.03] px-4 py-16" aria-labelledby="beta-programme-title">
            <div className="mx-auto max-w-4xl"><h2 id="beta-programme-title" className="text-3xl font-black text-slate-50">Un programme bêta centré sur la validation humaine</h2><p className="mt-5 text-base leading-7 text-slate-300">Le programme bêta permet de tester les parcours de création, de visibilité GEO et de pilotage des campagnes dans des contextes professionnels variés. Kompilot conserve la validation finale avant chaque publication ou réponse.</p><p className="mt-4 text-sm leading-6 text-slate-400">Les témoignages sont publiés avec un nom abrégé, une fonction et un domaine d’utilisation. Aucun résultat chiffré, logo, photographie, entreprise ou localisation supplémentaire n’est ajouté sans source et autorisation.</p></div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-16"><div className="rounded-3xl border border-teal-300/20 bg-teal-300/[0.06] p-7 md:p-10"><h2 className="text-3xl font-black text-slate-50">À votre tour de tester le cockpit</h2><p className="mt-3 text-slate-300">Sans carte bancaire · Vous gardez la validation finale</p><div className="mt-7 flex flex-wrap gap-3"><Link to="/signup" onClick={() => trackCta('signup', '/signup')} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 font-bold text-white transition hover:bg-teal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300">Tester Kompilot pendant 7 jours <ArrowRight size={16} /></Link><Link to="/demo" onClick={() => trackCta('demo', '/demo')} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-5 py-3 font-bold text-slate-100 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300">Explorer la démonstration</Link></div><div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-sm"><Link to="/features" className="text-teal-300 underline-offset-4 hover:underline">Voir les fonctionnalités</Link><Link to="/secteurs/agences" className="text-teal-300 underline-offset-4 hover:underline">Solutions pour agences</Link><Link to="/secteurs/immobilier" className="text-teal-300 underline-offset-4 hover:underline">Solutions sectorielles</Link></div></div></section>
        </main>
        <LandingFooter />
      </div>
    </>
  );
}
