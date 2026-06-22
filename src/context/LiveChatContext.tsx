/**
 * LiveChatContext — shared state for the live chat support feature.
 * Provides conversations, messages, agent status, and typing simulation.
 */
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export type ChatChannel = 'website' | 'whatsapp' | 'instagram' | 'facebook';
export type ConversationStatus = 'open' | 'pending' | 'resolved';
export type Priority = 'urgent' | 'normal' | 'low';

export interface ChatMessage {
  id: string;
  from: 'client' | 'agent';
  text: string;
  time: string;
  timestamp: number;
  read: boolean;
}

export interface LiveConversation {
  id: string;
  channel: ChatChannel;
  clientName: string;
  clientInitials: string;
  clientEmail?: string;
  preview: string;
  lastTime: string;
  lastTimestamp: number;
  unreadCount: number;
  status: ConversationStatus;
  priority: Priority;
  messages: ChatMessage[];
  isClientOnline: boolean;
  isClientTyping: boolean;
  tags: string[];
  assignedTo?: string;
  waitingMinutes?: number;
}

interface LiveChatContextType {
  conversations: LiveConversation[];
  selectedId: string | null;
  agentOnline: boolean;
  setSelectedId: (id: string | null) => void;
  toggleAgentOnline: () => void;
  sendMessage: (convId: string, text: string) => void;
  markResolved: (convId: string) => void;
  markOpen: (convId: string) => void;
  setPriority: (convId: string, p: Priority) => void;
  markAllRead: (convId: string) => void;
  totalUnread: number;
}

// ── Mock seed data ────────────────────────────────────────────────────────────

const NOW = Date.now();

const SEED_CONVERSATIONS: LiveConversation[] = [
  {
    id: 'lc1',
    channel: 'website',
    clientName: 'Léa Moreau',
    clientInitials: 'LM',
    clientEmail: 'lea.moreau@gmail.com',
    preview: 'Bonjour, j\'ai une question sur les tarifs 💬',
    lastTime: 'À l\'instant',
    lastTimestamp: NOW - 30000,
    unreadCount: 2,
    status: 'open',
    priority: 'urgent',
    isClientOnline: true,
    isClientTyping: false,
    tags: ['Tarifs', 'Nouveau client'],
    waitingMinutes: 2,
    messages: [
      { id: 'm1', from: 'client', text: 'Bonjour ! Je suis intéressée par vos services. Pourriez-vous me donner une idée des tarifs ? 😊', time: '10:32', timestamp: NOW - 240000, read: true },
      { id: 'm2', from: 'client', text: 'J\'ai vu votre fiche Google et ça a l\'air top !', time: '10:33', timestamp: NOW - 30000, read: false },
    ],
  },
  {
    id: 'lc2',
    channel: 'whatsapp',
    clientName: 'Thomas Dubois',
    clientInitials: 'TD',
    clientEmail: 'thomas.d@hotmail.com',
    preview: 'Est-ce que la réservation de jeudi est confirmée ?',
    lastTime: 'Il y a 5 min',
    lastTimestamp: NOW - 300000,
    unreadCount: 1,
    status: 'open',
    priority: 'normal',
    isClientOnline: true,
    isClientTyping: false,
    tags: ['Réservation'],
    waitingMinutes: 5,
    messages: [
      { id: 'm1', from: 'client', text: 'Salut ! Je voulais juste confirmer ma réservation de jeudi à 15h pour 3 personnes.', time: '10:28', timestamp: NOW - 720000, read: true },
      { id: 'm2', from: 'agent', text: 'Bonjour Thomas ! Oui votre réservation du jeudi 6 juin à 15h est bien confirmée pour 3 personnes. À jeudi ! 😊', time: '10:29', timestamp: NOW - 660000, read: true },
      { id: 'm3', from: 'client', text: 'Parfait merci ! Et vous avez bien noté que c\'est un anniversaire ?', time: '10:33', timestamp: NOW - 300000, read: false },
    ],
  },
  {
    id: 'lc3',
    channel: 'instagram',
    clientName: 'Camille Petit',
    clientInitials: 'CP',
    preview: 'Super le post d\'hier ! Vous faites des chèques cadeaux ?',
    lastTime: 'Il y a 12 min',
    lastTimestamp: NOW - 720000,
    unreadCount: 0,
    status: 'open',
    priority: 'normal',
    isClientOnline: false,
    isClientTyping: false,
    tags: ['Commercial', 'Chèque cadeau'],
    messages: [
      { id: 'm1', from: 'client', text: '❤️ J\'adore votre dernier post ! Vous faites des chèques cadeaux ?', time: '10:21', timestamp: NOW - 720000, read: true },
      { id: 'm2', from: 'agent', text: 'Merci Camille ! 🌟 Oui nous proposons des chèques cadeaux numériques, envoyés directement par email. Vous pouvez commander ici 👉 planity.com', time: '10:22', timestamp: NOW - 680000, read: true },
    ],
  },
  {
    id: 'lc4',
    channel: 'facebook',
    clientName: 'Jean-Luc Bernard',
    clientInitials: 'JB',
    preview: 'Votre établissement est-il accessible PMR ?',
    lastTime: 'Il y a 30 min',
    lastTimestamp: NOW - 1800000,
    unreadCount: 0,
    status: 'pending',
    priority: 'low',
    isClientOnline: false,
    isClientTyping: false,
    tags: ['Accessibilité', 'Info'],
    waitingMinutes: 30,
    messages: [
      { id: 'm1', from: 'client', text: 'Bonjour, votre établissement est-il accessible aux personnes à mobilité réduite ?', time: '10:03', timestamp: NOW - 1800000, read: true },
    ],
  },
  {
    id: 'lc5',
    channel: 'website',
    clientName: 'Margot Leroy',
    clientInitials: 'ML',
    preview: 'Merci pour votre aide !',
    lastTime: 'Hier',
    lastTimestamp: NOW - 86400000,
    unreadCount: 0,
    status: 'resolved',
    priority: 'normal',
    isClientOnline: false,
    isClientTyping: false,
    tags: ['Résolu'],
    messages: [
      { id: 'm1', from: 'client', text: 'Bonsoir, j\'ai eu un problème avec ma réservation en ligne.', time: 'Hier 18:42', timestamp: NOW - 90000000, read: true },
      { id: 'm2', from: 'agent', text: 'Bonsoir Margot ! Je regarde ça tout de suite. Pouvez-vous me donner votre numéro de confirmation ?', time: 'Hier 18:44', timestamp: NOW - 89900000, read: true },
      { id: 'm3', from: 'client', text: 'C\'est le numéro #4521', time: 'Hier 18:45', timestamp: NOW - 89800000, read: true },
      { id: 'm4', from: 'agent', text: 'Parfait ! J\'ai trouvé votre réservation et corrigé le créneau. Tout est bon maintenant 😊', time: 'Hier 18:47', timestamp: NOW - 89700000, read: true },
      { id: 'm5', from: 'client', text: 'Merci beaucoup pour votre aide ! Super service 🙏', time: 'Hier 18:48', timestamp: NOW - 89600000, read: true },
    ],
  },
];

// ── Context ───────────────────────────────────────────────────────────────────

const LiveChatContext = createContext<LiveChatContextType | undefined>(undefined);

export const LiveChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<LiveConversation[]>(SEED_CONVERSATIONS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [agentOnline, setAgentOnline] = useState(true);
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);

  const markAllRead = useCallback((convId: string) => {
    setConversations(prev => prev.map(c =>
      c.id === convId
        ? { ...c, unreadCount: 0, messages: c.messages.map(m => ({ ...m, read: true })) }
        : c
    ));
  }, []);

  const sendMessage = useCallback((convId: string, text: string) => {
    const now = Date.now();
    const timeStr = new Date(now).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const newMsg: ChatMessage = {
      id: `msg-${now}`,
      from: 'agent',
      text,
      time: timeStr,
      timestamp: now,
      read: true,
    };

    setConversations(prev => prev.map(c =>
      c.id === convId
        ? { ...c, messages: [...c.messages, newMsg], preview: text, lastTime: 'À l\'instant', lastTimestamp: now, unreadCount: 0 }
        : c
    ));

    // Simulate client typing + auto-reply for demo
    const conv = conversations.find(c => c.id === convId);
    if (conv?.isClientOnline) {
      if (typingTimers.current[convId]) clearTimeout(typingTimers.current[convId]);
      // Show typing indicator after 1.5s
      typingTimers.current[convId] = setTimeout(() => {
        setConversations(prev => prev.map(c => c.id === convId ? { ...c, isClientTyping: true } : c));
        // Hide typing + send auto-reply after 3s
        setTimeout(() => {
          const replyNow = Date.now();
          const replyTime = new Date(replyNow).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          const replies = [
            'Merci pour votre réponse rapide ! 😊',
            'Super, c\'est noté merci !',
            'Parfait, je reviendrai vers vous.',
            '👍 Merci !',
          ];
          const autoReply: ChatMessage = {
            id: `auto-${replyNow}`,
            from: 'client',
            text: replies[Math.floor(Math.random() * replies.length)],
            time: replyTime,
            timestamp: replyNow,
            read: false,
          };
          setConversations(prev => prev.map(c =>
            c.id === convId
              ? { ...c, isClientTyping: false, messages: [...c.messages, autoReply], preview: autoReply.text, lastTime: 'À l\'instant', lastTimestamp: replyNow, unreadCount: c.id === selectedId ? 0 : c.unreadCount + 1 }
              : c
          ));
        }, 3000);
      }, 1500);
    }
  }, [conversations, selectedId]);

  const markResolved = useCallback((convId: string) => {
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, status: 'resolved', unreadCount: 0 } : c));
  }, []);

  const markOpen = useCallback((convId: string) => {
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, status: 'open' } : c));
  }, []);

  const setPriority = useCallback((convId: string, p: Priority) => {
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, priority: p } : c));
  }, []);

  const toggleAgentOnline = useCallback(() => setAgentOnline(v => !v), []);

  return (
    <LiveChatContext.Provider value={{
      conversations, selectedId, agentOnline, totalUnread,
      setSelectedId, toggleAgentOnline, sendMessage, markResolved, markOpen, setPriority, markAllRead,
    }}>
      {children}
    </LiveChatContext.Provider>
  );
};

export const useLiveChat = () => {
  const ctx = useContext(LiveChatContext);
  if (!ctx) { console.warn('useLiveChat must be used within LiveChatProvider' + ' — context missing, returning safe fallback'); return {} as any; }
  return ctx;
};
