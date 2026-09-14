/**
 * RecentInboxInteractions — Affiche les dernières interactions de la boîte de réception
 * sur le dashboard principal. Compact, cliquable, avec indicateurs visuels.
 */

import { Link } from '@tanstack/react-router';
import { ArrowRight, Star, MessageSquare, Inbox, MessageCircle } from 'lucide-react';
import { useInboxMessages } from '../../hooks/useInboxMessages';
import { cn } from '../../lib/utils';


// ── Message Row ───────────────────────────────────────────────────────────────

interface MsgRowProps {
  senderName: string;
  subject: string;
  body: string;
  isRead: boolean;
  date?: string;
  isStarred?: boolean;
  channel?: string;
}

function MsgRow({ senderName, subject, body, isRead, date, isStarred, channel }: MsgRowProps) {
  const channelColor: Record<string, string> = {
    website: 'bg-teal-100 text-teal-700',
    instagram: 'bg-pink-100 text-pink-700',
    linkedin: 'bg-blue-100 text-blue-700',
    facebook: 'bg-blue-100 text-blue-700',
    google: 'bg-amber-100 text-amber-700',
  };

  const initials = senderName
    .split(' ')
    .map(w => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');

  const colorMap = ['bg-teal-500', 'bg-violet-500', 'bg-rose-500', 'bg-amber-500', 'bg-blue-500'];
  const colorIdx = senderName.charCodeAt(0) % colorMap.length;

  return (
    <div className={cn(
      'flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer',
      !isRead && 'bg-primary/5'
    )}>
      {/* Avatar */}
      <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5', colorMap[colorIdx])}>
        {initials || '?'}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={cn('text-xs font-semibold text-foreground leading-none', !isRead && 'font-bold')}>
            {senderName}
          </span>
          {isStarred && <Star size={10} className="text-amber-400 shrink-0" fill="currentColor" />}
          {channel && channelColor[channel] && (
            <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full', channelColor[channel])}>
              {channel}
            </span>
          )}
        </div>
        <p className="text-[11px] text-foreground/70 mt-0.5 line-clamp-1">{subject}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 leading-relaxed">{body}</p>
      </div>

      {/* Right: time + unread dot */}
      <div className="shrink-0 flex flex-col items-end gap-1 min-w-[48px]">
        {date && <span className="text-[9px] text-muted-foreground whitespace-nowrap">{date}</span>}
        {!isRead && (
          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function RecentInboxInteractions() {
  const { messages: dbMessages, isLoading, messagesError } = useInboxMessages();

  // The dashboard uses the same remote inbox source as /inbox; no fixture fallback.
  const messages = dbMessages;

  // Sort by date (most recent first) and take 5
  const sorted = [...messages]
    .sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db_ = b.date ? new Date(b.date).getTime() : 0;
      return db_ - da;
    })
    .slice(0, 5);

  const unreadCount = messages.filter(m => !m.isRead).length;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="relative w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
            <Inbox size={14} className="text-primary" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">Interactions récentes</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {unreadCount > 0 ? `${unreadCount} message${unreadCount > 1 ? 's' : ''} non lu${unreadCount > 1 ? 's' : ''}` : 'Tout est lu ✓'}
            </p>
          </div>
        </div>
        <Link to="/inbox">
          <span className="text-[11px] font-semibold text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors">
            Voir tout <ArrowRight size={11} />
          </span>
        </Link>
      </div>

      {/* Interaction type summary */}
      <div className="flex items-center gap-0 border-b border-border bg-muted/20">
        {[
          { icon: <MessageSquare size={12} />, label: 'Messages', count: messages.filter(m => !m.channel || m.channel === 'website').length, color: 'text-teal-600' },
          { icon: <Star size={12} />, label: 'Avis', count: 0, color: 'text-amber-500' },
          { icon: <MessageCircle size={12} />, label: 'Commentaires', count: 0, color: 'text-violet-600' },
        ].map((item, i) => (
          <div key={i} className="flex-1 flex items-center justify-center gap-1.5 py-2 border-r border-border last:border-r-0">
            <span className={item.color}>{item.icon}</span>
            <span className="text-[10px] font-semibold text-foreground tabular-nums">{item.count}</span>
            <span className="text-[9px] text-muted-foreground hidden sm:inline">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Messages list */}
      {isLoading ? (
        <div className="space-y-2 p-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-7 h-7 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-2.5 bg-muted rounded w-2/5" />
                <div className="h-2 bg-muted rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : messagesError ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <Inbox size={20} className="text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground">Impossible de synchroniser les messages</p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <Inbox size={20} className="text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground text-center">Aucun message synchronisé</p>
        </div>
      ) : (
        <div>
          {sorted.map(msg => (
            <MsgRow
              key={msg.id}
              senderName={msg.senderName}
              subject={msg.subject}
              body={msg.body}
              isRead={msg.isRead}
              date={msg.date}
              isStarred={msg.isStarred}
              channel={msg.channel}
            />
          ))}
        </div>
      )}
    </div>
  );
}
