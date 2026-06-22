import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Sparkles } from 'lucide-react';

interface VoicePostButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoicePostButton({ onTranscript, disabled }: VoicePostButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveText, setLiveText] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const liveTextRef = useRef('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechAPI) setIsSupported(false);
  }, []);

  const startListening = () => {
    if (disabled || !isSupported) return;
    const SpeechAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechAPI) return;

    const recognition = new SpeechAPI();
    recognition.lang = 'fr-FR';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
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
      setIsListening(false);
      setIsProcessing(true);
      const finalText = liveTextRef.current;
      setTimeout(() => {
        setIsProcessing(false);
        setLiveText('');
        liveTextRef.current = '';
        if (finalText.trim()) onTranscript(finalText);
      }, 800);
      recognitionRef.current = null;
    };
    recognition.onerror = () => {
      setIsListening(false);
      setIsProcessing(false);
      setLiveText('');
      liveTextRef.current = '';
      recognitionRef.current = null;
    };
    recognition.start();
  };

  const stopListening = () => recognitionRef.current?.stop();

  // ── Unsupported state ──────────────────────────────────────────────────────
  if (!isSupported) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <div
          className="relative flex items-center justify-center w-20 h-20 rounded-full opacity-40 cursor-not-allowed"
          style={{ background: 'radial-gradient(circle at 40% 35%, #2DD4BF, #0D9488)' }}
          title="Dictée vocale non supportée. Essayez Chrome ou Safari."
        >
          <MicOff size={32} className="text-white" />
        </div>
        <p className="text-xs text-muted-foreground text-center max-w-[220px] leading-relaxed">
          Dictée vocale non supportée.<br />Essayez Chrome ou Safari.
        </p>
      </div>
    );
  }

  // ── Processing state ───────────────────────────────────────────────────────
  if (isProcessing) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <motion.div
          className="relative flex items-center justify-center w-20 h-20 rounded-full"
          style={{ background: 'radial-gradient(circle at 40% 35%, #2DD4BF, #0D9488)' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles size={32} className="text-white" />
        </motion.div>
        <p className="text-sm font-semibold text-foreground">L'IA rédige votre post... ✨</p>
        <p className="text-xs text-muted-foreground">💡 Dites simplement votre idée, l'IA s'occupe du reste</p>
      </div>
    );
  }

  // ── Listening state ────────────────────────────────────────────────────────
  if (isListening) {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        {/* Backdrop blur overlay */}
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 pointer-events-none" />

        <p className="text-sm font-bold text-foreground relative z-50">Je vous écoute... 🎙️</p>

        {/* Big red button with ripple rings */}
        <div className="relative flex items-center justify-center w-20 h-20 z-50">
          {[0, 0.4, 0.8].map((delay, i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border-2 border-red-400/40"
              animate={{ scale: [1, 1.8, 2.2], opacity: [0.6, 0.2, 0] }}
              transition={{ duration: 1.5, delay, repeat: Infinity, ease: 'easeOut' }}
            />
          ))}
          <button
            type="button"
            onClick={stopListening}
            className="relative flex items-center justify-center w-20 h-20 rounded-full shadow-2xl"
            style={{ background: 'radial-gradient(circle at 40% 35%, #F87171, #EF4444)' }}
          >
            {/* Animated sound bars */}
            <div className="flex items-end gap-[3px]">
              {[0.3, 0.7, 1, 0.5].map((h, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-white rounded-full"
                  animate={{ scaleY: [h, 1, h * 0.4, h] }}
                  transition={{ duration: 0.6, delay: i * 0.1, repeat: Infinity }}
                  style={{ height: '24px', transformOrigin: 'bottom' }}
                />
              ))}
            </div>
          </button>
        </div>

        {/* Live transcript card */}
        <AnimatePresence>
          {liveText && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="relative z-50 w-full max-w-sm rounded-2xl border border-border bg-background/95 backdrop-blur-sm px-4 py-3 shadow-lg text-sm text-foreground leading-relaxed text-center"
            >
              <span className="italic text-muted-foreground">"{liveText}"</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stop button */}
        <button
          onClick={stopListening}
          className="relative z-50 flex items-center gap-1.5 rounded-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 px-4 py-2 text-xs font-semibold transition-colors"
        >
          <MicOff size={13} /> Arrêter
        </button>

        <p className="relative z-50 text-xs text-muted-foreground">
          💡 Dites simplement votre idée, l'IA s'occupe du reste
        </p>
      </div>
    );
  }

  // ── Idle state ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <motion.button
        type="button"
        onClick={startListening}
        disabled={disabled}
        whileHover={{ boxShadow: '0 0 0 8px rgba(13,148,136,0.15), 0 8px 32px rgba(13,148,136,0.35)' }}
        animate={disabled ? {} : { scale: [1, 1.03, 1] }}
        transition={disabled ? {} : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="relative flex items-center justify-center w-20 h-20 rounded-full shadow-xl disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-4 focus-visible:ring-teal-400/50"
        style={{ background: 'radial-gradient(circle at 40% 35%, #2DD4BF, #0D9488)' }}
        aria-label="Appuyer pour dicter votre idée"
      >
        <Mic size={32} className="text-white drop-shadow-sm" />
      </motion.button>

      <p className="text-sm font-semibold text-foreground">Appuyer pour parler 🎤</p>
      <p className="text-xs text-muted-foreground text-center max-w-[240px] leading-relaxed">
        💡 Dites simplement votre idée, l'IA s'occupe du reste
      </p>
    </div>
  );
}
