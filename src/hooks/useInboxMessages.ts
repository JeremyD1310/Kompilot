import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blink } from '../blink/client';
import { useAuth } from './useAuth';
import { MOCK_MESSAGES, type InboxMessage, type Channel } from '../components/inbox/inboxData';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DbMessage {
  id: string;
  userId: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  body: string;
  isRead: boolean;
  isArchived: boolean;
  isStarred: boolean;
  channel?: string;
  senderHandle?: string;
  preview?: string;
  createdAt: string;
}

export interface DbReply {
  id: string;
  messageId: string;
  userId: string;
  fromType: string;
  textContent: string;
  createdAt: string;
}

// ── Convert DB message → InboxMessage ─────────────────────────────────────────

// Axe 4 FIX — helper de date sécurisé : new Date('') retourne Invalid Date
// ce qui fait crasher toLocaleTimeString sur Firefox et Safari.
function safeDateStr(raw: string | undefined | null, fallback = '—'): string {
  if (!raw) return fallback;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return fallback;
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function dbToInbox(msg: DbMessage, replies: DbReply[]): InboxMessage {
  const msgReplies = replies
    .filter(r => r.messageId === msg.id)
    .map(r => ({
      id: r.id,
      from: r.fromType as 'me' | 'sender',
      text: r.textContent,
      date: safeDateStr(r.createdAt),
    }));

  // Axe 4 FIX — validation avant instanciation de Date
  const created = msg.createdAt ? new Date(msg.createdAt) : null;
  const isValidDate = created && !isNaN(created.getTime());
  const now = new Date();
  const isToday = isValidDate && created!.toDateString() === now.toDateString();
  const dateStr = !isValidDate
    ? '—'
    : isToday
    ? `Aujourd'hui, ${created!.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    : created!.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) +
      ', ' +
      created!.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return {
    id: msg.id,
    channel: (msg.channel as Channel) ?? 'website',
    senderName: msg.senderName,
    senderHandle: msg.senderHandle ?? msg.senderEmail,
    subject: msg.subject,
    preview: msg.preview ?? msg.body.slice(0, 80) + '...',
    body: msg.body,
    date: dateStr,
    isRead: Number(msg.isRead) > 0,
    isArchived: Number(msg.isArchived) > 0,
    isStarred: Number(msg.isStarred) > 0,
    replies: msgReplies,
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useInboxMessages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch messages from DB
  const { data: dbMessages, isLoading: loadingMessages } = useQuery({
    queryKey: ['inbox-messages', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const results = await blink.db.messages.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        limit: 100,
      });
      return results as DbMessage[];
    },
    enabled: !!user?.id,
  });

  // Fetch replies from DB
  const { data: dbReplies } = useQuery({
    queryKey: ['inbox-replies', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const results = await blink.db.inboxReplies.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
        limit: 500,
      });
      return results as DbReply[];
    },
    enabled: !!user?.id,
  });

  // Build message list: real DB data or demo fallback while loading
  const messages: InboxMessage[] = (() => {
    const replies = dbReplies ?? [];
    const fromDb = (dbMessages ?? []).map(m => dbToInbox(m, replies));
    // Only fall back to mock data while the initial query is still loading
    // (i.e. we haven't confirmed there's no data yet). After loading, show
    // an empty list so the inbox shows a proper empty state.
    if (loadingMessages) return MOCK_MESSAGES as InboxMessage[];
    return fromDb;
  })();

  // ── Mutations ────────────────────────────────────────────────────────────

  // Mark as read
  const markReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!user?.id) return;
      if (dbMessages?.find(m => m.id === messageId)) {
        await blink.db.messages.update(messageId, { isRead: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox-messages', user?.id] });
    },
  });

  // Archive message — now persisted in DB
  const archiveMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!user?.id) return;
      if (dbMessages?.find(m => m.id === messageId)) {
        await blink.db.messages.update(messageId, { isArchived: true, isRead: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox-messages', user?.id] });
    },
  });

  // Unarchive message
  const unarchiveMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!user?.id) return;
      if (dbMessages?.find(m => m.id === messageId)) {
        await blink.db.messages.update(messageId, { isArchived: false });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox-messages', user?.id] });
    },
  });

  // Toggle star — now persisted in DB
  const starMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!user?.id) return;
      const msg = dbMessages?.find(m => m.id === messageId);
      if (msg) {
        await blink.db.messages.update(messageId, { isStarred: !Number(msg.isStarred) });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox-messages', user?.id] });
    },
  });

  // Delete message
  const deleteMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!user?.id) return;
      if (dbMessages?.find(m => m.id === messageId)) {
        await blink.db.messages.delete(messageId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox-messages', user?.id] });
    },
  });

  // Save reply to DB
  const saveReplyMutation = useMutation({
    mutationFn: async ({ messageId, text, from }: { messageId: string; text: string; from: 'me' | 'sender' }) => {
      if (!user?.id) return;
      await blink.db.inboxReplies.create({
        id: `reply_${Date.now()}`,
        messageId,
        userId: user.id,
        fromType: from,
        textContent: text,
      });
      if (dbMessages?.find(m => m.id === messageId)) {
        await blink.db.messages.update(messageId, { isRead: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox-replies', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['inbox-messages', user?.id] });
    },
  });

  return {
    messages,
    isLoading: loadingMessages,
    markRead: (id: string) => markReadMutation.mutate(id),
    archive: (id: string) => archiveMutation.mutate(id),
    unarchive: (id: string) => unarchiveMutation.mutate(id),
    toggleStar: (id: string) => starMutation.mutate(id),
    deleteMessage: (id: string) => deleteMutation.mutate(id),
    saveReply: (messageId: string, text: string, from: 'me' | 'sender' = 'me') =>
      saveReplyMutation.mutate({ messageId, text, from }),
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox-messages', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['inbox-replies', user?.id] });
    },
  };
}
