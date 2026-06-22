/**
 * TypographyStudioPanel — MODULE 2
 * Real-time typography editor with Bold/Italic/Underline/Font controls
 * + social mirror (phone mockup) that updates live as the user types/formats.
 */
import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Bold, Italic, Underline, Type, Smartphone,
  RefreshCw, Copy, Check, Hash,
} from 'lucide-react';
import { Button, toast } from '@blinkdotnew/ui';

// ── Types ──────────────────────────────────────────────────────────────────────

type FontFamily = 'modern' | 'elegant' | 'tech';

interface FontDef {
  id: FontFamily;
  label: string;
  cssFamily: string;
  preview: string;
}

const FONTS: FontDef[] = [
  {
    id: 'modern',
    label: 'Modern Sans',
    cssFamily: "'Inter', 'Geist Sans', system-ui, sans-serif",
    preview: 'Aa',
  },
  {
    id: 'elegant',
    label: 'Elegant Serif',
    cssFamily: "'Georgia', 'Times New Roman', serif",
    preview: 'Aa',
  },
  {
    id: 'tech',
    label: 'Tech Mono',
    cssFamily: "'JetBrains Mono', 'Courier New', monospace",
    preview: 'Aa',
  },
];

// ── Platform preview tabs ──────────────────────────────────────────────────────

type Platform = 'instagram' | 'story' | 'facebook';

const PLATFORMS: { id: Platform; label: string; emoji: string; ratio: string }[] = [
  { id: 'instagram', label: 'Instagram', emoji: '📸', ratio: '1:1' },
  { id: 'story', label: 'Story 9:16', emoji: '📱', ratio: '9:16' },
  { id: 'facebook', label: 'Facebook', emoji: '💙', ratio: '4:3' },
];

// ── Phone mockup ──────────────────────────────────────────────────────────────

function PhoneMirror({
  text,
  bold,
  italic,
  underline,
  font,
  platform,
}: {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  font: FontFamily;
  platform: Platform;
}) {
  const fontDef = FONTS.find(f => f.id === font)!;
  const isStory = platform === 'story';

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Phone frame */}
      <div
        className="relative bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden"
        style={{
          width: isStory ? 160 : 200,
          height: isStory ? 284 : 200,
          border: '6px solid #1E293B',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.1)',
        }}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-5 bg-slate-900 rounded-b-2xl z-10" />

        {/* Screen content */}
        <div
          className="absolute inset-0 flex items-center justify-center p-4"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          {/* Post card */}
          <div className="w-full bg-white/95 rounded-2xl p-3 shadow-lg">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-emerald-600 shrink-0" />
              <div>
                <p className="text-[9px] font-bold text-slate-800 leading-none">Mon Commerce</p>
                <p className="text-[7px] text-slate-500 leading-none mt-0.5">@moncommerce</p>
              </div>
            </div>

            {/* Text content */}
            <p
              className="text-[10px] leading-relaxed text-slate-800 break-words"
              style={{
                fontFamily: fontDef.cssFamily,
                fontWeight: bold ? 700 : 400,
                fontStyle: italic ? 'italic' : 'normal',
                textDecoration: underline ? 'underline' : 'none',
                minHeight: '3em',
              }}
            >
              {text || 'Votre texte apparaît ici...'}
            </p>

            {/* Hashtags */}
            <div className="flex flex-wrap gap-1 mt-2">
              {['#kompilot', '#local', '#business'].map(h => (
                <span key={h} className="text-[8px] text-blue-600 font-medium">{h}</span>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-2 border-t border-slate-100 pt-2">
              <span className="text-[8px] text-slate-500">❤️ 42</span>
              <span className="text-[8px] text-slate-500">💬 7</span>
              <span className="text-[8px] text-slate-500">↗️ Partager</span>
            </div>
          </div>
        </div>
      </div>

      {/* Platform badge */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Smartphone size={12} />
        <span className="font-medium">{PLATFORMS.find(p => p.id === platform)?.label}</span>
      </div>
    </div>
  );
}

// ── Format button ─────────────────────────────────────────────────────────────

function FormatBtn({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  initialText?: string;
  onApply?: (text: string, formatting: { bold: boolean; italic: boolean; underline: boolean; font: FontFamily }) => void;
}

export function TypographyStudioPanel({ initialText = '', onApply }: Props) {
  const [text, setText] = useState(initialText || 'Découvrez notre nouvelle offre spéciale ! 🎉 Venez nous rendre visite et profitez de -20% sur toute la gamme.');
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [font, setFont] = useState<FontFamily>('modern');
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [copied, setCopied] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const fontDef = FONTS.find(f => f.id === font)!;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Texte copié !');
    } catch {
      toast.error('Impossible de copier');
    }
  }, [text]);

  const handleReset = () => {
    setBold(false);
    setItalic(false);
    setUnderline(false);
    setFont('modern');
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-gradient-to-r from-violet-50/60 to-transparent dark:from-violet-950/10">
        <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
          <Type size={16} className="text-violet-600 dark:text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-foreground">Studio Typographie</p>
          <p className="text-xs text-muted-foreground">Formatez votre texte et visualisez en temps réel</p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw size={12} /> Reset
        </button>
      </div>

      <div className="p-5 flex flex-col lg:flex-row gap-6">
        {/* Left: editor */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Formatting toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border">
              <FormatBtn active={bold} onClick={() => setBold(b => !b)} title="Gras (Bold)">
                <Bold size={14} />
              </FormatBtn>
              <FormatBtn active={italic} onClick={() => setItalic(i => !i)} title="Italique">
                <Italic size={14} />
              </FormatBtn>
              <FormatBtn active={underline} onClick={() => setUnderline(u => !u)} title="Souligné">
                <Underline size={14} />
              </FormatBtn>
            </div>

            {/* Font selector */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border">
              {FONTS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFont(f.id)}
                  title={f.label}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    font === f.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                  style={{ fontFamily: f.cssFamily }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Text editor */}
          <div className="relative">
            <textarea
              ref={textRef}
              value={text}
              onChange={e => setText(e.target.value)}
              rows={6}
              placeholder="Saisissez le contenu de votre post..."
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              style={{
                fontFamily: fontDef.cssFamily,
                fontWeight: bold ? 700 : 400,
                fontStyle: italic ? 'italic' : 'normal',
                textDecoration: underline ? 'underline' : 'none',
              }}
            />
            <div className="absolute bottom-2 right-3 text-[11px] text-muted-foreground">
              {text.length} / 2200
            </div>
          </div>

          {/* Hashtag suggestions */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Hash size={12} className="text-muted-foreground shrink-0" />
            {['#local', '#business', '#kompilot', '#promo', '#nouveaute'].map(tag => (
              <button
                key={tag}
                onClick={() => setText(t => t + ' ' + tag)}
                className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md px-2 py-0.5 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Apply & copy buttons */}
          <div className="flex gap-2">
            {onApply && (
              <Button
                onClick={() => onApply(text, { bold, italic, underline, font })}
                className="flex-1 gap-2"
              >
                Appliquer au post
              </Button>
            )}
            <Button variant="outline" onClick={handleCopy} className="gap-2">
              {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
              {copied ? 'Copié !' : 'Copier'}
            </Button>
          </div>
        </div>

        {/* Right: social mirror */}
        <div className="flex flex-col items-center gap-4 shrink-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Aperçu Social Mirror
          </p>

          {/* Platform tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border">
            {PLATFORMS.map(p => (
              <button
                key={p.id}
                onClick={() => setPlatform(p.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  platform === p.id
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{p.emoji}</span>
                <span className="hidden sm:block">{p.label}</span>
              </button>
            ))}
          </div>

          {/* Live phone preview */}
          <motion.div
            key={`${platform}-${font}-${bold}-${italic}-${underline}`}
            initial={{ opacity: 0.8, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <PhoneMirror
              text={text}
              bold={bold}
              italic={italic}
              underline={underline}
              font={font}
              platform={platform}
            />
          </motion.div>

          <p className="text-[10px] text-muted-foreground text-center max-w-[160px] leading-relaxed">
            ✨ Le rendu se met à jour en temps réel selon votre formatage
          </p>
        </div>
      </div>
    </div>
  );
}
