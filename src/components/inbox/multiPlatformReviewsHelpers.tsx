import { Star } from 'lucide-react';
import type { ReviewPlatform } from './multiPlatformReviewsData';
import { PLATFORM_META } from './multiPlatformReviewsData';

// ── Star rating ──────────────────────────────────────────────────────────────

export function StarRating({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/25'}
        />
      ))}
    </div>
  );
}

// ── Author avatar ────────────────────────────────────────────────────────────

export function AuthorAvatar({ initials, rating }: { initials: string; rating: number }) {
  const cls =
    rating >= 4
      ? 'bg-emerald-100 text-emerald-700'
      : rating === 3
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-red-100 text-red-700';
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${cls}`}>
      {initials}
    </div>
  );
}

// ── Platform badge ───────────────────────────────────────────────────────────

export function PlatformBadge({ platform }: { platform: ReviewPlatform }) {
  const meta = PLATFORM_META[platform];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${meta.textColor} ${meta.bgColor} ${meta.borderColor}`}
    >
      {meta.dot} {meta.label}
    </span>
  );
}

// ── AI prompt builder — platform-aware ──────────────────────────────────────

export function buildAIPrompt(platform: ReviewPlatform, rating: number, text: string): string {
  const tone =
    rating >= 4
      ? 'chaleureuse et reconnaissante'
      : rating === 3
      ? 'professionnelle et constructive'
      : 'empathique, apaisante et orientée solution';

  if (platform === 'google') {
    return `Tu es le responsable communication d'une TPE/PME française. Un client a laissé l'avis Google suivant (note : ${rating}/5) :\n\n"${text}"\n\nRédige une réponse publique Google ${tone}. Elle doit être formelle, professionnelle, 2-3 phrases max, et signer "L'équipe Kompilot".`;
  }
  if (platform === 'tripadvisor') {
    return `Tu es le directeur d'un établissement hôtelier/restauration. Un voyageur a laissé cet avis sur TripAdvisor (note : ${rating}/5) :\n\n"${text}"\n\nRédige une réponse publique sur TripAdvisor ${tone}. Utilise un ton chaleureux et axé hospitalité, mentionne "sur TripAdvisor", 2-3 phrases max, signe "L'équipe Kompilot".`;
  }
  // facebook
  return `Tu es le community manager d'une petite entreprise française. Un client a laissé cet avis Facebook (note : ${rating}/5) :\n\n"${text}"\n\nRédige une réponse publique ${tone}. Utilise un ton décontracté et amical, une seule phrase courte (max 2), avec un emoji si positif. Signe "L'équipe Kompilot".`;
}

// ── Rating card border color ─────────────────────────────────────────────────

export const RATING_COLOR: Record<number, string> = {
  1: 'border-red-200 bg-red-50/40',
  2: 'border-orange-200 bg-orange-50/40',
  3: 'border-yellow-200 bg-yellow-50/40',
  4: 'border-emerald-200 bg-emerald-50/40',
  5: 'border-green-200 bg-green-50/40',
};
