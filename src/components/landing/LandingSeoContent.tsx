import { ExternalLink } from 'lucide-react';

export function LandingSeoContent() {
  return (
    <section
      aria-labelledby="method-title"
      className="border-t border-white/[0.07] bg-[#0B1120] px-6 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-[920px]">
        <div className="grid gap-10 lg:grid-cols-[1fr_280px] lg:items-start">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-teal-300">Méthode Kompilot</p>
            <h2 id="method-title" className="text-2xl font-black tracking-tight text-slate-100 sm:text-3xl">
              Comment piloter une présence locale sans multiplier les outils&nbsp;?
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-400 sm:text-base">
              Kompilot centralise la préparation des contenus, les avis Google, les messages et les signaux de visibilité dans un cockpit lisible. L’objectif est simple&nbsp;: aider un commerce ou une agence à repérer les priorités, mesurer les actions utiles et garder la validation finale avant toute publication.
            </p>
            <p className="mt-3 text-xs leading-6 text-slate-500">
              Cette méthode éditoriale suit les principes de crawlabilité et de contenu utile documentés par <a className="text-teal-300 underline underline-offset-4" href="https://developers.google.com/search/docs/fundamentals/creating-helpful-content" target="_blank" rel="noopener noreferrer">Google Search Central</a>, les repères de la <a className="text-teal-300 underline underline-offset-4" href="https://www.cnil.fr/fr/intelligence-artificielle" target="_blank" rel="noopener noreferrer">CNIL</a> et les ressources publiques de la <a className="text-teal-300 underline underline-offset-4" href="https://www.economie.gouv.fr/entreprises/reglement-general-protection-donnees-rgpd" target="_blank" rel="noopener noreferrer">Direction générale des entreprises</a> pour une IA responsable.
            </p>

            <div className="mt-8 grid gap-7 sm:grid-cols-2">
              <article>
                <h3 className="text-base font-bold text-slate-200">Que mesure Kompilot&nbsp;?</h3>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  Le tableau de bord rapproche les publications, les interactions, les avis et la visibilité dans les moteurs de recherche et de réponse. Les données de la démo sont fictives&nbsp;; les connexions réelles permettent ensuite de suivre vos propres comptes et périodes.
                </p>
              </article>
              <article>
                <h3 className="text-base font-bold text-slate-200">Pourquoi garder un contrôle humain&nbsp;?</h3>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  Une suggestion générée par IA n’est pas une preuve de performance. Kompilot présente le contexte, l’action proposée et son statut afin que votre équipe puisse corriger, approuver ou ignorer chaque recommandation.
                </p>
              </article>
            </div>

            <div className="mt-8 rounded-2xl border border-teal-300/15 bg-teal-300/[0.06] p-5">
              <p className="text-sm leading-7 text-slate-300">
                <strong className="font-bold text-teal-200">Auteur&nbsp;:</strong> Jérémy D., fondateur et responsable produit de Kompilot, spécialisé dans les workflows de marketing local, l’automatisation contrôlable et la protection des données.
              </p>
              <p className="mt-3 text-xs leading-6 text-slate-500">
                La méthode s’appuie sur les recommandations publiques de{' '}
                <a className="font-semibold text-teal-300 underline decoration-teal-300/40 underline-offset-4 hover:text-teal-200" href="https://developers.google.com/search/docs/fundamentals/get-on-google" target="_blank" rel="noopener noreferrer">
                  Google Search Central <ExternalLink className="inline-block" size={11} aria-hidden="true" />
                </a>{' '}
                et de la{' '}
                <a className="font-semibold text-teal-300 underline decoration-teal-300/40 underline-offset-4 hover:text-teal-200" href="https://www.cnil.fr/fr/intelligence-artificielle" target="_blank" rel="noopener noreferrer">
                  CNIL sur l’intelligence artificielle <ExternalLink className="inline-block" size={11} aria-hidden="true" />
                </a>, ainsi que des ressources RGPD de la{' '}
                <a className="font-semibold text-teal-300 underline decoration-teal-300/40 underline-offset-4 hover:text-teal-200" href="https://www.economie.gouv.fr/entreprises/reglement-general-protection-donnees-rgpd" target="_blank" rel="noopener noreferrer">
                  Direction générale des entreprises <ExternalLink className="inline-block" size={11} aria-hidden="true" />
                </a>.
              </p>
            </div>
          </div>

          <aside className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5" aria-label="Ressources Kompilot">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">À explorer</p>
            <nav className="mt-4 flex flex-col gap-3 text-sm" aria-label="Ressources publiques">
              <a className="text-slate-300 no-underline transition-colors hover:text-teal-300" href="/pricing">Tarifs Pro, Multi et Agency</a>
              <a className="text-slate-300 no-underline transition-colors hover:text-teal-300" href="/scan/fast">Scanner votre visibilité locale</a>
              <a className="text-slate-300 no-underline transition-colors hover:text-teal-300" href="/aio-checker">Tester votre visibilité dans les réponses IA</a>
              <a className="text-slate-300 no-underline transition-colors hover:text-teal-300" href="/a-propos">À propos de Kompilot</a>
              <a className="text-slate-300 no-underline transition-colors hover:text-teal-300" href="/faq">Questions fréquentes</a>
            </nav>
          </aside>
        </div>
      </div>
    </section>
  );
}
