import { Link } from '@tanstack/react-router';
import { ArrowLeft, Cookie, Shield, BarChart3, Megaphone, Database, Settings, Clock } from 'lucide-react';

const LAST_UPDATED = 'Juin 2026';

/* ── Landing dark palette values (mirroring src/index.css :root landing tokens) ── */
const L = {
  bg:           'hsl(222 22% 10%)',    /* --landing-bg          #0B1120 */
  bgAlt:        'hsl(222 27% 8%)',     /* --landing-bg-alt      #080E1C */
  surface:      'hsl(222 20% 14%)',    /* --landing-surface */
  border:       'hsl(215 14% 16%)',    /* --landing-border */
  primary:      'hsl(174 85% 31%)',    /* --landing-primary     #0D9488 */
  primaryBr:    'hsl(172 73% 50%)',    /* --landing-primary-bright */
  heading:      'hsl(210 20% 98%)',    /* --landing-heading     #F8FAFC */
  body:         'hsl(213 27% 91%)',    /* --landing-body        #E2E8F0 */
  muted:        'hsl(216 20% 63%)',    /* --landing-muted       #94A3B8 */
  subtle:       'hsl(218 11% 37%)',    /* --landing-subtle      #475569 */
  subdued:      'hsl(215 14% 46%)',    /* --landing-subdued     #64748B */
  white:        'hsl(0 0% 100%)',
};

export default function CookiesPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: L.bg, fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header style={{
        borderBottom: `1px solid ${L.border}`,
        backgroundColor: `color-mix(in srgb, ${L.surface} 95%, transparent)`,
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ maxWidth: 896, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link
            to="/"
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: L.muted, textDecoration: 'none' }}
            className="hover-bright"
          >
            <ArrowLeft size={15} />
            Retour
          </Link>
          <span style={{ fontWeight: 700, color: L.primary, fontSize: 14 }}>Kompilot</span>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: 896, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

          {/* Hero */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                backgroundColor: `color-mix(in srgb, ${L.primary} 10%, transparent)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Cookie size={20} style={{ color: L.primaryBr }} />
              </div>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: L.heading, letterSpacing: '-0.025em', margin: 0 }}>
                  Politique de Cookies
                </h1>
                <p style={{ fontSize: 12, color: L.muted, margin: '2px 0 0' }}>
                  Dernière mise à jour : {LAST_UPDATED} — Conforme RGPD (UE) 2016/679 et directive ePrivacy
                </p>
              </div>
            </div>
            <div style={{
              borderRadius: 12,
              border: `1px solid color-mix(in srgb, ${L.primary} 20%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${L.primary} 5%, transparent)`,
              padding: '16px 20px',
            }}>
              <p style={{ fontSize: 14, color: L.body, lineHeight: 1.65, margin: 0 }}>
                <strong style={{ color: L.heading }}>KOMPILOT</strong> utilise des cookies et technologies similaires
                pour assurer le bon fonctionnement de l'application, mesurer l'audience de manière anonyme
                et vous proposer des contenus pertinents. Cette page détaille l'ensemble des cookies déposés
                sur votre terminal lorsque vous utilisez nos services, leur finalité et leur durée de conservation.
              </p>
            </div>
          </div>

          {/* 1. Qu'est-ce qu'un cookie ? */}
          <Section title="1. Qu'est-ce qu'un cookie ?" icon={<Cookie size={16} />}>
            <p style={{ margin: 0 }}>
              Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, tablette, smartphone)
              lors de la consultation d'un site web ou d'une application. Il permet à l'émetteur de reconnaître
              votre terminal pendant la durée de validité du cookie. Certains cookies sont strictement nécessaires
              au fonctionnement technique du service ; d'autres permettent de mesurer l'audience, de personnaliser
              votre expérience ou de vous proposer des publicités ciblées.
            </p>
            <p style={{ margin: 0 }}>
              Kompilot utilise également le <strong style={{ color: L.heading }}>stockage local (localStorage)</strong> de
              votre navigateur pour conserver certaines préférences et identifiants de session. Ces données ne sont
              jamais transmises à des serveurs tiers sans votre consentement explicite.
            </p>
          </Section>

          {/* 2. Cookies essentiels */}
          <Section title="2. Cookies essentiels (toujours actifs)" icon={<Shield size={16} />}>
            <p style={{ margin: 0 }}>
              Ces cookies et données de stockage local sont indispensables au fonctionnement de l'application Kompilot.
              Ils ne peuvent pas être désactivés car ils garantissent la sécurité de votre session, la mémorisation de
              vos préférences de consentement et le bon fonctionnement des fonctionnalités de base.
            </p>

            <CookieTable
              headers={['Nom', 'Type', 'Finalité', 'Durée']}
              rows={[
                ['kompilot_cookie_consent', 'localStorage', 'Enregistre votre état de consentement (accepté, refusé, personnalisé) pour ne pas vous redemander à chaque visite.', '365 jours'],
                ['kompilot_cookie_prefs', 'localStorage', 'Stocke vos préférences détaillées par catégorie de cookies lorsque vous avez choisi l\'option « Personnaliser ».', '365 jours'],
                ['blink_user_id', 'localStorage', 'Identifiant de session d\'authentification. Permet de maintenir votre connexion active pendant votre navigation.', 'Session'],
                ['kompilot_demo_session_v1', 'localStorage', 'Identifiant de session pour la version démo. Permet de préserver l\'état de votre démonstration.', 'Session'],
              ]}
            />

            <div style={{
              borderRadius: 12,
              border: `1px solid color-mix(in srgb, ${L.primary} 20%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${L.primary} 5%, transparent)`,
              padding: '12px 16px',
            }}>
              <p style={{ fontSize: 12, color: L.primaryBr, fontWeight: 700, margin: '0 0 4px' }}>
                🔒 Base légale : intérêt légitime (Article 6(1)(f) RGPD)
              </p>
              <p style={{ fontSize: 12, color: L.body, lineHeight: 1.6, margin: 0 }}>
                Ces cookies sont exemptés de l'obligation de recueil du consentement conformément à
                l'article 82 de la loi Informatique et Libertés et aux lignes directrices de la CNIL.
              </p>
            </div>
          </Section>

          {/* 3. Cookies analytiques */}
          <Section title="3. Cookies analytiques" icon={<BarChart3 size={16} />}>
            <p style={{ margin: 0 }}>
              Ces cookies nous permettent de mesurer l'audience de notre application de manière anonyme,
              d'analyser votre navigation et d'améliorer nos services. Ces cookies ne sont déposés
              qu'avec votre consentement explicite.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Google Analytics 4 */}
              <ProviderBlock name="Google Analytics 4 (GA4)">
                <p style={{ margin: 0 }}>
                  Service de mesure d'audience de Google. Les données collectées sont anonymisées
                  (masquage IP) et agrégées. Aucune donnée personnelle identifiable n'est partagée
                  avec Google. Les données sont conservées sur des serveurs européens.
                </p>
                <CookieTable
                  headers={['Nom', 'Type', 'Finalité', 'Durée']}
                  rows={[
                    ['_ga', 'Cookie', 'Identifiant unique utilisé pour distinguer les utilisateurs. Anonymisé via masquage IP.', '2 ans'],
                    ['_ga_*', 'Cookie', 'Identifiant de flux de données GA4. Permet de maintenir l\'état de la session de mesure.', '2 ans'],
                    ['_gid', 'Cookie', 'Identifiant utilisé pour distinguer les utilisateurs sur une période de 24 heures.', '24 heures'],
                    ['_gat', 'Cookie', 'Cookie de limitation de débit des requêtes. Empêche la saturation des serveurs Google.', '1 minute'],
                  ]}
                />
              </ProviderBlock>

              {/* Plausible Analytics */}
              <ProviderBlock name="Plausible Analytics">
                <p style={{ margin: 0 }}>
                  Solution de mesure d'audience <strong style={{ color: L.heading }}>respectueuse de la vie privée</strong>,
                  sans cookies tiers et sans collecte de données personnelles. Plausible ne trace pas les utilisateurs
                  à travers les sites et n'utilise pas de fingerprinting. Hébergé en Europe.
                </p>
                <CookieTable
                  headers={['Nom', 'Type', 'Finalité', 'Durée']}
                  rows={[
                    ['_plausible_*', 'Cookie', 'Cookies first-party utilisés pour la mesure d\'audience anonyme (pages vues, sources de trafic, temps passé). Aucune donnée personnelle collectée.', '1 an'],
                  ]}
                />
              </ProviderBlock>

              {/* Hotjar & Contentsquare */}
              <ProviderBlock name="Hotjar / Contentsquare">
                <p style={{ margin: 0 }}>
                  Solutions d'analyse du comportement utilisateur (heatmaps, enregistrements de session, sondages).
                  Hotjar (désormais Contentsquare) nous aide à comprendre comment les utilisateurs interagissent
                  avec l'application pour améliorer l'expérience et l'interface. Les données sont pseudonymisées
                  et hébergées en Europe (serveurs AWS Irlande).
                </p>
                <CookieTable
                  headers={['Nom', 'Type', 'Finalité', 'Durée']}
                  rows={[
                    ['_hjSession_*', 'Cookie', 'Identifiant de session Hotjar. Permet de regrouper les comportements utilisateur au sein d\'une même session.', '30 minutes'],
                    ['_hjSessionUser_*', 'Cookie', 'Identifiant utilisateur Hotjar. Permet de rattacher les sessions à un même utilisateur sur plusieurs visites.', '365 jours'],
                    ['_hjTLDTest', 'Cookie', 'Cookie technique Hotjar utilisé pour déterminer le chemin de cookie le plus générique.', 'Session'],
                    ['_hjAbsoluteSessionInProgress', 'Cookie', 'Cookie technique Hotjar indiquant si une session est en cours. Utilisé pour les sondages et widgets.', '30 minutes'],
                    ['_cs_*', 'Cookie', 'Cookies Contentsquare pour l\'analyse comportementale (heatmaps, session replay).', '13 mois'],
                  ]}
                />
              </ProviderBlock>
            </div>

            <div style={{
              borderRadius: 12,
              border: `1px solid color-mix(in srgb, ${L.muted} 20%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${L.muted} 8%, transparent)`,
              padding: '12px 16px',
            }}>
              <p style={{ fontSize: 12, color: L.muted, fontWeight: 700, margin: '0 0 4px' }}>
                📊 Base légale : consentement (Article 6(1)(a) RGPD)
              </p>
              <p style={{ fontSize: 12, color: L.body, lineHeight: 1.6, margin: 0 }}>
                Vous pouvez retirer votre consentement à tout moment en cliquant sur « Gérer mes cookies »
                dans le pied de page ou en ouvrant le bandeau de paramétrage via les paramètres de votre compte.
              </p>
            </div>
          </Section>

          {/* 4. Cookies marketing */}
          <Section title="4. Cookies marketing" icon={<Megaphone size={16} />}>
            <p style={{ margin: 0 }}>
              Ces cookies sont utilisés pour le ciblage publicitaire, la mesure des performances
              des campagnes et le suivi des conversions. Ils permettent aux plateformes publicitaires
              (Meta, TikTok, LinkedIn) de vous reconnaître lorsque vous interagissez avec nos contenus
              promotionnels. Ces cookies ne sont déposés qu'avec votre consentement explicite.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Meta Pixel */}
              <ProviderBlock name="Meta Pixel (Facebook / Instagram)">
                <p style={{ margin: 0 }}>
                  Pixel de suivi Meta utilisé pour mesurer les conversions publicitaires, créer des audiences
                  personnalisées et optimiser la diffusion des campagnes sur Facebook et Instagram.
                </p>
                <CookieTable
                  headers={['Nom', 'Type', 'Finalité', 'Durée']}
                  rows={[
                    ['_fbp', 'Cookie', 'Identifiant du pixel Meta. Permet de suivre les visites et les conversions provenant des publicités Facebook/Instagram.', '90 jours'],
                    ['_fbc', 'Cookie', 'Identifiant de clic Facebook. Stocke l\'information de clic lorsqu\'un utilisateur arrive via une publicité Meta.', '90 jours'],
                    ['fr', 'Cookie', 'Cookie publicitaire Meta. Utilisé pour la diffusion, la mesure et la pertinence des publicités.', '90 jours'],
                  ]}
                />
              </ProviderBlock>

              {/* TikTok Pixel */}
              <ProviderBlock name="TikTok Pixel">
                <p style={{ margin: 0 }}>
                  Pixel de suivi TikTok utilisé pour mesurer les performances des campagnes publicitaires
                  sur TikTok et créer des audiences de reciblage.
                </p>
                <CookieTable
                  headers={['Nom', 'Type', 'Finalité', 'Durée']}
                  rows={[
                    ['_ttp', 'Cookie', 'Identifiant du pixel TikTok. Permet le suivi des conversions et l\'attribution des performances publicitaires.', '13 mois'],
                    ['_tt_enable_cookie', 'Cookie', 'Cookie technique TikTok indiquant si le suivi par cookie est activé pour la session en cours.', '13 mois'],
                  ]}
                />
              </ProviderBlock>

              {/* LinkedIn Insight Tag */}
              <ProviderBlock name="LinkedIn Insight Tag">
                <p style={{ margin: 0 }}>
                  Tag de suivi LinkedIn utilisé pour l'analyse des campagnes B2B, le ciblage professionnel
                  et la mesure des conversions sur les publicités LinkedIn.
                </p>
                <CookieTable
                  headers={['Nom', 'Type', 'Finalité', 'Durée']}
                  rows={[
                    ['_lipt', 'Cookie', 'Identifiant de suivi LinkedIn. Permet la mesure des conversions et le ciblage des audiences professionnelles.', '30 jours'],
                    ['_liveramp_uid', 'Cookie', 'Identifiant LiveRamp (partenaire LinkedIn) utilisé pour la synchronisation d\'audience B2B.', '2 ans'],
                    ['bcookie', 'Cookie', 'Cookie d\'identification du navigateur LinkedIn. Permet de reconnaître un navigateur sur le réseau LinkedIn.', '2 ans'],
                    ['lidc', 'Cookie', 'Cookie LinkedIn de sélection de datacenter. Optimise la communication avec les serveurs LinkedIn.', '1 jour'],
                    ['UserMatchHistory', 'Cookie', 'Historique de synchronisation des identifiants LinkedIn Ads. Utilisé pour le ciblage et la mesure B2B.', '30 jours'],
                  ]}
                />
              </ProviderBlock>
            </div>

            <div style={{
              borderRadius: 12,
              border: `1px solid color-mix(in srgb, ${L.muted} 20%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${L.muted} 8%, transparent)`,
              padding: '12px 16px',
            }}>
              <p style={{ fontSize: 12, color: L.muted, fontWeight: 700, margin: '0 0 4px' }}>
                🎯 Base légale : consentement (Article 6(1)(a) RGPD)
              </p>
              <p style={{ fontSize: 12, color: L.body, lineHeight: 1.6, margin: 0 }}>
                Ces cookies ne sont activés qu'avec votre consentement. Vous pouvez les désactiver à tout moment
                via le bandeau de gestion des cookies. Le refus de ces cookies n'affecte pas le fonctionnement
                de l'application Kompilot.
              </p>
            </div>
          </Section>

          {/* 5. Gestion des cookies */}
          <Section title="5. Comment gérer vos cookies" icon={<Settings size={16} />}>
            <p style={{ margin: 0 }}>
              Vous disposez de plusieurs moyens pour gérer et contrôler les cookies déposés sur votre terminal :
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
              {[
                {
                  title: 'Bandeau de consentement',
                  desc: 'Lors de votre première visite, un bandeau vous permet d\'accepter, de refuser ou de personnaliser vos préférences par catégorie de cookies.',
                },
                {
                  title: 'Pied de page',
                  desc: 'Un lien « Gérer mes cookies » est disponible en permanence dans le pied de page de l\'application pour modifier vos choix à tout moment.',
                },
                {
                  title: 'Paramètres du navigateur',
                  desc: 'Vous pouvez configurer votre navigateur pour bloquer les cookies tiers, supprimer les cookies existants ou être notifié lorsqu\'un cookie est déposé.',
                },
                {
                  title: 'Paramètres Kompilot',
                  desc: 'Dans votre espace client (Paramètres → Confidentialité), vous pouvez consulter et révoquer vos consentements.',
                },
              ].map(item => (
                <div key={item.title} style={{
                  borderRadius: 12,
                  border: `1px solid ${L.border}`,
                  backgroundColor: L.surface,
                  padding: '12px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: L.heading, margin: 0 }}>{item.title}</p>
                  <p style={{ fontSize: 12, color: L.muted, lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
                </div>
              ))}
            </div>

            <div style={{
              borderRadius: 12,
              border: `1px solid color-mix(in srgb, ${L.primary} 20%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${L.primary} 5%, transparent)`,
              padding: '12px 16px',
            }}>
              <p style={{ fontSize: 12, color: L.primaryBr, fontWeight: 700, margin: '0 0 4px' }}>
                📬 Retrait du consentement
              </p>
              <p style={{ fontSize: 12, color: L.body, lineHeight: 1.6, margin: 0 }}>
                Le retrait du consentement est aussi simple que son octroi. Vous pouvez à tout moment revenir
                sur vos choix en cliquant sur <strong style={{ color: L.heading }}>« Gérer mes cookies »</strong> dans
                le pied de page. Le retrait n'affecte pas la licéité du traitement fondé sur le consentement
                effectué avant ce retrait.
              </p>
            </div>

            <div style={{
              borderRadius: 12,
              border: `1px solid color-mix(in srgb, ${L.muted} 20%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${L.muted} 8%, transparent)`,
              padding: '12px 16px',
            }}>
              <p style={{ fontSize: 12, color: L.muted, fontWeight: 700, margin: '0 0 4px' }}>
                ⚠️ Conséquences du refus des cookies
              </p>
              <p style={{ fontSize: 12, color: L.body, lineHeight: 1.6, margin: 0 }}>
                Le refus des cookies analytiques ou marketing n'a <strong style={{ color: L.heading }}>aucun impact</strong> sur
                le fonctionnement de l'application Kompilot. Toutes les fonctionnalités de base restent accessibles.
                Seules les mesures d'audience anonymes et le ciblage publicitaire sont désactivés.
              </p>
            </div>
          </Section>

          {/* 6. Durée de conservation */}
          <Section title="6. Durée de conservation des cookies" icon={<Clock size={16} />}>
            <p style={{ margin: 0 }}>
              Conformément aux recommandations de la CNIL, les cookies déposés sur votre terminal ont une durée
              de vie maximale de <strong style={{ color: L.heading }}>13 mois</strong>. À l'expiration de ce délai,
              votre consentement sera de nouveau sollicité.
            </p>
            <p style={{ margin: 0 }}>
              Les données collectées via les cookies sont conservées pour une durée maximale de
              <strong style={{ color: L.heading }}>25 mois</strong> conformément aux lignes directrices de la CNIL.
            </p>
            <p style={{ margin: 0 }}>
              Le cookie de consentement (<code style={{
                backgroundColor: L.surface, color: L.primaryBr, padding: '1px 6px', borderRadius: 4, fontSize: 12,
              }}>kompilot_cookie_consent</code>) est conservé pendant <strong style={{ color: L.heading }}>365 jours</strong>,
              après quoi le bandeau de consentement vous sera de nouveau présenté.
            </p>
          </Section>

          {/* 7. Contact & liens utiles */}
          <Section title="7. Contact et liens utiles" icon={<Database size={16} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{
                borderRadius: 12,
                border: `1px solid ${L.border}`,
                backgroundColor: L.surface,
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}>
                <InfoRow label="DPO & responsable cookies" value="privacy@kompilot.app" link="mailto:privacy@kompilot.app" />
                <InfoRow label="Support technique" value="support@kompilot.app" link="mailto:support@kompilot.app" />
                <InfoRow label="CNIL" value="www.cnil.fr" link="https://www.cnil.fr" />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <Link
                  to="/privacy"
                  style={{
                    fontSize: 13, color: L.primaryBr, textDecoration: 'none',
                    padding: '6px 14px', borderRadius: 8,
                    border: `1px solid color-mix(in srgb, ${L.primary} 20%, transparent)`,
                    backgroundColor: `color-mix(in srgb, ${L.primary} 8%, transparent)`,
                  }}
                  className="hover-bright"
                >
                  Politique de confidentialité →
                </Link>
                <Link
                  to="/legal"
                  style={{
                    fontSize: 13, color: L.muted, textDecoration: 'none',
                    padding: '6px 14px', borderRadius: 8,
                    border: `1px solid ${L.border}`,
                    backgroundColor: L.surface,
                  }}
                  className="hover-bright"
                >
                  Mentions légales →
                </Link>
                <Link
                  to="/cgv"
                  style={{
                    fontSize: 13, color: L.muted, textDecoration: 'none',
                    padding: '6px 14px', borderRadius: 8,
                    border: `1px solid ${L.border}`,
                    backgroundColor: L.surface,
                  }}
                  className="hover-bright"
                >
                  CGV / CGU →
                </Link>
              </div>
            </div>
          </Section>

        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${L.border}`, marginTop: 64, padding: '32px 0' }}>
        <div
          style={{
            maxWidth: 896, margin: '0 auto', padding: '0 24px',
            display: 'flex', flexWrap: 'wrap', alignItems: 'center',
            justifyContent: 'space-between', gap: 16,
            fontSize: 12, color: L.muted,
          }}
        >
          <span>© {new Date().getFullYear()} Kompilot — Tous droits réservés</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link
              to="/privacy"
              style={{ color: L.muted, textDecoration: 'none' }}
              className="hover-bright"
            >
              Politique de confidentialité
            </Link>
            <Link
              to="/cookies"
              style={{ color: L.primaryBr, textDecoration: 'none', fontWeight: 600 }}
              className="hover-bright"
            >
              Cookies
            </Link>
            <Link
              to="/cgv"
              style={{ color: L.muted, textDecoration: 'none' }}
              className="hover-bright"
            >
              CGV / CGU
            </Link>
            <Link
              to="/legal"
              style={{ color: L.muted, textDecoration: 'none' }}
              className="hover-bright"
            >
              Mentions légales
            </Link>
          </div>
        </div>
      </footer>

      {/* ── Global hover style ──────────────────────────────────────────────── */}
      <style>{`
        .hover-bright:hover {
          color: hsl(210 20% 98%) !important;
        }
      `}</style>
    </div>
  );
}

/* ── Reusable sub-components ──────────────────────────────────────────────── */

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2 style={{
        fontSize: 16, fontWeight: 700, color: L.heading,
        display: 'flex', alignItems: 'center', gap: 8, margin: 0,
      }}>
        <span style={{
          width: 24, height: 24, borderRadius: 8,
          backgroundColor: `color-mix(in srgb, ${L.primary} 10%, transparent)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: L.primaryBr, flexShrink: 0,
        }}>
          {icon}
        </span>
        {title}
      </h2>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 12,
        fontSize: 14, color: L.muted, lineHeight: 1.65,
      }}>
        {children}
      </div>
    </section>
  );
}

function CookieTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: 10, border: `1px solid ${L.border}` }}>
      <table style={{
        width: '100%', borderCollapse: 'collapse', fontSize: 12,
        color: L.body,
      }}>
        <thead>
          <tr style={{ backgroundColor: `color-mix(in srgb, ${L.surface} 60%, transparent)` }}>
            {headers.map(h => (
              <th key={h} style={{
                textAlign: 'left', padding: '8px 12px',
                fontWeight: 600, color: L.heading,
                borderBottom: `1px solid ${L.border}`,
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              style={{
                backgroundColor: i % 2 === 0 ? 'transparent' : `color-mix(in srgb, ${L.surface} 30%, transparent)`,
              }}
            >
              {row.map((cell, j) => (
                <td key={j} style={{
                  padding: '8px 12px',
                  borderTop: i > 0 ? `1px solid ${L.border}` : 'none',
                  color: j === 0 ? L.primaryBr : j === 3 ? L.heading : L.muted,
                  fontWeight: j === 0 ? 600 : j === 3 ? 500 : 400,
                  fontFamily: j === 0 ? "'IBM Plex Mono', monospace" : 'inherit',
                  fontSize: j === 0 ? 11 : 12,
                }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProviderBlock({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div style={{
      borderRadius: 12,
      border: `1px solid ${L.border}`,
      backgroundColor: L.surface,
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          backgroundColor: L.primaryBr, flexShrink: 0,
        }} />
        <p style={{ fontSize: 14, fontWeight: 700, color: L.heading, margin: 0 }}>{name}</p>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, link }: { label: string; value: string; link?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14 }}>
      <span style={{ color: L.muted, flexShrink: 0, minWidth: 180 }}>{label} :</span>
      {link ? (
        <a
          href={link}
          style={{ color: L.primaryBr, textDecoration: 'none', fontWeight: 600 }}
          className="hover-bright"
        >
          {value}
        </a>
      ) : (
        <span style={{ color: L.heading, fontWeight: 600 }}>{value}</span>
      )}
    </div>
  );
}
