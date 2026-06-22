/**
 * PostComments — Threaded comments on a calendar post.
 * Used inside the CreatePostModal or InlinePostEditor as a collapsible panel.
 */
import { useState } from 'react';
import { MessageSquare, CheckCircle2, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blink } from '../../blink/client';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@blinkdotnew/ui';

interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  isResolved: boolean;
  createdAt: string;
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2) return "à l'instant";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
}

function normalise(r: Record<string, unknown>): PostComment {
  return {
    id: String(r.id ?? ''),
    postId: String(r.postId ?? r.post_id ?? ''),
    authorId: String(r.authorId ?? r.author_id ?? ''),
    authorName: String(r.authorName ?? r.author_name ?? ''),
    content: String(r.content ?? ''),
    isResolved: Number(r.isResolved ?? r.is_resolved ?? 0) > 0,
    createdAt: String(r.createdAt ?? r.created_at ?? new Date().toISOString()),
  };
}

interface PostCommentsProps {
  postId: string;
  workspaceOwnerId: string;
  defaultOpen?: boolean;
}

export function PostComments({ postId, workspaceOwnerId, defaultOpen = false }: PostCommentsProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(defaultOpen);
  const [input, setInput] = useState('');

  const { data: comments = [], isLoading } = useQuery<PostComment[]>({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      if (!postId) return [];
      const rows = await blink.db.postComments.list({
        where: { postId },
        orderBy: { createdAt: 'asc' },
        limit: 50,
      });
      return (rows as Record<string, unknown>[]).map(normalise).filter(c => !c.isResolved || c.isResolved === false);
    },
    enabled: !!postId && open,
    staleTime: 15_000,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id || !content.trim()) return;
      await blink.db.postComments.create({
        id: `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        postId,
        workspaceOwnerId,
        authorId: user.id,
        authorName: user.displayName ?? user.email ?? 'Moi',
        authorAvatar: '',
        content: content.trim(),
        isResolved: 0,
      });
    },
    onSuccess: () => {
      setInput('');
      qc.invalidateQueries({ queryKey: ['post-comments', postId] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await blink.db.postComments.update(commentId, { isResolved: 1 });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['post-comments', postId] }),
  });

  const unresolvedCount = comments.filter(c => !c.isResolved).length;

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <MessageSquare size={13} className="text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">
            Commentaires équipe
          </span>
          {unresolvedCount > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {unresolvedCount}
            </span>
          )}
        </div>
        {open ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-3 pb-3">
          {/* Comment list */}
          {isLoading && (
            <div className="space-y-2 pt-2">
              {[1, 2].map(i => <div key={i} className="h-12 rounded-lg bg-muted/30 animate-pulse" />)}
            </div>
          )}

          {!isLoading && comments.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">Aucun commentaire. Soyez le premier !</p>
          )}

          <div className="space-y-2 pt-2 max-h-48 overflow-y-auto">
            {comments.map(comment => (
              <div key={comment.id} className={cn(
                'flex gap-2 p-2 rounded-lg border',
                comment.isResolved
                  ? 'bg-muted/20 border-border/50 opacity-50'
                  : 'bg-background border-border',
              )}>
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-[9px] flex items-center justify-center shrink-0">
                  {comment.authorName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-semibold text-foreground">{comment.authorName}</span>
                    <span className="text-[10px] text-muted-foreground">{timeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed">{comment.content}</p>
                </div>
                {!comment.isResolved && comment.authorId !== user?.id && (
                  <button
                    onClick={() => resolveMutation.mutate(comment.id)}
                    title="Marquer comme résolu"
                    className="shrink-0 text-muted-foreground hover:text-green-600 transition-colors p-1"
                  >
                    <CheckCircle2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendMutation.mutate(input); } }}
              placeholder="Ajouter un commentaire…"
              className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
            />
            <Button
              size="sm"
              onClick={() => sendMutation.mutate(input)}
              disabled={!input.trim() || sendMutation.isPending}
              className="h-7 w-7 p-0 rounded-lg"
            >
              <Send size={11} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
