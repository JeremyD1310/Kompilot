/**
 * FAQSection — Grille de cartes néon 4×2 style "dark premium"
 *
 * Disposition :
 *  - Header centré avec logo Kompilot + titre dégradé
 *  - Grille 4 colonnes × 2 rangées de cartes carrées
 *  - Chaque carte : numéro "0N" néon, emoji thématique, question, réponse en accordéon
 *  - Badge "Optimisé par Kompilot" + CTA doubles en bas
 */

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

// ── Données ───────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    emoji: '📍',
    q: "Qu'est-ce qu'un logiciel de visibilité locale ?",
    a: "Un logiciel de visibilité locale centralise les actions qui aident une entreprise à être trouvée près de ses clients : informations locales, contenus, avis, réseaux sociaux et suivi des performances.",
  },
  {
    emoji: '⭐',
    q: "Comment répondre aux avis Google avec l'IA ?",
    a: "Kompilot rassemble vos avis et prépare une réponse adaptée au message et au ton de votre établissement. Vous relisez et validez chaque proposition avant son envoi.",
  },
  {
    emoji: '🔒',
    q: "Kompilot publie-t-il automatiquement ?",
    a: "Vous gardez le contrôle. Les contenus, réponses et actions préparés par Kompilot restent soumis à la validation définie par votre équipe avant publication ou envoi.",
  },
  {
    emoji: '🔎',
    q: "Comment améliorer la visibilité locale de mon entreprise ?",
    a: "Commencez par maintenir des informations cohérentes, répondre aux avis, publier des contenus utiles et suivre les recherches qui génèrent des visites. Kompilot regroupe ces signaux et aide à prioriser les prochaines actions.",
  },
  {
    emoji: '🤖',
    q: "Qu'est-ce que le GEO ?",
    a: "Le GEO, ou Generative Engine Optimization, vise à rendre une organisation et ses contenus plus faciles à comprendre, sélectionner et citer par les moteurs de réponse comme ChatGPT, Gemini ou Perplexity.",
  },
  {
    emoji: '✨',
    q: "Comment Kompilot aide-t-il à apparaître dans les moteurs IA ?",
    a: "Kompilot analyse les informations locales, les contenus, les avis et les signaux de marque, puis propose des corrections et sujets à traiter. Aucune plateforme ne peut toutefois garantir une citation par une IA.",
  },
  {
    emoji: '🏢',
    q: "Kompilot convient-il aux agences et aux entreprises multi-établissements ?",
    a: "Oui. L'offre Agency est conçue pour piloter plusieurs établissements ou clients, personnaliser les rapports et centraliser les actions depuis une seule interface.",
  },
  {
    emoji: '💬',
    q: "Quelle différence entre Kompilot et ChatGPT ?",
    a: "ChatGPT est un assistant généraliste. Kompilot est un cockpit métier qui organise les données, canaux, validations et indicateurs nécessaires au pilotage continu de la visibilité locale.",
  },
];

// ── Carte FAQ ─────────────────────────────────────────────────────────────────

function FAQCard({
  item, index, isOpen, onToggle,
}: {
  item: typeof FAQ_ITEMS[0];
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const num = String(index + 1).padStart(2, '0');

  return (
    <div
      onClick={onToggle}
      style={{
        borderRadius: 16,
        border: isOpen
          ? '1.5px solid rgba(45,212,191,.55)'
          : '1.5px solid rgba(45,212,191,.18)',
        background: isOpen
          ? 'linear-gradient(145deg, rgba(13,148,136,.14) 0%, rgba(6,182,212,.07) 100%)'
          : 'rgba(255,255,255,.03)',
        backdropFilter: 'blur(12px)',
        padding: '22px 20px 18px',
        cursor: 'pointer',
        transition: 'border-color .25s, background .25s, box-shadow .25s',
        boxShadow: isOpen
          ? '0 0 24px rgba(45,212,191,.12), inset 0 1px 0 rgba(255,255,255,.06)'
          : '0 0 0 rgba(0,0,0,0)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow spot (open only) */}
      {isOpen && (
        <div style={{
          position: 'absolute', top: -20, right: -20,
          width: 80, height: 80,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(45,212,191,.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
      )}

      {/* Row: number + toggle */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        {/* Number */}
        <span style={{
          fontSize: '1.5rem',
          fontWeight: 900,
          lineHeight: 1,
          background: 'linear-gradient(135deg, #2DD4BF 0%, #06B6D4 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.03em',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {num}
        </span>
        {/* Toggle pill */}
        <span style={{
          width: 22, height: 22, borderRadius: '50%',
          background: isOpen ? 'rgba(45,212,191,.20)' : 'rgba(255,255,255,.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isOpen ? '#2DD4BF' : '#475569',
          flexShrink: 0,
          transition: 'background .2s, color .2s',
        }}>
          {isOpen ? <Minus size={11} /> : <Plus size={11} />}
        </span>
      </div>

      {/* Emoji */}
      <div style={{ fontSize: '1.4rem', marginBottom: 8, lineHeight: 1 }}>
        {item.emoji}
      </div>

      {/* Question */}
      <p style={{
        fontSize: '.8rem',
        fontWeight: 700,
        color: isOpen ? '#F1F5F9' : '#CBD5E1',
        lineHeight: 1.45,
        margin: 0,
        transition: 'color .2s',
      }}>
        {item.q}
      </p>

      {/* Answer — smooth expand */}
      <div style={{
        maxHeight: isOpen ? 300 : 0,
        overflow: 'hidden',
        transition: 'max-height .4s cubic-bezier(.4,0,.2,1)',
      }}>
        <p style={{
          marginTop: 12,
          fontSize: '.76rem',
          color: '#64748B',
          lineHeight: 1.7,
        }}>
          {item.a}
        </p>
      </div>
    </div>
  );
}

// ── Section principale ────────────────────────────────────────────────────────

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const toggle = (i: number) => setOpenIndex(prev => (prev === i ? null : i));

  // FAQPage JSON-LD for AI/SEO
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': FAQ_ITEMS.map(item => ({
      '@type': 'Question',
      'name': item.q,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.a,
      },
    })),
  };

  return (
    <section
      id="faq"
      style={{
        padding: 'clamp(48px, 6vw, 80px) 16px',
        borderTop: '1px solid rgba(255,255,255,.05)',
        background: [
          'radial-gradient(ellipse at 20% 50%, rgba(13,148,136,.07) 0%, transparent 50%)',
          'radial-gradient(ellipse at 80% 50%, rgba(6,182,212,.05) 0%, transparent 50%)',
          'linear-gradient(180deg, rgba(11,17,32,0) 0%, rgba(13,148,136,.04) 100%)',
        ].join(', '),
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* FAQPage JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Grid background pattern */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: .03,
        backgroundImage: [
          'linear-gradient(rgba(45,212,191,1) 1px, transparent 1px)',
          'linear-gradient(90deg, rgba(45,212,191,1) 1px, transparent 1px)',
        ].join(', '),
        backgroundSize: '48px 48px',
      }} />

      <div style={{ maxWidth: 1060, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          {/* Mini-logo kompilot.fr */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            marginBottom: 20,
            padding: '4px 12px',
            borderRadius: 9999,
            background: 'rgba(13,148,136,.1)',
            border: '1px solid rgba(45,212,191,.2)',
          }}>
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L4 5.5V10.5C4 14 6.5 17.2 10 18C13.5 17.2 16 14 16 10.5V5.5L10 2Z"
                fill="rgba(13,148,136,.35)" stroke="#0D9488" strokeWidth="1.6" strokeLinejoin="round"/>
              <path d="M7 10l2 2 4-4" stroke="#0D9488" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: '.68rem', fontWeight: 700, color: '#0D9488', letterSpacing: '.04em' }}>
              kompilot.fr
            </span>
          </div>

          <h2 style={{
            fontSize: 'clamp(1.7rem, 3.5vw, 2.4rem)',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            lineHeight: 1.18,
            margin: 0,
          }}>
            <span style={{ color: '#F1F5F9' }}>Des questions ?{' '}</span>
            <span style={{
              background: 'linear-gradient(90deg, #2DD4BF 0%, #06B6D4 60%, #38BDF8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              On vous dit tout.
            </span>
          </h2>
        </div>

        {/* ── Grille 4×2 ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14,
        }}
          className="faq-grid"
        >
          {FAQ_ITEMS.map((item, i) => (
            <FAQCard
              key={i}
              item={item}
              index={i}
              isOpen={openIndex === i}
              onToggle={() => toggle(i)}
            />
          ))}
        </div>

        {/* ── Badge + CTA ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: 48 }}>

          {/* Badge optimisé */}
          <a
            href="https://kompilot.fr"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(13,148,136,.08)', border: '1px solid rgba(45,212,191,.22)',
              borderRadius: 9999, padding: '5px 14px',
              color: '#4B9B8C', fontSize: '.67rem', fontWeight: 700,
              textDecoration: 'none', letterSpacing: '.04em',
              transition: 'color .2s, border-color .2s, background .2s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.color = '#2DD4BF'; el.style.borderColor = 'rgba(45,212,191,.5)';
              el.style.background = 'rgba(13,148,136,.14)';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.color = '#4B9B8C'; el.style.borderColor = 'rgba(45,212,191,.22)';
              el.style.background = 'rgba(13,148,136,.08)';
            }}
          >
            <svg width="10" height="10" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L4 5.5V10.5C4 14 6.5 17.2 10 18C13.5 17.2 16 14 16 10.5V5.5L10 2Z"
                fill="rgba(13,148,136,.3)" stroke="#0D9488" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M7 10l2 2 4-4" stroke="#0D9488" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            ✓ Optimisé par Kompilot
          </a>

          {/* CTA principal — vert néon */}
          <button
            onClick={() => {
              const el = document.querySelector('[data-cta]') as HTMLElement | null;
              if (el) el.click();
              else document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '15px 32px',
              borderRadius: 14,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '1rem',
              color: '#fff',
              background: 'linear-gradient(135deg, #0D9488 0%, #0EA5E9 60%, #2DD4BF 100%)',
              boxShadow: '0 6px 28px rgba(13,148,136,.5), 0 0 0 1px rgba(45,212,191,.25)',
              transition: 'transform .15s, box-shadow .15s',
              letterSpacing: '-.01em',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 10px 36px rgba(13,148,136,.6), 0 0 0 1px rgba(45,212,191,.35)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 28px rgba(13,148,136,.5), 0 0 0 1px rgba(45,212,191,.25)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#fff"/>
            </svg>
            Lancer mon copilote gratuitement →
          </button>

          {/* Texte légal */}
          <p style={{
            fontSize: '.72rem',
            color: '#475569',
            textAlign: 'center',
            lineHeight: 1.7,
            maxWidth: 480,
          }}>
            Annulation en 1 clic · Pas de carte bancaire requise pendant 7 jours
            <br />
            <span style={{ color: '#0D9488', fontWeight: 600 }}>
              ✓ Essai 7 jours gratuit
            </span>{' '}·{' '}
            <span style={{ color: '#0D9488', fontWeight: 600 }}>
              ✓ Accès immédiat
            </span>{' '}·{' '}
            <span style={{ color: '#0D9488', fontWeight: 600 }}>
              ✓ Configuration en 1 minute
            </span>
          </p>
        </div>
      </div>

      {/* Responsive grid styles */}
      <style>{`
        @media (max-width: 900px) {
          .faq-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 520px) {
          .faq-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
