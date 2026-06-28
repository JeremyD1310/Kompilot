/**
 * DirectMessagesPanel — Inbox message list + detail view with search, filtering, and actions.
 */
import { useState, useMemo, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import {
  Input, Button, toast,
} from '@blinkdotnew/ui';
import {
  Search, Inbox, MessageSquare, Plus, RefreshCw,
} from 'lucide-react';
import { MOCK_MESSAGES, type InboxMessage, type Reply, type Channel } from './inboxData';
import { MessageList } from './MessageList';
import { MessageDetail } from './MessageDetail';
import { AIDraftBanner } from './AIDraftBanner';
import { NewMessageDialog } from './NewMessageDialog';
import { useInboxMessages } from '../../hooks/useInboxMessages';

export type StatusFilter = 'all' | 'unread' | 'starred' | 'archived';

export interface DirectMessagesPanelRef {
  openNewMessage: () => void;
}

export const CHANNEL_FILTERS: { id: Channel | 'all'; label: string }[] = [
  { id: 'all',       label: 'Tous'       },
  { id: 'website',   label: '🌐 Site web' },
  { id: 'instagram', label: '📸 Instagram'},
  { id: 'facebook',  label: '👥 Facebook' },
  { id: 'google',    label: '📍 Google'   },
  { id: 'linkedin',  label: '💼 LinkedIn' },
];

export const DirectMessagesPanel = forwardRef<DirectMessagesPanelRef, {
  onNewMessage?: () => void;
  statusFilter: StatusFilter;
  onMarkAllAsRead: (markAll: () => void) => void;
}>(function DirectMessagesPanel({ onNewMessage, statusFilter, onMarkAllAsRead }, ref) {
  const { messages: dbMessages, isLoading, markRead, archive, toggleStar, deleteMessage, saveReply, refresh } = useInboxMessages();
  const [localMessages, setLocalMessages] = useState<InboxMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<Channel | 'all'>('all');
  const [showDetail, setShowDetail] = useState(false);
  const [newMessageOpen, setNewMessageOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    openNewMessage: () => setNewMessageOpen(true),
  }));

  const messages = useMemo(() => {
    const base = dbMessages.length > 0 ? dbMessages : MOCK_MESSAGES.map(m => ({ ...m, isArchived: false, isStarred: false }));
    return base.map(m => {
      const local = localMessages.find(l => l.id === m.id);
      return local ? { ...m, ...local } : m;
    });
  }, [dbMessages, localMessages]);

  const applyLocal = (id: string, patch: Partial<InboxMessage>) => {
    setLocalMessages(prev => {
      const exists = prev.find(m => m.id === id);
      if (exists) return prev.map(m => m.id === id ? { ...m, ...patch } : m);
      const base = messages.find(m => m.id === id);
      return base ? [...prev, { ...base, ...patch }] : prev;
    });
  };

  const filtered = messages.filter(m => {
    if (statusFilter === 'archived') {
      if (!m.isArchived) return false;
    } else {
      if (m.isArchived) return false;
      if (statusFilter === 'unread'  && m.isRead)    return false;
      if (statusFilter === 'starred' && !m.isStarred) return false;
    }
    if (channelFilter !== 'all' && m.channel !== channelFilter) return false;
    const q = search.toLowerCase();
    return !q || m.senderName.toLowerCase().includes(q) || m.subject.toLowerCase().includes(q);
  });

  const selected = messages.find(m => m.id === selectedId) ?? null;

  const markAllAsRead = useCallback(() => {
    messages.filter(m => !m.isRead).forEach(m => {
      applyLocal(m.id, { isRead: true });
      markRead(m.id);
    });
    toast.success('Tous les messages marqués comme lus');
  }, [messages]);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    onMarkAllAsRead(markAllAsRead);
  }, [markAllAsRead, onMarkAllAsRead]);

  useEffect(() => {
    try {
      const pendingId = sessionStorage.getItem('inbox_open_msg');
      if (pendingId && messages.length > 0) {
        const target = messages.find(m => m.id === pendingId);
        if (target) {
          sessionStorage.removeItem('inbox_open_msg');
          setSelectedId(pendingId);
          setShowDetail(true);
        }
      }
    } catch { /* noop */ }
  }, [messages]);

  const handleSelect = (msg: InboxMessage) => {
    setSelectedId(msg.id);
    applyLocal(msg.id, { isRead: true });
    markRead(msg.id);
    setShowDetail(true);
  };

  const handleReply = (messageId: string, reply: Reply) => {
    applyLocal(messageId, { replies: [...(messages.find(m => m.id === messageId)?.replies ?? []), reply] });
    saveReply(messageId, reply.text, reply.from);
  };

  const handleArchive = (id: string) => {
    applyLocal(id, { isArchived: true });
    archive(id);
    if (selectedId === id) { setSelectedId(null); setShowDetail(false); }
    toast.success('Message archivé');
  };

  const handleDelete = (id: string) => {
    applyLocal(id, { isArchived: true });
    deleteMessage(id);
    if (selectedId === id) { setSelectedId(null); setShowDetail(false); }
    toast.success('Message supprimé');
  };

  const handleToggleStar = (id: string) => {
    const msg = messages.find(m => m.id === id);
    applyLocal(id, { isStarred: !msg?.isStarred });
    toggleStar(id);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 flex items-center justify-end px-4 py-2 border-b border-border/60 bg-muted/10">
        <button
          onClick={() => { refresh(); toast('Actualisé'); }}
          className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
          title="Actualiser"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      <div className="flex flex-1 min-h-0" style={{ height: 'calc(100dvh - 300px)', minHeight: 'min(360px, 60dvh)' }}>
        <div className={`w-full sm:w-80 shrink-0 border-r border-border flex flex-col bg-background ${showDetail ? 'hidden sm:flex' : 'flex'}`}>
          <div className="px-3 pt-3 pb-2 border-b border-border shrink-0 space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {CHANNEL_FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setChannelFilter(f.id as Channel | 'all')}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    channelFilter === f.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <RefreshCw size={18} className="animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Inbox size={28} className="text-primary/60" />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-bold text-foreground">Boîte de réception vide</p>
                <p className="text-xs text-muted-foreground max-w-[260px]">
                  {search || channelFilter !== 'all'
                    ? 'Aucun message ne correspond à vos filtres.'
                    : 'Vos messages apparaîtront ici dès que vos canaux seront connectés.'}
                </p>
              </div>
              {!search && channelFilter === 'all' && (
                <Button variant="outline" size="sm" onClick={onNewMessage} className="gap-2 text-xs">
                  <Plus size={14} /> Envoyer un message test
                </Button>
              )}
            </div>
          ) : (
            <MessageList messages={filtered} selectedId={selectedId} onSelect={handleSelect} onArchive={handleArchive} />
          )}
        </div>

        <div className={`flex-1 min-w-0 flex flex-col bg-background ${showDetail ? 'flex' : 'hidden sm:flex'}`}>
          {selected ? (
            <>
              <div className="px-4 pt-3">
                <AIDraftBanner
                  message={{ senderName: selected.senderName, subject: selected.subject, body: selected.body ?? selected.preview }}
                  onUseReply={() => {}}
                />
              </div>
              <MessageDetail
                message={selected}
                onReply={handleReply}
                onBack={() => setShowDetail(false)}
                onArchive={handleArchive}
                onDelete={handleDelete}
                onToggleStar={handleToggleStar}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground p-8 text-center">
              <Inbox size={40} className="opacity-20" />
              <div>
                <p className="text-sm font-medium">Aucun message sélectionné</p>
                <p className="text-xs text-muted-foreground mt-1">Choisissez un message dans la liste</p>
              </div>
              <Button variant="outline" size="sm" onClick={onNewMessage} className="gap-2 mt-1">
                <Plus size={14} /> Nouveau message test
              </Button>
            </div>
          )}
        </div>
      </div>
      <NewMessageDialog open={newMessageOpen} onClose={() => setNewMessageOpen(false)} onSent={refresh} />
    </div>
  );
});
