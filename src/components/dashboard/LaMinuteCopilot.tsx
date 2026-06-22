// LaMinuteCopilot — Micro-interview audio hebdomadaire (main entry).
// Sub-modules: minuteCopilot/{types,AudioWaveform,StrategyCard,useVoiceRecorder,strategySchema}
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Badge, toast } from '@blinkdotnew/ui';
import { Mic, Square, Sparkles, RefreshCw, X } from 'lucide-react';
import { blink } from '../../blink/client';
import { useAuth } from '../../hooks/useAuth';
import type { ContentStrategy, RecordStep } from './minuteCopilot/types';
import { AudioWaveform, RecordingTimer } from './minuteCopilot/AudioWaveform';
import { StrategyCard } from './minuteCopilot/StrategyCard';
import { useVoiceRecorder } from './minuteCopilot/useVoiceRecorder';
import { STRATEGY_SCHEMA, buildStrategyPrompt } from './minuteCopilot/strategySchema';
export { LaMinuteCopilotBanner } from './minuteCopilot/LaMinuteCopilotBanner';

// ── DB persistence helper ─────────────────────────────────────────────────────

async function saveStrategyToDB(userId: string, strategy: ContentStrategy, transcription: string) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const rows = await blink.db.dailyAnalytics.list({
      where: { userId, snapshotDate: today },
      limit: 1,
    } as any);

    const payload = { strategy, transcription, savedAt: new Date().toISOString() };

    if (rows && (rows as any[]).length > 0) {
      const row = (rows as any[])[0];
      const ext = JSON.parse(row.extendedData || '{}');
      ext.lastCopilotStrategy = payload;
      await blink.db.dailyAnalytics.update(row.id, {
        extendedData: JSON.stringify(ext),
      } as any);
    } else {
      await blink.db.dailyAnalytics.create({
        id: `da_copilot_${userId.slice(0, 8)}_${today}`,
        userId,
        establishmentId: 'default',
        snapshotDate: today,
        geoScore: 0,
        unhandledReviews: 0,
        postsPublished: 0,
        reviewsHandled: 0,
        smsSent: 0,
        localVisibility: 0,
        missingKeywords: '[]',
        noshowRevenueCents: 0,
        extendedData: JSON.stringify({ lastCopilotStrategy: payload }),
        createdAt: new Date().toISOString(),
      } as any);
    }
  } catch (e) {
    console.warn('[LaMinuteCopilot] DB save error:', e);
  }
}

// ── Main component ─────────────────────────────────────────────────────────────

interface LaMinuteCopilotProps {
  /** If provided, renders inline (no card wrapper); otherwise renders as a floating notification */
  inline?: boolean;
  onSendToCalendar?: (text: string, channels: string[]) => void;
  onDismiss?: () => void;
}

export function LaMinuteCopilot({ inline = false, onSendToCalendar, onDismiss }: LaMinuteCopilotProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<RecordStep>('prompt');
  const [transcription, setTranscription] = useState('');
  const [strategy, setStrategy] = useState<ContentStrategy | null>(null);
  const [visible, setVisible] = useState(true);

  const MAX_SECONDS = 60;

  const handleRecordingComplete = useCallback(async (base64Audio: string) => {
    setStep('transcribing');
    try {
      const { text } = await blink.ai.transcribeAudio({ audio: base64Audio, language: 'fr' });
      setTranscription(text);

      setStep('analyzing');

      const { object } = await blink.ai.generateObject({
        prompt: buildStrategyPrompt(text),
        schema: STRATEGY_SCHEMA,
      });

      const generatedStrategy = object as ContentStrategy;
      setStrategy(generatedStrategy);
      setStep('result');

      // Persist strategy to DB for cross-device access
      if (user?.id) {
        saveStrategyToDB(user.id, generatedStrategy, text);
      }
    } catch (err: any) {
      if (err?.message?.includes('401')) {
        blink.auth.login(window.location.href);
      } else {
        setStep('error');
      }
    }
  }, [user?.id]);

  const { startRecording, stopRecording, recordingSeconds, isRecording } = useVoiceRecorder({
    maxSeconds: MAX_SECONDS,
    onComplete: handleRecordingComplete,
  });

  const handleReset = () => {
    setStep('prompt');
    setTranscription('');
    setStrategy(null);
  };

  const handleSendIdeaToCalendar = (idea: { title: string; hook: string; channel: string }) => {
    onSendToCalendar?.(`${idea.title}\n\n${idea.hook}`, [idea.channel]);
    toast.success('Idée envoyée dans le Calendrier !');
  };

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  if (!visible) return null;

  const content = (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-sm">
            <Mic size={16} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-foreground">🎙️ La Minute Copilot</p>
              <Badge className="text-[9px] font-bold bg-teal-500/10 text-teal-600 border-teal-300/50 rounded-full px-1.5">
                Hebdo
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">Racontez votre semaine → stratégie IA instantanée</p>
          </div>
        </div>
        {onDismiss && step !== 'recording' && (
          <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <X size={15} />
          </button>
        )}
      </div>

      {/* Steps */}
      <AnimatePresence mode="wait">

        {/* PROMPT */}
        {step === 'prompt' && (
          <motion.div key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="rounded-xl border border-dashed border-teal-300/60 bg-teal-50/30 dark:bg-teal-950/20 p-4 text-center space-y-3">
              <p className="text-sm text-foreground leading-relaxed">
                <strong>Parlez 30-60 secondes</strong> de votre actualité :<br/>
                <span className="text-muted-foreground text-xs">nouveauté, succès client, question tendance, actualité du secteur…</span>
              </p>
              <Button onClick={() => { setStep('recording'); startRecording(); }} className="gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700">
                <Mic size={15} />
                Commencer l&apos;enregistrement
              </Button>
              <p className="text-[11px] text-muted-foreground">Micro requis · Max 60s · Résultat instantané</p>
            </div>
          </motion.div>
        )}

        {/* RECORDING */}
        {step === 'recording' && (
          <motion.div key="recording" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="rounded-xl border border-red-200 bg-red-50/30 dark:bg-red-950/20 p-4 space-y-3">
              <div className="flex items-center justify-center gap-2">
                <span className="inline-flex w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-bold text-red-600">Enregistrement en cours…</span>
              </div>
              <AudioWaveform isActive={isRecording} />
              <RecordingTimer seconds={recordingSeconds} maxSeconds={MAX_SECONDS} />
            </div>
            <Button onClick={stopRecording} variant="outline" className="w-full gap-2 border-red-300 text-red-600 hover:bg-red-50">
              <Square size={14} fill="currentColor" />
              Terminer l&apos;enregistrement
            </Button>
          </motion.div>
        )}

        {/* TRANSCRIBING / ANALYZING */}
        {(step === 'transcribing' || step === 'analyzing') && (
          <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-6"
          >
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-200 flex items-center justify-center">
                <Sparkles size={22} className="text-teal-600 animate-pulse" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
                <RefreshCw size={10} className="text-white animate-spin" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {step === 'transcribing' ? '🎙️ Transcription audio en cours…' : '🧠 Analyse stratégique IA…'}
              </p>
              <p className="text-xs text-muted-foreground">
                {step === 'transcribing'
                  ? 'Whisper analyse votre voix'
                  : 'Génération de votre stratégie de contenu hebdomadaire'}
              </p>
            </div>
          </motion.div>
        )}

        {/* RESULT */}
        {step === 'result' && strategy && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <StrategyCard
              strategy={strategy}
              transcription={transcription}
              onSendToCalendar={handleSendIdeaToCalendar}
            />
            <div className="flex justify-center pt-4">
              <button onClick={handleReset} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Mic size={12} /> Nouvelle minute
              </button>
            </div>
          </motion.div>
        )}

        {/* ERROR */}
        {step === 'error' && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 py-6 text-center"
          >
            <p className="text-sm text-muted-foreground">🤖 Le traitement a échoué. Réessayez dans un instant.</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
                <RefreshCw size={13} /> Réessayer
              </Button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );

  if (inline) {
    return (
      <div className="rounded-2xl border border-teal-200/60 bg-gradient-to-br from-teal-50/30 to-cyan-50/20 dark:from-teal-950/20 dark:to-cyan-950/10 dark:border-teal-800/40 p-4 overflow-y-auto max-h-[600px]">
        {content}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.96 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="rounded-2xl border border-teal-200/60 bg-card shadow-lg shadow-teal-500/8 p-4 overflow-y-auto max-h-[80vh]"
    >
      {content}
    </motion.div>
  );
}


