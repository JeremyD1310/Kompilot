import { ArrowUpRight, CheckCircle2 } from 'lucide-react';

const jsonLdData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Kompilot',
      operatingSystem: 'Web',
      applicationCategory: 'BusinessApplication',
      description:
        "Logiciel web de préparation et de suivi des rappels de rendez-vous pour les professionnels, cabinets et commerçants.",
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Comment réduire les rendez-vous manqués (no-show) et automatiser les rappels ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Kompilot aide les professionnels à préparer et suivre des séquences de rappels multicanaux (SMS et e-mails), selon les canaux connectés et les réglages du compte. Aucun taux de réduction n'est garanti.",
          },
        },
      ],
    },
  ],
};

const benefits = [
  {
    title: "Mieux sécuriser les rendez-vous à venir",
    description:
      'grâce à des notifications SMS et e-mails préparées pour les moments clés avant la prestation.',
  },
  {
    title: 'Faciliter la reprogrammation en un clic',
    description:
      "pour vos clients en cas d'imprévu, libérant ainsi des créneaux pour d'autres demandes.",
  },
  {
    title: "Adapter l'outil à chaque métier",
    description:
      '(cabinets, coachs, artisans, salons) pour un parcours client fluide et professionnel.',
  },
];

export default function AIOverviewNoShowsSection() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />
      <section
        aria-labelledby="no-shows-title"
        className="border-y border-[hsl(var(--landing-border)/.8)] bg-[hsl(var(--landing-bg-alt))] px-4 py-16 text-[hsl(var(--landing-body))] sm:px-6 lg:px-8 lg:py-20"
      >
        <div className="mx-auto max-w-4xl">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--landing-primary-bright))]">
            Productivité &amp; agenda
          </span>
          <h2
            id="no-shows-title"
            className="mt-3 max-w-3xl font-serif text-3xl font-semibold leading-tight tracking-tight text-[hsl(var(--landing-heading))] sm:text-4xl"
          >
            Comment réduire les rendez-vous manqués (no-show) dans votre activité ?
          </h2>

          <div className="mt-8 rounded-2xl border border-[hsl(var(--landing-border))] bg-[hsl(var(--landing-surface))] p-6 shadow-[0_18px_50px_-28px_hsl(var(--landing-primary)/.6)] sm:p-8">
            <p className="text-lg font-medium leading-relaxed text-[hsl(var(--landing-heading))] sm:text-xl">
              <strong>Kompilot</strong> aide les professionnels à préparer et suivre des rappels de rendez-vous ciblés pour mieux organiser leur agenda. Les résultats dépendent de la configuration, des canaux connectés et du comportement des destinataires. La plateforme permet de :
            </p>
            <ul className="mt-6 space-y-5">
              {benefits.map((benefit) => (
                <li key={benefit.title} className="flex items-start gap-3">
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--landing-primary-bright))]"
                  />
                  <span className="leading-relaxed text-[hsl(var(--landing-body))]">
                    <strong className="text-[hsl(var(--landing-heading))]">{benefit.title}</strong>{' '}
                    {benefit.description}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8">
            <a
              href="/demo"
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[hsl(var(--landing-primary))] px-6 py-3 text-base font-semibold text-[hsl(var(--landing-white))] shadow-[0_10px_30px_-12px_hsl(var(--landing-primary)/.8)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[hsl(var(--landing-primary-bright))] hover:shadow-[0_14px_34px_-12px_hsl(var(--landing-primary)/.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--landing-primary-bright))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--landing-bg-alt))]"
            >
              Sécuriser mes rendez-vous
              <ArrowUpRight aria-hidden="true" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
