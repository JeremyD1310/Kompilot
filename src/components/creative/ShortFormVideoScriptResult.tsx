/**
 * ShortFormVideoScriptResult — Premium result display for generated video scripts.
 *
 * Renders timeline (HOOK → BODY → CTA), visual mood, music style,
 * and social copywriting in a cinematic dark-mode layout.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock, Eye, Type, Volume2, Copy, Check,
  Music, Palette, Hash, MessageSquare, Sparkles,
} from 'lucide-react';
import { Button, toast } from '@blinkdotnew/ui';
import type { ShortFormScript, TimelineEntry } from '../../hooks/useShortFormVideoScript';

// ── Section styling ───────────────────────────────────────────────────────────

const SECTION_STYLES: Record<string, { gradient: string; icon: string; label: string }> = {
  HOOK: {
    gradient: 'from-red-500/20 to-orange-500/20',
    icon: '🎯',
    label: 'Hook — Accroche',
  },
  BODY: {
    gradient: 'from-teal-500/20 to-cyan-500/20',
    icon: '💎',
    label: 'Corps — Valeur',
  },
  CTA: {
    gradient: 'from-purple-500/20 to-pink-500/20',
    icon: '🚀',
    label: 'CTA — Conversion',
  },
};

// ── Timeline Card ─────────────────────────────────────────────────────────────

function TimelineCard({ entry, index }: { entry: TimelineEntry; index: number }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const style = SECTION_STYLES[entry.section] || SECTION_STYLES.HOOK;

  const copyField = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copié !');
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.15, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`relative rounded-2xl border border-white/8 bg-gradient-to-br ${style.gradient} backdrop-blur-sm overflow-hidden`}
    >
      {/* Section badge */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{style.icon}</span>
          <span className="text-xs font-black uppercase tracking-wider text-white/60">
            {style.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/8 border border-white/10">
          <Clock size={11} className="text-white/50" />
          <span className="text-[10px] font-bold text-white/70">{entry.timestamp}</span>
        </div>
      </div>

      {/* Content fields */}
      <div className="px-5 pb-5 space-y-3.5">
        {/* Screen Text */}
        <div className="group">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Type size={12} className="text-cyan-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400/80">
                Texte à l'écran
              </span>
            </div>
            <button
              onClick={() => copyField(entry.screen_text, 'screen')}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10"
            >
              {copiedField === 'screen'
                ? <Check size={11} className="text-green-400" />
                : <Copy size={11} className="text-white/40" />}
            </button>
          </div>
          <p className="text-sm font-semibold text-white leading-relaxed whitespace-pre-line">
            {entry.screen_text}
          </p>
        </div>

        {/* Voiceover */}
        <div className="group">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Volume2 size={12} className="text-amber-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80">
                Voix-off / Orateur
              </span>
            </div>
            <button
              onClick={() => copyField(entry.audio_voiceover, 'voice')}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10"
            >
              {copiedField === 'voice'
                ? <Check size={11} className="text-green-400" />
                : <Copy size={11} className="text-white/40" />}
            </button>
          </div>
          <p className="text-sm text-white/85 leading-relaxed">
            {entry.audio_voiceover}
          </p>
        </div>

        {/* Visual Directives */}
        <div className="group">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Eye size={12} className="text-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">
                Directives Visuelles
              </span>
            </div>
            <button
              onClick={() => copyField(entry.visual_directives, 'visual')}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10"
            >
              {copiedField === 'visual'
                ? <Check size={11} className="text-green-400" />
                : <Copy size={11} className="text-white/40" />}
            </button>
          </div>
          <p className="text-xs text-white/65 leading-relaxed">
            {entry.visual_directives}
          </p>
        </div>
      </div>

      {/* Timeline connector dot */}
      {index < 2 && (
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10">
          <div className="w-2.5 h-2.5 rounded-full bg-teal-500 border-2 border-[#0F172A] shadow-lg shadow-teal-500/30" />
        </div>
      )}
    </motion.div>
  );
}

// ── Main Result Component ─────────────────────────────────────────────────────

interface Props {
  script: ShortFormScript;
  onRegenerate?: () => void;
}

export function ShortFormVideoScriptResult({ script, onRegenerate }: Props) {
  const [copiedAll, setCopiedAll] = useState(false);

  const copyFullScript = () => {
    const full = [
      `=== META ===`,
      `Format : ${script.meta.format_selected}`,
      `Ambiance : ${script.meta.visual_mood}`,
      `Musique : ${script.meta.music_style}`,
      '',
      `=== SCRIPT TIMELINE ===`,
      ...script.script_timeline.map(e =>
        `[${e.timestamp}] ${e.section}\nTexte écran : ${e.screen_text}\nVoix-off : ${e.audio_voiceover}\nDirectives : ${e.visual_directives}`
      ),
      '',
      `=== SOCIAL COPY ===`,
      script.social_copywriting.caption,
      script.social_copywriting.hashtags.join(' '),
    ].join('\n\n');
    navigator.clipboard.writeText(full);
    setCopiedAll(true);
    toast.success('Script complet copié !');
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-5"
    >
      {/* Meta bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/8">
          <Palette size={13} className="text-teal-400" />
          <span className="text-xs text-white/70">{script.meta.visual_mood}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/8">
          <Music size={13} className="text-purple-400" />
          <span className="text-xs text-white/70">{script.meta.music_style}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/8">
          <Sparkles size={13} className="text-amber-400" />
          <span className="text-xs text-white/70">{script.meta.format_selected}</span>
        </div>
      </div>

      {/* Timeline connector line */}
      <div className="relative">
        <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-500/30 via-teal-500/30 to-purple-500/30 hidden sm:block" />
        <div className="space-y-5">
          {script.script_timeline.map((entry, i) => (
            <TimelineCard key={entry.section} entry={entry} index={i} />
          ))}
        </div>
      </div>

      {/* Social Copywriting */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="rounded-2xl border border-white/8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-5 space-y-4"
      >
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare size={14} className="text-pink-400" />
          <span className="text-xs font-black uppercase tracking-wider text-pink-400/80">
            Social Copywriting
          </span>
        </div>

        {/* Caption */}
        <div className="group">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Caption</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(script.social_copywriting.caption);
                toast.success('Caption copié !');
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10"
            >
              <Copy size={11} className="text-white/40" />
            </button>
          </div>
          <p className="text-sm text-white/85 leading-relaxed whitespace-pre-line">
            {script.social_copywriting.caption}
          </p>
        </div>

        {/* Hashtags */}
        <div className="flex flex-wrap gap-2">
          <Hash size={13} className="text-teal-400 mt-0.5" />
          {script.social_copywriting.hashtags.map((tag, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={copyFullScript}
          className="gap-2 text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, #0D9488, #0F766E)', border: 'none', color: '#fff' }}
        >
          {copiedAll ? <Check size={14} /> : <Copy size={14} />}
          {copiedAll ? 'Copié !' : 'Copier le script complet'}
        </Button>
        {onRegenerate && (
          <Button
            variant="outline"
            onClick={onRegenerate}
            className="gap-2 text-sm"
            style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#94a3b8' }}
          >
            <Sparkles size={14} />
            Régénérer
          </Button>
        )}
      </div>
    </motion.div>
  );
}
