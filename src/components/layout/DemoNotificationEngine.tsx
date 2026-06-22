/**
 * DemoNotificationEngine — fires ephemeral push toasts every 45 seconds
 * in Demo mode to simulate real activity (Anti-No-Show, Inbox IA, G.E.O.).
 * Uses framer-motion for smooth slide-in from top-right.
 * Only mounts when isDemoActive is true.
 */
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useDemoMode } from '../../context/DemoModeContext';

interface DemoToast {
  id: string;
  emoji: string;
  title: string;
  body: string;
  color: string;
  bar: string;
}

const DEMO_TOASTS: DemoToast[] = [
  {
    id: 'anti-no-show',
    emoji: '🛡️',
    title: 'Bouclier Anti-No-Show',
    body: 'Empreinte de 45€ validée avec succès pour un rendez-vous.',
    color: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    bar: 'bg-emerald-500',
  },
  {
    id: 'inbox-ia',
    emoji: '💬',
    title: 'Inbox IA',
    body: 'Réponse pré-rédigée pour un nouvel avis 5 étoiles.',
    color: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    bar: 'bg-amber-500',
  },
  {
    id: 'geo',
    emoji: '📈',
    title: 'G.E.O.',
    body: 'Votre établissement vient de gagner +3 places sur les recherches de ChatGPT.',
    color: 'bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800',
    bar: 'bg-violet-500',
  },
];

const INTERVAL_MS = 45_000;
const DISPLAY_MS  = 6_000;

function DemoToastItem({ toast, onDismiss }: { toast: DemoToast; onDismiss: () => void }) {
  const [progress, setProgress] = useState(100);
  const rafRef  = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = performance.now();
    const tick = (now: number) => {
      const pct = Math.max(0, 100 - ((now - startRef.current) / DISPLAY_MS) * 100);
      setProgress(pct);
      if (pct > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        onDismiss();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      key={toast.id}
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className={`fixed top-20 right-5 z-[600] w-80 max-w-[calc(100vw-2rem)] rounded-2xl border shadow-xl shadow-black/10 overflow-hidden ${toast.color}`}
      role="alert"
      aria-live="polite"
    >
      {/* Progress bar */}
      <div className="h-0.5 w-full bg-black/8 dark:bg-white/10">
        <div className={`h-full rounded-full transition-none ${toast.bar}`} style={{ width: `${progress}%` }} />
      </div>

      <div className="px-4 py-3.5">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <span className="text-xl leading-none">{toast.emoji}</span>
            <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-background ${toast.bar}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-extrabold text-foreground leading-tight">{toast.title}</p>
            <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{toast.body}</p>
            <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Données de démo
            </span>
          </div>
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
  );
}

export function DemoNotificationEngine() {
  const { isDemoActive } = useDemoMode();
  const [current, setCurrent] = useState<DemoToast | null>(null);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showNext = () => {
    const toast = DEMO_TOASTS[indexRef.current % DEMO_TOASTS.length];
    indexRef.current += 1;
    setCurrent({ ...toast, id: `${toast.id}-${Date.now()}` });
  };

  useEffect(() => {
    if (!isDemoActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      setCurrent(null);
      return;
    }

    // Fire first toast after 8s (not immediately), then every 45s
    const initial = setTimeout(() => {
      showNext();
      timerRef.current = setInterval(showNext, INTERVAL_MS);
    }, 8_000);

    return () => {
      clearTimeout(initial);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isDemoActive]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isDemoActive) return null;

  return (
    <AnimatePresence>
      {current && (
        <DemoToastItem
          key={current.id}
          toast={current}
          onDismiss={() => setCurrent(null)}
        />
      )}
    </AnimatePresence>
  );
}
