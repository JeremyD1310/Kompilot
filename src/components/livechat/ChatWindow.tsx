/**
 * ChatWindow — message thread panel for live chat.
 * Features: real messages, typing indicator, AI suggestions, quick replies,
 * priority picker, resolve button.
 */
import { useState, useEffect, useRef } from 'react';
import { useLiveChat, ChatChannel, Priority } from '../../context/LiveChatContext';
import { cn } from '@/lib/utils';
import { toast } from '@blinkdotnew/ui';
import {
  Send, Sparkles, RefreshCw, CheckCircle2, AlertTriangle,
  RotateCcw, Globe, MessageCircle,
  ChevronDown, Tag, User, Clock,
} from 'lucide-react';
import { InstagramIcon, FacebookIcon } from '../icons/SocialIcons';

// ── Channel helpers ───────────────────────────────────────────────────────────

function channelLabel(ch: ChatChannel) {
  switch (ch) {
    case 'website':   return 'Site web';
    case 'whatsapp':  return 'WhatsApp';
    case 'instagram': return 'Instagram';
    case 'facebook':  return 'Facebook';
  }
}

function channelBadge(ch: ChatChannel) {
  switch (ch) {
    case 'website':   return 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400';
    case 'whatsapp':  return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400';
    case 'instagram': return 'bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400';
    case 'facebook':  return 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400';
  }
}

function channelAvatar(ch: ChatChannel) {
  switch (ch) {
    case 'website':   return 'bg-teal-500 text-white';
    case 'whatsapp':  return 'bg-[#25D366] text-white';
    case 'instagram': return 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white';
    case 'facebook':  return 'bg-[#1877F2] text-white';
  }
}

function channelIcon(ch: ChatChannel) {
  switch (ch) {
    case 'website':   return <Globe size={12} />;
    case 'whatsapp':  return <MessageCircle size={12} />;
    case 'instagram': return <InstagramIcon className="w-3 h-3" />;
    case 'facebook':  return <FacebookIcon className="w-3 h-3" />;
  }
}

// ── Quick replies ─────────────────────────────────────────────────────────────

const QUICK_REPLIES = [
  'Bonjour ! Comment puis-je vous aider ? 😊',
  'Merci pour votre message, je reviens vers vous dans quelques minutes.',
  'Bien noté ! Je transmets votre demande.',
  'Réservez directement en ligne 👉 planity.com ✨',
  'Nous sommes ouverts du lundi au samedi, 9h–19h.',
];

// ── AI suggestion engine ──────────────────────────────────────────────────────

function getAISuggestions(preview: string, name: string) {
  const lower = preview.toLowerCase();
  const first = name.split(' ')[0];
  if (lower.includes('tarif') || lower.includes('prix') || lower.includes('combien'))
    return [`Bonjour ${first} ! Nos tarifs démarrent à 45€. Pour voir toutes nos prestations 👉 planity.com ✨`, `Bonjour ${first} ! Retrouvez notre grille tarifaire complète sur notre page de réservation en ligne 😊`];
  if (lower.includes('réservation') || lower.includes('réserver') || lower.includes('confirmée'))
    return [`Bonjour ${first} ! Votre réservation est bien confirmée. Nous vous attendons avec plaisir 😊`, `Bonjour ${first} ! Oui c'est bien noté. À très bientôt !`];
  if (lower.includes('chèque') || lower.includes('cadeau'))
    return [`Bonjour ${first} ! Oui nous proposons des chèques cadeaux numériques, envoyés par email immédiatement 🎁 Commandez ici 👉 planity.com`, `Bonjour ${first} ! Nos chèques cadeaux sont disponibles en ligne, livraison instantanée par email ✨`];
  if (lower.includes('accessible') || lower.includes('pmr') || lower.includes('mobilité'))
    return [`Bonjour ${first} ! Oui notre établissement est entièrement accessible PMR. L'entrée est de plain-pied et nous avons des sanitaires adaptés. À bientôt !`, `Bonjour ${first} ! Nous avons tout prévu pour l'accessibilité. N'hésitez pas à nous appeler si vous avez des besoins spécifiques.`];
  return [`Bonjour ${first} ! Merci pour votre message 😊 Comment puis-je vous aider ?`, `Bonjour ${first} ! Bien noté. Je reviens vers vous dans les plus brefs délais 🌟`];
}

// ── Priority badge ────────────────────────────────────────────────────────────

const PRIORITY_OPTIONS: { id: Priority; label: string; color: string }[] = [
  { id: 'urgent', label: 'Urgent', color: 'text-red-600 bg-red-100 border-red-200 dark:bg-red-950/30 dark:text-red-400' },
  { id: 'normal', label: 'Normal', color: 'text-amber-600 bg-amber-100 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400' },
  { id: 'low',    label: 'Faible', color: 'text-muted-foreground bg-muted border-border' },
];

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4 p-10">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
        <MessageCircle size={32} className="text-muted-foreground/50" />
      </div>
      <div className="text-center">
        <p className="text-base font-bold text-foreground">Sélectionnez une conversation</p>
        <p className="text-sm mt-1">Vos messages de toutes les plateformes centralisés ici.</p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {(['website', 'whatsapp', 'instagram', 'facebook'] as ChatChannel[]).map(ch => (
          <span key={ch} className={cn('flex items-center gap-1.5 text-[10px] font-bold border rounded-full px-3 py-1', channelBadge(ch))}>
            {channelIcon(ch)}
            {channelLabel(ch)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ChatWindow() {
  const { conversations, selectedId, sendMessage, markResolved, markOpen, setPriority } = useLiveChat();
  const conversation = conversations.find(c => c.id === selectedId) ?? null;

  const [draft, setDraft]               = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [suggestionIdx, setSuggestionIdx] = useState(0);
  const [aiLoading, setAiLoading]       = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages.length, conversation?.isClientTyping]);

  // Reset draft on conversation change
  useEffect(() => {
    setDraft('');
    setSuggestionIdx(0);
    setShowQuickReplies(false);
  }, [selectedId]);

  if (!conversation) return <EmptyState />;

  const suggestions = getAISuggestions(conversation.preview, conversation.clientName);
  const currentSuggestion = suggestions[suggestionIdx % suggestions.length];

  const handleSend = () => {
    if (!draft.trim()) return;
    sendMessage(conversation.id, draft.trim());
    setDraft('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAIGenerate = async () => {
    setAiLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setDraft(currentSuggestion);
    setAiLoading(false);
    toast.success('Réponse IA générée ✨');
  };

  const priorityConfig = PRIORITY_OPTIONS.find(p => p.id === conversation.priority)!;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border shrink-0 bg-background/95 backdrop-blur-sm">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold shadow-sm', channelAvatar(conversation.channel))}>
            {conversation.clientInitials}
          </div>
          {conversation.isClientOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
          )}
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-foreground truncate">{conversation.clientName}</p>
            {conversation.isClientOnline
              ? <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />En ligne</span>
              : <span className="text-[10px] text-muted-foreground">Hors ligne</span>
            }
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={cn('flex items-center gap-1 text-[9px] font-bold border rounded-full px-1.5 py-0.5', channelBadge(conversation.channel))}>
              {channelIcon(conversation.channel)}
              {channelLabel(conversation.channel)}
            </span>
            {conversation.clientEmail && (
              <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                <User size={8} /> {conversation.clientEmail}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Priority picker */}
          <div className="relative">
            <button
              onClick={() => setShowPriorityMenu(v => !v)}
              className={cn('flex items-center gap-1 text-[10px] font-bold border rounded-lg px-2 py-1 transition-colors', priorityConfig.color)}
            >
              <AlertTriangle size={9} />
              {priorityConfig.label}
              <ChevronDown size={9} />
            </button>
            {showPriorityMenu && (
              <div className="absolute right-0 top-full mt-1 bg-background border border-border rounded-xl shadow-lg z-20 overflow-hidden min-w-[110px]">
                {PRIORITY_OPTIONS.map(p => (
                  <button key={p.id} onClick={() => { setPriority(conversation.id, p.id); setShowPriorityMenu(false); toast.success(`Priorité : ${p.label}`); }} className={cn('w-full text-left flex items-center gap-2 px-3 py-2 text-[11px] transition-colors hover:bg-muted', p.color)}>
                    <AlertTriangle size={9} /> {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tags badge */}
          {conversation.tags.length > 0 && (
            <span className="hidden sm:flex items-center gap-1 text-[9px] text-muted-foreground bg-muted rounded-lg px-2 py-1">
              <Tag size={9} />{conversation.tags[0]}
            </span>
          )}

          {/* Resolve / Reopen */}
          {conversation.status !== 'resolved' ? (
            <button
              onClick={() => { markResolved(conversation.id); toast.success('Conversation résolue ✓'); }}
              className="flex items-center gap-1.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50 rounded-lg px-3 py-1.5 hover:bg-emerald-200 transition-colors"
            >
              <CheckCircle2 size={12} /> Résoudre
            </button>
          ) : (
            <button
              onClick={() => { markOpen(conversation.id); toast.success('Conversation réouverte'); }}
              className="flex items-center gap-1.5 text-[10px] font-bold bg-muted text-muted-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted/80 transition-colors"
            >
              <RotateCcw size={12} /> Réouvrir
            </button>
          )}
        </div>
      </div>

      {/* ── Status banner for pending ── */}
      {conversation.waitingMinutes && conversation.status === 'pending' && (
        <div className="px-5 py-2 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800/50 flex items-center gap-2">
          <Clock size={12} className="text-amber-600" />
          <p className="text-xs text-amber-700 dark:text-amber-400">Client en attente depuis <strong>{conversation.waitingMinutes} min</strong> — répondez rapidement pour améliorer votre satisfaction client.</p>
        </div>
      )}

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-4 bg-muted/5">
        {conversation.messages.map(msg => (
          <div key={msg.id} className={cn('flex flex-col max-w-[78%]', msg.from === 'agent' ? 'ml-auto items-end' : 'items-start')}>
            <div className={cn(
              'px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm',
              msg.from === 'agent'
                ? 'bg-primary text-primary-foreground rounded-tr-none'
                : 'bg-background border border-border rounded-tl-none dark:bg-muted/30'
            )}>
              {msg.text}
            </div>
            <div className="flex items-center gap-1.5 mt-1 px-1">
              <span className="text-[10px] text-muted-foreground">{msg.time}</span>
              {msg.from === 'agent' && (
                <span className="text-[9px] font-bold text-primary/60">Vous</span>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {conversation.isClientTyping && (
          <div className="flex items-start">
            <div className="bg-background border border-border rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5">
              {[0,1,2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Reply zone ── */}
      <div className="px-5 py-4 border-t border-border bg-background shrink-0 space-y-3">
        {/* Quick replies */}
        {showQuickReplies && (
          <div className="bg-muted/40 rounded-xl p-3 space-y-1.5 border border-border">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Réponses rapides</p>
            {QUICK_REPLIES.map((r, i) => (
              <button key={i} onClick={() => { setDraft(r); setShowQuickReplies(false); }} className="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-background border border-transparent hover:border-border transition-all text-foreground/80">
                {r}
              </button>
            ))}
          </div>
        )}

        {/* Textarea row */}
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Répondre à ${conversation.clientName.split(' ')[0]}… (Entrée pour envoyer)`}
              rows={2}
              disabled={conversation.status === 'resolved'}
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!draft.trim() || conversation.status === 'resolved'}
            className="shrink-0 w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shadow-sm"
          >
            <Send size={16} />
          </button>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleAIGenerate}
            disabled={aiLoading || conversation.status === 'resolved'}
            className="flex items-center gap-1.5 text-[10px] font-semibold bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-700 rounded-lg px-2.5 py-1.5 hover:bg-violet-100 transition-colors disabled:opacity-50"
          >
            {aiLoading ? <RefreshCw size={10} className="animate-spin" /> : <Sparkles size={10} />}
            {aiLoading ? 'Génération…' : 'Suggestion IA ✨'}
          </button>
          <button
            onClick={() => setSuggestionIdx(v => v + 1)}
            disabled={conversation.status === 'resolved'}
            className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground rounded-lg px-2 py-1.5 hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw size={10} /> Autre suggestion
          </button>
          <button
            onClick={() => setShowQuickReplies(v => !v)}
            disabled={conversation.status === 'resolved'}
            className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground rounded-lg px-2 py-1.5 hover:bg-muted transition-colors disabled:opacity-50"
          >
            ⚡ Réponses rapides
          </button>
          <span className="ml-auto text-[10px] text-muted-foreground">via {channelLabel(conversation.channel)}</span>
        </div>

        {/* AI suggestion preview */}
        {currentSuggestion && conversation.status !== 'resolved' && (
          <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 relative overflow-hidden">
            <div className="absolute top-2 right-2 opacity-10">
              <Sparkles size={28} className="text-primary" />
            </div>
            <p className="text-[10px] font-bold text-primary flex items-center gap-1.5 mb-2">
              <Sparkles size={10} /> Suggestion Kompilot
            </p>
            <p className="text-xs text-foreground/80 leading-relaxed italic mb-2">"{currentSuggestion}"</p>
            <button
              onClick={() => { setDraft(currentSuggestion); toast.success('Suggestion copiée !'); }}
              className="text-[10px] font-bold text-primary hover:underline"
            >
              Utiliser cette réponse →
            </button>
          </div>
        )}

        {/* Resolved notice */}
        {conversation.status === 'resolved' && (
          <div className="text-center py-2">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
              <CheckCircle2 size={12} className="text-emerald-500" /> Cette conversation est résolue. Réouvrez-la pour répondre.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
