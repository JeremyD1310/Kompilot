/**
 * ScheduledPostsStatusPanel — Tableau de bord des publications planifiées
 * avec statuts de publication par réseau social, et actions rapides.
 */
import { useState, type ReactElement } from 'react';
import { Badge, Button, toast } from '@blinkdotnew/ui';
import { Calendar, Check, Clock, AlertCircle, Send, Trash2, ExternalLink, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ScheduledPost } from './CreatePostModal';
import { format, parseISO, isAfter, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { usePublishNow } from '../../hooks/useSocialPublish';

const PLATFORM_META: Record<string, { label: string; color: string; bg: string }> = {
  linkedin:        { label: 'LinkedIn',   color: 'text-blue-600',   bg: 'bg-blue-100'   },
  instagram:       { label: 'Instagram',  color: 'text-pink-600',   bg: 'bg-pink-100'   },
  facebook:        { label: 'Facebook',   color: 'text-blue-500',   bg: 'bg-blue-50'    },
  tiktok:          { label: 'TikTok',     color: 'text-foreground', bg: 'bg-muted'      },
  google_business: { label: 'Google',     color: 'text-orange-500', bg: 'bg-orange-50'  },
  website:         { label: 'Blog',       color: 'text-primary',    bg: 'bg-primary/10' },
  youtube:         { label: 'YouTube',    color: 'text-red-600',    bg: 'bg-red-50'     },
};

const STATUS_CONFIG: Record<string, { label: string; icon: ReactElement; dot: string }> = {
  draft:    { label: 'Brouillon',    icon: <AlertCircle size={11} />, dot: 'bg-muted-foreground/40' },
  pending:  { label: 'En attente',  icon: <Clock size={11} />,       dot: 'bg-orange-400 animate-pulse' },
  approved: { label: 'Planifié',    icon: <Check size={11} />,       dot: 'bg-green-500' },
};

interface Props {
  posts: ScheduledPost[];
  onDeletePost: (id: string) => void;
  onEditPost: (post: ScheduledPost) => void;
  className?: string;
}

function PostRow({ post, onDelete, onEdit }: { post: ScheduledPost; onDelete: () => void; onEdit: () => void }) {
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const publishNow = usePublishNow();
  const isUpcoming = post.date ? isAfter(parseISO(post.date), new Date()) : false;
  const statusCfg = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.draft;

  const handlePublishNow = async () => {
    if (publishing) return;
    setPublishing(true);
    try {
      const result = await publishNow.mutateAsync({
        postId: post.id,
        channels: post.channels,
        text: post.text,
      });
      const successes = result.results.filter(item => item.success);
      const failures = result.results.filter(item => !item.success);
      if (!successes.length) throw new Error(failures.map(item => `${item.platform}: ${item.error || 'refusé'}`).join(' · ') || 'Aucune plateforme n’a accepté la publication.');
      setPublished(true);
      toast.success(failures.length ? 'Publication partielle envoyée' : 'Publication envoyée !', {
        description: failures.length ? `${successes.length} réussie(s), ${failures.length} en échec` : `Post diffusé sur ${successes.map(item => item.platform).join(', ')}`,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la publication');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className={cn(
      'group rounded-xl border px-4 py-3 space-y-2 transition-all',
      published ? 'opacity-50 border-green-200 bg-green-50/30' : 'border-border bg-card hover:border-primary/20 hover:shadow-sm',
    )}>
      <div className="flex items-start gap-3">
        {/* Status dot */}
        <span className={cn('mt-1 shrink-0 w-2 h-2 rounded-full', published ? 'bg-green-500' : statusCfg.dot)} />

        <div className="flex-1 min-w-0">
          {/* Text */}
          <p className="text-xs text-foreground leading-relaxed line-clamp-2">{post.text}</p>

          {/* Date + channels */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {post.date && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Calendar size={10} />
                <span>{format(parseISO(post.date), 'd MMM', { locale: fr })}</span>
                {post.time && <span>· {post.time}</span>}
              </div>
            )}
            {post.channels.map(ch => {
              const meta = PLATFORM_META[ch] ?? { label: ch, color: 'text-foreground', bg: 'bg-muted' };
              return (
                <span key={ch} className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full', meta.bg, meta.color)}>
                  {meta.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* Status badge */}
        <div className="shrink-0">
          {published ? (
            <Badge className="text-[9px] bg-green-100 text-green-700 border-green-200">
              <Check size={9} className="mr-0.5" /> Publié
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[9px]">
              {statusCfg.label}
            </Badge>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {!published && (
        <div className="flex items-center gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="h-6 text-[10px] font-medium px-2 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Éditer
          </button>
          {post.status === 'approved' && isUpcoming && (
            <button
              onClick={handlePublishNow}
              disabled={publishing}
              className="h-6 text-[10px] font-semibold px-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors gap-1 flex items-center"
            >
              {publishing
                ? <RefreshCw size={9} className="animate-spin" />
                : <Send size={9} />}
              Publier maintenant
            </button>
          )}
          <button
            onClick={onDelete}
            className="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}
    </div>
  );
}

export function ScheduledPostsStatusPanel({ posts, onDeletePost, onEditPost, className }: Props) {
  const [statusFilter, setStatusFilter] = useState<'all' | ScheduledPost['status']>('all');

  const sorted = [...posts].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date < b.date ? -1 : 1;
  });

  const filtered = statusFilter === 'all' ? sorted : sorted.filter(p => p.status === statusFilter);

  // Stats
  const draftCount    = posts.filter(p => p.status === 'draft').length;
  const pendingCount  = posts.filter(p => p.status === 'pending').length;
  const approvedCount = posts.filter(p => p.status === 'approved').length;

  // Next 7 days
  const now = new Date();
  const in7 = addDays(now, 7);
  const upcoming = posts.filter(p => {
    if (!p.date) return false;
    const d = parseISO(p.date);
    return isAfter(d, now) && isAfter(in7, d);
  });

  return (
    <div className={cn('rounded-2xl border border-border bg-card overflow-hidden', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-foreground">Publications planifiées</p>
            <p className="text-[10px] text-muted-foreground">
              {upcoming.length} dans les 7 prochains jours · {posts.length} au total
            </p>
          </div>
          <ExternalLink size={13} className="text-muted-foreground" />
        </div>

        {/* Stats pills */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {[
            { id: 'all',      label: `Tous (${posts.length})`,         dot: 'bg-muted-foreground/40' },
            { id: 'draft',    label: `Brouillons (${draftCount})`,      dot: 'bg-muted-foreground/40' },
            { id: 'pending',  label: `En attente (${pendingCount})`,    dot: 'bg-orange-400' },
            { id: 'approved', label: `Planifiés (${approvedCount})`,    dot: 'bg-green-500' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id as typeof statusFilter)}
              className={cn(
                'flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all',
                statusFilter === f.id
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', f.dot)} />
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Posts list */}
      <div className="p-3 space-y-2 max-h-[460px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
            <Calendar size={28} className="opacity-20" />
            <p className="text-xs">Aucune publication dans ce filtre</p>
          </div>
        ) : (
          filtered.map(post => (
            <PostRow
              key={post.id}
              post={post}
              onDelete={() => onDeletePost(post.id)}
              onEdit={() => onEditPost(post)}
            />
          ))
        )}
      </div>
    </div>
  );
}
