import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@blinkdotnew/ui';
import { Mic, ChevronRight, X } from 'lucide-react';

// ── Weekly notification banner ─────────────────────────────────────────────────
// Checks localStorage 'nc_minute_copilot_dismissed'; re-shows after 6 days.

export function LaMinuteCopilotBanner({ onOpen }: { onOpen: () => void }) {
  const [dismissed, setDismissed] = useState(() => {
    const stored = localStorage.getItem('nc_minute_copilot_dismissed');
    if (!stored) return false;
    const dismissedAt = new Date(stored);
    const now = new Date();
    return now.getTime() - dismissedAt.getTime() < 6 * 24 * 60 * 60 * 1000;
  });

  const handleDismiss = () => {
    localStorage.setItem('nc_minute_copilot_dismissed', new Date().toISOString());
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, delay: 1.5 }}
      className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50/60 dark:from-teal-950/30 dark:to-cyan-950/20 dark:border-teal-800/50 px-4 py-3 flex items-center gap-3"
    >
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-sm">
        <Mic size={17} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">
          🎙️ La Minute Copilot — Semaine du {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
        </p>
        <p className="text-xs text-muted-foreground">
          Racontez votre semaine en 30s → l&apos;IA génère votre stratégie contenu
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" onClick={onOpen} className="gap-1.5 text-xs h-8 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700">
          <Mic size={12} /> Démarrer
          <ChevronRight size={12} />
        </Button>
        <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground transition-colors p-1">
          <X size={14} />
        </button>
      </div>
    </motion.div>
  );
}
