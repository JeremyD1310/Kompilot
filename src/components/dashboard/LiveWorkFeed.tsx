import { Badge, Card } from '@blinkdotnew/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { useUserProfile } from '../../context/UserProfileContext';
import { Sparkles, CalendarDays, ChevronRight } from 'lucide-react';
import { VisualStudioModal } from '../cockpit/VisualStudioModal';
import { useScheduledPosts } from '../../lib/scheduledPostsStore';
import { useActivityFeed } from '../../hooks/useActivityFeed';
import { parseISO, isFuture, isToday } from 'date-fns';
import { Link } from '@tanstack/react-router';

interface LocalEvent {
  emoji: string;
  name: string;
  date: string;
  impact: 'high' | 'medium';
  strategy: string;
}

const LOCAL_EVENTS: LocalEvent[] = [
  { emoji: '⚽', name: 'Match de Ligue 1 — Stade à proximité', date: 'Ce soir 20h45', impact: 'high', strategy: 'Activer "Menu Supporters" + coupon demi-temps -10%' },
  { emoji: '🎪', name: 'Marché de Noël du quartier', date: 'Ce week-end', impact: 'high', strategy: 'Publier offre "Découverte locale" + horaires étendus' },
  { emoji: '🎶', name: 'Concert en plein air — Parc municipal', date: 'Samedi 19h', impact: 'medium', strategy: 'Story Instagram "Avant le concert, passez chez nous !"' },
  { emoji: '🏃', name: 'Marathon de la Ville — Course passage proche', date: 'Dimanche 9h', impact: 'medium', strategy: 'Post "Ravitaillement des sportifs" + ouverture 7h30' },
];

// Contextual static fallbacks shown when no real activity is available
const STATIC_FEED_ITEMS = [
  { agent: 'Agent Créatif', time: 'Il y a 5 min', text: 'Coupon flash pour surstock détecté. Visuel publicitaire prêt à générer.', type: 'creatif' },
  { agent: 'Agent Veille', time: 'Il y a 4 min', text: 'Analyse concurrents du quartier terminée. 3 failles détectées.', type: 'veille' },
  { agent: 'Agent Contenu', time: 'Il y a 12 min', text: 'Post G.E.O. rédigé pour "Offre midi" en attente de validation.', type: 'contenu' },
  { agent: 'Agent E-Réputation', time: 'Il y a 28 min', text: 'Réponse préparée pour l\'avis 4★ de Marie L.', type: 'erep' },
  { agent: 'Agent Veille', time: 'Il y a 1h', text: 'Scan mots-clés GEO locaux terminé pour le quartier.', type: 'veille' },
  { agent: 'Agent Contenu', time: 'Il y a 2h', text: 'Structure FAQ mise à jour pour extractibilité Siri/Google Assistant.', type: 'contenu' },
];

const AGENT_STYLES = {
  veille: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  contenu: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
  erep: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  creatif: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  event: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
  msg: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  post: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
};

function EventAlertCard({ event, onGenerateVisual }: { event: LocalEvent; onGenerateVisual?: (context: { eventName: string; suggestion: string }) => void }) {
  return (
    <div className="flex flex-col gap-1.5 pb-3 border-b border-orange-200/30 last:border-0">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-0 px-2 h-5 rounded-md">
          🗓️ Événement Local
          {event.impact === 'high' && (
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          )}
        </span>
        <span className="text-[10px] font-medium text-muted-foreground">{event.date}</span>
      </div>
      <p className="text-xs text-foreground/90 leading-tight">
        {event.emoji} <strong>{event.name}</strong> détecté à proximité
      </p>
      <div className="flex items-start gap-1.5 mt-0.5">
        <span className="text-[10px] font-bold text-orange-600 shrink-0 mt-0.5">→ IA :</span>
        <p className="text-[10px] text-muted-foreground leading-tight">{event.strategy}</p>
      </div>
      <button
        onClick={() => onGenerateVisual?.({ eventName: event.name, suggestion: event.strategy })}
        className="mt-2 flex items-center gap-1.5 text-[10px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-3 py-1.5 transition-colors w-fit"
      >
        <Sparkles size={10} />
        Générer le visuel optimisé
      </button>
    </div>
  );
}

export function LiveWorkFeed() {
  const { followLocalEvents } = useUserProfile();
  const [visualStudioOpen, setVisualStudioOpen] = useState(false);
  const [visualContext, setVisualContext] = useState<{ eventName?: string; suggestion?: string }>({});
  const { posts } = useScheduledPosts();
  const { items: activityItems } = useActivityFeed();

  const scheduledCount = useMemo(() => {
    return posts.filter(p => {
      try {
        const d = parseISO(p.date);
        return (isFuture(d) || isToday(d)) && (p.status === 'Planifié' || p.status === 'Approuvé');
      } catch { return false; }
    }).length;
  }, [posts]);

  // Merge real activity items from DB with static contextual items
  // Real items (messages, posts from DB) come first, then static contextual ones as fill
  const feedItems = useMemo(() => {
    const realItems = activityItems
      .filter(item => item.id.startsWith('msg-') || item.id.startsWith('post-'))
      .map(item => {
        if (item.id.startsWith('msg-')) {
          return {
            agent: 'Boîte de réception',
            time: item.time,
            text: item.text,
            type: 'msg' as const,
            isReal: true,
          };
        }
        return {
          agent: 'Agent Contenu',
          time: item.time,
          text: item.text,
          type: 'post' as const,
          isReal: true,
        };
      });

    // Fill remaining slots with static contextual items (up to 6 total)
    const staticFill = STATIC_FEED_ITEMS.slice(0, Math.max(0, 6 - realItems.length));
    return [...realItems, ...staticFill];
  }, [activityItems]);

  const handleOpenStudio = (context: { eventName: string; suggestion: string }) => {
    setVisualContext(context);
    setVisualStudioOpen(true);
  };

  return (
    <Card className="p-5 bg-card border-border shadow-sm flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          Le Copilote travaille pour vous
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </h3>
        {/* Live scheduled post count badge */}
        <Link to="/calendar" className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors group">
          <CalendarDays size={12} className="text-primary" />
          <span className={scheduledCount > 0 ? 'text-primary font-bold' : ''}>
            {scheduledCount} post{scheduledCount !== 1 ? 's' : ''} planifié{scheduledCount !== 1 ? 's' : ''}
          </span>
          <ChevronRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto max-h-64 scrollbar-thin scrollbar-thumb-border pr-2">
        <div className="space-y-3">
          {followLocalEvents && LOCAL_EVENTS.slice(0, 2).map((event, index) => (
            <motion.div
              key={`event-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
            >
              <EventAlertCard event={event} onGenerateVisual={handleOpenStudio} />
            </motion.div>
          ))}
          {feedItems.map((item, index) => (
            <motion.div
              key={`feed-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
              className="group flex flex-col gap-1.5 pb-3 border-b border-border/50 last:border-0"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] font-bold border-0 px-2 h-5 rounded-md ${AGENT_STYLES[item.type as keyof typeof AGENT_STYLES]}`}
                  >
                    {item.agent}
                  </Badge>
                  {(item as any).isReal && (
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" title="Données réelles" />
                  )}
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">{item.time}</span>
              </div>
              <p className="text-xs text-foreground/90 leading-tight">
                {item.text}
              </p>
              {item.type === 'creatif' && (
                <button
                  onClick={() => handleOpenStudio({ eventName: "Agent Créatif", suggestion: item.text })}
                  className="mt-1 flex items-center gap-1.5 text-[10px] font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-lg px-3 py-1.5 transition-colors w-fit"
                >
                  <Sparkles size={10} />
                  Générer le visuel
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {visualStudioOpen && (
          <VisualStudioModal 
            open={visualStudioOpen} 
            onClose={() => setVisualStudioOpen(false)} 
            context={visualContext} 
          />
        )}
      </AnimatePresence>
    </Card>
  );
}
