import { useEffect } from 'react';
import { ArrowRight, CalendarCheck, MapPinned, Star } from 'lucide-react';

export type InternalFeatureKind = 'reviews' | 'no-shows' | 'social' | 'local';

type FeatureContent = {
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  icon: typeof Star;
};

const featurePaths: Record<InternalFeatureKind, string> = {
  reviews: '/fonctionnalites/avis-google',
  'no-shows': '/fonctionnalites/no-shows',
  social: '/fonctionnalites/social',
  local: '/local',
};

const featureLinks: Record<InternalFeatureKind, string> = {
  reviews: 'Automatiser les avis Google après chaque prestation',
  'no-shows': 'Réduire les rendez-vous manqués avec des rappels automatiques',
  social: 'Gérer les réseaux sociaux et la boîte de réception unifiée',
  local: 'Développer son ancrage local en Charente et Nouvelle-Aquitaine',
};

const featureContent: Record<InternalFeatureKind, FeatureContent> = {
  reviews: {
    eyebrow: 'Avis Google & visibilité locale',
    title: 'Automatisez vos avis Google après chaque prestation',
    description:
      'Kompilot aide les commerçants, artisans et cabinets à demander des avis authentiques au bon moment, sans ajouter de tâche à leur quotidien.',
    points: [
      'Déclenchez des demandes d’avis après un rendez-vous ou un achat.',
      'Suivez les réponses et les signaux importants depuis un cockpit unique.',
      'Renforcez votre présence locale avec un parcours client plus régulier.',
    ],
    icon: Star,
  },
  'no-shows': {
    eyebrow: 'Productivité & agenda',
    title: 'Réduisez les rendez-vous manqués sans relancer vos clients à la main',
    description:
      'Kompilot automatise les rappels SMS et e-mails pour sécuriser vos créneaux, faciliter la reprogrammation et protéger votre chiffre d’affaires.',
    points: [
      'Programmez des rappels adaptés à chaque type de prestation.',
      'Donnez à vos clients un moyen simple de confirmer ou reprogrammer.',
      'Visualisez les créneaux sécurisés et les revenus préservés.',
    ],
    icon: CalendarCheck,
  },
  social: {
    eyebrow: 'Réseaux sociaux & inbox unifiée',
    title: 'Pilotez vos réseaux sociaux et vos échanges depuis un seul cockpit',
    description:
      'Kompilot réunit la création de contenus, la programmation des publications et les messages sociaux pour aider les PME à rester visibles et réactives.',
    points: [
      'Centralisez les messages et commentaires de vos canaux sociaux.',
      'Préparez des publications adaptées à chaque plateforme.',
      'Gardez une vue claire sur les actions qui soutiennent votre visibilité.',
    ],
    icon: Star,
  },
  local: {
    eyebrow: 'Ancrage local en Nouvelle-Aquitaine',
    title: 'Une solution locale pour les commerces et PME de Charente',
    description:
      'Kompilot réunit visibilité locale, avis Google, contenus et rappels dans une interface pensée pour les entreprises de proximité.',
    points: [
      'Valorisez votre activité à Angoulême, La Rochelle, Saintes et alentours.',
      'Centralisez les actions qui font progresser votre présence digitale.',
      'Avancez avec des outils simples, concrets et adaptés aux équipes locales.',
    ],
    icon: MapPinned,
  },
};

export default function InternalFeaturePage({ kind }: { kind: InternalFeatureKind }) {
  const content = featureContent[kind];
  const Icon = content.icon;

  useEffect(() => {
    document.title = `${content.title} | Kompilot`;
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute('content', content.description);
  }, [content]);

  return (
    <main className="min-h-screen bg-[hsl(var(--landing-bg))] px-4 py-8 text-[hsl(var(--landing-body))] sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col justify-between gap-16">
        <a href="/" className="w-fit text-sm font-semibold tracking-tight text-[hsl(var(--landing-heading))] transition-colors hover:text-[hsl(var(--landing-primary-bright))]">
          Kompilot
        </a>

        <section className="max-w-3xl" aria-labelledby="feature-title">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-[hsl(var(--landing-primary)/.4)] bg-[hsl(var(--landing-primary)/.14)] text-[hsl(var(--landing-primary-bright))]">
            <Icon aria-hidden="true" className="h-6 w-6" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--landing-primary-bright))]">{content.eyebrow}</p>
          <h1 id="feature-title" className="mt-4 max-w-3xl font-serif text-4xl font-semibold leading-tight tracking-tight text-[hsl(var(--landing-heading))] sm:text-6xl">
            {content.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[hsl(var(--landing-body))]">{content.description}</p>

          <ul className="mt-8 space-y-4">
            {content.points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm leading-relaxed text-[hsl(var(--landing-body))]">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--landing-primary-bright))]" />
                {point}
              </li>
            ))}
          </ul>

          <a href="/demo" className="mt-10 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[hsl(var(--landing-primary))] px-6 py-3 text-sm font-bold text-[hsl(var(--landing-white))] shadow-[0_12px_32px_-14px_hsl(var(--landing-primary)/.9)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[hsl(var(--landing-primary-bright))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--landing-primary-bright))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--landing-bg))]">
            Découvrir la démo
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </a>

          <nav aria-label="Explorer les autres solutions Kompilot" className="mt-12 border-t border-[hsl(var(--landing-border))] pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--landing-muted))]">Poursuivre votre parcours</p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm">
              <a href="/" className="text-[hsl(var(--landing-primary-bright))] underline-offset-4 transition-colors hover:text-[hsl(var(--landing-heading))] hover:underline">
                Revenir à l’accueil de Kompilot
              </a>
              {Object.entries(featureLinks)
                .filter(([key]) => key !== kind)
                .map(([key, label]) => (
                  <a key={key} href={featurePaths[key as InternalFeatureKind]} className="text-[hsl(var(--landing-body))] underline-offset-4 transition-colors hover:text-[hsl(var(--landing-primary-bright))] hover:underline">
                    {label}
                  </a>
                ))}
            </div>
          </nav>
        </section>

        <footer className="border-t border-[hsl(var(--landing-border))] pt-5 text-xs text-[hsl(var(--landing-muted))]">
          La présence digitale locale, pilotée depuis un seul cockpit.
        </footer>
      </div>
    </main>
  );
}
