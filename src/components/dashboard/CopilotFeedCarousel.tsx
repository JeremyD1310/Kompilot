import { useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Star, MessageSquare, Globe, Zap, BarChart2, CalendarDays } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useEstablishment } from '../../context/EstablishmentContext';

// ── Types ─────────────────────────────────────────────────────────────────────

type BadgeType = 'Gain Rapide' | 'Optimisation G.E.O.' | 'Urgence Avis' | 'Tendance' | 'ROI Direct' | 'Action IA';

interface FeedCard {
  id: string;
  badge: BadgeType;
  title: string;
  description: string;
  cta: string;
  href: string;
  icon: React.ElementType;
}

// ── Badge Styles ──────────────────────────────────────────────────────────────

const BADGE_STYLES: Record<BadgeType, { bg: string; text: string; dot: string }> = {
  'Gain Rapide':        { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'Optimisation G.E.O.': { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  'Urgence Avis':       { bg: 'bg-red-50',      text: 'text-red-700',    dot: 'bg-red-500'    },
  'Tendance':           { bg: 'bg-violet-50',   text: 'text-violet-700', dot: 'bg-violet-500' },
  'ROI Direct':         { bg: 'bg-amber-50',    text: 'text-amber-700',  dot: 'bg-amber-500'  },
  'Action IA':          { bg: 'bg-teal-50',     text: 'text-teal-700',   dot: 'bg-teal-500'   },
};

// ── Card Icon Background ───────────────────────────────────────────────────────

const ICON_STYLES: Record<BadgeType, { bg: string; icon: string }> = {
  'Gain Rapide':        { bg: 'bg-emerald-100', icon: 'text-emerald-600' },
  'Optimisation G.E.O.': { bg: 'bg-blue-100',  icon: 'text-blue-600'   },
  'Urgence Avis':       { bg: 'bg-red-100',     icon: 'text-red-600'    },
  'Tendance':           { bg: 'bg-violet-100',  icon: 'text-violet-600' },
  'ROI Direct':         { bg: 'bg-amber-100',   icon: 'text-amber-600'  },
  'Action IA':          { bg: 'bg-teal-100',    icon: 'text-teal-600'   },
};

// ── Cards Data (static AI-like recommendations) ───────────────────────────────

const BASE_CARDS: FeedCard[] = [
  {
    id: 'reviews-auto',
    badge: 'Gain Rapide',
    title: 'Automatise tes demandes d\'avis',
    description: 'L\'IA détecte que tu n\'as reçu aucun nouvel avis cette semaine. Envoie une campagne WhatsApp à tes 50 derniers clients pour déclencher +12 avis Google en 48h.',
    cta: 'Lancer la campagne',
    href: '/inbox',
    icon: Star,
  },
  {
    id: 'geo-keywords',
    badge: 'Optimisation G.E.O.',
    title: 'Mots-clés manquants dans tes posts',
    description: 'ChatGPT et Gemini citent tes concurrents 3× plus souvent car ils utilisent "ambiance chaleureuse" et "service rapide". Génère un post ciblé avec ces termes dès maintenant.',
    cta: 'Générer le post',
    href: '/cockpit',
    icon: Globe,
  },
  {
    id: 'unanswered',
    badge: 'Urgence Avis',
    title: 'Passe à la vitesse supérieure',
    description: '3 avis Google restent sans réponse depuis plus de 48h. Les établissements qui répondent en moins de 24h gagnent en moyenne +19% de visibilité locale sur Maps.',
    cta: 'Répondre maintenant',
    href: '/inbox',
    icon: MessageSquare,
  },
  {
    id: 'schedule-week',
    badge: 'Action IA',
    title: 'Planifie ta semaine en 1 clic',
    description: 'Ton calendrier est vide pour les 7 prochains jours. L\'IA peut générer 5 posts adaptés à ta saison, ton secteur et tes mots-clés G.E.O. en moins de 30 secondes.',
    cta: 'Générer le planning',
    href: '/calendar',
    icon: CalendarDays,
  },
  {
    id: 'trending-topic',
    badge: 'Tendance',
    title: 'Sujet viral en hausse +340%',
    description: 'Le thème "expérience locale authentique" explose sur Instagram cette semaine dans ton secteur. Publie maintenant pour capter l\'audience en pic d\'intérêt.',
    cta: 'Voir la tendance',
    href: '/cockpit',
    icon: BarChart2,
  },
  {
    id: 'roi-whatsapp',
    badge: 'ROI Direct',
    title: 'Flash SMS haute saison détecté',
    description: 'L\'IA a identifié une opportunité de revenu estimé à +850 € cette semaine. Un SMS flash à tes 120 abonnés fidèles peut déclencher 12 réservations supplémentaires.',
    cta: 'Créer le SMS flash',
    href: '/inbox',
    icon: Zap,
  },
];

// ── Card Component ─────────────────────────────────────────────────────────────

function FeedCardItem({ card }: { card: FeedCard }) {
  const navigate = useNavigate();
  const badge = BADGE_STYLES[card.badge];
  const iconStyle = ICON_STYLES[card.badge];
  const Icon = card.icon;

  return (
    <div
      className="flex-none w-[280px] sm:w-[300px] rounded-2xl border border-border bg-card p-4 flex flex-col gap-3 hover:border-primary/30 hover:shadow-lg cursor-pointer active:scale-[0.98] transition-all duration-200 group"
      onClick={() => navigate({ to: card.href as any })}
    >
      {/* Badge */}
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${badge.bg} ${badge.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
          {card.badge}
        </span>
      </div>

      {/* Icon + Title */}
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl ${iconStyle.bg} flex items-center justify-center shrink-0 mt-0.5`}>
          <Icon size={17} className={iconStyle.icon} strokeWidth={2} />
        </div>
        <p className="text-sm font-extrabold text-foreground leading-snug">{card.title}</p>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed flex-1">{card.description}</p>

      {/* CTA */}
      <div className="flex items-center justify-between mt-auto pt-1 border-t border-border/50">
        <span className="text-xs font-bold text-primary group-hover:underline">{card.cta}</span>
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <ArrowRight size={13} className="text-primary group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function CopilotFeedCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { activeEstablishment } = useEstablishment();

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' });
  };

  // Personalize first card title based on establishment
  const cards = BASE_CARDS.map((c, i) =>
    i === 1
      ? { ...c, description: c.description.replace('ChatGPT et Gemini citent tes concurrents', `ChatGPT et Gemini citent des concurrents de ${activeEstablishment.name}`) }
      : c
  );

  return (
    <div className="space-y-3" data-tour="copilot-feed-carousel">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h2 className="text-sm font-bold text-foreground">Recommandations de votre Copilote</h2>
          <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            IA active
          </span>
        </div>

        {/* Scroll controls */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => scroll('left')}
            className="w-7 h-7 rounded-lg border border-border bg-card flex items-center justify-center hover:border-primary/40 hover:bg-primary/5 transition-colors"
          >
            <ChevronLeft size={14} className="text-muted-foreground" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-7 h-7 rounded-lg border border-border bg-card flex items-center justify-center hover:border-primary/40 hover:bg-primary/5 transition-colors"
          >
            <ChevronRight size={14} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {cards.map(card => (
          <FeedCardItem key={card.id} card={card} />
        ))}
      </div>

      {/* Scroll hint on mobile */}
      <p className="text-[10px] text-muted-foreground/60 sm:hidden text-center">← Faites défiler pour voir plus →</p>
    </div>
  );
}
