/**
 * useAIChatMessages — State management and AI call logic for AIChatWidget.
 *
 * Encapsulates: message history, streaming AI calls, voice recognition,
 * and the emotional context injection.
 */
import { useState, useRef, useCallback } from 'react';
import { blink } from '../blink/client';
import { buildMentorSystemPrompt } from '../lib/sectorProfiles';
import { MENTOR_SYSTEM_PROMPT } from '../lib/aiChatSystemPrompt';
import {
  getEmotionalContext,
  getEmotionalLayerInstruction,
  getEmotionalMaxTokens,
} from '../lib/emotionalCopywriting';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  isDraft?: boolean;
}

interface UseAIChatMessagesOptions {
  pathname: string;
  masterProfile: string | null;
  granularSector: string | null;
  establishmentName?: string;
  /** Injected memory context from useChatMemory.buildMemoryContext() */
  memoryContext?: string;
}

export function useAIChatMessages({
  pathname,
  masterProfile,
  granularSector,
  establishmentName,
  memoryContext = '',
}: UseAIChatMessagesOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const systemPrompt = buildMentorSystemPrompt(masterProfile, granularSector, establishmentName);

  // ── Combine base prompt with memory context ───────────────────────────────────

  // ── AI call with emotional context injection ─────────────────────────────────
  const doAICall = useCallback(async (currentMessages: ChatMessage[]) => {
    const aiMsgId = (Date.now() + 1).toString();
    let fullContent = '';

    // Max last 10 turns for token budget, strip draft tags for history
    const historyTurns = currentMessages
      .filter(m => m.id !== 'welcome')
      .slice(-10)
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.text.replace(/\[POST_DRAFT\][\s\S]*?\[\/POST_DRAFT\]/g, '').trim(),
      }));

    // ── Emotional Context Engine: inject tone layer based on current screen ──
    const emotionalCtx = getEmotionalContext(pathname);
    const emotionalLayer = getEmotionalLayerInstruction(emotionalCtx);
    const basePrompt = systemPrompt || MENTOR_SYSTEM_PROMPT;
    // Inject memory context (past conversations) if available
    const enrichedPrompt = `${basePrompt}${memoryContext}\n\n${emotionalLayer}`;

    try {
      await blink.ai.streamText(
        {
          messages: [
            { role: 'system', content: enrichedPrompt },
            ...historyTurns,
          ],
          model: 'gpt-4.1-mini',
          maxTokens: getEmotionalMaxTokens(emotionalCtx),
        },
        (chunk) => {
          fullContent += chunk;
          setTyping(false);
          setMessages(prev => {
            const others = prev.filter(m => m.id !== aiMsgId);
            return [...others, { id: aiMsgId, role: 'assistant', text: fullContent, timestamp: new Date() }];
          });
        },
      );
    } catch (error: any) {
      setTyping(false);
      if (error?.status === 401 || error?.message?.includes('401') || error?.name === 'BlinkAuthError') {
        blink.auth.login(window.location.href);
      } else {
        setMessages(prev => [
          ...prev,
          { id: aiMsgId, role: 'assistant', text: 'Désolé, une erreur est survenue. Réessayez dans un instant. 🙏', timestamp: new Date() },
        ]);
      }
    }
  }, [pathname, systemPrompt, memoryContext]);

  // ── Send a user message ───────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: trimmed,
      timestamp: new Date(),
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setTyping(true);
    await doAICall(updatedMessages);
  }, [messages, doAICall]);

  // ── Voice recognition ─────────────────────────────────────────────────────────
  const startVoiceRecognition = useCallback((onTranscript: (text: string) => void) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onresult = (event: any) => {
      onTranscript(event.results[0][0].transcript);
    };
    recognition.start();
  }, []);

  const addWelcomeMessage = useCallback((welcomeText: string) => {
    setMessages([{ id: 'welcome', role: 'assistant', text: welcomeText, timestamp: new Date() }]);
  }, []);

  return { messages, setMessages, typing, isRecording, sendMessage, startVoiceRecognition, addWelcomeMessage };
}
