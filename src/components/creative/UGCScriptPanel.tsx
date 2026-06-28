/**
 * UGCScriptPanel — Premium panel for generating UGC-style video scripts.
 * Hook → Body → CTA architecture with calendar integration.
 */
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from '@tanstack/react-router';
import {
  Megaphone, Sparkles, Loader2,
} from 'lucide-react';
import { Button, toast } from '@blinkdotnew/ui';
import { useGenerateUGCScript, type UGCScript } from '../../hooks/useUGCScript';
import { UGCScriptResult } from './UGCScriptResult';
import { useDemoMode } from '../../context/DemoModeContext';
import { MOCK_UGC_SCRIPTS } from '../../lib/fixtures/creativeStudioFixtures';
import { useTelemetry } from '../../hooks/useTelemetry';

interface UGCScriptPanelProps {
  initialTopic?: string;
  initialKeywords?: string[];
  onSchedule?: (script: UGCScript) => void;
}

// ── Tone options (matching CreatePostModal pill pattern) ──────────────────────

const TONES = [
  { id: 'Expert', emoji: '🎓', label: 'Expert' },
  { id: 'Énergique', emoji: '⚡', label: 'Énergique' },
  { id: 'Séducteur', emoji: '✨', label: 'Séducteur' },
] as const;

type ToneId = (typeof TONES)[number]['id'];

// ── Typing skeleton ──────────────────────────────────────────────────────────

function TypingSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-5 py-6"
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-muted animate-pulse" />
          <div className="w-20 h-3 rounded bg-muted animate-pulse" />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="w-3/4 h-4 rounded bg-muted animate-pulse" />
          <div className="w-1/2 h-3 rounded bg-muted animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.15 }}
            className="flex items-start gap-3 rounded-lg bg-muted/20 p-3"
          >
            <div className="w-5 h-5 rounded-full bg-muted animate-pulse shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="w-full h-3 rounded bg-muted animate-pulse" />
              <div className="w-2/3 h-3 rounded bg-muted animate-pulse" />
            </div>
          </motion.div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="w-2/3 h-4 rounded bg-muted animate-pulse" />
      </div>
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Loader2 size={13} className="animate-spin text-primary" />
        Génération du script UGC…
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function UGCScriptPanel({ initialTopic, initialKeywords, onSchedule }: UGCScriptPanelProps) {
  const navigate = useNavigate();
  const { isDemoActive } = useDemoMode();
  const track = useTelemetry();

  // Input state
  const [topic, setTopic] = useState(initialTopic ?? '');
  const [tone, setTone] = useState<ToneId>('Expert');
  const [keywordsInput, setKeywordsInput] = useState(initialKeywords?.join(', ') ?? '');

  // Result state
  const [script, setScript] = useState<UGCScript | null>(null);

  const generateMutation = useGenerateUGCScript();

  const handleGenerate = useCallback(() => {
    if (!topic.trim()) return;
    track('creative_studio_generation_click', { type: 'ugc_script', tone, demo: isDemoActive });

    // Demo mode: return mock data instantly
    if (isDemoActive) {
      const mock = MOCK_UGC_SCRIPTS[0];
      setScript({
        fullScript: `${mock.hook.text}\n\n${mock.bodyPoints.map(p => p.text).join('\n')}\n\n${mock.cta.text}`,
        hook: mock.hook.text,
        body: mock.bodyPoints.map(p => p.text).join('\n'),
        cta: mock.cta.text,
      } as unknown as UGCScript);
      track('creative_studio_generation_complete', { type: 'ugc_script', demo: true });
      return;
    }

    const keywords = keywordsInput
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    generateMutation.mutate(
      { topic: topic.trim(), tone, keywords: keywords.length > 0 ? keywords : undefined },
      {
        onSuccess: (data) => {
          setScript(data);
          track('creative_studio_generation_complete', { type: 'ugc_script', demo: false });
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : 'Erreur lors de la génération');
          track('creative_studio_generation_error', { type: 'ugc_script', error: String(err) });
        },
      },
    );
  }, [topic, tone, keywordsInput, generateMutation, isDemoActive, track]);

  const handleSchedule = useCallback((s: UGCScript) => {
    if (onSchedule) onSchedule(s);
    const params = new URLSearchParams();
    params.set('prefill', s.fullScript);
    params.set('source', 'ugc_script');
    navigate({ to: `/calendar?${params.toString()}` });
    toast.success('Redirection vers le calendrier…');
  }, [onSchedule, navigate]);

  const handleSendToStudio = useCallback(() => {
    navigate({ to: '/creative-factory' });
    toast.success('Redirection vers le Studio Vidéo…');
  }, [navigate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Megaphone size={17} className="text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">Script UGC</h2>
          <p className="text-[11px] text-muted-foreground">Générez un script vidéo Hook → Body → CTA</p>
        </div>
      </div>

      {/* Input section */}
      <div className="p-5 space-y-4 border-b border-border/50">
        {/* Topic */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Sujet / Produit
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ex: Promotion massage bien-être -20% ce week-end"
            className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
          />
        </div>

        {/* Tone pills */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Ton</label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {TONES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTone(t.id)}
                className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-150 ${
                  tone === t.id
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
                }`}
              >
                <span>{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Keywords */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Mots-clés <span className="font-normal text-muted-foreground/40">(optionnel, séparés par des virgules)</span>
          </label>
          <input
            type="text"
            value={keywordsInput}
            onChange={(e) => setKeywordsInput(e.target.value)}
            placeholder="Ex: massage, bien-être, spa, promotion"
            className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
          />
        </div>

        {/* Generate button */}
        <Button
          onClick={handleGenerate}
          disabled={generateMutation.isPending || !topic.trim()}
          className="w-full h-11 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20"
        >
          {generateMutation.isPending ? (
            <><Loader2 size={15} className="animate-spin" /> Génération en cours…</>
          ) : (
            <><Sparkles size={15} /> Générer le script</>
          )}
        </Button>
      </div>

      {/* Results section */}
      <AnimatePresence mode="wait">
        {generateMutation.isPending && (
          <motion.div key="loading" className="px-5">
            <TypingSkeleton />
          </motion.div>
        )}

        {script && !generateMutation.isPending && (
          <motion.div key="results" className="p-5">
            <UGCScriptResult
              script={script}
              onSchedule={handleSchedule}
              onSendToStudio={handleSendToStudio}
            />
          </motion.div>
        )}

        {generateMutation.isError && !generateMutation.isPending && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-5"
          >
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center space-y-2">
              <p className="text-xs font-semibold text-destructive">
                Erreur lors de la génération du script
              </p>
              <p className="text-[11px] text-muted-foreground">
                Veuillez réessayer dans quelques instants.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                className="h-8 text-xs gap-1.5"
              >
                <Sparkles size={12} />
                Réessayer
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
