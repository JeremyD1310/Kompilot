/**
 * AIPostAssistant — Dashboard AI panel for generating social media posts.
 * Streams suggestions from the backend AI router based on user input +
 * upcoming calendar events as context.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Badge, toast } from '@blinkdotnew/ui';
import {
  Sparkles, Send, Copy, Wand2, Calendar, RefreshCw,
  ChevronDown, ChevronUp, Zap, Check, X,
} from 'lucide-react';
import { aiGenerate } from '../../lib/aiRouterClient';
import { useEstablishment } from '../../context/EstablishmentContext';
import { type ScheduledPost } from '../../hooks/useScheduledPosts';
import { AIErrorFallback } from '../shared/AIErrorFallback';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AIPostAssistantProps {
  /** Upcoming scheduled posts for calendar context */
  upcomingPosts?: ScheduledPost[];
  /** Called when user clicks "Créer ce post" with the generated text */
  onCreatePost?: (text: string, channels: string[]) => void;
}

// ── Quick prompt chips ─────────────────────────────────────────────────────────

const PROMPT_CHIPS = [
  { label: '🎉 Promo spéciale', prompt: 'Rédige un post promotionnel percutant pour attirer des clients avec une offre spéciale' },
  { label: '⭐ Demande d\'avis', prompt: 'Crée un post pour demander à mes clients de laisser un avis Google de façon naturelle' },
  { label: '📅 Événement à venir', prompt: 'Annonce un événement ou une nouveauté dans mon établissement de façon engageante' },
  { label: '📸 Partage coulisses', prompt: 'Rédige un post "coulisses" pour montrer l\'ambiance et l\'équipe de mon établissement' },
  { label: '🌟 Mise en avant produit', prompt: 'Mets en valeur un de nos produits ou services phare avec un texte engageant' },
  { label: '💬 Question abonnés', prompt: 'Pose une question engageante à ma communauté pour générer des commentaires' },
];

const CHANNEL_OPTIONS = ['Instagram', 'Facebook', 'Google My Business', 'LinkedIn'];

// ── Suggestion card ────────────────────────────────────────────────────────────

function SuggestionCard({
  text,
  onUse,
  onCopy,
}: {
  text: string;
  onUse: () => void;
  onCopy: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-teal-50/50 dark:from-primary/10 dark:to-teal-950/20 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <Sparkles size={14} className="text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-foreground leading-relaxed flex-1 whitespace-pre-wrap">{text}</p>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" onClick={onUse} className="h-7 text-xs gap-1.5 flex-1 sm:flex-none">
          <Zap size={11} /> Créer ce post
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopy}
          className="h-7 text-xs gap-1.5"
        >
          {copied ? <><Check size={11} /> Copié</> : <><Copy size={11} /> Copier</>}
        </Button>
      </div>
    </div>
  );
}

// ── Streaming text display ─────────────────────────────────────────────────────

function StreamingText({ text, isStreaming }: { text: string; isStreaming: boolean }) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-teal-50/50 dark:from-primary/10 dark:to-teal-950/20 p-4">
      <div className="flex items-start gap-2">
        <Sparkles size={14} className="text-primary shrink-0 mt-0.5 animate-pulse" />
        <p className="text-sm text-foreground leading-relaxed flex-1 whitespace-pre-wrap">
          {text}
          {isStreaming && (
            <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
          )}
        </p>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function AIPostAssistant({ upcomingPosts = [], onCreatePost }: AIPostAssistantProps) {
  const { activeEstablishment } = useEstablishment();
  const [prompt, setPrompt] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['Instagram', 'Facebook']);
  const [suggestion, setSuggestion] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showChannels, setShowChannels] = useState(false);
  const [showCalendarContext, setShowCalendarContext] = useState(false);
  const [aiError, setAiError] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup interval and prevent state updates after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Build calendar context from upcoming posts
  const calendarContext = upcomingPosts
    .slice(0, 5)
    .map(p => {
      const channels = (() => {
        try { return (JSON.parse(p.channels) as string[]).join(', '); }
        catch { return p.channels; }
      })();
      const date = p.scheduledAt
        ? new Date(p.scheduledAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
        : 'non daté';
      return `• ${date} — ${p.textContent.slice(0, 80)}${p.textContent.length > 80 ? '…' : ''} (${channels})`;
    })
    .join('\n');

  const toggleChannel = (ch: string) => {
    setSelectedChannels(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    );
  };

  // Progressive text reveal — backend returns full text (no SSE yet).
  // Reveals words at 40ms intervals to give a streaming-like UX.
  const streamReveal = useCallback((fullText: string) => {
    if (!isMountedRef.current) return;
    // Clear any existing interval before starting a new one
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsStreaming(true);
    setSuggestion('');
    const words = fullText.split(' ');
    let idx = 0;
    intervalRef.current = setInterval(() => {
      if (!isMountedRef.current) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }
      if (idx >= words.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsStreaming(false);
        return;
      }
      // Add 3-5 words at a time for smooth feel
      const chunk = words.slice(idx, idx + 4).join(' ');
      setSuggestion(prev => prev + (prev ? ' ' : '') + chunk);
      idx += 4;
    }, 40);
  }, []);

  const handleGenerate = async (customPrompt?: string) => {
    if (isGenerating || isStreaming) return; // Anti-spam-click guard
    const finalPrompt = customPrompt ?? prompt.trim();
    if (!finalPrompt) {
      textareaRef.current?.focus();
      return;
    }

    setIsGenerating(true);
    setSuggestion('');
    setAiError(false);

    try {
      const channelList = selectedChannels.join(', ');
      const establishmentName = activeEstablishment?.name ?? 'mon établissement';
      const businessType = activeEstablishment?.category ?? 'commerce';
      const city = (activeEstablishment as any)?.city ?? '';

      const enrichedPrompt = `
Rédige une publication optimisée pour les réseaux sociaux suivants : ${channelList}.

Consigne : ${finalPrompt}

Format attendu : texte prêt à publier, sans hashtags excessifs, en français, percutant et naturel.
Longueur : 3-5 phrases maximum pour Instagram/Facebook, 2-3 phrases pour Google My Business.
`.trim();

      const contextData: Record<string, unknown> = {
        establishmentName,
        businessType,
        ...(city ? { city } : {}),
        targetChannels: channelList,
      };

      if (calendarContext) {
        contextData.upcomingPosts = `Publications déjà planifiées (éviter les doublons) :\n${calendarContext}`;
      }

      const result = await aiGenerate({
        taskType: 'CREATIVE_CONTENT',
        prompt: enrichedPrompt,
        contextData,
        maxTokens: 512,
      });

      streamReveal(result.content);
    } catch (err: any) {
      console.error('[AIPostAssistant] generation error', err);
      setAiError(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChip = (chipPrompt: string) => {
    setPrompt(chipPrompt);
    handleGenerate(chipPrompt);
  };

  const handleUsePost = () => {
    if (!suggestion) return;
    onCreatePost?.(suggestion, selectedChannels);
    setSuggestion('');
    setPrompt('');
    toast.success('Post ouvert dans l\'éditeur');
  };

  const handleCopyPost = () => {
    navigator.clipboard.writeText(suggestion).catch(() => {});
    toast.success('Copié dans le presse-papier');
  };

  const handleRegen = () => {
    if (prompt.trim()) handleGenerate();
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-teal-500/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Wand2 size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Assistant Post IA</h3>
            <p className="text-[11px] text-muted-foreground">Génère tes publications en quelques secondes</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-[10px] font-bold gap-1 rounded-full">
          <Sparkles size={9} /> IA
        </Badge>
      </div>

      <div className="p-5 space-y-4">

        {/* Quick chips */}
        <div className="flex flex-wrap gap-1.5">
          {PROMPT_CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => handleChip(chip.prompt)}
              disabled={isGenerating}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-border bg-muted/40 hover:bg-muted/80 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div className="space-y-2">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate();
              }}
              placeholder="Décris le post que tu veux créer… (ex: annonce notre promo week-end -20%)"
              rows={2}
              className="w-full resize-none rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all pr-12"
            />
            <button
              onClick={() => prompt.trim() && setPrompt('')}
              className={`absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-opacity ${prompt ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              <X size={13} />
            </button>
          </div>

          {/* Channel selector toggle */}
          <button
            onClick={() => setShowChannels(v => !v)}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {showChannels ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Canaux : {selectedChannels.join(', ')}
          </button>

          {showChannels && (
            <div className="flex flex-wrap gap-1.5 pl-1">
              {CHANNEL_OPTIONS.map(ch => (
                <button
                  key={ch}
                  onClick={() => toggleChannel(ch)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                    selectedChannels.includes(ch)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border bg-muted/40 text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Calendar context toggle */}
        {upcomingPosts.length > 0 && (
          <div>
            <button
              onClick={() => setShowCalendarContext(v => !v)}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Calendar size={12} />
              {showCalendarContext ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {upcomingPosts.length} post{upcomingPosts.length > 1 ? 's' : ''} planifié{upcomingPosts.length > 1 ? 's' : ''} utilisé{upcomingPosts.length > 1 ? 's' : ''} comme contexte
            </button>
            {showCalendarContext && (
              <div className="mt-2 rounded-xl bg-muted/30 border border-border px-3 py-2 space-y-1">
                {upcomingPosts.slice(0, 5).map(p => {
                  const date = p.scheduledAt
                    ? new Date(p.scheduledAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                    : '—';
                  return (
                    <div key={p.id} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                      <Calendar size={10} className="shrink-0 mt-0.5 text-primary" />
                      <span className="shrink-0 font-medium text-foreground/70">{date}</span>
                      <span className="truncate">{p.textContent.slice(0, 70)}…</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Generate button */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleGenerate()}
            disabled={isGenerating || isStreaming || !prompt.trim()}
            className="gap-2 flex-1 sm:flex-none"
            size="sm"
          >
            {isGenerating ? (
              <><RefreshCw size={13} className="animate-spin" /> Génération…</>
            ) : (
              <><Send size={13} /> Générer</>
            )}
          </Button>
          {suggestion && !isStreaming && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRegen}
              disabled={isGenerating}
              className="gap-1.5 h-8 text-xs text-muted-foreground"
              title="Régénérer"
            >
              <RefreshCw size={12} /> Autre version
            </Button>
          )}
          <span className="text-[10px] text-muted-foreground ml-1 hidden sm:inline">⌘↵ pour générer</span>
        </div>

        {/* Result area */}
        {isStreaming && (
          <StreamingText text={suggestion} isStreaming={isStreaming} />
        )}

        {!isStreaming && suggestion && (
          <SuggestionCard
            text={suggestion}
            onUse={handleUsePost}
            onCopy={handleCopyPost}
          />
        )}

        {/* AI Error Fallback */}
        {aiError && !isGenerating && (
          <AIErrorFallback
            inline
            onRetry={() => {
              setAiError(false);
              handleGenerate();
            }}
          />
        )}
      </div>
    </div>
  );
}