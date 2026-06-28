import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Page, PageHeader, PageTitle, PageDescription, PageBody,
  Badge, Input, Button, Tabs, TabsList, TabsTrigger, TabsContent, toast,
} from '@blinkdotnew/ui';
import {
  Search, Inbox, Lock, Zap, ArrowRight,
  MessageSquare, Star, MessageCircle, Plus, MailCheck,
  RefreshCw, Filter, Globe,
} from 'lucide-react';
import { MOCK_MESSAGES, type InboxMessage, type Reply, type Channel } from '../components/inbox/inboxData';
import { MessageList } from '../components/inbox/MessageList';
import { MessageDetail } from '../components/inbox/MessageDetail';
import { ChannelIcon } from '../components/inbox/ChannelIcon';
import { ReviewsTab } from '../components/inbox/ReviewsTab';
import { MultiPlatformReviewsTab } from '../components/inbox/MultiPlatformReviewsTab';
import { MultiPlatformReviewsHub } from '../components/inbox/MultiPlatformReviewsHub';
import { CommentsTab } from '../components/inbox/CommentsTab';
import { AIDraftBanner } from '../components/inbox/AIDraftBanner';
import { NewMessageDialog } from '../components/inbox/NewMessageDialog';
import { useSubscription } from '../context/SubscriptionContext';
import { useAuth } from '../hooks/useAuth';
import { useDemoMode } from '../context/DemoModeContext';
import { useInboxMessages } from '../hooks/useInboxMessages';
import { AICopilotPanel } from '../components/shared/AICopilotPanel';
import { AISentimentAnalysis } from '../components/inbox/AISentimentAnalysis';

// ── Channel filters ───────────────────────────────────────────────────────────

const CHANNEL_FILTERS: { id: Channel | 'all'; label: string }[] = [
  { id: 'all',       label: 'Tous'       },
  { id: 'website',   label: '🌐 Site web' },
  { id: 'instagram', label: '📸 Instagram'},
  { id: 'facebook',  label: '👥 Facebook' },
  { id: 'google',    label: '📍 Google'   },
  { id: 'linkedin',  label: '💼 LinkedIn' },
];

// ── Stats header ──────────────────────────────────────────────────────────────

function InboxStats({ messages }: { messages: InboxMessage[] }) {
  const unread  = messages.filter(m => !m.isRead).length;
  const replied = messages.filter(m => m.replies.length > 0).length;
  const pending = messages.filter(m => !m.isRead && m.replies.length === 0).length;
  const starred = messages.filter(m => m.isStarred).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-3 sm:px-6 py-4 border-b border-border/60 bg-muted/20">
      {[
        { label: 'Non lus',    value: unread,  icon: <Inbox size={14} />,       color: 'text-primary'      },
        { label: 'En attente', value: pending, icon: <MessageSquare size={14}/>, color: 'text-amber-600'   },
        { label: 'Répondus',   value: replied, icon: <MailCheck size={14} />,   color: 'text-emerald-600'  },
        { label: 'Favoris',    value: starred, icon: <Star size={14} />,        color: 'text-amber-500'    },
      ].map(s => (
        <div key={s.label} className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl bg-background border border-border flex items-center justify-center shrink-0 ${s.color}`}>
            {s.icon}
          </div>
          <div>
            <p className="text-base font-bold text-foreground tabular-nums leading-none">{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Paywall ───────────────────────────────────────────────────────────────────

function InboxGate({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center px-8 text-center">
      <div className="bg-card border border-border rounded-2xl shadow-xl p-8 max-w-sm w-full space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Lock size={28} className="text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-foreground">Fonctionnalité Pro</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            La boîte de réception est disponible dès l'offre{' '}
            <span className="font-semibold text-primary">Pro à 19€/mois</span>.
          </p>
        </div>
        <ul className="text-left text-sm space-y-2 text-foreground">
          {['Messages de tous vos canaux réunis', 'Réponses IA en un clic', 'Avis Google centralisés'].map(f => (
            <li key={f} className="flex items-center gap-2">
              <span className="text-primary font-bold">✓</span> {f}
            </li>
          ))}
        </ul>
        <Button onClick={onUpgrade} className="w-full gap-2 py-5 text-sm font-semibold">
          <Zap size={15} /> Passer à Pro <ArrowRight size={15} />
        </Button>
      </div>
    </div>
  );
}

// ── Status filter bar ─────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'unread' | 'starred' | 'archived';

function StatusFilterBar({
  messages,
  value,
  onChange,
}: {
  messages: InboxMessage[];
  value: StatusFilter;
  onChange: (v: StatusFilter) => void;
}) {
  const counts: Record<StatusFilter, number> = {
    all:      messages.length,
    unread:   messages.filter(m => !m.isRead).length,
    starred:  messages.filter(m => m.isStarred).length,
    archived: messages.filter(m => m.isArchived).length,
  };

  const chips: { id: StatusFilter; label: string }[] = [
    { id: 'all',      label: 'Tous'     },
    { id: 'unread',   label: 'Non lus'  },
    { id: 'starred',  label: 'Étoilés'  },
    { id: 'archived', label: 'Archivés' },
  ];

  return (
    <div className="flex items-center gap-2 px-3 sm:px-6 py-3 border-b border-border/60 bg-background flex-wrap">
      {chips.map(chip => (
        <button
          key={chip.id}
          onClick={() => onChange(chip.id)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
            value === chip.id
              ? 'bg-primary/10 text-primary border-primary/30'
              : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted/70 hover:text-foreground'
          }`}
        >
          {chip.label}
          <span className={`rounded-full px-1 text-[10px] font-bold tabular-nums ${
            value === chip.id ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
          }`}>
            {counts[chip.id]}
          </span>
        </button>
      ))}
    </div>
  );
}

// ── Messages panel ────────────────────────────────────────────────────────────

function DirectMessagesPanel({
  onNewMessage,
  statusFilter,
  onMarkAllAsRead,
}: {
  onNewMessage: () => void;
  statusFilter: StatusFilter;
  onMarkAllAsRead: (markAll: () => void) => void;
}) {
  const { messages: dbMessages, isLoading, markRead, archive, toggleStar, deleteMessage, saveReply, refresh } = useInboxMessages();
  const [localMessages, setLocalMessages] = useState<InboxMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<Channel | 'all'>('all');
  const [showDetail, setShowDetail] = useState(false);

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
  const unread = filtered.filter(m => !m.isRead).length;

  // Expose markAllAsRead to parent via callback
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

  // Auto-open message linked from dashboard widget
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
      {/* Refresh button row */}
      <div className="shrink-0 flex items-center justify-end px-4 py-2 border-b border-border/60 bg-muted/10">
        <button
          onClick={() => { refresh(); toast('Actualisé'); }}
          className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
          title="Actualiser"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* minHeight uses dvh so it works on mobile without creating fixed dead zones */}
      <div className="flex flex-1 min-h-0" style={{ height: 'calc(100dvh - 300px)', minHeight: 'min(360px, 60dvh)' }}>
        {/* List */}
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
                    ? 'Aucun message ne correspond à vos filtres. Essayez d\'élargir votre recherche.'
                    : 'Vos messages, avis et commentaires apparaîtront ici dès que vos canaux seront connectés.'}
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

        {/* Detail */}
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
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const { currentPlan, setPlan } = useSubscription();
  const { isDemoActive } = useDemoMode();
  const isFree = currentPlan.id === 'free' && !isDemoActive;
  const { messages, refresh } = useInboxMessages();
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [markAllAsReadFn, setMarkAllAsReadFn] = useState<(() => void) | null>(null);
  // AICopilotPanel mounted below — manages its own FAB/open state
  const unreadCount = messages.filter(m => !m.isRead).length;

  const allMessages = messages.length > 0
    ? messages
    : MOCK_MESSAGES.map(m => ({ ...m, isArchived: false, isStarred: false }));

  return (
    <Page className="page-enter">
      <PageHeader>
        <div className="flex items-center gap-3">
          <PageTitle>Boîte de Réception</PageTitle>
          {!isFree && unreadCount > 0 && (
            <Badge variant="default" className="rounded-full text-xs">{unreadCount} non lu{unreadCount > 1 ? 's' : ''}</Badge>
          )}
          {isFree && <Badge variant="secondary" className="rounded-full text-xs gap-1"><Lock size={10} /> Pro requis</Badge>}
        </div>
        <PageDescription>Messages, avis et commentaires de tous vos canaux au même endroit.</PageDescription>
        {!isFree && (
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsReadFn?.()}
              disabled={unreadCount === 0}
              className="gap-2 text-xs h-8"
            >
              <MailCheck size={13} /> Tout marquer comme lu
            </Button>
            <Button variant="outline" size="sm" onClick={() => setNewMessageOpen(true)} className="gap-2 text-xs h-8">
              <Plus size={13} /> Nouveau message
            </Button>
          </div>
        )}
      </PageHeader>

      <PageBody className="p-0 flex-1 min-h-0">
        <div className="relative" style={{ minHeight: 'calc(100dvh - 180px)' }}>

          {/* Free gate */}
          {isFree && (
            <>
              <div className="absolute inset-0 z-0 flex pointer-events-none select-none blur-sm opacity-30">
                <div className="w-80 shrink-0 border-r border-border p-3 space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-start gap-3 px-2 py-3 rounded-lg bg-muted/60">
                      <div className="w-6 h-6 rounded-full bg-muted" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 rounded bg-muted w-2/3" />
                        <div className="h-2.5 rounded bg-muted/60 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex-1 p-6 space-y-4">
                  {[...Array(5)].map((_, i) => <div key={i} className="h-3 rounded bg-muted/60" style={{ width: `${70 + (i % 3) * 10}%` }} />)}
                </div>
              </div>
              <InboxGate onUpgrade={() => setPlan('pro')} />
            </>
          )}

          {/* Content */}
          {!isFree && (
            <div>
              <InboxStats messages={messages.length > 0 ? messages : MOCK_MESSAGES.map(m => ({ ...m, isArchived: false, isStarred: false }))} />

              <Tabs defaultValue="messages" className="w-full">
                <div className="px-3 sm:px-6 pt-4 border-b border-border overflow-x-auto">
                  <TabsList>
                    <TabsTrigger value="messages" className="gap-2">
                      <MessageSquare size={14} />
                      Messages
                      {unreadCount > 0 && (
                        <span className="ml-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="gap-2">
                      <Star size={14} />
                      Avis Google
                      <span className="ml-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5">6</span>
                    </TabsTrigger>
                    <TabsTrigger value="comments" className="gap-2">
                      <MessageCircle size={14} />
                      Commentaires
                      <span className="ml-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold px-1.5">3</span>
                    </TabsTrigger>
                    <TabsTrigger value="multi-reviews" className="gap-2">
                      <Globe size={14} />
                      Tous les Avis
                      <span className="ml-1 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold px-1.5">18</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="messages" className="mt-0">
                  <DirectMessagesPanel
                    onNewMessage={() => setNewMessageOpen(true)}
                    statusFilter={statusFilter}
                    onMarkAllAsRead={(fn) => setMarkAllAsReadFn(() => fn)}
                  />
                </TabsContent>

                <TabsContent value="reviews" className="mt-0 px-3 sm:px-6 py-4 overflow-y-auto" style={{ maxHeight: 'calc(100dvh - 280px)' }}>
                  <AISentimentAnalysis className="mb-4" />
                  <ReviewsTab />
                </TabsContent>

                <TabsContent value="comments" className="mt-0 px-3 sm:px-6 py-4 overflow-y-auto" style={{ maxHeight: 'calc(100dvh - 280px)' }}>
                  <CommentsTab />
                </TabsContent>

                <TabsContent value="multi-reviews" className="mt-0 overflow-y-auto" style={{ maxHeight: 'calc(100dvh - 280px)' }}>
                  <MultiPlatformReviewsHub />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

        {/* RGPD */}
        <div className="mt-6 px-3 sm:px-6 pb-4">
          <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 px-4 py-3">
            <Lock size={13} className="text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              🔒 <strong>Vos échanges sont sécurisés.</strong> Kompilot utilise uniquement les API officielles et ne revend aucune donnée.{' '}
              <a href="/privacy" className="underline hover:text-foreground transition-colors">Politique de confidentialité</a>
            </p>
          </div>
        </div>
      </PageBody>

      <NewMessageDialog open={newMessageOpen} onClose={() => setNewMessageOpen(false)} onSent={refresh} />

      {/* AI Copilot — manages its own FAB + chat panel */}
      <AICopilotPanel context="inbox" />
    </Page>
  );
}
