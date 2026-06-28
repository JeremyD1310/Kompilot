import { useState, useRef } from 'react';
import {
  Page, PageHeader, PageTitle, PageDescription, PageBody,
  Badge, Button, Tabs, TabsList, TabsTrigger, TabsContent,
} from '@blinkdotnew/ui';
import {
  Inbox, Lock, Zap, ArrowRight,
  MessageSquare, Star, MessageCircle, Plus, MailCheck, Globe,
} from 'lucide-react';
import { MOCK_MESSAGES, type InboxMessage } from '../components/inbox/inboxData';
import { ReviewsTab } from '../components/inbox/ReviewsTab';
import { MultiPlatformReviewsHub } from '../components/inbox/MultiPlatformReviewsHub';
import { CommentsTab } from '../components/inbox/CommentsTab';
import { useSubscription } from '../context/SubscriptionContext';
import { useDemoMode } from '../context/DemoModeContext';
import { useInboxMessages } from '../hooks/useInboxMessages';
import { AICopilotPanel } from '../components/shared/AICopilotPanel';
import { AISentimentAnalysis } from '../components/inbox/AISentimentAnalysis';
import { DirectMessagesPanel, type StatusFilter, type DirectMessagesPanelRef } from '../components/inbox/DirectMessagesPanel';

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



// ── Page ──────────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const { currentPlan, setPlan } = useSubscription();
  const { isDemoActive } = useDemoMode();
  const isFree = currentPlan.id === 'free' && !isDemoActive;
  const { messages } = useInboxMessages();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [markAllAsReadFn, setMarkAllAsReadFn] = useState<(() => void) | null>(null);
  const panelRef = useRef<DirectMessagesPanelRef>(null);
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
            <Button variant="outline" size="sm" onClick={() => panelRef.current?.openNewMessage()} className="gap-2 text-xs h-8">
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
                    ref={panelRef}
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

      {/* AI Copilot — manages its own FAB + chat panel */}
      <AICopilotPanel context="inbox" />
    </Page>
  );
}