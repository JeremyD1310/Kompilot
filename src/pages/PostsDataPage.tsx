import React, { useState, useMemo } from 'react';
import {
  Page,
  PageHeader,
  PageTitle,
  PageDescription,
  PageBody,
  Button,
  Badge,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from '@blinkdotnew/ui';
import {
  Search,
  Trash2,
  Database,
  CalendarDays,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import { PostPerformanceDashboard } from '../components/dashboard/PostPerformanceDashboard';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blink } from '../blink/client';
import { useAuth } from '../hooks/useAuth';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ScheduledPost {
  id: string;
  userId: string;
  establishmentId?: string;
  textContent: string;
  imageUrl?: string;
  scheduledAt?: string;
  channels: string;
  status: 'draft' | 'scheduled' | 'published';
  platformVariants?: string;
  createdAt?: string;
  updatedAt?: string;
}

type StatusFilter = 'all' | 'draft' | 'scheduled' | 'published';

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseChannels(raw?: string): string[] {
  try {
    return JSON.parse(raw || '[]');
  } catch {
    return [];
  }
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'd MMM yyyy, HH:mm', { locale: fr });
  } catch {
    return dateStr;
  }
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  draft: { label: 'Brouillon', className: 'text-muted-foreground border-border bg-muted/40' },
  scheduled: { label: 'Planifié', className: 'bg-blue-500/10 text-blue-600 border-blue-300/50' },
  published: { label: 'Publié', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-300/50' },
};

// ── Channel color map ─────────────────────────────────────────────────────────
const CHANNEL_CONFIG: Record<string, { label: string; className: string }> = {
  instagram: { label: 'Instagram', className: 'bg-pink-500/10 text-pink-600 border-pink-300/40' },
  facebook: { label: 'Facebook', className: 'bg-blue-500/10 text-blue-600 border-blue-300/40' },
  linkedin: { label: 'LinkedIn', className: 'bg-blue-700/10 text-blue-800 border-blue-600/40' },
  google_business: { label: 'Google', className: 'bg-orange-500/10 text-orange-600 border-orange-300/40' },
  tiktok: { label: 'TikTok', className: 'bg-foreground/5 text-foreground border-border' },
  website: { label: 'Site web', className: 'bg-primary/10 text-primary border-primary/30' },
};

function ChannelBadge({ channel }: { channel: string }) {
  const config = CHANNEL_CONFIG[channel] ?? {
    label: channel,
    className: 'bg-muted text-muted-foreground border-border',
  };
  return (
    <Badge className={`text-[10px] px-1.5 py-0.5 border font-medium rounded-md ${config.className}`}>
      {config.label}
    </Badge>
  );
}

// ── Status badge with dropdown ─────────────────────────────────────────────────
function StatusBadgeDropdown({
  postId,
  status,
  onUpdate,
}: {
  postId: string;
  status: ScheduledPost['status'];
  onUpdate: (id: string, newStatus: ScheduledPost['status']) => void;
}) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;

  return (
    <div className="relative inline-block">
      <button
        className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md border cursor-pointer hover:opacity-80 transition-opacity ${cfg.className}`}
        onClick={() => setOpen(v => !v)}
        title="Changer le statut"
      >
        {cfg.label}
        <RefreshCw size={9} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-xl shadow-lg p-1 min-w-[120px]"
          >
            {(Object.keys(STATUS_CONFIG) as ScheduledPost['status'][]).map(s => (
              <button
                key={s}
                className={`w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-muted/60 transition-colors font-medium ${
                  s === status ? 'text-primary' : 'text-foreground'
                }`}
                onClick={() => {
                  onUpdate(postId, s);
                  setOpen(false);
                }}
              >
                {STATUS_CONFIG[s].label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Delete confirm modal ──────────────────────────────────────────────────────
function DeleteModal({
  open,
  onClose,
  onConfirm,
  isDeleting,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>🗑️ Supprimer ce post ?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Cette action est irréversible. Le post sera définitivement supprimé.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Post row ──────────────────────────────────────────────────────────────────
function PostRow({
  post,
  onUpdateStatus,
  onDelete,
  isUpdating,
}: {
  post: ScheduledPost;
  onUpdateStatus: (id: string, status: ScheduledPost['status']) => void;
  onDelete: (id: string) => void;
  isUpdating: boolean;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const channelList = parseChannels(post.channels);
  const preview =
    post.textContent.length > 80
      ? post.textContent.slice(0, 80) + '…'
      : post.textContent;

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
      >
        {/* Text preview */}
        <td className="px-4 py-3 max-w-[260px]">
          <p className="text-sm text-foreground leading-relaxed">{preview}</p>
        </td>

        {/* Channels */}
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {channelList.length > 0
              ? channelList.map(ch => <ChannelBadge key={ch} channel={ch} />)
              : <span className="text-xs text-muted-foreground">—</span>
            }
          </div>
        </td>

        {/* Scheduled date */}
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays size={12} />
            {formatDate(post.scheduledAt)}
          </div>
        </td>

        {/* Status */}
        <td className="px-4 py-3">
          <StatusBadgeDropdown
            postId={post.id}
            status={post.status}
            onUpdate={onUpdateStatus}
          />
        </td>

        {/* Actions */}
        <td className="px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg"
            onClick={() => setDeleteOpen(true)}
            disabled={isUpdating}
          >
            <Trash2 size={13} />
          </Button>
        </td>
      </motion.tr>

      <DeleteModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => { onDelete(post.id); setDeleteOpen(false); }}
        isDeleting={false}
      />
    </>
  );
}

// ── Filter pills ──────────────────────────────────────────────────────────────
function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 ${
        active
          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
          : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PostsDataPage() {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'gestion' | 'performance'>('gestion');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch posts
  const { data: posts = [], isLoading } = useQuery<ScheduledPost[]>({
    queryKey: ['scheduledPosts', userId],
    queryFn: async () => {
      if (!userId) return [];
      const rows = await blink.db.scheduledPosts.list({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        limit: 50,
      });
      return rows as ScheduledPost[];
    },
    enabled: !!userId,
  });

  // Update status mutation
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ScheduledPost['status'] }) => {
      return blink.db.scheduledPosts.update(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledPosts', userId] });
      toast.success('Statut mis à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  // Delete mutation
  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      return blink.db.scheduledPosts.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledPosts', userId] });
      toast.success('Post supprimé');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  // All unique channels from posts
  const allChannels = useMemo(() => {
    const set = new Set<string>();
    posts.forEach(p => parseChannels(p.channels).forEach(ch => set.add(ch)));
    return Array.from(set);
  }, [posts]);

  // Filtered posts
  const filtered = useMemo(() => {
    return posts.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (channelFilter !== 'all') {
        const chs = parseChannels(p.channels);
        if (!chs.includes(channelFilter)) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!p.textContent.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [posts, statusFilter, channelFilter, searchQuery]);

  const handleUpdateStatus = (id: string, status: ScheduledPost['status']) => {
    updateStatus.mutate({ id, status });
  };

  const handleDelete = (id: string) => {
    deletePost.mutate(id);
  };

  // Stats
  const stats = useMemo(() => ({
    total: posts.length,
    draft: posts.filter(p => p.status === 'draft').length,
    scheduled: posts.filter(p => p.status === 'scheduled').length,
    published: posts.filter(p => p.status === 'published').length,
  }), [posts]);

  return (
    <Page>
      <PageHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Database size={20} className="text-primary" />
          </div>
          <div>
            <PageTitle>📋 Base de données Posts</PageTitle>
            <PageDescription>
              Gérez vos posts et suivez leurs performances en temps réel
            </PageDescription>
          </div>
        </div>
      </PageHeader>

      <PageBody>
        {/* ── Tab switcher ── */}
        <div className="flex gap-2 mb-6">
          {([
            { key: 'gestion',     label: 'Gestion des posts', icon: <Database size={14} /> },
            { key: 'performance', label: '📈 Performance',     icon: <BarChart3 size={14} /> },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border transition-all ${
                activeTab === t.key
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground'
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* ── Performance tab ── */}
        {activeTab === 'performance' && <PostPerformanceDashboard />}

        {/* ── Gestion tab ── */}
        {activeTab === 'gestion' && (<>
        {/* Stats strip */}
        {!isLoading && posts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-3 mb-5"
          >
            {[
              { label: 'Total', count: stats.total, cls: 'text-foreground' },
              { label: 'Brouillons', count: stats.draft, cls: 'text-muted-foreground' },
              { label: 'Planifiés', count: stats.scheduled, cls: 'text-blue-600' },
              { label: 'Publiés', count: stats.published, cls: 'text-emerald-600' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2">
                <span className={`text-lg font-bold ${s.cls}`}>{s.count}</span>
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {/* Status filters */}
          <div className="flex items-center gap-1.5">
            <FilterPill active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>Tous</FilterPill>
            <FilterPill active={statusFilter === 'draft'} onClick={() => setStatusFilter('draft')}>Brouillon</FilterPill>
            <FilterPill active={statusFilter === 'scheduled'} onClick={() => setStatusFilter('scheduled')}>Planifié</FilterPill>
            <FilterPill active={statusFilter === 'published'} onClick={() => setStatusFilter('published')}>Publié</FilterPill>
          </div>

          {/* Channel filter */}
          {allChannels.length > 0 && (
            <div className="flex items-center gap-1.5">
              <FilterPill active={channelFilter === 'all'} onClick={() => setChannelFilter('all')}>
                Tous canaux
              </FilterPill>
              {allChannels.map(ch => (
                <FilterPill key={ch} active={channelFilter === ch} onClick={() => setChannelFilter(ch)}>
                  {CHANNEL_CONFIG[ch]?.label ?? ch}
                </FilterPill>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative ml-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8 h-8 text-sm w-52 rounded-xl"
              placeholder="Rechercher un post..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="h-4 bg-muted rounded flex-1" />
                  <div className="h-4 bg-muted rounded w-32" />
                  <div className="h-4 bg-muted rounded w-28" />
                  <div className="h-4 bg-muted rounded w-20" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <Database size={40} className="text-muted-foreground/40 mb-4" />
              <p className="text-sm font-semibold text-foreground mb-1">
                {posts.length === 0 ? 'Aucun post trouvé' : 'Aucun résultat'}
              </p>
              <p className="text-xs text-muted-foreground">
                {posts.length === 0
                  ? 'Créez votre premier post depuis le Calendrier.'
                  : 'Essayez de modifier vos filtres ou votre recherche.'}
              </p>
            </motion.div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Contenu</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Canaux</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Date planifiée</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Statut</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {filtered.map(post => (
                      <PostRow
                        key={post.id}
                        post={post}
                        onUpdateStatus={handleUpdateStatus}
                        onDelete={handleDelete}
                        isUpdating={updateStatus.isPending}
                      />
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Row count */}
        {!isLoading && filtered.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3">
            {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
            {filtered.length !== posts.length && ` sur ${posts.length}`}
          </p>
        )}
        </>)}
      </PageBody>
    </Page>
  );
}
