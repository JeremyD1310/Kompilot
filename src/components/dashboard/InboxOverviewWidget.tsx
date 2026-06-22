import { useState, useEffect } from 'react';
import { MessageSquare, Globe, ExternalLink, Bell, CheckCheck, Inbox } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { type Channel } from '../inbox/inboxData';
import { useInboxMessages } from '../../hooks/useInboxMessages';

// ── Channel config ────────────────────────────────────────────────────────────

const CHANNEL_CONFIG: Record<Channel, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  website: {
    label: 'Site web',
    color: 'text-teal-700',
    bg: 'bg-teal-50 border-teal-200',
    icon: <Globe size={12} />,
  },
  linkedin: {
    label: 'LinkedIn',
    color: 'text-violet-700',
    bg: 'bg-violet-50 border-violet-200',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
  instagram: {
    label: 'Instagram',
    color: 'text-rose-700',
    bg: 'bg-rose-50 border-rose-200',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
  },
};

// ── Animated unread counter ───────────────────────────────────────────────────

function PulsingCount({ count }: { count: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame: number;
    const start = Date.now();
    const duration = 800;
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * count));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [count]);

  return <>{display}</>;
}

// ── Main widget ───────────────────────────────────────────────────────────────

export function InboxOverviewWidget() {
  const { messages: dbMessages, markRead, isLoading } = useInboxMessages();

  const unread = dbMessages.filter(m => !m.isRead);
  const unreadCount = unread.length;

  const byChannel = (['website', 'linkedin', 'instagram'] as Channel[]).map(ch => ({
    channel: ch,
    count: unread.filter(m => m.channel === ch).length,
    cfg: CHANNEL_CONFIG[ch],
  }));

  const recentUnread = unread.slice(0, 3);

  const markAllRead = () => {
    dbMessages.forEach(m => { if (!m.isRead) markRead(m.id); });
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Inbox size={16} className="text-primary" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Boîte de réception</p>
            <p className="text-[11px] text-muted-foreground">Messages non lus</p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground border border-border rounded-lg px-2.5 py-1.5 hover:bg-muted/50 transition-colors whitespace-nowrap"
          >
            <CheckCheck size={11} /> Tout marquer lu
          </button>
        )}
      </div>

      {/* Hero counter */}
      <div className="px-5 pb-4">
        {unreadCount === 0 ? (
          <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
            <CheckCheck size={18} className="text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-green-800">Boîte vide ✓</p>
              <p className="text-xs text-green-600">Tous les messages ont été traités.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-end gap-3">
            <div>
              <p className="text-5xl font-extrabold text-foreground tabular-nums leading-none">
                <PulsingCount count={unreadCount} />
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                message{unreadCount > 1 ? 's' : ''} non lu{unreadCount > 1 ? 's' : ''}
              </p>
            </div>
            <div className="mb-1">
              <Bell size={22} className="text-rose-500 animate-bounce" style={{ animationDuration: '2s' }} />
            </div>
          </div>
        )}
      </div>

      {/* Per-channel breakdown */}
      <div className="grid grid-cols-3 gap-2 px-5 pb-4">
        {byChannel.map(({ channel, count, cfg }) => (
          <div
            key={channel}
            className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 ${
              count > 0 ? cfg.bg : 'bg-muted/30 border-border/50'
            }`}
          >
            <div className={`flex items-center gap-1 text-[11px] font-semibold ${count > 0 ? cfg.color : 'text-muted-foreground'}`}>
              <span className={count > 0 ? cfg.color : 'text-muted-foreground'}>{cfg.icon}</span>
              {cfg.label}
            </div>
            <p className={`text-xl font-extrabold tabular-nums ${count > 0 ? 'text-foreground' : 'text-muted-foreground/50'}`}>
              {count}
            </p>
          </div>
        ))}
      </div>

      {/* Recent unread messages — click to open in inbox */}
      {recentUnread.length > 0 && (
        <div className="border-t border-border/50">
          {recentUnread.map((msg, i) => {
            const cfg = CHANNEL_CONFIG[msg.channel];
            return (
              <Link
                key={msg.id}
                to="/inbox"
                className={`flex items-start gap-3 px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer ${
                  i < recentUnread.length - 1 ? 'border-b border-border/40' : ''
                }`}
                onClick={() => {
                  markRead(msg.id);
                  // Store selected message ID for inbox to auto-open
                  try { sessionStorage.setItem('inbox_open_msg', msg.id); } catch { /* noop */ }
                }}
              >
                {/* Channel icon */}
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg} ${cfg.color}`}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-xs font-bold text-foreground truncate">{msg.senderName}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">{msg.date.split(',')[0]}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{msg.preview}</p>
                </div>
                {/* Unread dot */}
                <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-2" />
              </Link>
            );
          })}
        </div>
      )}

      {/* Footer CTA */}
      <Link
        to="/inbox"
        className="flex items-center justify-between px-5 py-3 border-t border-border/50 hover:bg-muted/30 transition-colors group mt-auto"
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
          <MessageSquare size={12} /> Ouvrir la boîte de réception
        </div>
        <ExternalLink size={12} className="text-muted-foreground group-hover:text-primary transition-colors" />
      </Link>
    </div>
  );
}
