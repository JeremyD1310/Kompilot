import { MapPin, CalendarCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { trackBookingClick, trackBookingClickForPlatform } from '../../lib/bookingClickTracker';
import { textStyleToCSS, DEFAULT_TEXT_STYLE, type TextStyle } from '../../lib/typographyStyles';

interface PhoneMockupProps {
  text: string;
  imagePreview: string | null;
  activeTab: 'instagram' | 'google';
  onTabChange: (tab: 'instagram' | 'google') => void;
  isGenerating: boolean;
  establishmentName: string;
  city: string;
  showBookingButton?: boolean;
  bookingUrl?: string;
  /** Platform ID for per-platform tracking (e.g. 'planity', 'thefork') */
  bookingPlatformId?: string;
  isNetworkOptimized?: boolean;
  platformVariants?: Record<string, string>;
  /** Typography style applied to the post text preview */
  textStyle?: TextStyle;
}

function SkeletonLines({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-2.5 rounded-full bg-gray-200 animate-pulse" style={{ width: `${[100, 80, 65][i] ?? 70}%` }} />
      ))}
    </div>
  );
}

/** Interactive "Réserver" booking button for the phone simulator */
function BookingButton({ url, platformId }: { url?: string; platformId?: string }) {
  return (
    <a
      href={url ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => {
        if (!url) { e.preventDefault(); return; }
        if (platformId) {
          trackBookingClickForPlatform(platformId);
        } else {
          trackBookingClick();
        }
      }}
      className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold px-3 py-1.5 transition-colors shadow-sm"
    >
      <CalendarCheck size={11} />
      Réserver maintenant 📅
    </a>
  );
}

function InstagramPreview({
  text, imagePreview, name, isGenerating, showBookingButton, bookingUrl, bookingPlatformId, textStyle,
}: {
  text: string; imagePreview: string | null; name: string; isGenerating: boolean;
  showBookingButton?: boolean; bookingUrl?: string; bookingPlatformId?: string;
  textStyle?: TextStyle;
}) {
  const lines = text.split('\n').filter(l => l.trim());
  const hashtagLine = lines.filter(l => l.trim().match(/^(#\w+\s*)+$/)).join(' ');
  const bodyLines = lines.filter(l => !l.trim().match(/^(#\w+\s*)+$/));
  const cssStyle = textStyleToCSS(textStyle ?? DEFAULT_TEXT_STYLE);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 shrink-0">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
          {name.charAt(0)}
        </div>
        <span className="text-[11px] font-semibold text-gray-800 flex-1 truncate">{name}</span>
        <span className="text-gray-400 text-base">···</span>
      </div>

      {/* Image */}
      <div className="w-full aspect-square bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
        {imagePreview ? (
          <img src={imagePreview} alt="Post" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-300">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
            <span className="text-[9px]">Votre photo</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-3 py-1.5 shrink-0">
        <span className="text-sm">❤️</span><span className="text-sm">💬</span><span className="text-sm">↗️</span>
      </div>

      {/* Text */}
      <div className="px-3 pb-2 overflow-y-auto flex-1">
        {isGenerating && !text ? (
          <SkeletonLines count={3} />
        ) : text ? (
          <>
            <p
              className="text-[10px] text-gray-800 leading-relaxed whitespace-pre-wrap"
              style={cssStyle}
            >
              {bodyLines.join('\n')}
            </p>
            {hashtagLine && <p className="text-[9px] text-blue-500 mt-1.5 leading-relaxed">{hashtagLine}</p>}
            {showBookingButton && <BookingButton url={bookingUrl} platformId={bookingPlatformId} />}
          </>
        ) : (
          <p className="text-[10px] text-gray-400 italic">Cliquez sur "Générer" pour voir votre post ici...</p>
        )}
      </div>
    </div>
  );
}

function GoogleMapsPreview({
  text, imagePreview, name, city, isGenerating, showBookingButton, bookingUrl, bookingPlatformId, textStyle,
}: {
  text: string; imagePreview: string | null; name: string; city: string; isGenerating: boolean;
  showBookingButton?: boolean; bookingUrl?: string; bookingPlatformId?: string;
  textStyle?: TextStyle;
}) {
  // Google posts are short — strip hashtags and truncate
  const shortText = text.replace(/(#\w+\s*)+/g, '').replace(/\n{2,}/g, '\n').trim().slice(0, 280);
  const cssStyle  = textStyleToCSS(textStyle ?? DEFAULT_TEXT_STYLE);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      {/* GMB header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 shrink-0">
        <div className="w-8 h-8 rounded-sm bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">G</div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-gray-900 truncate">{name}</p>
          <div className="flex items-center gap-1">
            <MapPin size={8} className="text-red-500 shrink-0" />
            <span className="text-[9px] text-gray-500 truncate">{city}</span>
          </div>
        </div>
      </div>

      {/* Photo */}
      <div className="w-full h-20 bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
        {imagePreview ? (
          <img src={imagePreview} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="text-gray-300 text-[9px] flex flex-col items-center gap-1">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
            Photo
          </div>
        )}
      </div>

      {/* Post content */}
      <div className="px-3 py-2 flex-1 overflow-y-auto">
        <div className="flex items-center gap-1 mb-1.5">
          <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide">Nouveauté</span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span className="text-[8px] text-gray-400">À l'instant</span>
        </div>
        {isGenerating && !text ? (
          <SkeletonLines count={2} />
        ) : text ? (
          <>
            <p className="text-[10px] text-gray-700 leading-relaxed" style={cssStyle}>{shortText}</p>
            {showBookingButton && <BookingButton url={bookingUrl} platformId={bookingPlatformId} />}
            <p className="text-[10px] text-green-600 font-medium mt-2 flex items-center gap-1">
              🔒 <span className="text-[9px]">Filtré : numéros et URLs déplacés vers le CTA officiel</span>
            </p>
          </>
        ) : (
          <p className="text-[10px] text-gray-400 italic">Votre fiche Google Maps s'affichera ici...</p>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-gray-100 flex items-center justify-between shrink-0">
        <span className="text-[8px] text-gray-400">Fiche Google Maps</span>
        <div className="flex gap-2 text-[9px] text-blue-600 font-medium">
          <span>👍 J'aime</span>
          <span>💬 Répondre</span>
        </div>
      </div>
    </div>
  );
}

export function PhoneMockup({
  text, imagePreview, activeTab, onTabChange, isGenerating,
  establishmentName, city,
  showBookingButton, bookingUrl, bookingPlatformId,
  isNetworkOptimized, platformVariants = {},
  textStyle,
}: PhoneMockupProps) {

  const hasInstagramVariant = isNetworkOptimized && !!platformVariants.instagram;
  const hasGoogleVariant = isNetworkOptimized && !!platformVariants.google;

  const instagramText = hasInstagramVariant ? platformVariants.instagram : text;
  const googleText = hasGoogleVariant ? platformVariants.google : text;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Tab switcher */}
      <div className="flex rounded-xl border border-border bg-muted/30 p-1 gap-1">
        {([
          ['instagram', '📸 Instagram'],
          ['google', '📍 Google Maps'],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={cn(
              'relative rounded-lg px-3 py-2 text-xs font-semibold transition-all',
              activeTab === id ? 'bg-white dark:bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
            {/* "Optimisé" badge */}
            {isNetworkOptimized && ((id === 'instagram' && hasInstagramVariant) || (id === 'google' && hasGoogleVariant)) && (
              <span className="absolute -top-1.5 -right-1 rounded-full bg-primary text-primary-foreground text-[8px] font-bold px-1 py-0.5 leading-none">
                IA
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Network optimization info */}
      {isNetworkOptimized && Object.keys(platformVariants).length > 0 && (
        <div className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-[10px] text-primary font-medium">
          ✨ Texte adapté aux codes de chaque réseau
        </div>
      )}

      {/* Phone frame */}
      <div className="relative w-[256px] h-[512px] rounded-[36px] border-[6px] border-gray-800 shadow-2xl bg-white overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-6 bg-gray-800 rounded-b-[14px] z-10" />
        <div className="pt-6 h-full">
          {activeTab === 'instagram' ? (
            <InstagramPreview
              text={instagramText}
              imagePreview={imagePreview}
              name={establishmentName}
              isGenerating={isGenerating}
              showBookingButton={showBookingButton}
              bookingUrl={bookingUrl}
              bookingPlatformId={bookingPlatformId}
              textStyle={textStyle}
            />
          ) : (
            <GoogleMapsPreview
              text={googleText}
              imagePreview={imagePreview}
              name={establishmentName}
              city={city}
              isGenerating={isGenerating}
              showBookingButton={showBookingButton}
              bookingUrl={bookingUrl}
              bookingPlatformId={bookingPlatformId}
              textStyle={textStyle}
            />
          )}
        </div>
      </div>

      {/* Copy button — copies active tab's text */}
      {text && !isGenerating && (
        <button
          onClick={() => {
            const toCopy = activeTab === 'instagram' ? instagramText : googleText;
            navigator.clipboard.writeText(toCopy);
          }}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted/70 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          📋 Copier le texte {activeTab === 'instagram' ? 'Instagram' : 'Google Maps'}
        </button>
      )}
    </div>
  );
}
