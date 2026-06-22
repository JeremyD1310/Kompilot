/**
 * AIChatWidget — Floating AI chat bubble for Kompilot.
 *
 * Visual component only. All AI call logic lives in useAIChatMessages.
 * Conversation memory (last 5 sessions) lives in useChatMemory.
 * Emotional context injection lives in lib/emotionalCopywriting.ts.
 * System prompt lives in lib/aiChatSystemPrompt.ts.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Bot, Sparkles, ChevronDown, Calendar, TrendingUp, Inbox, Settings, History, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { Button } from '@blinkdotnew/ui';
import { useUserProfile } from '../../context/UserProfileContext';
import { useEstablishment } from '../../context/EstablishmentContext';
import { extractPostDraft } from '../../lib/aiChatSystemPrompt';
import { useAIChatMessages, type ChatMessage } from '../../hooks/useAIChatMessages';
import { useChatMemory } from '../../hooks/useChatMemory';
import { VoiceInputButton } from './VoiceInputButton';

// ── Typing indicator ──────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: '900ms' }}
        />
      ))}
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────

function ChatBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  const navigate = useNavigate();
  const draftText = !isUser ? extractPostDraft(msg.text) : null;
  const cleanText = msg.text.replace(/\[POST_DRAFT\][\s\S]*?\[\/POST_DRAFT\]/g, '').trim();

  const renderText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1
        ? <strong key={i} className="font-bold">{part}</strong>
        : part.split('\n').map((line, j, arr) => (
            <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
          ))
    );
  };

  return (
    <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
      <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isUser && (
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
            <Bot size={14} className="text-primary-foreground" />
          </div>
        )}
        <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'bg-foreground text-background rounded-tr-sm'
            : 'bg-muted text-foreground rounded-tl-sm border border-border/50'
        }`}>
          {renderText(cleanText)}
          <p className={`text-[10px] mt-1 ${isUser ? 'text-background/50 text-right' : 'text-muted-foreground'}`}>
            {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
      {draftText && (
        <div className="ml-9 mt-1 w-[82%] bg-primary/5 border border-primary/20 rounded-xl p-3 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
            <Calendar size={12} />
            Brouillon de publication
          </div>
          <p className="text-xs text-foreground/80 italic line-clamp-3">"{draftText}"</p>
          <Button size="sm" className="w-full text-[11px] h-8 gap-2"
            onClick={() => { localStorage.setItem('ai_quick_draft', draftText); navigate({ to: '/cockpit' }); }}>
            📅 Ouvrir dans le Cockpit
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Memory panel ─────────────────────────────────────────────────────────────

interface MemoryPanelProps {
  conversations: import('../../hooks/useChatMemory').StoredConversation[];
  onClear: () => void;
  onClose: () => void;
}

function MemoryPanel({ conversations, onClear, onClose }: MemoryPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <History size={15} className="text-primary" />
          <p className="font-bold text-sm text-foreground">Mémoire des conversations</p>
        </div>
        <div className="flex items-center gap-2">
          {conversations.length > 0 && (
            <button
              onClick={onClear}
              className="flex items-center gap-1.5 text-[11px] text-red-500 hover:text-red-600 font-semibold transition-colors"
              title="Effacer la mémoire"
            >
              <Trash2 size={11} /> Tout effacer
            </button>
          )}
          <button onClick={onClose} className="w-6 h-6 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
            <X size={12} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-8">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <History size={18} className="text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">Aucune conversation mémorisée</p>
            <p className="text-[11px] text-muted-foreground/60">Les 5 dernières sessions seront sauvegardées automatiquement.</p>
          </div>
        ) : (
          conversations.map((conv, i) => {
            const date = new Date(conv.sessionDate).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
            });
            return (
              <div key={conv.id} className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-primary">Session {i + 1}</span>
                  <span className="text-[10px] text-muted-foreground">{date}</span>
                </div>
                <p className="text-xs font-medium text-foreground line-clamp-2">
                  "{conv.summary}"
                </p>
                <div className="space-y-1">
                  {conv.messages.slice(0, 3).map((m, j) => (
                    <p key={j} className={`text-[11px] line-clamp-1 ${m.role === 'user' ? 'text-foreground' : 'text-muted-foreground'}`}>
                      <span className="font-semibold">{m.role === 'user' ? 'Vous' : 'IA'} :</span>{' '}
                      {m.text.slice(0, 80)}
                    </p>
                  ))}
                  {conv.messages.length > 3 && (
                    <p className="text-[11px] text-muted-foreground/60">+{conv.messages.length - 3} messages…</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="px-4 pb-3 shrink-0">
        <p className="text-[10px] text-muted-foreground/60 text-center">
          {conversations.length}/{5} conversations mémorisées · Stockage local uniquement
        </p>
      </div>
    </div>
  );
}

// ── Context-aware quick chips ─────────────────────────────────────────────────

interface ContextChip { label: string; query: string; icon: React.ElementType; }

function getContextChips(pathname: string): ContextChip[] {
  if (pathname.startsWith('/calendar')) return [
    { label: '💡 Idée de post', query: "Génère une idée de post engageante pour cette semaine", icon: Sparkles },
    { label: '📅 Meilleur moment', query: "Quel est le meilleur moment pour publier sur Instagram cette semaine ?", icon: Calendar },
    { label: '📸 Idée visuel', query: "Propose-moi un concept photo ou vidéo percutant pour mon activité", icon: Sparkles },
  ];
  if (pathname.startsWith('/inbox')) return [
    { label: '✍️ Répondre vite', query: "Comment répondre rapidement et professionnellement à mes messages clients ?", icon: Inbox },
    { label: '⭐ Avis négatif', query: "Comment répondre à un avis négatif Google pour limiter les dégâts ?", icon: TrendingUp },
    { label: '🤝 Fidéliser', query: "Donne-moi 3 façons de fidéliser un client qui vient de m'écrire", icon: Sparkles },
  ];
  if (pathname.startsWith('/performance')) return [
    { label: '📈 Améliorer ROI', query: "Comment augmenter mon ROI réseaux sociaux ce mois ?", icon: TrendingUp },
    { label: '💡 Créer un post', query: "Génère un post basé sur mes meilleures performances", icon: Sparkles },
    { label: '⭐ Réponse avis', query: "Réfléchissons à une stratégie pour répondre aux avis Google", icon: Calendar },
  ];
  if (pathname.startsWith('/settings')) return [
    { label: '⚙️ Optimiser profil', query: "Quelles infos sont les plus importantes à renseigner dans mes paramètres ?", icon: Settings },
    { label: '🔗 Connecter comptes', query: "Comment connecter mes réseaux sociaux à Kompilot ?", icon: Sparkles },
  ];
  if (pathname.startsWith('/agence') || pathname.startsWith('/agency')) return [
    { label: '📊 Cas client', query: "Comment générer une étude de cas client anonymisée pour ma prospection agence ?", icon: TrendingUp },
    { label: '✍️ Script B2B', query: "Génère-moi un post LinkedIn de prospection B2B haute conversion pour le secteur restauration", icon: Sparkles },
    { label: '📩 Newsletter', query: "Rédige un email de prospection agence avec les métriques sectorielles Kompilot", icon: Inbox },
    { label: '🔥 Pitch urgence', query: "Donne-moi un pitch de closing agressif pour convaincre un restaurant de s'abonner", icon: TrendingUp },
  ];
  return [
    { label: '💡 Créer un post rapide', query: "Génère un post engageant pour mes réseaux sociaux aujourd'hui", icon: Sparkles },
    { label: '⏱️ Je n\'ai pas le temps', query: "Je n'ai pas le temps de publier, comment faire ?", icon: Sparkles },
    { label: '💶 Mon ROI', query: "Comment est-ce que Kompilot me rapporte de l'argent concrètement ?", icon: TrendingUp },
    { label: '⭐ Avis Google', query: "Comment gérer mes avis Google efficacement ?", icon: Sparkles },
  ];
}

function getPageLabel(pathname: string): string {
  if (pathname.startsWith('/calendar')) return 'Calendrier';
  if (pathname.startsWith('/inbox')) return 'Messagerie';
  if (pathname.startsWith('/performance')) return 'Performance';
  if (pathname.startsWith('/settings')) return 'Paramètres';
  if (pathname.startsWith('/agence') || pathname.startsWith('/agency')) return 'Agence';
  if (pathname.startsWith('/cockpit')) return 'Cockpit IA';
  if (pathname.startsWith('/analytics')) return 'Analytiques';
  return 'Tableau de bord';
}

// ── Main widget ───────────────────────────────────────────────────────────────

export function AIChatWidget() {
  const { user } = useAuth();
  const { masterProfile, granularSector } = useUserProfile();
  const { activeEstablishment } = useEstablishment();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [hasUnread, setHasUnread] = useState(true);
  const [showMemory, setShowMemory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const welcomeSent = useRef(false);
  const pendingQueryRef = useRef<string | null>(null);

  // ── Memory ────────────────────────────────────────────────────────────────
  const { conversations, saveConversation, buildMemoryContext, clearMemory } =
    useChatMemory(user?.id);

  const { messages, setMessages, typing, sendMessage } = useAIChatMessages({
    pathname: location.pathname,
    masterProfile: masterProfile ?? null,
    granularSector: granularSector ?? null,
    establishmentName: activeEstablishment?.name,
    memoryContext: buildMemoryContext(),
  });

  // ── Save conversation when widget closes ─────────────────────────────────
  const handleClose = useCallback(() => {
    saveConversation(messages);
    setOpen(false);
    setShowMemory(false);
  }, [messages, saveConversation]);

  // Listen for external open events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ query?: string }>).detail;
      setOpen(true);
      if (detail?.query) pendingQueryRef.current = detail.query;
    };
    window.addEventListener('open_ai_chat', handler);
    return () => window.removeEventListener('open_ai_chat', handler);
  }, []);

  // Drain pending query once open
  useEffect(() => {
    if (open && pendingQueryRef.current) {
      const q = pendingQueryRef.current;
      pendingQueryRef.current = null;
      setTimeout(() => { setInput(q); inputRef.current?.focus(); }, 400);
    }
  }, [open]);

  // Welcome message on first open
  const firstName = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'vous';
  const currentPageLabel = getPageLabel(location.pathname);
  useEffect(() => {
    if (open && !welcomeSent.current) {
      welcomeSent.current = true;
      setHasUnread(false);

      // Personalise welcome if we have memory
      const hasMemory = conversations.length > 0;
      const memoryNote = hasMemory
        ? `\n\nJe me souviens de nos **${conversations.length} dernière${conversations.length > 1 ? 's' : ''} conversation${conversations.length > 1 ? 's' : ''}** — n'hésitez pas à reprendre là où on s'était arrêtés. 🧠`
        : '';

      const welcome = {
        id: 'welcome', role: 'assistant' as const,
        text: `Bonjour ${firstName} ! 👋 Je suis votre **directeur marketing de poche** — l'IA de Kompilot.\n\nJe suis là pour vous aider à remplir votre agenda, gagner du temps et mesurer ce que ça vous rapporte concrètement. 💶${memoryNote}\n\nComment puis-je vous aider aujourd'hui sur la page **${currentPageLabel}** ?`,
        timestamp: new Date(),
      };
      setTimeout(() => setMessages([welcome]), 400);
    }
    if (open) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open, firstName, currentPageLabel, setMessages, conversations.length]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); setInput(''); }
  };
  const handleSend = () => { sendMessage(input); setInput(''); };

  const contextChips = getContextChips(location.pathname);

  return (
    <>
      {/* ── Floating bubble ── */}
      <button
        data-tour="copilot-chat-widget"
        onClick={() => open ? handleClose() : setOpen(true)}
        style={{ bottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}
        className={`nc-chat-trigger fixed left-5 z-[80] transition-all duration-300 shadow-[0_8px_32px_-4px_hsl(var(--primary)/0.6)] flex items-center justify-center hover:scale-105 active:scale-95 min-h-[48px] min-w-[48px] ${
          open
            ? 'w-12 h-12 rounded-full bg-background border border-border text-foreground'
            : 'h-14 px-5 rounded-full bg-primary text-primary-foreground'
        }`}
        aria-label="Ouvrir l'assistant IA"
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown size={22} />
          ) : (
            <>
              <Sparkles size={20} className="animate-pulse" />
              <span className="hidden md:block font-bold text-sm">✨ Copilote</span>
            </>
          )}
        </div>
        {hasUnread && !open && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-background flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">1</span>
          </span>
        )}
        {/* Memory badge — small dot when memory is loaded */}
        {conversations.length > 0 && !open && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary border-2 border-background flex items-center justify-center" title={`${conversations.length} conversations mémorisées`}>
            <History size={6} className="text-primary-foreground" />
          </span>
        )}
      </button>

      {/* ── Chat window ── */}
      {open && (
        <div
          className="nc-chat-window fixed left-5 z-[80] w-[380px] max-w-[calc(100vw-1.5rem)] bg-background border border-border rounded-3xl shadow-[0_24px_64px_-12px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300"
          style={{ bottom: 'calc(96px + env(safe-area-inset-bottom, 0px))', height: 560 }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 bg-primary shrink-0">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Sparkles size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-tight">Assistant Kompilot AI</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <p className="text-[11px] text-white/70">
                  En ligne · Répond instantanément
                  {conversations.length > 0 && (
                    <span className="ml-1.5 text-white/50">· 🧠 {conversations.length} session{conversations.length > 1 ? 's' : ''} mémorisée{conversations.length > 1 ? 's' : ''}</span>
                  )}
                </p>
              </div>
            </div>
            {/* Memory toggle button */}
            <button
              onClick={() => setShowMemory(v => !v)}
              title="Voir les conversations mémorisées"
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors shrink-0 relative ${showMemory ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'}`}
            >
              <History size={14} className="text-white" />
              {conversations.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-400 border border-primary text-[7px] font-black text-primary flex items-center justify-center">
                  {conversations.length}
                </span>
              )}
            </button>
            <button onClick={handleClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0">
              <X size={14} className="text-white" />
            </button>
          </div>

          {/* ── Memory panel overlay ── */}
          {showMemory ? (
            <MemoryPanel
              conversations={conversations}
              onClear={() => { clearMemory(); setShowMemory(false); }}
              onClose={() => setShowMemory(false)}
            />
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Bot size={24} className="text-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground">Chargement de l'assistant…</p>
                  </div>
                )}
                {messages.map(msg => <ChatBubble key={msg.id} msg={msg} />)}
                {typing && (
                  <div className="flex gap-2 items-start">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Bot size={14} className="text-primary-foreground" />
                    </div>
                    <div className="bg-muted border border-border/50 rounded-2xl rounded-tl-sm">
                      <TypingDots />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick chips */}
              {messages.length <= 1 && !typing && (
                <div className="px-4 py-2 flex gap-2 overflow-x-auto shrink-0 border-t border-border/50">
                  {contextChips.map(chip => (
                    <button key={chip.label} onClick={() => { sendMessage(chip.query); }}
                      className="shrink-0 text-[11px] font-medium rounded-full border border-border bg-muted/50 hover:bg-muted hover:border-primary/40 px-3 py-1.5 transition-colors whitespace-nowrap flex items-center gap-1">
                      <chip.icon size={12} />
                      {chip.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="px-4 py-3 border-t border-border shrink-0 flex items-center gap-2">
                <VoiceInputButton
                  onTranscript={(text) => setInput(text)}
                  disabled={typing}
                  size="sm"
                  showOverlay
                />
                <input ref={inputRef} type="text" value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Tapez votre question…"
                  disabled={typing}
                  className="flex-1 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50"
                />
                <button onClick={handleSend} disabled={!input.trim() || typing}
                  className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                  <Send size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}