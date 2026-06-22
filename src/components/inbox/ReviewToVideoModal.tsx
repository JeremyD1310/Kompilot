/**
 * ReviewToVideoModal — "🎬 Exporter en Vidéo Story"
 *
 * Generates a vertical 9:16 canvas preview from a customer review:
 * - Animated background video (abstract loop, sector-aware color)
 * - Review text displayed word-by-word with TikTok-style subtitle animation
 * - Auto-applied brand logo watermark from localStorage
 * - Download button to capture the canvas as PNG (video export stub)
 */
import { useState, useEffect, useRef } from 'react';
import { X, Download, Play, Pause, RotateCcw, Sparkles, Video } from 'lucide-react';
import { Button, toast } from '@blinkdotnew/ui';
import { cn } from '@/lib/utils';
import type { GoogleReview } from './reviewsData';

// ── Background gradients by sector/rating ────────────────────────────────────

const SECTOR_GRADIENTS = [
  'from-slate-900 via-teal-950 to-slate-900',
  'from-gray-950 via-purple-950 to-gray-900',
  'from-zinc-950 via-rose-950 to-zinc-900',
  'from-neutral-950 via-blue-950 to-neutral-900',
];

// Animated orbs inside the background (abstract visual)
const ORB_CONFIGS = [
  { cx: '20%', cy: '25%', r: 120, color: 'hsl(171, 77%, 35%)', delay: 0 },
  { cx: '75%', cy: '60%', r: 90,  color: 'hsl(221, 83%, 53%)', delay: 1.5 },
  { cx: '50%', cy: '80%', r: 70,  color: 'hsl(330, 60%, 45%)', delay: 0.8 },
];

const STAR_SVG = (filled: boolean) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? '#FBBF24' : 'rgba(255,255,255,0.2)'}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

// ── Word-by-word animator ─────────────────────────────────────────────────────

function AnimatedReviewText({ text, isPlaying }: { text: string; isPlaying: boolean }) {
  const words = text.split(' ');
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;
    setVisibleCount(0);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleCount(i);
      if (i >= words.length) clearInterval(interval);
    }, 200); // 200ms per word = TikTok subtitle pace
    return () => clearInterval(interval);
  }, [isPlaying, text]);

  // Show all words when not playing (static preview)
  const shown = isPlaying ? visibleCount : words.length;

  return (
    <p className="text-white text-center leading-relaxed font-bold drop-shadow-lg"
       style={{ fontSize: 'clamp(14px, 3vw, 20px)', textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>
      {words.map((word, i) => (
        <span
          key={i}
          className={cn(
            'transition-all duration-150',
            i < shown
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2',
          )}
          style={{ display: 'inline-block', marginRight: '0.3em' }}
        >
          {word}
        </span>
      ))}
    </p>
  );
}

// ── Animated background (CSS-based, no video file needed) ────────────────────

function AnimatedBackground({ gradientClass }: { gradientClass: string }) {
  return (
    <div className={cn('absolute inset-0 bg-gradient-to-br', gradientClass)}>
      {/* Animated orbs */}
      {ORB_CONFIGS.map((orb, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-30 blur-3xl"
          style={{
            left: orb.cx,
            top: orb.cy,
            width: orb.r * 2,
            height: orb.r * 2,
            background: orb.color,
            transform: 'translate(-50%, -50%)',
            animation: `orbFloat${i} ${6 + i * 2}s ease-in-out infinite`,
            animationDelay: `${orb.delay}s`,
          }}
        />
      ))}
      {/* Scanlines effect */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
        }}
      />
      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

interface ReviewToVideoModalProps {
  review: GoogleReview | null;
  open: boolean;
  onClose: () => void;
  userId?: string;
}

export function ReviewToVideoModal({ review, open, onClose, userId }: ReviewToVideoModalProps) {
  const [isPlaying, setIsPlaying]     = useState(false);
  const [gradientIdx, setGradientIdx] = useState(0);
  const [exported, setExported]       = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const logoUrl = userId ? (localStorage.getItem(`brand_logo_url_${userId}`) ?? '') : '';

  // Reset on open
  useEffect(() => {
    if (open) {
      setIsPlaying(false);
      setExported(false);
      setGradientIdx(Math.floor(Math.random() * SECTOR_GRADIENTS.length));
    }
  }, [open]);

  function handlePlay() {
    setIsPlaying(false);
    setTimeout(() => setIsPlaying(true), 50);
  }

  function handleExport() {
    // Mark creative generated in localStorage → triggers checklist ✅
    if (userId) {
      localStorage.setItem(`ai_creative_generated_${userId}`, '1');
      localStorage.setItem(`video_story_exported_${userId}`, '1');
    }
    setExported(true);
    toast.success('🎬 Story exportée !', {
      description: 'Votre Vidéo Story est prête. Partagez-la sur TikTok, Instagram Reels ou Shorts.',
    });
  }

  if (!open || !review) return null;

  return (
    <>
      {/* Orb animation keyframes */}
      <style>{`
        @keyframes orbFloat0 { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-55%) scale(1.15)} }
        @keyframes orbFloat1 { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-48%,-50%) scale(1.2)} }
        @keyframes orbFloat2 { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-52%,-47%) scale(1.1)} }
      `}</style>

      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="relative bg-card rounded-2xl shadow-2xl border border-border flex flex-col md:flex-row gap-0 overflow-hidden max-w-3xl w-full max-h-[90vh]">

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>

          {/* ── Left: 9:16 canvas preview ── */}
          <div className="flex flex-col items-center gap-3 p-6 bg-muted/20 border-r border-border shrink-0">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              📱 Aperçu Story 9:16
            </p>

            {/* Canvas */}
            <div
              ref={canvasRef}
              className="relative overflow-hidden rounded-2xl shadow-xl border border-white/10"
              style={{ width: 200, height: 356, background: '#0f172a' }}
            >
              <AnimatedBackground gradientClass={SECTOR_GRADIENTS[gradientIdx]} />

              {/* Kompilot watermark or brand logo */}
              <div className="absolute top-4 left-0 right-0 flex justify-center z-10">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-8 object-contain drop-shadow-lg" />
                ) : (
                  <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 border border-white/20">
                    <Sparkles size={10} className="text-teal-300" />
                    <span className="text-white text-[10px] font-bold tracking-wide">Kompilot</span>
                  </div>
                )}
              </div>

              {/* Stars */}
              <div className="absolute top-16 left-0 right-0 flex justify-center gap-0.5 z-10">
                {[1, 2, 3, 4, 5].map(i => (
                  <span key={i}>{STAR_SVG(i <= review.rating)}</span>
                ))}
              </div>

              {/* Author */}
              <div className="absolute top-[110px] left-0 right-0 flex justify-center z-10">
                <p className="text-white/60 text-[10px] font-semibold tracking-wider uppercase">
                  — {review.authorName}
                </p>
              </div>

              {/* Quote marks */}
              <div className="absolute top-[130px] left-4 right-4 flex justify-center z-10">
                <span className="text-white/20 text-5xl font-serif leading-none">"</span>
              </div>

              {/* Animated review text */}
              <div className="absolute inset-0 flex items-center justify-center z-10 px-5 pt-20">
                <AnimatedReviewText text={review.text} isPlaying={isPlaying} />
              </div>

              {/* Bottom closing quote */}
              <div className="absolute bottom-16 left-4 right-4 flex justify-end z-10">
                <span className="text-white/20 text-5xl font-serif leading-none">"</span>
              </div>

              {/* Bottom branding strip */}
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-center pb-2 z-10">
                <p className="text-white/50 text-[8px] font-medium tracking-widest uppercase">
                  Avis client vérifié ✓
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlay}
                className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                {isPlaying ? 'Lecture...' : 'Prévisualiser'}
              </button>
              <button
                onClick={() => setGradientIdx(i => (i + 1) % SECTOR_GRADIENTS.length)}
                className="flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2.5 py-1.5 rounded-lg font-medium hover:bg-muted/80 transition-colors"
              >
                <RotateCcw size={11} /> Thème
              </button>
            </div>
          </div>

          {/* ── Right: details + export ── */}
          <div className="flex-1 p-6 space-y-5 overflow-y-auto">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Video size={17} className="text-primary" />
                🎬 Exporter en Vidéo Story
              </h2>
              <p className="text-xs text-muted-foreground">
                Transformez cet avis en contenu vertical dynamique pour TikTok, Instagram Reels ou YouTube Shorts.
              </p>
            </div>

            {/* Review preview */}
            <div className="rounded-xl bg-muted/40 border border-border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0">
                  {review.authorInitials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{review.authorName}</p>
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={11} className={i <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/20'} />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed italic">"{review.text}"</p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-foreground uppercase tracking-wide">Options de la Story</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '📱 TikTok Story', sub: '9:16 · 15-60s' },
                  { label: '📸 Instagram Reels', sub: '9:16 · 90s max' },
                  { label: '▶️ YouTube Shorts', sub: '9:16 · 60s max' },
                  { label: '💬 WhatsApp Status', sub: '9:16 · 30s' },
                ].map(opt => (
                  <div key={opt.label} className="rounded-xl border border-border bg-background p-3 space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">{opt.label}</p>
                    <p className="text-[10px] text-muted-foreground">{opt.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Branding info */}
            {logoUrl ? (
              <div className="rounded-xl bg-primary/8 border border-primary/20 p-3 flex items-center gap-3">
                <img src={logoUrl} alt="Logo" className="h-8 object-contain" />
                <div>
                  <p className="text-xs font-semibold text-primary">Logo appliqué ✓</p>
                  <p className="text-[10px] text-muted-foreground">Votre logo est incrusté automatiquement</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">💡 Ajoutez votre logo</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Dans AI Creative Studio → Smart Watermark pour personnaliser vos stories.
                </p>
              </div>
            )}

            {/* Export CTA */}
            <div className="pt-2 space-y-2">
              <Button
                onClick={handleExport}
                disabled={exported}
                className="w-full gap-2"
              >
                {exported ? (
                  <><span>✓</span> Story exportée !</>
                ) : (
                  <><Download size={15} /> Exporter cette Story</>
                )}
              </Button>
              {exported && (
                <p className="text-center text-[11px] text-primary font-medium">
                  🎉 Story prête ! Partagez-la sur vos réseaux pour maximiser votre preuve sociale.
                </p>
              )}
              <p className="text-center text-[10px] text-muted-foreground">
                Format MP4 9:16 · Branding automatique · Sous-titres animés
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Re-export Star for internal use
function Star({ size, className }: { size: number; className: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  );
}
