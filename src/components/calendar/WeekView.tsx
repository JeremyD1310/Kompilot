import { useMemo, useRef, useState } from 'react';
import { addDays, format, startOfWeek, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Pencil } from 'lucide-react';
import type { ScheduledPost } from './CreatePostModal';
import { InlinePostEditor } from './InlinePostEditor';

interface WeekViewProps {
  currentDate: Date;
  posts: ScheduledPost[];
  onDayClick: (date: string) => void;
  onEditPost?: (updated: ScheduledPost) => void;
  onDeletePost?: (postId: string) => void;
  onOpenFullEditor?: (post: ScheduledPost) => void;
}

const CHANNEL_COLORS: Record<string, string> = {
  website: 'bg-primary/80 text-primary-foreground',
  linkedin: 'bg-blue-600 text-white',
  instagram: 'bg-pink-500 text-white',
  tiktok: 'bg-foreground text-background',
  facebook: 'bg-blue-500 text-white',
  google_business: 'bg-orange-500 text-white',
};

const CHANNEL_LABELS: Record<string, string> = {
  website: 'Blog',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  google_business: 'Google',
};

const STATUS_BORDER: Record<string, string> = {
  draft:    'border-border/50 bg-muted/30',
  pending:  'border-orange-300 bg-orange-50/60',
  approved: 'border-green-300 bg-green-50/60',
};

const STATUS_DOT: Record<string, string> = {
  draft:    'bg-muted-foreground/30',
  pending:  'bg-orange-400 animate-pulse',
  approved: 'bg-green-500',
};

// AI-optimised posting slots per weekday (0=Mon, 6=Sun)
const AI_SLOTS: Record<number, { time: string; label: string; channel: string }> = {
  0: { time: '07h30', label: 'Pic LinkedIn matin',   channel: 'LinkedIn'   },
  1: { time: '12h30', label: 'Pic Instagram midi',   channel: 'Instagram'  },
  2: { time: '18h00', label: 'Soirée Facebook',       channel: 'Facebook'   },
  3: { time: '12h00', label: 'Pic LinkedIn midi',    channel: 'LinkedIn'   },
  4: { time: '08h00', label: 'Stories Instagram',    channel: 'Instagram'  },
  5: { time: '10h00', label: 'Reach Google post',    channel: 'Google'     },
  6: { time: '11h00', label: 'Engagement Facebook',  channel: 'Facebook'   },
};

// ── Clickable post chip ──────────────────────────────────────────────────────
function PostChip({
  post,
  onPostClick,
}: {
  post: ScheduledPost;
  onPostClick: (post: ScheduledPost, el: HTMLElement) => void;
}) {
  const chipRef = useRef<HTMLDivElement>(null);
  const s = post.status ?? 'draft';
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (pointerDownPos.current) {
      const dx = e.clientX - pointerDownPos.current.x;
      const dy = e.clientY - pointerDownPos.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > 6) return;
    }
    if (chipRef.current) {
      onPostClick(post, chipRef.current);
    }
  };

  return (
    <div
      ref={chipRef}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      className={`rounded-lg border px-2 py-1.5 space-y-1 cursor-pointer group hover:ring-1 hover:ring-primary/40 hover:shadow-sm transition-all ${STATUS_BORDER[s] ?? 'border-border/50 bg-muted/30'}`}
      title={`${post.text} — cliquer pour modifier`}
    >
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[s] ?? 'bg-muted-foreground/30'}`} />
        <p className="text-[10px] font-semibold text-primary leading-tight">
          {post.time}
        </p>
        <Pencil
          size={9}
          className="ml-auto shrink-0 opacity-0 group-hover:opacity-60 transition-opacity text-muted-foreground"
        />
      </div>
      <p className="text-[11px] text-foreground leading-tight line-clamp-2">
        {post.text}
      </p>
      <div className="flex flex-wrap gap-1 pt-0.5">
        {post.channels.slice(0, 3).map(c => (
          <span
            key={c}
            className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${CHANNEL_COLORS[c] ?? 'bg-muted text-muted-foreground'}`}
          >
            {CHANNEL_LABELS[c]}
          </span>
        ))}
      </div>
    </div>
  );
}

export function WeekView({
  currentDate,
  posts,
  onDayClick,
  onEditPost,
  onDeletePost,
  onOpenFullEditor,
}: WeekViewProps) {
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const postsMap = useMemo(() => {
    const m: Record<string, ScheduledPost[]> = {};
    posts.forEach(p => {
      if (!m[p.date]) m[p.date] = [];
      m[p.date].push(p);
    });
    return m;
  }, [posts]);

  // Inline editor state
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const anchorRef = useRef<HTMLElement | null>(null);

  const handlePostClick = (post: ScheduledPost, el: HTMLElement) => {
    if (editingPost?.id === post.id) {
      setEditingPost(null);
      return;
    }
    anchorRef.current = el;
    setEditingPost(post);
  };

  const handleSave = (updated: ScheduledPost) => {
    onEditPost?.(updated);
    setEditingPost(null);
  };

  const handleDelete = (postId: string) => {
    onDeletePost?.(postId);
    setEditingPost(null);
  };

  const handleOpenFull = (post: ScheduledPost) => {
    setEditingPost(null);
    onOpenFullEditor?.(post);
  };

  return (
    <>
      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
        <div className="grid grid-cols-7 border-b border-border bg-muted/30">
          {weekDays.map(day => {
            const today = isToday(day);
            return (
              <div key={day.toISOString()} className="py-3 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {format(day, 'EEE', { locale: fr })}
                </p>
                <span className={`inline-flex items-center justify-center mt-1 w-8 h-8 rounded-full text-sm font-semibold ${
                  today ? 'bg-primary text-primary-foreground' : 'text-foreground'
                }`}>
                  {format(day, 'd')}
                </span>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-7 divide-x divide-border">
          {weekDays.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayPosts = postsMap[dateStr] ?? [];

            return (
              <div
                key={dateStr}
                onClick={() => onDayClick(dateStr)}
                className="min-h-[260px] p-2 cursor-pointer hover:bg-secondary/40 transition-colors"
              >
                <div className="space-y-1.5">
                  {dayPosts.map(post => (
                    <PostChip
                      key={post.id}
                      post={post}
                      onPostClick={handlePostClick}
                    />
                  ))}
                  {dayPosts.length === 0 && (
                    <div className="h-full flex items-center justify-center">
                      <span className="text-[10px] text-muted-foreground/50 select-none">Cliquer pour ajouter</span>
                    </div>
                  )}
                  {/* AI optimised slot */}
                  {(() => {
                    const dayIdx = (day.getDay() + 6) % 7; // convert Sun=0 to Mon=0
                    const slot = AI_SLOTS[dayIdx];
                    const dayStr = format(day, 'yyyy-MM-dd');
                    const hasPost = (postsMap[dayStr] ?? []).length > 0;
                    if (!slot) return null;
                    return (
                      <div
                        className={`mt-1 flex flex-col gap-0.5 rounded-lg border border-dashed px-1.5 py-1 cursor-pointer group transition-all ${
                          hasPost
                            ? 'border-green-300/50 bg-green-50/40 hover:bg-green-50/70'
                            : 'border-border/60 bg-muted/20 hover:border-primary/40 hover:bg-primary/5'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDayClick(dayStr);
                        }}
                        title={`Créneau IA : ${slot.time} — ${slot.label}`}
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-[8px]">✨</span>
                          <span className="text-[9px] font-bold text-muted-foreground/70 group-hover:text-primary truncate">
                            {slot.time}
                          </span>
                        </div>
                        <p className="text-[8px] text-muted-foreground/60 group-hover:text-muted-foreground leading-tight truncate">
                          {slot.label}
                        </p>
                        {hasPost && (
                          <span className="text-[7px] font-bold text-green-600 uppercase tracking-wide">✓ Planifié</span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inline editor popover */}
      {editingPost && (
        <InlinePostEditor
          post={editingPost}
          anchorRef={anchorRef as React.RefObject<HTMLElement>}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setEditingPost(null)}
          onOpenFull={handleOpenFull}
        />
      )}
    </>
  );
}
