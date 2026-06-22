/**
 * PhoneMockupPreview
 * Instagram / Facebook phone mockup with brand color overlay + AI engagement score.
 */
import { useState } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Flame, Clock, Star } from 'lucide-react';
import type { Establishment } from '../../context/EstablishmentContext';

// ── Engagement score logic ────────────────────────────────────────────────────

type EngagementLevel = 'Excellent' | 'Très bon' | 'Bon' | 'Moyen';

interface EngagementScore {
  level: EngagementLevel;
  score: number;   // 0–100
  color: string;
  bg: string;
  border: string;
  bestTime: string;
  bestDay: string;
}

function computeEngagement(text: string, angle: 'storytelling' | 'solution' | 'urgence'): EngagementScore {
  // Heuristic: urgence tends to convert, storytelling engages emotionally
  const baseMap: Record<string, number> = {
    storytelling: 82,
    solution: 75,
    urgence: 88,
  };

  let score = baseMap[angle];

  // Boost for emojis
  const emojiCount = (text.match(/[\u{1F300}-\u{1FAFF}]/gu) ?? []).length;
  score += Math.min(emojiCount * 2, 6);

  // Boost for questions
  if (text.includes('?')) score += 3;

  // Boost for short-ish text (sweet spot 80–180 chars)
  const len = text.length;
  if (len >= 80 && len <= 180) score += 4;
  if (len > 300) score -= 5;

  score = Math.min(98, Math.max(45, score));

  const TIMES = ['17h30', '18h00', '12h30', '19h00', '08h30'];
  const DAYS  = ['jeudi', 'vendredi', 'mardi', 'mercredi', 'lundi'];
  const idx   = (text.length + angle.length) % TIMES.length;

  if (score >= 85) return { level: 'Excellent',  score, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200', bestTime: TIMES[idx], bestDay: DAYS[idx] };
  if (score >= 72) return { level: 'Très bon',   score, color: 'text-teal-600',    bg: 'bg-teal-50 dark:bg-teal-950/30',       border: 'border-teal-200',    bestTime: TIMES[idx], bestDay: DAYS[idx] };
  if (score >= 60) return { level: 'Bon',        score, color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-950/30',     border: 'border-amber-200',   bestTime: TIMES[idx], bestDay: DAYS[idx] };
  return               { level: 'Moyen',       score, color: 'text-red-600',     bg: 'bg-red-50 dark:bg-red-950/30',         border: 'border-red-200',     bestTime: TIMES[idx], bestDay: DAYS[idx] };
}

// ── Brand color extractor (from Tailwind gradient class) ──────────────────────

function getBrandColor(colorClass: string): string {
  if (colorClass.includes('primary') || colorClass.includes('teal')) return '#0D9488';
  if (colorClass.includes('rose') || colorClass.includes('pink'))    return '#F43F5E';
  if (colorClass.includes('violet') || colorClass.includes('purple')) return '#8B5CF6';
  if (colorClass.includes('blue') || colorClass.includes('cyan'))    return '#3B82F6';
  if (colorClass.includes('orange') || colorClass.includes('amber')) return '#F59E0B';
  if (colorClass.includes('emerald') || colorClass.includes('green')) return '#10B981';
  if (colorClass.includes('indigo'))                                  return '#6366F1';
  return '#0D9488';
}

// ── Platform toggle ───────────────────────────────────────────────────────────

type Platform = 'instagram' | 'facebook';

// ── Main component ─────────────────────────────────────────────────────────────

interface PhoneMockupPreviewProps {
  text: string;
  angle: 'storytelling' | 'solution' | 'urgence';
  establishment: Establishment;
  isStreaming?: boolean;
}

export function PhoneMockupPreview({ text, angle, establishment, isStreaming = false }: PhoneMockupPreviewProps) {
  const [platform, setPlatform] = useState<Platform>('instagram');

  const brandColor  = getBrandColor(establishment.color);
  const engagement  = computeEngagement(text, angle);
  const displayName = establishment.shortName || establishment.name;
  const avatar      = establishment.avatar || displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col gap-3">
      {/* Platform switcher */}
      <div className="flex items-center gap-1 self-start rounded-full border border-border bg-muted/40 p-1">
        {(['instagram', 'facebook'] as Platform[]).map(p => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
              platform === p
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {p === 'instagram' ? '📸 Instagram' : '👤 Facebook'}
          </button>
        ))}
      </div>

      {/* Phone frame */}
      <div className="mx-auto" style={{ width: 240 }}>
        {/* Outer phone shell */}
        <div
          className="rounded-[28px] border-2 border-border bg-background shadow-xl overflow-hidden"
          style={{ boxShadow: `0 12px 40px -12px ${brandColor}44` }}
        >
          {/* Status bar */}
          <div className="flex items-center justify-between px-4 pt-2 pb-1 bg-background">
            <span className="text-[9px] font-bold text-foreground">9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-1.5 rounded-full border border-foreground/40 overflow-hidden">
                <div className="h-full rounded-full bg-foreground/70" style={{ width: '75%' }} />
              </div>
            </div>
          </div>

          {platform === 'instagram' ? (
            <InstagramMockup
              text={text}
              avatar={avatar}
              displayName={displayName}
              brandColor={brandColor}
              isStreaming={isStreaming}
            />
          ) : (
            <FacebookMockup
              text={text}
              avatar={avatar}
              displayName={displayName}
              brandColor={brandColor}
              isStreaming={isStreaming}
            />
          )}

          {/* Bottom bar */}
          <div className="px-3 py-2 bg-background border-t border-border/50 flex items-center justify-around">
            {['🏠','🔍','➕','❤️','👤'].map((ico, i) => (
              <span key={i} className="text-base opacity-60">{ico}</span>
            ))}
          </div>
        </div>
      </div>

      {/* AI Engagement Score Badge */}
      <EngagementBadge engagement={engagement} />
    </div>
  );
}

// ── Instagram mockup ──────────────────────────────────────────────────────────

function InstagramMockup({
  text, avatar, displayName, brandColor, isStreaming,
}: {
  text: string; avatar: string; displayName: string; brandColor: string; isStreaming: boolean;
}) {
  return (
    <div className="bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          {/* Avatar with brand ring */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0"
            style={{ background: `linear-gradient(135deg, ${brandColor}, ${brandColor}99)`, boxShadow: `0 0 0 2px white, 0 0 0 3.5px ${brandColor}` }}
          >
            {avatar}
          </div>
          <div>
            <p className="text-[10px] font-bold text-foreground leading-none">{displayName}</p>
            <p className="text-[9px] text-muted-foreground leading-none mt-0.5">il y a 2 min</p>
          </div>
        </div>
        <MoreHorizontal size={14} className="text-muted-foreground" />
      </div>

      {/* Image placeholder with brand gradient */}
      <div
        className="relative w-full aspect-square flex items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${brandColor}22, ${brandColor}44)` }}
      >
        {/* Brand watermark */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-black shadow-lg"
            style={{ background: brandColor }}
          >
            {avatar}
          </div>
          <span className="text-[10px] font-bold text-white/70 bg-black/20 rounded-full px-2 py-0.5">
            {displayName}
          </span>
        </div>
        {/* Shimmer overlay when streaming */}
        {isStreaming && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-3">
          <Heart size={16} className="text-foreground" />
          <MessageCircle size={16} className="text-foreground" />
          <Send size={16} className="text-foreground" />
        </div>
        <Bookmark size={16} className="text-foreground" />
      </div>

      {/* Likes */}
      <div className="px-3 pb-1">
        <p className="text-[10px] font-bold text-foreground">142 J'aime</p>
      </div>

      {/* Caption */}
      <div className="px-3 pb-3">
        <p className="text-[10px] text-foreground leading-relaxed line-clamp-4">
          <span className="font-bold">{displayName}</span>{' '}
          {text || (isStreaming ? <span className="animate-pulse">Génération en cours…</span> : '—')}
        </p>
      </div>
    </div>
  );
}

// ── Facebook mockup ───────────────────────────────────────────────────────────

function FacebookMockup({
  text, avatar, displayName, brandColor, isStreaming,
}: {
  text: string; avatar: string; displayName: string; brandColor: string; isStreaming: boolean;
}) {
  return (
    <div className="bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0"
          style={{ background: brandColor }}
        >
          {avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-foreground leading-none truncate">{displayName}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Clock size={8} className="text-muted-foreground" />
            <span className="text-[9px] text-muted-foreground">2 min · 🌍</span>
          </div>
        </div>
        <MoreHorizontal size={14} className="text-muted-foreground" />
      </div>

      {/* Text */}
      <div className="px-3 pb-2">
        <p className="text-[10px] text-foreground leading-relaxed line-clamp-5">
          {text || (isStreaming ? <span className="animate-pulse">Génération en cours…</span> : '—')}
        </p>
      </div>

      {/* Image */}
      <div
        className="relative w-full"
        style={{ height: 100, background: `linear-gradient(135deg, ${brandColor}22, ${brandColor}44)` }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black"
            style={{ background: brandColor }}
          >
            {avatar}
          </div>
        </div>
        {isStreaming && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
        )}
      </div>

      {/* Reactions */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border/50">
        <span className="text-[9px] text-muted-foreground">👍 ❤️ 24</span>
        <span className="text-[9px] text-muted-foreground">8 commentaires</span>
      </div>
      <div className="flex items-center justify-around px-3 py-1.5 border-t border-border/50">
        {['👍 J\'aime', '💬 Commenter', '↗️ Partager'].map(a => (
          <span key={a} className="text-[9px] text-muted-foreground font-medium">{a}</span>
        ))}
      </div>
    </div>
  );
}

// ── Engagement badge ──────────────────────────────────────────────────────────

function EngagementBadge({ engagement }: { engagement: EngagementScore }) {
  const barWidth = engagement.score;

  return (
    <div className={`rounded-2xl border ${engagement.border} ${engagement.bg} p-3 space-y-2`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Flame size={13} className={engagement.color} />
          <span className="text-[11px] font-bold text-foreground">Score d'engagement IA</span>
        </div>
        <span className={`text-[11px] font-black ${engagement.color}`}>
          {engagement.level}
        </span>
      </div>

      {/* Score bar */}
      <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            engagement.level === 'Excellent' ? 'bg-emerald-500' :
            engagement.level === 'Très bon'  ? 'bg-teal-500' :
            engagement.level === 'Bon'       ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      {/* Best time */}
      <div className="flex items-center gap-1.5">
        <Star size={10} className="text-amber-500 shrink-0" />
        <p className="text-[10px] text-muted-foreground leading-snug">
          Idéal pour le <strong className="text-foreground">{engagement.bestDay} à {engagement.bestTime}</strong>
        </p>
      </div>
    </div>
  );
}
