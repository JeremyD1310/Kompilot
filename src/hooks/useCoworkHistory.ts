/**
 * useCoworkHistory — Local-first chat history for Claude Cowork.
 * Messages are stored in localStorage per user per spaceType.
 * Format: { role, text, timestamp, spaceType }
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export type CoworkSpaceType = 'pro' | 'agence';

export interface CoworkMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  spaceType: CoworkSpaceType;
}

const HISTORY_KEY = (userId: string, space: CoworkSpaceType) =>
  `cowork_history_${userId}_${space}`;

const WELCOME_MESSAGE = (space: CoworkSpaceType): CoworkMessage => ({
  id: 'welcome',
  role: 'assistant',
  text: space === 'agence'
    ? 'Bonjour. Je suis **Claude Cowork**, votre Consultant Stratégique Senior. Comment puis-je structurer vos livrables, analyser votre portefeuille clients ou optimiser vos stratégies d\'agence aujourd\'hui ?'
    : 'Salut ! Je suis **Claude Cowork**, votre coworker virtuel. Qu\'est-ce que je peux rédiger ou planifier pour vous faire gagner du temps aujourd\'hui ?',
  timestamp: Date.now(),
  spaceType: space,
});

export function useCoworkHistory(spaceType: CoworkSpaceType) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<CoworkMessage[]>([]);

  // Load history from localStorage on mount / space change
  useEffect(() => {
    if (!user?.id) return;
    const key = HISTORY_KEY(user.id, spaceType);
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CoworkMessage[];
        setMessages(parsed.length > 0 ? parsed : [WELCOME_MESSAGE(spaceType)]);
      } catch {
        setMessages([WELCOME_MESSAGE(spaceType)]);
      }
    } else {
      setMessages([WELCOME_MESSAGE(spaceType)]);
    }
  }, [user?.id, spaceType]);

  const saveMessages = useCallback((msgs: CoworkMessage[]) => {
    if (!user?.id) return;
    const key = HISTORY_KEY(user.id, spaceType);
    localStorage.setItem(key, JSON.stringify(msgs));
    setMessages(msgs);
  }, [user?.id, spaceType]);

  const addMessage = useCallback((msg: Omit<CoworkMessage, 'id'>) => {
    const newMsg: CoworkMessage = { ...msg, id: `${Date.now()}-${Math.random()}` };
    setMessages(prev => {
      const next = [...prev, newMsg];
      if (user?.id) {
        localStorage.setItem(HISTORY_KEY(user.id, spaceType), JSON.stringify(next));
      }
      return next;
    });
    return newMsg;
  }, [user?.id, spaceType]);

  const updateLastAssistantMessage = useCallback((text: string) => {
    setMessages(prev => {
      const next = [...prev];
      for (let i = next.length - 1; i >= 0; i--) {
        if (next[i].role === 'assistant' && next[i].id !== 'welcome') {
          next[i] = { ...next[i], text };
          break;
        }
      }
      if (user?.id) {
        localStorage.setItem(HISTORY_KEY(user.id, spaceType), JSON.stringify(next));
      }
      return next;
    });
  }, [user?.id, spaceType]);

  const clearHistory = useCallback(() => {
    if (!user?.id) return;
    localStorage.removeItem(HISTORY_KEY(user.id, spaceType));
    setMessages([WELCOME_MESSAGE(spaceType)]);
  }, [user?.id, spaceType]);

  return { messages, addMessage, updateLastAssistantMessage, clearHistory, saveMessages };
}
