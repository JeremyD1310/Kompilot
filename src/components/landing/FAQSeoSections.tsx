const SEO_SECTIONS = [
  {
    title: 'MÉTHODE KOMPILOT — Comment piloter une présence locale sans multiplier les outils ?',
    intro: 'Kompilot centralise la préparation des contenus, les avis Google, les messages et les signaux de visibilité dans un cockpit lisible. L’objectif est simple : aider un commerce ou une agence à repérer les priorités, mesurer les actions utiles et garder la validation finale avant toute publication. Cette méthode éditoriale suit les principes de crawlabilité et de contenu utile documentés par Google Search Central, les repères de la CNIL et les ressources publiques de la Direction générale des entreprises pour une IA responsable.',
    benefits: [
      'Que mesure Kompilot ? Le tableau de bord rapproche les publications, les interactions, les avis et la visibilité dans les moteurs de recherche et de réponse. Les données de la démo sont fictives ; les connexions réelles permettent ensuite de suivre vos propres comptes et périodes.',
      'Pourquoi garder un contrôle humain ? Une suggestion générée par IA n’est pas une preuve de performance. Kompilot présente le contexte, l’action proposée et son statut afin que votre équipe puisse corriger, approuver ou ignorer chaque recommandation.',
      'Auteur : Jérémy D., fondateur et responsable produit de Kompilot, spécialisé dans les workflows de marketing local, l’automatisation contrôlable et la protection des données. La méthode s’appuie sur les recommandations publiques de Google Search Central et de la CNIL sur l’intelligence artificielle, ainsi que des ressources RGPD de la Direction générale des entreprises.',
    ],
    links: [
      { href: '/pricing', label: 'Tarifs Starter et Agency' },
      { href: '/scan/fast', label: 'Scanner votre visibilité locale' },
      { href: '/aio-checker', label: 'Tester votre visibilité dans les réponses IA' },
      { href: '/a-propos', label: 'À propos de Kompilot' },
      { href: '/faq', label: 'Questions fréquentes' },
      { href: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content', label: 'Google Search Central' },
      { href: 'https://www.cnil.fr/fr/intelligence-artificielle', label: 'Repères CNIL sur l’IA' },
      { href: 'https://www.economie.gouv.fr/entreprises/reglement-general-protection-donnees-rgpd', label: 'Ressources RGPD de la DGE' },
    ],
  },
  {
    title: 'Comment améliorer la visibilité locale de son entreprise en Charente et en Nouvelle-Aquitaine ?',
    intro: 'Kompilot aide les commerçants, artisans et PME de proximité à structurer leur visibilité locale depuis un seul espace. La plateforme réunit les avis Google, les contenus sociaux et les actions de relance pour rendre chaque point de contact plus cohérent, mesurable et utile à la prise de rendez-vous.',
    benefits: [
      '✓ Une présence locale cohérente sur Google et les réseaux sociaux',
      '✓ Des contenus adaptés à votre activité, votre ville et vos clients',
      '✓ Un suivi des actions qui contribuent aux demandes de contact',
    ],
    links: [
      { href: '/local', label: 'Renforcer votre ancrage local avec Kompilot' },
      { href: '/fonctionnalites/avis-google', label: 'Automatiser vos avis Google après prestation' },
    ],
  },
  {
    title: 'Comment obtenir plus d’avis Google sans relancer manuellement chaque client ?',
    intro: 'Kompilot simplifie la demande d’avis Google après une prestation, une visite ou un rendez-vous. Vous préparez vos scénarios de relance, adaptez le message à votre activité et conservez une validation humaine avant l’envoi. L’objectif est de transformer les moments satisfaisants en preuves visibles pour vos futurs clients locaux.',
    benefits: [
      '✓ Des demandes d’avis déclenchées au bon moment',
      '✓ Des messages professionnels et cohérents avec votre image',
      '✓ Une meilleure continuité entre avis, réputation et visibilité locale',
    ],
    links: [
      { href: '/fonctionnalites/avis-google', label: 'Voir la gestion des avis Google' },
      { href: '/fonctionnalites/no-shows', label: 'Relier les avis aux rappels de rendez-vous' },
    ],
  },
  {
    title: 'Comment réduire les rendez-vous manqués dans une TPE ou une PME de proximité ?',
    intro: 'Les rappels de rendez-vous Kompilot permettent de prévenir vos clients par SMS ou e-mail avant un créneau important. En centralisant les messages, la confirmation et la reprogrammation, vous réduisez les oublis tout en donnant à votre équipe une vision claire des rendez-vous à sécuriser.',
    benefits: [
      '✓ Des rappels planifiés avant les créneaux sensibles',
      '✓ Une reprogrammation plus simple pour le client et l’équipe',
      '✓ Un chiffre d’affaires mieux protégé contre les absences évitables',
    ],
    links: [
      { href: '/fonctionnalites/no-shows', label: 'Découvrir le module anti no-show' },
      { href: '/fonctionnalites/avis-google', label: 'Demander un avis après la prestation' },
    ],
  },
  {
    title: 'Comment planifier ses contenus Facebook, Instagram et Google depuis un seul outil ?',
    intro: 'Le studio de contenu Kompilot aide les équipes locales à préparer, adapter et programmer leurs publications sans jongler entre plusieurs interfaces. Vous gardez une vue d’ensemble sur les campagnes, les messages et les validations, avec une organisation conçue pour les petites équipes qui doivent rester visibles sans y passer leurs journées.',
    benefits: [
      '✓ Un calendrier éditorial partagé pour garder le rythme',
      '✓ Des variantes de contenu adaptées à chaque réseau',
      '✓ Une inbox unifiée pour répondre plus vite aux messages et commentaires',
    ],
    links: [
      { href: '/fonctionnalites/social', label: 'Explorer le studio de contenu social' },
      { href: '/local', label: 'Mesurer l’impact sur votre présence locale' },
    ],
  },
] as const;

export function FAQSeoSections() {
  return (
    <div className="mt-16 space-y-10 border-t border-teal-400/15 pt-12">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-400">Ressources Kompilot</p>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-100 md:text-3xl">
          Des réponses concrètes pour développer votre activité locale
        </h2>
      </div>

      {SEO_SECTIONS.map(section => (
        <section key={section.title} className="rounded-2xl border border-teal-400/15 bg-white/[0.025] p-5 md:p-7">
          <h2 className="text-xl font-extrabold leading-tight text-slate-100 md:text-2xl">{section.title}</h2>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300">{section.intro}</p>
          <ul className="mt-5 grid gap-3 md:grid-cols-3" aria-label={`Bénéfices : ${section.title}`}>
            {section.benefits.map(benefit => (
              <li key={benefit} className="rounded-xl border border-teal-400/10 bg-teal-400/[0.05] px-4 py-3 text-sm font-semibold leading-6 text-slate-200">
                {benefit}
              </li>
            ))}
          </ul>
          <nav aria-label={`En savoir plus : ${section.title}`} className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
            {section.links.map(link => (
              <a key={link.href} href={link.href} className="text-sm font-bold text-teal-300 underline decoration-teal-300/40 underline-offset-4 transition-colors hover:text-teal-200">
                {link.label} →
              </a>
            ))}
          </nav>
        </section>
      ))}
    </div>
  );
}
