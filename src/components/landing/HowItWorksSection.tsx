/**
 * HowItWorksSection — Version compacte
 * 3 étapes visuelles + 5 features sous forme de checklist
 */
import { CalendarDays, MessageSquare, Star, BarChart2, Sparkles, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    num: '01',
    emoji: '📝',
    title: 'Décrivez votre activité',
    desc: 'L\'IA apprend votre secteur, votre ton et vos objectifs en moins de 3 minutes.',
  },
  {
    num: '02',
    emoji: '⚡',
    title: 'L\'IA travaille en automatique',
    desc: 'Posts planifiés, avis répondus, fiche Google optimisée — sans action de votre part.',
  },
  {
    num: '03',
    emoji: '📈',
    title: 'Vous suivez les résultats',
    desc: 'Score de visibilité, nouveaux avis, reach — tout en temps réel sur votre tableau de bord.',
  },
];

const FEATURES = [
  { icon: CalendarDays, label: 'Calendrier éditorial IA' },
  { icon: Star,         label: 'Avis Google automatisés' },
  { icon: MessageSquare, label: 'Inbox unifiée (Google, Insta, WhatsApp)' },
  { icon: BarChart2,   label: 'Score G.E.O. et autorité locale' },
  { icon: Sparkles,    label: 'Génération de posts et visuels' },
];

interface Props { onCta: () => void; }

export function HowItWorksSection({ onCta }: Props) {
  return (
    <section style={{ padding: 'clamp(36px, 6vw, 56px) 16px', maxWidth: 1080, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, color: '#F1F5F9', lineHeight: 1.25, margin: '0 0 12px' }}>
          Votre présence en ligne,<br />
          <span style={{ color: '#0D9488' }}>pilotée par l'IA.</span>
        </h2>
        <p style={{ color: '#64748B', fontSize: '1rem', maxWidth: 520, margin: '0 auto' }}>
          3 étapes pour augmenter votre présence locale.
        </p>
      </div>

      {/* Steps */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 16, marginBottom: 40 }}>
        {STEPS.map((step, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: '24px 20px', position: 'relative' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'rgba(13,148,136,.15)', lineHeight: 1, marginBottom: 12 }}>{step.num}</div>
            <div style={{ fontSize: '2rem', marginBottom: 10 }}>{step.emoji}</div>
            <h3 style={{ color: '#F1F5F9', fontWeight: 700, fontSize: '.95rem', margin: '0 0 8px' }}>{step.title}</h3>
            <p style={{ color: '#64748B', fontSize: '.82rem', margin: 0, lineHeight: 1.55 }}>{step.desc}</p>
          </div>
        ))}
      </div>

      {/* Features checklist */}
      <div style={{ background: 'rgba(13,148,136,.04)', border: '1px solid rgba(13,148,136,.12)', borderRadius: 16, padding: '20px 24px', marginBottom: 32 }}>
        <p style={{ color: '#94A3B8', fontSize: '.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 14px' }}>Tout inclus dans votre abonnement</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px 24px' }}>
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, background: 'rgba(13,148,136,.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={13} color="#0D9488" />
                </div>
                <span style={{ color: '#CBD5E1', fontSize: '.83rem' }}>{f.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={onCta}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0D9488', color: '#fff', fontWeight: 800, fontSize: '.95rem', borderRadius: 14, padding: '14px 32px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 24px rgba(13,148,136,.35)' }}
        >
          Démarrer gratuitement <ArrowRight size={16} />
        </button>
        <p style={{ color: '#475569', fontSize: '.75rem', marginTop: 8, lineHeight: 1.5 }}>
          Annulation en 1 clic · Pas de carte bancaire requise pendant 14 jours
        </p>
      </div>

    </section>
  );
}
