import { Link } from '@tanstack/react-router';
import { ArrowLeft, Building2, Globe, Mail, Phone, Shield } from 'lucide-react';

const LAST_UPDATED = 'Juin 2026';

export default function LegalPage() {
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
              <Building2 size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Mentions Légales</h1>
              <p className="text-xs text-muted-foreground">Dernière mise à jour : {LAST_UPDATED}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour la Confiance dans l'Économie Numérique (LCEN),
            les informations suivantes sont mises à disposition des utilisateurs du site et de l'application Kompilot.
          </p>
        </div>

        <Section title="1. Éditeur du site" icon={<Building2 size={16} />}>
          <InfoBlock>
            <Row label="Dénomination sociale" value="KOMPILOT SAS" />
            <Row label="Statut juridique" value="Société par Actions Simplifiée (SAS)" />
            <Row label="Capital social" value="1 000 €" />
            <Row label="Siège social" value="France" />
            <Row label="Email de contact" value="contact@kompilot.app" link="mailto:contact@kompilot.app" />
            <Row label="Support" value="support@kompilot.app" link="mailto:support@kompilot.app" />
          </InfoBlock>
          <p className="text-xs text-muted-foreground">
            Directeur de la publication : L'équipe fondatrice de Kompilot.
          </p>
        </Section>

        <Section title="2. Hébergement et infrastructure" icon={<Globe size={16} />}>
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-bold text-foreground mb-2">Cloudflare, Inc.</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>101 Townsend St, San Francisco, CA 94107, États-Unis</p>
                <p>Site web : <a href="https://cloudflare.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.cloudflare.com</a></p>
                <p className="mt-2 text-foreground border-l-2 border-primary/30 pl-3 leading-relaxed">
                  L'application Kompilot est déployée sur <strong>Cloudflare Workers</strong>, une infrastructure edge computing garantissant
                  des temps de réponse optimaux et une haute disponibilité. Les données des utilisateurs européens sont traitées
                  dans des centres de données situés en Europe (conformément au RGPD).
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-bold text-foreground mb-2">Blink Platform</p>
              <p className="text-xs text-muted-foreground">
                La base de données et les services backend sont hébergés sur la plateforme Blink (blink.new), offrant
                des garanties de sécurité et de conformité RGPD pour les données européennes.
              </p>
            </div>
          </div>
        </Section>

        <Section title="3. Propriété intellectuelle" icon={<Shield size={16} />}>
          <p>
            L'ensemble du contenu présent sur l'application Kompilot — incluant, sans limitation, les textes, graphiques,
            logos, icônes, images, clips audio, téléchargements numériques, compilations de données et logiciels — est la propriété
            exclusive de KOMPILOT SAS ou de ses fournisseurs de contenu et est protégé par les lois françaises et internationales
            sur la propriété intellectuelle.
          </p>
          <p>
            La marque « Kompilot », le logotype et les éléments de charte graphique associés constituent des marques déposées.
            Toute reproduction, même partielle, est interdite sans autorisation écrite préalable.
          </p>
          <p>
            Le code source de l'application est protégé par le droit d'auteur. Toute décompilation, ingénierie inverse ou
            exploitation non autorisée est formellement interdite.
          </p>
        </Section>

        <Section title="4. Services tiers intégrés" icon={<Globe size={16} />}>
          <p>Kompilot intègre des services fournis par des sociétés tierces :</p>
          <div className="space-y-2 my-3">
            {[
              {
                name: 'OpenAI, Inc.',
                location: '3180 18th St, San Francisco, CA 94110, USA',
                usage: 'Génération de contenu IA, réponses aux avis, assistant intelligent',
                rgpd: 'Accord de traitement des données (DPA) en vigueur — données anonymisées avant transmission',
              },
              {
                name: 'Perplexity AI, Inc.',
                location: 'San Francisco, Californie, USA',
                usage: 'Veille sectorielle, analyse des tendances locales',
                rgpd: 'Aucune donnée personnelle identifiable transmise',
              },
              {
                name: 'Stripe, Inc.',
                location: '354 Oyster Point Blvd, South San Francisco, CA 94080, USA',
                usage: 'Traitement des paiements et gestion des abonnements',
                rgpd: 'Certifié PCI DSS niveau 1 — Données bancaires jamais stockées par Kompilot',
              },
            ].map(s => (
              <div key={s.name} className="rounded-lg border border-border bg-muted/10 p-3">
                <p className="text-xs font-bold text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.location}</p>
                <p className="text-xs text-muted-foreground mt-1"><strong className="text-foreground">Usage :</strong> {s.usage}</p>
                <p className="text-xs text-primary/80 mt-1 font-medium">{s.rgpd}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="5. Responsabilité" icon={<Shield size={16} />}>
          <p>
            KOMPILOT s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur son application.
            Cependant, KOMPILOT ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations mises
            à disposition sur son application.
          </p>
          <p>
            KOMPILOT décline toute responsabilité pour tout dommage résultant d'une intrusion frauduleuse d'un tiers ayant
            entraîné une modification des informations mises à disposition sur l'application.
          </p>
          <p>
            Les données générées par l'IA sont fournies à titre indicatif. L'utilisateur reste seul responsable de
            l'utilisation faite des contenus générés par les modules d'intelligence artificielle.
          </p>
        </Section>

        <Section title="6. Contact et médiation" icon={<Mail size={16} />}>
          <InfoBlock>
            <Row label="Email général" value="contact@kompilot.app" link="mailto:contact@kompilot.app" />
            <Row label="Email DPO / RGPD" value="privacy@kompilot.app" link="mailto:privacy@kompilot.app" />
            <Row label="Support technique" value="support@kompilot.app" link="mailto:support@kompilot.app" />
          </InfoBlock>
          <p className="text-xs text-muted-foreground">
            En cas de litige, vous pouvez recourir à la médiation du e-commerce. Conformément à l'ordonnance n° 2015-1033
            du 20 août 2015, tout litige de consommation peut faire l'objet d'un règlement amiable.
          </p>
        </Section>

        <Section title="7. Droit applicable" icon={<Shield size={16} />}>
          <p>
            Les présentes mentions légales sont soumises au droit français. En cas de litige relatif à l'interprétation
            ou à l'exécution des présentes, les tribunaux français seront seuls compétents.
          </p>
          <p>
            Pour toute question relative à la protection des données personnelles, vous pouvez contacter la CNIL
            (Commission Nationale de l'Informatique et des Libertés) : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.cnil.fr</a>.
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
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}

function InfoBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 space-y-2">
      {children}
    </div>
  );
}

function Row({ label, value, link }: { label: string; value: string; link?: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-muted-foreground shrink-0 min-w-[140px]">{label} :</span>
      {link ? (
        <a href={link} className="text-primary hover:underline font-medium">{value}</a>
      ) : (
        <span className="text-foreground font-medium">{value}</span>
      )}
    </div>
  );
}

function PageFooter() {
  return (
    <footer className="border-t border-border mt-16 py-8">
      <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} Kompilot — Tous droits réservés</span>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="hover:text-foreground transition-colors">Politique de confidentialité</Link>
          <Link to="/cgv" className="hover:text-foreground transition-colors">CGV / CGU</Link>
          <Link to="/legal" className="hover:text-foreground transition-colors font-medium text-primary">Mentions légales</Link>
        </div>
      </div>
    </footer>
  );
}

// Unused icon components imported at top — keep for tree-shaking
const _unused = { Phone };
