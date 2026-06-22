import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimationControls } from 'framer-motion';
import { Button, Textarea, toast } from '@blinkdotnew/ui';
import {
  Send, CornerDownLeft, ChevronLeft, Sparkles, RefreshCw, Brain,
  Archive, Trash2, Star, StarOff, MoreHorizontal, ExternalLink, Copy, Check,
} from 'lucide-react';
import { VoiceInputButton } from '../layout/VoiceInputButton';
import { StripePanicButton } from '../settings/StripePanicButton';
import { CreditCostBadge, useCreditGuard } from '../shared/CreditCostBadge';
import type { InboxMessage, Reply } from './inboxData';
import { ChannelBadge } from './ChannelIcon';
import { blink } from '../../blink/client';
import { anonymizePII } from '../../lib/piiAnonymizer';
import { QuickReplyTemplates } from './QuickReplyTemplates';
// MODULE 6: Guardrail
import { ContentGuardrailBanner, ContentApprovedBanner, useContentGuardrail } from '../guardrail/ContentGuardrailBanner';

// ── Tone config ────────────────────────────────────────────────────────────────

type Tone = 'professional' | 'friendly' | 'empathetic';

const TONES: { id: Tone; emoji: string; label: string; hint: string }[] = [
  { id: 'professional', emoji: '💼', label: 'Pro', hint: 'Ton formel et professionnel' },
  { id: 'friendly', emoji: '😊', label: 'Amical', hint: 'Ton chaleureux et proche' },
  { id: 'empathetic', emoji: '🤝', label: 'Empathique', hint: 'Ton compréhensif pour les plaintes' },
];

interface MessageDetailProps {
  message: InboxMessage;
  onReply: (messageId: string, reply: Reply) => void;
  onBack?: () => void;
  onArchive?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onToggleStar?: (messageId: string) => void;
}

function Avatar({ name, isMe }: { name: string; isMe?: boolean }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
      isMe ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground border border-border'
    }`}>
      {isMe ? 'Moi' : initials}
    </div>
  );
}

function detectIntent(body: string) {
  const b = body.toLowerCase();
  if (/prix|tarif|devis|coût|combien|€/.test(b))
    return { label: 'Demande de prix', emoji: '💰', color: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-800/50 dark:text-amber-300' };
  if (/rendez-vous|rdv|réserver|réservation|disponible|créneau|horaire/.test(b))
    return { label: 'Demande de RDV', emoji: '📅', color: 'bg-teal-50 border-teal-200 text-teal-800 dark:bg-teal-950/20 dark:border-teal-800/50 dark:text-teal-300' };
  if (/réclamation|problème|bug|erreur|ne fonctionne|déçu|plainte/.test(b))
    return { label: 'Réclamation', emoji: '⚠️', color: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-800/50 dark:text-red-300' };
  if (/partenariat|collaboration|proposer|travailler ensemble/.test(b))
    return { label: 'Proposition partenariat', emoji: '🤝', color: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:border-blue-800/50 dark:text-blue-300' };
  if (/ouvert|fermé|horaire|heure|dimanche|samedi/.test(b))
    return { label: 'Question horaires', emoji: '🕐', color: 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-950/20 dark:border-purple-800/50 dark:text-purple-300' };
  return null;
}

type Sentiment = 'positive' | 'neutral' | 'negative';

interface SentimentResult {
  sentiment: Sentiment;
  score: number;
  emotion: string;
  keySignal: string;
  urgency: 'low' | 'medium' | 'high';
  suggestedTone: Tone;
}

const SENTIMENT_STYLE: Record<Sentiment, { bg: string; text: string; border: string; emoji: string; label: string }> = {
  positive: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/50', emoji: '😊', label: 'Positif' },
  neutral:  { bg: 'bg-slate-50 dark:bg-slate-800/30',    text: 'text-slate-600 dark:text-slate-300',    border: 'border-slate-200 dark:border-slate-700/50',   emoji: '😐', label: 'Neutre'   },
  negative: { bg: 'bg-red-50 dark:bg-red-950/30',        text: 'text-red-700 dark:text-red-400',        border: 'border-red-200 dark:border-red-800/50',        emoji: '😟', label: 'Négatif'  },
};

const URGENCY_STYLE: Record<string, string> = {
  high:   'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50',
  medium: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50',
  low:    'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/30 dark:text-slate-400 dark:border-slate-700/50',
};

const URGENCY_LABEL: Record<string, string> = { high: '🔥 Urgent', medium: '⏳ Modéré', low: '✅ Non-urgent' };

function SentimentBadge({ result }: { result: SentimentResult }) {
  const style = SENTIMENT_STYLE[result.sentiment];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border px-3 py-2.5 space-y-2 ${style.bg} ${style.border}`}
    >
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
          {style.emoji} {style.label}
          <span className="ml-1 opacity-60">· {result.score}/100</span>
        </span>
        <span className={`text-[10px] font-bold border rounded-full px-2 py-0.5 ${URGENCY_STYLE[result.urgency]}`}>
          {URGENCY_LABEL[result.urgency]}
        </span>
        <span className="text-[10px] text-muted-foreground bg-muted border border-border rounded-full px-2 py-0.5 font-medium">
          🎭 {result.emotion}
        </span>
      </div>
      <p className="text-[11px] text-foreground/80 leading-relaxed">
        <strong className="font-semibold">Signal clé :</strong> « {result.keySignal} »
      </p>
      <p className="text-[10px] text-muted-foreground">
        Ton suggéré :{' '}
        <strong className="font-semibold text-foreground/70">
          {result.suggestedTone === 'professional' ? '💼 Professionnel' : result.suggestedTone === 'friendly' ? '😊 Amical' : '🤝 Empathique'}
        </strong>
        {' '}(appliqué automatiquement)
      </p>
    </motion.div>
  );
}

// ── Actions dropdown ───────────────────────────────────────────────────────────

function ActionsMenu({
  message,
  onArchive,
  onDelete,
  onToggleStar,
  onCopyBody,
}: {
  message: InboxMessage;
  onArchive?: () => void;
  onDelete?: () => void;
  onToggleStar?: () => void;
  onCopyBody?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      >
        <MoreHorizontal size={16} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-8 z-20 min-w-[160px] bg-card border border-border rounded-xl shadow-xl overflow-hidden"
            >
              {onToggleStar && (
                <button
                  onClick={() => { onToggleStar(); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left"
                >
                  {message.isStarred ? <StarOff size={14} className="text-amber-500" /> : <Star size={14} className="text-amber-500" />}
                  {message.isStarred ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                </button>
              )}
              {onCopyBody && (
                <button
                  onClick={() => { onCopyBody(); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left"
                >
                  <Copy size={14} className="text-muted-foreground" />
                  Copier le message
                </button>
              )}
              {onArchive && (
                <button
                  onClick={() => { onArchive(); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left"
                >
                  <Archive size={14} className="text-muted-foreground" />
                  Archiver
                </button>
              )}
              <div className="border-t border-border" />
              {onDelete && (
                <button
                  onClick={() => { onDelete(); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-red-50 hover:text-red-600 transition-colors text-left text-red-500"
                >
                  <Trash2 size={14} />
                  Supprimer
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── SwipeToApprove ─────────────────────────────────────────────────────────────

interface SwipeToApproveProps {
  onApprove: () => void;
}

function SwipeToApprove({ onApprove }: SwipeToApproveProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const controls = useAnimationControls();
  const [done, setDone] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  // Rail fill opacity: 0 → 0.35 as cursor slides right
  const fillOpacity = useTransform(x, (val) => {
    const rail = railRef.current;
    if (!rail) return 0;
    const max = rail.offsetWidth - 36;
    return Math.min((val / max) * 0.35, 0.35);
  });

  const handleDragEnd = useCallback(async () => {
    const rail = railRef.current;
    if (!rail) return;
    const max = rail.offsetWidth - 36;
    const current = x.get();

    if (current > max * 0.65) {
      // Snap to end, then show success state
      await controls.start({ x: max, transition: { type: 'spring', stiffness: 500, damping: 40 } });
      setDone(true);
      onApprove();
      // Reset after 700ms (replyText will be cleared by parent, hiding this component)
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        setDone(false);
        x.set(0);
        controls.start({ x: 0, transition: { type: 'spring', stiffness: 400, damping: 35 } });
      }, 700);
    } else {
      // Spring back
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 400, damping: 35 } });
    }
  }, [controls, onApprove, x]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.18 }}
      className="relative flex items-center h-12 rounded-full overflow-hidden select-none"
      style={{
        background: done ? '#10B981' : 'rgba(16,185,129,0.08)',
        border: done ? '1px solid #10B981' : '1px solid rgba(16,185,129,0.25)',
        transition: 'background 0.3s, border-color 0.3s',
      }}
      ref={railRef}
    >
      {/* Animated fill layer */}
      {!done && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: '#10B981', opacity: fillOpacity }}
        />
      )}

      {/* Label text (behind cursor) */}
      {done ? (
        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white pointer-events-none z-10">
          ✓ Réponse envoyée !
        </span>
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-emerald-600/70 pointer-events-none z-10">
          ← Glisser pour envoyer →
        </span>
      )}

      {/* Desktop quick-send button — disabled while swipe animation is in progress */}
      {!done && (
        <button
          onClick={onApprove}
          disabled={done}
          className="hidden md:flex absolute right-1.5 items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full px-2.5 py-1 transition-colors z-20 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Envoyer <Send size={11} />
        </button>
      )}

      {/* Draggable cursor */}
      {!done && (
        <motion.div
          drag="x"
          dragMomentum={false}
          dragConstraints={railRef}
          dragElastic={0}
          animate={controls}
          onDragEnd={handleDragEnd}
          className="absolute left-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing z-30 shadow-md"
          style={{ x, background: '#10B981' }}
          whileTap={{ scale: 0.95 }}
        >
          <Send size={16} className="text-white" style={{ transform: 'translateX(1px)' }} />
        </motion.div>
      )}
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function MessageDetail({ message, onReply, onBack, onArchive, onDelete, onToggleStar }: MessageDetailProps) {
  const [replyText, setReplyText] = useState('');
  const { guard: creditGuard, modalNode: creditModal } = useCreditGuard({ cost: 1, action: 'INBOX_AI_REPLY' });
  const [sending, setSending] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [selectedTone, setSelectedTone] = useState<Tone>('professional');
  const [sentiment, setSentiment] = useState<SentimentResult | null>(null);
  const [analyzingSentiment, setAnalyzingSentiment] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  // MODULE 6: AI Guardrail
  const guardrail = useContentGuardrail();

  // ── Sentiment analysis ──────────────────────────────────────────────────────

  const analyzeSentiment = async () => {
    setAnalyzingSentiment(true);
    try {
      const { object } = await blink.ai.generateObject({
        model: 'gpt-4.1-mini',
        prompt: `Analyse le sentiment de ce message client reçu par un commerçant français.

Message de ${message.senderName} :
"""
${message.body}
"""`,
        schema: {
          type: 'object',
          properties: {
            sentiment:     { type: 'string', enum: ['positive', 'neutral', 'negative'] },
            score:         { type: 'number' },
            emotion:       { type: 'string' },
            keySignal:     { type: 'string' },
            urgency:       { type: 'string', enum: ['low', 'medium', 'high'] },
            suggestedTone: { type: 'string', enum: ['professional', 'friendly', 'empathetic'] },
          },
          required: ['sentiment', 'score', 'emotion', 'keySignal', 'urgency', 'suggestedTone'],
        },
      });
      const result = object as SentimentResult;
      setSentiment(result);
      setSelectedTone(result.suggestedTone);
    } catch (err: any) {
      if (err?.message?.includes('401') || err?.name === 'BlinkAuthError') {
        blink.auth.login(window.location.href);
        return;
      }
      toast.error('Analyse sentiment échouée. Réessayez.');
    } finally {
      setAnalyzingSentiment(false);
    }
  };

  // ── AI reply ───────────────────────────────────────────────────────────────

  const handleAIReply = async () => {
    setGeneratingAI(true);
    setReplyText('');
    const safeBody = anonymizePII(message.body).text;
    const intent = detectIntent(safeBody);
    const bookingUrl = localStorage.getItem('booking_url') || 'https://planity.com';

    const toneInstruction =
      selectedTone === 'professional'
        ? 'Adopte un ton formel, poli et professionnel.'
        : selectedTone === 'friendly'
        ? 'Adopte un ton chaleureux, proche et convivial comme si tu connaissais le client.'
        : 'Adopte un ton très empathique, compréhensif, et axé sur la résolution. Commence par reconnaître le ressenti du client.';

    const sentimentContext = sentiment
      ? `\nAnalyse du sentiment du message : ${SENTIMENT_STYLE[sentiment.sentiment].label} (${sentiment.score}/100) — émotion principale : ${sentiment.emotion}. Adapte ta réponse en conséquence.`
      : '';

    const prompt = `Tu es un assistant de communication pour un commerçant local français.
Génère une réponse concise (max 80 mots) à ce message client.
${toneInstruction}${sentimentContext}
${intent?.label === 'Demande de RDV' ? `Inclus ce lien de réservation : ${bookingUrl}` : ''}
${intent?.label === 'Réclamation' ? 'Propose une solution concrète et un geste commercial si approprié.' : ''}
${intent?.label === 'Demande de prix' ? 'Réponds positivement sans donner de tarif exact — invite à un échange direct.' : ''}

Message du client (${message.senderName}):
"""
${safeBody}
"""

Réponds directement sans formule d'introduction ni "Voici ma réponse:". Commence par "Bonjour ${message.senderName.split(' ')[0]},".`;

    try {
      let result = '';
      await blink.ai.streamText(
        { messages: [{ role: 'user', content: prompt }], model: 'gpt-4.1-mini', maxTokens: 220 },
        (chunk) => { result += chunk; setReplyText(result); }
      );
    } catch (err: any) {
      if (err?.message?.includes('401') || err?.name === 'BlinkAuthError') {
        blink.auth.login(window.location.href);
        return;
      }
      toast.error('Erreur IA. Réessayez dans un instant.');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSend = async () => {
    if (!replyText.trim()) return;

    // MODULE 6: Check content before sending
    const isSafe = guardrail.check(replyText.trim());
    if (!isSafe && !guardrail.manuallyApproved) {
      // Block send — banner is shown below textarea
      return;
    }

    setSending(true);
    await new Promise(r => setTimeout(r, 500));

    const reply: Reply = {
      id: Date.now().toString(),
      from: 'me',
      text: replyText.trim(),
      date: 'À l\'instant',
    };
    onReply(message.id, reply);
    setReplyText('');
    guardrail.reset();
    setSending(false);
    toast.success('Réponse envoyée !');
  };

  const handleCopyBody = async () => {
    try {
      await navigator.clipboard.writeText(message.body);
      if (!isMountedRef.current) return;
      setCopied(true);
      toast.success('Message copié !');
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) setCopied(false);
      }, 2000);
    } catch {
      toast.error('Impossible de copier le message (accès presse-papiers refusé).');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-5 py-3.5 border-b border-border bg-card">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack} className="sm:hidden -ml-1.5 shrink-0 h-8 w-8">
                <ChevronLeft size={20} />
              </Button>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-semibold text-sm text-foreground leading-snug truncate">{message.subject}</h2>
                {message.isStarred && <Star size={13} className="text-amber-400 fill-amber-400 shrink-0" />}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <ChannelBadge channel={message.channel} />
                {detectIntent(message.body) && (() => {
                  const intent = detectIntent(message.body)!;
                  return (
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${intent.color}`}>
                      <span>{intent.emoji}</span>{intent.label}
                    </span>
                  );
                })()}
                <span className="text-xs text-muted-foreground">
                  De : <span className="font-medium text-foreground">{message.senderName}</span>
                  <span className="text-muted-foreground/70"> ({message.senderHandle})</span>
                </span>
                <span className="text-[11px] text-muted-foreground">{message.date}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            {/* Stripe Panic Button — bypass anti-no-show penalty */}
            <StripePanicButton
              variant="compact"
              clientName={message.senderName}
              onBypass={(name) => console.info('[Inbox] Manual Stripe bypass for:', name)}
            />

            {/* Sentiment analysis button */}
            <button
              onClick={analyzingSentiment ? undefined : sentiment ? () => setSentiment(null) : analyzeSentiment}
              disabled={analyzingSentiment}
              className={`flex items-center gap-1.5 text-[11px] font-bold rounded-lg px-2.5 py-1.5 transition-all border disabled:opacity-50 ${
                sentiment
                  ? `${SENTIMENT_STYLE[sentiment.sentiment].bg} ${SENTIMENT_STYLE[sentiment.sentiment].text} ${SENTIMENT_STYLE[sentiment.sentiment].border}`
                  : 'bg-muted/60 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
              }`}
            >
              {analyzingSentiment
                ? <><RefreshCw size={11} className="animate-spin" /> Analyse…</>
                : sentiment
                  ? <><span>{SENTIMENT_STYLE[sentiment.sentiment].emoji}</span> {SENTIMENT_STYLE[sentiment.sentiment].label}</>
                  : <><Brain size={11} /> Sentiment IA</>
              }
            </button>

            {/* Actions menu */}
            <ActionsMenu
              message={message}
              onArchive={onArchive ? () => onArchive(message.id) : undefined}
              onDelete={onDelete ? () => onDelete(message.id) : undefined}
              onToggleStar={onToggleStar ? () => onToggleStar(message.id) : undefined}
              onCopyBody={handleCopyBody}
            />
          </div>
        </div>

        {/* Sentiment badge panel */}
        <AnimatePresence>
          {sentiment && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mt-3"
            >
              <SentimentBadge result={sentiment} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Thread */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Original message */}
        <div className="flex items-start gap-3">
          <Avatar name={message.senderName} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-sm font-semibold text-foreground">{message.senderName}</span>
              <span className="text-[11px] text-muted-foreground">{message.date}</span>
            </div>
            <div className="bg-secondary/60 rounded-xl rounded-tl-none px-4 py-3 text-sm text-foreground leading-relaxed whitespace-pre-line border border-border/50">
              {message.body}
            </div>
          </div>
        </div>

        {/* Replies thread */}
        {message.replies.map(reply => (
          <div key={reply.id} className={`flex items-start gap-3 ${reply.from === 'me' ? 'flex-row-reverse' : ''}`}>
            <Avatar name={reply.from === 'me' ? 'Moi' : message.senderName} isMe={reply.from === 'me'} />
            <div className={`flex-1 min-w-0 ${reply.from === 'me' ? 'flex flex-col items-end' : ''}`}>
              <div className={`flex items-baseline gap-2 mb-1 ${reply.from === 'me' ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm font-semibold text-foreground">
                  {reply.from === 'me' ? 'Moi' : message.senderName}
                </span>
                <span className="text-[11px] text-muted-foreground">{reply.date}</span>
              </div>
              <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-line border max-w-[85%] ${
                reply.from === 'me'
                  ? 'bg-primary text-primary-foreground rounded-tr-none border-primary/20'
                  : 'bg-secondary/60 text-foreground rounded-tl-none border-border/50'
              }`}>
                {reply.text}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reply composer */}
      <div className="shrink-0 px-5 py-3.5 border-t border-border bg-card/80 backdrop-blur-sm space-y-2.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CornerDownLeft size={12} />
          Répondre à <span className="font-medium text-foreground">{message.senderName}</span>
          {sentiment && (
            <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${SENTIMENT_STYLE[sentiment.sentiment].bg} ${SENTIMENT_STYLE[sentiment.sentiment].text} ${SENTIMENT_STYLE[sentiment.sentiment].border}`}>
              {SENTIMENT_STYLE[sentiment.sentiment].emoji}
            </span>
          )}
        </div>

        {/* Tone selector + AI button row */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            {TONES.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTone(t.id)}
                title={t.hint}
                className={`flex items-center gap-1 text-[11px] font-semibold rounded-lg px-2.5 py-1 transition-all border ${
                  selectedTone === t.id
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                }`}
              >
                <span>{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => creditGuard(handleAIReply)}
            disabled={generatingAI}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-primary to-violet-500 rounded-lg px-3 py-1.5 transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-50 shadow-sm ml-auto"
          >
            {generatingAI
              ? <><RefreshCw size={12} className="animate-spin" /> Génération…</>
              : <><Sparkles size={12} /> Répondre avec l'IA <CreditCostBadge cost={1} variant="ghost" className="text-white/80" /></>
            }
          </button>
          {creditModal}
        </div>

        {/* Quick reply templates */}
        <QuickReplyTemplates onSelect={(content) => setReplyText(content)} />

        <div className="relative">
          <Textarea
            placeholder={`Votre réponse à ${message.senderName}...`}
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            className="min-h-[80px] resize-none text-sm pr-12"
            onKeyDown={e => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <div className="absolute bottom-2 right-2">
            <VoiceInputButton
              onTranscript={(text) => setReplyText(prev => prev ? prev + ' ' + text : text)}
              size="sm"
              showOverlay
            />
          </div>
        </div>

        {/* MODULE 6: Guardrail banner */}
        {guardrail.isBlocked && guardrail.result && (
          <ContentGuardrailBanner
            result={guardrail.result}
            onDismiss={guardrail.reset}
            onModify={guardrail.reset}
            onRequestValidation={guardrail.approve}
          />
        )}
        {guardrail.manuallyApproved && (
          <ContentApprovedBanner onPublish={handleSend} />
        )}

        {/* Swipe-to-approve zone */}
        <AnimatePresence>
          {replyText.trim() && !generatingAI && !guardrail.isBlocked && !guardrail.manuallyApproved && (
            <SwipeToApprove onApprove={handleSend} />
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            <kbd className="rounded border border-border px-1 py-0.5 text-[10px] font-mono bg-muted">⌘ Enter</kbd> pour envoyer
          </span>
          <Button size="sm" onClick={handleSend} disabled={sending || !replyText.trim() || guardrail.isBlocked} className="gap-2 h-8">
            <Send size={13} />
            {sending ? 'Envoi...' : 'Envoyer'}
          </Button>
        </div>
      </div>
    </div>
  );
}
