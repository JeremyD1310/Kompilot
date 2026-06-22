import { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge, toast } from '@blinkdotnew/ui';
import { Volume2, Sparkles, Lightbulb, Hash, Target, Calendar } from 'lucide-react';
import type { ContentStrategy } from './types';

// ── Strategy result card ──────────────────────────────────────────────────────

interface StrategyCardProps {
  strategy: ContentStrategy;
  transcription: string;
  onSendToCalendar: (idea: { title: string; hook: string; channel: string }) => void;
}

export function StrategyCard({ strategy, transcription, onSendToCalendar }: StrategyCardProps) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopyIdea = async (idea: { title: string; hook: string }, idx: number) => {
    await navigator.clipboard.writeText(`${idea.title}\n\n${idea.hook}`);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1800);
    toast.success('Idée copiée !');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Transcription */}
      <div className="rounded-xl border border-teal-200/60 bg-teal-50/40 dark:bg-teal-950/20 dark:border-teal-800/40 p-3 space-y-1">
        <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wider flex items-center gap-1">
          <Volume2 size={10} /> Votre parole transcrite
        </p>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
          &ldquo;{transcription}&rdquo;
        </p>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-primary/5 to-teal-500/3 p-3">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <Sparkles size={10} /> Synthèse stratégique IA
        </p>
        <p className="text-sm text-foreground leading-relaxed">{strategy.summary}</p>
      </div>

      {/* Post ideas */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <Lightbulb size={11} /> 3 idées de posts à exploiter
        </p>
        {strategy.post_ideas.map((idea, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-3 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground">{idea.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{idea.hook}</p>
              </div>
              <Badge variant="secondary" className="text-[10px] shrink-0 font-medium">
                {idea.channel}
              </Badge>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => handleCopyIdea(idea, i)}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {copiedIdx === i ? '✓ Copié' : '↗ Copier'}
              </button>
              <button
                onClick={() => onSendToCalendar(idea)}
                className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors ml-auto"
              >
                <Calendar size={10} /> Ajouter au Calendrier
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Hashtags */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <Hash size={11} /> Hashtags recommandés
        </p>
        <div className="flex flex-wrap gap-1.5">
          {strategy.hashtags.map(h => (
            <span key={h} className="text-[11px] bg-primary/8 border border-primary/20 text-primary rounded-full px-2.5 py-0.5 font-medium">
              {h}
            </span>
          ))}
        </div>
      </div>

      {/* Angles */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <Target size={11} /> Angles d&apos;attaque différenciants
        </p>
        {strategy.angles.map((angle, i) => (
          <div key={i} className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2">
            <span className="text-teal-600 font-bold text-xs shrink-0 mt-0.5">{i + 1}.</span>
            <div>
              <p className="text-xs font-bold text-foreground">{angle.label}</p>
              <p className="text-[11px] text-muted-foreground">{angle.description}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
