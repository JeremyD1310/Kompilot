/**
 * ReviewToPostModal — Transforme un avis 5★ en post réseau social prêt à publier.
 * 
 * Workflow :
 *  1. L'IA extrait la meilleure phrase de l'avis
 *  2. Génère 3 variantes de post (Instagram, Facebook, Google My Business)
 *  3. Affiche un aperçu visuel carte-style prêt à partager
 *  4. Bouton "Créer dans le Calendrier" → ouvre CreatePostModal avec le contenu pré-rempli
 */
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  Button, Badge, toast,
} from '@blinkdotnew/ui';
import {
  Sparkles, Image, RefreshCw, Copy, Check,
  Instagram, Star, Zap, Share2, ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { blink } from '../../blink/client';
import type { GoogleReview } from './reviewsData';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PostVariant {
  channel: 'instagram' | 'facebook' | 'google_business';
  label: string;
  emoji: string;
  text: string;
  hashtags: string[];
}

interface ReviewToPostModalProps {
  review: GoogleReview | null;
  open: boolean;
  onClose: () => void;
  /** Called when user wants to send to calendar editor */
  onSendToCalendar?: (text: string, channels: string[]) => void;
}

// ── Visual preview card ───────────────────────────────────────────────────────

function PostPreviewCard({ review, bestQuote, variant }: {
  review: GoogleReview;
  bestQuote: string;
  variant: PostVariant;
}) {
  const gradients: Record<PostVariant['channel'], string> = {
    instagram: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
    facebook: 'linear-gradient(135deg, #1877f2 0%, #42a5f5 100%)',
    google_business: 'linear-gradient(135deg, #0D9488 0%, #06B6D4 100%)',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl overflow-hidden shadow-lg border border-border"
    >
      {/* Header gradient banner */}
      <div style={{ background: gradients[variant.channel] }} className="px-4 py-3 flex items-center gap-2">
        <span className="text-lg">{variant.emoji}</span>
        <span className="text-white font-bold text-sm">{variant.label}</span>
        <div className="ml-auto flex items-center gap-0.5">
          {[1,2,3,4,5].map(i => (
            <Star key={i} size={11} className="fill-yellow-300 text-yellow-300" />
          ))}
        </div>
      </div>

      {/* Quote block */}
      <div className="bg-gradient-to-br from-slate-50 to-white p-4 space-y-3">
        <div className="flex items-start gap-2.5">
          <span className="text-3xl leading-none text-slate-200 font-serif shrink-0 mt-1">"</span>
          <p className="text-sm font-semibold text-slate-700 leading-relaxed italic">
            {bestQuote}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 font-bold text-xs flex items-center justify-center shrink-0">
            {review.authorInitials}
          </div>
          <p className="text-xs text-slate-500 font-medium">{review.authorName} · Avis Google vérifié</p>
          <CheckCircle2 size={13} className="text-teal-500 ml-auto shrink-0" />
        </div>
      </div>

      {/* Post body */}
      <div className="bg-white px-4 pb-4 pt-2 space-y-2">
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{variant.text}</p>
        <p className="text-xs text-primary font-medium flex flex-wrap gap-1">
          {variant.hashtags.map(h => <span key={h}>{h}</span>)}
        </p>
      </div>
    </motion.div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export function ReviewToPostModal({ review, open, onClose, onSendToCalendar }: ReviewToPostModalProps) {
  const [step, setStep] = useState<'idle' | 'generating' | 'done' | 'error'>('idle');
  const [bestQuote, setBestQuote] = useState('');
  const [variants, setVariants] = useState<PostVariant[]>([]);
  const [activeVariantIdx, setActiveVariantIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const activeVariant = variants[activeVariantIdx];

  const handleGenerate = useCallback(async () => {
    if (!review) return;
    setStep('generating');
    setBestQuote('');
    setVariants([]);

    try {
      const { object } = await blink.ai.generateObject({
        prompt: `Tu es un expert en content marketing pour les TPE françaises.

Un client a laissé cet avis Google 5★ :
"${review.text}"
— ${review.authorName}

Ta mission :
1. Extrait la phrase la plus percutante et émotionnelle de cet avis (max 20 mots, garde l'authenticité du client)
2. Crée 3 variations de post réseau social basées sur cette citation :
   - Instagram : format storytelling avec émojis, entre 3-4 phrases
   - Facebook : format engagement communauté, question finale, 3-4 phrases
   - Google My Business : format professionnel sobre, 2-3 phrases, remerciement + CTA booking

Chaque post doit :
- Citer naturellement l'avis sans être trop commercial
- Inclure 3-5 hashtags pertinents (secteur local, qualité, satisfaction)
- Être directement copiable/publiable`,
        schema: {
          type: 'object',
          properties: {
            best_quote: { type: 'string' },
            variants: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  channel: { type: 'string', enum: ['instagram', 'facebook', 'google_business'] },
                  label: { type: 'string' },
                  emoji: { type: 'string' },
                  text: { type: 'string' },
                  hashtags: { type: 'array', items: { type: 'string' } },
                },
                required: ['channel', 'label', 'emoji', 'text', 'hashtags'],
              },
            },
          },
          required: ['best_quote', 'variants'],
        },
      });

      const result = object as { best_quote: string; variants: PostVariant[] };
      setBestQuote(result.best_quote);
      setVariants(result.variants);
      setActiveVariantIdx(0);
      setStep('done');
    } catch (err: any) {
      console.error('[ReviewToPost] generation error', err);
      if (err?.message?.includes('401')) {
        blink.auth.login(window.location.href);
      } else {
        setStep('error');
      }
    }
  }, [review]);

  const handleCopy = async () => {
    if (!activeVariant) return;
    const text = `${activeVariant.text}\n\n${activeVariant.hashtags.join(' ')}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Post copié dans le presse-papier !');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendToCalendar = () => {
    if (!activeVariant) return;
    const text = `${activeVariant.text}\n\n${activeVariant.hashtags.join(' ')}`;
    const channel = activeVariant.channel === 'google_business' ? 'Google My Business' : activeVariant.channel === 'instagram' ? 'Instagram' : 'Facebook';
    onSendToCalendar?.(text, [channel]);
    toast.success('Post envoyé dans l\'éditeur de calendrier !');
    onClose();
  };

  const handleClose = () => {
    setStep('idle');
    setBestQuote('');
    setVariants([]);
    setActiveVariantIdx(0);
    onClose();
  };

  if (!review) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shrink-0">
              <Image size={16} className="text-white" />
            </div>
            <span>🎨 Transformer en Post Réseaux</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Source review */}
          <div className="rounded-xl border border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800/40 p-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(i => <Star key={i} size={11} className="fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-[11px] font-bold text-green-700 dark:text-green-400">{review.authorName} · Avis 5★</p>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">"{review.text.slice(0, 120)}{review.text.length > 120 ? '…' : ''}"</p>
          </div>

          {/* CTA or results */}
          <AnimatePresence mode="wait">
            {step === 'idle' && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 py-6"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500/15 to-cyan-500/10 border border-teal-200 flex items-center justify-center">
                  <Share2 size={26} className="text-teal-600" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-semibold text-sm text-foreground">L'IA va créer 3 posts prêts à publier</p>
                  <p className="text-xs text-muted-foreground">Instagram · Facebook · Google My Business</p>
                </div>
                <Button onClick={handleGenerate} className="gap-2">
                  <Sparkles size={14} />
                  Générer les posts IA
                </Button>
              </motion.div>
            )}

            {step === 'generating' && (
              <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 py-8"
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-200 flex items-center justify-center">
                    <Sparkles size={22} className="text-teal-600 animate-pulse" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
                    <RefreshCw size={10} className="text-white animate-spin" />
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold text-foreground">L'IA analyse votre avis…</p>
                  <p className="text-xs text-muted-foreground">Extraction de la citation · Génération des posts · Sélection des hashtags</p>
                </div>
                <div className="flex gap-1.5">
                  {['Instagram', 'Facebook', 'Google My Business'].map((ch, i) => (
                    <span key={ch} className="text-[10px] bg-muted border border-border rounded-full px-2 py-0.5 text-muted-foreground animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>
                      {ch}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 'done' && activeVariant && (
              <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Channel selector */}
                <div className="flex gap-2 flex-wrap">
                  {variants.map((v, i) => (
                    <button
                      key={v.channel}
                      onClick={() => setActiveVariantIdx(i)}
                      className={`flex items-center gap-1.5 text-xs font-semibold rounded-full border px-3 py-1.5 transition-all ${
                        i === activeVariantIdx
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                      }`}
                    >
                      <span>{v.emoji}</span> {v.label}
                    </button>
                  ))}
                </div>

                {/* Post preview */}
                <PostPreviewCard review={review} bestQuote={bestQuote} variant={activeVariant} />

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs h-8"
                    onClick={handleCopy}
                  >
                    {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                    {copied ? 'Copié !' : 'Copier'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs h-8"
                    onClick={handleGenerate}
                  >
                    <RefreshCw size={12} /> Régénérer
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs h-8 ml-auto"
                    onClick={handleSendToCalendar}
                  >
                    <Zap size={12} /> Ajouter au Calendrier
                    <ArrowRight size={11} />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'error' && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3 py-6 text-center"
              >
                <p className="text-sm text-muted-foreground">🤖 Le Copilot est très sollicité. Réessayez dans un instant.</p>
                <Button variant="outline" size="sm" onClick={handleGenerate} className="gap-2">
                  <RefreshCw size={13} /> Réessayer
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
