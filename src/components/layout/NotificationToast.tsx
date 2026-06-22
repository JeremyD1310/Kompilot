/**
 * NotificationToast — slides in from top-right on each new notification.
 * Auto-dismisses after 5s with an animated progress bar.
 * Pause on hover.
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { type AppNotification, type NotifCategory } from '../../context/NotificationsContext';
import { useNavigate } from '@tanstack/react-router';
import {
  recordWelcomeNotifEvent,
  getWelcomeNotifTypeFromId,
} from '../../lib/welcomeNotifAnalytics';

// ── Category styling ───────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<NotifCategory, {
  bar: string;
  bg: string;
  border: string;
  icon: string;
}> = {
  post:    { bar: 'bg-teal-500',   bg: 'bg-teal-50 dark:bg-teal-950/40',    border: 'border-teal-200 dark:border-teal-800',   icon: '📝' },
  review:  { bar: 'bg-amber-500',  bg: 'bg-amber-50 dark:bg-amber-950/40',  border: 'border-amber-200 dark:border-amber-800', icon: '⭐' },
  message: { bar: 'bg-blue-500',   bg: 'bg-blue-50 dark:bg-blue-950/40',    border: 'border-blue-200 dark:border-blue-800',   icon: '💬' },
  ai:      { bar: 'bg-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/40',border: 'border-violet-200 dark:border-violet-800',icon: '✨' },
  sms:     { bar: 'bg-emerald-500',bg: 'bg-emerald-50 dark:bg-emerald-950/40',border: 'border-emerald-200 dark:border-emerald-800',icon: '📲' },
};

const DURATION_MS = 5000;

interface Props {
  notification: AppNotification | null;
  onDismiss: () => void;
}

export function NotificationToast({ notification, onDismiss }: Props) {
  const [progress, setProgress] = useState(100);
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();
  const startRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  // Record toast_shown once per welcome notification appearance
  useEffect(() => {
    if (!notification) return;
    const wType = getWelcomeNotifTypeFromId(notification.id);
    if (wType) {
      recordWelcomeNotifEvent('toast_shown', wType, notification.title);
    }
  }, [notification?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset and run countdown when notification changes
  useEffect(() => {
    if (!notification) return;
    setProgress(100);
    elapsedRef.current = 0;
    startRef.current = performance.now();
    paused && setPaused(false);

    const tick = (now: number) => {
      if (paused) return;
      const delta = now - startRef.current;
      elapsedRef.current = delta;
      const remaining = Math.max(0, 100 - (delta / DURATION_MS) * 100);
      setProgress(remaining);
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        onDismiss();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notification?.id]);

  // Pause/resume on hover
  useEffect(() => {
    if (!notification) return;
    if (paused) {
      cancelAnimationFrame(rafRef.current);
    } else {
      // Resume from where we left off
      startRef.current = performance.now() - elapsedRef.current;
      const tick = (now: number) => {
        const delta = now - startRef.current;
        elapsedRef.current = delta;
        const remaining = Math.max(0, 100 - (delta / DURATION_MS) * 100);
        setProgress(remaining);
        if (remaining > 0) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          onDismiss();
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const handleAction = () => {
    if (notification?.actionHref) {
      // Track toast CTA click for welcome notifications
      const wType = getWelcomeNotifTypeFromId(notification.id);
      if (wType) {
        recordWelcomeNotifEvent('toast_clicked', wType, notification.title);
      }
      navigate({ to: notification.actionHref as any });
    }
    onDismiss();
  };

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          key={notification.id}
          initial={{ opacity: 0, x: 80, y: 0 }}
          animate={{ opacity: 1, x: 0,  y: 0 }}
          exit={{ opacity: 0, x: 80, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          onHoverStart={() => setPaused(true)}
          onHoverEnd={() => setPaused(false)}
          className={`
            fixed top-5 right-5 z-[500] w-80 max-w-[calc(100vw-2rem)]
            rounded-2xl border shadow-xl shadow-black/10 overflow-hidden
            ${CATEGORY_STYLES[notification.category].bg}
            ${CATEGORY_STYLES[notification.category].border}
          `}
          role="alert"
          aria-live="polite"
        >
          {/* Progress bar — top */}
          <div className="h-0.5 w-full bg-black/8 dark:bg-white/10">
            <div
              className={`h-full rounded-full transition-none ${CATEGORY_STYLES[notification.category].bar}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="px-4 py-3.5">
            <div className="flex items-start gap-3">
              {/* Emoji + category color dot */}
              <div className="relative shrink-0">
                <span className="text-xl leading-none">{notification.emoji}</span>
                <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-background ${CATEGORY_STYLES[notification.category].bar}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-extrabold text-foreground leading-tight">{notification.title}</p>
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">{notification.body}</p>

                {/* Action link */}
                {notification.actionLabel && (
                  <button
                    onClick={handleAction}
                    className="mt-2 text-[11px] font-bold text-primary hover:text-primary/80 transition-colors"
                  >
                    {notification.actionLabel} →
                  </button>
                )}
              </div>

              {/* Dismiss */}
              <button
                onClick={onDismiss}
                className="shrink-0 p-1 rounded-lg text-muted-foreground/60 hover:text-muted-foreground hover:bg-black/5 transition-colors -mt-0.5 -mr-1"
                aria-label="Fermer"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
