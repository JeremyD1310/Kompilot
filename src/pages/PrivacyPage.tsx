import { Link } from '@tanstack/react-router';
import { ArrowLeft, Shield, Lock, Database, Eye, Trash2, Download, Mail } from 'lucide-react';

const LAST_UPDATED = 'Juin 2026';

export default function PrivacyPage() {
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
              <Shield size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                Politique de Confidentialité & Protection des Données
              </h1>
              <p className="text-xs text-muted-foreground">Dernière mise à jour : {LAST_UPDATED} — Conforme RGPD (UE) 2016/679</p>
            </div>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4">
            <p className="text-sm text-foreground leading-relaxed">
              <strong>KOMPILOT</strong> (ci-après « la Société ») accorde une importance primordiale à la protection des données personnelles
              de ses utilisateurs. La présente politique détaille de manière transparente comment nous collectons, traitons et sécurisons
              vos données, conformément au Règlement Général sur la Protection des Données (RGPD).
            </p>
          </div>
        </div>

        <Section title="1. Responsable du traitement" icon={<Database size={16} />}>
          <p>Le responsable du traitement des données collectées via l'application Kompilot est :</p>
          <InfoBlock>
            <p><strong>Dénomination sociale :</strong> KOMPILOT SAS</p>
            <p><strong>Email DPO :</strong> privacy@kompilot.app</p>
            <p><strong>Adresse :</strong> France</p>
          </InfoBlock>
        </Section>

        <Section title="2. Données collectées" icon={<Eye size={16} />}>
          <p>Dans le cadre de l'utilisation de l'application, KOMPILOT traite les catégories de données suivantes :</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
            {[
              { label: 'Données de compte', items: ['Nom, prénom, email', 'Nom et secteur de l\'établissement', 'Numéro SIRET (optionnel)', 'Données de facturation (via Stripe)'] },
              { label: 'Données d\'activité', items: ['Publications planifiées et créées', 'Messages dans l\'Inbox Unique', 'Avis Google traités', 'Scores de visibilité locale'] },
              { label: 'Données de navigation', items: ['Logs de connexion anonymisés', 'Préférences d\'interface', 'Données d\'usage des fonctionnalités (analytics)'] },
              { label: 'Données IA traitées', items: ['Contenu des posts générés par IA', 'Réponses aux avis clients (anonymisées avant envoi à l\'IA)', 'Contexte de l\'établissement fourni par l\'utilisateur'] },
            ].map(cat => (
              <div key={cat.label} className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs font-bold text-foreground mb-2">{cat.label}</p>
                <ul className="space-y-1">
                  {cat.items.map(item => <li key={item} className="text-xs text-muted-foreground flex items-start gap-1.5"><span className="text-primary mt-0.5">•</span>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        <Section title="3. Traitement par les API tierces (OpenAI, Perplexity, Stripe)" icon={<Lock size={16} />}>
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/40 px-4 py-3 mb-3">
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">⚠️ Transparence sur l'utilisation des APIs IA</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              Kompilot utilise des API d'Intelligence Artificielle tiers pour alimenter ses fonctionnalités de génération de contenu et de réponse aux avis.
            </p>
          </div>
          <div className="space-y-3">
            <ApiCard
              name="OpenAI (GPT-4)"
              purpose="Génération de publications, réponses aux avis, assistant IA, création de contenu marketing"
              policy="https://openai.com/privacy"
              note="Les données transmises sont anonymisées et ne contiennent pas de données client identifiables. OpenAI s'engage à ne pas utiliser vos données pour entraîner ses modèles si vous avez opté out via leur API. Kompilot utilise l'API OpenAI en mode Business, ce qui garantit la confidentialité des données."
            />
            <ApiCard
              name="Perplexity AI"
              purpose="Recherches de tendances sectorielles, analyse de la concurrence locale, veille digitale"
              policy="https://perplexity.ai/privacy"
              note="Les requêtes transmises à Perplexity ne contiennent aucune donnée personnelle de vos clients."
            />
            <ApiCard
              name="Stripe"
              purpose="Traitement sécurisé des paiements et gestion des abonnements"
              policy="https://stripe.com/privacy"
              note="Kompilot ne stocke jamais vos données bancaires. Toutes les transactions sont gérées directement par Stripe, certifié PCI DSS niveau 1."
            />
            <ApiCard
              name="Cloudflare Workers"
              purpose="Infrastructure backend, chiffrement des données en transit (TLS 1.3), protection DDoS"
              policy="https://cloudflare.com/privacypolicy"
              note="Les données transitent via l'infrastructure Cloudflare, garantissant un chiffrement de bout en bout."
            />
          </div>
          <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <p className="text-xs font-bold text-primary mb-1">🔒 Engagement de Kompilot</p>
            <p className="text-xs text-foreground leading-relaxed">
              <strong>Kompilot n'utilise pas les données de vos clients pour entraîner des modèles d'IA publics.</strong>{' '}
              Vos données d'établissement restent privées et cloisonnées. Chaque compte dispose d'un espace de données strictement isolé.
            </p>
          </div>
        </Section>

        <Section title="4. Bases légales du traitement" icon={<Shield size={16} />}>
          <ul>
            <li><strong>Exécution du contrat</strong> — traitement des données nécessaire à la fourniture du service Kompilot.</li>
            <li><strong>Intérêt légitime</strong> — amélioration de nos services, prévention des fraudes, sécurité.</li>
            <li><strong>Consentement</strong> — cookies analytiques et marketing (révocable à tout moment).</li>
            <li><strong>Obligation légale</strong> — conservation des factures conformément aux exigences fiscales françaises.</li>
          </ul>
        </Section>

        <Section title="5. Durée de conservation" icon={<Database size={16} />}>
          <table className="w-full text-xs border-collapse my-2">
            <thead>
              <tr className="bg-muted/40">
                <th className="text-left p-2 border border-border font-semibold text-foreground">Type de données</th>
                <th className="text-left p-2 border border-border font-semibold text-foreground">Durée de conservation</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Données de compte actif', 'Durée de l\'abonnement + 30 jours après résiliation'],
                ['Factures et données comptables', '10 ans (obligation légale)'],
                ['Logs de sécurité et connexions', '12 mois glissants'],
                ['Messages Inbox (flux clients)', 'Durée de l\'abonnement — supprimés à la résiliation'],
                ['Données analytiques anonymisées', '24 mois'],
                ['Cookies analytiques', '13 mois maximum (CNIL)'],
              ].map(([type, duration]) => (
                <tr key={type} className="hover:bg-muted/10">
                  <td className="p-2 border border-border text-muted-foreground">{type}</td>
                  <td className="p-2 border border-border text-foreground font-medium">{duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="6. Vos droits RGPD" icon={<Shield size={16} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
            {[
              { right: 'Droit d\'accès', desc: 'Obtenir une copie de toutes vos données personnelles traitées', icon: '👁️' },
              { right: 'Droit de rectification', desc: 'Corriger des données inexactes ou incomplètes', icon: '✏️' },
              { right: 'Droit à la portabilité', desc: 'Recevoir vos données dans un format JSON structuré', icon: '📦' },
              { right: 'Droit à l\'effacement', desc: 'Demander la suppression de vos données (droit à l\'oubli)', icon: '🗑️' },
              { right: 'Droit d\'opposition', desc: 'S\'opposer au traitement de vos données à des fins marketing', icon: '🚫' },
              { right: 'Droit de limitation', desc: 'Restreindre le traitement dans certaines circonstances', icon: '⏸️' },
            ].map(r => (
              <div key={r.right} className="rounded-lg border border-border bg-muted/20 p-3 flex items-start gap-2">
                <span className="text-lg">{r.icon}</span>
                <div>
                  <p className="text-xs font-bold text-foreground">{r.right}</p>
                  <p className="text-xs text-muted-foreground">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <p className="text-xs font-semibold text-foreground mb-1">📬 Pour exercer vos droits :</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Utilisez la fonction <strong>« Exporter mes données »</strong> disponible dans Paramètres → Sécurité & Conformité,
              ou contactez-nous à <span className="text-primary font-medium">privacy@kompilot.app</span>.
              Vous pouvez également introduire une réclamation auprès de la <strong>CNIL</strong> (www.cnil.fr).
            </p>
          </div>
        </Section>

        <Section title="7. Cookies et traceurs" icon={<Eye size={16} />}>
          <div className="space-y-2">
            {[
              { type: 'Cookies essentiels', desc: 'Session d\'authentification, préférences de thème, panier de commande.', required: true },
              { type: 'Cookies analytiques', desc: 'Mesure d\'audience anonymisée (Blink Analytics, sans transfert vers Google). Durée : 13 mois.', required: false },
              { type: 'Cookies fonctionnels', desc: 'Mémorisation de vos préférences d\'interface (mode sombre, onglet actif).', required: false },
            ].map(c => (
              <div key={c.type} className="flex items-start justify-between gap-4 rounded-lg border border-border px-3 py-2.5 bg-muted/10">
                <div>
                  <p className="text-xs font-semibold text-foreground">{c.type}</p>
                  <p className="text-xs text-muted-foreground">{c.desc}</p>
                </div>
                <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 shrink-0 ${c.required ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {c.required ? 'Requis' : 'Optionnel'}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Vous pouvez gérer vos préférences de cookies via le bandeau de consentement ou en vidant les cookies de votre navigateur.
          </p>
        </Section>

        <Section title="8. Sécurité des données" icon={<Lock size={16} />}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
            {[
              { label: 'Chiffrement', desc: 'TLS 1.3 en transit, chiffrement AES-256 au repos' },
              { label: 'Infrastructure', desc: 'Cloudflare Workers — données hébergées en Europe (UE)' },
              { label: 'Accès', desc: 'Accès restreint au personnel habilité — journaux d\'audit complets' },
            ].map(s => (
              <div key={s.label} className="rounded-lg border border-border bg-card p-3 text-center">
                <p className="text-xs font-bold text-foreground mb-1">{s.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <p>
            En cas de violation de données susceptible d'engendrer un risque pour vos droits, nous nous engageons à vous notifier dans un délai de{' '}
            <strong>72 heures</strong> conformément à l'article 33 du RGPD.
          </p>
        </Section>

        <Section title="9. Contact" icon={<Mail size={16} />}>
          <InfoBlock>
            <p><strong>DPO & responsable confidentialité :</strong> <span className="text-primary">privacy@kompilot.app</span></p>
            <p><strong>Support technique :</strong> <span className="text-primary">support@kompilot.app</span></p>
            <p><strong>Délai de réponse :</strong> 30 jours maximum (RGPD)</p>
          </InfoBlock>
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

function InfoBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 space-y-1 text-sm">
      {children}
    </div>
  );
}

function ApiCard({ name, purpose, policy, note }: { name: string; purpose: string; policy: string; note: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-bold text-foreground">{name}</p>
        <a href={policy} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline">
          Politique de confidentialité →
        </a>
      </div>
      <p className="text-xs text-muted-foreground"><strong className="text-foreground">Usage :</strong> {purpose}</p>
      <p className="text-xs text-muted-foreground border-l-2 border-primary/30 pl-3 leading-relaxed">{note}</p>
    </div>
  );
}

function PageFooter() {
  return (
    <footer className="border-t border-border mt-16 py-8">
      <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} Kompilot — Tous droits réservés</span>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="hover:text-foreground transition-colors font-medium text-primary">Politique de confidentialité</Link>
          <Link to="/cgv" className="hover:text-foreground transition-colors">CGV / CGU</Link>
          <Link to="/legal" className="hover:text-foreground transition-colors">Mentions légales</Link>
        </div>
      </div>
    </footer>
  );
}