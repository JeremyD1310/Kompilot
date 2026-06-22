import { useState } from 'react';
import { Heart, MessageCircle, Share2, Smartphone, Music2, MoreHorizontal, ExternalLink } from 'lucide-react';
import { StoryPreview } from './StoryPreview';
import { textStyleToCSS, DEFAULT_TEXT_STYLE, type TextStyle } from '../../lib/typographyStyles';

// ── Icons ────────────────────────────────────────────────────────────────────

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.83a8.16 8.16 0 004.79 1.54V6.93a4.85 4.85 0 01-1.02-.24z" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  );
}

function GoogleBizIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
      <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z" />
    </svg>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface PhonePreviewProps {
  mediaUrl: string | null;
  mediaType: 'image' | 'video';
  text: string;
  channels: string[];
  actionLink?: string;
  actionLabel?: string;
  contentFormat?: 'post' | 'story';
  textStyle?: TextStyle;
}

type PreviewPlatform = 'instagram' | 'tiktok' | 'linkedin' | 'facebook' | 'google';

// ── Instagram sticker (CTA overlay on media) ─────────────────────────────────

function InstagramCTASticker({ label }: { label: string }) {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 rotate-[-4deg]">
      <div className="flex items-center gap-1.5 bg-white rounded-full px-4 py-2 shadow-xl border-2 border-white">
        <ExternalLink size={11} className="text-pink-600 shrink-0" />
        <span className="text-xs font-extrabold text-pink-600 tracking-wide uppercase">
          {label}
        </span>
      </div>
      {/* Sticker glow effect */}
      <div className="absolute inset-0 rounded-full bg-pink-400/20 blur-md -z-10 scale-125" />
    </div>
  );
}

// ── LinkedIn / Facebook link card ────────────────────────────────────────────

function LinkedinLinkCard({ link, label, isLinkedin }: { link: string; label: string; isLinkedin: boolean }) {
  const domain = (() => {
    try { return new URL(link.startsWith('http') ? link : 'https://' + link).hostname.replace('www.', ''); }
    catch { return link.slice(0, 20); }
  })();

  return (
    <div className="mx-1 mb-1 rounded-lg overflow-hidden border border-white/20 bg-white/10 backdrop-blur-sm">
      {/* Fake link preview image */}
      <div className={`h-10 flex items-center justify-center ${isLinkedin ? 'bg-blue-600/40' : 'bg-blue-500/40'}`}>
        <span className="text-white/60 text-[9px] font-medium uppercase tracking-widest">{domain}</span>
      </div>
      {/* Card body */}
      <div className="px-2.5 py-2 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-white text-[9px] font-bold leading-tight truncate">{label} — Lien externe</p>
          <p className="text-white/50 text-[8px] truncate">{domain}</p>
        </div>
        <div className={`shrink-0 text-[8px] font-bold rounded px-2 py-1 ${isLinkedin ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white'}`}>
          {label}
        </div>
      </div>
    </div>
  );
}

// ── Google Business CTA button ───────────────────────────────────────────────

function GoogleCTAButton({ label }: { label: string }) {
  return (
    <div className="mx-2 mb-1.5">
      <div className="flex items-center justify-center gap-2 rounded-lg border border-[#dadce0] bg-white px-3 py-2 shadow-sm">
        {/* Google coloured G */}
        <svg width="12" height="12" viewBox="0 0 24 24">
          <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z" fill="#4285F4" />
        </svg>
        <span className="text-[10px] font-semibold text-gray-700">{label}</span>
      </div>
    </div>
  );
}

// ── LinkedIn / Facebook "desktop-like" post preview ──────────────────────────

function LinkedinPreview({
  text, mediaUrl, mediaType, actionLink, actionLabel, platform, textCss,
}: {
  text: string; mediaUrl: string | null; mediaType: 'image' | 'video';
  actionLink: string; actionLabel: string; platform: 'linkedin' | 'facebook';
  textCss?: React.CSSProperties;
}) {
  const isLinkedin = platform === 'linkedin';
  const navBg = isLinkedin ? 'bg-[#0a66c2]' : 'bg-[#1877f2]';
  const Icon = isLinkedin ? LinkedinIcon : FacebookIcon;

  return (
    <div className="w-full flex flex-col rounded-2xl overflow-hidden bg-[#f3f2ef] border border-border shadow-md" style={{ minHeight: 380 }}>
      {/* Fake top bar */}
      <div className={`${navBg} px-3 py-2 flex items-center gap-2 shrink-0`}>
        <Icon className="text-white shrink-0" />
        <div className="flex-1 h-4 bg-white/20 rounded-full" />
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
          <span className="text-white text-[9px] font-bold">JD</span>
        </div>
      </div>

      {/* Post card */}
      <div className="m-2 rounded-lg bg-white shadow-sm flex-1 flex flex-col overflow-hidden">
        {/* Author */}
        <div className="flex items-center gap-2 px-3 pt-3 pb-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-violet-500 shrink-0" />
          <div>
            <p className="text-[9px] font-bold text-gray-900">Votre Entreprise</p>
            <p className="text-[8px] text-gray-400">{isLinkedin ? '1 234 abonnés' : 'Page Facebook'}</p>
          </div>
          <div className="ml-auto">
            <MoreHorizontal size={12} className="text-gray-400" />
          </div>
        </div>

        {/* Text */}
        <p className="text-[9px] text-gray-800 leading-relaxed px-3 pb-2 line-clamp-3" style={textCss}>
          {text || 'Votre texte de publication apparaîtra ici...'}
        </p>

        {/* Media */}
        {mediaUrl && (
          <div className="w-full h-20 overflow-hidden">
            {mediaType === 'video' ? (
              <video src={mediaUrl} autoPlay muted loop playsInline className="w-full h-full object-cover" />
            ) : (
              <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
            )}
          </div>
        )}

        {/* Engagement row */}
        <div className="flex items-center gap-3 px-3 py-1.5 border-t border-gray-100 mt-auto">
          <span className="text-[8px] text-gray-400">👍 124  💬 18  🔄 7</span>
        </div>

        {/* Action link card */}
        {actionLink && (
          <LinkedinLinkCard link={actionLink} label={actionLabel} isLinkedin={isLinkedin} />
        )}
      </div>
    </div>
  );
}

// ── Google Business preview ──────────────────────────────────────────────────

function GoogleBusinessPreview({
  text, mediaUrl, mediaType, actionLink, actionLabel, textCss,
}: {
  text: string; mediaUrl: string | null; mediaType: 'image' | 'video';
  actionLink: string; actionLabel: string; textCss?: React.CSSProperties;
}) {
  return (
    <div className="w-full flex flex-col rounded-2xl overflow-hidden bg-white border border-border shadow-md" style={{ minHeight: 380 }}>
      {/* Maps header */}
      <div className="bg-[#4285F4] px-3 py-2 flex items-center gap-2 shrink-0">
        <GoogleBizIcon className="text-white shrink-0" />
        <div className="flex-1 h-3 bg-white/30 rounded-full" />
        <span className="text-white text-[9px] font-medium">Maps</span>
      </div>

      {/* Business card */}
      <div className="flex-1 flex flex-col">
        {/* Media */}
        {mediaUrl ? (
          <div className="h-24 overflow-hidden">
            {mediaType === 'video' ? (
              <video src={mediaUrl} autoPlay muted loop playsInline className="w-full h-full object-cover" />
            ) : (
              <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
            )}
          </div>
        ) : (
          <div className="h-16 bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
            <GoogleBizIcon className="text-blue-300 w-8 h-8 opacity-40" />
          </div>
        )}

        {/* Business info */}
        <div className="px-3 py-2">
          <p className="text-[11px] font-bold text-gray-900">Votre Entreprise</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-amber-400 text-[10px]">★★★★★</span>
            <span className="text-[8px] text-gray-500">4.8 (124 avis)</span>
          </div>
          <p className="text-[8px] text-gray-500 mt-0.5">Ouvert · Ferme à 19h00</p>
        </div>

        {/* Post text */}
        {text && (
          <div className="px-3 pb-2">
            <p className="text-[9px] text-gray-700 leading-relaxed line-clamp-3 border-t border-gray-100 pt-2" style={textCss}>
              {text}
            </p>
          </div>
        )}

        {/* Action buttons row */}
        <div className="flex gap-2 px-3 pb-2 mt-auto">
          {['Itinéraire', 'Appeler', 'Site'].map(btn => (
            <div key={btn} className="flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg bg-[#f8f9fa] border border-[#e8eaed]">
              <span className="text-[8px] text-[#1a73e8] font-medium">{btn}</span>
            </div>
          ))}
        </div>

        {/* CTA action button — the star */}
        {actionLink && <GoogleCTAButton label={actionLabel} />}
      </div>
    </div>
  );
}

// ── Main PhonePreview ────────────────────────────────────────────────────────

export function PhonePreview({ mediaUrl, mediaType, text, channels, actionLink = '', actionLabel = 'Réserver', contentFormat = 'post', textStyle }: PhonePreviewProps) {
  const typoCss = textStyleToCSS(textStyle ?? DEFAULT_TEXT_STYLE);
  // Story format → dedicated 9:16 preview
  if (contentFormat === 'story') {
    return <StoryPreview mediaUrl={mediaUrl} mediaType={mediaType} text={text} channels={channels} />;
  }

  // Determine which preview to show based on channels
  const hasLinkedin  = channels.includes('linkedin');
  const hasFacebook  = channels.includes('facebook');
  const hasGoogle    = channels.includes('google_business');
  const hasInstagram = channels.includes('instagram');
  const hasTiktok    = channels.includes('tiktok');

  type Tab = 'reels' | 'linkedin' | 'facebook' | 'google';

  const availableTabs: { id: Tab; label: string }[] = [
    ...(hasInstagram || hasTiktok ? [{ id: 'reels' as Tab, label: hasTiktok ? 'TikTok' : 'Reels' }] : []),
    ...(hasLinkedin  ? [{ id: 'linkedin'  as Tab, label: 'LinkedIn'  }] : []),
    ...(hasFacebook  ? [{ id: 'facebook'  as Tab, label: 'Facebook'  }] : []),
    ...(hasGoogle    ? [{ id: 'google'    as Tab, label: 'Google'    }] : []),
  ];

  const defaultTab: Tab =
    hasInstagram || hasTiktok ? 'reels'
    : hasLinkedin  ? 'linkedin'
    : hasFacebook  ? 'facebook'
    : hasGoogle    ? 'google'
    : 'reels';

  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
  const hasMedia = !!mediaUrl;
  const isTiktok = hasTiktok && !hasInstagram;
  const platform: 'instagram' | 'tiktok' = isTiktok ? 'tiktok' : 'instagram';

  const hasAction = actionLink.trim().length > 0;

  // ── Flat views (LinkedIn / Facebook / Google) ─────────────────────────────
  if (activeTab !== 'reels' && availableTabs.length > 0) {
    return (
      <div className="flex flex-col items-center gap-3 w-full">
        {/* Tab row */}
        {availableTabs.length > 1 && (
          <div className="flex gap-1 rounded-full bg-muted border border-border p-1 flex-wrap justify-center">
            {availableTabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
                  activeTab === tab.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.id === 'reels' && (hasInstagram ? <InstagramIcon /> : <TikTokIcon />)}
                {tab.id === 'linkedin' && <LinkedinIcon />}
                {tab.id === 'facebook' && <FacebookIcon />}
                {tab.id === 'google'   && <GoogleBizIcon />}
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Flat preview */}
        <div className="w-full px-1">
          {activeTab === 'linkedin' && (
            <LinkedinPreview text={text} mediaUrl={mediaUrl} mediaType={mediaType} actionLink={actionLink} actionLabel={actionLabel} platform="linkedin" textCss={typoCss} />
          )}
          {activeTab === 'facebook' && (
            <LinkedinPreview text={text} mediaUrl={mediaUrl} mediaType={mediaType} actionLink={actionLink} actionLabel={actionLabel} platform="facebook" textCss={typoCss} />
          )}
          {activeTab === 'google' && (
            <GoogleBusinessPreview text={text} mediaUrl={mediaUrl} mediaType={mediaType} actionLink={actionLink} actionLabel={actionLabel} textCss={typoCss} />
          )}
        </div>

        {hasAction && (
          <p className="text-[10px] text-primary font-medium flex items-center gap-1">
            <ExternalLink size={10} /> Bouton CTA activé
          </p>
        )}
      </div>
    );
  }

  // ── Phone frame (Reels / TikTok) ──────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Tab row */}
      {availableTabs.length > 1 && (
        <div className="flex gap-1 rounded-full bg-muted border border-border p-1 flex-wrap justify-center">
          {availableTabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
                activeTab === tab.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.id === 'reels' && (hasInstagram ? <InstagramIcon /> : <TikTokIcon />)}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Phone frame */}
      <div className="relative shrink-0" style={{ width: 200, height: 434 }}>
        <div
          className="absolute inset-0 rounded-[36px] border-[6px] border-gray-800 bg-gray-800 overflow-hidden shadow-2xl"
          style={{ zIndex: 1 }}
        >
          <div className="absolute inset-0 rounded-[30px] bg-black overflow-hidden">

            {/* ── Media Layer ── */}
            {mediaUrl && mediaType === 'video' ? (
              <video key={mediaUrl} src={mediaUrl} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
            ) : mediaUrl ? (
              <img src={mediaUrl} alt="preview" className="absolute inset-0 w-full h-full object-cover preview-ken-burns" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 flex flex-col items-center justify-center gap-3">
                <Smartphone size={28} className="text-white/15" />
                <p className="text-white/25 text-[10px] text-center px-6 leading-relaxed">Sélectionnez un média pour voir l'aperçu</p>
              </div>
            )}

            {/* ── Status Bar ── */}
            <div className="absolute top-0 left-0 right-0 h-6 flex items-center justify-between px-4 z-20">
              <span className="text-white/70 text-[9px] font-medium">9:41</span>
              <div className="flex items-center gap-1">
                <div className="flex gap-0.5">
                  {[3, 4, 3, 2].map((h, i) => (
                    <div key={i} className="w-0.5 rounded-full bg-white/70" style={{ height: h * 2 }} />
                  ))}
                </div>
                <span className="text-white/70 text-[8px] ml-1">●●</span>
              </div>
            </div>

            {/* ── Overlay (when media present) ── */}
            {hasMedia && (
              <>
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent z-10" />

                {/* ── Instagram CTA Sticker ── */}
                {hasAction && <InstagramCTASticker label={actionLabel} />}

                {/* Right action bar */}
                <div className="absolute right-2 bottom-16 flex flex-col items-center gap-3 z-20">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-9 h-9 rounded-full border-2 border-white overflow-hidden bg-gradient-to-br from-primary to-violet-500">
                      <div className="w-full h-full bg-gradient-to-br from-primary/80 to-violet-600/80" />
                    </div>
                    <div className="w-4 h-4 rounded-full bg-primary border-2 border-black flex items-center justify-center -mt-2.5">
                      <span className="text-white text-[7px] font-bold">+</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-9 h-9 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center">
                      <Heart size={18} className="text-white" />
                    </div>
                    <span className="text-white text-[9px] font-medium">1.2K</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-9 h-9 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center">
                      <MessageCircle size={18} className="text-white" />
                    </div>
                    <span className="text-white text-[9px] font-medium">48</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-9 h-9 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center">
                      <Share2 size={18} className="text-white" />
                    </div>
                    <span className="text-white text-[9px] font-medium">312</span>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center">
                    <MoreHorizontal size={16} className="text-white" />
                  </div>
                </div>

                {/* Bottom text */}
                <div className={`absolute left-2 right-12 z-20 ${hasAction ? 'bottom-11' : 'bottom-3'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    {platform === 'instagram' ? <InstagramIcon className="text-white shrink-0" /> : <TikTokIcon className="text-white shrink-0" />}
                    <p className="text-white text-[10px] font-bold">@votre_compte</p>
                  </div>
                  <p className="text-white text-[9px] leading-tight line-clamp-2 opacity-90" style={typoCss}>
                    {text || 'Votre description apparaîtra ici...'}
                  </p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Music2 size={9} className="text-white/70 shrink-0" />
                    <p className="text-white/70 text-[8px] truncate">Son original · votre_compte</p>
                  </div>
                </div>

                {/* ── Instagram link button (below text) ── */}
                {hasAction && (
                  <div className="absolute bottom-3 left-2 right-12 z-20">
                    <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-3 py-1.5">
                      <ExternalLink size={9} className="text-white shrink-0" />
                      <span className="text-white text-[9px] font-semibold truncate">{actionLabel} →</span>
                    </div>
                  </div>
                )}

                {/* Video playing indicator */}
                {mediaType === 'video' && (
                  <div className="absolute top-8 right-2 flex items-center gap-1 bg-black/50 rounded-full px-2 py-0.5 z-20">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-white text-[8px] font-medium">LIVE</span>
                  </div>
                )}
              </>
            )}

            {/* ── Platform Nav Bottom ── */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-black/60 backdrop-blur-sm flex items-center justify-around px-4 z-30">
              {platform === 'tiktok' ? (
                <>
                  {['🏠', '🔍', '+', '📩', '👤'].map((icon, i) => (
                    <span key={i} className={`text-[14px] ${i === 2 ? 'bg-primary rounded-md px-1' : ''}`}>{icon}</span>
                  ))}
                </>
              ) : (
                <>
                  {['🏠', '🔍', '▶', '❤️', '👤'].map((icon, i) => (
                    <span key={i} className="text-[12px]">{icon}</span>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic island */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-800 rounded-full" style={{ zIndex: 5 }} />
      </div>

      {/* Status */}
      <div className="text-center space-y-0.5">
        {mediaUrl ? (
          <p className="text-[11px] font-semibold text-foreground flex items-center justify-center gap-1.5">
            {mediaType === 'video' ? (
              <><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />Lecture en boucle active</>
            ) : (
              <><span className="w-2 h-2 rounded-full bg-primary inline-block" />Aperçu image</>
            )}
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground">Aucun média sélectionné</p>
        )}
        <p className="text-[10px] text-muted-foreground">
          Format {isTiktok ? 'TikTok' : 'Instagram Reels'}
          {hasAction && <span className="text-primary ml-1.5">· CTA actif</span>}
        </p>
      </div>
    </div>
  );
}
