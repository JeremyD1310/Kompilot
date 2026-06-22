/**
 * VoiceInputButton — Microphone avec onde audio animée pour la saisie vocale.
 * Utilise l'API SpeechRecognition native (Chrome/Safari) avec fallback visuel.
 * Peut être intégré dans AIChatWidget, Inbox, et autres zones de saisie.
 */
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X } from 'lucide-react';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  /** Si true, affiche une bulle d'overlay de transcription en temps réel */
  showOverlay?: boolean;
}

export function VoiceInputButton({ onTranscript, disabled, size = 'md', showOverlay = true }: VoiceInputButtonProps) {
  const [state, setState] = useState<'idle' | 'listening' | 'processing'>('idle');
  const [liveText, setLiveText] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const liveTextRef = useRef('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechAPI) setIsSupported(false);
  }, []);

  const start = () => {
    if (disabled || !isSupported || state !== 'idle') return;
    const SpeechAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechAPI) return;

    const recognition = new SpeechAPI();
    recognition.lang = 'fr-FR';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setState('listening');
      setLiveText('');
      liveTextRef.current = '';
    };

    recognition.onresult = (e: any) => {
      const text = Array.from(e.results as any[])
        .map((r: any) => r[0].transcript)
        .join('');
      setLiveText(text);
      liveTextRef.current = text;
    };

    recognition.onend = () => {
      setState('processing');
      const finalText = liveTextRef.current;
      setTimeout(() => {
        setState('idle');
        setLiveText('');
        liveTextRef.current = '';
        if (finalText.trim()) onTranscript(finalText);
      }, 600);
      recognitionRef.current = null;
    };

    recognition.onerror = () => {
      setState('idle');
      setLiveText('');
      liveTextRef.current = '';
      recognitionRef.current = null;
    };

    recognition.start();
  };

  const stop = () => {
    recognitionRef.current?.stop();
  };

  const btnSize = size === 'sm'
    ? 'w-9 h-9 min-w-[36px] min-h-[36px]'
    : 'w-10 h-10 min-w-[40px] min-h-[40px]';
  const iconSize = size === 'sm' ? 15 : 17;

  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        title="Dictée vocale non supportée. Essayez Chrome ou Safari."
        className={`${btnSize} rounded-xl bg-muted/40 flex items-center justify-center opacity-40 cursor-not-allowed shrink-0`}
      >
        <MicOff size={iconSize} className="text-muted-foreground" />
      </button>
    );
  }

  return (
    <div className="relative shrink-0">
      {/* ── Listening overlay (live transcript) ── */}
      <AnimatePresence>
        {state === 'listening' && showOverlay && liveText && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 right-0 min-w-[220px] max-w-[300px] bg-card border border-border rounded-2xl px-3 py-2.5 shadow-xl z-50 text-xs text-foreground/80 italic leading-relaxed"
          >
            <span className="not-italic font-semibold text-primary text-[10px] block mb-1">🎙️ Je vous écoute…</span>
            "{liveText}"
          </motion.div>
        )}

        {/* State: no text yet but listening */}
        {state === 'listening' && showOverlay && !liveText && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-full mb-2 right-0 w-[180px] bg-card border border-border rounded-2xl px-3 py-2.5 shadow-xl z-50"
          >
            <span className="text-[10px] font-semibold text-primary block mb-1.5">🎙️ Parlez maintenant…</span>
            {/* Animated audio bars */}
            <div className="flex items-end gap-[3px] h-5">
              {[0.4, 0.9, 0.6, 1, 0.7, 0.5, 0.8].map((h, i) => (
                <motion.div
                  key={i}
                  className="flex-1 rounded-full bg-primary"
                  animate={{ scaleY: [h, 1, h * 0.3, h] }}
                  transition={{ duration: 0.5, delay: i * 0.07, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ height: '100%', transformOrigin: 'bottom' }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main button ── */}
      <motion.button
        type="button"
        onClick={state === 'listening' ? stop : start}
        disabled={disabled || state === 'processing'}
        aria-label={
          state === 'listening' ? 'Arrêter la reconnaissance vocale' :
          state === 'processing' ? 'Traitement en cours…' :
          'Activer la reconnaissance vocale'
        }
        whileTap={state !== 'processing' ? { scale: 0.9 } : {}}
        className={`
          ${btnSize} rounded-xl flex items-center justify-center transition-all outline-none
          focus-visible:ring-2 focus-visible:ring-primary/40
          disabled:opacity-40 disabled:cursor-not-allowed
          ${state === 'listening'
            ? 'bg-red-500 text-white shadow-[0_0_0_3px_rgba(239,68,68,0.25)]'
            : state === 'processing'
            ? 'bg-primary/20 text-primary'
            : 'bg-muted/40 text-foreground hover:bg-muted/60 hover:text-primary'
          }
        `}
      >
        {state === 'processing' ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Mic size={iconSize} />
          </motion.div>
        ) : state === 'listening' ? (
          <>
            {/* Ripple ring */}
            <motion.span
              className="absolute inset-0 rounded-xl border-2 border-red-400/50"
              animate={{ scale: [1, 1.5], opacity: [0.7, 0] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'easeOut' }}
            />
            <X size={iconSize} />
          </>
        ) : (
          <Mic size={iconSize} />
        )}
      </motion.button>
    </div>
  );
}
