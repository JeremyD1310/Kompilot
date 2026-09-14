/**
 * useKompilotEngine.ts — React hook for the Kompilot AI Engine.
 *
 * Wraps blink.ai.streamText with the full Kompilot engine persona,
 * parses <kompilot_metadata> from responses, and exposes structured
 * action data for the frontend.
 *
 * Used by CopilotCommandBar (inline), AIChatWidget (full), and
 * any future conversational AI surface in Kompilot.
 */

import { useState, useRef, useCallback } from 'react';
import { blink } from '../blink/client';
import {
  KOMPILOT_ENGINE_INLINE_PROMPT,
  parseEngineResponse,
  type KompilotMetadata,
  type ParsedEngineResponse,
} from '../lib/aiEngine/kompilotEngine';
import { MENTOR_SYSTEM_PROMPT } from '../lib/aiChatSystemPrompt';

// ── Types ───────────────────────────────────────────────────────────────────

export interface EngineMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  /** Parsed metadata from <kompilot_metadata> block, if present */
  metadata?: KompilotMetadata | null;
  /** Extracted post draft from [POST_DRAFT]...[/POST_DRAFT], if present */
  postDraft?: string | null;
  timestamp: Date;
}

export interface UseKompilotEngineOptions {
  /** If true, use the short inline prompt (Command Bar). Default: false (full prompt). */
  inline?: boolean;
  /** Maximum tokens for the AI response. Default: 400 (inline) or 800 (full). */
  maxTokens?: number;
  /** Model to use. Default: 'gpt-4.1-mini' (inline) or 'gpt-4.1' (full). */
  model?: string;
  /** Additional context injected into the system prompt (e.g., establishment info). */
  extraSystemContext?: string;
  /** Callback when metadata is parsed from a response. */
  onMetadataParsed?: (metadata: KompilotMetadata) => void;
  /** Callback when a post draft is extracted. */
  onPostDraft?: (draft: string) => void;
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useKompilotEngine(options: UseKompilotEngineOptions = {}) {
  const {
    inline = false,
    maxTokens,
    model,
    extraSystemContext = '',
    onMetadataParsed,
    onPostDraft,
  } = options;

  const [messages, setMessages] = useState<EngineMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [currentMetadata, setCurrentMetadata] = useState<KompilotMetadata | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const systemPrompt = inline
    ? KOMPILOT_ENGINE_INLINE_PROMPT
    : MENTOR_SYSTEM_PROMPT;

  const resolvedMaxTokens = maxTokens ?? (inline ? 300 : 800);
  const resolvedModel = model ?? (inline ? 'gpt-4.1-mini' : 'gpt-4.1');

  /**
   * Send a message to the AI engine and stream the response.
   * Returns the parsed response (content, metadata, postDraft).
   */
  const sendMessage = useCallback(async (
    userText: string,
    historyOverride?: EngineMessage[],
  ): Promise<ParsedEngineResponse | null> => {
    const trimmed = userText.trim();
    if (!trimmed) return null;

    // Add user message
    const userMsg: EngineMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: trimmed,
      timestamp: new Date(),
    };

    const sourceMessages = historyOverride ?? messages;
    const updatedMessages = [...sourceMessages, userMsg];
    setMessages(updatedMessages);
    setStreaming(true);

    const aiMsgId = (Date.now() + 1).toString();
    let fullContent = '';

    // Build history turns (last 8 turns, strip metadata from history)
    const historyTurns = updatedMessages
      .slice(-8)
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.text
          .replace(/<kompilot_metadata>[\s\S]*?<\/kompilot_metadata>/g, '')
          .replace(/\[POST_DRAFT\][\s\S]*?\[\/POST_DRAFT\]/g, '')
          .trim(),
      }));

    const enrichedSystemPrompt = extraSystemContext
      ? `${systemPrompt}\n\n${extraSystemContext}`
      : systemPrompt;

    try {
      await blink.ai.streamText(
        {
          messages: [
            { role: 'system', content: enrichedSystemPrompt },
            ...historyTurns,
          ],
          model: resolvedModel,
          maxTokens: resolvedMaxTokens,
        },
        (chunk: string) => {
          fullContent += chunk;
          setMessages(prev => {
            const others = prev.filter(m => m.id !== aiMsgId);
            return [...others, {
              id: aiMsgId,
              role: 'assistant',
              text: fullContent,
              timestamp: new Date(),
            }];
          });
        },
      );

      // Parse the final response
      const parsed = parseEngineResponse(fullContent);

      // Update the message with parsed data
      setMessages(prev => prev.map(m =>
        m.id === aiMsgId
          ? { ...m, text: parsed.content, metadata: parsed.metadata, postDraft: parsed.postDraft }
          : m,
      ));

      // Fire callbacks
      if (parsed.metadata) {
        setCurrentMetadata(parsed.metadata);
        onMetadataParsed?.(parsed.metadata);
      }
      if (parsed.postDraft) {
        onPostDraft?.(parsed.postDraft);
      }

      return parsed;
    } catch (error: any) {
      const errorMsg: EngineMessage = {
        id: aiMsgId,
        role: 'assistant',
        text: 'Le moteur IA est temporairement indisponible. Réessayez dans quelques instants.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
      return null;
    } finally {
      setStreaming(false);
    }
  }, [messages, systemPrompt, extraSystemContext, resolvedModel, resolvedMaxTokens, onMetadataParsed, onPostDraft]);

  /**
   * Clear all messages and reset state.
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentMetadata(null);
  }, []);

  /**
   * Send a message without adding it to the visible message list.
   * Useful for inline/one-shot queries (Command Bar).
   * Returns the raw parsed response.
   */
  const queryInline = useCallback(async (userText: string): Promise<ParsedEngineResponse | null> => {
    const trimmed = userText.trim();
    if (!trimmed) return null;

    setStreaming(true);
    let fullContent = '';

    const contextPrefix = extraSystemContext
      ? `[Contexte: ${extraSystemContext}]\n\n`
      : '';

    try {
      await blink.ai.streamText(
        {
          messages: [
            { role: 'system', content: KOMPILOT_ENGINE_INLINE_PROMPT },
            { role: 'user', content: `${contextPrefix}${trimmed}` },
          ],
          model: 'gpt-4.1-mini',
          maxTokens: 300,
        },
        (chunk: string) => {
          fullContent += chunk;
        },
      );

      const parsed = parseEngineResponse(fullContent);

      if (parsed.metadata) {
        setCurrentMetadata(parsed.metadata);
        onMetadataParsed?.(parsed.metadata);
      }

      return parsed;
    } catch {
      return null;
    } finally {
      setStreaming(false);
    }
  }, [extraSystemContext, onMetadataParsed]);

  return {
    messages,
    setMessages,
    streaming,
    currentMetadata,
    sendMessage,
    queryInline,
    clearMessages,
  };
}
