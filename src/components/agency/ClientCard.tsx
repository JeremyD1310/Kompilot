/**
 * ClientCard — individual agency client card with GEO score, trend, and pilot CTA.
 * Also exports MOCK_CLIENTS and SECTOR_EMOJIS for shared use across agency components.
 */
import { AlertTriangle, CheckCircle, Rocket, TrendingUp } from 'lucide-react';

/* ── Mock client data (replace with real DB query) ── */
export const MOCK_CLIENTS = [
  { id: '1', name: 'Le Petit Bistro', type: 'Restaurant', city: 'La Rochelle', geoScore: 84, trend: +14, reviewsUnread: 3, status: 'alert' as const, emoji: '🍽️' },
  { id: '2', name: 'Studio Beauté Léa', type: 'Salon de coiffure', city: 'Bordeaux', geoScore: 71, trend: +6, reviewsUnread: 0, status: 'ok' as const, emoji: '💇‍♀️' },
  { id: '3', name: 'Garage Martin', type: 'Automobile', city: 'Nantes', geoScore: 58, trend: -3, reviewsUnread: 1, status: 'alert' as const, emoji: '🔧' },
  { id: '4', name: 'Pharmacie du Centre', type: 'Pharmacie', city: 'Lyon', geoScore: 92, trend: +8, reviewsUnread: 0, status: 'ok' as const, emoji: '💊' },
  { id: '5', name: 'Cabinet Dentaire Moreau', type: 'Santé', city: 'Paris 11e', geoScore: 77, trend: +2, reviewsUnread: 2, status: 'alert' as const, emoji: '🦷' },
  { id: '6', name: 'Boulangerie Du Soleil', type: 'Boulangerie', city: 'Marseille', geoScore: 89, trend: +19, reviewsUnread: 0, status: 'ok' as const, emoji: '🥐' },
];

export type MockClient = typeof MOCK_CLIENTS[0];

export const SECTOR_EMOJIS: Record<string, string> = {
  'Restaurant': '🍽️',
  'Salon de coiffure': '💇‍♀️',
  'Automobile': '🔧',
  'Pharmacie': '💊',
  'Santé': '🦷',
  'Boulangerie': '🥐',
  'Autre': '🏢',
};

/* ── ScoreBadge ── */
export function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? '#22C55E' : score >= 60 ? '#F59E0B' : '#EF4444';
  const bg = score >= 80 ? 'rgba(34,197,94,.1)' : score >= 60 ? 'rgba(245,158,11,.1)' : 'rgba(239,68,68,.1)';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: bg, border: `1px solid ${color}30`,
      borderRadius: 20, padding: '3px 10px',
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
      <span style={{ color, fontWeight: 800, fontSize: '.78rem' }}>{score}%</span>
    </div>
  );
}

/* ── ClientCard ── */
export function ClientCard({ client, onPilot }: {
  client: MockClient;
  onPilot: (id: string) => void;
}) {
  return (
    <div style={{
      background: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: 16, padding: '20px 20px 16px',
      display: 'flex', flexDirection: 'column', gap: 16,
      transition: 'box-shadow .2s, border-color .2s',
      cursor: 'default',
    }}
      className="hover:shadow-lg hover:border-primary/30"
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'hsl(var(--muted))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', flexShrink: 0,
        }}>
          {client.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: '.9rem', color: 'hsl(var(--foreground))', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {client.name}
          </p>
          <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '.75rem' }}>
            {client.type} · {client.city}
          </p>
        </div>
      </div>

      {/* GEO Score */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>
            Score G.E.O.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ScoreBadge score={client.geoScore} />
            <span style={{
              fontSize: '.72rem', fontWeight: 700,
              color: client.trend >= 0 ? '#22C55E' : '#EF4444',
            }}>
              {client.trend >= 0 ? '▲' : '▼'} {Math.abs(client.trend)}%
            </span>
          </div>
        </div>
        <TrendingUp size={20} style={{ color: 'hsl(var(--muted-foreground))', opacity: .4 }} />
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, borderRadius: 9999, background: 'hsl(var(--muted))', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 9999,
          width: `${client.geoScore}%`,
          background: client.geoScore >= 80 ? 'linear-gradient(90deg, #10B981, #22C55E)' : client.geoScore >= 60 ? 'linear-gradient(90deg, #F59E0B, #FCD34D)' : 'linear-gradient(90deg, #EF4444, #F87171)',
          transition: 'width .6s ease',
        }} />
      </div>

      {/* Notification badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {client.status === 'alert' ? (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)',
            color: '#EF4444', borderRadius: 20, padding: '3px 10px', fontSize: '.72rem', fontWeight: 600,
          }}>
            <AlertTriangle size={11} />
            {client.reviewsUnread} avis sans réponse
          </span>
        ) : (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.25)',
            color: '#22C55E', borderRadius: 20, padding: '3px 10px', fontSize: '.72rem', fontWeight: 600,
          }}>
            <CheckCircle size={11} />
            À jour
          </span>
        )}
      </div>

      {/* Pilot button */}
      <button
        onClick={() => onPilot(client.id)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: 'hsl(var(--primary))', color: '#fff',
          border: 'none', borderRadius: 10, padding: '10px 0',
          fontWeight: 700, fontSize: '.83rem', cursor: 'pointer',
          transition: 'opacity .2s',
        }}
        className="hover:opacity-90"
      >
        <Rocket size={14} />
        Piloter ce client
      </button>
    </div>
  );
}
