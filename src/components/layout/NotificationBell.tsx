/**
 * NotificationBell — topbar bell icon + dropdown panel.
 * Consumes NotificationsContext for live state.
 */
import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Trash2, X } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useNotifications, type NotifCategory } from '../../context/NotificationsContext';
import { cn } from '../../lib/utils';
import {
  recordWelcomeNotifEvent,
  getWelcomeNotifTypeFromId,
} from '../../lib/welcomeNotifAnalytics';

// ── Category styling ───────────────────────────────────────────────────────────

const CAT: Record<NotifCategory, { dot: string; bg: string; label: string }> = {
  post:    { dot: 'bg-teal-500',    bg: 'bg-teal-50 dark:bg-teal-950/30',    label: 'Post'     },
  review:  { dot: 'bg-amber-500',   bg: 'bg-amber-50 dark:bg-amber-950/30',  label: 'Avis'     },
  message: { dot: 'bg-blue-500',    bg: 'bg-blue-50 dark:bg-blue-950/30',    label: 'Message'  },
  ai:      { dot: 'bg-violet-500',  bg: 'bg-violet-50 dark:bg-violet-950/30',label: 'IA'       },
  sms:     { dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30',label: 'SMS'   },
};

// ── Time formatting ────────────────────────────────────────────────────────────

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'À l\'instant';
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  return `Il y a ${Math.floor(h / 24)}j`;
}

// ── Component ──────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onToggle: () => void;
}

export function NotificationBell({ open, onToggle }: Props) {
  const { notifications, unreadCount, markAllRead, markRead, dismiss, clearAll } = useNotifications();
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onToggle();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onToggle]);

  // Mark all read when opening
  const handleToggle = () => {
    if (!open && unreadCount > 0) {
      // Track 'notif_opened' for any unread welcome notifications that are
      // now becoming visible to the user.
      notifications
        .filter(n => !n.read)
        .forEach(n => {
          const wType = getWelcomeNotifTypeFromId(n.id);
          if (wType) {
            recordWelcomeNotifEvent('notif_opened', wType, n.title);
          }
        });
      setTimeout(markAllRead, 1200); // let user see the badge briefly
    }
    onToggle();
  };

  const handleItemClick = (id: string, href?: string) => {
    markRead(id);
    // Track 'notif_clicked' when user taps a welcome notification CTA
    const notif = notifications.find(n => n.id === id);
    if (notif && href) {
      const wType = getWelcomeNotifTypeFromId(id);
      if (wType) {
        recordWelcomeNotifEvent('notif_clicked', wType, notif.title);
      }
    }
    if (href) navigate({ to: href as any });
    onToggle();
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={handleToggle}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-background hover:bg-muted/60 transition-colors"
        aria-label="Notifications"
      >
        <motion.div
          animate={unreadCount > 0 ? { rotate: [0, -12, 12, -8, 8, 0] } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          key={unreadCount}
        >
          <Bell size={17} className={cn('transition-colors', unreadCount > 0 ? 'text-primary' : 'text-muted-foreground')} />
        </motion.div>

        {/* Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 16 }}
              className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-red-500 border-2 border-background flex items-center justify-center px-0.5"
            >
              <span className="text-[9px] font-extrabold text-white leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </motion.span>
          )}
        </AnimatePresence>

        {/* Live pulse when unread */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-400/50 animate-ping" />
        )}
      </button>

      {/* ── Dropdown panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-11 w-96 max-w-[calc(100vw-2rem)] z-50 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bell size={12} className="text-primary" />
                </div>
                <span className="text-xs font-extrabold text-foreground">Notifications</span>
                {notifications.length > 0 && (
                  <span className="rounded-full bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5">
                    {notifications.length}
                  </span>
                )}
                {/* Live indicator */}
                <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-full px-1.5 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted"
                >
                  <CheckCheck size={11} /> Tout lire
                </button>
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-lg hover:bg-destructive/8"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div className="max-h-[420px] overflow-y-auto divide-y divide-border/40">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Bell size={22} className="opacity-30" />
                  </div>
                  <p className="text-xs font-medium">Aucune notification</p>
                </div>
              ) : (
                notifications.map((notif, i) => {
                  const cat = CAT[notif.category];
                  return (
                    <motion.div
                      key={notif.id}
                      initial={i === 0 ? { opacity: 0, x: -8 } : false}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        'group flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-muted/40',
                        !notif.read && cat.bg
                      )}
                      onClick={() => handleItemClick(notif.id, notif.actionHref)}
                    >
                      {/* Emoji + unread dot */}
                      <div className="relative shrink-0 mt-0.5">
                        <span className="text-lg leading-none">{notif.emoji}</span>
                        {!notif.read && (
                          <span className={cn('absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-background', cat.dot)} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className={cn('text-xs leading-tight', notif.read ? 'text-muted-foreground' : 'font-bold text-foreground')}>
                            {notif.title}
                          </p>
                          <span className={cn('text-[9px] font-bold rounded-full px-1.5 py-0.5', cat.bg, 'border border-current/20 shrink-0')}>
                            {cat.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{notif.body}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">{relativeTime(notif.time)}</p>
                      </div>

                      {/* Dismiss */}
                      <button
                        onClick={e => { e.stopPropagation(); dismiss(notif.id); }}
                        className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground/50 hover:text-muted-foreground transition-all mt-0.5 p-1 rounded-lg hover:bg-black/5"
                        aria-label="Supprimer"
                      >
                        <X size={12} />
                      </button>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-border bg-muted/20 text-center">
                <p className="text-[10px] text-muted-foreground">
                  {notifications.filter(n => n.read).length} lues · {unreadCount} non lues
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
