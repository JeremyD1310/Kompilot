/**
 * CityCalendarTab
 * Sous-onglet "Calendrier de la Ville" — micro-événements locaux
 * et opportunités de posts contextuels suggérés par l'IA.
 */
import { useState } from 'react';
import { MapPin, Sun, Cloud, Zap, Sparkles, ChevronRight, CalendarDays, Wind, Droplets, Trophy, Music, ShoppingBag, Users, RefreshCw } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
type EventCategory = 'meteo' | 'local' | 'sport' | 'commerce' | 'fete';

interface LocalEvent {
  id: string;
  date: string; // display
  dateShort: string;
  title: string;
  category: EventCategory;
  emoji: string;
  description: string;
  aiOpportunity: string;
  postDraft: string;
  urgency: 'high' | 'medium' | 'low';
}

// ── Mock events ───────────────────────────────────────────────────────────────
const EVENTS: LocalEvent[] = [
  {
    id: 'e1',
    date: 'Vendredi prochain',
    dateShort: 'Ven.',
    title: '☀️ Pic de chaleur — 34°C',
    category: 'meteo',
    emoji: '☀️',
    description: 'Vague de chaleur prévue vendredi et samedi. Indice UV élevé.',
    aiOpportunity: 'Post "Boissons fraîches" — fort taux d\'engagement par temps chaud',
    postDraft: '☀️ Pic de chaleur ce vendredi ! Venez vous rafraîchir chez nous avec notre sélection de boissons fraîches. -20% sur toute la carte froide. On vous attend ! 🍹 #Fraicheur #BonnePlanLocale',
    urgency: 'high',
  },
  {
    id: 'e2',
    date: 'Ce weekend',
    dateShort: 'Sam.',
    title: '🎪 Fête de quartier — Place du Marché',
    category: 'fete',
    emoji: '🎪',
    description: 'Festival de rue organisé par la mairie. +2 500 visiteurs attendus dans le secteur.',
    aiOpportunity: 'Visibilité maximale — mentionnez l\'événement pour capter l\'audience locale',
    postDraft: '🎪 La fête du quartier, c\'est ce weekend ! On fête ça avec vous 🎉 Passez nous voir Place du Marché — on prépare quelque chose de spécial pour l\'occasion. À tout de suite ! #FêteDeQuartier #Commerce Local',
    urgency: 'high',
  },
  {
    id: 'e3',
    date: 'Dimanche',
    dateShort: 'Dim.',
    title: '🏃 Semi-Marathon de la Ville',
    category: 'sport',
    emoji: '🏃',
    description: '1 800 coureurs attendus. Parcours passant devant plusieurs commerces.',
    aiOpportunity: 'Cibler les sportifs — offre récupération, hydratation, bravo aux participants',
    postDraft: '🏃‍♂️ Bravo à tous les participants du semi-marathon ! Vous avez été incroyables. Pour vous ressourcer après l\'effort, on vous accueille avec plaisir 💪 Boissons, snacks — vous l\'avez mérité ! #SemiMarathon #BravoAuxCoureurs',
    urgency: 'medium',
  },
  {
    id: 'e4',
    date: 'Lundi',
    dateShort: 'Lun.',
    title: '🛒 Marché hebdomadaire — Édition spéciale été',
    category: 'commerce',
    emoji: '🛒',
    description: 'Marché élargi avec 40 nouveaux exposants locaux. Forte affluence prévue.',
    aiOpportunity: 'Associez votre commerce à l\'économie locale — proximité & saisonnalité',
    postDraft: '🛒 Le grand marché d\'été, c\'est lundi matin ! Venez découvrir les producteurs locaux et profitez de la fraîcheur des produits de saison. On sera là aussi 😉 #MarchéLocal #ProducteursLocaux #ÉconomieDuTerroir',
    urgency: 'medium',
  },
  {
    id: 'e5',
    date: 'Mercredi',
    dateShort: 'Mer.',
    title: '🎵 Concert en plein air — Parc municipal',
    category: 'local',
    emoji: '🎵',
    description: 'Soirée musicale gratuite dès 19h au parc. Ambiance festive, familles et jeunes.',
    aiOpportunity: 'Prépublication avant-soirée — captez les sortants avant l\'événement',
    postDraft: '🎵 Concert en plein air ce mercredi soir ! L\'ambiance s\'annonce festive. Passez chez nous avant le spectacle pour faire le plein d\'énergie 🎶 On est ouverts jusqu\'à 20h. À tout à l\'heure ! #ConcertPleinAir #SoiréeEstivale',
    urgency: 'low',
  },
  {
    id: 'e6',
    date: 'Jeudi',
    dateShort: 'Jeu.',
    title: '🌦️ Risque d\'orages — Après-midi',
    category: 'meteo',
    emoji: '🌦️',
    description: 'Perturbations orageuses prévues entre 14h et 18h. Température chute de 10°.',
    aiOpportunity: 'Post réconfort — invitez à se mettre à l\'abri chez vous',
    postDraft: '🌦️ Orages cet après-midi ? Pas de panique, notre adresse est ouverte et chaleureuse ! Profitez d\'un bon moment au sec pendant que la météo se calme ☕ On vous accueille avec plaisir. #AbriTemporaire #PluieEtBonheur',
    urgency: 'low',
  },
];

const CATEGORY_CONFIG: Record<EventCategory, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  meteo: { label: 'Météo', color: '#D97706', bg: 'rgba(217,119,6,.1)', border: 'rgba(217,119,6,.25)', icon: <Sun size={12} /> },
  local: { label: 'Local', color: '#6359F8', bg: 'rgba(99,89,248,.1)', border: 'rgba(99,89,248,.25)', icon: <MapPin size={12} /> },
  sport: { label: 'Sport', color: '#16A34A', bg: 'rgba(22,163,74,.1)', border: 'rgba(22,163,74,.25)', icon: <Trophy size={12} /> },
  commerce: { label: 'Commerce', color: '#0EA5E9', bg: 'rgba(14,165,233,.1)', border: 'rgba(14,165,233,.25)', icon: <ShoppingBag size={12} /> },
  fete: { label: 'Fête', color: '#EC4899', bg: 'rgba(236,72,153,.1)', border: 'rgba(236,72,153,.25)', icon: <Music size={12} /> },
};

const URGENCY_CONFIG = {
  high: { label: '🔥 Urgent', color: '#DC2626', bg: 'rgba(220,38,38,.1)', border: 'rgba(220,38,38,.25)' },
  medium: { label: '⚡ Cette semaine', color: '#D97706', bg: 'rgba(217,119,6,.1)', border: 'rgba(217,119,6,.25)' },
  low: { label: '📌 À venir', color: '#6359F8', bg: 'rgba(99,89,248,.1)', border: 'rgba(99,89,248,.25)' },
};

function EventCard({
  event,
  onUsePost,
}: {
  event: LocalEvent;
  onUsePost: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const cat = CATEGORY_CONFIG[event.category];
  const urg = URGENCY_CONFIG[event.urgency];

  return (
    <div style={{
      background: 'hsl(var(--card))',
      border: `1.5px solid ${event.urgency === 'high' ? 'rgba(220,38,38,.2)' : 'hsl(var(--border))'}`,
      borderRadius: 16, overflow: 'hidden',
      transition: 'box-shadow .2s',
    }}
      className="hover:shadow-md"
    >
      {/* Main row */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', cursor: 'pointer' }}
      >
        {/* Day badge */}
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: cat.bg,
          border: `1px solid ${cat.border}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{event.emoji}</span>
          <span style={{ fontSize: '.58rem', color: cat.color, fontWeight: 700, marginTop: 2 }}>{event.dateShort}</span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: '.88rem', color: 'hsl(var(--foreground))' }}>{event.title}</span>
            <span style={{
              background: cat.bg, border: `1px solid ${cat.border}`, color: cat.color,
              borderRadius: 20, padding: '1px 8px', fontSize: '.65rem', fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', gap: 3,
            }}>
              {cat.icon} {cat.label}
            </span>
            <span style={{
              background: urg.bg, border: `1px solid ${urg.border}`, color: urg.color,
              borderRadius: 20, padding: '1px 8px', fontSize: '.65rem', fontWeight: 700,
            }}>
              {urg.label}
            </span>
          </div>
          {/* AI opportunity pill */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 5,
            background: 'rgba(99,89,248,.06)', borderRadius: 8, padding: '5px 10px',
          }}>
            <Sparkles size={11} style={{ color: '#6359F8', marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: '.74rem', color: '#6359F8', fontWeight: 600, lineHeight: 1.3 }}>
              {event.aiOpportunity}
            </span>
          </div>
        </div>

        <ChevronRight
          size={16}
          style={{
            color: 'hsl(var(--muted-foreground))', flexShrink: 0, marginTop: 2,
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform .2s',
          }}
        />
      </div>

      {/* Expanded: post draft */}
      {open && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid hsl(var(--border))' }}>
          <div style={{
            background: 'hsl(var(--muted))', borderRadius: 12, padding: '12px 14px', marginTop: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Sparkles size={13} style={{ color: '#6359F8' }} />
              <span style={{ fontSize: '.72rem', fontWeight: 700, color: '#6359F8', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                Brouillon prêt par l'IA
              </span>
            </div>
            <p style={{ fontSize: '.83rem', color: 'hsl(var(--foreground))', lineHeight: 1.55, marginBottom: 12 }}>
              {event.postDraft}
            </p>
            <button
              onClick={() => onUsePost(event.postDraft)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: '#6359F8', color: '#fff', border: 'none',
                borderRadius: 10, padding: '9px 16px',
                fontWeight: 700, fontSize: '.83rem', cursor: 'pointer',
                transition: 'opacity .2s',
              }}
              className="hover:opacity-90"
            >
              <Zap size={14} /> Utiliser ce post → Calendrier
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Weather strip ─────────────────────────────────────────────────────────────
function WeatherStrip() {
  const days = [
    { label: 'Auj.', emoji: '☀️', temp: '32°', icon: <Sun size={16} style={{ color: '#F59E0B' }} /> },
    { label: 'Dem.', emoji: '⛅', temp: '28°', icon: <Cloud size={16} style={{ color: '#94A3B8' }} /> },
    { label: 'Ven.', emoji: '🔥', temp: '34°', icon: <Sun size={16} style={{ color: '#EF4444' }} /> },
    { label: 'Sam.', emoji: '⛅', temp: '26°', icon: <Cloud size={16} style={{ color: '#94A3B8' }} /> },
    { label: 'Dim.', emoji: '🌦️', temp: '22°', icon: <Droplets size={16} style={{ color: '#6359F8' }} /> },
    { label: 'Lun.', emoji: '☀️', temp: '29°', icon: <Sun size={16} style={{ color: '#F59E0B' }} /> },
    { label: 'Mar.', emoji: '💨', temp: '24°', icon: <Wind size={16} style={{ color: '#64748B' }} /> },
  ];
  return (
    <div style={{
      display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4,
    }}>
      {days.map((d, i) => (
        <div key={i} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          background: i === 2 ? 'rgba(239,68,68,.08)' : 'hsl(var(--muted))',
          border: i === 2 ? '1.5px solid rgba(239,68,68,.25)' : '1px solid hsl(var(--border))',
          borderRadius: 12, padding: '10px 10px 8px', minWidth: 52, flexShrink: 0,
        }}>
          <span style={{ fontSize: '.65rem', color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>{d.label}</span>
          <span style={{ fontSize: '1.1rem' }}>{d.emoji}</span>
          <span style={{ fontSize: '.78rem', fontWeight: 800, color: i === 2 ? '#EF4444' : 'hsl(var(--foreground))' }}>{d.temp}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface CityCalendarTabProps {
  onUsePost?: (text: string) => void;
  city?: string;
}

export function CityCalendarTab({ onUsePost, city = 'La Rochelle' }: CityCalendarTabProps) {
  const [filter, setFilter] = useState<EventCategory | 'all'>('all');
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1200);
  };

  const filtered = filter === 'all' ? EVENTS : EVENTS.filter(e => e.category === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,89,248,.1) 0%, rgba(139,92,246,.05) 100%)',
        border: '1px solid rgba(99,89,248,.2)',
        borderRadius: 16, padding: '14px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,89,248,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={18} style={{ color: '#6359F8' }} />
          </div>
          <div>
            <p style={{ fontWeight: 800, fontSize: '.9rem', color: 'hsl(var(--foreground))', marginBottom: 1 }}>
              Calendrier de la Ville — {city}
            </p>
            <p style={{ fontSize: '.72rem', color: 'hsl(var(--muted-foreground))' }}>
              {EVENTS.filter(e => e.urgency === 'high').length} opportunités urgentes • {EVENTS.length} événements cette semaine
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(99,89,248,.1)', border: '1px solid rgba(99,89,248,.2)',
            color: '#6359F8', borderRadius: 8, padding: '7px 12px',
            fontSize: '.75rem', fontWeight: 600, cursor: 'pointer',
          }}
        >
          <RefreshCw size={13} style={{ animation: loading ? 'spin .7s linear infinite' : 'none' }} />
          Actualiser
        </button>
      </div>

      {/* Weather */}
      <div>
        <p style={{ fontSize: '.7rem', fontWeight: 700, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
          🌤 Météo 7 jours
        </p>
        <WeatherStrip />
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            background: filter === 'all' ? '#6359F8' : 'hsl(var(--muted))',
            border: `1.5px solid ${filter === 'all' ? '#6359F8' : 'hsl(var(--border))'}`,
            color: filter === 'all' ? '#fff' : 'hsl(var(--foreground))',
            borderRadius: 20, padding: '5px 14px', fontSize: '.78rem', fontWeight: 600,
            cursor: 'pointer', transition: 'all .15s',
          }}
        >
          Tous ({EVENTS.length})
        </button>
        {(Object.keys(CATEGORY_CONFIG) as EventCategory[]).map(cat => {
          const c = CATEGORY_CONFIG[cat];
          const count = EVENTS.filter(e => e.category === cat).length;
          if (!count) return null;
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: filter === cat ? c.color : 'hsl(var(--muted))',
                border: `1.5px solid ${filter === cat ? c.color : 'hsl(var(--border))'}`,
                color: filter === cat ? '#fff' : c.color,
                borderRadius: 20, padding: '5px 14px', fontSize: '.78rem', fontWeight: 600,
                cursor: 'pointer', transition: 'all .15s',
              }}
            >
              {c.icon} {c.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Event list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(event => (
          <EventCard
            key={event.id}
            event={event}
            onUsePost={onUsePost ?? (() => {})}
          />
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'hsl(var(--muted-foreground))' }}>
            <CalendarDays size={28} style={{ margin: '0 auto 10px', opacity: .3 }} />
            <p style={{ fontSize: '.85rem' }}>Aucun événement dans cette catégorie</p>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
