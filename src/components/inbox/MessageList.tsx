import { useState, useRef, useCallback } from 'react';
import type { InboxMessage } from './inboxData';
import { ChannelIcon, ChannelBadge } from './ChannelIcon';
import { cn } from '@/lib/utils';

interface MessageListProps {
  messages: InboxMessage[];
  selectedId: string | null;
  onSelect: (msg: InboxMessage) => void;
  onArchive?: (id: string) => void;
}

// ── Swipeable message item (mobile: Tinder-style gestures) ───────────────────

function SwipeableItem({
  msg,
  isSelected,
  onSelect,
  onArchive,
}: {
  msg: InboxMessage;
  isSelected: boolean;
  onSelect: (m: InboxMessage) => void;
  onArchive?: (id: string) => void;
}) {
  const [deltaX, setDeltaX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [snapping, setSnapping] = useState(false);
  const startXRef = useRef<number | null>(null);
  const thresholdCrossedRef = useRef(false);

  const THRESHOLD = 80;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Only on touch devices (coarse pointer)
    if (window.matchMedia('(pointer: fine)').matches) return;
    startXRef.current = e.clientX;
    thresholdCrossedRef.current = false;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || startXRef.current === null) return;
    const dx = e.clientX - startXRef.current;
    setDeltaX(dx);

    // Haptic feedback at threshold crossing
    if (!thresholdCrossedRef.current && Math.abs(dx) >= THRESHOLD) {
      thresholdCrossedRef.current = true;
      navigator.vibrate?.(50);
    } else if (thresholdCrossedRef.current && Math.abs(dx) < THRESHOLD) {
      thresholdCrossedRef.current = false;
    }
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    setSnapping(true);

    if (deltaX >= THRESHOLD) {
      // Right swipe → select message (open AI reply)
      navigator.vibrate?.(80);
      onSelect(msg);
    } else if (deltaX <= -THRESHOLD) {
      // Left swipe → archive
      navigator.vibrate?.(60);
      onArchive?.(msg.id);
    }

    setDeltaX(0);
    startXRef.current = null;
    setTimeout(() => setSnapping(false), 300);
  }, [isDragging, deltaX, msg, onSelect, onArchive]);

  const absX = Math.abs(deltaX);
  const isRight = deltaX > 0;
  const isLeft = deltaX < 0;
  const actionVisible = absX > 30;

  return (
    <div
      className="relative overflow-hidden border-b border-border last:border-b-0"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Right swipe background (send AI reply) */}
      {isRight && actionVisible && (
        <div
          className="absolute inset-y-0 left-0 flex items-center px-5 bg-emerald-600"
          style={{ width: `${Math.min(absX, 120)}px` }}
        >
          <div className="flex items-center gap-2 text-white">
            <span className="text-lg">✅</span>
            {absX > 60 && <span className="text-xs font-bold whitespace-nowrap">Envoyer réponse IA</span>}
          </div>
        </div>
      )}

      {/* Left swipe background (archive) */}
      {isLeft && actionVisible && (
        <div
          className="absolute inset-y-0 right-0 flex items-center justify-end px-5 bg-orange-500"
          style={{ width: `${Math.min(absX, 120)}px` }}
        >
          <div className="flex items-center gap-2 text-white">
            {absX > 60 && <span className="text-xs font-bold whitespace-nowrap">Archiver</span>}
            <span className="text-lg">📦</span>
          </div>
        </div>
      )}

      {/* Message card */}
      <button
        type="button"
        onClick={() => {
          // On desktop (no drag), just select
          if (!isDragging && deltaX === 0) onSelect(msg);
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          transform: `translateX(${deltaX}px)`,
          transition: snapping ? 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)' : isDragging ? 'none' : 'transform 0.2s ease',
          willChange: isDragging ? 'transform' : 'auto',
        }}
        className={cn(
          'w-full text-left px-4 py-3 flex items-start gap-3 bg-card hover:bg-secondary/60 select-none cursor-pointer',
          isSelected && 'bg-secondary border-l-2 border-l-primary',
          !msg.isRead && 'bg-primary/[0.03]',
        )}
      >
        {/* Channel icon badge */}
        <div className="relative shrink-0">
          <ChannelIcon channel={msg.channel} size="md" />
          <span className="sr-only">{msg.channel}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className={cn('text-sm truncate', !msg.isRead ? 'font-semibold text-foreground' : 'font-medium text-foreground/80')}>
              {msg.senderName}
            </span>
            <span className="text-[11px] text-muted-foreground shrink-0">{msg.date}</span>
          </div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <ChannelBadge channel={msg.channel} />
            <p className={cn('text-xs truncate', !msg.isRead ? 'text-foreground font-medium' : 'text-muted-foreground')}>
              {msg.subject}
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground truncate">{msg.preview}</p>
        </div>

        {/* Unread dot */}
        {!msg.isRead && (
          <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
        )}
      </button>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyInbox() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 px-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p className="text-sm font-semibold text-foreground mb-1">Aucun message</p>
      <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
        Vos messages clients apparaîtront ici dès qu'ils vous contacteront.
      </p>
    </div>
  );
}

// ── MessageList ───────────────────────────────────────────────────────────────

export function MessageList({ messages, selectedId, onSelect, onArchive }: MessageListProps) {
  if (messages.length === 0) return <EmptyInbox />;
  return (
    <div className="flex flex-col overflow-y-auto h-full">
      {messages.map(msg => (
        <SwipeableItem
          key={msg.id}
          msg={msg}
          isSelected={selectedId === msg.id}
          onSelect={onSelect}
          onArchive={onArchive}
        />
      ))}
    </div>
  );
}
