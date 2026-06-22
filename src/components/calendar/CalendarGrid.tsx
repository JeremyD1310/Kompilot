import { useMemo, useRef, useState } from 'react';
import { addDays, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isToday } from 'date-fns';
import { Check, Pencil } from 'lucide-react';
import type { ScheduledPost } from './CreatePostModal';
import { InlinePostEditor } from './InlinePostEditor';
import { useUserRole } from '../../context/UserRoleContext';
import { toast } from '@blinkdotnew/ui';
import { getFrenchHolidaysForYears } from '../../lib/frenchHolidays';
import { useDraggable, useDroppable } from '@dnd-kit/core';

interface CalendarGridProps {
  currentMonth: Date;
  posts: ScheduledPost[];
  onDayClick: (date: string) => void;
  onApprovePost?: (postId: string) => void;
  onMovePost?: (postId: string, newDate: string) => void;
  onEditPost?: (updated: ScheduledPost) => void;
  onDeletePost?: (postId: string) => void;
  onOpenFullEditor?: (post: ScheduledPost) => void;
}

// ── Draggable post chip ──────────────────────────────────────────────────────
function DraggablePost({
  post,
  isAdmin,
  onApprovePost,
  onPostClick,
}: {
  post: ScheduledPost;
  isAdmin: boolean;
  onApprovePost?: (postId: string) => void;
  onPostClick: (post: ScheduledPost, el: HTMLElement) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: post.id });
  const chipRef = useRef<HTMLDivElement>(null);
  const s = post.status ?? 'draft';

  // Separate drag listeners from click — we track pointer movement to
  // distinguish a tap from a drag start.
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    // Only open inline editor if the pointer didn't move much (not a drag)
    if (pointerDownPos.current) {
      const dx = e.clientX - pointerDownPos.current.x;
      const dy = e.clientY - pointerDownPos.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > 6) return; // was a drag
    }
    if (chipRef.current) {
      onPostClick(post, chipRef.current);
    }
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        (chipRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      {...listeners}
      {...attributes}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      data-status={s}
      className={`rounded px-1.5 py-0.5 border truncate group cursor-pointer ${STATUS_STYLES[s]} ${
        isDragging ? 'opacity-50' : 'hover:ring-1 hover:ring-primary/40 hover:shadow-sm transition-shadow'
      }`}
      style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
      title={`${post.text} — cliquer pour modifier`}
    >
      <div className="flex items-center gap-1">
        <StatusDot status={s} />
        <span className={`text-[11px] font-medium leading-tight block truncate flex-1 ${STATUS_TEXT[s]}`}>
          {post.text.length > 28 ? post.text.slice(0, 26) + '…' : post.text}
        </span>
        {/* Edit pencil — visible on hover */}
        <Pencil
          size={9}
          className="shrink-0 opacity-0 group-hover:opacity-60 transition-opacity text-muted-foreground"
        />
      </div>
      <div className="flex items-center gap-0.5 mt-0.5 flex-wrap">
        {post.channels.slice(0, 3).map(c => (
          <span
            key={c}
            className={`inline-block w-2 h-2 rounded-full ${CHANNEL_COLORS[c] ?? 'bg-muted-foreground'}`}
            title={CHANNEL_LABELS[c]}
          />
        ))}
        {isAdmin && s === 'pending' && onApprovePost && (
          <button
            onClick={e => {
              e.stopPropagation();
              onApprovePost(post.id);
              toast.success('Publication approuvée !');
            }}
            className="ml-auto flex items-center gap-0.5 rounded bg-green-500 hover:bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 transition-colors"
            title="Approuver (Admin)"
          >
            <Check size={8} strokeWidth={3} /> Approuver
          </button>
        )}
      </div>
    </div>
  );
}

// ── Droppable day cell ───────────────────────────────────────────────────────
function DroppableDay({
  dateStr,
  isCurrentMonth,
  today,
  holidayName,
  hasPending,
  dayPosts,
  isAdmin,
  onDayClick,
  onApprovePost,
  onPostClick,
  day,
}: {
  dateStr: string;
  isCurrentMonth: boolean;
  today: boolean;
  holidayName: string | undefined;
  hasPending: boolean;
  dayPosts: ScheduledPost[];
  isAdmin: boolean;
  onDayClick: (date: string) => void;
  onApprovePost?: (postId: string) => void;
  onPostClick: (post: ScheduledPost, el: HTMLElement) => void;
  day: Date;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dateStr });

  return (
    <div
      ref={setNodeRef}
      onClick={() => isCurrentMonth && onDayClick(dateStr)}
      className={`min-h-[110px] p-2 transition-colors duration-150 ${
        isCurrentMonth
          ? 'cursor-pointer hover:bg-secondary/60'
          : 'opacity-30 bg-muted/10 cursor-default'
      } ${today ? 'ring-2 ring-inset ring-primary/60' : ''} ${
        holidayName && isCurrentMonth ? 'bg-amber-50/60 dark:bg-amber-950/20' : ''
      } ${isOver && isCurrentMonth ? 'bg-primary/10' : ''}`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium transition-colors ${
          today ? 'bg-primary text-primary-foreground font-bold' : 'text-foreground hover:bg-muted'
        }`}>
          {format(day, 'd')}
        </div>
        {hasPending && (
          <span className="text-[9px] font-bold bg-orange-100 text-orange-600 rounded-full px-1.5 py-0.5 border border-orange-200">
            En attente
          </span>
        )}
      </div>

      {/* Jour férié */}
      {holidayName && isCurrentMonth && (
        <div className="mb-1 flex items-center gap-1" title={holidayName}>
          <span className="text-[9px] leading-tight font-semibold text-amber-700 bg-amber-100 border border-amber-200 rounded px-1.5 py-0.5 truncate w-full block">
            🇫🇷 {holidayName}
          </span>
        </div>
      )}

      <div className="space-y-0.5">
        {dayPosts.slice(0, 3).map(post => (
          <DraggablePost
            key={post.id}
            post={post}
            isAdmin={isAdmin}
            onApprovePost={onApprovePost}
            onPostClick={onPostClick}
          />
        ))}
        {dayPosts.length > 3 && (
          <span className="text-[10px] text-muted-foreground px-1">+{dayPosts.length - 3} de plus</span>
        )}
      </div>
    </div>
  );
}

const CHANNEL_COLORS: Record<string, string> = {
  website:         'bg-primary/80',
  linkedin:        'bg-blue-600',
  instagram:       'bg-pink-500',
  tiktok:          'bg-foreground',
  facebook:        'bg-blue-500',
  google_business: 'bg-orange-500',
};

const CHANNEL_LABELS: Record<string, string> = {
  website:         'Blog',
  linkedin:        'LinkedIn',
  instagram:       'Instagram',
  tiktok:          'TikTok',
  facebook:        'Facebook',
  google_business: 'Google',
};

const STATUS_STYLES: Record<string, string> = {
  draft:    'bg-muted/60 border-border/60',
  pending:  'bg-orange-50 border-orange-300',
  approved: 'bg-green-50 border-green-300',
};

const STATUS_TEXT: Record<string, string> = {
  draft:    'text-muted-foreground',
  pending:  'text-orange-700',
  approved: 'text-green-700',
};

function StatusDot({ status }: { status: string }) {
  if (status === 'pending')  return <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0 animate-pulse" title="En attente de validation" />;
  if (status === 'approved') return <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" title="Approuvé" />;
  return <span className="w-2 h-2 rounded-full bg-muted-foreground/30 shrink-0" title="Brouillon" />;
}

export function CalendarGrid({
  currentMonth,
  posts,
  onDayClick,
  onApprovePost,
  onMovePost,
  onEditPost,
  onDeletePost,
  onOpenFullEditor,
}: CalendarGridProps) {
  const { isAdmin } = useUserRole();

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
    toast.success('✅ Post mis à jour !');
  };

  const handleDelete = (postId: string) => {
    onDeletePost?.(postId);
    setEditingPost(null);
    toast.success('🗑️ Post supprimé.');
  };

  const handleOpenFull = (post: ScheduledPost) => {
    setEditingPost(null);
    onOpenFullEditor?.(post);
  };

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    const result: Date[] = [];
    let d = start;
    while (d <= end) { result.push(d); d = addDays(d, 1); }
    return result;
  }, [currentMonth]);

  // Build holidays map — include prev/next year to cover edge months (Jan, Dec)
  const holidays = useMemo(() => {
    const y = currentMonth.getFullYear();
    return getFrenchHolidaysForYears([y - 1, y, y + 1]);
  }, [currentMonth]);

  const postsMap = useMemo(() => {
    const m: Record<string, ScheduledPost[]> = {};
    posts.forEach(p => {
      if (!m[p.date]) m[p.date] = [];
      m[p.date].push(p);
    });
    return m;
  }, [posts]);

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <>
      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
        {/* Week headers */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/30">
          {weekDays.map(d => (
            <div key={d} className="py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-border">
          {days.map((day, i) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayPosts = postsMap[dateStr] ?? [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);
            const hasPending = dayPosts.some(p => (p.status ?? 'draft') === 'pending');
            const holidayName = holidays[dateStr];

            return (
              <DroppableDay
                key={i}
                day={day}
                dateStr={dateStr}
                isCurrentMonth={isCurrentMonth}
                today={today}
                hasPending={hasPending}
                holidayName={holidayName}
                dayPosts={dayPosts}
                isAdmin={isAdmin}
                onDayClick={onDayClick}
                onApprovePost={onApprovePost}
                onPostClick={handlePostClick}
              />
            );
          })}
        </div>
      </div>

      {/* Inline editor popover — rendered in a portal-like fixed layer */}
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
