import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete } from 'lucide-react';

interface PinLockScreenProps {
  onUnlock: () => void;
  verifyPin: (pin: string) => boolean;
}

const MAX_DIGITS = 6;
const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export function PinLockScreen({ onUnlock, verifyPin }: PinLockScreenProps) {
  const [digits, setDigits] = useState('');
  const [shake, setShake] = useState(false);

  const handleKey = useCallback((key: string) => {
    if (key === '⌫') {
      setDigits(d => d.slice(0, -1));
      return;
    }
    if (digits.length >= MAX_DIGITS) return;
    const next = digits + key;
    setDigits(next);

    if (next.length === MAX_DIGITS) {
      setTimeout(() => {
        if (verifyPin(next)) {
          onUnlock();
        } else {
          setShake(true);
          setDigits('');
          setTimeout(() => setShake(false), 600);
        }
      }, 120);
    }
  }, [digits, verifyPin, onUnlock]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: '#0B1120', backdropFilter: 'blur(20px)' }}
    >
      {/* Logo */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="mb-8 flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
          <span className="text-primary font-bold text-sm">NC</span>
        </div>
        <span className="text-white/80 font-semibold tracking-wide">Kompilot</span>
      </motion.div>

      {/* Title */}
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="text-white/60 text-sm mb-8">
        Déverrouiller avec PIN
      </motion.p>

      {/* Dots */}
      <motion.div
        animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="flex gap-4 mb-10"
      >
        {Array.from({ length: MAX_DIGITS }).map((_, i) => (
          <AnimatePresence key={i} mode="wait">
            <motion.div
              key={digits.length > i ? 'filled' : 'empty'}
              initial={{ scale: 0.6 }} animate={{ scale: 1 }} exit={{ scale: 0.6 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className={`w-3.5 h-3.5 rounded-full transition-colors ${
                digits.length > i ? 'bg-white' : shake ? 'bg-red-500/60' : 'bg-white/20 border border-white/20'
              }`}
            />
          </AnimatePresence>
        ))}
      </motion.div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 w-64">
        {KEYS.map((key, i) => (
          key === '' ? (
            <div key={i} />
          ) : key === '⌫' ? (
            <motion.button
              key={i}
              whileTap={{ scale: 0.88 }}
              onClick={() => handleKey(key)}
              className="h-16 rounded-2xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors active:bg-white/15"
            >
              <Delete size={20} />
            </motion.button>
          ) : (
            <motion.button
              key={i}
              whileTap={{ scale: 0.88 }}
              onClick={() => handleKey(key)}
              className="h-16 rounded-2xl text-white text-xl font-medium bg-white/10 hover:bg-white/15 active:bg-white/20 transition-colors border border-white/[0.06]"
            >
              {key}
            </motion.button>
          )
        ))}
      </div>
    </div>
  );
}
