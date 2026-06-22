import { useState } from 'react';
import { Smartphone } from 'lucide-react';

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  );
}

interface StoryPreviewProps {
  mediaUrl: string | null;
  mediaType: 'image' | 'video';
  text: string;
  channels: string[];
}

// ── Story progress bars ────────────────────────────────────────────────────────
function StoryProgressBars({ count }: { count: number }) {
  return (
    <div className="absolute top-3 left-3 right-3 flex gap-1 z-30">
      {Array.from({ length: Math.max(1, count) }).map((_, i) => (
        <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
          <div
            className="h-full rounded-full bg-white"
            style={{ width: i === 0 ? '60%' : '0%' }}
          />
        </div>
      ))}
    </div>
  );
}

// ── Platform tab toggle ───────────────────────────────────────────────────────
type StoryPlatform = 'instagram' | 'facebook';

export function StoryPreview({ mediaUrl, mediaType, text, channels }: StoryPreviewProps) {
  const hasInstagram = channels.includes('instagram');
  const hasFacebook  = channels.includes('facebook');

  // Default to whichever is selected; if both → Instagram first
  const platforms: StoryPlatform[] = [
    ...(hasInstagram ? ['instagram' as const] : []),
    ...(hasFacebook  ? ['facebook'  as const] : []),
  ];

  const defaultPlatform: StoryPlatform = platforms[0] ?? 'instagram';
  const [activePlatform, setActivePlatform] = useState<StoryPlatform>(defaultPlatform);

  // Platform colours
  const platformMeta: Record<StoryPlatform, { gradient: string; icon: typeof InstagramIcon; name: string }> = {
    instagram: { gradient: 'from-purple-600 via-pink-500 to-orange-400', icon: InstagramIcon, name: 'Instagram' },
    facebook:  { gradient: 'from-blue-600 to-blue-500',                   icon: FacebookIcon,  name: 'Facebook'  },
  };

  const meta = platformMeta[activePlatform];

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Platform tab */}
      {platforms.length > 1 && (
        <div className="flex gap-1 rounded-full bg-muted border border-border p-1">
          {platforms.map(p => {
            const PIcon = platformMeta[p].icon;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setActivePlatform(p)}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
                  activePlatform === p ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <PIcon /> {platformMeta[p].name}
              </button>
            );
          })}
        </div>
      )}

      {/* Story badge */}
      <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-purple-500 text-white text-[10px] font-bold px-3 py-1">
        📱 Format Story 9:16
      </div>

      {/* Phone frame — 9:16 ratio: 200×356px */}
      <div className="relative shrink-0" style={{ width: 200, height: 356 }}>
        <div
          className="absolute inset-0 rounded-[36px] border-[6px] border-gray-800 bg-gray-800 overflow-hidden shadow-2xl"
          style={{ zIndex: 1 }}
        >
          <div className="absolute inset-0 rounded-[30px] bg-black overflow-hidden">

            {/* ── Background media / gradient ── */}
            {mediaUrl && mediaType === 'video' ? (
              <video key={mediaUrl} src={mediaUrl} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
            ) : mediaUrl ? (
              <img src={mediaUrl} alt="story preview" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${meta.gradient} opacity-80`} />
            )}

            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-black/20 z-10" />
            {/* Bottom gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-black/70 to-transparent z-10" />

            {/* Story progress bars */}
            <StoryProgressBars count={3} />

            {/* Story header: avatar + name + time */}
            <div className="absolute top-7 left-3 right-12 flex items-center gap-2 z-30">
              <div className={`w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br ${meta.gradient} shrink-0`} />
              <div className="min-w-0">
                <p className="text-white text-[10px] font-bold leading-none truncate">votre_compte</p>
                <p className="text-white/60 text-[9px] mt-0.5">il y a 1 min</p>
              </div>
            </div>

            {/* Close + Mute icons top-right */}
            <div className="absolute top-7 right-3 flex flex-col gap-1.5 z-30">
              <div className="w-6 h-6 rounded-full bg-black/30 flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">×</span>
              </div>
              <div className="w-6 h-6 rounded-full bg-black/30 flex items-center justify-center">
                <span className="text-white text-[8px]">♪</span>
              </div>
            </div>

            {/* Placeholder icon when no media */}
            {!mediaUrl && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="flex flex-col items-center gap-2 opacity-40">
                  <Smartphone size={32} className="text-white" />
                  <p className="text-white text-[9px] text-center px-4">Ajoutez un média Story</p>
                </div>
              </div>
            )}

            {/* Text overlay — story style */}
            {text && (
              <div className="absolute bottom-14 left-3 right-3 z-30">
                <div className="rounded-xl bg-black/50 backdrop-blur-sm px-3 py-2">
                  <p className="text-white text-[10px] leading-relaxed line-clamp-4 text-center">{text}</p>
                </div>
              </div>
            )}

            {/* Reply bar at bottom */}
            <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center gap-2">
              <div className="flex-1 rounded-full border border-white/40 bg-white/10 px-3 py-1.5">
                <p className="text-white/50 text-[9px]">Répondre à votre_compte…</p>
              </div>
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-white text-[10px]">❤️</span>
              </div>
            </div>

            {/* Platform watermark */}
            <div className="absolute bottom-3 right-14 z-30">
              <meta.icon className="text-white/40" />
            </div>
          </div>
        </div>

        {/* Dynamic island */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-800 rounded-full" style={{ zIndex: 5 }} />
      </div>

      {/* Caption */}
      <div className="text-center space-y-0.5">
        <p className="text-[11px] font-semibold text-foreground flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
          Aperçu Story {meta.name}
        </p>
        <p className="text-[10px] text-muted-foreground">Format vertical 9:16 — 24h de visibilité</p>
      </div>
    </div>
  );
}
