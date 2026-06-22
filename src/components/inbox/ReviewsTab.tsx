import { useState } from 'react';
import { Button, Badge, toast } from '@blinkdotnew/ui';
import { Star, Sparkles, Copy, Check, RefreshCw, ThumbsUp, AlertTriangle, Wand2, Share2, PauseCircle, Video } from 'lucide-react';
import { MOCK_REVIEWS, type GoogleReview } from './reviewsData';
import { CRISIS_REVIEW, CrisisReviewPanel } from './CrisisReviewPanel';
import { blink } from '../../blink/client';
import { ReviewToPostModal } from './ReviewToPostModal';
import { ReviewToVideoModal } from './ReviewToVideoModal';
import { useReviewRaidDetector } from '../../hooks/useReviewRaidDetector';
import { ReviewRaidAlert } from './ReviewRaidAlert';
import { useAuth } from '../../hooks/useAuth';
import { analyticsTrackReviewReplied } from '../../firebase/analytics';

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'} />
      ))}
    </div>
  );
}

const RATING_COLOR: Record<number, string> = {
  1: 'text-red-600 bg-red-50 border-red-200',
  2: 'text-orange-600 bg-orange-50 border-orange-200',
  3: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  4: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  5: 'text-green-700 bg-green-50 border-green-200',
};

function AuthorAvatar({ initials, rating }: { initials: string; rating: number }) {
  const bg = rating >= 4 ? 'bg-emerald-100 text-emerald-700' : rating === 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${bg}`}>
      {initials}
    </div>
  );
}

function ReviewCard({ review, onReplyGenerated, onTransformToPost, onExportToVideo, automationSuspended }: {
  review: GoogleReview;
  onReplyGenerated: (id: string, reply: string) => void;
  onTransformToPost?: (review: GoogleReview) => void;
  onExportToVideo?: (review: GoogleReview) => void;
  automationSuspended?: boolean;
}) {
  const [generating, setGenerating] = useState(false);
  const [reply, setReply] = useState(review.aiReply ?? '');
  const [copied, setCopied] = useState(false);

  const handleAIReply = async () => {
    setGenerating(true);
    try {
      const tone = review.rating >= 4 ? 'chaleureuse et reconnaissante' : review.rating === 3 ? 'professionnelle et constructive' : 'empathique, apaisante et orientée solution';
      const { object } = await blink.ai.generateObject({
        prompt: `Tu es le responsable de la communication d'une TPE/PME française. Un client a laissé l'avis Google suivant (note : ${review.rating}/5) :\n\n"${review.text}"\n\nRédige une réponse publique ${tone}. Elle doit être courte (2-3 phrases max), professionnelle, et signer "L'équipe Kompilot".`,
        schema: {
          type: 'object',
          properties: { reply: { type: 'string' } },
          required: ['reply'],
        },
      });
      const generated = (object as { reply: string }).reply;
      setReply(generated);
      onReplyGenerated(review.id, generated);
      toast.success('Réponse générée !');
    } catch (err: any) {
      if (err?.message?.includes('401')) blink.auth.login(window.location.href);
      else toast.error('Erreur IA', { description: err?.message ?? 'Réessayez.' });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(reply);
    setCopied(true);
    analyticsTrackReviewReplied(review.rating, 'google');
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={`rounded-xl border p-4 space-y-3 transition-all ${RATING_COLOR[review.rating]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AuthorAvatar initials={review.authorInitials} rating={review.rating} />
          <div>
            <p className="font-semibold text-sm text-foreground">{review.authorName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRating rating={review.rating} />
              <span className="text-[11px] text-muted-foreground">{review.date}</span>
            </div>
          </div>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-white/70 border border-current/20 px-2 py-0.5 text-[11px] font-bold shrink-0">
          {review.rating}/5
        </span>
      </div>
      {automationSuspended && review.rating <= 2 && (
        <div className="flex items-center gap-1.5">
          <Badge className="bg-red-100 text-red-700 border border-red-300 text-[10px] px-2 h-5 font-semibold gap-1">
            <PauseCircle size={9} /> Auto-réponse suspendue
          </Badge>
        </div>
      )}
      <p className="text-sm text-foreground leading-relaxed">{review.text}</p>
      {reply ? (
        <div className="bg-white/80 rounded-lg border border-current/20 p-3 space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Sparkles size={11} /> Réponse générée
          </p>
          <p className="text-sm text-foreground leading-relaxed">{reply}</p>
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={handleCopy}>
              {copied ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
              {copied ? 'Copié !' : 'Copier'}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1 text-muted-foreground" onClick={handleAIReply} disabled={generating}>
              <RefreshCw size={11} className={generating ? 'animate-spin' : ''} />
              Régénérer
            </Button>
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1 ml-auto">
              <ThumbsUp size={11} /> Publier sur Google
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground/70 text-center mt-1 leading-relaxed">
            ✍️ En validant, vous acceptez la responsabilité éditoriale de ce contenu IA.
          </p>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={handleAIReply} disabled={generating} className="gap-2 text-xs h-8 bg-white/60">
          {generating ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
          {generating ? 'Génération en cours...' : "Répondre avec l'IA"}
        </Button>
      )}

      {/* Action buttons for positive reviews */}
      {review.rating >= 4 && (
        <div className="pt-1 border-t border-current/10 mt-1 space-y-1.5">
          {/* Review-to-Post — only 5★ */}
          {review.rating === 5 && onTransformToPost && (
            <Button
              size="sm"
              onClick={() => onTransformToPost(review)}
              className="gap-2 text-xs h-8 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white border-0 shadow-sm w-full justify-center"
            >
              <Share2 size={12} />
              🎨 Transformer en Post Réseaux
            </Button>
          )}
          {/* Review-to-Video Story — all 4★+ reviews */}
          {onExportToVideo && (
            <Button
              size="sm"
              onClick={() => onExportToVideo(review)}
              className="gap-2 text-xs h-8 w-full justify-center bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0 shadow-sm shadow-purple-200/60 dark:shadow-purple-900/40"
            >
              <Video size={12} />
              🎬 Exporter en Vidéo Story
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/** A pinned sample review card demonstrating the SEO response generator */
function SeoReviewCard({ isSelected, onClick }: { isSelected: boolean; onClick: () => void }) {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
      toast.success('Réponse IA générée !', {
        description:
          'Merci Marie pour votre fidélité ! Chez [Établissement], chaque client compte. Nous vous attendons pour votre prochain rendez-vous — réservez directement en ligne via notre bouton de réservation 🎉',
      });
    }, 1400);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-3 space-y-2 transition-all ${
        isSelected ? 'border-primary/50 bg-primary/3 shadow-sm' : 'border-border bg-card hover:border-primary/30 hover:bg-muted/30'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
          MD
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">Marie D.</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <StarRating rating={5} size={10} />
            <span className="text-[10px] text-muted-foreground">Il y a 3 jours</span>
          </div>
        </div>
        <span className="text-[10px] font-bold text-emerald-600 shrink-0 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5">5/5</span>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">
        "Accueil chaleureux, service impeccable et résultats au-delà de mes attentes. Je recommande vivement cet établissement !"
      </p>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={generating}
        className={`w-full mt-1 flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-all duration-150 ${
          generated
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
            : 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/50'
        } disabled:opacity-60`}
      >
        {generating ? (
          <><RefreshCw size={11} className="animate-spin" /> Génération SEO en cours...</>
        ) : generated ? (
          <><Check size={11} /> Réponse générée ✓</>
        ) : (
          <><Wand2 size={11} /> Générer une réponse optimisée SEO 🪄</>
        )}
      </button>
    </button>
  );
}

export function ReviewsTab() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<GoogleReview[]>(MOCK_REVIEWS);
  const [crisisResolved, setCrisisResolved] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>('crisis-1'); // open crisis by default
  const [reviewToPost, setReviewToPost] = useState<GoogleReview | null>(null);
  const [reviewToVideo, setReviewToVideo] = useState<GoogleReview | null>(null);
  const [raidDismissed, setRaidDismissed] = useState(false);

  const crisisReviewForList = {
    id: 'crisis-1',
    authorName: CRISIS_REVIEW.authorName,
    authorInitials: CRISIS_REVIEW.authorInitials,
    rating: CRISIS_REVIEW.rating,
    date: CRISIS_REVIEW.date,
    text: CRISIS_REVIEW.text,
  };

  const allReviews = crisisResolved
    ? reviews
    : [crisisReviewForList, ...reviews];

  // Raid detector — feed all reviews including crisis review
  const raidReviewsInput = allReviews.map(r => ({
    id: r.id,
    rating: r.rating,
    date: r.date,
    authorName: r.authorName,
    text: r.text,
  }));
  const raidState = useReviewRaidDetector(raidReviewsInput);

  const avgRating = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
  const dist = [5, 4, 3, 2, 1].map(n => ({ n, count: allReviews.filter(r => r.rating === n).length }));

  const handleReplyGenerated = (id: string, reply: string) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, aiReply: reply } : r));
  };

  return (
    <div className="space-y-0">
      {/* ── Raid alert banner ── */}
      {raidState.isRaidDetected && !raidDismissed && (
        <ReviewRaidAlert
          raidState={raidState}
          onDismiss={() => setRaidDismissed(true)}
        />
      )}

    <div className="flex flex-col md:flex-row gap-5 min-h-[500px]">

      {/* ── Left column: review list ── */}
      <div className="w-full md:w-[340px] md:shrink-0 space-y-4 overflow-y-auto">

        {/* Summary */}
        <div className="flex items-center gap-6 bg-card rounded-xl border border-border px-5 py-4">
          <div className="text-center">
            <p className="text-4xl font-extrabold text-foreground">{avgRating.toFixed(1)}</p>
            <StarRating rating={Math.round(avgRating)} size={16} />
            <p className="text-xs text-muted-foreground mt-1">{allReviews.length} avis</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {dist.map(({ n, count }) => (
              <div key={n} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-4 shrink-0">{n}</span>
                <Star size={11} className="text-amber-400 fill-amber-400 shrink-0" />
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(count / allReviews.length) * 100}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-3 shrink-0">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Crisis review card */}
        {!crisisResolved && (
          <button
            type="button"
            onClick={() => setSelectedId('crisis-1')}
            className={`w-full text-left rounded-2xl border-2 p-4 space-y-2 transition-all hover:-translate-y-0.5 ${
              selectedId === 'crisis-1'
                ? 'border-red-400 bg-red-50 shadow-[0_4px_16px_-4px_rgba(239,68,68,0.3)]'
                : 'border-red-300 bg-red-50/60 hover:border-red-400'
            }`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 animate-pulse">
                <AlertTriangle size={9} /> ALERTE PRIORITAIRE
              </span>
              <span className="text-[11px] text-red-500 font-semibold">Avis 1★ — Il y a 2 min</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-200 text-red-700 font-bold text-xs flex items-center justify-center shrink-0">
                KM
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{CRISIS_REVIEW.authorName}</p>
                <div className="flex gap-0.5 mt-0.5">
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill={i <= 1 ? '#EF4444' : '#e5e7eb'}>
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed">"{CRISIS_REVIEW.text}"</p>
            <p className="text-[11px] font-bold text-red-600">→ Cliquez pour traiter cet avis urgent</p>
          </button>
        )}

        {/* Marie D. — SEO response generator demo card */}
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-1 flex items-center gap-1">
            <Sparkles size={9} /> Exemple — Générateur SEO
          </p>
          <SeoReviewCard
            isSelected={selectedId === 'seo-demo'}
            onClick={() => setSelectedId('seo-demo')}
          />
        </div>

        {/* Normal reviews */}
        <div className="space-y-3">
          {reviews.map(review => (
            <button
              key={review.id}
              type="button"
              onClick={() => setSelectedId(review.id)}
              className={`w-full text-left rounded-xl border p-3 space-y-2 transition-all ${
                selectedId === review.id ? 'border-primary/50 bg-primary/3 shadow-sm' : 'border-border bg-card hover:border-primary/30 hover:bg-muted/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <AuthorAvatar initials={review.authorInitials} rating={review.rating} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">{review.authorName}</p>
                  <StarRating rating={review.rating} size={10} />
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{review.date}</span>
              </div>
              {raidState.automationSuspended && review.rating <= 2 && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-1.5 py-0.5">
                  <PauseCircle size={8} /> Suspendu
                </span>
              )}
              <p className="text-xs text-muted-foreground line-clamp-2">{review.text}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Right: detail panel ── */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {selectedId === 'crisis-1' && !crisisResolved && (
          <CrisisReviewPanel
            review={CRISIS_REVIEW}
            onResolved={() => { setCrisisResolved(true); setSelectedId(reviews[0]?.id ?? null); }}
          />
        )}
        {selectedId && selectedId !== 'crisis-1' && selectedId !== 'seo-demo' && (() => {
          const review = reviews.find(r => r.id === selectedId);
          if (!review) return null;
          return (
            <ReviewCard
              key={review.id}
              review={review}
              onReplyGenerated={handleReplyGenerated}
              onTransformToPost={setReviewToPost}
              onExportToVideo={setReviewToVideo}
              automationSuspended={raidState.automationSuspended}
            />
          );
        })()}
        {selectedId === 'seo-demo' && (
          <div className="rounded-xl border p-4 space-y-3 bg-card">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                  MD
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">Marie D.</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StarRating rating={5} />
                    <span className="text-[11px] text-muted-foreground">Il y a 3 jours</span>
                  </div>
                </div>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-white/70 border border-current/20 px-2 py-0.5 text-[11px] font-bold shrink-0">
                5/5
              </span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              "Accueil chaleureux, service impeccable et résultats au-delà de mes attentes. Je recommande vivement cet établissement !"
            </p>
            <div className="bg-white/80 rounded-lg border border-current/20 p-3 space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Sparkles size={11} /> Réponse générée
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                Merci Marie pour votre fidélité ! Chez [Établissement], chaque client compte. Nous vous attendons pour votre prochain rendez-vous — réservez directement en ligne via notre bouton de réservation 🎉
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1">
                  <Copy size={11} /> Copier
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1 text-muted-foreground">
                  <RefreshCw size={11} /> Régénérer
                </Button>
                <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1 ml-auto">
                  <ThumbsUp size={11} /> Publier sur Google
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground/70 text-center mt-1 leading-relaxed">
                ✍️ En validant, vous acceptez la responsabilité éditoriale de ce contenu IA.
              </p>
            </div>
            {/* Action buttons for demo card */}
            <div className="pt-1 border-t border-current/10 mt-1 space-y-1.5">
              <Button
                size="sm"
                onClick={() => setReviewToPost({ id: 'seo-demo', authorName: 'Marie D.', authorInitials: 'MD', rating: 5, date: 'Il y a 3 jours', text: 'Accueil chaleureux, service impeccable et résultats au-delà de mes attentes. Je recommande vivement cet établissement !' })}
                className="gap-2 text-xs h-8 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white border-0 shadow-sm w-full justify-center"
              >
                <Share2 size={12} />
                🎨 Transformer en Post Réseaux
              </Button>
              <Button
                size="sm"
                onClick={() => setReviewToVideo({ id: 'seo-demo', authorName: 'Marie D.', authorInitials: 'MD', rating: 5, date: 'Il y a 3 jours', text: 'Accueil chaleureux, service impeccable et résultats au-delà de mes attentes. Je recommande vivement cet établissement !' })}
                className="gap-2 text-xs h-8 w-full justify-center bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0 shadow-sm shadow-purple-200/60 dark:shadow-purple-900/40"
              >
                <Video size={12} />
                🎬 Exporter en Vidéo Story
              </Button>
            </div>
          </div>
        )}
        {!selectedId && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
            <Star size={32} className="text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Sélectionnez un avis pour le traiter</p>
          </div>
        )}
      </div>

      {/* Review-to-Post modal */}
      <ReviewToPostModal
        review={reviewToPost}
        open={reviewToPost !== null}
        onClose={() => setReviewToPost(null)}
      />

      {/* Review-to-Video Story modal */}
      <ReviewToVideoModal
        review={reviewToVideo}
        open={reviewToVideo !== null}
        onClose={() => setReviewToVideo(null)}
        userId={user?.id}
      />
    </div>
    </div>
  );
}
