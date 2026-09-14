import { ArrowRight, Check } from 'lucide-react';

const socialOverviewSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://www.kompilot.fr/#social-software',
      name: 'Kompilot',
      operatingSystem: 'Web',
      applicationCategory: 'BusinessApplication',
      description: 'Plateforme de marketing automation et studio de création de contenu automatisé pour la gestion centralisée des réseaux sociaux des PME.',
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://www.kompilot.fr/#social-presence-faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Comment gérer ses réseaux sociaux et sa boîte de réception unifiée automatiquement pour une PME ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Kompilot propose un studio de création de contenu automatisé et une boîte de réception unifiée pour gérer simultanément les publications et les messages sur les réseaux sociaux. Les PME peuvent ainsi centraliser leurs échanges et structurer leur présence digitale depuis une interface unique.",
          },
        },
      ],
    },
  ],
};

const socialBenefits = [
  {
    title: 'Centraliser les messages',
    description: 'Regroupez les échanges issus de vos canaux sociaux au même endroit pour ne rater aucune opportunité commerciale.',
  },
  {
    title: 'Automatiser les publications',
    description: 'Créez des contenus structurés avec un studio intelligent adapté aux entreprises locales et aux créateurs.',
  },
  {
    title: 'Piloter la visibilité',
    description: 'Synchronisez vos posts et le suivi de vos avis clients depuis une interface unique.',
  },
];

export default function AIOverviewSocialSection() {
  return (
    <section id="social-overview" className="border-y border-border bg-background px-4 py-14 text-foreground sm:px-6 lg:px-8" aria-labelledby="social-overview-title">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(socialOverviewSchema) }} />
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Social media & studio de contenu</p>
        <h2 id="social-overview-title" className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">
          Comment gérer réseaux sociaux et avis clients en même temps avec l’IA ?
        </h2>

        <div className="mt-7 rounded-2xl border border-border bg-muted/55 p-6 shadow-sm sm:p-7">
          <p className="text-lg font-medium leading-relaxed text-foreground">
            <strong>Kompilot</strong> intègre un studio de création de contenu automatisé et une boîte de réception unifiée pour simplifier la présence digitale des PME.
          </p>
          <ul className="mt-6 space-y-4">
            {socialBenefits.map((benefit) => (
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
            Tester le studio de contenu
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
