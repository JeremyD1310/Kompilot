/**
 * GoogleReviewsPanel — Manage Google Business Profile reviews from Kompilot.
 * Sync reviews, view stats, reply to reviews, track reply status.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, RefreshCw, Loader2, MessageSquare, Send,
  CheckCircle2, AlertCircle, TrendingUp, ExternalLink,
} from 'lucide-react';
import { Button, toast } from '@blinkdotnew/ui';
import { blink } from '../../blink/client';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReviewsSummary {
  connected: boolean;
  totalReviews: number;
  avgRating: number;
  ratingDistribution: Record<string, number>;
  unrepliedCount: number;
  accountsCount: number;
}

interface Review {
  id: string;
  reviewId: string;
  senderName: string;
  rating: number;
  comment: string;
  isRead: boolean;
  isStarred: boolean;
  createdAt: string;
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

export function GoogleReviewsPanel() {
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Fetch summary
  const { data: summary, isLoading: loadingSummary } = useQuery<ReviewsSummary>({
    queryKey: ['gbpReviewsSummary'],
    queryFn: () => fetchWithAuth('/api/gbp/reviews-summary'),
    retry: false,
  });

  // Fetch reviews inbox
  const { data: reviewsData, isLoading: loadingReviews } = useQuery<{ reviews: Review[] }>({
    queryKey: ['gbpReviewsInbox'],
    queryFn: () => fetchWithAuth('/api/gbp/reviews-inbox'),
    retry: false,
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: () => fetchWithAuth('/api/gbp/reviews-sync', { method: 'POST' }),
    onSuccess: (data) => {
      toast.success(`Sync terminée — ${data.newSynced} nouveaux avis`);
      queryClient.invalidateQueries({ queryKey: ['gbpReviewsSummary'] });
      queryClient.invalidateQueries({ queryKey: ['gbpReviewsInbox'] });
    },
    onError: () => toast.error('Échec de la synchronisation'),
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: ({ reviewId, replyText }: { reviewId: string; replyText: string }) =>
      fetchWithAuth('/api/gbp/reviews-reply', {
        method: 'POST',
        body: JSON.stringify({ locationId: 'default', reviewId, replyText }),
      }),
    onSuccess: () => {
      toast.success('Réponse envoyée');
      setReplyingTo(null);
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['gbpReviewsInbox'] });
      queryClient.invalidateQueries({ queryKey: ['gbpReviewsSummary'] });
    },
    onError: () => toast.error('Échec de l\'envoi de la réponse'),
  });

  const reviews = reviewsData?.reviews || [];
  const isConnected = summary?.connected !== false;
  const ratingDist = summary?.ratingDistribution || {};

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Star size={18} className="text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-foreground">Avis Google</h3>
            <p className="text-[10px] text-muted-foreground">
              Synchronisez et répondez aux avis de vos fiches Google Business
            </p>
          </div>
        </div>
        <Button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending || !isConnected}
          size="sm"
          className="gap-1.5"
        >
          {syncMutation.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          Synchroniser
        </Button>
      </div>

      {/* Not connected state */}
      {!loadingSummary && !isConnected && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/30 px-4 py-4 text-center">
          <AlertCircle size={24} className="mx-auto text-amber-500 mb-2" />
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Google Business non connecté</p>
          <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-1">
            Connectez votre compte Google Business dans les Paramètres pour synchroniser vos avis.
          </p>
        </div>
      )}

      {/* Stats cards */}
      {isConnected && summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-card px-3 py-2.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Note moyenne</p>
            <div className="flex items-center gap-1.5 mt-1">
              <p className="text-2xl font-extrabold text-amber-500">{summary.avgRating}</p>
              <Star size={16} className="text-amber-500 fill-amber-500" />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card px-3 py-2.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Total avis</p>
            <p className="text-2xl font-extrabold text-foreground mt-1">{summary.totalReviews}</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-3 py-2.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Sans réponse</p>
            <p className="text-2xl font-extrabold text-red-500 mt-1">{summary.unrepliedCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-3 py-2.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Fiches connectées</p>
            <p className="text-2xl font-extrabold text-primary mt-1">{summary.accountsCount}</p>
          </div>
        </div>
      )}

      {/* Rating distribution */}
      {isConnected && summary && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-bold text-foreground mb-3">Distribution des notes</p>
          <div className="space-y-2">
            {['FIVE', 'FOUR', 'THREE', 'TWO', 'ONE'].map((rating) => {
              const count = ratingDist[rating] || 0;
              const total = summary.totalReviews || 1;
              const pct = Math.round((count / total) * 100);
              const stars = { FIVE: 5, FOUR: 4, THREE: 3, TWO: 2, ONE: 1 }[rating] || 0;
              return (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-8 text-right">{stars}★</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
                      className="h-full rounded-full bg-amber-500"
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
              <p className="text-xs text-muted-foreground">Aucun avis synchronisé</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Cliquez sur "Synchroniser" pour importer vos avis Google.</p>
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
                        <span className="text-sm font-semibold text-foreground">{review.senderName}</span>
                        <span className="text-amber-500 text-xs">
                          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </span>
                        {!review.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {review.comment || '(Avis sans commentaire)'}
                      </p>
                      <p className="text-[10px] text-muted-foreground/50 mt-1.5">
                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                      </p>
                    </div>

                    <button
                      onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
                      className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                    >
                      <Send size={10} />
                      Répondre
                    </button>
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
                              onClick={() => replyMutation.mutate({ reviewId: review.reviewId, replyText })}
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
                              onClick={() => { setReplyingTo(null); setReplyText(''); }}
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
