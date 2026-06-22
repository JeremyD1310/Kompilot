/**
 * PhoneScreens — individual platform preview renderers for the CreativeFactory phone mockup.
 * Each screen is a pure presentational component with no state.
 */
import React from 'react';
import { MapPin, Heart, MessageSquare, Share2, Bookmark, Image, MoreHorizontal, RefreshCw, ChevronRight } from 'lucide-react';
import type { Role } from '../showcaseData';
import { SECTOR_DATA, type Sector } from '../showcaseData';

export interface ScreenProps {
  sector: Sector;
  role: Role;
  isGenerating: boolean;
  url: string;
  applyWatermark: boolean;
  watermarkText: string;
  postText: string;
}

// ── Shared image display ──────────────────────────────────────────────────────
export function MediaDisplay({ isGenerating, url, role, applyWatermark, watermarkText, className = '' }: {
  isGenerating: boolean; url: string; role: Role;
  applyWatermark: boolean; watermarkText: string; className?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-slate-900 ${className}`}>
      {isGenerating ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80">
          <RefreshCw className="h-6 w-6 text-teal-400 animate-spin" />
        </div>
      ) : url ? (
        <>
          <img src={url} className="w-full h-full object-cover" alt="preview" />
          {applyWatermark && role === 'agency' && (
            <div className="absolute bottom-2 right-2 bg-slate-950/80 border border-slate-800 text-[6px] font-extrabold px-1.5 py-0.5 rounded text-teal-400">
              {watermarkText}
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Image className="h-6 w-6 text-slate-700" />
        </div>
      )}
    </div>
  );
}

// ── Google Maps ───────────────────────────────────────────────────────────────
export function MapsScreen({ sector, isGenerating, url, role, applyWatermark, watermarkText, postText }: ScreenProps) {
  const sd = SECTOR_DATA[sector];
  return (
    <div className="p-3 space-y-3 flex-1 flex flex-col">
      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-900">
        <div className="h-8 w-8 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-[10px] font-extrabold text-teal-400">NC</div>
        <div className="overflow-hidden">
          <h4 className="text-[11px] font-bold text-white truncate">{sd.name}</h4>
          <p className="text-[9px] text-slate-500 truncate flex items-center gap-1"><MapPin className="h-2.5 w-2.5 text-teal-400" />{sd.location}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-[8px] bg-teal-500/10 border border-teal-500/20 text-teal-400 p-1.5 rounded-lg font-bold">
        <span>✨ Post optimisé G.E.O. par l'IA</span><span>Canal Maps actif</span>
      </div>
      <MediaDisplay isGenerating={isGenerating} url={url} role={role} applyWatermark={applyWatermark} watermarkText={watermarkText} className="aspect-square rounded-xl border border-slate-800" />
      <div className="flex-1">
        <p className="text-[10px] leading-relaxed text-slate-300 font-medium">{postText || 'En attente de génération...'}</p>
      </div>
      <div className="pt-2 border-t border-slate-900">
        <button className="w-full bg-teal-500 text-slate-950 font-bold text-[10px] py-2 rounded-xl">📅 Réserver (Bouclier Stripe Actif)</button>
      </div>
    </div>
  );
}

// ── Instagram Feed ────────────────────────────────────────────────────────────
export function InstagramFeedScreen({ sector, isGenerating, url, role, applyWatermark, watermarkText, postText }: ScreenProps) {
  const sd = SECTOR_DATA[sector];
  return (
    <div className="flex-1 flex flex-col">
      <div className="p-3 border-b border-slate-900 flex items-center justify-between">
        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Publications</span>
        <div className="h-1.5 w-1.5 rounded-full bg-teal-500" />
      </div>
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-yellow-500 to-purple-600 p-0.5">
            <div className="h-full w-full rounded-full bg-slate-950 flex items-center justify-center text-[8px] font-extrabold text-white">NC</div>
          </div>
          <div><p className="text-[10px] font-bold text-white truncate">{sd.cardTitle}</p><p className="text-[8px] text-slate-500 truncate">{sd.location}</p></div>
        </div>
        <MoreHorizontal className="h-4 w-4 text-white" />
      </div>
      <MediaDisplay isGenerating={isGenerating} url={url} role={role} applyWatermark={applyWatermark} watermarkText={watermarkText} className="aspect-square border-y border-slate-900" />
      <div className="p-3 space-y-2">
        <div className="flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <Heart className="h-4 w-4 text-red-500 fill-red-500" />
            <MessageSquare className="h-4 w-4 text-slate-300" />
            <Share2 className="h-4 w-4 text-slate-300" />
          </div>
          <Bookmark className="h-4 w-4 text-slate-300" />
        </div>
        <p className="text-[8px] font-bold text-white">Aimé par kompilot_bot et 142 autres</p>
        <p className="text-[9px] leading-relaxed text-slate-300">
          <span className="font-bold text-white mr-1">{sd.cardTitle.replace(/\s+/g, '').toLowerCase()}</span>
          {postText || "En attente d'écriture..."}
        </p>
        <p className="text-[7px] text-slate-600 font-semibold uppercase">Il y a 2 min • Sponsorisé</p>
      </div>
    </div>
  );
}

// ── Instagram Story ───────────────────────────────────────────────────────────
export function InstagramStoryScreen({ sector, isGenerating, url, role, applyWatermark, watermarkText, postText }: ScreenProps) {
  const sd = SECTOR_DATA[sector];
  return (
    <div className="flex-1 flex flex-col relative">
      <MediaDisplay isGenerating={isGenerating} url={url} role={role} applyWatermark={false} watermarkText={watermarkText} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-transparent to-slate-950/80 z-10" />
      {/* Progress bars */}
      <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/20">
            <div className={`h-full bg-white ${i === 0 ? 'w-full' : i === 1 ? 'w-2/3' : 'w-0'}`} />
          </div>
        ))}
      </div>
      {/* Top bar */}
      <div className="absolute top-5 left-2 right-2 z-20 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-yellow-500 to-purple-600 p-0.5 ring-1 ring-white/20">
            <div className="h-full w-full rounded-full bg-slate-950 flex items-center justify-center text-[7px] font-extrabold text-white">NC</div>
          </div>
          <div>
            <p className="text-[9px] font-bold text-white leading-none">{sd.cardTitle}</p>
            <p className="text-[7px] text-white/60">Il y a 2 min</p>
          </div>
        </div>
        <MoreHorizontal className="h-3.5 w-3.5 text-white/80" />
      </div>
      {/* Badge */}
      <div className="absolute top-14 left-2 z-30">
        <span className="bg-gradient-to-r from-purple-600 to-pink-500 text-white text-[7px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-widest">Instagram Story</span>
      </div>
      {applyWatermark && role === 'agency' && (
        <div className="absolute top-14 right-2 z-30 bg-slate-950/80 border border-slate-800 text-[6px] font-extrabold px-1.5 py-0.5 rounded text-teal-400">{watermarkText}</div>
      )}
      {/* Text sticker + reactions */}
      <div className="absolute inset-x-4 bottom-20 z-20 flex flex-col items-center gap-2">
        <div className="bg-slate-950/70 backdrop-blur-sm border border-white/10 rounded-2xl px-3 py-2 text-center max-w-[200px]">
          <p className="text-[9px] font-bold text-white leading-relaxed line-clamp-3">{postText || sd.hook}</p>
        </div>
        <div className="flex gap-2">
          {['❤️','🔥','👏','😍'].map((e) => (
            <div key={e} className="h-7 w-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-sm">{e}</div>
          ))}
        </div>
      </div>
      {/* CTA */}
      <div className="absolute bottom-3 inset-x-3 z-20">
        <div className="bg-teal-500/90 backdrop-blur-sm rounded-2xl py-2 px-3 flex items-center justify-between">
          <span className="text-[9px] font-extrabold text-slate-950">📅 Réserver maintenant</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-950" />
        </div>
      </div>
    </div>
  );
}

// ── Facebook Story ────────────────────────────────────────────────────────────
export function FacebookStoryScreen({ sector, isGenerating, url, role, applyWatermark, watermarkText, postText }: ScreenProps) {
  const sd = SECTOR_DATA[sector];
  return (
    <div className="flex-1 flex flex-col relative">
      <MediaDisplay isGenerating={isGenerating} url={url} role={role} applyWatermark={false} watermarkText={watermarkText} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-transparent to-slate-950/90 z-10" />
      {/* Progress bar */}
      <div className="absolute top-2 left-2 right-2 z-20">
        <div className="h-0.5 rounded-full bg-white/20 overflow-hidden">
          <div className="h-full w-3/5 bg-white" />
        </div>
      </div>
      {/* Top bar */}
      <div className="absolute top-5 left-2 right-2 z-20 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-[7px] font-extrabold text-white ring-1 ring-blue-400/40">NC</div>
          <div>
            <p className="text-[9px] font-bold text-white leading-none">{sd.name.replace(/^[^\s]+\s/, '')}</p>
            <p className="text-[7px] text-white/50 flex items-center gap-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />Sponsorisé
            </p>
          </div>
        </div>
        <MoreHorizontal className="h-3.5 w-3.5 text-white/80" />
      </div>
      {/* Badge */}
      <div className="absolute top-14 left-2 z-30">
        <span className="bg-blue-600 text-white text-[7px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-widest">Facebook Story</span>
      </div>
      {applyWatermark && role === 'agency' && (
        <div className="absolute top-14 right-2 z-30 bg-slate-950/80 border border-slate-800 text-[6px] font-extrabold px-1.5 py-0.5 rounded text-teal-400">{watermarkText}</div>
      )}
      {/* Central text + poll */}
      <div className="absolute inset-x-3 bottom-24 z-20 flex flex-col items-center gap-3">
        <div className="bg-blue-600/80 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
          <p className="text-[10px] font-extrabold text-white leading-snug line-clamp-3">{postText || sd.hook}</p>
        </div>
        <div className="flex gap-2 w-full">
          <div className="flex-1 bg-white/10 border border-white/20 rounded-xl py-1.5 text-center text-[8px] font-bold text-white">👍 J'aime</div>
          <div className="flex-1 bg-blue-500/30 border border-blue-400/30 rounded-xl py-1.5 text-center text-[8px] font-bold text-blue-300">🔔 M'alerter</div>
        </div>
      </div>
      {/* CTA */}
      <div className="absolute bottom-3 inset-x-3 z-20">
        <div className="bg-blue-600/90 backdrop-blur-sm rounded-2xl py-2 px-3 flex items-center justify-between">
          <span className="text-[9px] font-extrabold text-white">En savoir plus</span>
          <ChevronRight className="h-3.5 w-3.5 text-white" />
        </div>
      </div>
    </div>
  );
}
