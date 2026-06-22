import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageSquare, ChevronRight, Clock, MailCheck, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InboxMessage, Reply } from './inboxData';
import { ChannelIcon, ChannelBadge } from './ChannelIcon';
import { useDebounce } from '../../hooks/useDebounce';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Conversation {
  contactName: string;
  contactHandle: string;
  channel: InboxMessage['channel'];
  messages: InboxMessage[];
  lastDate: string;
  unreadCount: number;
  totalReplies: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function groupByContact(messages: InboxMessage[]): Conversation[] {
  const map = new Map<string, Conversation>();

  for (const msg of messages) {
    const key = `${msg.senderHandle}::${msg.channel}`;
    if (!map.has(key)) {
      map.set(key, {
        contactName: msg.senderName,
        contactHandle: msg.senderHandle,
        channel: msg.channel,
        messages: [],
        lastDate: msg.date,
        unreadCount: 0,
        totalReplies: 0,
      });
    }
    const conv = map.get(key)!;
    conv.messages.push(msg);
    if (!msg.isRead) conv.unreadCount++;
    conv.totalReplies += msg.replies.length;
    // Keep latest date (simplistic: first message we see that is "today")
    if (msg.date.includes('Aujourd') || (!conv.lastDate.includes('Aujourd') && msg.date.includes('Hier'))) {
      conv.lastDate = msg.date;
    }
  }

  // Sort by unread first, then by recency
  return Array.from(map.values()).sort((a, b) => {
    if (b.unreadCount !== a.unreadCount) return b.unreadCount - a.unreadCount;
    return 0;
  });
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function ContactAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const sizeClass = size === 'sm' ? 'w-7 h-7 text-xs' : size === 'lg' ? 'w-11 h-11 text-sm' : 'w-9 h-9 text-xs';
  // Generate consistent color from name
  const hue = name.charCodeAt(0) * 137.5 % 360;
  return (
    <div
      className={cn('rounded-full flex items-center justify-center font-bold shrink-0 text-white', sizeClass)}
      style={{ background: `hsl(${hue}, 55%, 52%)` }}
    >
      {initials}
    </div>
  );
}

// ── Message bubble in thread ──────────────────────────────────────────────────

function ThreadMessage({ msg, contactName }: { msg: InboxMessage; contactName: string }) {
  const [expanded, setExpanded] = useState(false);
  const hasReplies = msg.replies.length > 0;

  return (
    <div className="space-y-2">
      {/* Original message */}
      <div className="flex items-start gap-2.5">
        <ContactAvatar name={contactName} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <ChannelBadge channel={msg.channel} />
            <span className="text-[11px] text-muted-foreground">{msg.date}</span>
            {!msg.isRead && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
          </div>
          <div className="text-xs font-semibold text-foreground mb-1">{msg.subject}</div>
          <div className="bg-muted/60 rounded-xl rounded-tl-none px-3 py-2.5 text-xs text-foreground leading-relaxed border border-border/40 whitespace-pre-line">
            {msg.body.length > 200 && !expanded ? (
              <>
                {msg.body.slice(0, 200)}…{' '}
                <button onClick={() => setExpanded(true)} className="text-primary font-medium hover:underline">
                  Voir plus
                </button>
              </>
            ) : (
              <>
                {msg.body}
                {msg.body.length > 200 && (
                  <button onClick={() => setExpanded(false)} className="block text-primary font-medium hover:underline mt-1 text-[11px]">
                    Réduire
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {hasReplies && (
        <div className="ml-9 space-y-2 border-l-2 border-primary/20 pl-3">
          {msg.replies.map((reply: Reply) => (
            <div key={reply.id} className={cn('flex items-start gap-2', reply.from === 'me' ? 'flex-row-reverse' : '')}>
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                reply.from === 'me' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground border border-border'
              )}>
                {reply.from === 'me' ? 'Moi' : contactName.slice(0, 1)}
              </div>
              <div className={cn('flex-1 min-w-0', reply.from === 'me' && 'flex flex-col items-end')}>
                <span className="text-[10px] text-muted-foreground mb-1 block">{reply.date}</span>
                <div className={cn(
                  'px-3 py-2 rounded-xl text-xs leading-relaxed max-w-[90%] border',
                  reply.from === 'me'
                    ? 'bg-primary text-primary-foreground rounded-tr-none border-primary/20'
                    : 'bg-secondary/60 text-foreground rounded-tl-none border-border/40'
                )}>
                  {reply.text}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Conversation card (list item) ─────────────────────────────────────────────

function ConversationCard({
  conv,
  isSelected,
  onClick,
}: {
  conv: Conversation;
  isSelected: boolean;
  onClick: () => void;
}) {
  const lastMsg = conv.messages[conv.messages.length - 1];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3 flex items-start gap-3 transition-colors border-b border-border/50 last:border-b-0',
        isSelected ? 'bg-primary/8 border-l-2 border-l-primary' : 'hover:bg-muted/50',
        conv.unreadCount > 0 && !isSelected && 'bg-primary/[0.03]'
      )}
    >
      <div className="relative shrink-0">
        <ContactAvatar name={conv.contactName} />
        <div className="absolute -bottom-0.5 -right-0.5">
          <ChannelIcon channel={conv.channel} size="sm" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className={cn('text-sm truncate', conv.unreadCount > 0 ? 'font-bold text-foreground' : 'font-medium text-foreground/80')}>
            {conv.contactName}
          </span>
          <span className="text-[11px] text-muted-foreground shrink-0">{conv.lastDate}</span>
        </div>
        <p className={cn('text-xs truncate mb-1', conv.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground')}>
          {lastMsg.subject}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            {conv.messages.length} message{conv.messages.length > 1 ? 's' : ''}
          </span>
          {conv.totalReplies > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-emerald-600">
              <MailCheck size={10} /> {conv.totalReplies} réponse{conv.totalReplies > 1 ? 's' : ''}
            </span>
          )}
          {conv.unreadCount > 0 && (
            <span className="ml-auto flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold shrink-0">
              {conv.unreadCount}
            </span>
          )}
        </div>
      </div>

      <ChevronRight size={14} className="text-muted-foreground shrink-0 mt-1" />
    </button>
  );
}

// ── Conversation detail panel ─────────────────────────────────────────────────

function ConversationDetail({
  conv,
  onBack,
}: {
  conv: Conversation;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-border bg-card flex items-center gap-3">
        <button
          onClick={onBack}
          className="sm:hidden p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
        >
          ←
        </button>
        <ContactAvatar name={conv.contactName} size="lg" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-foreground truncate">{conv.contactName}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground truncate">{conv.contactHandle}</span>
            <ChannelBadge channel={conv.channel} />
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-muted-foreground text-xs">
          <span className="flex items-center gap-1">
            <MessageSquare size={12} /> {conv.messages.length}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} /> {conv.lastDate}
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Summary strip */}
        <div className="flex items-center gap-3 rounded-xl bg-muted/40 border border-border/50 px-4 py-2.5">
          <Circle size={8} className="text-primary fill-primary shrink-0" />
          <span className="text-xs text-muted-foreground">
            Historique de conversation —{' '}
            <strong className="text-foreground">{conv.messages.length} message{conv.messages.length > 1 ? 's' : ''}</strong>,{' '}
            <strong className="text-emerald-600">{conv.totalReplies} réponse{conv.totalReplies > 1 ? 's' : ''}</strong>,{' '}
            {conv.unreadCount > 0 ? (
              <strong className="text-primary">{conv.unreadCount} non lu{conv.unreadCount > 1 ? 's' : ''}</strong>
            ) : (
              <strong className="text-foreground/60">tout lu</strong>
            )}
          </span>
        </div>

        {/* Messages chronologically */}
        {conv.messages.map((msg, idx) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="space-y-1"
          >
            <ThreadMessage msg={msg} contactName={conv.contactName} />
            {idx < conv.messages.length - 1 && (
              <div className="ml-9 flex items-center gap-2 py-1">
                <div className="flex-1 border-t border-dashed border-border/40" />
                <span className="text-[10px] text-muted-foreground/60 shrink-0">
                  {conv.messages[idx + 1].date}
                </span>
                <div className="flex-1 border-t border-dashed border-border/40" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyHistory() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 px-8 text-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
        <MessageSquare size={24} className="text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground mb-1">Aucune conversation</p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px]">
          L'historique de vos échanges avec chaque contact apparaîtra ici.
        </p>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function ConversationHistoryTab({ messages }: { messages: InboxMessage[] }) {
  const [search, setSearch] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Debounce search to avoid filtering on every keystroke (350ms)
  const debouncedSearch = useDebounce(search, 350);

  const conversations = useMemo(() => groupByContact(messages), [messages]);

  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return conversations;
    const q = debouncedSearch.toLowerCase();
    return conversations.filter(c =>
      c.contactName.toLowerCase().includes(q) ||
      c.contactHandle.toLowerCase().includes(q) ||
      c.messages.some(m => m.subject.toLowerCase().includes(q) || m.body.toLowerCase().includes(q))
    );
  }, [conversations, debouncedSearch]);

  const selectedConv = useMemo(
    () => filtered.find(c => `${c.contactHandle}::${c.channel}` === selectedKey) ?? null,
    [filtered, selectedKey]
  );

  const handleSelect = (conv: Conversation) => {
    setSelectedKey(`${conv.contactHandle}::${conv.channel}`);
    setShowDetail(true);
  };

  if (conversations.length === 0) return <EmptyHistory />;

  return (
    <div className="flex h-full min-h-0" style={{ height: 'calc(100dvh - 320px)', minHeight: '380px' }}>
      {/* Contact list */}
      <div className={cn(
        'w-full sm:w-80 shrink-0 border-r border-border flex flex-col bg-background',
        showDetail ? 'hidden sm:flex' : 'flex'
      )}>
        {/* Search */}
        <div className="px-3 pt-3 pb-2 border-b border-border shrink-0">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher un contact…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 h-8 text-xs bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground text-foreground"
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 pl-1">
            {filtered.length} contact{filtered.length !== 1 ? 's' : ''} · {messages.length} message{messages.length !== 1 ? 's' : ''} au total
          </p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
              Aucun résultat
            </div>
          ) : (
            filtered.map(conv => (
              <ConversationCard
                key={`${conv.contactHandle}::${conv.channel}`}
                conv={conv}
                isSelected={selectedKey === `${conv.contactHandle}::${conv.channel}`}
                onClick={() => handleSelect(conv)}
              />
            ))
          )}
        </div>
      </div>

      {/* Detail panel */}
      <div className={cn('flex-1 min-w-0 bg-background', showDetail ? 'flex flex-col' : 'hidden sm:flex sm:flex-col')}>
        <AnimatePresence mode="wait">
          {selectedConv ? (
            <motion.div
              key={selectedKey}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="flex-1 flex flex-col h-full"
            >
              <ConversationDetail conv={selectedConv} onBack={() => setShowDetail(false)} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground p-8 text-center"
            >
              <MessageSquare size={40} className="opacity-20" />
              <div>
                <p className="text-sm font-medium">Sélectionnez un contact</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Consultez l'historique complet de vos échanges
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
