import { Link } from '@tanstack/react-router';
import { ArrowLeft, FileText, CreditCard, RefreshCw, AlertTriangle, Shield, Users } from 'lucide-react';

const LAST_UPDATED = 'Juin 2026';

export default function CGVPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={15} />
            Retour
          </Link>
          <span className="font-bold text-primary text-sm">Kompilot</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        {/* Hero */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <FileText size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                Conditions Générales de Vente et d'Utilisation (CGV / CGU)
              </h1>
              <p className="text-xs text-muted-foreground">Dernière mise à jour : {LAST_UPDATED}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/20 px-5 py-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Les présentes Conditions Générales de Vente et d'Utilisation (CGV/CGU) régissent l'accès et l'utilisation
              de l'application <strong className="text-foreground">Kompilot</strong>, éditée par KOMPILOT SAS.
              En créant un compte ou en utilisant nos services, vous acceptez sans réserve les présentes conditions.
            </p>
          </div>
        </div>

        <Section title="1. Définitions" icon={<FileText size={16} />}>
          <div className="space-y-2">
            {[
              { term: 'Service / Application', def: 'L\'application SaaS Kompilot, accessible sur web et mobile, permettant la gestion de la présence en ligne.' },
              { term: 'Utilisateur / Client', def: 'Toute personne physique ou morale ayant créé un compte sur Kompilot.' },
              { term: 'Abonnement', def: 'Accès payant à une formule de service Kompilot (Gratuit, Pro, Business, Agence), renouvelable selon la périodicité choisie.' },
              { term: 'Crédits IA', def: 'Unités de consommation des fonctionnalités d\'Intelligence Artificielle intégrées à l\'application.' },
              { term: 'Établissement', def: 'L\'entreprise ou le commerce du Client pour lequel les services Kompilot sont utilisés.' },
              { term: 'Données d\'Établissement', def: 'L\'ensemble des informations, contenus et paramètres relatifs à l\'établissement du Client saisis dans l\'application.' },
            ].map(d => (
              <div key={d.term} className="flex gap-3 text-sm">
                <span className="font-bold text-foreground shrink-0 min-w-[180px]">« {d.term} »</span>
                <span className="text-muted-foreground">{d.def}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="2. Objet du service" icon={<FileText size={16} />}>
          <p>
            Kompilot est une plateforme SaaS (Software as a Service) de gestion de la présence en ligne pour les professionnels
            et petites entreprises. L'application propose notamment :
          </p>
          <ul>
            <li>Gestion et planification de publications sur les réseaux sociaux</li>
            <li>Centralisation des messages et avis clients dans un Inbox Unique</li>
            <li>Génération de contenu marketing assistée par Intelligence Artificielle (OpenAI GPT-4)</li>
            <li>Monitoring de la visibilité locale et des avis Google</li>
            <li>Outils de croissance, de référencement local et d'optimisation G.E.O.</li>
            <li>Tableaux de bord analytiques et rapports de performance</li>
          </ul>
        </Section>

        <Section title="3. Inscription et création de compte" icon={<Users size={16} />}>
          <p>
            L'inscription est ouverte à toute personne physique majeure (18 ans révolus) ou morale disposant d'un numéro SIRET valide.
            L'utilisateur s'engage à fournir des informations exactes, complètes et à jour lors de son inscription.
          </p>
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/40 px-4 py-3">
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">⚠️ Responsabilité de l'utilisateur</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              L'utilisateur est seul responsable de la confidentialité de ses identifiants de connexion. Toute utilisation
              du Service sous son compte est présumée faite par lui. En cas de suspicion d'utilisation frauduleuse,
              l'utilisateur doit immédiatement en informer Kompilot à support@kompilot.app.
            </p>
          </div>
          <p>
            Kompilot se réserve le droit de refuser ou de suspendre un compte en cas de violation des présentes CGU,
            de comportement abusif ou de tentative de fraude.
          </p>
        </Section>

        <Section title="4. Offres et tarification" icon={<CreditCard size={16} />}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse my-2">
              <thead>
                <tr className="bg-primary/10">
                  <th className="text-left p-2 border border-border font-bold text-foreground">Formule</th>
                  <th className="text-left p-2 border border-border font-bold text-foreground">Prix mensuel</th>
                  <th className="text-left p-2 border border-border font-bold text-foreground">Prix annuel</th>
                  <th className="text-left p-2 border border-border font-bold text-foreground">Caractéristiques principales</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { plan: 'Gratuit', monthly: '0 €', yearly: '0 €', features: '1 réseau, 5 publications/mois, 50 crédits IA' },
                  { plan: 'Pro', monthly: '49 €', yearly: '39 €/mois', features: '3 réseaux, publications illimitées, 200 crédits IA' },
                  { plan: 'Business', monthly: '99 €', yearly: '79 €/mois', features: '10 réseaux, publications illimitées, 500 crédits IA' },
                  { plan: 'Agence', monthly: 'Sur devis', yearly: 'Sur devis', features: 'Multi-établissements, marque blanche, crédits illimités' },
                ].map(p => (
                  <tr key={p.plan} className="hover:bg-muted/10">
                    <td className="p-2 border border-border font-semibold text-foreground">{p.plan}</td>
                    <td className="p-2 border border-border text-muted-foreground">{p.monthly}</td>
                    <td className="p-2 border border-border text-muted-foreground">{p.yearly}</td>
                    <td className="p-2 border border-border text-muted-foreground">{p.features}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Tous les prix sont indiqués HT. TVA applicable selon la législation en vigueur. Les prix peuvent être modifiés
            avec un préavis de 30 jours par email.
          </p>
        </Section>

        <Section title="5. Modalités de paiement" icon={<CreditCard size={16} />}>
          <p>
            Les paiements sont traités exclusivement via <strong>Stripe</strong>, prestataire de paiement certifié
            PCI DSS niveau 1. Kompilot n'a à aucun moment accès à vos données bancaires complètes.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
            {[
              { mode: 'Carte bancaire', detail: 'Visa, Mastercard, American Express — prélèvement automatique mensuel ou annuel' },
              { mode: 'SEPA', detail: 'Prélèvement SEPA disponible pour les abonnements Business et Agence' },
            ].map(m => (
              <div key={m.mode} className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs font-bold text-foreground mb-1">{m.mode}</p>
                <p className="text-xs text-muted-foreground">{m.detail}</p>
              </div>
            ))}
          </div>
          <p>
            En cas de rejet de paiement, Kompilot envoie un email de notification. Si le paiement n'est pas régularisé
            sous 7 jours, l'accès aux fonctionnalités premium est suspendu. Le compte reste accessible en mode Gratuit.
          </p>
        </Section>

        <Section title="6. Droit de rétractation et remboursements" icon={<RefreshCw size={16} />}>
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 mb-3">
            <p className="text-xs font-bold text-primary mb-1">14 jours — Droit de rétractation légal</p>
            <p className="text-xs text-foreground leading-relaxed">
              Conformément à l'article L221-18 du Code de la consommation, tout consommateur dispose d'un droit de
              rétractation de <strong>14 jours</strong> à compter de la souscription d'un abonnement payant, sans
              avoir à justifier de motif ni à payer de pénalités.
            </p>
          </div>
          <p>
            Pour exercer votre droit de rétractation, contactez-nous à <span className="text-primary font-medium">support@kompilot.app</span>{' '}
            avec l'objet « Rétractation ». Le remboursement est effectué dans un délai de 14 jours après réception de votre demande.
          </p>
          <p>
            <strong>Politique de remboursement proratisé :</strong> En cas de résiliation en cours de période, aucun remboursement
            prorata temporis n'est appliqué, sauf exercice du droit de rétractation dans les 14 jours ou circonstances exceptionnelles
            appréciées par Kompilot.
          </p>
          <p>
            <strong>Crédits IA :</strong> Les crédits IA utilisés ne sont pas remboursables. Les crédits non utilisés
            à l'expiration d'une période ne sont pas reportés sur la période suivante, sauf pour les abonnements Business et Agence.
          </p>
        </Section>

        <Section title="7. Utilisation acceptable du service" icon={<Shield size={16} />}>
          <p>L'utilisateur s'engage à utiliser Kompilot de manière licite et à ne pas :</p>
          <ul>
            <li>Publier du contenu illégal, diffamatoire, haineux, pornographique ou portant atteinte aux droits de tiers</li>
            <li>Utiliser les fonctionnalités IA pour générer du contenu trompeur ou des faux avis</li>
            <li>Tenter d'accéder aux données d'autres utilisateurs ou de compromettre la sécurité de la plateforme</li>
            <li>Revendre, louer ou transférer l'accès à son compte Kompilot à des tiers non autorisés</li>
            <li>Utiliser des robots ou scripts automatisés pour exploiter abusivement les ressources de la plateforme</li>
            <li>Violer les Conditions d'Utilisation des réseaux sociaux connectés (Meta, Google, etc.)</li>
          </ul>
          <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/40 px-4 py-3">
            <p className="text-xs font-bold text-red-800 dark:text-red-300 mb-1">⚠️ Sanctions</p>
            <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
              Tout manquement aux présentes CGU peut entraîner la suspension immédiate du compte, sans préavis ni remboursement,
              et le cas échéant des poursuites judiciaires.
            </p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900/40 px-4 py-3 mt-3">
            <p className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-1">✍️ Responsabilité éditoriale — Contenus IA</p>
            <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
              En validant ou publiant un contenu généré par l'Intelligence Artificielle de Kompilot (réponses à des avis, publications sur les réseaux sociaux, articles SEO), <strong>l'utilisateur accepte l'entière responsabilité éditoriale du contenu ainsi publié</strong>. Kompilot ne saurait être tenu responsable des contenus modifiés ou validés par l'utilisateur. L'utilisateur s'engage à vérifier la conformité des contenus générés avec la réglementation applicable (droit de la consommation, publicité mensongère, etc.) avant toute publication.
            </p>
          </div>
        </Section>

        <Section title="8. Propriété des données utilisateur" icon={<Shield size={16} />}>
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <p className="text-xs font-bold text-primary mb-1">🔒 Vous restez propriétaire de vos données</p>
            <p className="text-xs text-foreground leading-relaxed">
              L'utilisateur conserve l'intégralité des droits sur ses Données d'Établissement. En utilisant Kompilot,
              l'utilisateur concède uniquement une licence limitée, non exclusive et révocable permettant à Kompilot
              de traiter ces données dans le seul but de fournir les Services.
            </p>
          </div>
          <p>
            <strong>Kompilot ne vend jamais vos données à des tiers.</strong> Les données de vos clients ne sont
            jamais utilisées pour entraîner des modèles d'IA publics. Chaque compte dispose d'un espace de données
            strictement isolé des autres comptes.
          </p>
          <p>
            À la résiliation du compte, l'utilisateur peut demander l'export complet de ses données (format JSON)
            et leur suppression définitive dans un délai de 30 jours.
          </p>
        </Section>

        <Section title="9. Disponibilité et niveau de service (SLA)" icon={<AlertTriangle size={16} />}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
            {[
              { metric: 'Disponibilité cible', value: '99,5% / mois', note: 'Hors maintenance planifiée' },
              { metric: 'Maintenance planifiée', value: 'Avec préavis 48h', note: 'Par email et notification in-app' },
              { metric: 'Support technique', value: 'Email — délai 48h', note: 'Priorité Pro & Business < 4h' },
            ].map(s => (
              <div key={s.metric} className="rounded-lg border border-border bg-muted/20 p-3 text-center">
                <p className="text-xs font-bold text-foreground">{s.metric}</p>
                <p className="text-sm font-extrabold text-primary my-1">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.note}</p>
              </div>
            ))}
          </div>
          <p>
            Kompilot ne saurait être tenu responsable des interruptions de service dues aux API tierces (réseaux sociaux,
            services d'IA), à des événements de force majeure ou à des maintenances des hébergeurs.
          </p>
        </Section>

        <Section title="10. Limitation de responsabilité" icon={<AlertTriangle size={16} />}>
          <p>
            Dans toute la mesure permise par la loi applicable, la responsabilité de Kompilot est limitée au montant
            des abonnements payés par l'utilisateur au cours des 12 derniers mois précédant l'événement dommageable.
          </p>
          <p>
            Kompilot ne saurait être tenu responsable de : (i) la perte de données consécutive à une interruption de service ;
            (ii) les décisions commerciales prises sur la base des analyses fournies par l'application ; (iii) les performances
            des publications sur les réseaux sociaux ; (iv) les contenus générés par IA utilisés de manière inadéquate.
          </p>
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/40 px-4 py-3">
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">⚠️ Clause de non-responsabilité — API tierces &amp; G.E.O.</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              Kompilot fournit ses services d'analyse et de G.E.O. sur la base des données publiques disponibles
              et des API des plateformes tierces (Google, Meta, OpenAI). L'éditeur ne pourra être tenu responsable
              en cas d'interruption de service liée à une modification technique ou juridique unilatérale des
              conditions d'accès de ces plateformes.
            </p>
          </div>
        </Section>

        <Section title="10-bis. Responsabilité Stripe Connect — Bouclier No-Show" icon={<Shield size={16} />}>
          <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/40 px-4 py-4">
            <p className="text-xs font-bold text-red-800 dark:text-red-300 mb-2">⚠️ Clause de responsabilité Stripe Connect — Pénalités No-Show</p>
            <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
              Kompilot agit exclusivement en tant que <strong>prestataire technologique</strong>. L'utilisateur du compte (le Professionnel) est seul responsable des pénalités appliquées à ses clients finaux via le Bouclier No-Show. Tout litige, contestation de prélèvement (<em>chargeback</em>), ou frais bancaires associés appliqués par Stripe seront <strong>intégralement à la charge du Professionnel</strong>. Kompilot ne pourra en aucun cas être tenu responsable des décisions commerciales ou tarifaires de l'utilisateur vis-à-vis de sa clientèle.
            </p>
          </div>
          <p>
            Le Professionnel reconnaît que l'activation du Bouclier No-Show implique la création d'un compte Stripe Connect Express soumis aux <a href="https://stripe.com/fr/legal/connect-account" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Conditions d'utilisation Stripe</a>. Kompilot ne perçoit aucune commission sur les pénalités encaissées par le Professionnel.
          </p>
          <p>
            En cas de taux de litiges dépassant 1,5 % sur une fenêtre de 30 jours glissants, Kompilot se réserve le droit de suspendre l'accès aux fonctionnalités de prélèvement automatique du compte concerné, conformément aux exigences de Stripe.
          </p>
        </Section>

        <Section title="10-ter. Obligation de moyens — SEO / G.E.O. / Algorithmes tiers" icon={<AlertTriangle size={16} />}>
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/40 px-4 py-4">
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-2">📊 Absence de garantie de résultat</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              Compte tenu de la nature fluctuante des algorithmes de moteurs de recherche et des modèles d'intelligence artificielle tiers (Google, OpenAI, Perplexity, Gemini, etc.), <strong>Kompilot est soumis à une obligation de moyens et non de résultat</strong>. L'éditeur ne garantit aucun gain de positionnement local, aucun volume d'avis minimum, ni aucune augmentation de chiffre d'affaires.
            </p>
          </div>
          <p>
            Les scores GEO, indicateurs de visibilité et recommandations fournis par Kompilot sont calculés sur la base de données publiques et d'algorithmes propriétaires sujets à évolution. Ces données sont fournies à titre indicatif uniquement. L'utilisateur est seul responsable des décisions commerciales prises sur la base de ces indicateurs.
          </p>
          <p>
            Kompilot ne garantit pas : (i) le maintien du référencement obtenu grâce aux outils fournis ; (ii) la permanence des positions acquises en cas de mise à jour des algorithmes des moteurs de recherche ; (iii) la constance des résultats des campagnes automatisées (réseaux sociaux, SMS, emailing) en raison des variations inhérentes aux plateformes tierces.
          </p>
        </Section>

        <Section title="11. Résiliation" icon={<RefreshCw size={16} />}>
          <p>
            <strong>Par l'utilisateur :</strong> L'abonnement peut être résilié à tout moment depuis l'onglet
            « Paramètres → Mon Abonnement ». La résiliation prend effet à la fin de la période en cours.
            Aucun remboursement prorata n'est effectué (hors droit de rétractation).
          </p>
          <p>
            <strong>Par Kompilot :</strong> Kompilot peut résilier un compte en cas de violation des présentes CGU,
            de non-paiement persistant ou de comportement abusif, avec un préavis de 30 jours (sauf violation grave).
          </p>
          <p>
            À la résiliation, les données sont conservées 30 jours (période de rétention) puis supprimées définitivement,
            à l'exception des données légalement obligatoires (factures : 10 ans).
          </p>
        </Section>

        <Section title="12. Modifications des CGV/CGU" icon={<FileText size={16} />}>
          <p>
            Kompilot se réserve le droit de modifier les présentes CGV/CGU. Toute modification substantielle fera l'objet
            d'une notification par email avec un préavis de <strong>30 jours</strong>. L'utilisation continue du service
            après ce délai vaut acceptation des nouvelles conditions.
          </p>
          <p>
            L'historique des modifications est disponible sur demande à <span className="text-primary">legal@kompilot.app</span>.
          </p>
        </Section>

        <Section title="13. Droit applicable et juridiction" icon={<Shield size={16} />}>
          <p>
            Les présentes CGV/CGU sont soumises au droit français. En cas de litige, les parties s'engagent à rechercher
            une solution amiable avant tout recours judiciaire.
          </p>
          <p>
            À défaut d'accord amiable, les tribunaux compétents du ressort du siège social de KOMPILOT SAS seront
            seuls compétents pour connaître du litige.
          </p>
          <p>
            Les consommateurs peuvent également recourir à la plateforme de résolution en ligne des litiges de l'Union Européenne :
            <a href="https://ec.europa.eu/odr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">ec.europa.eu/odr</a>.
          </p>
        </Section>
      </main>

      <PageFooter />
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-bold text-foreground flex items-center gap-2">
        <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">{icon}</span>
        {title}
      </h2>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}

function PageFooter() {
  return (
    <footer className="border-t border-border mt-16 py-8">
      <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} Kompilot — Tous droits réservés</span>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="hover:text-foreground transition-colors">Politique de confidentialité</Link>
          <Link to="/cgv" className="hover:text-foreground transition-colors font-medium text-primary">CGV / CGU</Link>
          <Link to="/legal" className="hover:text-foreground transition-colors">Mentions légales</Link>
        </div>
      </div>
    </footer>
  );
}