import { Link } from '@tanstack/react-router';
import { ArrowLeft, FileText, CreditCard, RefreshCw, AlertTriangle, Shield, Users } from 'lucide-react';

const LAST_UPDATED = '29 Juin 2026 — v2.1 (Starter/Agency, engagement annuel, clauses IA)';

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

        <Section title="4. Offres, Tarification et Engagement Annuel" icon={<CreditCard size={16} />}>
          <p>
            Kompilot propose deux formules d'abonnement payant à destination exclusive des professionnels
            (personnes physiques ou morales agissant dans le cadre de leur activité commerciale, industrielle,
            artisanale ou libérale). Les tarifs sont exprimés en euros Hors Taxes (HT). La TVA applicable
            est ajoutée lors du paiement conformément à la législation en vigueur.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse my-2">
              <thead>
                <tr className="bg-primary/10">
                  <th className="text-left p-2 border border-border font-bold text-foreground">Formule</th>
                  <th className="text-left p-2 border border-border font-bold text-foreground">Mensuel (sans engagement)</th>
                  <th className="text-left p-2 border border-border font-bold text-foreground">Annuel (engagement 12 mois)</th>
                  <th className="text-left p-2 border border-border font-bold text-foreground">Caractéristiques principales</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { plan: 'Starter', monthly: '69 € HT / mois', yearly: '759 € HT / an (soit ~63,25 €/mois)', features: '1 compte Meta, 20 générations IA/mois, calendrier standard, AIO Sync 5 mots-clés' },
                  { plan: 'Agency', monthly: '149 € HT / mois', yearly: '1 639 € HT / an (soit ~136,58 €/mois)', features: `IA illimitée (Fair Use), marque blanche, multi-comptes (jusqu'à 30 fiches), Radar Concurrentiel, GA4, support prioritaire 24h/7j` },
                  { plan: 'Enterprise', monthly: 'Sur devis', yearly: 'Sur devis', features: 'Volume illimité, API dédiées, SLA garanti, ingénieur dédié' },
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

          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 mt-2">
            <p className="text-xs font-bold text-primary mb-1">4.1 — Option Annuelle : un mois offert</p>
            <p className="text-xs text-foreground leading-relaxed">
              L'option annuelle correspond à un engagement de douze (12) mois. Le Client bénéficie d'un mois
              offert, soit l'équivalent de onze (11) mois facturés en une seule fois au moment de la souscription.
              Le paiement est intégral, immédiat et non fractionnable. Aucune demande de proratisation
              ou de remboursement partiel ne pourra être formulée en cours d'engagement, quel qu'en soit le motif,
              y compris en cas de non-utilisation totale ou partielle du Service.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 mt-2">
            <p className="text-xs font-bold text-foreground mb-1">4.2 — Renouvellement automatique</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tout abonnement (mensuel ou annuel) est reconduit tacitement à son terme pour une période
              identique, sauf dénonciation par le Client via l'onglet « Paramètres → Mon Abonnement » de son
              espace client, au plus tard <strong>48 heures avant la date d'échéance</strong> de la période en cours.
              En cas de renouvellement annuel, le montant intégral de la nouvelle période annuelle est prélevé
              automatiquement. Le Client sera notifié par email sept (7) jours avant chaque renouvellement.
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/40 px-4 py-3 mt-2">
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">4.3 — Non-remboursement</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              Aucune résiliation anticipée en cours de période (mensuelle ou annuelle) n'ouvre droit
              à un remboursement, même partiel, de la période en cours. Le Service demeure accessible
              jusqu'au terme de la période effectivement payée. Cette stipulation est expressément acceptée
              par le Client en qualité de professionnel agissant dans le cadre de son activité, conformément
              à l'article L442-1 du Code de commerce.
            </p>
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            Kompilot se réserve le droit de modifier ses tarifs à tout moment. Toute modification tarifaire
            sera notifiée par email avec un préavis de trente (30) jours. Les nouveaux tarifs s'appliqueront
            uniquement aux périodes d'abonnement renouvelées ou souscrites postérieurement à la notification.
          </p>
        </Section>

        <Section title="5. Modalités de paiement" icon={<CreditCard size={16} />}>
          <p>
            Les paiements sont traités exclusivement via <strong>Stripe</strong>, prestataire de paiement certifié
            PCI DSS niveau 1. Kompilot n'a à aucun moment accès aux données bancaires complètes du Client.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
            {[
              { mode: 'Carte bancaire', detail: 'Visa, Mastercard, American Express — prélèvement automatique à chaque échéance (mensuelle ou annuelle)' },
              { mode: 'SEPA', detail: 'Prélèvement SEPA disponible pour les formules Agency et Enterprise' },
            ].map(m => (
              <div key={m.mode} className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs font-bold text-foreground mb-1">{m.mode}</p>
                <p className="text-xs text-muted-foreground">{m.detail}</p>
              </div>
            ))}
          </div>
          <p>
            En cas de rejet de paiement, Kompilot envoie un email de notification. Le Client dispose d'un délai
            de sept (7) jours pour régulariser sa situation. Passé ce délai, l'accès aux fonctionnalités premium
            est suspendu. Si le paiement n'est pas régularisé sous trente (30) jours, Kompilot se réserve le droit
            de résilier l'abonnement. Le compte reste accessible en lecture seule pendant la période de rétention
            des données (30 jours après résiliation).
          </p>
          <p>
            <strong>Frais de rejet :</strong> Tout rejet de paiement imputable au Client (carte expirée, provision
            insuffisante, opposition) pourra donner lieu à l'application de frais forfaitaires de gestion de
            dix euros (10 € HT), couvrant les frais bancaires facturés à Kompilot par Stripe.
          </p>
        </Section>

        <Section title="6. Droit de rétractation — Spécificité B2B" icon={<RefreshCw size={16} />}>
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 mb-3">
            <p className="text-xs font-bold text-primary mb-1">Renonciation au droit de rétractation par les professionnels</p>
            <p className="text-xs text-foreground leading-relaxed">
              Conformément aux dispositions du Code de la consommation, le droit de rétractation de
              quatorze (14) jours prévu par l'article L221-18 s'applique exclusivement aux consommateurs.
              Le Client reconnaît expressément que l'utilisation de Kompilot s'inscrit dans le cadre de son
              activité professionnelle et renonce, en conséquence, à exercer tout droit de rétractation
              à compter de la validation de sa commande.
            </p>
          </div>
          <p>
            Cette renonciation est confirmée par le mécanisme de « Clickwrap » intégré au tunnel de paiement :
            le Client coche une case dédiée attestant de sa qualité de professionnel et de sa renonciation
            explicite au droit de rétractation avant de procéder au paiement. Cette signature électronique
            est horodatée, conservée et opposable (voir article 1366 du Code civil).
          </p>
          <p>
            <strong>Politique de remboursement :</strong> Aucun remboursement prorata temporis n'est appliqué
            en cas de résiliation en cours de période, sauf circonstances exceptionnelles expressément appréciées
            par Kompilot au cas par cas. Les crédits IA consommés ne sont en aucun cas remboursables.
            Les crédits non utilisés à l'expiration d'une période ne sont pas reportés.
          </p>
        </Section>

        <Section title="7. Utilisation acceptable du service (AUP)" icon={<Shield size={16} />}>
          <p>Le Client s'engage à utiliser Kompilot de manière licite et conforme à sa destination. Sont notamment interdits :</p>
          <ul>
            <li>La publication de contenus illégaux, diffamatoires, haineux, trompeurs ou portant atteinte aux droits de tiers</li>
            <li>L'utilisation des fonctionnalités IA pour générer des contenus frauduleux, des faux avis, ou du spam automatisé</li>
            <li>Toute tentative d'accès non autorisé aux données d'autres utilisateurs ou de compromission de la sécurité de la plateforme</li>
            <li>La revente, la location ou le transfert de l'accès au compte Kompilot à des tiers non autorisés</li>
            <li>L'utilisation de robots, scripts ou tout procédé automatisé non expressément autorisé par Kompilot pour exploiter les ressources de la plateforme</li>
            <li>La violation des Conditions d'Utilisation des plateformes tierces connectées (Meta, Google, TikTok, etc.)</li>
            <li>La rétro-ingénierie, la décompilation ou toute tentative d'extraction du code source de l'Application</li>
          </ul>
          <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/40 px-4 py-3 mt-2">
            <p className="text-xs font-bold text-red-800 dark:text-red-300 mb-1">Sanctions</p>
            <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
              Tout manquement aux obligations du présent article peut entraîner la suspension immédiate
              et sans préavis du compte du Client, sans remboursement des sommes versées, et le cas échéant
              des poursuites judiciaires. Kompilot se réserve également le droit de facturer au Client
              les surcoûts engendrés par un usage abusif (consommation d'API anormale, infractions aux CGU).
            </p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900/40 px-4 py-3 mt-3">
            <p className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-1">Responsabilité éditoriale — Contenus IA</p>
            <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
              En validant ou publiant un contenu généré par l'Intelligence Artificielle de Kompilot (réponses
              à des avis, publications, articles SEO, scripts vidéo), <strong>le Client assume l'entière responsabilité
              éditoriale du contenu ainsi publié</strong>. Kompilot ne saurait être tenu responsable des contenus
              modifiés ou validés par le Client. Le Client s'engage à vérifier la conformité des contenus
              générés avec la réglementation applicable (droit de la consommation, droit à l'image, RGPD,
              publicité mensongère, etc.) avant toute diffusion.
            </p>
          </div>
        </Section>

        <Section title="7-bis. Consommation des ressources et quotas — Politique Anti-Abus" icon={<AlertTriangle size={16} />}>
          <p>
            L'accès aux fonctionnalités de Kompilot est soumis à des quotas de consommation mensuels
            définis selon la formule souscrite (générations IA, synchronisations AIO, requêtes de tracking,
            envois SMS, audits PDF, etc.). Ces quotas sont détaillés dans l'onglet « Mon Abonnement » de
            l'espace client.
          </p>
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/40 px-4 py-3 mt-2">
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">Fair Use Policy — Formules dites « illimitées »</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              Certaines fonctionnalités de la formule Agency sont présentées comme « illimitées ». Cette
              désignation est soumise à une politique d'usage loyal (<em>Fair Use Policy</em>). Kompilot
              se réserve le droit de suspendre, de brider ou de facturer séparément tout compte dont la
              consommation est anormalement élevée, automatisée (hors API officielles Kompilot), ou
              susceptible de saturer les infrastructures, d'engendrer des surcoûts significatifs d'API
              tiers, ou de dégrader le service rendu aux autres utilisateurs.
            </p>
          </div>
          <p>
            <strong>Seuils indicatifs de Fair Use :</strong> Au-delà de 500 générations IA/mois (Starter) ou
            5 000 générations IA/mois (Agency), ou de tout volume anormalement élevé détecté par nos systèmes
            de monitoring, Kompilot se réserve le droit de : (i) contacter le Client pour envisager une formule
            adaptée, (ii) appliquer un bridage temporaire, ou (iii) facturer les consommations excédentaires
            au tarif unitaire en vigueur.
          </p>
          <p>
            <strong>Usage automatisé :</strong> Toute utilisation de scripts, bots ou procédés automatisés
            non expressément autorisée via les API publiques de Kompilot constitue un usage abusif et
            peut entraîner la suspension immédiate du compte.
          </p>
        </Section>

        <Section title="7-ter. Propriété intellectuelle — Outputs d'Intelligence Artificielle" icon={<Shield size={16} />}>
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 mb-3">
            <p className="text-xs font-bold text-primary mb-1">Données d'entrée (Inputs)</p>
            <p className="text-xs text-foreground leading-relaxed">
              Le Client garantit qu'il dispose de l'ensemble des droits (propriété intellectuelle, droit
              à l'image, droit à la vie privée, marques) nécessaires à l'utilisation des données, visuels,
              textes et tout autre contenu qu'il injecte dans Kompilot pour le traitement par les moteurs
              d'IA intégrés. Le Client s'engage à indemniser Kompilot contre toute réclamation de tiers
              fondée sur une atteinte à leurs droits du fait des Inputs fournis.
            </p>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 mb-3">
            <p className="text-xs font-bold text-primary mb-1">Résultats générés (Outputs)</p>
            <p className="text-xs text-foreground leading-relaxed">
              Kompilot cède au Client l'ensemble des droits de propriété intellectuelle sur les contenus
              finaux générés par les moteurs d'IA intégrés au Service (campagnes publicitaires, vidéos,
              textes optimisés, scripts, visuels), à compter de leur génération. Cette cession est consentie
              à titre exclusif, pour la durée de la protection légale du droit d'auteur, pour le monde
              entier et pour l'ensemble des modes d'exploitation connus à la date des présentes.
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/40 px-4 py-3">
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">Limitation de garantie — Modèles d'IA tiers</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              Les Outputs sont générés par des modèles d'intelligence artificielle fournis par des tiers
              (OpenAI, Anthropic, etc.). En raison de la nature probabiliste de ces modèles, Kompilot
              ne garantit pas : (i) l'originalité absolue des Outputs, (ii) l'absence de similitude avec
              des contenus générés pour d'autres utilisateurs, (iii) l'absence de toute contrefaçon.
              Le Client est seul responsable de la vérification de l'originalité des Outputs avant leur
              exploitation commerciale et de leur conformité au droit de la propriété intellectuelle
              applicable. Kompilot décline toute responsabilité quant aux conséquences d'une action en
              contrefaçon ou en concurrence déloyale fondée sur un Output.
            </p>
          </div>
        </Section>

        <Section title="7-quater. Responsabilité liée aux outils tiers et API" icon={<AlertTriangle size={16} />}>
          <p>
            Le bon fonctionnement de Kompilot dépend partiellement de services et API fournis par des tiers,
            incluant notamment : Stripe (paiements), Meta (Facebook/Instagram), Google (Search, Maps, Analytics),
            TikTok, OpenAI, Anthropic, et d'autres fournisseurs d'API de tracking et de génération IA.
          </p>
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/40 px-4 py-3 mt-2">
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">Exclusion de responsabilité — Dépendance technologique</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              Kompilot ne pourra en aucun cas être tenu responsable des interruptions de service, pertes
              de données, dégradations de fonctionnalités ou modifications unilatérales de conditions
              générales provenant de ces fournisseurs tiers. L'éditeur s'engage toutefois à mettre en
              œuvre ses meilleurs efforts pour informer le Client dans les meilleurs délais de toute
              interruption significative et pour proposer, lorsque cela est techniquement possible, des
              solutions de contournement ou des alternatives.
            </p>
          </div>
          <p>
            Le Client reconnaît avoir été informé que les tarifs, conditions d'accès et caractéristiques
            techniques des API tierces sont susceptibles d'évoluer indépendamment de la volonté de Kompilot,
            et que de telles évolutions peuvent impacter temporairement ou durablement certaines
            fonctionnalités du Service sans que la responsabilité de Kompilot puisse être engagée.
          </p>
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
            Dans toute la mesure permise par la loi applicable, la responsabilité globale de Kompilot
            envers le Client, toutes causes de dommages confondues, est strictement plafonnée aux sommes
            effectivement versées par le Client au titre de son abonnement au cours des douze (12) derniers
            mois précédant l'événement dommageable ayant donné lieu à la réclamation.
          </p>
          <p>
            Kompilot ne saurait être tenu responsable de : (i) la perte de données consécutive à une
            interruption de service ; (ii) les décisions commerciales prises sur la base des analyses
            ou recommandations fournies par l'application ; (iii) les performances des publications sur
            les réseaux sociaux ; (iv) les contenus générés par IA utilisés de manière inadéquate ou
            non vérifiés par le Client ; (v) tout dommage indirect, perte de chiffre d'affaires, perte
            de clientèle, atteinte à l'image ou perte de chance.
          </p>
          <p>
            Les limitations ci-dessus s'appliquent quel que soit le fondement juridique de la réclamation
            (contractuel, délictuel, strict liability ou autre), même si Kompilot a été informé de la
            possibilité de tels dommages. En cas de dommage causé par une API tierce, seules les dispositions
            de l'article 7-quater (Responsabilité liée aux outils tiers et API) s'appliquent.
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