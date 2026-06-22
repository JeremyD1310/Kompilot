import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, RefreshCw, Bot } from 'lucide-react';
import { Button, toast } from '@blinkdotnew/ui';
import { cn } from '@blinkdotnew/ui';
import { aiGenerate } from '../../lib/aiRouterClient';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

interface AICopilotPanelProps {
  context: string;
  suggestions?: string[];
}

export function AICopilotPanel({ context, suggestions = [] }: AICopilotPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const systemContext = `Tu es l'IA Kompilot expert en ${context} pour une petite entreprise française. Donne des conseils concrets, des idées de posts, des tendances réseaux sociaux actuelles et des conseils pour développer le business. Réponses courtes (3-5 lignes max), en français, actionables immédiatement.`;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 150);
  }, [isOpen]);

  // ── Listen for global Ctrl+K / Cmd+K shortcut ────────────────────────────
  useEffect(() => {
    function handleOpen(e: Event) {
      setIsOpen(true);
      const prompt = (e as CustomEvent<{ prompt?: string }>).detail?.prompt;
      if (prompt) {
        setInput(prompt);
      }
    }
    window.addEventListener('kompilot:open-chat', handleOpen);
    return () => window.removeEventListener('kompilot:open-chat', handleOpen);
  }, []);

  async function sendMessage(text: string) {
    if (!text.trim() || isGenerating) return;
    const userMsg: Message = { role: 'user', text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsGenerating(true);
    try {
      const res = await aiGenerate({
        taskType: 'CREATIVE_CONTENT',
        prompt: text.trim(),
        systemContext,
      });
      setMessages(prev => [...prev, { role: 'ai', text: res.content }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur IA';
      toast.error(msg);
      setMessages(prev => [...prev, { role: 'ai', text: `❌ ${msg}` }]);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  }

  // ── Collapsed button ──────────────────────────────────────────────────────────
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-1 group"
        aria-label="Ouvrir le Copilote IA"
      >
        <span className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-500 shadow-2xl shadow-teal-500/40 transition-transform duration-200 group-hover:scale-110 group-active:scale-95">
          <span className="absolute inset-0 rounded-2xl bg-teal-400 animate-ping opacity-30" />
          <Sparkles className="w-6 h-6 text-primary-foreground relative z-10" />
        </span>
        <span className="text-[10px] font-semibold text-teal-600 bg-background/90 px-1.5 py-0.5 rounded-full shadow-sm border border-teal-100">
          Copilote IA
        </span>
        <span className="hidden sm:block text-[9px] font-mono font-bold text-teal-500/70 tracking-wide">
          ⌘K
        </span>
      </button>
    );
  }

  // ── Open panel ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 max-h-[520px] flex flex-col rounded-2xl shadow-2xl border border-border bg-background overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-teal-500 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-white" />
          <span className="text-sm font-semibold text-white">Copilote IA</span>
          <span className="text-[10px] text-teal-100 bg-teal-600/50 px-1.5 py-0.5 rounded-full truncate max-w-[110px]">
            {context}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-teal-100 hover:text-white hover:bg-teal-600/50"
            onClick={() => setMessages([])} title="Réinitialiser">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-teal-100 hover:text-white hover:bg-teal-600/50"
            onClick={() => setIsOpen(false)}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
            <Bot className="w-8 h-8 text-teal-400" />
            <p className="text-xs text-muted-foreground">Posez une question ou choisissez une suggestion ci-dessous.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn(
              'max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed',
              m.role === 'user'
                ? 'bg-teal-500 text-white rounded-br-none'
                : 'bg-accent text-foreground rounded-bl-none border border-border'
            )}>
              {m.text}
            </div>
          </div>
        ))}
        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-accent border border-border rounded-xl rounded-bl-none px-3 py-2 flex gap-1 items-center">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick suggestions */}
      {suggestions.length > 0 && messages.length === 0 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1 shrink-0">
          {suggestions.slice(0, 3).map((s, i) => (
            <button key={i} onClick={() => sendMessage(s)}
              className="text-[10px] px-2 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-colors truncate max-w-full">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-accent/30 shrink-0">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Posez votre question…"
          disabled={isGenerating}
          className="flex-1 text-xs bg-transparent outline-none placeholder:text-muted-foreground text-foreground min-w-0"
        />
        <Button size="icon" className="h-7 w-7 shrink-0 bg-teal-500 hover:bg-teal-600 text-white rounded-lg"
          onClick={() => sendMessage(input)} disabled={!input.trim() || isGenerating}>
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
