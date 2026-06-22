/**
 * LiveChatPage — Real-time customer support chat for businesses.
 * Left: conversation list with filters, search, and status tabs.
 * Right: full message thread with AI suggestions, quick replies, resolve actions.
 */
import { useState, useEffect, useRef } from 'react';
import { LiveChatProvider, useLiveChat } from '../context/LiveChatContext';
import { ChatSidebar } from '../components/livechat/ChatSidebar';
import { ChatWindow } from '../components/livechat/ChatWindow';
import { useEmailNotifications } from '../hooks/useEmailNotifications';
import {
  MessageCircle, Users, Clock, TrendingUp,
  Power, ChevronLeft,
} from 'lucide-react';
import { toast } from '@blinkdotnew/ui';

// ── Stats bar ─────────────────────────────────────────────────────────────────

function StatsBar() {
  const { conversations, agentOnline, toggleAgentOnline } = useLiveChat();
  const open      = conversations.filter(c => c.status === 'open').length;
  const pending   = conversations.filter(c => c.status === 'pending').length;
  const resolved  = conversations.filter(c => c.status === 'resolved').length;
  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);

  return (
    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border bg-background shrink-0 overflow-x-auto">
      <div className="flex items-center gap-3 flex-1 flex-wrap">
        {[
          { icon: <MessageCircle size={12} />, label: 'Ouverts', value: open, color: 'text-primary' },
          { icon: <Clock size={12} />, label: 'En attente', value: pending, color: 'text-amber-600' },
          { icon: <TrendingUp size={12} />, label: 'Résolus', value: resolved, color: 'text-emerald-600' },
          { icon: <Users size={12} />, label: 'Non lus', value: totalUnread, color: totalUnread > 0 ? 'text-red-600' : 'text-muted-foreground' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-1.5 text-muted-foreground">
            <span className={s.color}>{s.icon}</span>
            <span className="text-[10px] font-semibold hidden sm:block">{s.label}</span>
            <span className={`text-xs font-extrabold tabular-nums ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Agent status toggle */}
      <button
        onClick={() => {
          toggleAgentOnline();
          toast.success(agentOnline ? 'Vous êtes maintenant hors ligne' : 'Vous êtes maintenant en ligne ✅');
        }}
        className={`flex items-center gap-1.5 text-[10px] font-bold rounded-lg px-3 py-1.5 border transition-all shrink-0 ${
          agentOnline
            ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50'
            : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
        }`}
      >
        <Power size={10} />
        {agentOnline ? 'En ligne' : 'Hors ligne'}
      </button>
    </div>
  );
}

// ── Inner layout (needs context) ──────────────────────────────────────────────

function LiveChatInner() {
  const { conversations, selectedId, setSelectedId } = useLiveChat();
  const { sendNewMessageAlert } = useEmailNotifications();
  // Track previously seen message counts to detect new incoming messages
  const prevCountsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    conversations.forEach(conv => {
      const prev = prevCountsRef.current[conv.id] ?? conv.messages.length;
      const curr = conv.messages.length;
      if (curr > prev) {
        const lastMsg = conv.messages[curr - 1];
        // Only alert on client messages, not agent messages
        if (lastMsg && lastMsg.from === 'client' && conv.id !== selectedId) {
          sendNewMessageAlert({
            senderName: conv.clientName,
            senderChannel: conv.channel === 'website' ? 'Site web' : conv.channel === 'whatsapp' ? 'WhatsApp' : conv.channel === 'instagram' ? 'Instagram' : 'Facebook',
            messagePreview: lastMsg.text,
          });
        }
      }
      prevCountsRef.current[conv.id] = curr;
    });
  }, [conversations, selectedId, sendNewMessageAlert]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Page header */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-border shrink-0">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <MessageCircle size={18} className="text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-foreground leading-tight">Support Live Chat 💬</h1>
          <p className="text-xs text-muted-foreground">Répondez à vos clients en temps réel depuis toutes vos plateformes.</p>
        </div>
      </div>

      {/* Stats bar */}
      <StatsBar />

      {/* Split layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Mobile: show list OR thread */}
        {/* Desktop: always show both */}

        {/* Sidebar — hidden on mobile when conversation selected */}
        <div className={`${selectedId ? 'hidden md:flex' : 'flex'} w-full md:w-[300px] lg:w-[320px] shrink-0 flex-col border-r border-border`}>
          <ChatSidebar />
        </div>

        {/* Chat window */}
        <div className={`${selectedId ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0`}>
          {/* Mobile back button */}
          {selectedId && (
            <button
              onClick={() => setSelectedId(null)}
              className="md:hidden flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-primary border-b border-border hover:bg-muted/30 transition-colors"
            >
              <ChevronLeft size={14} /> Retour aux conversations
            </button>
          )}
          <ChatWindow />
        </div>
      </div>
    </div>
  );
}

// ── Page export ───────────────────────────────────────────────────────────────

export default function LiveChatPage() {
  return (
    <LiveChatProvider>
      {/* Use dvh so the chat fills the viewport inside the layout */}
      <div style={{ height: 'calc(100dvh - 56px)' }} className="flex flex-col overflow-hidden">
        <LiveChatInner />
      </div>
    </LiveChatProvider>
  );
}
