/**
 * useChatMemory — Persists last 5 AI chat conversations in localStorage.
 * Provides memory context injection into the AI system prompt so the
 * assistant can reference prior exchanges when answering new questions.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage } from './useAIChatMessages';

// ── Config ─────────────────────────────────────────────────────────────────────

const MAX_CONVERSATIONS = 5;
const MAX_MESSAGES_PER_CONV = 20;  // store at most 20 msgs per session
const MAX_CONTEXT_CONVS = 3;        // inject last 3 convs into the prompt

// ── Types ──────────────────────────────────────────────────────────────────────

export interface StoredConversation {
  id: string;
  sessionDate: string;  // ISO string
  summary: string;      // first user message (truncated) used as title
  messages: Array<{ role: 'user' | 'assistant'; text: string }>;
}

// ── Storage helpers ─────────────────────────────────────────────────────────────

function memoryKey(userId: string) {
  return `nc_chat_memory_${userId}`;
}

function loadRaw(userId: string): StoredConversation[] {
  try {
    const raw = localStorage.getItem(memoryKey(userId));
    if (raw) return JSON.parse(raw) as StoredConversation[];
  } catch { /* ignore */ }
  return [];
}

function persist(userId: string, convs: StoredConversation[]) {
  try {
    localStorage.setItem(memoryKey(userId), JSON.stringify(convs));
  } catch { /* quota full, silent fail */ }
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useChatMemory(userId?: string) {
  const [conversations, setConversations] = useState<StoredConversation[]>(() =>
    userId ? loadRaw(userId) : []
  );

  // Keep a stable ref to conversations for use in beforeunload
  const conversationsRef = useRef(conversations);
  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);

  /**
   * Call when the chat widget closes (or on page unload).
   * Only saves if the session contains at least one real user message.
   */
  const saveConversation = useCallback((messages: ChatMessage[]) => {
    if (!userId) return;

    const realMsgs = messages.filter(m => m.id !== 'welcome');
    const userMsgs = realMsgs.filter(m => m.role === 'user');
    if (userMsgs.length === 0) return;

    const stripped = realMsgs
      .slice(-MAX_MESSAGES_PER_CONV)
      .map(m => ({
        role: m.role,
        text: m.text
          .replace(/\[POST_DRAFT\][\s\S]*?\[\/POST_DRAFT\]/g, '')
          .trim(),
      }));

    const conv: StoredConversation = {
      id: `conv_${Date.now()}`,
      sessionDate: new Date().toISOString(),
      summary: userMsgs[0].text.slice(0, 120),
      messages: stripped,
    };

    setConversations(prev => {
      // Avoid duplicate saves for the same session (same first user message + same day)
      const today = new Date().toDateString();
      const duplicate = prev.find(
        c =>
          c.summary === conv.summary &&
          new Date(c.sessionDate).toDateString() === today
      );
      if (duplicate) return prev;

      const updated = [conv, ...prev].slice(0, MAX_CONVERSATIONS);
      persist(userId, updated);
      return updated;
    });
  }, [userId]);

  /**
   * Builds a compact memory block to prepend to the AI system prompt.
   * Returns empty string if no conversations stored yet.
   */
  const buildMemoryContext = useCallback((): string => {
    if (conversations.length === 0) return '';

    const recent = conversations.slice(0, MAX_CONTEXT_CONVS);
    const blocks = recent.map((conv, i) => {
      const date = new Date(conv.sessionDate).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
      });
      const userQuotes = conv.messages
        .filter(m => m.role === 'user')
        .slice(0, 2)
        .map(m => `  • "${m.text.slice(0, 90)}"`)
        .join('\n');
      return `Session ${i + 1} (${date}) — "${conv.summary}"\n${userQuotes}`;
    });

    return (
      '\n\n## Mémoire des conversations récentes\n' +
      'Voici un résumé des dernières interactions avec cet utilisateur ' +
      '(utilisez-les pour personnaliser votre réponse, pas la peine de les citer directement) :\n\n' +
      blocks.join('\n\n')
    );
  }, [conversations]);

  /** Wipe all stored memory for this user. */
  const clearMemory = useCallback(() => {
    if (!userId) return;
    setConversations([]);
    persist(userId, []);
  }, [userId]);

  return {
    conversations,           // all stored sessions (for display)
    saveConversation,        // call on widget close
    buildMemoryContext,      // inject into system prompt
    clearMemory,             // user-triggered wipe
  };
}
