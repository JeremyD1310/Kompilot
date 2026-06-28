/**
 * URLToVideoSection — Full URL-to-Video pipeline section
 * Wraps URLIngestionBar with scraped data display and video generation flow.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Globe, ArrowRight, Loader2, CheckCircle2, ExternalLink, Calendar } from 'lucide-react';
import { Button, toast } from '@blinkdotnew/ui';
import { URLIngestionBar } from './URLIngestionBar';
import { useGenerateVideo, useVideoStatus, type ScrapedData } from '../../hooks/useURLToVideo';
import { useNavigate } from '@tanstack/react-router';

interface URLToVideoSectionProps {
  userId?: string;
}

export function URLToVideoSection({ userId }: URLToVideoSectionProps) {
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const navigate = useNavigate();

  const generateVideo = useGenerateVideo();
  const { data: videoStatus } = useVideoStatus(generationId);

  const handleScraped = (data: ScrapedData) => {
    setScrapedData(data);
    toast.success('Contenu extrait !', {
      description: `${data.extractedData.title || 'Page analysée'} — prête pour la vidéo`,
    });
  };

  const handleGenerateVideo = () => {
    if (!scrapedData) return;
    generateVideo.mutate(
      { scrapedData, format: 'story' },
      {
        onSuccess: (result) => {
          if (result.generationId) {
            setGenerationId(result.generationId);
            toast.success('Vidéo en cours de génération…', {
              description: 'Cela peut prendre 1-2 minutes.',
            });
          }
        },
        onError: (err) => {
          toast.error('Erreur de génération vidéo : ' + (err?.message || 'Réessayez'));
        },
      },
    );
  };

  const handleScheduleFromScript = () => {
    if (!scrapedData) return;
    const { hook, body, cta } = scrapedData.marketingContext;
    const script = `${hook}\n\n${body.join('\n')}\n\n${cta}`;
    navigate({ to: `/calendar?prefill=${encodeURIComponent(script)}&source=url_to_video` });
  };

  const isVideoReady = videoStatus?.status === 'completed' && videoStatus?.videoUrl;

  return (
    <div className="space-y-6">
      {/* URL Ingestion Bar */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
            <Globe size={20} className="text-violet-500" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">URL → Vidéo</h2>
            <p className="text-xs text-muted-foreground">
              Collez l'URL d'un produit ou d'une page — l'IA extrait le contenu et génère une vidéo marketing
            </p>
          </div>
        </div>

        <URLIngestionBar
          onScraped={handleScraped}
          onError={(err) => toast.error(err)}
        />
      </div>

      {/* Scraped Data Preview */}
      {scrapedData && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <h3 className="text-sm font-bold text-foreground">Données extraites</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Extracted Info */}
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Titre</p>
                <p className="text-sm text-foreground">{scrapedData.extractedData.title || '—'}</p>
              </div>
              {scrapedData.extractedData.description && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Description</p>
                  <p className="text-xs text-muted-foreground line-clamp-3">{scrapedData.extractedData.description}</p>
                </div>
              )}
              {scrapedData.extractedData.prices.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Prix détectés</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {scrapedData.extractedData.prices.map((price, i) => (
                      <span key={i} className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-medium">
                        {price}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Marketing Context */}
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Hook suggéré</p>
                <p className="text-sm text-foreground font-medium">{scrapedData.marketingContext.hook}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Points clés</p>
                <ul className="space-y-1">
                  {scrapedData.marketingContext.body.map((point, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-primary mt-0.5">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">CTA</p>
                <p className="text-sm text-foreground">{scrapedData.marketingContext.cta}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
            <Button
              onClick={handleGenerateVideo}
              disabled={generateVideo.isPending}
              className="gap-2"
            >
              {generateVideo.isPending ? (
                <><Loader2 size={14} className="animate-spin" /> Génération…</>
              ) : (
                <><Video size={14} /> Générer la vidéo</>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleScheduleFromScript}
              className="gap-2"
            >
              <Calendar size={14} /> Planifier dans le calendrier
            </Button>
            <Button
              variant="ghost"
              onClick={() => setScrapedData(null)}
              className="gap-2 text-muted-foreground"
            >
              Réinitialiser
            </Button>
          </div>
        </motion.div>
      )}

      {/* Video Generation Status */}
      {generationId && videoStatus && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            {isVideoReady ? (
              <CheckCircle2 size={16} className="text-emerald-500" />
            ) : (
              <Loader2 size={16} className="animate-spin text-primary" />
            )}
            <h3 className="text-sm font-bold text-foreground">
              {isVideoReady ? 'Vidéo prête !' : 'Génération en cours…'}
            </h3>
          </div>

          {isVideoReady && videoStatus.videoUrl && (
            <div className="space-y-3">
              <video
                src={videoStatus.videoUrl}
                controls
                className="w-full max-w-md rounded-xl border border-border"
              />
              <div className="flex gap-2">
                <a
                  href={videoStatus.videoUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  <ExternalLink size={13} /> Télécharger
                </a>
              </div>
            </div>
          )}

          {videoStatus.status === 'failed' && (
            <p className="text-xs text-destructive">
              La génération a échoué. {videoStatus.error || 'Réessayez avec une autre URL.'}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
