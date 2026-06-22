/**
 * StepC_WhatsAppInbox — WhatsApp Inbox simulation
 * Simulated message → AI generates a reply → send button calls onComplete.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props { onComplete: () => void }

export function StepC_WhatsAppInbox({ onComplete }: Props) {
  const [phase, setPhase] = useState<'idle' | 'thinking' | 'replied'>('idle');

  const handleReply = () => {
    setPhase('thinking');
    setTimeout(() => setPhase('replied'), 1000);
  };

  return (
    <div className="space-y-4">
      {/* Intro banner */}
      <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-3.5 py-3 flex items-start gap-2.5">
        <span className="text-base shrink-0">💬</span>
        <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
          <strong>MESSAGERIE UNIFIÉE :</strong> Gérez WhatsApp, Google, Instagram en un seul endroit.
          L'IA répond à vos clients en moins de 2 secondes — même la nuit.
        </p>
      </div>

      {/* Chat panel */}
      <div className="rounded-2xl border-2 border-[#25D366]/50 bg-gradient-to-br from-[#25D366]/5 to-emerald-50 dark:from-[#25D366]/10 dark:to-emerald-950/20 p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
            {/* WhatsApp icon simplified */}
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <p className="text-[10px] font-bold text-[#25D366] uppercase tracking-widest">
            WhatsApp Business
          </p>
        </div>

        {/* Incoming message */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-start gap-2.5"
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
            M
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] font-bold text-foreground">Marie D.</p>
              <span className="text-[9px] text-muted-foreground">• il y a 2 min</span>
              <span className="ml-auto inline-flex items-center gap-0.5 rounded-full bg-[#25D366] px-1.5 py-0.5 text-[8px] font-bold text-white">
                <svg viewBox="0 0 24 24" className="w-2 h-2 fill-white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WA
              </span>
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-card border border-border px-3 py-2 max-w-xs">
              <p className="text-xs text-foreground leading-relaxed">
                Bonjour, est-ce que vous avez de la disponibilité vendredi prochain pour une coloration ?
              </p>
            </div>
          </div>
        </motion.div>

        {/* Action area */}
        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.button
              key="reply-btn"
              onClick={handleReply}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-bold py-2.5 shadow-md"
            >
              Répondre avec l'IA ✨
            </motion.button>
          )}

          {phase === 'thinking' && (
            <motion.div
              key="thinking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 py-2"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
              </span>
              <p className="text-xs text-muted-foreground font-medium">L'IA rédige la réponse…</p>
            </motion.div>
          )}

          {phase === 'replied' && (
            <motion.div
              key="replied"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-3"
            >
              {/* AI reply bubble — right side */}
              <div className="flex justify-end">
                <div className="rounded-2xl rounded-tr-sm bg-[#25D366] px-3 py-2 max-w-[85%]">
                  <p className="text-xs text-white leading-relaxed">
                    Bonjour Marie ! 😊 Oui, nous avons de la disponibilité vendredi. Vous pouvez réserver directement en ligne sur notre planning : [Planity/Fresha]. À très vite ! 💇
                  </p>
                </div>
              </div>

              {/* IA badge */}
              <div className="flex justify-end">
                <span className="text-[9px] text-muted-foreground">✨ Rédigé par l'IA en 0.8s</span>
              </div>

              <motion.button
                onClick={onComplete}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white text-sm font-bold py-2.5 shadow-md transition-colors"
              >
                Envoyer ✅
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
