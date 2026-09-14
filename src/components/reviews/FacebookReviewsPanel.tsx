/**
 * FacebookReviewsPanel — Display and reply to Facebook Page reviews.
 * Mirrors GoogleReviewsPanel with Facebook branding and Graph API integration.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, RefreshCw, Loader2, MessageSquare, Send,
  AlertCircle, ThumbsUp,
} from 'lucide-react';
import { Button, toast } from '@blinkdotnew/ui';
import { blink } from '../../blink/client';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FbReviewsSummary {
  connected: boolean;
  totalReviews: number;
  avgRating: number;
  ratingDistribution: Record<string, number>;
  pagesCount: number;
}

interface FbReview {
  id: string;
  pageId: string;
  pageName: string;
  reviewerName: string;
  reviewerId: string;
  rating: number;
  comment: string;
  createdAt: string;
  storyId: string | null;
}

// ── Fetchers ──────────────────────────────────────────────────────────────────

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = await blink.auth.getValidToken();
  const resp = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FacebookReviewsPanel() {
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Fetch summary
  const { data: summary, isLoading: loadingSummary } = useQuery<FbReviewsSummary>({
    queryKey: ['fbReviewsSummary'],
    queryFn: () => fetchWithAuth('/api/facebook/reviews/summary'),
    retry: false,
  });

  // Fetch reviews inbox
  const { data: reviewsData, isLoading: loadingReviews } = useQuery<{ reviews: FbReview[] }>({
    queryKey: ['fbReviewsInbox'],
    queryFn: () => fetchWithAuth('/api/facebook/reviews/inbox'),
    retry: false,
  });

  // Refresh mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      // Invalidate and refetch both queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['fbReviewsSummary'] }),
        queryClient.invalidateQueries({ queryKey: ['fbReviewsInbox'] }),
      ]);
    },
    onSuccess: () => toast.success('Avis Facebook actualisés'),
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: ({ storyId, pageId, message }: { storyId: string; pageId: string; message: string }) =>
      fetchWithAuth('/api/facebook/reviews/reply', {
        method: 'POST',
        body: JSON.stringify({ storyId, pageId, message }),
      }),
    onSuccess: () => {
      toast.success('Réponse envoyée');
      setReplyingTo(null);
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['fbReviewsInbox'] });
      queryClient.invalidateQueries({ queryKey: ['fbReviewsSummary'] });
    },
    onError: () => toast.error("Échec de l'envoi de la réponse"),
  });

  const reviews = reviewsData?.reviews || [];
  const isConnected = summary?.connected !== false;
  const ratingDist = summary?.ratingDistribution || {};

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#1877F2]/10 border border-[#1877F2]/20 flex items-center justify-center">
            <ThumbsUp size={18} className="text-[#1877F2]" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-foreground">Avis Facebook</h3>
            <p className="text-[10px] text-muted-foreground">
              Consultez et répondez aux avis de vos Pages Facebook
            </p>
          </div>
        </div>
        <Button
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending || !isConnected}
          size="sm"
          className="gap-1.5"
        >
          {refreshMutation.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          Actualiser
        </Button>
      </div>

      {/* Not connected state */}
      {!loadingSummary && !isConnected && (
        <div className="rounded-xl border border-[#1877F2]/20 bg-[#1877F2]/5 px-4 py-4 text-center">
          <AlertCircle size={24} className="mx-auto text-[#1877F2] mb-2" />
          <p className="text-sm font-semibold text-foreground">Facebook non connecté</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Connectez votre compte Facebook dans les Paramètres pour synchroniser les avis de vos Pages.
          </p>
        </div>
      )}

      {/* Stats cards */}
      {isConnected && summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-card px-3 py-2.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Note moyenne</p>
            <div className="flex items-center gap-1.5 mt-1">
              <p className="text-2xl font-extrabold text-[#1877F2]">{summary.avgRating}</p>
              <Star size={16} className="text-amber-500 fill-amber-500" />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card px-3 py-2.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Total avis</p>
            <p className="text-2xl font-extrabold text-foreground mt-1">{summary.totalReviews}</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-3 py-2.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Note 5★</p>
            <p className="text-2xl font-extrabold text-emerald-500 mt-1">{ratingDist['5'] || 0}</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-3 py-2.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Pages connectées</p>
            <p className="text-2xl font-extrabold text-primary mt-1">{summary.pagesCount}</p>
          </div>
        </div>
      )}

      {/* Rating distribution */}
      {isConnected && summary && summary.totalReviews > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-bold text-foreground mb-3">Distribution des notes</p>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = ratingDist[String(stars)] || 0;
              const total = summary.totalReviews || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={stars} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-8 text-right">{stars}★</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full bg-[#1877F2]"
                    />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground w-10 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviews list */}
      {isConnected && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Derniers avis ({reviews.length})
            </h4>
          </div>

          {loadingReviews ? (
            <div className="flex justify-center py-6">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare size={28} className="mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">Aucun avis Facebook</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                Les avis de vos Pages Facebook apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {reviews.slice(0, 15).map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border bg-card px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-foreground">{review.reviewerName}</span>
                        <span className="text-amber-500 text-xs">
                          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </span>
                        <span className="text-[9px] font-bold rounded-full px-2 py-0.5 bg-[#1877F2]/10 text-[#1877F2] shrink-0">
                          {review.pageName}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {review.comment || '(Avis sans commentaire)'}
                      </p>
                      <p className="text-[10px] text-muted-foreground/50 mt-1.5">
                        {review.createdAt
                          ? new Date(review.createdAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : ''}
                      </p>
                    </div>

                    {review.storyId && (
                      <button
                        onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
                        className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-[#1877F2] hover:text-[#1877F2]/80 transition-colors cursor-pointer"
                      >
                        <Send size={10} />
                        Répondre
                      </button>
                    )}
                  </div>

                  {/* Reply form */}
                  <AnimatePresence>
                    {replyingTo === review.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-border space-y-2">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Écrivez votre réponse..."
                            rows={3}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs resize-none"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                replyMutation.mutate({
                                  storyId: review.storyId!,
                                  pageId: review.pageId,
                                  message: replyText,
                                })
                              }
                              disabled={!replyText.trim() || replyMutation.isPending}
                              className="gap-1.5"
                            >
                              {replyMutation.isPending ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Send size={12} />
                              )}
                              Envoyer
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyText('');
                              }}
                            >
                              Annuler
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
