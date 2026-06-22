/**
 * GuardrailQueuePanel — Panneau centralisé "⚡ Actions en attente de visa".
 * Toutes les générations IA autonomes (crises, campagnes CRM, posts anti-vide)
 * y sont présentées en cartes One-Tap. Aucune exécution sans validation humaine.
 */
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check, Trash2, Zap, ShieldCheck, MessageCircle,
  BarChart2, Share2, AlertTriangle, Clock,
} from 'lucide-react';
import { cn } from '@blinkdotnew/ui';
import { useGuardrailQueue, type ActionType } from '../../context/GuardrailQueueContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// ── Config per action type ────────────────────────────────────────────────────

type ActionCfg = {
  label: string;
  icon: typeof Zap;
  iconColor: string;
  cardBg: string;
  channelBadge: string;
};

const ACTION_CONFIG: Record<ActionType, ActionCfg> = {
  crisis_response: {
    label: 'Réponse crise',
    icon: AlertTriangle,
    iconColor: 'text-red-500',
    cardBg: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40',
    channelBadge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  },
  crm_campaign: {
    label: 'Campagne CRM',
    icon: BarChart2,
    iconColor: 'text-violet-500',
    cardBg: 'bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800/40',
    channelBadge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  },
  social_post: {
    label: 'Publication sociale',
    icon: Share2,
    iconColor: 'text-blue-500',
    cardBg: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40',
    channelBadge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  anti_vide: {
    label: 'Anti-vide',
    icon: Zap,
    iconColor: 'text-amber-500',
    cardBg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40',
    channelBadge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
};

// ── Floating trigger button ───────────────────────────────────────────────────

export function GuardrailQueueTrigger() {
  const { pendingCount, isOpen, setIsOpen } = useGuardrailQueue();

  return (
    <button
      onClick={() => setIsOpen(!isOpen)}
      type="button"
      aria-label="File d'attente IA"
      className={cn(
        'fixed bottom-[5.5rem] right-6 z-[80] flex items-center gap-2 rounded-2xl px-4 py-2.5 font-bold text-sm shadow-lg transition-all duration-200 active:scale-[.97]',
        pendingCount > 0
          ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/30'
          : 'bg-card border border-border text-foreground hover:bg-muted shadow-md'
      )}
    >
      <Zap className={cn('w-4 h-4', pendingCount > 0 ? 'fill-black' : '')} />
      <span className="hidden sm:inline">Actions en attente</span>
      <span className="sm:hidden">Visa IA</span>
      {pendingCount > 0 && (
        <motion.span
          key={pendingCount}
          initial={{ scale: 1.4 }}
          animate={{ scale: 1 }}
          className="flex items-center justify-center w-5 h-5 rounded-full bg-black/20 text-[11px] font-extrabold"
        >
          {pendingCount}
        </motion.span>
      )}
    </button>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function GuardrailQueuePanel() {
  const { queue, approveAction, rejectAction, approveAll, pendingCount, isOpen, setIsOpen } = useGuardrailQueue();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="guardrail-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[85] bg-black/30 backdrop-blur-[2px]"
          />

          {/* Side panel */}
          <motion.div
            key="guardrail-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-[90] w-[420px] max-w-full bg-card border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">Actions en attente de visa</h2>
                  <p className="text-xs text-muted-foreground">
                    {pendingCount > 0
                      ? `${pendingCount} action${pendingCount > 1 ? 's' : ''} — Aucune exécution sans validation`
                      : 'File vide — tout est validé'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                type="button"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Control guarantee strip */}
            <div className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 dark:bg-emerald-950/20 border-b border-emerald-200 dark:border-emerald-800/40 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                Contrôle total garanti — Vous restez décisionnaire de chaque action IA
              </p>
            </div>

            {/* Actions list */}
            <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-3">
              <AnimatePresence mode="popLayout">
                {queue.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
                      <Check className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">File vide</p>
                    <p className="text-xs text-muted-foreground mt-1.5 max-w-[200px]">
                      Toutes les actions IA ont été traitées. L'IA génèrera de nouvelles actions ici dès qu'une opportunité est détectée.
                    </p>
                  </motion.div>
                ) : (
                  queue.map(action => {
                    const cfg = ACTION_CONFIG[action.type];
                    const Icon = cfg.icon;
                    return (
                      <motion.div
                        key={action.id}
                        layout
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 30, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={cn('rounded-xl border p-4 space-y-3', cfg.cardBg)}
                      >
                        {/* Card header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon className={cn('w-4 h-4 shrink-0', cfg.iconColor)} />
                            <span className="text-xs font-bold text-foreground truncate">{action.title}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {action.channel && (
                              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', cfg.channelBadge)}>
                                {action.channel}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Timestamp */}
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">
                            Généré {formatDistanceToNow(action.createdAt, { addSuffix: true, locale: fr })}
                          </span>
                        </div>

                        {/* Content preview */}
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 bg-background/70 rounded-lg px-3 py-2.5 border border-border/50 italic">
                          &ldquo;{action.preview}&rdquo;
                        </p>

                        {/* One-Tap action buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveAction(action.id)}
                            type="button"
                            className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-[.97] text-white rounded-xl py-2.5 text-xs font-bold transition-all"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approuver
                          </button>
                          <button
                            onClick={() => rejectAction(action.id)}
                            type="button"
                            className="flex items-center justify-center gap-1.5 bg-background border border-border hover:bg-muted active:scale-[.97] text-muted-foreground hover:text-foreground rounded-xl px-4 py-2.5 text-xs font-bold transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Refuser
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>

            {/* Approve-all footer */}
            {pendingCount > 1 && (
              <div className="border-t border-border px-4 py-3 shrink-0 bg-card">
                <button
                  onClick={approveAll}
                  type="button"
                  className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 active:scale-[.98] text-black rounded-xl py-3 text-xs font-bold transition-all shadow-[0_2px_12px_rgba(245,158,11,.25)]"
                >
                  <Zap className="w-3.5 h-3.5 fill-black" />
                  Tout approuver ({pendingCount} actions)
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
