/**
 * MentorCopilote — Proactive contextual AI companion.
 *
 * Renders:
 *  1. A floating notification toast that slides in from the top-right
 *     when a trigger fires (auto-dismisses after 12s with progress bar)
 *  2. A compact spark avatar indicator exported for the topbar
 *
 * Usage:
 *  - In DashboardLayout: <MentorCopilote firstName="Alice" />
 *  - In DashboardTopbar: <MentorTopbarButton unreadCount={n} />
 *    (or use MentorCopilote which self-manages all state)
 */
import { useEffect, useRef, useState } from 'react';
import { X, ArrowRight, Sparkles, MessageCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useMentorTriggers, openAIChat, type MentorMessage } from '../../hooks/useMentorTriggers';

// ── Animated Spark Avatar ─────────────────────────────────────────────────────

function SparkAvatar({ gradient, pulse }: { gradient: string; pulse?: boolean }) {
  return (
    <div
      className={`relative w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md shrink-0`}
    >
      {pulse && (
        <div
          className={`absolute inset-0 rounded-xl bg-gradient-to-br ${gradient} animate-ping opacity-30`}
          style={{ animationDuration: '2s' }}
        />
      )}
      <Sparkles size={17} className="text-white relative z-10" />
    </div>
  );
}

// ── Progress bar (auto-dismiss countdown) ─────────────────────────────────────

function DismissProgress({ duration, onExpire }: { duration: number; onExpire: () => void }) {
  const [progress, setProgress] = useState(100);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const tick = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
      if (pct === 0) {
        clearInterval(tick);
        onExpire();
      }
    }, 60);
    return () => clearInterval(tick);
  }, [duration, onExpire]);

  return (
    <div className="h-0.5 w-full bg-white/10 rounded-full overflow-hidden mt-3">
      <div
        className="h-full bg-white/40 rounded-full transition-none"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ── Proactive Notification Toast ──────────────────────────────────────────────

function MentorToast({
  message,
  onDismiss,
}: {
  message: MentorMessage;
  onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(false);

  // Entrance animation
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleCTA = () => {
    if (message.ctaQuery) {
      openAIChat(message.ctaQuery);
    } else if (message.ctaHref) {
      window.location.href = message.ctaHref;
    }
    onDismiss();
  };

  const handleAsk = () => {
    openAIChat();
    onDismiss();
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        fixed top-[72px] right-4 z-[75] w-[340px] max-w-[calc(100vw-2rem)]
        transition-all duration-500 ease-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
      `}
    >
      <div
        className={`
          relative rounded-2xl overflow-hidden
          bg-gradient-to-br ${message.gradient}
          shadow-[0_20px_60px_-10px_rgba(0,0,0,0.4)]
          border border-white/20
        `}
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-4 pb-3">
          <SparkAvatar gradient="from-white/20 to-white/10" pulse />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest">
                Mentor Copilote
              </span>
            </div>
            <p className="text-white font-bold text-sm leading-snug">
              {message.emoji} {message.title}
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="shrink-0 w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="Fermer"
          >
            <X size={13} className="text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 pb-3">
          <p className="text-white/85 text-xs leading-relaxed">{message.body}</p>
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 flex items-center gap-2">
          {message.ctaLabel && (
            <button
              onClick={handleCTA}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white text-gray-900 text-xs font-bold py-2.5 px-4 hover:bg-white/90 active:scale-[0.98] transition-all shadow-sm"
            >
              {message.ctaLabel}
              <ArrowRight size={12} />
            </button>
          )}
          <button
            onClick={handleAsk}
            className="flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold py-2.5 px-3 transition-all shrink-0"
            title="Demander au Copilote"
          >
            <MessageCircle size={13} />
            <span className="hidden sm:inline">Demander</span>
          </button>
        </div>

        {/* Auto-dismiss progress */}
        <div className="px-4 pb-3">
          <DismissProgress duration={12000} onExpire={onDismiss} />
        </div>
      </div>
    </div>
  );
}

// ── Topbar Mentor Button (exported for DashboardTopbar) ───────────────────────

interface MentorTopbarButtonProps {
  unreadCount: number;
  onClick?: () => void;
  className?: string;
}

export function MentorTopbarButton({ unreadCount, onClick, className = '' }: MentorTopbarButtonProps) {
  return (
    <button
      onClick={onClick}
      title="Mentor Copilote — Votre coach IA proactif"
      aria-label="Ouvrir l'assistant Mentor"
      className={`
        relative flex items-center justify-center w-8 h-8 rounded-xl
        border border-teal-500/40 bg-teal-500/10 hover:bg-teal-500/20
        text-teal-600 transition-all hover:scale-105 active:scale-95
        ${className}
      `}
    >
      <Sparkles size={15} className={unreadCount > 0 ? 'animate-pulse' : ''} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 border-2 border-background flex items-center justify-center">
          <span className="text-[9px] font-bold text-white leading-none">{unreadCount > 9 ? '9+' : unreadCount}</span>
        </span>
      )}
    </button>
  );
}

// ── Main MentorCopilote Component ─────────────────────────────────────────────

export function MentorCopilote() {
  const { user } = useAuth();
  const firstName = user?.displayName?.split(' ')[0] ?? '';
  const { current, dismiss, unreadCount } = useMentorTriggers(firstName);

  // Expose unreadCount globally so topbar can read it
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('mentor_unread_changed', { detail: { count: unreadCount } }));
  }, [unreadCount]);

  if (!current) return null;

  return <MentorToast message={current} onDismiss={dismiss} />;
}
