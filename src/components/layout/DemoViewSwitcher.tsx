/**
 * DemoViewSwitcher — 1-click toggle between Mode Pro and Mode Agence.
 * v1.1 — spring animation, collapsed pill, dynamic sidebar branding.
 *
 * Visual logic:
 *  - Shown only when `showSwitcher` is true in DemoViewContext
 *    (demo account or admin mode).
 *  - Compact pill in collapsed sidebar, full pill in expanded sidebar.
 *  - Animated slide indicator that moves between the two sides.
 *  - Adapts sidebar branding colors when Agency is active.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDemoView, type DemoViewRole } from '../../context/DemoViewContext';

interface DemoViewSwitcherProps {
  collapsed?: boolean;
}

const LABELS: Record<DemoViewRole, { icon: typeof Building2; label: string; emoji: string; color: string; bg: string; border: string }> = {
  pro: {
    icon: Building2,
    label: 'Mode Pro',
    emoji: '🏢',
    color: 'text-teal-700 dark:text-teal-400',
    bg: 'bg-teal-50 dark:bg-teal-950/30',
    border: 'border-teal-200 dark:border-teal-800',
  },
  agency: {
    icon: Briefcase,
    label: 'Mode Agence',
    emoji: '💼',
    color: 'text-violet-700 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    border: 'border-violet-200 dark:border-violet-800',
  },
};

export function DemoViewSwitcher({ collapsed = false }: DemoViewSwitcherProps) {
  const { demoViewRole, toggleDemoView, showSwitcher } = useDemoView();

  if (!showSwitcher) return null;

  const current = LABELS[demoViewRole];
  const CurrentIcon = current.icon;

  if (collapsed) {
    return (
      <button
        onClick={toggleDemoView}
        title={`${current.label} — cliquer pour basculer`}
        className={cn(
          'relative flex items-center justify-center w-8 h-8 rounded-xl border transition-all duration-300',
          'hover:scale-105 active:scale-95 cursor-pointer',
          current.bg, current.border,
        )}
      >
        <span className="text-sm leading-none">{current.emoji}</span>
      </button>
    );
  }

  return (
    <div className={cn(
      'mx-3 mb-2 rounded-xl border overflow-hidden transition-all duration-300',
      current.bg, current.border,
    )}>
      {/* Header label */}
      <div className="px-3 pt-2 pb-1">
        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">
          Simulation démo
        </p>
      </div>

      {/* Toggle pill */}
      <div className="px-2 pb-2">
        <div className="relative flex rounded-lg bg-background/60 border border-border/60 p-0.5">
          {/* Sliding background */}
          <motion.div
            className={cn(
              'absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-md transition-colors',
              demoViewRole === 'pro'
                ? 'bg-teal-500 dark:bg-teal-600 left-0.5'
                : 'bg-violet-500 dark:bg-violet-600 right-0.5 left-auto',
            )}
            layout
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          />

          {/* Pro button */}
          <button
            onClick={() => {
              if (demoViewRole !== 'pro') toggleDemoView();
            }}
            className={cn(
              'relative flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-[10px] font-bold transition-colors duration-200 cursor-pointer z-10',
              demoViewRole === 'pro' ? 'text-white' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <span>🏢</span>
            <span>Pro</span>
          </button>

          {/* Agency button */}
          <button
            onClick={() => {
              if (demoViewRole !== 'agency') toggleDemoView();
            }}
            className={cn(
              'relative flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-[10px] font-bold transition-colors duration-200 cursor-pointer z-10',
              demoViewRole === 'agency' ? 'text-white' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <span>💼</span>
            <span>Agence</span>
          </button>
        </div>
      </div>

      {/* Current mode status */}
      <AnimatePresence mode="wait">
        <motion.div
          key={demoViewRole}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="px-3 pb-2"
        >
          <div className={cn('flex items-center gap-1.5 text-[10px] font-semibold', current.color)}>
            <CurrentIcon size={10} strokeWidth={2.5} className="shrink-0" />
            <span className="truncate">
              {demoViewRole === 'pro'
                ? 'Score G.E.O. · Inbox Avis · Creative Factory'
                : 'Marque Blanche · Sous-comptes · Audits Masse'
              }
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
