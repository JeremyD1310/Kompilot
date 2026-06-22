import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, toast } from '@blinkdotnew/ui';
import { Sparkles, Copy, Check, RefreshCw, MessageCircle, ThumbsUp, Filter } from 'lucide-react';
import { blink } from '../../blink/client';
import {
  PLATFORM_REVIEWS,
  PLATFORM_META,
  type PlatformReview,
  type ReviewPlatform,
} from './multiPlatformReviewsData';
import {
  StarRating,
  AuthorAvatar,
  PlatformBadge,
  buildAIPrompt,
  RATING_COLOR,
} from './multiPlatformReviewsHelpers';

// ── Review card ──────────────────────────────────────────────────────────────

function ReviewCard({
  review,
  onUpdate,
}: {
  review: PlatformReview;
  onUpdate: (id: string, patch: Partial<PlatformReview>) => void;
}) {
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const reply = review.aiReply ?? '';

  const handleAIReply = async () => {
    setGenerating(true);
    try {
      const prompt = buildAIPrompt(review.platform, review.rating, review.text);
      const { object } = await blink.ai.generateObject({
        prompt,
        schema: {
          type: 'object',
          properties: { reply: { type: 'string' } },
          required: ['reply'],
        },
      });
      const generated = (object as { reply: string }).reply;
      onUpdate(review.id, { aiReply: generated });
      toast.success('Réponse IA générée !');
    } catch (err: unknown) {
      const e = err as { message?: string };
      if (e?.message?.includes('401')) blink.auth.login(window.location.href);
      else toast.error('Erreur IA', { description: e?.message ?? 'Réessayez.' });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleMarkReplied = () => {
    onUpdate(review.id, { replied: true });
    toast.success('Marqué comme répondu ✅');
  };

  const meta = PLATFORM_META[review.platform];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
      className={`rounded-xl border p-4 space-y-3 transition-shadow hover:shadow-md ${RATING_COLOR[review.rating]} ${review.replied ? 'opacity-60' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AuthorAvatar initials={review.authorInitials} rating={review.rating} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm text-foreground">{review.authorName}</p>
              <PlatformBadge platform={review.platform} />
              {review.replied && (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border border-emerald-300 bg-emerald-50 text-emerald-700">
                  <Check size={9} /> Répondu
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRating rating={review.rating} />
              <span className="text-[11px] text-muted-foreground">{review.date}</span>
            </div>
          </div>
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold shrink-0 ${meta.textColor} ${meta.bgColor} ${meta.borderColor}`}>
          {review.rating}/5
        </span>
      </div>

      {/* Review text */}
      <p className="text-sm text-foreground leading-relaxed">{review.text}</p>

      {/* AI reply box */}
      {reply ? (
        <div className="bg-background/70 rounded-lg border border-border p-3 space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Sparkles size={11} /> Réponse générée
          </p>
          <textarea
            className="w-full text-sm text-foreground leading-relaxed bg-transparent resize-none outline-none"
            rows={3}
            defaultValue={reply}
            onChange={e => onUpdate(review.id, { aiReply: e.target.value })}
          />
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={handleCopy}>
              {copied ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
              {copied ? 'Copié !' : '📋 Copier'}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1 text-muted-foreground" onClick={handleAIReply} disabled={generating}>
              <RefreshCw size={11} className={generating ? 'animate-spin' : ''} />
              Régénérer
            </Button>
            {!review.replied && (
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1 ml-auto" onClick={handleMarkReplied}>
                <ThumbsUp size={11} /> ✅ Marquer comme répondu
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={handleAIReply} disabled={generating} className="gap-1.5 text-xs h-8 bg-background/60">
            {generating ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {generating ? 'Génération...' : '🤖 Réponse IA 1 clic'}
          </Button>
          {!review.replied && (
            <Button size="sm" variant="ghost" onClick={handleMarkReplied} className="gap-1.5 text-xs h-8 text-muted-foreground">
              <Check size={12} /> ✅ Marquer comme répondu
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

type PlatformFilter = 'all' | ReviewPlatform;

export function MultiPlatformReviewsTab() {
  const [reviews, setReviews] = useState<PlatformReview[]>(PLATFORM_REVIEWS);
  const [filter, setFilter] = useState<PlatformFilter>('all');
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number } | null>(null);

  const handleUpdate = (id: string, patch: Partial<PlatformReview>) => {
    setReviews(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));
  };

  const filtered = filter === 'all' ? reviews : reviews.filter(r => r.platform === filter);
  const pending = reviews.filter(r => !r.replied && !r.aiReply);
  const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);

  const handleBatchAI = async () => {
    const targets = reviews.filter(r => !r.replied && !r.aiReply);
    if (!targets.length) { toast('Tous les avis ont déjà une réponse 🎉'); return; }
    setBatchProgress({ done: 0, total: targets.length });
    for (let i = 0; i < targets.length; i++) {
      const r = targets[i];
      try {
        const { object } = await blink.ai.generateObject({
          prompt: buildAIPrompt(r.platform, r.rating, r.text),
          schema: { type: 'object', properties: { reply: { type: 'string' } }, required: ['reply'] },
        });
        handleUpdate(r.id, { aiReply: (object as { reply: string }).reply });
      } catch { /* silent — continue batch */ }
      setBatchProgress({ done: i + 1, total: targets.length });
    }
    setTimeout(() => setBatchProgress(null), 1800);
    toast.success(`${targets.length} réponses générées !`);
  };

  const tabDef: { key: PlatformFilter; label: string }[] = [
    { key: 'all', label: `Tous (${reviews.length})` },
    { key: 'google', label: `${PLATFORM_META.google.dot} Google (${reviews.filter(r => r.platform === 'google').length})` },
    { key: 'tripadvisor', label: `${PLATFORM_META.tripadvisor.dot} TripAdvisor (${reviews.filter(r => r.platform === 'tripadvisor').length})` },
    { key: 'facebook', label: `${PLATFORM_META.facebook.dot} Facebook (${reviews.filter(r => r.platform === 'facebook').length})` },
  ];

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center gap-4 flex-wrap bg-card border border-border rounded-xl px-5 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <MessageCircle size={15} className="text-muted-foreground" />
          <span>{reviews.length} avis</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <StarRating rating={Math.round(Number(avgRating))} size={13} />
          <span className="text-amber-600 font-bold">{avgRating}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <Filter size={13} className="text-muted-foreground" />
          <span className="text-muted-foreground">{pending.length} sans réponse</span>
        </div>
        <div className="ml-auto">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8"
            onClick={handleBatchAI}
            disabled={!!batchProgress}
          >
            {batchProgress ? (
              <><RefreshCw size={12} className="animate-spin" /> {batchProgress.done}/{batchProgress.total} réponses...</>
            ) : (
              <><Sparkles size={12} /> 🤖 Répondre à tous avec l'IA</>
            )}
          </Button>
        </div>
      </div>

      {/* Platform filter tabs */}
      <div className="flex items-center gap-1 border-b border-border pb-0">
        {tabDef.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 -mb-px ${
              filter === key
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Review list */}
      <motion.div layout className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map(review => (
            <ReviewCard key={review.id} review={review} onUpdate={handleUpdate} />
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <MessageCircle size={32} className="text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Aucun avis pour cette plateforme.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
