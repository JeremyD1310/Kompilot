/**
 * CreativeFactoryTab — Image generator + phone preview (Maps, Insta Feed, Stories)
 * Stories (Instagram & Facebook) available for Pro and Agency roles.
 */
import React from 'react';
import { Wand2, RefreshCw, Sparkles, Copy } from 'lucide-react';
import type { Sector, Role, ImageStyle, PreviewPlatform } from '../showcaseData';
import { SECTOR_DATA } from '../showcaseData';
import { MapsScreen, InstagramFeedScreen, InstagramStoryScreen, FacebookStoryScreen } from './PhoneScreens';

interface Props {
  sector: Sector;
  role: Role;
  imagePrompt: string;
  setImagePrompt: (v: string) => void;
  imageStyle: ImageStyle;
  setImageStyle: (v: ImageStyle) => void;
  isGeneratingImage: boolean;
  generatedImageUrl: string;
  imageError: string;
  applyWatermark: boolean;
  setApplyWatermark: (v: boolean) => void;
  customWatermarkText: string;
  setCustomWatermarkText: (v: string) => void;
  generatedPostText: string;
  setGeneratedPostText: (v: string) => void;
  previewPlatform: PreviewPlatform;
  setPreviewPlatform: (v: PreviewPlatform) => void;
  copySuccess: boolean;
  onGenerateImage: (e?: React.FormEvent) => void;
  onCopy: (text: string) => void;
  onSchedule: () => void;
}

const STYLES: { id: ImageStyle; label: string }[] = [
  { id: 'flatlay', label: 'Flatlay minimaliste' },
  { id: 'studio', label: 'Photo de Studio' },
  { id: 'modern', label: 'Lumineux & Moderne' },
  { id: 'vintage', label: 'Vintage texturé' },
];

const PLATFORMS: { id: PreviewPlatform; label: string; emoji: string; story?: boolean }[] = [
  { id: 'maps', label: 'Google Maps', emoji: '📍' },
  { id: 'instagram', label: 'Insta Feed', emoji: '📸' },
  { id: 'instagram-story', label: 'Insta Story', emoji: '🟣', story: true },
  { id: 'facebook-story', label: 'FB Story', emoji: '🔵', story: true },
];

export default function CreativeFactoryTab(props: Props) {
  const {
    sector, role, imagePrompt, setImagePrompt, imageStyle, setImageStyle,
    isGeneratingImage, generatedImageUrl, imageError,
    applyWatermark, setApplyWatermark, customWatermarkText, setCustomWatermarkText,
    generatedPostText, setGeneratedPostText,
    previewPlatform, setPreviewPlatform,
    copySuccess, onGenerateImage, onCopy, onSchedule,
  } = props;

  const sd = SECTOR_DATA[sector];
  const isStory = previewPlatform === 'instagram-story' || previewPlatform === 'facebook-story';

  const screenProps = {
    sector, role, isGenerating: isGeneratingImage,
    url: generatedImageUrl, applyWatermark, watermarkText: customWatermarkText, postText: generatedPostText,
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

      {/* ── Config panel ── */}
      <div className="xl:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-teal-400 animate-pulse" />Générateur d'Images IA
          </h2>
          <p className="text-slate-400 text-xs mt-1">Imagen 4.0 — {sd.name}</p>
        </div>

        {/* Format toggle */}
        <div className="space-y-2">
          <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider">Format :</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button"
              onClick={() => { if (isStory) setPreviewPlatform('instagram'); }}
              className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition ${!isStory ? 'border-teal-500 bg-teal-500/10 text-teal-400' : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'}`}>
              📰 Post classique
            </button>
            <button type="button"
              onClick={() => { if (!isStory) setPreviewPlatform('instagram-story'); }}
              className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition flex flex-col items-center gap-0.5 ${isStory ? 'border-purple-500 bg-purple-500/10 text-purple-400' : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'}`}>
              <span>🎬 Story 9:16</span>
              <span className="text-[8px] bg-purple-500/20 text-purple-400 px-1.5 rounded-full font-bold">Pro & Agence</span>
            </button>
          </div>
        </div>

        <form onSubmit={onGenerateImage} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider">Prompt sémantique :</label>
            <textarea value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} rows={3} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-teal-500" />
          </div>

          <div className="space-y-2">
            <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider">Style visuel :</label>
            <div className="grid grid-cols-2 gap-2">
              {STYLES.map((s) => (
                <button key={s.id} type="button" onClick={() => setImageStyle(s.id)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition ${imageStyle === s.id ? 'border-teal-500 bg-teal-500/10 text-teal-400' : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Story specifics */}
          {isStory && (
            <div className="bg-purple-500/5 p-4 rounded-2xl border border-purple-500/20 space-y-2">
              <p className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Options Story 9:16</p>
              {['Durée : 15 secondes', 'Sticker CTA : Réserver', 'Zone de sécurité auto',
                previewPlatform === 'instagram-story' ? 'Lien Swipe-Up activé' : 'Boost Facebook Ads'
              ].map((opt) => (
                <div key={opt} className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${opt.includes('Swipe') ? 'bg-purple-400' : opt.includes('Boost') ? 'bg-blue-400' : 'bg-teal-400'}`} />{opt}
                </div>
              ))}
            </div>
          )}

          {/* Agency watermark */}
          {role === 'agency' && (
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-teal-400">Marque Blanche</span>
                <input type="checkbox" checked={applyWatermark} onChange={(e) => setApplyWatermark(e.target.checked)} className="h-4 w-4 rounded border-slate-700 text-teal-500 focus:ring-0" />
              </div>
              {applyWatermark && (
                <input type="text" value={customWatermarkText} onChange={(e) => setCustomWatermarkText(e.target.value)} placeholder="Filigrane agence" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white" />
              )}
            </div>
          )}

          <button type="submit" disabled={isGeneratingImage} className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold py-3 rounded-2xl transition flex items-center justify-center gap-2 text-sm disabled:opacity-60">
            {isGeneratingImage ? <><RefreshCw className="h-4 w-4 animate-spin" />Génération...</> : <><Sparkles className="h-4 w-4" />Générer le Visuel & Post IA</>}
          </button>
        </form>
      </div>

      {/* ── Phone preview ── */}
      <div className="xl:col-span-5 flex flex-col items-center space-y-4">
        {/* Platform tabs */}
        <div className="grid grid-cols-4 gap-1.5 w-full max-w-[320px]">
          {PLATFORMS.map((p) => (
            <button key={p.id} onClick={() => setPreviewPlatform(p.id)}
              className={`py-2 px-1 text-[9px] font-extrabold rounded-xl transition relative flex flex-col items-center gap-0.5 border ${
                previewPlatform === p.id
                  ? p.story ? 'bg-purple-500 text-white border-purple-500' : 'bg-teal-500 text-slate-950 border-teal-500'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}>
              <span>{p.emoji}</span>
              <span className="leading-none text-center">{p.label}</span>
              {p.story && previewPlatform !== p.id && (
                <span className="absolute -top-1.5 -right-1 bg-purple-500 text-white text-[7px] px-1 rounded-full font-black">PRO</span>
              )}
            </button>
          ))}
        </div>

        {/* Phone shell */}
        <div className={`relative w-[296px] ${isStory ? 'h-[610px]' : 'h-[590px]'} rounded-[44px] border-[10px] border-slate-900 bg-slate-950 shadow-2xl ring-1 ring-slate-800 flex flex-col overflow-hidden`}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-900 rounded-b-2xl z-40 flex items-center justify-center">
            <div className="h-1.5 w-1.5 rounded-full bg-slate-950 ml-10" />
          </div>
          <div className="flex-1 flex flex-col pt-5 bg-slate-950 text-slate-200 select-none overflow-hidden">
            {previewPlatform === 'maps' && <MapsScreen {...screenProps} />}
            {previewPlatform === 'instagram' && <InstagramFeedScreen {...screenProps} />}
            {previewPlatform === 'instagram-story' && <InstagramStoryScreen {...screenProps} />}
            {previewPlatform === 'facebook-story' && <FacebookStoryScreen {...screenProps} />}
          </div>
        </div>

        {isStory && (
          <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${previewPlatform === 'instagram-story' ? 'bg-purple-400' : 'bg-blue-400'}`} />
            Format 9:16 — 1080×1920px — {previewPlatform === 'instagram-story' ? 'Instagram Story' : 'Facebook Story'}
          </p>
        )}
      </div>

      {/* ── Social Mirror Editor ── */}
      <div className="xl:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
        <div>
          <h3 className="font-bold text-white text-base">📝 Social Mirror Editor</h3>
          <p className="text-slate-400 text-xs mt-1">{isStory ? 'Texte Story (160 car. max conseillés).' : "Ajustez l'accroche ou planifiez."}</p>
        </div>

        <textarea
          value={generatedPostText}
          onChange={(e) => setGeneratedPostText(e.target.value)}
          rows={isStory ? 5 : 8}
          placeholder={isStory ? `Ex: ${sd.hook}\n\n👉 Glissez pour réserver` : ''}
          className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-slate-300 leading-relaxed focus:outline-none focus:border-teal-500"
        />

        {/* Story channel picker */}
        {isStory && (
          <div className="space-y-2">
            <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Réseau Story :</p>
            <div className="flex gap-2">
              <button onClick={() => setPreviewPlatform('instagram-story')}
                className={`flex-1 py-2 rounded-xl border text-[10px] font-bold transition ${previewPlatform === 'instagram-story' ? 'border-purple-500 bg-purple-500/10 text-purple-400' : 'border-slate-800 text-slate-500 hover:border-slate-700'}`}>
                🟣 Instagram
              </button>
              <button onClick={() => setPreviewPlatform('facebook-story')}
                className={`flex-1 py-2 rounded-xl border text-[10px] font-bold transition ${previewPlatform === 'facebook-story' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-slate-800 text-slate-500 hover:border-slate-700'}`}>
                🔵 Facebook
              </button>
            </div>
          </div>
        )}

        {generatedPostText && (
          <div className="space-y-2">
            <button onClick={() => onCopy(generatedPostText)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5">
              <Copy className="h-3.5 w-3.5" />{copySuccess ? 'Copié !' : 'Copier le texte'}
            </button>
            <button onClick={onSchedule}
              className={`w-full font-bold text-xs py-2.5 rounded-xl transition ${isStory ? 'bg-purple-500 hover:bg-purple-400 text-white' : 'bg-teal-500 hover:bg-teal-400 text-slate-950'}`}>
              {isStory
                ? previewPlatform === 'instagram-story' ? '🟣 Publier la Story Instagram' : '🔵 Publier la Story Facebook'
                : 'Planifier sur Maps / Insta'}
            </button>
          </div>
        )}

        {imageError && (
          <p className="text-[9px] text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-lg px-2 py-1.5">{imageError}</p>
        )}
      </div>
    </div>
  );
}
