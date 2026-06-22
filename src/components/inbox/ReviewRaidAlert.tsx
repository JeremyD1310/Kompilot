import { useState } from 'react';
import { AlertTriangle, Shield, Sparkles, X, RefreshCw, Copy, Check } from 'lucide-react';
import { Button, Badge, toast } from '@blinkdotnew/ui';
import { blink } from '../../blink/client';
import { useEstablishment } from '../../context/EstablishmentContext';
import type { ReviewRaidState } from '../../hooks/useReviewRaidDetector';

type Platform = 'google' | 'tripadvisor' | 'thefork';

const PLATFORM_LABELS: Record<Platform, string> = {
  google: 'Google',
  tripadvisor: 'TripAdvisor',
  thefork: 'TheFork',
};

interface ReviewRaidAlertProps {
  raidState: ReviewRaidState;
  onDismiss: () => void;
}

export function ReviewRaidAlert({ raidState, onDismiss }: ReviewRaidAlertProps) {
  const [platform, setPlatform] = useState<Platform>('google');
  const [generating, setGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [copied, setCopied] = useState(false);
  const { activeEstablishment } = useEstablishment();

  const establishmentName = activeEstablishment?.name ?? 'Votre établissement';
  const count = raidState.suspiciousReviews.length;
  const date = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleGenerate = async () => {
    setGenerating(true);
    setGeneratedText('');
    try {
      const platformLabel = PLATFORM_LABELS[platform];
      const prompt = `Tu es un juriste expert en droit de la consommation français. Rédige une demande officielle de suppression d'avis frauduleux à envoyer au support de ${platformLabel} :

Contexte :
- Établissement : ${establishmentName}
- Nombre d'avis suspects : ${count} avis notés ≤2★ reçus en moins de 24h
- Période : ${date}

La lettre doit :
1. Mentionner la politique anti-spam de ${platformLabel}
2. Citer les critères de suppression d'avis (hors-sujet, faux avis coordonnés)
3. Demander une enquête urgente et la suspension temporaire des avis concernés
4. Inclure une demande de réponse sous 48h
5. Être signée "${establishmentName}"

Format : email professionnel avec objet, corps, signature. Ton formel et factuel.`;

      const { object } = await blink.ai.generateObject({
        prompt,
        schema: {
          type: 'object',
          properties: { letter: { type: 'string' } },
          required: ['letter'],
        },
      });
      setGeneratedText((object as { letter: string }).letter);
      toast.success('Demande de suppression générée !');
    } catch (err: any) {
      if (err?.message?.includes('401')) {
        blink.auth.login(window.location.href);
      } else {
        toast.error('Erreur IA', { description: err?.message ?? 'Réessayez.' });
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedText);
    setCopied(true);
    toast.success('Copié dans le presse-papiers !');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border-2 border-red-500 bg-red-50 dark:bg-red-950/30 p-4 space-y-4 mb-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-red-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-extrabold text-red-800 dark:text-red-300">
                🚨 Raid d'avis négatifs détecté
              </h3>
              <Badge className="bg-red-600 text-white text-[10px] px-2 py-0.5 h-auto animate-pulse border-0">
                ⏸ Automatisation suspendue
              </Badge>
            </div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1 leading-relaxed">
              <strong>{count} avis suspect{count > 1 ? 's' : ''}</strong> (≤2★) détecté{count > 1 ? 's' : ''} en
              moins de 24h. La réponse automatique a été suspendue pour ces avis.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
          aria-label="Lever l'alerte"
        >
          <X size={14} />
        </button>
      </div>

      {/* Suspicious reviews list */}
      <div className="space-y-2">
        <p className="text-[10px] font-black text-red-700 dark:text-red-400 uppercase tracking-widest flex items-center gap-1.5">
          <Shield size={10} /> Avis suspects identifiés
        </p>
        <div className="space-y-1.5">
          {raidState.suspiciousReviews.map(review => (
            <div
              key={review.id}
              className="flex items-start gap-2.5 rounded-xl bg-white/70 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40 px-3 py-2"
            >
              <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                {review.authorName.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-red-800 dark:text-red-200">{review.authorName}</p>
                  <span className="text-[10px] font-bold text-red-600 bg-red-100 dark:bg-red-900/50 rounded-full px-1.5 py-0.5">
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)} {review.rating}/5
                  </span>
                  <span className="text-[10px] text-red-400 ml-auto">{review.date}</span>
                </div>
                <p className="text-[11px] text-red-700 dark:text-red-300 mt-0.5 line-clamp-2 leading-relaxed">
                  "{review.text}"
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform selector */}
      <div className="space-y-2">
        <p className="text-[10px] font-black text-red-700 dark:text-red-400 uppercase tracking-widest">
          Plateforme cible
        </p>
        <div className="flex gap-2">
          {(Object.keys(PLATFORM_LABELS) as Platform[]).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPlatform(p)}
              className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-all ${
                platform === p
                  ? 'border-red-500 bg-red-600 text-white'
                  : 'border-red-200 dark:border-red-700/40 bg-white/70 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:border-red-400'
              }`}
            >
              {PLATFORM_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <Button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white border-0 h-9 text-sm font-bold"
      >
        {generating ? (
          <><RefreshCw size={14} className="animate-spin" /> Génération en cours...</>
        ) : (
          <><Sparkles size={14} /> ✍️ Générer la demande de suppression</>
        )}
      </Button>

      {/* Generated letter panel */}
      {generatedText && (
        <div className="rounded-xl border border-red-200 dark:border-red-700/40 bg-white/90 dark:bg-red-950/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black text-red-700 dark:text-red-300 uppercase tracking-widest flex items-center gap-1.5">
              <Shield size={11} /> Demande de suppression — {PLATFORM_LABELS[platform]}
            </p>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className="h-7 px-2 text-xs gap-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40"
            >
              {copied ? (
                <><Check size={11} className="text-green-600" /> Copié !</>
              ) : (
                <><Copy size={11} /> Copier</>
              )}
            </Button>
          </div>
          <pre className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans">
            {generatedText}
          </pre>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleGenerate}
            disabled={generating}
            className="gap-1.5 text-xs text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 h-7"
          >
            <RefreshCw size={11} className={generating ? 'animate-spin' : ''} />
            Régénérer
          </Button>
        </div>
      )}

      {/* Dismiss link */}
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={onDismiss}
          className="text-[11px] text-red-400 hover:text-red-600 underline underline-offset-2 transition-colors"
        >
          Lever l'alerte manuellement
        </button>
      </div>
    </div>
  );
}
