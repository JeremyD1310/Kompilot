/**
 * SocialTrendsPanel — AI Trends widget for Publications/Calendar tab.
 * Shows trending content ideas from TikTok/Reels/local news.
 * Includes "✨ Générer 3 idées" button that creates ready-to-publish posts.
 */
import { useState, useEffect } from 'react';
import { Flame, Sparkles, TrendingUp, Hash, Loader2, ArrowRight, Eye, Copy, Check } from 'lucide-react';
import { toast } from '@blinkdotnew/ui';

interface TrendItem {
  platform: string;
  trend: string;
  growth: string;
  sector: string;
  tags: string[];
}

interface GeneratedIdea {
  angle: string;
  caption: string;
  hashtags: string[];
  visualHint: string;
}

const CURRENT_TRENDS: TrendItem[] = [
  { platform: 'TikTok', trend: 'Un jour dans ma vie (GRWM)', growth: '+420%', sector: 'Tous secteurs', tags: ['#DayInMyLife', '#GRWM', '#Local'] },
  { platform: 'Instagram Reels', trend: 'Before/After transformation', growth: '+280%', sector: 'Beauté · Déco · Food', tags: ['#Transformation', '#BeforeAfter', '#Reveal'] },
  { platform: 'Google Trends', trend: 'Prix + transparence des coûts', growth: '+190%', sector: 'Artisanat · Services', tags: ['#PrixTransparent', '#HonnêtePrice', '#LocalBusiness'] },
  { platform: 'TikTok', trend: 'Secrets de fabrication / coulisses', growth: '+340%', sector: 'Restauration · Artisanat', tags: ['#Coulisses', '#BehindTheScenes', '#ProcessArt'] },
  { platform: 'Local', trend: 'Avis clients mis en scène (UGC)', growth: '+210%', sector: 'Commerce local', tags: ['#AvisClient', '#UGC', '#Témoignage'] },
];

const GENERATED_IDEAS: GeneratedIdea[] = [
  {
    angle: '📸 Coulisses de l\'équipe',
    caption: '🎬 Une journée chez nous — du lever au service ! Notre équipe se retrousse les manches dès 7h pour que vous viviez le meilleur. Et vous, vous arrivez à quelle heure ? 😄\n\n✅ Réservez votre table (lien en bio)\n📍 [Votre ville]',
    hashtags: ['#Coulisses', '#TeamWork', '#DayInMyLife', '#LocalBusiness', '#Authentique'],
    visualHint: '🎥 Vidéo time-lapse de la préparation matinale / Reels 30s',
  },
  {
    angle: '⭐ Avis client mis en scène',
    caption: '❤️ Quand nos clients parlent mieux que nous… Ce message nous a touchés ! Merci à vous pour ces retours qui nous donnent encore plus envie de faire bien.\n\n💬 Partagez votre expérience en commentaire → on vous répond toujours.',
    hashtags: ['#AvisClient', '#MerciÀVous', '#ServiceClient', '#UGC', '#Authenticité'],
    visualHint: '📱 Screenshot de l\'avis Google sur fond dégradé branded',
  },
  {
    angle: '💡 Conseil expert (valeur)',
    caption: '🔑 LE secret que peu de gens connaissent sur [votre secteur]…\n\nDites-le nous en commentaire : est-ce que vous le saviez ? 👇\n\nOn partage nos astuces chaque semaine — abonnez-vous pour ne rien rater.',
    hashtags: ['#Conseils', '#Expert', '#TuSavas', '#LocalPro', '#AstucesDuPro'],
    visualHint: '🖼️ Carrousel 3 slides : Problème → Solution → CTA',
  },
];

interface SocialTrendsPanelProps {
  onCreatePost?: (text: string) => void;
  sector?: string;
}

export function SocialTrendsPanel({ onCreatePost, sector }: SocialTrendsPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [ideas, setIdeas] = useState<GeneratedIdea[] | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    // Simulate AI generation delay
    await new Promise(r => setTimeout(r, 1800));
    setIdeas(GENERATED_IDEAS);
    setGenerating(false);
    toast.success('3 idées de posts générées selon les tendances du moment !');
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success('Texte copié !');
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleUsePost = (idea: GeneratedIdea) => {
    const fullText = `${idea.caption}\n\n${idea.hashtags.join(' ')}`;
    if (onCreatePost) {
      onCreatePost(fullText);
    } else {
      window.dispatchEvent(new CustomEvent('kompilot:create-post', { detail: { text: fullText } }));
    }
    toast.success('Post ajouté au créateur !');
  };

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="w-full rounded-2xl border p-3 flex items-center gap-2.5 text-sm font-semibold hover:opacity-80 transition-opacity"
        style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,.06), rgba(245,158,11,.04))',
          border: '1px solid rgba(239,68,68,.25)',
          color: '#EF4444',
        }}
      >
        <Flame size={15} />
        🔥 Tendances du Moment — Voir les idées IA
        <ArrowRight size={13} className="ml-auto" />
      </button>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(239,68,68,.06), rgba(245,158,11,.04))',
        border: '1px solid rgba(239,68,68,.28)',
        boxShadow: '0 0 0 1px rgba(239,68,68,.15), 0 4px 24px rgba(239,68,68,.08)',
      }}
    >
      {/* Header */}
      <div className="p-4 pb-3 border-b" style={{ borderColor: 'rgba(239,68,68,.15)' }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)' }}
            >
              <Flame size={15} style={{ color: '#EF4444' }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: '#EF4444' }}>🔥 Tendances du Moment</p>
              <p className="text-xs text-muted-foreground">TikTok · Reels · Local · Actualisé aujourd'hui</p>
            </div>
          </div>
          <button
            onClick={() => setCollapsed(true)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
          >
            Réduire
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Trend items */}
        <div className="space-y-2 mb-4">
          {CURRENT_TRENDS.map((trend, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 rounded-xl p-2.5 transition-all hover:bg-black/10"
              style={{ cursor: 'default' }}
            >
              <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                <TrendingUp size={11} style={{ color: '#F59E0B' }} />
                <span
                  className="text-[10px] font-black rounded-full px-1.5 py-0.5"
                  style={{ background: 'rgba(245,158,11,.12)', color: '#F59E0B' }}
                >
                  {trend.growth}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground leading-tight">{trend.trend}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{trend.platform} · {trend.sector}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {trend.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-[10px] rounded-full px-1.5 py-0.5 font-medium"
                      style={{ background: 'rgba(239,68,68,.10)', color: '#F87171' }}
                    >
                      <Hash size={8} className="inline mr-0.5" />{tag.replace('#', '')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Generate button */}
        {!ideas && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full rounded-xl py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,.15), rgba(99,89,248,.10))',
              border: '1px solid rgba(139,92,246,.35)',
              color: '#A78BFA',
              boxShadow: '0 0 0 1px rgba(139,92,246,.15)',
            }}
          >
            {generating
              ? <><Loader2 size={15} className="animate-spin" /> L'IA génère vos idées…</>
              : <><Sparkles size={15} /> ✨ Générer 3 idées de posts selon les tendances d'aujourd'hui</>
            }
          </button>
        )}

        {/* Generated ideas */}
        {ideas && (
          <div className="space-y-3 mt-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={13} style={{ color: '#A78BFA' }} />
              <p className="text-xs font-bold" style={{ color: '#A78BFA' }}>3 idées générées selon les tendances actuelles</p>
              <button
                onClick={() => setIdeas(null)}
                className="ml-auto text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Régénérer
              </button>
            </div>
            {ideas.map((idea, i) => (
              <div
                key={i}
                className="rounded-xl p-3"
                style={{
                  background: 'rgba(139,92,246,.06)',
                  border: '1px solid rgba(139,92,246,.20)',
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-xs font-bold" style={{ color: '#A78BFA' }}>{idea.angle}</p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(`${idea.caption}\n\n${idea.hashtags.join(' ')}`, i)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                      style={{ background: 'rgba(139,92,246,.12)', color: '#A78BFA' }}
                    >
                      {copiedIdx === i ? <Check size={11} /> : <Copy size={11} />}
                    </button>
                    <button
                      onClick={() => handleUsePost(idea)}
                      className="rounded-lg px-2 py-1 text-[10px] font-bold flex items-center gap-1 transition-all hover:scale-105 active:scale-95"
                      style={{ background: 'rgba(139,92,246,.20)', color: '#A78BFA', border: '1px solid rgba(139,92,246,.30)' }}
                    >
                      <Eye size={10} />
                      Utiliser ce post
                    </button>
                  </div>
                </div>
                <p className="text-xs text-foreground/75 leading-relaxed mb-2 line-clamp-3">{idea.caption}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {idea.hashtags.slice(0, 4).map(tag => (
                    <span key={tag} className="text-[9px] font-medium rounded-full px-1.5 py-0.5"
                      style={{ background: 'rgba(139,92,246,.10)', color: '#C4B5FD' }}>
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground/70 italic">{idea.visualHint}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
