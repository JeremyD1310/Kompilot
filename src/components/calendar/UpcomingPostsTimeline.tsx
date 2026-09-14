/**
 * UpcomingPostsTimeline — Shows the next 7 days of scheduled posts
 * as a compact visual timeline in the calendar sidebar.
 */
import { useMemo } from 'react';
import { format, addDays, startOfToday, parseISO, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarClock, Camera, Users, Globe, CheckCircle2, Clock, FileEdit } from 'lucide-react';
import type { ScheduledPost } from './CreatePostModal';

interface UpcomingPostsTimelineProps {
  posts: ScheduledPost[];
  onPostClick?: (post: ScheduledPost) => void;
}

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  instagram: <Camera size={11} className="text-pink-500" />,
  facebook:  <Users size={11} className="text-blue-500" />,
  linkedin:  <Globe size={11} className="text-blue-700" />,
  website:   <Globe size={11} className="text-orange-500" />,
  tiktok:    <span className="text-[10px] font-black text-foreground">TT</span>,
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  approved: { label: 'Approuvé', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: <CheckCircle2 size={11} /> },
  pending:  { label: 'En attente', color: 'text-amber-700 bg-amber-50 border-amber-200',   icon: <Clock size={11} /> },
  draft:    { label: 'Brouillon', color: 'text-slate-500 bg-slate-50 border-slate-200',   icon: <FileEdit size={11} /> },
};

export function UpcomingPostsTimeline({ posts, onPostClick }: UpcomingPostsTimelineProps) {
  const today = startOfToday();
  
  const upcomingDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(today, i);
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayPosts = posts.filter(p => {
        try { return isSameDay(parseISO(p.date), day); } catch { return false; }
      });
      return { day, dayStr, posts: dayPosts };
    });
  }, [posts, today]);

  const totalUpcoming = upcomingDays.reduce((sum, d) => sum + d.posts.length, 0);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-2">
          <CalendarClock size={15} className="text-primary" />
          <p className="font-bold text-sm text-foreground">Publications à venir</p>
          {totalUpcoming > 0 && (
            <span className="ml-auto text-[11px] font-bold bg-primary text-primary-foreground rounded-full px-2 py-0.5">
              {totalUpcoming}
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">7 prochains jours</p>
      </div>

      <div className="divide-y divide-border/60">
        {upcomingDays.map(({ day, posts: dayPosts }) => {
          const isToday = isSameDay(day, today);
          const dayLabel = isToday ? "Aujourd'hui" : format(day, 'EEE d MMM', { locale: fr });
          
          return (
            <div key={day.toISOString()} className={`px-3 py-2.5 ${isToday ? 'bg-primary/3' : ''}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[11px] font-bold capitalize ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                  {dayLabel}
                </span>
                {isToday && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                {dayPosts.length === 0 && (
                  <span className="text-[10px] text-muted-foreground/60 ml-auto">Aucune publication</span>
                )}
              </div>
              
              {dayPosts.length > 0 && (
                <div className="space-y-1.5">
                  {dayPosts.map(post => {
                    const status = STATUS_CONFIG[post.status ?? 'draft'];
                    return (
                      <button
                        key={post.id}
                        type="button"
                        onClick={() => onPostClick?.(post)}
                        className="w-full text-left rounded-lg border border-border/70 bg-background hover:bg-muted/50 px-2.5 py-2 transition-colors group"
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-foreground font-medium leading-snug truncate group-hover:text-primary transition-colors">
                              {post.text.slice(0, 60)}{post.text.length > 60 ? '…' : ''}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              {post.time && (
                                <span className="text-[10px] text-muted-foreground font-mono">{post.time}</span>
                              )}
                              <div className="flex items-center gap-0.5">
                                {post.channels?.slice(0, 3).map(ch => (
                                  <span key={ch}>{CHANNEL_ICONS[ch] ?? null}</span>
                                ))}
                                {(post.channels?.length ?? 0) > 3 && (
                                  <span className="text-[9px] text-muted-foreground">+{post.channels.length - 3}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold rounded-full border px-1.5 py-0.5 ${status.color}`}>
                            {status.icon}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {totalUpcoming === 0 && (
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">Aucune publication planifiée pour les 7 prochains jours.</p>
          <p className="text-[11px] text-primary mt-1">Cliquez sur un jour pour en créer une ↑</p>
        </div>
      )}
    </div>
  );
}
