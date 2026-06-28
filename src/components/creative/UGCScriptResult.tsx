/**
 * UGCScriptResult — Displays the generated UGC script with Hook → Body → CTA.
 * Includes full script, voice notes, hook variations, and action buttons.
 */
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronUp, HelpCircle, Flame, BarChart3,
  BookOpen, CheckCircle2, Copy, CalendarCheck, Video,
} from 'lucide-react';
import { Button, toast } from '@blinkdotnew/ui';
import type { UGCScript } from '../../hooks/useUGCScript';

interface UGCScriptResultProps {
  script: UGCScript;
  onSchedule: (script: UGCScript) => void;
  onSendToStudio: () => void;
}

// ── Hook type badges ─────────────────────────────────────────────────────────

const HOOK_TYPE_BADGES: Record<UGCScript['hook']['type'], { label: string; icon: typeof HelpCircle }> = {
  question: { label: 'Question', icon: HelpCircle },
  provocation: { label: 'Provocation', icon: Flame },
  statistic: { label: 'Statistique', icon: BarChart3 },
  story: { label: 'Storytelling', icon: BookOpen },
};

const CTA_TYPE_BADGES: Record<UGCScript['cta']['type'], string> = {
  booking: 'Réservation',
  website: 'Site web',
  phone: 'Appel',
  promo: 'Promotion',
};

export function UGCScriptResult({ script, onSchedule, onSendToStudio }: UGCScriptResultProps) {
  const [activeHook, setActiveHook] = useState<string | null>(null);
  const [showFullScript, setShowFullScript] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(script.fullScript).then(
      () => toast.success('Script copié dans le presse-papier !'),
      () => toast.error('Impossible de copier le script'),
    );
  }, [script.fullScript]);

  const currentHook = activeHook ?? script.hook.text;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-5"
    >
      {/* ── Hook card ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Accroche</span>
          {(() => {
            const badge = HOOK_TYPE_BADGES[script.hook.type];
            const Icon = badge.icon;
            return (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                <Icon size={10} />
                {badge.label}
              </span>
            );
          })()}
        </div>
        <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
          <p className="text-base font-bold text-foreground leading-snug">
            "{currentHook}"
          </p>
        </div>
      </motion.div>

      {/* ── Body section ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Corps du script</span>
          <span className="text-[10px] text-muted-foreground/50">{script.body.transition}</span>
        </div>
        {script.body.points.map((point, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            className="flex items-start gap-3 rounded-lg bg-muted/20 border border-border/50 p-3"
          >
            <span className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-black text-primary shrink-0 mt-0.5">
              {i + 1}
            </span>
            <div className="flex-1">
              <p className="text-sm text-foreground leading-relaxed">{point.text}</p>
            </div>
            <span className="shrink-0 text-[10px] font-semibold text-muted-foreground/60 bg-muted/60 rounded-full px-2 py-0.5 border border-border">
              {point.duration}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* ── CTA card ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Appel à l'action</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {CTA_TYPE_BADGES[script.cta.type]}
          </span>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-sm font-bold text-foreground">{script.cta.text}</p>
        </div>
      </motion.div>

      {/* ── Estimated duration ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground/60 px-1">
        <span>Durée estimée : <strong className="text-foreground">{script.estimatedDuration}</strong></span>
      </div>

      {/* ── Full script (collapsible) ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        <button
          onClick={() => setShowFullScript((prev) => !prev)}
          className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-foreground hover:bg-muted/20 transition-colors"
        >
          <span>Script complet</span>
          {showFullScript ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <AnimatePresence>
          {showFullScript && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4">
                <pre className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap font-mono bg-muted/20 rounded-lg p-3 border border-border/50">
                  {script.fullScript}
                </pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Voice notes ────────────────────────────────────────────────── */}
      {script.voiceNotes && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-1.5"
        >
          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            🎙️ Notes pour le voiceover
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {script.voiceNotes}
          </p>
        </motion.div>
      )}

      {/* ── Hook variations ────────────────────────────────────────────── */}
      {script.suggestedVariations.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-2"
        >
          <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
            Variantes d'accroche
          </p>
          <div className="grid grid-cols-1 gap-2">
            {script.suggestedVariations.map((variation, i) => {
              const isActive = activeHook === variation.hook;
              return (
                <button
                  key={i}
                  onClick={() => setActiveHook(isActive ? null : variation.hook)}
                  className={`text-left rounded-xl border p-3 transition-all duration-150 ${
                    isActive
                      ? 'border-primary/40 bg-primary/5 shadow-sm'
                      : 'border-border bg-muted/20 hover:border-primary/20 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {isActive && (
                      <CheckCircle2 size={14} className="text-primary shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-muted-foreground/60 mb-1">
                        Ton : {variation.tone}
                      </p>
                      <p className="text-xs font-semibold text-foreground leading-relaxed">
                        "{variation.hook}"
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Action buttons ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="flex flex-col sm:flex-row gap-2 pt-2"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="flex-1 h-9 gap-2 text-xs border-border hover:border-primary/40 hover:bg-primary/5"
        >
          <Copy size={13} />
          Copier le script
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSchedule(script)}
          className="flex-1 h-9 gap-2 text-xs border-border hover:border-primary/40 hover:bg-primary/5"
        >
          <CalendarCheck size={13} />
          Planifier dans le calendrier
        </Button>
        <Button
          size="sm"
          onClick={onSendToStudio}
          className="flex-1 h-9 gap-2 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
        >
          <Video size={13} />
          Envoyer au Studio Vidéo
        </Button>
      </motion.div>
    </motion.div>
  );
}
