/**
 * LandingAgencyTab — Version compacte
 * 4 features clés + CTA. Sans script téléphonique ni pitch deck inline.
 */
import { Users, FileText, Building2, Palette, ArrowRight, TrendingUp, Star, Zap, MapPin } from 'lucide-react';

const AGENCY_FEATURES = [
  {
    icon: Users,
    title: 'Multi-clients centralisé',
    desc: "Basculez d'un client à l'autre en 1 clic. Gérez 50+ établissements depuis un seul tableau de bord.",
  },
  {
    icon: FileText,
    title: 'Rapports marque blanche',
    desc: 'PDF professionnels brandés à votre logo, générés automatiquement chaque mois en 1 clic.',
  },
  {
    icon: Building2,
    title: 'IA en masse',
    desc: "Posts, fiches G.E.O. et réponses aux avis générés pour 50 clients simultanément en tâche de fond.",
  },
  {
    icon: Palette,
    title: 'Interface à votre image',
    desc: 'Logo, couleurs, domaine personnalisé — 100% marque blanche pour vos clients.',
  },
];

const STATS = [
  { value: '50+', label: 'Clients gérés simultanément' },
  { value: '×3', label: 'MRR moyen en 3 mois' },
  { value: '-80%', label: 'Temps de reporting' },
];

interface Props { onCta: () => void; }

export function LandingAgencyTab({ onCta }: Props) {
  return (
    <section style={{ padding: 'clamp(36px, 6vw, 56px) 16px', maxWidth: 1080, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(129,140,248,.12)', border: '1px solid rgba(129,140,248,.25)', color: '#818CF8', borderRadius: 9999, padding: '4px 14px', fontSize: '.75rem', fontWeight: 700, marginBottom: 14 }}>
          <Building2 size={12} /> Mode Agence & Freelance
        </span>
        <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, color: '#F1F5F9', lineHeight: 1.25, margin: '0 0 12px' }}>
          Revendez la visibilité locale.<br />
          <span style={{ color: '#818CF8' }}>Sans y passer vos nuits.</span>
        </h2>
        <p style={{ color: '#64748B', fontSize: '1rem', maxWidth: 560, margin: '0 auto' }}>
          Kompilot gère tous vos clients en arrière-plan. Vous présentez les résultats sous votre marque.
        </p>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
        {STATS.map(s => (
          <div key={s.label} style={{ background: 'rgba(129,140,248,.08)', border: '1px solid rgba(129,140,248,.18)', borderRadius: 14, padding: '16px 24px', textAlign: 'center', flex: '1 1 120px', maxWidth: 'min(100%, 320px)' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#818CF8', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '.72rem', color: '#64748B', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Feature grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 40 }}>
        {AGENCY_FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={i} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: '20px 18px' }}>
              <div style={{ width: 36, height: 36, background: 'rgba(129,140,248,.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Icon size={16} color="#818CF8" />
              </div>
              <h3 style={{ color: '#F1F5F9', fontWeight: 700, fontSize: '.9rem', margin: '0 0 6px' }}>{f.title}</h3>
              <p style={{ color: '#64748B', fontSize: '.8rem', margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          );
        })}
      </div>

      {/* ── GEO MAP MARKETING BLOCK ── */}
      <div style={{ background: 'rgba(13,148,136,.06)', border: '1px solid rgba(13,148,136,.25)', borderRadius: 18, padding: '24px', marginBottom: 32, position: 'relative', overflow: 'hidden' }}>
        {/* Background decoration */}
        <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(13,148,136,.08)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(13,148,136,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MapPin size={20} color="#0D9488" />
            </div>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(13,148,136,.12)', border: '1px solid rgba(13,148,136,.25)', color: '#0D9488', borderRadius: 9999, padding: '3px 10px', fontSize: '.7rem', fontWeight: 700, marginBottom: 8 }}>
                🗺️ Nouveau — Carte G.E.O. IA
              </div>
              <h3 style={{ color: '#F1F5F9', fontWeight: 800, fontSize: 'clamp(.95rem, 2vw, 1.2rem)', margin: '0 0 6px', lineHeight: 1.3 }}>
                Rapports géolocalisés de présence IA — Vendez de la visibilité, pas du SEO.
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '.85rem', margin: 0, lineHeight: 1.55 }}>
                Générez des rapports géolocalisés de présence IA. Montrez visuellement à vos clients <strong style={{ color: '#0D9488' }}>où ils sont recommandés par ChatGPT</strong> et <strong style={{ color: '#F87171' }}>où leurs concurrents prennent le dessus</strong> — par zone géographique, en temps réel.
              </p>
            </div>
          </div>

          {/* Mini map mockup */}
          <div style={{ background: 'rgba(0,0,0,.3)', borderRadius: 14, padding: '16px', border: '1px solid rgba(255,255,255,.06)' }}>
            <p style={{ color: '#64748B', fontSize: '.7rem', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.08em' }}>Aperçu — Carte de recommandation IA</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {[
                { rank: 1, label: 'ChatGPT', green: true },
                { rank: 4, label: 'Gemini', green: false },
                { rank: 2, label: 'ChatGPT', green: true },
                { rank: 6, label: 'Perplexity', green: false },
                { rank: 1, label: 'Claude', green: true },
                { rank: 5, label: 'Gemini', green: false },
                { rank: 3, label: 'ChatGPT', green: true },
                { rank: 7, label: 'Perplexity', green: false },
                { rank: 2, label: 'Claude', green: true },
              ].map((cell, i) => (
                <div key={i} style={{
                  borderRadius: 10,
                  border: `1.5px solid ${cell.green ? 'rgba(16,185,129,.4)' : 'rgba(239,68,68,.4)'}`,
                  background: cell.green ? 'rgba(16,185,129,.1)' : 'rgba(239,68,68,.1)',
                  padding: '10px 6px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: cell.green ? '#10b981' : '#ef4444',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '.65rem', fontWeight: 900,
                  }}>{cell.rank}</div>
                  <span style={{ fontSize: '.58rem', color: cell.green ? '#10b981' : '#f87171', fontWeight: 700, textAlign: 'center' }}>{cell.label}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.67rem', color: '#10b981', fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                Pos. 1–3 : Recommandé en premier
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.67rem', color: '#f87171', fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                Pos. 6+ : Concurrent recommandé
              </span>
            </div>
          </div>

          {/* Value props */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
            {[
              { emoji: '📍', text: 'Carte interactive par zone géographique' },
              { emoji: '🤖', text: 'Score ChatGPT, Gemini, Perplexity par secteur' },
              { emoji: '📄', text: 'Rapport PDF marque blanche en 1 clic' },
              { emoji: '⚡', text: 'Actions IA pour corriger les zones rouges' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)', borderRadius: 10, padding: '10px 12px' }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.emoji}</span>
                <p style={{ color: '#94A3B8', fontSize: '.77rem', margin: 0, lineHeight: 1.4 }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonial rapide */}
      <div style={{ background: 'rgba(129,140,248,.06)', border: '1px solid rgba(129,140,248,.15)', borderRadius: 16, padding: '20px 24px', marginBottom: 32, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#818CF8,#6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '.9rem', flexShrink: 0 }}>J</div>
        <div>
          <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
            {[1,2,3,4,5].map(n => <Star key={n} size={12} fill="#818CF8" color="#818CF8" />)}
          </div>
          <p style={{ color: '#CBD5E1', fontSize: '.85rem', margin: '0 0 6px', lineHeight: 1.5, fontStyle: 'italic' }}>
            "Mon agence a packagé une offre de visibilité locale et l'a ajoutée à 15 contrats en moins d'un mois. Nos clients adorent les rapports à notre nom."
          </p>
          <p style={{ color: '#475569', fontSize: '.75rem', margin: 0 }}>Julien M. — Directeur Agence Digitale, Paris</p>
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <button
          onClick={onCta}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#818CF8', color: '#fff', fontWeight: 800, fontSize: '.95rem', borderRadius: 14, padding: '14px 32px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 24px rgba(129,140,248,.35)' }}
        >
          <Zap size={16} /> Démarrer en mode Agence <ArrowRight size={16} />
        </button>
        <p style={{ color: '#475569', fontSize: '.75rem', margin: 0 }}>Essai 14 jours gratuit · Sans carte bancaire</p>
      </div>

    </section>
  );
}
