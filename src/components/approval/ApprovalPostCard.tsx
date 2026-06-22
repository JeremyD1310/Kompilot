/** Displays a single post card inside the client approval view */
import { useState } from 'react';
import { Calendar, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  status: string;
  scheduledAt: string;
}

const DEMO_POST_DETAILS: Record<string, { emoji: string; platforms: string[]; image?: string }> = {
  p1: { emoji: '🎉', platforms: ['Instagram', 'Facebook'], image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=75' },
  p2: { emoji: '🍽️', platforms: ['Instagram', 'Google My Business'], image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=75' },
  p3: { emoji: '💐', platforms: ['Facebook', 'Instagram'], image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75' },
};

const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTHS_FR = ['jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

export function formatDateFR(iso: string): string {
  const d = new Date(iso);
  return `${DAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]}`;
}

export function ApprovalPostCard({ post, index }: { post: Post; index: number }) {
  const [open, setOpen] = useState(false);
  const detail = DEMO_POST_DETAILS[post.id] ?? { emoji: '📝', platforms: ['Instagram'] };

  return (
    <div style={{
      background: '#fff', borderRadius: 18, overflow: 'hidden',
      boxShadow: '0 2px 20px rgba(0,0,0,.06)',
      border: '1px solid rgba(0,0,0,.07)', marginBottom: 14,
    }}>
      {detail.image && (
        <div style={{ position: 'relative', height: 140, overflow: 'hidden' }}>
          <img src={detail.image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,.5) 100%)' }} />
          <div style={{ position: 'absolute', bottom: 10, left: 14, display: 'flex', gap: 6 }}>
            {detail.platforms.map(p => (
              <span key={p} style={{ background: 'rgba(255,255,255,.9)', color: '#111', borderRadius: 20, padding: '2px 9px', fontSize: '.67rem', fontWeight: 700 }}>{p}</span>
            ))}
          </div>
          <div style={{ position: 'absolute', top: 10, right: 12, background: 'rgba(255,255,255,.92)', borderRadius: 20, padding: '3px 10px', fontSize: '.7rem', fontWeight: 700, color: '#6359F8' }}>
            Publication {index + 1}
          </div>
        </div>
      )}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{detail.emoji}</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: '.9rem', color: '#111', lineHeight: 1.3, marginBottom: 6 }}>{post.title}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={12} style={{ color: '#6359F8' }} />
              <span style={{ fontSize: '.75rem', color: '#6359F8', fontWeight: 600 }}>{formatDateFR(post.scheduledAt)}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(99,89,248,.07)', border: 'none',
            color: '#6359F8', borderRadius: 8, padding: '7px 12px',
            fontSize: '.75rem', fontWeight: 600, cursor: 'pointer', width: '100%', marginTop: 10,
          }}
        >
          <Sparkles size={12} />
          Note de l'IA
          {open ? <ChevronUp size={12} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={12} style={{ marginLeft: 'auto' }} />}
        </button>
        {open && (
          <p style={{ fontSize: '.78rem', color: '#64748B', lineHeight: 1.5, marginTop: 8, padding: '8px 10px', background: 'rgba(99,89,248,.04)', borderRadius: 8 }}>
            Cette publication est optimisée pour maximiser l'engagement sur {detail.platforms.join(' et ')}. Heure d'envoi sélectionnée par l'algorithme en fonction de l'activité de votre audience.
          </p>
        )}
      </div>
    </div>
  );
}
