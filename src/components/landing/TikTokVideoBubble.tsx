/**
 * TikTokVideoBubble — Floating video bubble (style TikTok "swipe up")
 *
 * Plays the first 3 seconds of the ad video in a loop, muted, in a corner of
 * the screen to maintain visual scent-matching from the story ad that drove the click.
 *
 * The video URL can be a real MP4 or left null for a CSS-animated fallback
 * (an animated avatar placeholder showing the "shocked creator" aesthetic).
 */
import { useRef, useEffect, useState } from 'react';
import { X, Volume2 } from 'lucide-react';

interface TikTokVideoBubbleProps {
  /** URL of the ad video (MP4 preferred, 9:16). Null = use animated placeholder. */
  videoSrc?: string | null;
  /** CTA label beneath the bubble */
  ctaText?: string;
  /** Corner to anchor the bubble. Default: bottom-left */
  position?: 'bottom-left' | 'bottom-right';
  /** Auto-dismiss after N ms. 0 = never. Default 0 */
  autoDismissMs?: number;
}

export function TikTokVideoBubble({
  videoSrc = null,
  ctaText = 'Faites le test comme Sophie en 35s ⬇️',
  position = 'bottom-left',
  autoDismissMs = 0,
}: TikTokVideoBubbleProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [bouncing, setBouncing] = useState(false);

  // Fade-in after mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  // Auto-dismiss
  useEffect(() => {
    if (!autoDismissMs) return;
    const t = setTimeout(() => setDismissed(true), autoDismissMs);
    return () => clearTimeout(t);
  }, [autoDismissMs]);

  // Loop only the first 3 seconds
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => {
      if (video.currentTime >= 3) {
        video.currentTime = 0;
        video.play().catch(() => {});
      }
    };
    video.addEventListener('timeupdate', onTimeUpdate);
    return () => video.removeEventListener('timeupdate', onTimeUpdate);
  }, []);

  // Bounce attention pulse every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      setBouncing(true);
      setTimeout(() => setBouncing(false), 600);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (dismissed) return null;

  const posClass = position === 'bottom-left'
    ? 'left-4 bottom-24 sm:left-6 sm:bottom-28'
    : 'right-4 bottom-24 sm:right-6 sm:bottom-28';

  return (
    <div
      className={`fixed ${posClass} z-50 transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${bouncing ? 'scale-105' : 'scale-100'}`}
      style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.45))' }}
    >
      {/* Bubble container */}
      <div className="relative flex flex-col items-center gap-1.5">

        {/* Dismiss button */}
        <button
          onClick={() => setDismissed(true)}
          aria-label="Fermer"
          className="absolute -top-2 -right-2 z-10 w-5 h-5 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <X size={10} />
        </button>

        {/* Video ring — TikTok-style circular border */}
        <div
          className="relative w-20 h-20 rounded-full overflow-hidden cursor-pointer"
          style={{
            background: 'conic-gradient(#0D9488, #14B8A6, #F59E0B, #EF4444, #0D9488)',
            padding: '2.5px',
          }}
          onClick={() => {
            // Scroll to the scanner on click
            document.getElementById('scanner-anchor')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          {/* Inner circle clip */}
          <div className="w-full h-full rounded-full overflow-hidden bg-slate-900">
            {videoSrc ? (
              <video
                ref={videoRef}
                src={videoSrc}
                autoPlay
                muted
                playsInline
                loop={false}
                className="w-full h-full object-cover"
              />
            ) : (
              /* Animated fallback: shocked-creator aesthetic */
              <AnimatedCreatorPlaceholder />
            )}
          </div>

          {/* Mute icon overlay */}
          <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center">
            <Volume2 size={8} className="text-white/70" />
          </div>
        </div>

        {/* CTA text */}
        <div
          className="max-w-[160px] text-center cursor-pointer"
          onClick={() => {
            document.getElementById('scanner-anchor')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <p
            className="text-[11px] font-bold leading-tight"
            style={{
              color: '#fff',
              textShadow: '0 1px 4px rgba(0,0,0,0.8), 0 0 12px rgba(0,0,0,0.6)',
              WebkitTextStroke: '0.1px rgba(0,0,0,0.4)',
            }}
          >
            {ctaText}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Animated placeholder that mimics the "shocked creator" vibe when no video is provided */
function AnimatedCreatorPlaceholder() {
  return (
    <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-rose-900 via-slate-900 to-slate-950">
      {/* Animated shock expression */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        {/* Face */}
        <div
          className="text-2xl select-none"
          style={{ animation: 'shockPulse 1.2s ease-in-out infinite' }}
        >
          😱
        </div>
        {/* Score number */}
        <span
          className="text-[10px] font-black text-rose-400 leading-none"
          style={{ animation: 'shockPulse 1.2s ease-in-out infinite 0.2s' }}
        >
          32/100
        </span>
      </div>
      {/* Scan line effect */}
      <div
        className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-teal-400/60 to-transparent"
        style={{ animation: 'scanLine 1.8s linear infinite' }}
      />
      <style>{`
        @keyframes shockPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes scanLine {
          0% { top: 0%; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}
