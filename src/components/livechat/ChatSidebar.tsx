/**
 * ChatSidebar — conversation list panel for the live chat feature.
 */
import { useState } from 'react';
import { useLiveChat, LiveConversation, ChatChannel, ConversationStatus } from '../../context/LiveChatContext';
import { cn } from '@/lib/utils';
import {
  MessageCircle, Globe, Search,
  Clock, AlertTriangle, CheckCircle2, ChevronDown,
} from 'lucide-react';
import { InstagramIcon, FacebookIcon } from '../icons/SocialIcons';

// ── Channel helpers ───────────────────────────────────────────────────────────

function channelIcon(channel: ChatChannel, size = 10) {
  switch (channel) {
    case 'website':   return <Globe size={size} />;
    case 'whatsapp':  return <MessageCircle size={size} />;
    case 'instagram': return <InstagramIcon className={`w-${size === 10 ? '2.5' : '3'} h-${size === 10 ? '2.5' : '3'}`} />;
    case 'facebook':  return <FacebookIcon className={`w-${size === 10 ? '2.5' : '3'} h-${size === 10 ? '2.5' : '3'}`} />;
  }
}

function channelColor(channel: ChatChannel) {
  switch (channel) {
    case 'website':   return 'bg-teal-500 text-white';
    case 'whatsapp':  return 'bg-[#25D366] text-white';
    case 'instagram': return 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white';
    case 'facebook':  return 'bg-[#1877F2] text-white';
  }
}

function channelLabel(channel: ChatChannel) {
  switch (channel) {
    case 'website':   return 'Site web';
    case 'whatsapp':  return 'WhatsApp';
    case 'instagram': return 'Instagram';
    case 'facebook':  return 'Facebook';
  }
}

function channelBadge(channel: ChatChannel) {
  switch (channel) {
    case 'website':   return 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-800/50';
    case 'whatsapp':  return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50';
    case 'instagram': return 'bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800/50';
    case 'facebook':  return 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/50';
  }
}

function priorityDot(priority: LiveConversation['priority']) {
  if (priority === 'urgent') return 'bg-red-500';
  if (priority === 'normal') return 'bg-amber-400';
  return 'bg-muted-foreground/30';
}

function statusIcon(status: ConversationStatus) {
  if (status === 'resolved') return <CheckCircle2 size={10} className="text-emerald-500" />;
  if (status === 'pending')  return <Clock size={10} className="text-amber-500" />;
  return null;
}

// ── Filter tabs ───────────────────────────────────────────────────────────────

const STATUS_FILTERS: { id: ConversationStatus | 'all'; label: string }[] = [
  { id: 'all',      label: 'Tous' },
  { id: 'open',     label: 'Ouverts' },
  { id: 'pending',  label: 'En attente' },
  { id: 'resolved', label: 'Résolus' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function ChatSidebar() {
  const { conversations, selectedId, setSelectedId, markAllRead, totalUnread } = useLiveChat();
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | 'all'>('all');
  const [channelFilter, setChannelFilter] = useState<ChatChannel | 'all'>('all');
  const [channelOpen, setChannelOpen]   = useState(false);

  const CHANNEL_FILTERS: { id: ChatChannel | 'all'; label: string }[] = [
    { id: 'all',       label: 'Tous canaux' },
    { id: 'website',   label: 'Site web' },
    { id: 'whatsapp',  label: 'WhatsApp' },
    { id: 'instagram', label: 'Instagram' },
    { id: 'facebook',  label: 'Facebook' },
  ];

  const filtered = conversations
    .filter(c => statusFilter === 'all' || c.status === statusFilter)
    .filter(c => channelFilter === 'all' || c.channel === channelFilter)
    .filter(c => !search || c.clientName.toLowerCase().includes(search.toLowerCase()) || c.preview.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
      return b.lastTimestamp - a.lastTimestamp;
    });

  const handleSelect = (id: string) => {
    setSelectedId(id);
    markAllRead(id);
  };

  return (
    <div className="flex flex-col h-full border-r border-border bg-background">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle size={16} className="text-primary" />
            <h2 className="text-sm font-extrabold text-foreground">Conversations</h2>
            {totalUnread > 0 && (
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-extrabold shadow">
                {totalUnread}
              </span>
            )}
          </div>
          {/* Channel filter dropdown */}
          <div className="relative">
            <button
              onClick={() => setChannelOpen(v => !v)}
              className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground bg-muted rounded-lg px-2 py-1 transition-colors"
            >
              {CHANNEL_FILTERS.find(f => f.id === channelFilter)?.label}
              <ChevronDown size={10} />
            </button>
            {channelOpen && (
              <div className="absolute right-0 top-full mt-1 bg-background border border-border rounded-xl shadow-lg z-20 overflow-hidden min-w-[120px]">
                {CHANNEL_FILTERS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => { setChannelFilter(f.id); setChannelOpen(false); }}
                    className={cn('w-full text-left px-3 py-2 text-[11px] hover:bg-muted transition-colors', channelFilter === f.id ? 'font-bold text-primary bg-primary/5' : 'text-foreground')}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-border bg-background rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/40 text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Status tabs */}
        <div className="flex gap-1">
          {STATUS_FILTERS.map(f => {
            const count = f.id === 'all' ? conversations.length : conversations.filter(c => c.status === f.id).length;
            return (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={cn(
                  'flex-1 text-[10px] font-bold rounded-lg py-1 transition-all',
                  statusFilter === f.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {f.label}
                {count > 0 && <span className="ml-0.5 opacity-70">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <MessageCircle size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs">Aucune conversation trouvée.</p>
          </div>
        ) : (
          filtered.map(conv => (
            <button
              key={conv.id}
              onClick={() => handleSelect(conv.id)}
              className={cn(
                'w-full text-left px-4 py-3.5 border-b border-border transition-all hover:bg-muted/30 relative',
                selectedId === conv.id && 'bg-primary/5 border-l-2 border-l-primary',
                conv.priority === 'urgent' && conv.status !== 'resolved' && 'bg-red-50/40 dark:bg-red-950/10'
              )}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold shadow-sm', channelColor(conv.channel))}>
                    {conv.clientInitials}
                  </div>
                  {conv.isClientOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={cn('text-xs font-bold truncate', conv.unreadCount > 0 ? 'text-foreground' : 'text-foreground/80')}>
                      {conv.clientName}
                    </span>
                    {statusIcon(conv.status)}
                    <span className="ml-auto text-[9px] text-muted-foreground shrink-0">{conv.lastTime}</span>
                  </div>

                  <div className="flex items-center gap-1 mb-1">
                    <span className={cn('flex items-center gap-0.5 text-[9px] font-bold border rounded-full px-1.5 py-0.5', channelBadge(conv.channel))}>
                      {channelIcon(conv.channel, 8)}
                      {channelLabel(conv.channel)}
                    </span>
                    {conv.priority === 'urgent' && (
                      <span className="flex items-center gap-0.5 text-[9px] font-extrabold bg-red-100 text-red-600 border border-red-200 dark:bg-red-950/30 dark:text-red-400 rounded-full px-1.5 py-0.5">
                        <AlertTriangle size={7} />Urgent
                      </span>
                    )}
                    {conv.isClientTyping && (
                      <span className="text-[9px] text-emerald-600 font-semibold animate-pulse">écrit…</span>
                    )}
                  </div>

                  <p className={cn('text-[11px] truncate', conv.unreadCount > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                    {conv.preview}
                  </p>
                </div>

                {/* Priority dot + unread badge */}
                <div className="flex flex-col items-center gap-1.5 shrink-0 pt-0.5">
                  <div className={cn('w-1.5 h-1.5 rounded-full', priorityDot(conv.priority))} />
                  {conv.unreadCount > 0 && (
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[8px] font-extrabold">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
