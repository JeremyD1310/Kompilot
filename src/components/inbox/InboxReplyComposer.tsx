/**
 * InboxReplyComposer — Standalone inline reply composer for inbox messages.
 * Includes AI generation, tone selection, and quick send.
 */
import { useState, useRef, useEffect } from 'react';
import { Button, Textarea, toast } from '@blinkdotnew/ui';
import { Send, Sparkles, RefreshCw, CornerDownLeft } from 'lucide-react';
import { blink } from '../../blink/client';
import { anonymizePII } from '../../lib/piiAnonymizer';
import type { Reply } from './inboxData';

type Tone = 'professional' | 'friendly' | 'empathetic';
const TONES: { id: Tone; emoji: string; label: string }[] = [
  { id: 'professional', emoji: '💼', label: 'Pro' },
  { id: 'friendly',     emoji: '😊', label: 'Amical' },
  { id: 'empathetic',   emoji: '🤝', label: 'Empathique' },
];

interface InboxReplyComposerProps {
  messageId: string;
  senderName: string;
  messageBody: string;
  onReply: (messageId: string, reply: Reply) => void;
  initialText?: string;
  compact?: boolean;
}

export function InboxReplyComposer({
  messageId,
  senderName,
  messageBody,
  onReply,
  initialText = '',
  compact = false,
}: InboxReplyComposerProps) {
  const [replyText, setReplyText] = useState(initialText);
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [tone, setTone] = useState<Tone>('professional');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    if (initialText) setReplyText(initialText);
  }, [initialText, messageId]);

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const handleAIGenerate = async () => {
    setGenerating(true);
    setReplyText('');
    const safeBody = anonymizePII(messageBody).text;
    const toneInstr =
      tone === 'professional' ? 'Adopte un ton formel et professionnel.' :
      tone === 'friendly'     ? 'Adopte un ton chaleureux et convivial.' :
                                'Adopte un ton empathique et compréhensif.';
    const prompt = `Tu es un assistant pour un commerçant local français. Génère une réponse concise (max 80 mots) à ce message client. ${toneInstr}\n\nMessage de ${senderName}:\n"""\n${safeBody}\n"""\n\nCommence par "Bonjour ${senderName.split(' ')[0]}," sans formule d'intro.`;
    try {
      let result = '';
      await blink.ai.streamText(
        { messages: [{ role: 'user', content: prompt }], model: 'gpt-4.1-mini', maxTokens: 180 },
        (chunk) => { result += chunk; if (isMounted.current) setReplyText(result); }
      );
    } catch (err: any) {
      if (err?.message?.includes('401') || err?.name === 'BlinkAuthError') {
        blink.auth.login(window.location.href);
        return;
      }
      toast.error('Erreur IA. Réessayez dans un instant.');
    } finally {
      if (isMounted.current) setGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 400));
    const reply: Reply = {
      id: Date.now().toString(),
      from: 'me',
      text: replyText.trim(),
      date: "À l'instant",
    };
    onReply(messageId, reply);
    if (isMounted.current) {
      setReplyText('');
      setSending(false);
      toast.success('Réponse envoyée !');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      void handleSend();
    }
  };

  if (compact) {
    return (
      <div className="border-t border-border bg-card px-4 py-3 space-y-2">
        <div className="flex items-center gap-1.5">
          {TONES.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTone(t.id)}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors ${
                tone === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-secondary'
              }`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
          <button
            type="button"
            onClick={handleAIGenerate}
            disabled={generating}
            className="ml-auto flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-full transition-colors disabled:opacity-50"
          >
            {generating ? <RefreshCw size={11} className="animate-spin" /> : <Sparkles size={11} />}
            IA
          </button>
        </div>
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Répondre à ${senderName}…`}
            rows={3}
            className="resize-none pr-10 text-sm"
            disabled={generating || sending}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!replyText.trim() || sending}
            className="absolute right-2 bottom-2 w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 transition-all"
            title="Envoyer (⌘↵)"
          >
            {sending ? <RefreshCw size={12} className="animate-spin" /> : <Send size={13} />}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground">⌘↵ pour envoyer</p>
      </div>
    );
  }

  return (
    <div className="border-t border-border bg-background px-5 py-4 space-y-3 shrink-0">
      {/* Tone selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-muted-foreground">Ton :</span>
        {TONES.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTone(t.id)}
            className={`text-[11px] font-medium px-3 py-1.5 rounded-full transition-all ${
              tone === t.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-secondary'
            }`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={handleAIGenerate}
          disabled={generating}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/8 hover:bg-primary/15 text-primary px-3 py-1.5 text-[11px] font-bold transition-colors disabled:opacity-50"
        >
          {generating
            ? <><RefreshCw size={11} className="animate-spin" /> Génération…</>
            : <><Sparkles size={11} /> Rédiger avec l'IA</>
          }
        </button>
      </div>

      {/* Textarea */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={replyText}
          onChange={e => setReplyText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Répondre à ${senderName}… (⌘↵ pour envoyer)`}
          rows={3}
          className="resize-none pr-11 text-sm leading-relaxed"
          disabled={generating || sending}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!replyText.trim() || sending || generating}
          className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 transition-all shadow-sm"
          title="Envoyer (⌘↵)"
        >
          {sending
            ? <RefreshCw size={14} className="animate-spin" />
            : <CornerDownLeft size={14} />
          }
        </button>
      </div>

      {/* Quick send button for mobile */}
      <Button
        onClick={handleSend}
        disabled={!replyText.trim() || sending || generating}
        className="w-full gap-2 h-11 sm:hidden"
        size="default"
      >
        {sending ? <><RefreshCw size={15} className="animate-spin" /> Envoi…</> : <><Send size={15} /> Envoyer la réponse</>}
      </Button>
    </div>
  );
}
