import { Card, Badge, Button, toast } from '@blinkdotnew/ui';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { TrendingUp, Users, BarChart3, Zap, Download } from 'lucide-react';
import { PostInteractionsTracker } from './PostInteractionsTracker';
import { cn } from '../../lib/utils';

// ── Mock data ──────────────────────────────────────────────────────────────────

const TOP_POSTS = [
  {
    id: 'perf-1',
    text: '🚀 Découvrez notre nouvelle fonctionnalité IA qui va révolutionner votre présence sur les réseaux sociaux.',
    likes: 312,
    comments: 48,
    shares: 87,
    reach: 6240,
    channel: 'LinkedIn',
  },
  {
    id: 'perf-2',
    text: '💡 5 conseils pour booster votre engagement Instagram en 2024.',
    likes: 245,
    comments: 36,
    shares: 52,
    reach: 4820,
    channel: 'Instagram',
  },
  {
    id: 'perf-3',
    text: '📊 Résultats du trimestre : +42% de portée organique grâce à notre stratégie de contenu.',
    likes: 198,
    comments: 29,
    shares: 41,
    reach: 3650,
    channel: 'LinkedIn',
  },
];

const CHANNELS = [
  { name: 'LinkedIn', posts: 12, avgEngagement: 6.8, color: '#0A66C2' },
  { name: 'Instagram', posts: 8, avgEngagement: 8.2, color: '#E4405F' },
  { name: 'Facebook', posts: 6, avgEngagement: 4.5, color: '#1877F2' },
];

const TREND_DATA = [
  { day: 'Lun', interactions: 120 },
  { day: 'Mar', interactions: 185 },
  { day: 'Mer', interactions: 95 },
  { day: 'Jeu', interactions: 210 },
  { day: 'Ven', interactions: 165 },
  { day: 'Sam', interactions: 78 },
  { day: 'Dim', interactions: 130 },
];

// ── Computed stats ─────────────────────────────────────────────────────────────

const TOTAL_POSTS = 26;
const AVG_RATE = (CHANNELS.reduce((a, c) => a + c.avgEngagement, 0) / CHANNELS.length).toFixed(1);
const BEST_CHANNEL = CHANNELS.reduce((a, c) => (c.avgEngagement > a.avgEngagement ? c : a));
const TOTAL_REACH = '28.4k';

function fmtNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ── Component ──────────────────────────────────────────────────────────────────

export function PostPerformancePanel({ className }: { className?: string }) {
  const stats = [
    { icon: BarChart3, label: 'Posts ce mois', value: String(TOTAL_POSTS) },
    { icon: TrendingUp, label: 'Engagement moy.', value: `${AVG_RATE}%` },
    { icon: Zap, label: 'Meilleur canal', value: BEST_CHANNEL.name },
    { icon: Users, label: 'Portée totale', value: TOTAL_REACH },
  ];

  return (
    <div className={cn('flex flex-col gap-4 p-4 h-full overflow-y-auto', className)}>
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-sm font-extrabold text-foreground">Performance mensuelle</h3>
          <p className="text-xs text-muted-foreground">Vue d'ensemble de vos résultats</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs gap-1.5 h-7"
          onClick={() =>
            toast.success('Export lancé !', { description: 'Rapport PDF en cours de téléchargement.' })
          }
        >
          <Download size={12} />
          Exporter
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-2 shrink-0">
        {stats.map((s, i) => (
          <Card key={s.label} className={i === 0 ? 'animate-fade-in' : ''}>
            <div className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <s.icon size={12} className="text-primary" />
                <span className="text-[10px] text-muted-foreground font-medium">{s.label}</span>
              </div>
              <span className="text-base font-extrabold text-foreground tabular-nums">{s.value}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Top performing posts */}
      <Card className="shrink-0">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-primary" />
            <span className="text-xs font-bold text-foreground">Top 3 publications</span>
          </div>
          <div className="space-y-3">
            {TOP_POSTS.map((post, i) => (
              <div
                key={post.id}
                className="flex gap-3 items-start pb-3 border-b border-border last:border-0 last:pb-0"
              >
                <span
                  className={cn(
                    'shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold',
                    i === 0 && 'bg-amber-100 text-amber-700',
                    i === 1 && 'bg-slate-100 text-slate-600',
                    i === 2 && 'bg-orange-100 text-orange-700',
                  )}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground line-clamp-2 leading-relaxed">{post.text}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-semibold">
                      {post.channel}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      ❤️ {fmtNum(post.likes)} · 💬 {post.comments} · 🔄 {post.shares}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Channel breakdown */}
      <Card className="shrink-0">
        <div className="p-4">
          <span className="text-xs font-bold text-foreground mb-3 block">Répartition par canal</span>
          <div className="space-y-3">
            {CHANNELS.map((ch) => (
              <div key={ch.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ch.color }} />
                    <span className="text-xs font-semibold text-foreground">{ch.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{ch.posts} posts</span>
                    <span className="text-[10px] font-bold text-primary tabular-nums">{ch.avgEngagement}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${ch.avgEngagement * 10}%`, backgroundColor: ch.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Engagement trend chart */}
      <Card className="shrink-0">
        <div className="p-4">
          <span className="text-xs font-bold text-foreground mb-3 block">Tendance des interactions</span>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TREND_DATA} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(174, 85%, 31%)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(174, 85%, 31%)" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: 'hsl(215, 16%, 47%)' }}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: '11px',
                    borderRadius: '8px',
                    border: '1px solid hsl(214, 22%, 88%)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="interactions"
                  stroke="hsl(174, 85%, 31%)"
                  strokeWidth={2}
                  fill="url(#perfGrad)"
                  name="Interactions"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Post interactions tracker (demo for selected post) */}
      <PostInteractionsTracker
        postId="perf-1"
        postText={TOP_POSTS[0].text}
        className="shrink-0"
      />
    </div>
  );
}
