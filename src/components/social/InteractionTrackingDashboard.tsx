import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Card, CardHeader, CardTitle, CardContent,
  StatGroup, Stat, Badge, Button, DataTable, toast,
} from '@blinkdotnew/ui';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LineChart, Line,
} from 'recharts';
import {
  Eye, Heart, MessageSquare, Share2, BarChart3,
  Calendar, TrendingUp, TrendingDown, RefreshCw,
  Repeat, Trash2, CheckCircle2, Clock, Zap,
  Camera, Users, Briefcase, Globe,
} from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { useScheduledPosts, type ScheduledPost } from '../../hooks/useScheduledPosts';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// ── Platform badge ─────────────────────────────────────────────────────────────

const PLATFORM_STYLES: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  Instagram: { color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800/40', icon: <Camera size={11} /> },
  Facebook:  { color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/40', icon: <Users size={11} /> },
  LinkedIn:  { color: 'text-blue-700', bg: 'bg-blue-100 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700/40', icon: <Briefcase size={11} /> },
  Google:    { color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800/40', icon: <Globe size={11} /> },
};

function PlatformBadge({ platform }: { platform: string }) {
  const style = PLATFORM_STYLES[platform] ?? { color: 'text-muted-foreground', bg: 'bg-muted border-border', icon: null };
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border', style.bg, style.color)}>
      {style.icon} {platform}
    </span>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  draft:     { label: 'Brouillon', color: 'text-muted-foreground', bg: 'bg-muted/60 border-border/50' },
  scheduled: { label: 'Planifié',  color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40' },
  published: { label: 'Publié',    color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40' },
  failed:    { label: 'Échoué',    color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.draft;
  return (
    <span className={cn('inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border', cfg.bg, cfg.color)}>
      {cfg.label}
    </span>
  );
}

// ── Mock engagement data (simulated per-post analytics) ────────────────────────

function mockMetrics(postId: string) {
  const seed = postId.charCodeAt(0) * 17 + postId.charCodeAt(postId.length - 1);
  const views = 400 + (seed * 73) % 4200;
  const likes = Math.floor(views * (0.04 + (seed % 12) / 100));
  const comments = Math.floor(likes * (0.1 + (seed % 8) / 100));
  const shares = Math.floor(likes * (0.05 + (seed % 5) / 100));
  const rate = Number(((likes + comments + shares) / views * 100).toFixed(1));
  return { views, likes, comments, shares, rate };
}

const WEEK_DATA = [
  { day: 'Lun', interactions: 98 },
  { day: 'Mar', interactions: 145 },
  { day: 'Mer', interactions: 312 },
  { day: 'Jeu', interactions: 221 },
  { day: 'Ven', interactions: 389 },
  { day: 'Sam', interactions: 267 },
  { day: 'Dim', interactions: 183 },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseChannels(raw: string): string[] {
  try { return JSON.parse(raw); } catch { return [raw]; }
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  try { return format(parseISO(iso), 'dd MMM yyyy à HH:mm', { locale: fr }); } catch { return iso; }
}

// ── Main component ─────────────────────────────────────────────────────────────

export const InteractionTrackingDashboard: React.FC = () => {
  const { user } = useAuth();
  const { posts, isLoading, deletePost, publishPost, refresh } = useScheduledPosts();
  const [platformFilter, setPlatformFilter] = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all');

  // Filter
  const filtered = useMemo(() => {
    return posts.filter(p => {
      const channels = parseChannels(p.channels);
      const matchPlatform = platformFilter === 'all' || channels.includes(platformFilter);
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchPlatform && matchStatus;
    });
  }, [posts, platformFilter, statusFilter]);

  // Aggregate stats
  const totalViews = useMemo(() => filtered.reduce((s, p) => s + mockMetrics(p.id).views, 0), [filtered]);
  const totalInteractions = useMemo(() => filtered.reduce((s, p) => {
    const m = mockMetrics(p.id);
    return s + m.likes + m.comments + m.shares;
  }, 0), [filtered]);
  const avgRate = useMemo(() => {
    if (!filtered.length) return 0;
    return Number((filtered.reduce((s, p) => s + mockMetrics(p.id).rate, 0) / filtered.length).toFixed(1));
  }, [filtered]);
  const scheduled = posts.filter(p => p.status === 'scheduled').length;

  // Best post
  const bestPost = useMemo(() => {
    if (!filtered.length) return null;
    return filtered.reduce((best, p) => {
      return mockMetrics(p.id).rate > mockMetrics(best.id).rate ? p : best;
    });
  }, [filtered]);

  // Table columns
  const columns: ColumnDef<ScheduledPost>[] = [
    {
      accessorKey: 'textContent',
      header: 'Publication',
      cell: ({ row }) => (
        <div className="max-w-[200px]">
          <p className="text-sm font-medium truncate">{row.original.textContent}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(row.original.scheduledAt ?? row.original.createdAt)}</p>
        </div>
      ),
    },
    {
      accessorKey: 'channels',
      header: 'Réseaux',
      cell: ({ row }) => (
        <div className="flex gap-1 flex-wrap max-w-[140px]">
          {parseChannels(row.original.channels).map(ch => (
            <PlatformBadge key={ch} platform={ch} />
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'views',
      header: () => <span className="flex items-center gap-1"><Eye size={13} /> Vues</span>,
      cell: ({ row }) => <span className="tabular-nums text-sm">{mockMetrics(row.original.id).views.toLocaleString('fr-FR')}</span>,
    },
    {
      id: 'likes',
      header: () => <span className="flex items-center gap-1"><Heart size={13} /> Likes</span>,
      cell: ({ row }) => <span className="tabular-nums text-sm">{mockMetrics(row.original.id).likes.toLocaleString('fr-FR')}</span>,
    },
    {
      id: 'rate',
      header: () => <span className="flex items-center gap-1"><BarChart3 size={13} /> Taux</span>,
      cell: ({ row }) => {
        const r = mockMetrics(row.original.id).rate;
        return (
          <span className={cn('font-bold text-sm', r >= 7 ? 'text-emerald-600' : r >= 4 ? 'text-amber-600' : 'text-muted-foreground')}>
            {r}%
          </span>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {row.original.status === 'draft' && (
            <button
              onClick={async () => {
                await publishPost(row.original.id);
                toast.success('Publication marquée comme publiée');
              }}
              title="Marquer publié"
              className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors"
            >
              <CheckCircle2 size={13} />
            </button>
          )}
          <button
            onClick={async () => {
              if (!confirm('Supprimer cette publication ?')) return;
              await deletePost(row.original.id);
              toast.success('Publication supprimée');
            }}
            title="Supprimer"
            className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* KPI strip */}
      <StatGroup className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Impressions totales" value={totalViews > 0 ? totalViews.toLocaleString('fr-FR') : '—'} trend={12} trendLabel="+12% ce mois" icon={<Eye size={18} className="text-primary" />} />
        <Stat label="Interactions" value={totalInteractions > 0 ? totalInteractions.toLocaleString('fr-FR') : '—'} trend={8.5} trendLabel="+8.5%" icon={<Heart size={18} className="text-primary" />} />
        <Stat label="Taux d'engagement moy." value={avgRate > 0 ? `${avgRate}%` : '—'} trend={-1.2} trendLabel="-1.2%" icon={<TrendingUp size={18} className="text-primary" />} />
        <Stat label="Posts planifiés" value={String(scheduled)} trend={15} trendLabel="+15%" icon={<Calendar size={18} className="text-primary" />} />
      </StatGroup>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Posts table */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            {/* Filters */}
            <div className="px-5 py-3.5 border-b border-border/50 flex items-center gap-3 flex-wrap bg-muted/20">
              <div className="flex items-center gap-1">
                {(['all', 'draft', 'scheduled', 'published'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn('text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors', statusFilter === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60')}
                  >
                    {s === 'all' ? 'Tous' : STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div className="flex gap-1">
                  {['all', 'Instagram', 'LinkedIn', 'Facebook', 'Google'].map(p => (
                    <button
                      key={p}
                      onClick={() => setPlatformFilter(p)}
                      className={cn('text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors', platformFilter === p ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/60')}
                    >
                      {p === 'all' ? 'Tous réseaux' : p}
                    </button>
                  ))}
                </div>
                <button onClick={() => { refresh(); toast('Actualisation…'); }} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>

            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                  <RefreshCw size={16} className="animate-spin" /> Chargement…
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                  <BarChart3 size={36} className="opacity-25" />
                  <div className="text-center">
                    <p className="text-sm font-medium">Aucune publication</p>
                    <p className="text-xs mt-1">Planifiez votre première publication pour voir les stats ici</p>
                  </div>
                </div>
              ) : (
                <div className="[&_tr]:group">
                  <DataTable columns={columns} data={filtered} className="border-0 shadow-none" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weekly engagement chart */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 size={16} className="text-primary" /> Engagement hebdomadaire
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={WEEK_DATA} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} width={30} />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '10px', fontSize: '12px' }}
                      formatter={(v: number) => [v.toLocaleString('fr-FR'), 'Interactions']}
                    />
                    <Bar dataKey="interactions" radius={[5, 5, 0, 0]}>
                      {WEEK_DATA.map((entry, index) => (
                        <Cell key={index} fill={entry.interactions > 250 ? 'hsl(var(--primary))' : 'hsl(var(--primary)/0.5)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Best performing post */}
          {bestPost && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-primary/25 bg-primary/5 relative overflow-hidden">
                <div className="absolute top-3 right-3">
                  <span className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">🏆 Top post</span>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Meilleure performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                      <BarChart3 size={18} className="text-primary" />
                    </div>
                    <p className="text-sm font-medium line-clamp-3 leading-snug">{bestPost.textContent}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {parseChannels(bestPost.channels).map(ch => <PlatformBadge key={ch} platform={ch} />)}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: 'Vues', value: mockMetrics(bestPost.id).views },
                      { label: 'Likes', value: mockMetrics(bestPost.id).likes },
                      { label: 'Taux', value: mockMetrics(bestPost.id).rate + '%' },
                    ].map(s => (
                      <div key={s.label} className="bg-background/70 rounded-lg py-2 border border-border/50">
                        <p className="text-xs font-bold text-foreground">{typeof s.value === 'number' ? s.value.toLocaleString('fr-FR') : s.value}</p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <Button size="sm" variant="outline" className="w-full gap-2 text-xs">
                    <Repeat size={12} /> Republier ce format
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Upcoming scheduled */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock size={15} className="text-primary" /> Prochaines publications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {posts.filter(p => p.status === 'scheduled').length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar size={28} className="opacity-25 mx-auto mb-2" />
                  <p className="text-xs">Aucune publication planifiée</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {posts
                    .filter(p => p.status === 'scheduled')
                    .slice(0, 4)
                    .map(p => {
                      const channels = parseChannels(p.channels);
                      return (
                        <div key={p.id} className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border transition-colors">
                          <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{p.textContent}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Clock size={9} /> {formatDate(p.scheduledAt)}
                            </p>
                          </div>
                          <div className="flex gap-0.5 shrink-0">
                            {channels.slice(0, 2).map(ch => {
                              const style = PLATFORM_STYLES[ch];
                              return style ? (
                                <span key={ch} className={cn('text-[10px] p-1 rounded-md border', style.bg, style.color)}>{style.icon}</span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick tips */}
          <Card className="border-border/50 shadow-sm bg-gradient-to-br from-primary/5 to-violet-500/5">
            <CardContent className="p-4 space-y-2.5">
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Zap size={13} className="text-primary" /> Conseils IA cette semaine
              </p>
              {[
                'Publiez le jeudi à 14h pour LinkedIn (+23% d\'engagement)',
                'Les posts avec emoji génèrent 2x plus de réactions sur Instagram',
                'Répondez aux commentaires dans les 2h pour booster l\'algorithme',
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-primary text-xs font-bold shrink-0 mt-0.5">{i + 1}.</span>
                  <p className="text-xs text-muted-foreground leading-snug">{tip}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InteractionTrackingDashboard;
