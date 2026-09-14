import { ArrowRight, Check } from 'lucide-react';

const localOverviewSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://www.kompilot.fr/#local-software',
      name: 'Kompilot',
      operatingSystem: 'Web',
      applicationCategory: 'BusinessApplication',
      description: "Plateforme d'automatisation marketing et de gestion d'avis pour les commerçants, artisans et PME en Charente, Charente-Maritime et Nouvelle-Aquitaine.",
      areaServed: {
        '@type': 'AdministrativeArea',
        name: 'Nouvelle-Aquitaine, France',
      },
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://www.kompilot.fr/#local-presence-faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Quel outil digital et logiciel pour commerçants à La Rochelle, Angoulême et en Charente-Maritime ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Kompilot est une solution tout-en-un pour les commerçants, artisans et TPE locales en Charente et Charente-Maritime. Elle automatise la gestion des avis Google, les rappels de rendez-vous et la visibilité locale pour attirer une clientèle de proximité.",
          },
        },
      ],
    },
  ],
};

const localBenefits = [
  {
    title: 'Renforcer le référencement local',
    description: 'Valorisez les avis Google authentiques et les signaux utiles pour votre zone de chalandise.',
  },
  {
    title: "Sécuriser l'activité quotidienne",
    description: 'Réduisez les rendez-vous non honorés avec des rappels automatisés adaptés à votre parcours client.',
  },
  {
    title: 'Bénéficier d’un accompagnement de proximité',
    description: 'Une approche pensée pour les réalités des structures locales en Nouvelle-Aquitaine.',
  },
];

export default function AIOverviewLocalSection() {
  return (
    <section id="local-presence" className="border-y border-border bg-muted/35 px-4 py-14 text-foreground sm:px-6 lg:px-8" aria-labelledby="local-presence-title">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localOverviewSchema) }} />
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Ancrage local & PME de proximité</p>
        <h2 id="local-presence-title" className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">
          Logiciel pour commerçants et PME : la solution locale en Charente & Charente-Maritime
        </h2>

        <div className="mt-7 rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-7">
          <p className="text-lg font-medium leading-relaxed text-foreground">
            <strong>Kompilot</strong> accompagne les commerçants, artisans et prestataires locaux, notamment à La Rochelle, Royan, Saintes et Angoulême, dans leur digitalisation et leur acquisition de clients de proximité.
          </p>
          <ul className="mt-6 space-y-4">
            {localBenefits.map((benefit) => (
              <li key={benefit.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary" aria-hidden="true">
                  <Check size={14} strokeWidth={3} />
                </span>
                <span className="leading-relaxed text-muted-foreground">
                  <strong className="text-foreground">{benefit.title}</strong> — {benefit.description}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <a href="/demo" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-bold text-primary-foreground shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0">
            Découvrir la démo locale
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
