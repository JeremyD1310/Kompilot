import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@blinkdotnew/ui';
import { Rocket } from 'lucide-react';
import { ScoreGauge } from './ScoreGauge';

export interface FirstLoginWelcomeScreenProps {
  userId: string;
  userName?: string;
  onActivate: () => void;
  onSkip: () => void;
}

const STEPS = [
  { emoji: '⭐', title: 'Avis Google', desc: 'Connectez votre fiche Google' },
  { emoji: '🛡️', title: 'Anti No-Show', desc: 'Protégez vos réservations' },
  { emoji: '📱', title: 'Réseaux Sociaux', desc: 'Planifiez vos premiers posts' },
];

const STORAGE_KEY = (id: string) => `kompilot_first_login_done_${id}`;

export function FirstLoginWelcomeScreen({
  userId,
  userName,
  onActivate,
  onSkip,
}: FirstLoginWelcomeScreenProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY(userId))) {
      setVisible(true);
    }
  }, [userId]);

  const dismiss = (fn: () => void) => {
    localStorage.setItem(STORAGE_KEY(userId), '1');
    setVisible(false);
    setTimeout(fn, 350);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="welcome-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-[#0B1120]/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.1 }}
            className="bg-[#0F1A2E] border border-[#0D9488]/30 rounded-3xl shadow-2xl w-full max-w-md p-8 flex flex-col items-center gap-6"
          >
            {/* Header text */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-center space-y-2"
            >
              <p className="text-xs font-bold text-[#0D9488] uppercase tracking-widest">Kompilot IA</p>
              <h2 className="text-xl font-extrabold text-[#F8FAFC] leading-tight">
                Bonjour {userName ? <span className="text-[#0D9488]">{userName}</span> : 'là'}&nbsp;!
              </h2>
              <p className="text-sm text-[#94a3b8] leading-relaxed">
                Votre établissement est actuellement noté à{' '}
                <span className="font-bold text-[#F8FAFC]">42%</span> de visibilité sur les moteurs d'IA
                (ChatGPT, Perplexity).<br />
                <span className="text-[#0D9488] font-semibold">Lançons votre copilote.</span>
              </p>
            </motion.div>

            {/* Score gauge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35, type: 'spring', stiffness: 260, damping: 22 }}
            >
              <ScoreGauge score={42} />
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="w-full"
            >
              <Button
                className="w-full h-14 text-sm font-bold rounded-2xl gap-2 bg-[#0D9488] hover:bg-[#0f7a70] text-white shadow-lg shadow-[#0D9488]/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => dismiss(onActivate)}
              >
                <Rocket size={16} />
                Activer mon premier plan d'action IA (60 secondes)
              </Button>
            </motion.div>

            {/* Step pills */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="flex flex-wrap gap-2 justify-center w-full"
            >
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.08 }}
                  className="flex items-center gap-2 rounded-full border border-[#0D9488]/20 bg-[#0D9488]/8 px-3 py-1.5"
                >
                  <span className="text-sm">{step.emoji}</span>
                  <div className="leading-none">
                    <p className="text-[11px] font-bold text-[#F8FAFC]">{step.title}</p>
                    <p className="text-[10px] text-[#94a3b8]">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Skip link */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75 }}
              onClick={() => dismiss(onSkip)}
              className="text-[11px] text-[#64748b] hover:text-[#94a3b8] transition-colors underline-offset-2 hover:underline"
            >
              Je verrai ça plus tard
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
