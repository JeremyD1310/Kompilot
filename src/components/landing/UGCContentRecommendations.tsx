/**
 * UGCContentRecommendations — Section "Recommandation de contenu multi-surfaces"
 * Montre comment Kompilot génère du contenu adapté à chaque plateforme,
 * incluant LinkedIn professionnel, forums locaux (Reddit/Tripadvisor) et avis Google.
 *
 * Intègre les insights Semrush 2025 sur les sources UGC utilisées par les IA.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Zap } from 'lucide-react';

// ── Content surface cards ──────────────────────────────────────────────────────
const CARDS = [
  {
    icon: '📸',
    title: 'Posts Sociaux',
    badge: { label: 'Inclus', color: '#10B981', bg: 'rgba(16,185,129,.12)', border: 'rgba(16,185,129,.25)' },
    borderColor: 'rgba(13,148,136,.2)',
    iconBg: 'rgba(13,148,136,.15)',
    accentBg: undefined,
    code: [
      '🌟 Nouveau : Menu du jour',
      '"Découvrez notre plat signature cette semaine !',
      ' Réservez votre table via le lien en bio 🍽️"',
      '↳ [Instagram] [Facebook] [Google My Business]',
    ],
    footer: '↗ 3 plateformes couvertes automatiquement',
    footerColor: '#0D9488',
  },
  {
    icon: '💼',
    title: 'LinkedIn Professionnel',
    badge: { label: 'Pro & Agency', color: '#818CF8', bg: 'rgba(99,102,241,.12)', border: 'rgba(129,140,248,.3)' },
    borderColor: 'rgba(99,102,241,.25)',
    iconBg: 'rgba(99,102,241,.15)',
    accentBg: 'rgba(99,102,241,.03)',
    code: [
      '📊 Actualité secteur',
      '"Le marché de la restauration locale connaît une',
      ' hausse de 12% des réservations en ligne en 2025.',
      ' Chez [Nom], nous avons adapté notre carte en',
      ' conséquence pour rester compétitifs."',
      '↳ Format structuré · Ton professionnel · Hashtags secteur',
    ],
    footer: '↗ Pensé pour votre audience B2B',
    footerColor: '#818CF8',
  },
  {
    icon: '💬',
    title: 'Forums & UGC Local',
    badge: { label: 'Nouveau', color: '#F59E0B', bg: 'rgba(245,158,11,.12)', border: 'rgba(245,158,11,.3)' },
    borderColor: 'rgba(245,158,11,.2)',
    iconBg: 'rgba(245,158,11,.12)',
    accentBg: 'rgba(245,158,11,.02)',
    code: [
      '✍️ Réponse forum',
      '"Bonjour ! En tant que restaurateur à Lyon depuis',
      ' 8 ans, je recommande de réserver à l\'avance le',
      ' week-end. Notre spécialité bouchon lyonnais est',
      ' très demandée."',
      '↳ r/Lyon · Tripadvisor Q&A · Google Q&A',
    ],
    footer: '↗ Sources UGC indexées par Gemini',
    footerColor: '#F59E0B',
  },
  {
    icon: '⭐',
    title: 'Réponses Avis Google',
    badge: { label: 'IA Auto', color: '#10B981', bg: 'rgba(16,185,129,.12)', border: 'rgba(16,185,129,.25)' },
    borderColor: 'rgba(16,185,129,.2)',
    iconBg: 'rgba(16,185,129,.12)',
    accentBg: undefined,
    code: [
      '⭐⭐⭐⭐⭐ Client satisfait',
      '"Réponse générée par l\'IA :',
      ' Merci infiniment pour votre retour chaleureux !',
      ' Nous sommes ravis que vous ayez apprécié [détail].',
      ' À très bientôt !"',
      '↳ Personnalisé · Votre ton · 1 clic',
    ],
    footer: '↗ Priorité d\'indexation pour ChatGPT',
    footerColor: '#10B981',
  },
];

// ── Generator examples per surface ────────────────────────────────────────────
const GENERATOR_EXAMPLES: Record<string, { prompt: string; output: string; platform: string }> = {
  'Posts Sociaux': {
    platform: 'Instagram / Facebook / Google',
    prompt: 'Restaurant français · "Nouveau menu printemps" · Ton chaleureux · Lien réservation',
    output: '🌸 Notre menu printemps est arrivé !\n\n• Tartare de saumon aux herbes fraîches\n• Magret de canard aux cerises\n• Fondant au chocolat maison\n\nRéservez votre table ce week-end 👉 [lien]\n\n#GastronomieLocale #MenuPrintemps #Lyon',
  },
  'LinkedIn Professionnel': {
    platform: 'LinkedIn',
    prompt: 'Expertise restauration · Tendance réservations en ligne 2025 · Ton professionnel',
    output: '📈 La restauration locale se digitalise plus vite que prévu.\n\nEn 2025, 68% des réservations restaurant passent par une app ou un moteur IA (source : Semrush). Chez nous, nous avons investi dans notre présence en ligne il y a 18 mois.\n\nRésultat : +34% de couverts en semaine, sans budget publicité.\n\nLa leçon : visibilité locale ≠ Google Ads. Elle commence par vos avis, votre fiche Google et… votre présence sur les plateformes que les IA consultent.\n\n#RestaurantLocal #DigitalLocal #GEO',
  },
  'Forums & UGC Local': {
    platform: 'Reddit r/Lyon · Tripadvisor · Google Q&A',
    prompt: 'Fil Reddit : "Bon restaurant bouchon lyonnais ?" · Réponse authentique d\'expert local',
    output: '**Réponse suggérée par Kompilot :**\n\nBonjour ! Je tiens un bouchon lyonnais depuis 8 ans dans le 2ème.\n\nQuelques conseils honnêtes :\n✓ Réservez le jeudi/vendredi soir — c\'est souvent complet\n✓ Demandez la "salade de claquerets" si elle est au menu\n✓ Évitez les bouchons trop près de la Place Bellecour (plus touristiques)\n\nN\'hésitez pas à me contacter si vous voulez une adresse locale 🦁\n\n*[ce contenu sera posté par votre compte personnel]*',
  },
  'Réponses Avis Google': {
    platform: 'Google Business Profile',
    prompt: 'Avis 5 étoiles · "Service impeccable et cuisine délicieuse" · Ton chaleureux',
    output: 'Merci infiniment pour votre retour, [Prénom] ! 🙏\n\nVotre satisfaction est notre plus belle récompense. Nous sommes ravis que le service et la cuisine aient été à la hauteur de vos attentes — c\'est exactement ce que notre équipe s\'efforce de créer chaque jour.\n\nNous espérons vous revoir très bientôt !\n\nÀ bientôt,\n[Nom du restaurant]',
  },
};

export function UGCContentRecommendations({ onCta }: { onCta: () => void }) {
  const [activeCard, setActiveCard] = useState<string | null>(null);

  return (
    <section
      id="ugc-recommendations"
      style={{
        padding: '56px 24px',
        background: 'radial-gradient(ellipse at 50% 100%, rgba(99,102,241,.06) 0%, transparent 60%)',
        borderTop: '1px solid rgba(255,255,255,.05)',
      }}
    >
      <div style={{ maxWidth: 1060, margin: '0 auto' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          style={{ textAlign: 'center', marginBottom: 0 }}
        >
          <p style={{
            textTransform: 'uppercase',
            fontSize: '.7rem',
            fontWeight: 800,
            letterSpacing: '.1em',
            color: '#818CF8',
            marginBottom: 12,
          }}>
            Optimisation Multi-Surfaces
          </p>

          <h2 style={{
            fontSize: 'clamp(1.7rem, 4vw, 2.4rem)',
            fontWeight: 800,
            color: '#F1F5F9',
            letterSpacing: '-0.03em',
            lineHeight: 1.2,
            marginBottom: 14,
          }}>
            Publiez au bon endroit.<br />
            <span style={{
              background: 'linear-gradient(90deg, #0D9488, #22D3EE)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Pas seulement sur Instagram.
            </span>
          </h2>

          {/* Semrush insight callout */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              maxWidth: 720,
              margin: '0 auto 8px',
              borderRadius: 14,
              padding: '16px 20px',
              background: 'linear-gradient(135deg, rgba(13,148,136,.10), rgba(99,102,241,.07))',
              border: '1px solid rgba(13,148,136,.25)',
              textAlign: 'left',
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start',
            }}
          >
            <span style={{ fontSize: '1.4rem', flexShrink: 0, marginTop: 2 }}>🌐</span>
            <div>
              <p style={{ color: '#F1F5F9', fontWeight: 800, fontSize: '.92rem', marginBottom: 6, lineHeight: 1.3 }}>
                Le SEO a changé. Les IA ne lisent plus seulement votre site web.
              </p>
              <p style={{ color: '#64748B', fontSize: '.82rem', lineHeight: 1.7, margin: 0 }}>
                Elles extraient leurs réponses des <strong style={{ color: '#2DD4BF' }}>avis Google</strong>,
                des <strong style={{ color: '#818CF8' }}>discussions LinkedIn</strong> et des{' '}
                <strong style={{ color: '#F59E0B' }}>fils Reddit</strong>.
                Kompilot s'assure que vous êtes visible partout où l'IA va chercher ses sources — pas uniquement sur votre site.
              </p>
              <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
                {[
                  { emoji: '🔎', label: 'Avis Google', sub: 'Indexés par ChatGPT en priorité', color: '#2DD4BF' },
                  { emoji: '💼', label: 'LinkedIn', sub: 'Sources B2B pour Perplexity', color: '#818CF8' },
                  { emoji: '🟠', label: 'Reddit', sub: 'UGC analysé par Gemini', color: '#F59E0B' },
                ].map(({ emoji, label, sub, color }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{emoji}</span>
                    <span style={{ fontSize: '.72rem', fontWeight: 700, color }}>{label}</span>
                    <span style={{ fontSize: '.7rem', color: '#475569' }}>{sub}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <p style={{
            color: '#64748B',
            fontSize: '.93rem',
            maxWidth: 560,
            margin: '16px auto 0',
            lineHeight: 1.65,
          }}>
            Kompilot génère du contenu adapté à chaque plateforme — là où les IA vont chercher leurs sources.
          </p>
        </motion.div>

        {/* Cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
          marginTop: 40,
        }}>
          {CARDS.map((card, i) => {
            const isOpen = activeCard === card.title;
            const example = GENERATOR_EXAMPLES[card.title];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                style={{
                  background: card.accentBg
                    ? `linear-gradient(160deg, ${card.accentBg}, rgba(255,255,255,.025))`
                    : 'rgba(255,255,255,.025)',
                  borderRadius: 16,
                  padding: '24px 20px',
                  border: `1px solid ${card.borderColor}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0,
                }}
              >
                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: card.iconBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem', flexShrink: 0,
                  }}>
                    {card.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '.92rem', fontWeight: 700, color: '#F1F5F9', display: 'block' }}>
                      {card.title}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '.65rem',
                    fontWeight: 700,
                    borderRadius: 9999,
                    padding: '2px 8px',
                    border: `1px solid ${card.badge.border}`,
                    background: card.badge.bg,
                    color: card.badge.color,
                    flexShrink: 0,
                  }}>
                    {card.badge.label}
                  </span>
                </div>

                {/* Code block simulé */}
                <div style={{
                  background: 'rgba(0,0,0,.3)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: '.75rem',
                  color: '#CBD5E1',
                  lineHeight: 1.7,
                  marginBottom: 12,
                  flex: 1,
                }}>
                  {card.code.map((line, j) => (
                    <div key={j}>{line}</div>
                  ))}
                </div>

                {/* Footer */}
                <p style={{ fontSize: '.72rem', color: card.footerColor, margin: '0 0 12px', fontWeight: 600 }}>
                  {card.footer}
                </p>

                {/* Toggle example */}
                {example && (
                  <button
                    onClick={() => setActiveCard(isOpen ? null : card.title)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'rgba(255,255,255,.04)',
                      border: '1px solid rgba(255,255,255,.08)',
                      borderRadius: 10,
                      padding: '8px 12px',
                      cursor: 'pointer',
                      color: '#94A3B8',
                      fontSize: '.73rem',
                      fontWeight: 600,
                      width: '100%',
                      transition: 'background .15s',
                    }}
                  >
                    <span>Voir un exemple généré</span>
                    {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                )}

                <AnimatePresence>
                  {isOpen && example && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{
                        marginTop: 10,
                        background: 'rgba(0,0,0,.35)',
                        borderRadius: 10,
                        padding: '12px 14px',
                        border: `1px solid ${card.borderColor}`,
                      }}>
                        <p style={{ fontSize: '.62rem', color: '#475569', margin: '0 0 6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                          📍 {example.platform}
                        </p>
                        <p style={{ fontSize: '.65rem', color: '#64748B', margin: '0 0 8px', fontStyle: 'italic' }}>
                          Prompt : {example.prompt}
                        </p>
                        <div style={{
                          background: 'rgba(13,148,136,.06)',
                          border: '1px solid rgba(13,148,136,.15)',
                          borderRadius: 8,
                          padding: '10px 12px',
                          fontFamily: 'ui-monospace, monospace',
                          fontSize: '.73rem',
                          color: '#E2E8F0',
                          lineHeight: 1.7,
                          whiteSpace: 'pre-line',
                        }}>
                          {example.output}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 48 }}
        >
          <button
            className="nc-pill nc-pill-shimmer"
            onClick={onCta}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'linear-gradient(135deg, #0D9488, #0f766e)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '.9rem',
              borderRadius: 14,
              padding: '13px 28px',
              border: 'none',
              cursor: 'pointer',
              transition: 'transform .15s, box-shadow .15s',
              boxShadow: '0 6px 24px rgba(13,148,136,.35)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.03)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(13,148,136,.5)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 24px rgba(13,148,136,.35)';
            }}
          >
            <Zap size={15} />
            🚀 Générer mes contenus multi-surfaces
          </button>
          <p style={{ color: '#475569', fontSize: '.78rem', margin: 0 }}>
            Posts IA · LinkedIn · Forums · Avis — tout en 1 clic
          </p>
        </motion.div>

      </div>
    </section>
  );
}
