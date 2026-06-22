/**
 * BeforeAfterSection — Visual comparator: disorganized business WITHOUT tool
 * vs. optimized, serene business WITH Kompilot Copilote.
 * Replaces the 3-reasons ADVANTAGES grid.
 */
import { X, Check } from 'lucide-react';

const WITHOUT = [
  { emoji: '😰', text: 'Réponse aux avis Google oubliée pendant 3 semaines' },
  { emoji: '📱', text: 'Posts rédigés en urgence depuis le téléphone à 23h' },
  { emoji: '💸', text: '8 no-shows non facturés = 520 € perdus ce mois' },
  { emoji: '📊', text: 'Aucune visibilité sur le trafic ou l\'engagement' },
  { emoji: '🔇', text: 'Messages DM ignorés — clients non convertis' },
];

const WITH = [
  { emoji: '⭐', text: 'Réponse IA aux avis Google en 1 clic, dans les 2h' },
  { emoji: '🗓️', text: 'Calendrier de posts planifié pour le mois en 30 min' },
  { emoji: '🛡️', text: 'Empreinte Stripe obligatoire — aucun RDV non garanti' },
  { emoji: '📈', text: 'Dashboard de visibilité mis à jour en temps réel' },
  { emoji: '💬', text: 'Inbox unifiée — zéro message manqué, 100% convertion' },
];

function Side({ title, accent, items, isGood }: {
  title: string; accent: string; items: typeof WITHOUT; isGood: boolean;
}) {
  return (
    <div style={{
      flex: 1, minWidth: 260,
      background: isGood ? 'rgba(13,148,136,.06)' : 'rgba(239,68,68,.04)',
      border: `1px solid ${isGood ? 'rgba(13,148,136,.25)' : 'rgba(239,68,68,.15)'}`,
      borderRadius: 20, overflow: 'hidden',
    }}>
      {/* Header bar */}
      <div style={{
        background: isGood ? 'rgba(13,148,136,.15)' : 'rgba(239,68,68,.10)',
        borderBottom: `1px solid ${isGood ? 'rgba(13,148,136,.2)' : 'rgba(239,68,68,.12)'}`,
        padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isGood ? '#0D9488' : 'rgba(239,68,68,.6)',
        }}>
          {isGood
            ? <Check size={16} strokeWidth={3} style={{ color: '#fff' }} />
            : <X size={16} strokeWidth={3} style={{ color: '#fff' }} />
          }
        </div>
        <div>
          <p style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: accent, marginBottom: 2 }}>
            {isGood ? 'Avec Kompilot' : 'Sans outil'}
          </p>
          <p style={{ fontSize: '.92rem', fontWeight: 800, color: '#F1F5F9', margin: 0 }}>{title}</p>
        </div>
      </div>

      {/* Items */}
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: '1.1rem', lineHeight: 1, marginTop: 1, flexShrink: 0 }}>{item.emoji}</span>
            <p style={{ fontSize: '.875rem', color: isGood ? '#94A3B8' : '#64748B', lineHeight: 1.65, margin: 0 }}>
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BeforeAfterSection({ onCta }: { onCta: () => void }) {
  return (
    <section style={{
      padding: '44px 24px 30px',
      borderTop: '1px solid rgba(255,255,255,.05)',
    }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em', color: '#0D9488', marginBottom: 16 }}>
            Avant / Après
          </p>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.025em', color: '#F1F5F9', lineHeight: 1.18, maxWidth: 680, margin: '0 auto' }}>
            Un commerce désorganisé<br />
            <span style={{ background: 'linear-gradient(90deg, #FFFFFF 0%, #2DD4BF 60%, #06B6D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              transformé en machine à clients
            </span>
          </h2>
        </div>

        {/* Comparator — stack vertically on mobile (<768px): Sans above Avec */}
        <div
          className="nc-compare-grid"
          style={{ display: 'flex', gap: 20, flexWrap: 'wrap', position: 'relative' }}
        >
          <style>{`
            @media (max-width: 767px) {
              .nc-compare-grid {
                flex-direction: column !important;
              }
              .nc-vs-badge {
                position: static !important;
                transform: none !important;
                margin: 0 auto;
              }
            }
          `}</style>

          {/* Sans Kompilot — appears first (top on mobile) */}
          <Side
            title="Commerce désorganisé"
            accent="#F87171"
            items={WITHOUT}
            isGood={false}
          />

          {/* VS badge */}
          <div
            className="nc-vs-badge"
            style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 2,
              width: 44, height: 44,
              background: '#0B1120',
              border: '2px solid rgba(255,255,255,.12)',
              borderRadius: 9999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '.72rem', fontWeight: 900, color: '#64748B', letterSpacing: '.04em' }}>VS</span>
          </div>

          {/* Avec Kompilot — appears second (bottom on mobile = premium position) */}
          <Side
            title="Commerce serein & optimisé"
            accent="#2DD4BF"
            items={WITH}
            isGood={true}
          />
        </div>

        {/* Stats strip */}
        <div style={{
          marginTop: 32, display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center',
        }}>
          {[
            { stat: '−80 %', label: 'de temps sur la comm', color: '#2DD4BF' },
            { stat: '3×', label: "d'engagement client", color: '#818CF8' },
            { stat: '0', label: 'no-show non facturé', color: '#4ADE80' },
            { stat: '+42 %', label: 'de portée organique', color: '#FBBF24' },
          ].map(({ stat, label, color }) => (
            <div key={label} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)',
              borderRadius: 16, padding: '20px 28px', minWidth: 130,
            }}>
              <p style={{ fontSize: '2rem', fontWeight: 900, color, letterSpacing: '-0.04em', lineHeight: 1 }}>{stat}</p>
              <p style={{ fontSize: '.74rem', color: '#475569', textAlign: 'center', lineHeight: 1.4 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
