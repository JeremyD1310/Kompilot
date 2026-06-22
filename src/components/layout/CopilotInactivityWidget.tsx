/**
 * CopilotInactivityWidget
 *
 * Appears after 45 seconds of no user interaction (no clicks, no keystrokes).
 * Shows a small animated robot widget in bottom-right corner.
 * Dismisses on click or after user interacts.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@blinkdotnew/ui';
import { useNavigate } from '@tanstack/react-router';

// ── Constants ─────────────────────────────────────────────────────────────────

const INACTIVITY_MS = 45_000;
const SNOOZE_MS = 5 * 60 * 1000;
const SNOOZE_KEY = 'kompilot_inactivity_widget_snoozed_until';

const INTERACTION_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export function CopilotInactivityWidget() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check snooze
  const isSnoozed = useCallback((): boolean => {
    try {
      const until = localStorage.getItem(SNOOZE_KEY);
      if (!until) return false;
      return Date.now() < parseInt(until, 10);
    } catch {
      return false;
    }
  }, []);

  const snooze = useCallback(() => {
    try {
      localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
    } catch { /* ignore */ }
  }, []);

  const resetTimer = useCallback(() => {
    // If widget is showing, hide it on interaction
    setVisible(false);

    if (timerRef.current) clearTimeout(timerRef.current);

    if (isSnoozed()) return;

    timerRef.current = setTimeout(() => {
      if (!isSnoozed()) setVisible(true);
    }, INACTIVITY_MS);
  }, [isSnoozed]);

  useEffect(() => {
    if (isSnoozed()) return;

    // Start the initial timer
    timerRef.current = setTimeout(() => {
      if (!isSnoozed()) setVisible(true);
    }, INACTIVITY_MS);

    // Attach interaction listeners
    const onInteract = () => resetTimer();
    INTERACTION_EVENTS.forEach(evt =>
      window.addEventListener(evt, onInteract, { passive: true }),
    );

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      INTERACTION_EVENTS.forEach(evt =>
        window.removeEventListener(evt, onInteract),
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    snooze();
    resetTimer();
  };

  const handleHelp = () => {
    handleDismiss();
    navigate({ to: '/cockpit' });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="inactivity-widget"
          initial={{ opacity: 0, x: 40, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 40, y: 20 }}
          transition={{ type: 'spring', stiffness: 340, damping: 26 }}
          className="fixed bottom-6 right-6 z-50 w-72 max-w-[calc(100vw-2rem)]"
        >
          <div className="relative rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
            {/* Subtle gradient top edge */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-teal-500 via-violet-500 to-teal-500 opacity-70" />

            {/* Content */}
            <div className="px-4 pt-4 pb-3">
              {/* Robot + dismiss row */}
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                  className="text-3xl leading-none select-none"
                  role="img"
                  aria-label="Robot assistant"
                >
                  🤖
                </motion.div>
                <button
                  onClick={handleDismiss}
                  className="shrink-0 rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Fermer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Message bubble */}
              <p className="text-xs text-foreground leading-relaxed mb-3">
                <span className="font-bold text-sm">Besoin d'un coup de main ?</span>
                <br />
                Je peux rédiger ou valider cette étape pour vous d'un simple clic.
              </p>

              {/* CTA button */}
              <Button
                size="sm"
                className="w-full h-8 text-xs font-bold bg-gradient-to-r from-teal-500 to-violet-500 text-white border-0 hover:opacity-90 transition-opacity"
                onClick={handleHelp}
              >
                M'aider maintenant ✨
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
