import { ArrowRight, BrainCircuit, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useEffect } from 'react';
import { LandingFooter } from '../components/landing/LandingFooter';
import { KompilotLogo } from '../components/brand/KompilotLogo';
import { setPageSeo } from '../lib/seo';

const PRINCIPLES = [
  {
    icon: BrainCircuit,
    title: 'Une IA qui assiste, pas qui décide',
    text: 'Kompilot prépare des idées, des réponses et des plans d’action. Vous gardez la validation finale avant toute publication.',
  },
  {
    icon: ShieldCheck,
    title: 'La confiance avant la croissance',
    text: 'Les données, les accès connectés et les préférences de consentement restent visibles et contrôlables depuis votre espace.',
  },
  {
    icon: CheckCircle2,
    title: 'Des actions simples à mesurer',
    text: 'Le cockpit rassemble vos signaux importants pour transformer une présence locale dispersée en décisions concrètes.',
  },
];

export default function AboutPage() {
  useEffect(() => {
    setPageSeo({
      title: 'À propos de Kompilot | Marketing local assisté par IA',
      description: 'Découvrez la mission de Kompilot : aider les commerces et agences à piloter leur présence locale avec une IA contrôlable.',
      path: '/a-propos',
    });
  }, []);

  return (
    <div className="min-h-screen bg-[hsl(var(--landing-bg))] text-[hsl(var(--landing-body))]">
      <header className="border-b border-white/[0.07] bg-[rgba(11,17,32,.92)]">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-6">
          <Link to="/" aria-label="Kompilot, revenir à l’accueil">
            <KompilotLogo variant="full" height={42} textColor="#F1F5F9" />
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition-colors hover:text-slate-100">
            Retour à l’accueil <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <main id="main-content">
        <section className="mx-auto max-w-5xl px-6 pb-16 pt-20 md:pb-24 md:pt-28">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-teal-300">À propos de Kompilot</p>
          <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-[-0.04em] text-slate-100 md:text-6xl">
            Rendre la présence locale plus claire, plus humaine et plus actionnable.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-slate-400">
            Kompilot aide les commerçants, indépendants et agences à réunir leurs publications, avis, messages et indicateurs dans un seul cockpit marketing.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/signup" className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-slate-100 no-underline transition hover:bg-teal-500 hover:shadow-[0_8px_24px_rgba(13,148,136,.28)]">
              Découvrir Kompilot <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <Link to="/faq" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-slate-300 no-underline transition hover:border-white/30 hover:text-slate-100">
              Consulter la FAQ
            </Link>
          </div>
        </section>

        <section className="border-y border-white/[0.07] bg-white/[0.025]" aria-labelledby="mission-title">
          <div className="mx-auto grid max-w-5xl gap-10 px-6 py-16 md:grid-cols-[.8fr_1.2fr] md:py-20">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">Notre mission</p>
              <h2 id="mission-title" className="mt-3 text-3xl font-bold tracking-tight text-slate-100">Moins d’outils ouverts. Plus de décisions utiles.</h2>
            </div>
            <div className="space-y-5 text-base leading-relaxed text-slate-400">
              <p>Une petite entreprise n’a pas besoin d’un empilement de tableaux de bord pour être visible. Elle a besoin de savoir quoi publier, à quel client répondre et quelle action mérite son temps aujourd’hui.</p>
              <p>Kompilot est conçu en France avec cette contrainte au centre : une interface lisible, des suggestions explicables et des automatisations qui restent sous contrôle. La plateforme accompagne les équipes sans remplacer leur connaissance du terrain.</p>
              <p>Notre approche évolue avec les retours des professionnels qui utilisent le produit. Nous privilégions les flux qui font gagner du temps, la mesure compréhensible et la conformité plutôt que les promesses impossibles à vérifier.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-16 md:py-20" aria-labelledby="principles-title">
          <div className="mb-9 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">Nos principes</p>
            <h2 id="principles-title" className="mt-3 text-3xl font-bold tracking-tight text-slate-100">Une base saine pour une croissance durable.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {PRINCIPLES.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-2xl border border-white/[0.09] bg-white/[0.04] p-6 transition hover:-translate-y-1 hover:border-teal-400/40">
                <Icon className="h-6 w-6 text-teal-300" aria-hidden="true" />
                <h3 className="mt-5 text-lg font-bold text-slate-100">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-20" aria-labelledby="editorial-title">
          <div className="rounded-3xl border border-teal-400/20 bg-teal-400/[0.07] p-7 md:p-10">
            <div className="flex items-start gap-4">
              <Sparkles className="mt-1 h-6 w-6 shrink-0 text-teal-300" aria-hidden="true" />
              <div>
                <h2 id="editorial-title" className="text-2xl font-bold text-slate-100">Une équipe produit, un engagement de transparence.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">Les contenus et recommandations de Kompilot sont préparés pour vous aider à décider. Vérifiez toujours les informations importantes avant publication et consultez nos ressources de confidentialité pour comprendre vos droits.</p>
                <Link to="/confidentialite" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-teal-300 no-underline hover:text-teal-200">Voir notre approche RGPD <ArrowRight size={14} aria-hidden="true" /></Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
