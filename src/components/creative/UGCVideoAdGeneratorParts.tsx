/**
 * UGCVideoAdGenerator — Sub-components:
 * StepIndicator, TypingAnalyzeSkeleton, ScriptCard, VideoVariantCard.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, Play, CheckCircle2, AlertTriangle,
  ChevronDown, ChevronUp, FileVideo, Timer,
} from 'lucide-react';
import { Button } from '@blinkdotnew/ui';
import type { UGCVideoScript, VideoVariant } from './UGCVideoAdGeneratorTypes';
import { ANGLE_EMOJI } from './UGCVideoAdGeneratorTypes';

// ── StepIndicator ──────────────────────────────────────────────────────────────

export function StepIndicator({ currentStep, steps }: { currentStep: number; steps: string[] }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold transition-all duration-300 ${
              i < currentStep
                ? 'bg-primary text-primary-foreground'
                : i === currentStep
                  ? 'bg-primary/20 text-primary border border-primary/40'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {i < currentStep ? <CheckCircle2 size={13} /> : i + 1}
          </div>
          <span
            className={`text-[11px] font-medium hidden sm:inline ${
              i <= currentStep ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            {label}
          </span>
          {i < steps.length - 1 && (
            <div className={`w-6 sm:w-10 h-px ${i < currentStep ? 'bg-primary' : 'bg-border'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── TypingAnalyzeSkeleton ─────────────────────────────────────────────────────

export function TypingAnalyzeSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-5 py-3"
    >
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div className="w-10 h-10 rounded-lg bg-muted animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="w-2/3 h-3 rounded bg-muted animate-pulse" />
          <div className="w-1/2 h-2.5 rounded bg-muted animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.2 }}
            className="flex items-start gap-3 rounded-lg bg-muted/20 p-3"
          >
            <div className="w-5 h-5 rounded-full bg-muted animate-pulse shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <div className="w-full h-3 rounded bg-muted animate-pulse" />
              <div className="w-3/4 h-2.5 rounded bg-muted animate-pulse" />
            </div>
          </motion.div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Loader2 size={13} className="animate-spin text-primary" />
        Analyse du produit en cours…
      </div>
    </motion.div>
  );
}

// ── ScriptCard ─────────────────────────────────────────────────────────────────

export function ScriptCard({
  script,
  index,
  isSelected,
  onSelect,
  onGenerate,
  isGenerating,
}: {
  script: UGCVideoScript;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const emoji = ANGLE_EMOJI[script.angle] ?? '📱';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        isSelected
          ? 'border-primary/50 bg-primary/[0.03] shadow-sm shadow-primary/10'
          : 'border-border bg-card hover:border-primary/30'
      }`}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={onSelect}
      >
        <span className="text-lg shrink-0">{emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground">{script.angle}</span>
            <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
              {script.estimatedDuration}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
            {script.hook.text}
          </p>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className="p-1 rounded-md hover:bg-muted/50 transition-colors shrink-0"
          aria-label={expanded ? 'Réduire' : 'Développer'}
        >
          {expanded ? <ChevronUp size={15} className="text-muted-foreground" /> : <ChevronDown size={15} className="text-muted-foreground" />}
        </button>
      </div>

      {/* Hook highlight */}
      <div className="px-4 pb-2">
        <p className="text-xs font-semibold text-foreground/80 italic leading-relaxed">
          « {script.hook.text} »
        </p>
      </div>

      {/* Expanded body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-2 border-t border-border/50 pt-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Script complet
              </p>
              {script.body.points.map((point, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-1 rounded shrink-0 mt-0.5">
                    {point.duration}
                  </span>
                  <p className="text-[11px] text-foreground/80 leading-relaxed">{point.text}</p>
                </div>
              ))}
              {script.body.transition && (
                <p className="text-[10px] text-primary font-medium italic">
                  ↪ {script.body.transition}
                </p>
              )}
              <div className="rounded-lg bg-primary/5 border border-primary/10 p-2.5">
                <p className="text-[11px] font-semibold text-primary">
                  🎯 CTA : {script.cta.text}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">
                🎬 {script.visualDescription}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate button */}
      <div className="px-4 pb-3 pt-1">
        <Button
          onClick={(e) => { e.stopPropagation(); onGenerate(); }}
          disabled={isGenerating}
          size="sm"
          className="w-full h-9 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-sm"
        >
          {isGenerating ? (
            <><Loader2 size={12} className="animate-spin" /> Génération…</>
          ) : (
            <><Play size={12} /> Générer la vidéo</>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

// ── VideoVariantCard ───────────────────────────────────────────────────────────

export function VideoVariantCard({
  variant,
  script,
  elapsedSeconds = 0,
}: {
  variant: VideoVariant;
  script?: UGCVideoScript;
  elapsedSeconds?: number;
}) {
  const isCompleted = variant.status === 'completed';
  const isProcessing = variant.status === 'processing' || variant.status === 'queued';
  const isError = variant.status === 'failed' || variant.status === 'error';
  const progress = variant.progress ?? 0;

  const formatElapsed = (s: number) => {
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      {/* Video preview or placeholder */}
      <div className="relative aspect-[9/16] sm:aspect-video bg-muted/30 flex items-center justify-center">
        {isCompleted && variant.videoUrl ? (
          <video
            src={variant.videoUrl}
            controls
            className="w-full h-full object-cover"
          />
        ) : isProcessing ? (
          <div className="flex flex-col items-center gap-3 px-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-primary/30"
                animate={{ scale: [1, 1.15, 1], opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div className="text-center w-full">
              <p className="text-xs font-semibold text-foreground">Génération en cours</p>
              {/* P1: Luma progress bar */}
              <div className="w-full h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] text-muted-foreground">{progress}%</span>
                {elapsedSeconds > 0 && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Timer size={10} />
                    {formatElapsed(elapsedSeconds)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-2 text-center px-4">
            <AlertTriangle size={28} className="text-destructive/70" />
            <p className="text-xs font-semibold text-destructive">Échec de la génération</p>
            <p className="text-[10px] text-muted-foreground">{variant.errorMessage || 'Erreur inconnue'}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <FileVideo size={28} className="text-muted-foreground/40" />
            <p className="text-[10px] text-muted-foreground">En attente…</p>
          </div>
        )}
      </div>

      {/* Info bar */}
      <div className="px-3 py-2 flex items-center justify-between border-t border-border/50">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isCompleted ? 'bg-emerald-500' : isProcessing ? 'bg-amber-400 animate-pulse' : isError ? 'bg-destructive' : 'bg-muted-foreground'
            }`}
          />
          <span className="text-[10px] font-medium text-muted-foreground">
            {variant.aspectRatio}
          </span>
        </div>
        {script && (
          <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
            {ANGLE_EMOJI[script.angle] ?? ''} {script.angle}
          </span>
        )}
      </div>
    </motion.div>
  );
}
