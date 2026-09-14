/**
 * TavusVideoGenerator — AI video generation form using Tavus.
 * Includes script input, optional replica ID, generation button,
 * processing state, result display, and generation history.
 */

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, CardHeader, CardTitle, CardContent, CardFooter,
  Button, Input, Badge, EmptyState, Skeleton, toast,
} from '@blinkdotnew/ui';
import { Video, Loader2, Play, Clock, CheckCircle2, XCircle, Sparkles, History } from 'lucide-react';
import { backendFetch, authHeaders, readBackendError } from '../../lib/backend';
import { VideoPreviewDialog } from './VideoPreviewDialog';

const TAVUS_COST = 10;
const MAX_POLLING_CYCLES = 24;
const MAX_SCRIPT_LENGTH = 300; // ~30 seconds of speech

interface VideoRecord {
  id: string;
  tavusVideoId: string;
  status: string;
  script: string;
  videoUrl?: string;
  createdAt: string;
}

// ── Status helpers ──────────────────────────────────────────────────────────

function statusBadge(status: string) {
  switch (status) {
    case 'completed':
      return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400"><CheckCircle2 size={11} className="mr-1" />Terminée</Badge>;
    case 'processing':
    case 'generating':
      return <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400"><Loader2 size={11} className="mr-1 animate-spin" />En cours</Badge>;
    case 'failed':
    case 'error':
      return <Badge className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400"><XCircle size={11} className="mr-1" />Échouée</Badge>;
    default:
      return <Badge variant="outline"><Clock size={11} className="mr-1" />{status}</Badge>;
  }
}

// ── Component ───────────────────────────────────────────────────────────────

export function TavusVideoGenerator() {
  const queryClient = useQueryClient();
  const [script, setScript] = useState('');
  const [replicaId, setReplicaId] = useState('');
  const [pollingVideoId, setPollingVideoId] = useState<string | null>(null);
  const [pollCycles, setPollCycles] = useState(0);
  const [previewVideo, setPreviewVideo] = useState<VideoRecord | null>(null);

  const { data: balance = 0, isLoading: balanceLoading } = useQuery<number>({
    queryKey: ['creative-credit-balance'],
    queryFn: async () => {
      const response = await backendFetch('/api/credits/balance', { headers: await authHeaders() });
      if (!response.ok) throw await readBackendError(response, 'Impossible de récupérer votre solde de crédits.');
      const data = await response.json() as { balance?: number; credits?: number; remaining?: number };
      return Number(data.balance ?? data.credits ?? data.remaining ?? 0);
    },
  });

  useEffect(() => {
    if (!pollingVideoId || pollCycles >= MAX_POLLING_CYCLES) {
      if (pollingVideoId && pollCycles >= MAX_POLLING_CYCLES) setPollingVideoId(null);
      return;
    }
    const timer = window.setInterval(() => setPollCycles((count) => count + 1), 5000);
    return () => window.clearInterval(timer);
  }, [pollingVideoId, pollCycles]);

  const charCount = script.length;
  const isOverLimit = charCount > MAX_SCRIPT_LENGTH;
  const isNearLimit = charCount >= MAX_SCRIPT_LENGTH * 0.8 && !isOverLimit;

  // Fetch video history
  const { data: history, isLoading: historyLoading } = useQuery<VideoRecord[]>({
    queryKey: ['video-history'],
    queryFn: async () => {
      const res = await backendFetch('/api/videos/history', { headers: await authHeaders() });
      if (!res.ok) throw await readBackendError(res, 'Impossible de charger l’historique vidéo.');
      const data = await res.json();
      return Array.isArray(data) ? data : data.videos ?? [];
    },
    refetchInterval: pollingVideoId && pollCycles < MAX_POLLING_CYCLES ? 5000 : false,
  });

  // Generate video mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (balance < TAVUS_COST) throw new Error('Crédits insuffisants pour générer cette vidéo. Rechargez votre solde pour continuer.');
      const body: Record<string, string> = { script };
      if (replicaId.trim()) body.replicaId = replicaId.trim();

      const res = await backendFetch('/api/videos/generate', {
        method: 'POST',
        headers: await authHeaders(true),
        body: JSON.stringify(body),
      });

      if (!res.ok) throw await readBackendError(res, 'Erreur lors de la génération vidéo.');

      return await res.json() as { videoId?: string };
    },
    onSuccess: (data) => {
      toast.success('Vidéo en cours de génération !', {
        description: 'Le traitement peut prendre quelques minutes.',
      });
      setScript('');
      setReplicaId('');
      if (data.videoId) {
        setPollCycles(0);
        setPollingVideoId(data.videoId);
      }
      queryClient.invalidateQueries({ queryKey: ['video-history'] });
      queryClient.invalidateQueries({ queryKey: ['creative-credit-balance'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const isGenerating = generateMutation.isPending;

  useEffect(() => {
    if (!pollingVideoId || !history) return;
    const matchingVideo = history.find((video) => video.id === pollingVideoId);
    if (matchingVideo && ['completed', 'failed', 'error'].includes(matchingVideo.status)) {
      setPollingVideoId(null);
      setPollCycles(0);
    }
  }, [history, pollingVideoId]);

  return (
    <div className="space-y-6">
      {/* Generation form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Video size={16} className="text-primary" />
            Générer une vidéo IA
            <Badge className="ml-auto bg-primary/10 text-primary border-primary/20">
              <Sparkles size={11} className="mr-1" />
              {balanceLoading ? '…' : `${balance} crédits disponibles`}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-foreground">
                Script de la vidéo <span className="text-destructive">*</span>
              </label>
              <span className={`text-xs font-mono font-medium tabular-nums ${
                isOverLimit ? 'text-destructive' : isNearLimit ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
              }`}>
                {charCount}/{MAX_SCRIPT_LENGTH}
              </span>
            </div>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              maxLength={MAX_SCRIPT_LENGTH + 50} // Allow slight overflow for better UX — block on submit
              placeholder="Décrivez le contenu de votre vidéo… Ex: Présentation de notre nouveau produit, un café artisanal bio…"
              className={`w-full min-h-[120px] rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-offset-1 transition-shadow resize-y ${
                isOverLimit
                  ? 'border-destructive focus:ring-destructive/50'
                  : 'border-input focus:ring-ring'
              }`}
              disabled={isGenerating}
            />
            {/* Visual progress bar */}
            <div className="mt-2 space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ease-out ${
                    isOverLimit
                      ? 'bg-destructive'
                      : isNearLimit
                        ? 'bg-amber-500'
                        : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min((charCount / MAX_SCRIPT_LENGTH) * 100, 100)}%` }}
                />
              </div>

              {isOverLimit && (
                <p className="text-xs text-destructive flex items-center gap-1.5 font-medium">
                  <XCircle size={13} className="shrink-0" />
                  Script trop long ({charCount}/{MAX_SCRIPT_LENGTH} car.) — supprimez {charCount - MAX_SCRIPT_LENGTH} caractère{charCount - MAX_SCRIPT_LENGTH > 1 ? 's' : ''} pour continuer. Durée max : ~30 secondes.
                </p>
              )}
              {isNearLimit && !isOverLimit && (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <Clock size={13} className="shrink-0" />
                  Attention : il vous reste {MAX_SCRIPT_LENGTH - charCount} caractère{MAX_SCRIPT_LENGTH - charCount > 1 ? 's' : ''} avant la limite de 300 (≈ 30s).
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Replica ID <span className="text-muted-foreground font-normal">(optionnel)</span>
            </label>
            <Input
              value={replicaId}
              onChange={(e) => setReplicaId(e.target.value)}
              placeholder="rXXXXXXXX — laissez vide pour le défaut"
              disabled={isGenerating}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={isGenerating || !script.trim() || isOverLimit || balance < TAVUS_COST || balanceLoading}
            className="w-full sm:w-auto font-bold"
          >
            {isGenerating ? (
              <>
                <Loader2 size={14} className="mr-2 animate-spin" />
                Génération en cours…
              </>
            ) : isOverLimit ? (
              <>
                <XCircle size={14} className="mr-2" />
                Script trop long ({charCount}/{MAX_SCRIPT_LENGTH})
              </>
            ) : (
              <>
                <Video size={14} className="mr-2" />
                Générer la vidéo (10 crédits)
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Processing indicator */}
      {pollingVideoId && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Loader2 size={20} className="text-primary animate-spin" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Vidéo en cours de traitement…</p>
              <p className="text-xs text-muted-foreground">
                ID: {pollingVideoId} — cette page se met à jour automatiquement.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <History size={16} className="text-primary" />
            Historique des vidéos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : !history || history.length === 0 ? (
            <EmptyState
              icon={<Video />}
              title="Aucune vidéo générée"
              description="Générez votre première vidéo IA avec le formulaire ci-dessus."
            />
          ) : (
            <div className="space-y-2">
              {history.map((video) => (
                <div
                  key={video.id}
                  className="flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Play size={14} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-2">{video.script}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {new Date(video.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {video.videoUrl && (
                        <button
                          type="button"
                          onClick={() => setPreviewVideo(video)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          <Play size={11} /> Prévisualiser
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {statusBadge(video.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <VideoPreviewDialog
        open={Boolean(previewVideo?.videoUrl)}
        title={previewVideo?.script ?? 'Vidéo Tavus'}
        src={previewVideo?.videoUrl}
        onClose={() => setPreviewVideo(null)}
      />
    </div>
  );
}
