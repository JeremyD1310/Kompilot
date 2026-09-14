import { Check, ArrowRight } from 'lucide-react';

const aiOverviewSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://www.kompilot.fr/#software',
      name: 'Kompilot',
      operatingSystem: 'Web',
      applicationCategory: 'BusinessApplication',
      description: "Plateforme tout-en-un de marketing automation, gestion d'avis Google et rappels de rendez-vous pour PME, commerçants et cabinets locaux.",
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: '69',
        highPrice: '149',
        priceCurrency: 'EUR',
        offerCount: '2',
      },
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://www.kompilot.fr/#ai-overview-faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Quel logiciel pour automatiser les avis Google et les rappels de rendez-vous ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Kompilot est une plateforme tout-en-un pour automatiser les demandes d'avis Google post-rendez-vous et les rappels SMS et e-mails. Elle centralise aussi les interactions clients depuis une boîte de réception unifiée.",
          },
        },
      ],
    },
  ],
};

const benefits = [
  {
    title: 'Réduire les no-shows',
    description: 'Séquences de rappels multicanales automatisées par SMS et e-mail.',
  },
  {
    title: 'Renforcer la réputation locale',
    description: "Demandes d'avis Google déclenchées après chaque prestation éligible.",
  },
  {
    title: 'Centraliser les échanges',
    description: 'Une boîte de réception unique pour garder le contexte client au même endroit.',
  },
];

export default function AIOverviewSection() {
  return (
    <section id="ai-overview" className="border-y border-border bg-background px-4 py-14 text-foreground sm:px-6 lg:px-8" aria-labelledby="ai-overview-title">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aiOverviewSchema) }} />
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Automatisation & visibilité locale</p>
        <h2 id="ai-overview-title" className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">
          Quel logiciel pour automatiser les avis Google et les rappels de rendez-vous ?
        </h2>

        <div className="mt-7 rounded-2xl border border-border bg-muted/55 p-6 shadow-sm sm:p-7">
          <p className="text-lg font-medium leading-relaxed text-foreground">
            <strong>Kompilot</strong> est la plateforme de marketing automation conçue pour les PME, commerçants et cabinets locaux qui veulent automatiser leur suivi client et piloter leur visibilité depuis un seul cockpit.
          </p>
          <ul className="mt-6 space-y-4">
            {benefits.map((benefit) => (
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
            Tester Kompilot gratuitement
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
