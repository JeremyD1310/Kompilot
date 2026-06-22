/**
 * WizardStep3 — Loading / Magic Moment
 * Rotates status messages every 2s, auto-advances after 6s via onDone().
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MESSAGES = [
  '🔍 Mapping competitor funnels...',
  '📊 Analyzing active ads...',
  '🛠️ Detecting tech stacks...',
  '🧠 Building your competitive intelligence...',
  '✅ Almost ready!',
];

interface Props {
  onDone: () => void;
}

export function WizardStep3({ onDone }: Props) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % MESSAGES.length);
    }, 2000);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      onDone();
    }, 6000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onDone]);

  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-8">
      {/* Pulsing orange ring spinner */}
      <div className="relative flex items-center justify-center w-24 h-24">
        <span className="absolute inset-0 rounded-full bg-orange-400/20 animate-ping" />
        <span className="absolute inset-2 rounded-full bg-orange-400/15 animate-ping [animation-delay:300ms]" />
        <div className="relative w-16 h-16 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">🚀</span>
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-gray-900">Setting up your dashboard</h2>

        <div className="h-7 flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={msgIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-sm text-gray-500 font-medium"
            >
              {MESSAGES[msgIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5">
        {MESSAGES.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i <= msgIndex ? 'w-5 bg-orange-500' : 'w-1.5 bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
