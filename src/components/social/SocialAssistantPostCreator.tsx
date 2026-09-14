/**
 * SocialAssistantPostCreator — AI-powered social media post composer.
 *
 * Features:
 * - Write a raw message, select target platforms
 * - AI adapts the copy per platform (tone, length, hashtags, mentions)
 * - Live character counter with per-platform limits
 * - Hashtag suggestions
 * - Virtual phone preview for each platform (light/dark mode)
 */

import { useState, useMemo, useCallback } from 'react';
import {
  Send, RefreshCw, Copy, Check, Smartphone, Monitor,
  Sun, Moon, Hash, AlertTriangle, Sparkles, Image,
  Play, ChevronLeft, ChevronRight, X,
} from 'lucide-react';
import { Button, Badge, Textarea, toast } from '@blinkdotnew/ui';
import { blink } from '@/blink/client';

// ── Platform config ───────────────────────────────────────────────────

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', color: '#E4405F', icon: '📸', maxChars: 2200, maxHashtags: 30, previewWidth: 390 },
  { id: 'facebook', label: 'Facebook', color: '#1877F2', icon: '📘', maxChars: 63206, maxHashtags: 5, previewWidth: 500 },
  { id: 'linkedin', label: 'LinkedIn', color: '#0A66C2', icon: '💼', maxChars: 3000, maxHashtags: 5, previewWidth: 552 },
  { id: 'tiktok', label: 'TikTok', color: '#69C9D0', icon: '🎵', maxChars: 4000, maxHashtags: 5, previewWidth: 390 },
  { id: 'twitter', label: 'X / Twitter', color: '#1DA1F2', icon: '🐦', maxChars: 280, maxHashtags: 3, previewWidth: 600 },
];

type Platform = typeof PLATFORMS[number];

const PLATFORM_ICONS: Record<string, string> = {
  instagram: '📸', facebook: '📘', linkedin: '💼', tiktok: '🎵', twitter: '🐦',
};

// ── AI adaptation system prompt per platform ──────────────────────────

const PLATFORM_PROMPTS: Record<string, string> = {
  instagram: `Tu es un expert en copywriting Instagram. Rewrite le message en français :
- Ton accrocheur, conversationnel, rythmé
- Utilise des émojis pertinents (max 3-4)
- Optimise les sauts de ligne pour la lisibilité
- Suggère 5-8 hashtags stratégiques à la fin (précédés de "---" sur sa propre ligne)
- Garde le message sous 2200 caractères
- Ajoute un call-to-action engageant`,
  facebook: `Tu es un expert en copywriting Facebook. Rewrite le message en français :
- Ton chaleureux et communautaire
- Texte structuré avec un paragraphe d'accroche
- Ajoute 2-3 émojis clés
- Suggère 3-5 hashtags pertinents à la fin (précédés de "---" sur sa propre ligne)
- Garde le message concis (150-500 caractères idéal)`,
  linkedin: `Tu es un expert en copywriting LinkedIn. Rewrite le message en français :
- Ton professionnel, structuré, inspirant
- Accroche forte en première ligne (hook)
- Utilise des sauts de ligne pour aérer
- Ajoute 3-5 hashtags professionnels à la fin (précédés de "---" sur sa propre ligne)
- Termine par une question ouverte pour l'engagement
- Pas d'émojis excessifs (1-2 max)`,
  tiktok: `Tu es un expert en copywriting TikTok. Rewrite le message en français :
- Ton ultra-court, punchy, viral
- Maximum 150 caractères dans la description
- Utilise 1-2 émojis maximum
- Suggère 3-5 hashtags tendance à la fin (précédés de "---" sur sa propre ligne)
- Ajoute un call-to-action type "Like si...", "Partage à...", "Follow pour..."`,
  twitter: `Tu es un expert en copywriting Twitter/X. Rewrite le message en français :
- Ton concis, percutant, informatif
- Maximum 280 caractères (strict)
- 1-2 hashtags maximum
- Pas d'émojis excessifs (1 max)
- Optimise pour le partage et la citation`,
};

// ── Phone preview component ───────────────────────────────────────────

function PhonePreview({
  text, platform, darkMode, onToggleDark,
}: {
  text: string; platform: Platform; darkMode: boolean; onToggleDark: () => void;
}) {
  const isDesktop = platform.id === 'linkedin';
  const w = isDesktop ? 680 : 340;

  const lines = text.split('\n');
  const displayText = lines[0]?.length > 0 ? text : 'Votre message apparaîtra ici...';
  const truncated = displayText.length > 180
    ? displayText.slice(0, 180) + '…'
    : displayText;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleDark}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors ${
            darkMode
              ? 'bg-slate-800 text-slate-200 border-slate-600'
              : 'bg-white text-slate-600 border-slate-200'
          }`}
        >
          {darkMode ? <Moon size={12} /> : <Sun size={12} />}
          {darkMode ? 'Sombre' : 'Clair'}
        </button>
        <span className="text-[10px] text-muted-foreground">
          {isDesktop ? 'Desktop' : 'Mobile'}
        </span>
      </div>

      {/* Phone shell or Desktop card */}
      <div
        className={`rounded-3xl border overflow-hidden transition-colors ${
          darkMode ? 'bg-[#1a1a2e] border-slate-700' : 'bg-white border-slate-200'
        } shadow-xl`}
        style={{ width: isDesktop ? 680 : 340 }}
      >
        {/* Status bar (mobile only) */}
        {!isDesktop && (
          <div className={`flex items-center justify-between px-5 py-2 text-[10px] font-semibold ${
            darkMode ? 'text-slate-300' : 'text-slate-700'
          }`}>
            <span>9:41</span>
            <span className="flex items-center gap-1">📶 🔋</span>
          </div>
        )}

        {/* Platform header */}
        <div className={`flex items-center gap-2 px-4 py-2.5 border-b ${
          darkMode ? 'border-slate-700' : 'border-slate-100'
        }`}>
          <span className="text-sm">{PLATFORM_ICONS[platform.id]}</span>
          <span className={`text-xs font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            {platform.label}
          </span>
          {isDesktop && (
            <span className={`ml-auto text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Accueil · Réseau · Messagerie
            </span>
          )}
        </div>

        {/* Post content */}
        <div className="p-4">
          {/* Image placeholder */}
          <div className={`w-full h-40 rounded-xl mb-3 flex items-center justify-center border border-dashed ${
            darkMode ? 'bg-slate-800/50 border-slate-600 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <div className="flex flex-col items-center gap-1">
              <Image size={22} />
              <span className="text-[10px]">Image</span>
            </div>
          </div>

          {/* Text */}
          <p className={`text-[13px] leading-relaxed whitespace-pre-line ${
            darkMode ? 'text-slate-200' : 'text-slate-800'
          }`}>
            {truncated}
          </p>

          {/* Interaction bar */}
          <div className={`flex items-center gap-5 mt-3 pt-3 border-t ${
            darkMode ? 'border-slate-700 text-slate-500' : 'border-slate-100 text-slate-400'
          }`}>
            <span className="text-[11px]">❤️ 0</span>
            <span className="text-[11px]">💬 0</span>
            <span className="text-[11px]">🔄 0</span>
            <span className="text-[11px] ml-auto">📤</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Character counter ─────────────────────────────────────────────────

function CharCounter({ current, max }: { current: number; max: number }) {
  const pct = Math.min(100, (current / max) * 100);
  const isOver = current > max;
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isOver ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-primary'}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <span className={`text-[10px] font-mono font-semibold ${isOver ? 'text-red-500' : 'text-muted-foreground'}`}>
        {current}/{max}
      </span>
      {isOver && <AlertTriangle size={12} className="text-red-500" />}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────

export function SocialAssistantPostCreator() {
  const [rawMessage, setRawMessage] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set(['instagram', 'linkedin']));
  const [variants, setVariants] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [activePreviewPlatform, setActivePreviewPlatform] = useState<string>('instagram');

  const togglePlatform = useCallback((id: string) => {
    setSelectedPlatforms(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const generateVariants = useCallback(async () => {
    if (!rawMessage.trim()) {
      toast.error('Écrivez un message avant de générer des variantes.');
      return;
    }
    if (selectedPlatforms.size === 0) {
      toast.error('Sélectionnez au moins une plateforme.');
      return;
    }
    setIsGenerating(true);
    const newVariants: Record<string, string> = {};

    try {
      for (const platformId of selectedPlatforms) {
        const prompt = PLATFORM_PROMPTS[platformId];
        if (!prompt) continue;
        const { text } = await blink.ai.generateText({
          model: 'gpt-4.1-mini',
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: rawMessage },
          ],
          maxTokens: 600,
        });
        newVariants[platformId] = text.trim();
      }
      setVariants(prev => ({ ...prev, ...newVariants }));
      toast.success('Variantes générées avec succès.');
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la génération.');
    } finally {
      setIsGenerating(false);
    }
  }, [rawMessage, selectedPlatforms]);

  const copyVariant = useCallback(async (platformId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(platformId);
      toast.success('Copié dans le presse-papiers.');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Impossible de copier.');
    }
  }, []);

  // Compute char counts and hashtag suggestions
  const variantData = useMemo(() => {
    const data: Record<string, { text: string; charCount: number; hashtags: string[]; body: string; isOver: boolean; maxChars: number }> = {};
    const platform = PLATFORMS.find(p => p.id === activePreviewPlatform);

    for (const [platformId, text] of Object.entries(variants)) {
      const p = PLATFORMS.find(pl => pl.id === platformId);
      const maxChars = p?.maxChars ?? 5000;
      const parts = text.split('---');
      const body = parts[0]?.trim() ?? text;
      const hashtagLine = parts.length > 1 ? parts.slice(1).join(' ').trim() : '';
      const hashtags = hashtagLine.match(/#[\wÀ-ÿ]+/g) ?? [];

      data[platformId] = {
        text, body, hashtags,
        charCount: text.length,
        isOver: text.length > maxChars,
        maxChars,
      };
    }
    return data;
  }, [variants, activePreviewPlatform]);

  const selectedList = PLATFORMS.filter(p => selectedPlatforms.has(p.id));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left panel — composer */}
      <div className="lg:col-span-2 space-y-4">
        {/* Raw message input */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
            Message brut
          </label>
          <Textarea
            value={rawMessage}
            onChange={e => setRawMessage(e.target.value)}
            placeholder="Écrivez votre message ici. L'IA l'adaptera pour chaque plateforme sélectionnée..."
            className="min-h-[120px] text-sm"
          />
          <div className="flex justify-between items-center mt-1.5">
            <span className="text-[10px] text-muted-foreground">
              {rawMessage.length} caractères
            </span>
          </div>
        </div>

        {/* Platform selector */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
            Plateformes cibles
          </label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => {
              const selected = selectedPlatforms.has(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => togglePlatform(p.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    selected
                      ? 'text-white border-transparent shadow-sm'
                      : 'text-muted-foreground border-border hover:border-primary/40'
                  }`}
                  style={selected ? { backgroundColor: p.color, borderColor: p.color } : undefined}
                >
                  <span>{p.icon}</span> {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Generate button */}
        <Button
          onClick={generateVariants}
          disabled={isGenerating || !rawMessage.trim()}
          className="w-full gap-2"
        >
          {isGenerating ? (
            <RefreshCw size={15} className="animate-spin" />
          ) : (
            <Sparkles size={15} />
          )}
          {isGenerating ? 'Génération en cours...' : 'Générer les variantes'}
        </Button>

        {/* Variants list */}
        {selectedList.length > 0 && Object.keys(variants).length > 0 && (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Variantes générées
            </label>
            {selectedList.map(p => {
              const v = variants[p.id];
              if (!v) return null;
              const d = variantData[p.id];
              return (
                <div key={p.id} className="rounded-xl border bg-card p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{p.icon}</span>
                      <span className="text-xs font-bold" style={{ color: p.color }}>{p.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {d && <CharCounter current={d.charCount} max={d.maxChars} />}
                      <button
                        onClick={() => copyVariant(p.id, v)}
                        className="p-1 rounded-md hover:bg-muted transition-colors"
                        title="Copier"
                      >
                        {copiedId === p.id ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} className="text-muted-foreground" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-4">
                    {d?.body ?? v}
                  </p>
                  {d?.hashtags && d.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {d.hashtags.map((h, i) => (
                        <span key={i} className="text-[10px] text-primary font-medium bg-primary/5 px-1.5 py-0.5 rounded">
                          {h}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right panel — phone previews */}
      <div className="lg:col-span-3">
        <div className="sticky top-20 space-y-4">
          {/* Platform tabs for preview */}
          <div className="flex items-center gap-1 p-1 bg-muted rounded-xl">
            {selectedList.map(p => (
              <button
                key={p.id}
                onClick={() => setActivePreviewPlatform(p.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-1 justify-center ${
                  activePreviewPlatform === p.id
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{p.icon}</span> {p.label}
              </button>
            ))}
          </div>

          {/* Preview */}
          {(() => {
            const platform = PLATFORMS.find(p => p.id === activePreviewPlatform);
            if (!platform) return null;
            const variantText = variants[activePreviewPlatform] ?? rawMessage;
            return (
              <div className="flex justify-center">
                <PhonePreview
                  text={variantText}
                  platform={platform}
                  darkMode={darkMode}
                  onToggleDark={() => setDarkMode(d => !d)}
                />
              </div>
            );
          })()}

          {/* Tip */}
          <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <strong className="text-primary">💡 Astuce :</strong> L'IA analyse votre message et l'adapte automatiquement au ton et au format de chaque réseau. Les hashtags sont générés automatiquement. Vous pouvez copier chaque variante en un clic.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
