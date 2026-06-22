import { useState, useRef, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  Button, toast,
} from '@blinkdotnew/ui';
import { Sparkles, Copy, Check, Zap, RefreshCw, Lightbulb, X } from 'lucide-react';
import { useAIContentGenerator, type ContentTone, type ContentFormat, type GeneratedVariant } from '../../hooks/useAIContentGenerator';
import { useEstablishment } from '../../context/EstablishmentContext';
import { useOnboardingProfile } from '../../hooks/useOnboardingProfile';

// ── Sub-types ─────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called when user clicks "Use this variant" */
  onUseText?: (text: string) => void;
  /** Pre-fill topic */
  initialTopic?: string;
}

// ── Selectors data ─────────────────────────────────────────────────────────────

const FORMATS: { id: ContentFormat; label: string; emoji: string }[] = [
  { id: 'post_social',          label: 'Post social',         emoji: '📱' },
  { id: 'story',                label: 'Story',               emoji: '⚡' },
  { id: 'description_business', label: 'Description Google',  emoji: '🗺️' },
  { id: 'reponse_avis',         label: 'Réponse avis',        emoji: '⭐' },
  { id: 'email_marketing',      label: 'Email marketing',     emoji: '📧' },
];

const TONES: { id: ContentTone; label: string; color: string }[] = [
  { id: 'professionnel', label: 'Professionnel', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300' },
  { id: 'décontracté',   label: 'Décontracté',   color: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 border-sky-300' },
  { id: 'promotionnel',  label: 'Promotionnel',  color: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300' },
  { id: 'informatif',    label: 'Informatif',    color: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-violet-300' },
  { id: 'inspirant',     label: 'Inspirant',     color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-300' },
];

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', emoji: '📸' },
  { id: 'facebook',  label: 'Facebook',  emoji: '👥' },
  { id: 'google',    label: 'Google',    emoji: '🗺️' },
  { id: 'linkedin',  label: 'LinkedIn',  emoji: '💼' },
  { id: 'tiktok',    label: 'TikTok',    emoji: '🎵' },
] as const;

type Platform = typeof PLATFORMS[number]['id'];

// ── Variant card ───────────────────────────────────────────────────────────────

function VariantCard({ variant, onUse, onCopy }: {
  variant: GeneratedVariant;
  onUse: () => void;
  onCopy: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-2xl border border-border bg-card p-4 flex flex-col gap-3 hover:border-primary/40 transition-colors group">
      {/* Emoji badge */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-2xl leading-none">{variant.emoji}</span>
        <span className="text-[11px] text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5 shrink-0">
          {variant.charCount} car.
        </span>
      </div>

      {/* Text */}
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap flex-1">{variant.text}</p>

      {/* Hashtags */}
      {variant.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {variant.hashtags.map(tag => (
            <span key={tag} className="text-[11px] font-medium text-primary bg-primary/8 rounded-full px-2 py-0.5">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t border-border">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground py-1.5 rounded-lg hover:bg-muted/60 transition-colors"
        >
          {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
          {copied ? 'Copié !' : 'Copier'}
        </button>
        <button
          onClick={onUse}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 py-1.5 rounded-lg transition-colors"
        >
          <Zap size={13} />
          Utiliser
        </button>
      </div>
    </div>
  );
}

// ── Main modal ─────────────────────────────────────────────────────────────────

export function AIContentGeneratorModal({ open, onClose, onUseText, initialTopic = '' }: Props) {
  const { activeEstablishment } = useEstablishment();
  const profile = useOnboardingProfile();

  const businessName = activeEstablishment?.name ?? profile?.companyName ?? 'Mon entreprise';
  const sector       = activeEstablishment?.activity ?? profile?.sector ?? 'commerce';
  const city         = activeEstablishment?.city ?? (profile as any)?.city ?? '';
  const objectives   = (profile?.objectives as string[] | undefined) ?? [];

  const [format, setFormat]     = useState<ContentFormat>('post_social');
  const [tone, setTone]         = useState<ContentTone>('décontracté');
  const [platform, setPlatform] = useState<Platform | ''>('');
  const [topic, setTopic]       = useState(initialTopic);

  const { generate, isGenerating, result, error, streamText, reset } = useAIContentGenerator();

  const handleGenerate = () => {
    generate({
      businessName,
      sector,
      city: city || undefined,
      objectives: objectives.length ? objectives : undefined,
      tone,
      format,
      platform: platform || undefined,
      topic: topic.trim() || undefined,
    });
  };

  const handleUse = (text: string) => {
    onUseText?.(text);
    toast.success('Texte inséré dans l\'éditeur !');
    onClose();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    toast.success('Copié dans le presse-papier !');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 border border-primary/20">
                <Sparkles size={20} className="text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Générateur IA de contenu</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Personnalisé pour <span className="font-semibold text-primary">{businessName}</span>
                  {city ? ` · ${city}` : ''}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pt-5 pb-6 space-y-5">
          {/* Format selector */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
              Format de contenu
            </label>
            <div className="flex flex-wrap gap-2">
              {FORMATS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`flex items-center gap-1.5 text-xs font-semibold rounded-xl px-3 py-2 border-2 transition-all duration-150 ${
                    format === f.id
                      ? 'border-primary bg-primary/8 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  <span>{f.emoji}</span> {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tone selector */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
              Ton souhaité
            </label>
            <div className="flex flex-wrap gap-2">
              {TONES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`text-xs font-semibold rounded-xl px-3 py-1.5 border-2 transition-all duration-150 ${
                    tone === t.id ? t.color + ' border-current' : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Platform + topic row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Platform */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                Plateforme <span className="font-normal normal-case">(optionnel)</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PLATFORMS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(platform === p.id ? '' : p.id)}
                    className={`flex items-center gap-1 text-xs font-medium rounded-xl px-2.5 py-1.5 border transition-all ${
                      platform === p.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/30'
                    }`}
                  >
                    <span>{p.emoji}</span> {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                Sujet / contexte <span className="font-normal normal-case">(optionnel)</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Ex : promo -20%, ouverture dimanche…"
                className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>
          </div>

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full h-12 font-bold text-base gap-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Génération en cours…
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Générer 3 variantes IA
              </>
            )}
          </Button>

          {/* Streaming indicator */}
          {isGenerating && streamText && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground animate-pulse">
              ✨ L'IA génère votre contenu…
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              ⚠️ {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  {result.variants.length} variantes générées
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Variant cards */}
              <div className="grid grid-cols-1 gap-3">
                {result.variants.map(v => (
                  <VariantCard
                    key={v.id}
                    variant={v}
                    onUse={() => handleUse(v.text)}
                    onCopy={() => handleCopy(v.text)}
                  />
                ))}
              </div>

              {/* AI tip */}
              {result.tip && (
                <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/30 dark:bg-amber-950/20 p-3">
                  <Lightbulb size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">{result.tip}</p>
                </div>
              )}

              {/* Suggested hashtags */}
              {result.suggestedHashtags.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Hashtags suggérés</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.suggestedHashtags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          navigator.clipboard.writeText(tag).catch(() => {});
                          toast.success(`${tag} copié !`);
                        }}
                        className="text-[11px] font-medium text-primary bg-primary/8 hover:bg-primary/15 rounded-full px-2.5 py-1 transition-colors cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button variant="outline" onClick={() => { reset(); handleGenerate(); }} className="w-full gap-2" size="sm">
                <RefreshCw size={14} />
                Régénérer de nouvelles variantes
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
