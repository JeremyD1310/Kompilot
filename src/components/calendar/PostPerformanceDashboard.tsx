/**
 * PostPerformanceDashboard — Analyse des performances des publications
 * avec sélection de post individuel, comparaisons par canal, et insights IA.
 */
import { useState } from 'react';
import { useDemoMode } from '../../context/DemoModeContext';
import { Card, Button, toast } from '@blinkdotnew/ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, Users, MessageCircle, Share2, MousePointerClick, Download, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { usePostPerformance, summarizePerformance, summarizePosts } from '../../hooks/usePostPerformance';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PostStat {
  id: string;
  text: string;
  channel: string;
  date: string;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  clicks: number;
  engagementRate: number;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_POSTS: PostStat[] = [
  { id: 'p1', text: '🚀 Lancement de notre nouvelle fonctionnalité IA', channel: 'LinkedIn', date: '2024-01-15', likes: 312, comments: 48, shares: 87, reach: 6240, clicks: 420, engagementRate: 7.2 },
  { id: 'p2', text: '💡 5 conseils pour booster votre engagement Instagram', channel: 'Instagram', date: '2024-01-12', likes: 245, comments: 36, shares: 52, reach: 4820, clicks: 310, engagementRate: 8.1 },
  { id: 'p3', text: '📊 Bilan Q1 : +42% de portée organique', channel: 'LinkedIn', date: '2024-01-10', likes: 198, comments: 29, shares: 41, reach: 3650, clicks: 280, engagementRate: 6.5 },
  { id: 'p4', text: '🎁 Offre flash ce weekend uniquement !', channel: 'Facebook', date: '2024-01-08', likes: 156, comments: 22, shares: 38, reach: 2900, clicks: 190, engagementRate: 7.4 },
  { id: 'p5', text: '📸 Coulisses de notre atelier — une journée avec nous', channel: 'Instagram', date: '2024-01-05', likes: 421, comments: 64, shares: 92, reach: 5800, clicks: 380, engagementRate: 9.9 },
  { id: 'p6', text: '🎓 Webinaire gratuit : digitaliser votre PME', channel: 'Facebook', date: '2024-01-03', likes: 89, comments: 17, shares: 24, reach: 1780, clicks: 145, engagementRate: 5.1 },
];

const WEEKLY_TREND = [
  { week: 'S1', linkedin: 6.8, instagram: 8.2, facebook: 5.1 },
  { week: 'S2', linkedin: 7.2, instagram: 7.9, facebook: 4.8 },
  { week: 'S3', linkedin: 6.5, instagram: 9.1, facebook: 5.5 },
  { week: 'S4', linkedin: 8.0, instagram: 8.8, facebook: 6.2 },
];

const CHANNEL_COLORS: Record<string, string> = {
  LinkedIn: '#0A66C2',
  linkedin: '#0A66C2',
  Instagram: '#E4405F',
  instagram: '#E4405F',
  Facebook: '#1877F2',
  facebook: '#1877F2',
  Google: '#EA4335',
  google_business: '#EA4335',
  TikTok: '#000000',
  tiktok: '#000000',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function Trend({ value }: { value: number }) {
  return (
    <span className={cn('flex items-center gap-0.5 text-[10px] font-bold', value >= 0 ? 'text-green-600' : 'text-red-500')}>
      {value >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {value >= 0 ? '+' : ''}{value}%
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface Props {
  className?: string;
}

export function PostPerformanceDashboard({ className }: Props) {
  const [selectedPost, setSelectedPost] = useState<PostStat | null>(null);
  const [sortBy, setSortBy] = useState<'engagementRate' | 'reach' | 'likes'>('engagementRate');
  const [aiInsight, setAiInsight] = useState('');
  const [loadingInsight, setLoadingInsight] = useState(false);

  const { isDemoActive } = useDemoMode();
  const { data: liveRows = [], isLoading, isError } = usePostPerformance();
  const liveSummary = summarizePerformance(liveRows);
  const livePosts = summarizePosts(liveRows);
  const hasLive = liveRows.length > 0;
  const livePostStats: PostStat[] = livePosts.map(post => ({ id: post.postId, text: `Publication ${post.postId.slice(0, 8)}`, channel: post.platform, date: '', likes: 0, comments: post.comments, shares: post.shares, reach: post.reach, clicks: post.clicks, engagementRate: post.engagementRate }));

  const sorted = [...(isDemoActive ? MOCK_POSTS : livePostStats)].sort((a, b) => b[sortBy] - a[sortBy]);

  // Simulate AI insight generation
  const generateInsight = async () => {
    setLoadingInsight(true);
    setAiInsight('');
    try {
      await new Promise(res => setTimeout(res, 1200));
      setAiInsight(
        `📊 Votre meilleur contenu cette semaine est sur **Instagram** (+9.9% d'engagement). Les posts avec des coulisses humaines surperforment de 2x par rapport aux posts promotionnels. Recommandation : publiez au moins 2 posts "behind the scenes" par semaine. Vos posts LinkedIn sous-performent le mardi — essayez le mercredi 10h-11h.`
      );
    } finally {
      setLoadingInsight(false);
    }
  };

  // KPI cards
  const kpis = [
    { icon: BarChart3, label: 'Posts ce mois', value: fmt(isDemoActive ? 26 : liveSummary.posts), trend: 0 },
    { icon: Users, label: 'Portée totale', value: fmt(isDemoActive ? 28400 : liveSummary.reach), trend: 0 },
    { icon: TrendingUp, label: 'Engagement moyen', value: `${(isDemoActive ? 7.2 : liveSummary.engagementRate).toFixed(1)}%`, trend: 0 },
    { icon: MousePointerClick, label: 'Clics totaux', value: fmt(isDemoActive ? 1780 : liveSummary.clicks), trend: 0 },
  ];

  return (
    <div className={cn('space-y-5', className)}>
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(k => (
          <Card key={k.label}>
            <div className="p-4 flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <k.icon size={13} className="text-primary" />
                <span className="text-[11px] text-muted-foreground font-medium">{k.label}</span>
              </div>
              <span className="text-xl font-extrabold text-foreground tabular-nums">{k.value}</span>
              <Trend value={k.trend} />
            </div>
          </Card>
        ))}
      </div>

      {/* Engagement trend by channel */}
      {isDemoActive && (
      <Card>
        <div className="p-4">
          <p className="text-sm font-bold text-foreground mb-3">Taux d'engagement par canal (4 dernières semaines)</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={WEEKLY_TREND} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 22%, 91%)" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                {['linkedin', 'instagram', 'facebook'].map(ch => (
                  <Line
                    key={ch}
                    type="monotone"
                    dataKey={ch}
                    stroke={CHANNEL_COLORS[ch.charAt(0).toUpperCase() + ch.slice(1)] ?? '#888'}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name={ch.charAt(0).toUpperCase() + ch.slice(1)}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
      )}

      {/* Top posts table */}
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-sm font-bold text-foreground">Classement des publications</p>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">Trier par :</span>
              {(['engagementRate', 'reach', 'likes'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={cn(
                    'text-[10px] font-semibold px-2 py-1 rounded-lg border transition-all',
                    sortBy === s ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground',
                  )}
                >
                  {s === 'engagementRate' ? 'Engagement' : s === 'reach' ? 'Portée' : 'Likes'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {sorted.map((post, i) => (
              <button
                key={post.id}
                onClick={() => setSelectedPost(selectedPost?.id === post.id ? null : post)}
                className={cn(
                  'w-full text-left rounded-xl border px-3 py-2.5 transition-all',
                  selectedPost?.id === post.id
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border hover:border-primary/20 hover:bg-muted/30',
                )}
              >
                <div className="flex items-start gap-3">
                  <span className={cn(
                    'shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold mt-0.5',
                    i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-600' : 'bg-muted text-muted-foreground',
                  )}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground line-clamp-1 leading-relaxed">{post.text}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${CHANNEL_COLORS[post.channel] ?? '#888'}15`,
                          color: CHANNEL_COLORS[post.channel] ?? '#888',
                        }}
                      >
                        {post.channel}
                      </span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        ❤️ {fmt(post.likes)} · 💬 {post.comments} · 🔄 {post.shares}
                      </span>
                      <span className="ml-auto text-[10px] font-bold text-primary tabular-nums">
                        {post.engagementRate}% eng.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded detail */}
                {selectedPost?.id === post.id && (
                  <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { icon: Users, label: 'Portée', value: fmt(post.reach) },
                      { icon: MousePointerClick, label: 'Clics', value: fmt(post.clicks) },
                      { icon: MessageCircle, label: 'Commentaires', value: String(post.comments) },
                      { icon: Share2, label: 'Partages', value: String(post.shares) },
                    ].map(s => (
                      <div key={s.label} className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <s.icon size={10} />
                          <span className="text-[9px]">{s.label}</span>
                        </div>
                        <span className="text-sm font-extrabold text-foreground tabular-nums">{s.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Channel bar chart */}
      {isDemoActive && (
      <Card>
        <div className="p-4">
          <p className="text-sm font-bold text-foreground mb-3">Portée par canal</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'LinkedIn', reach: 18400 },
                  { name: 'Instagram', reach: 14800 },
                  { name: 'Facebook', reach: 6200 },
                ]}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                barSize={24}
              >
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                <Bar dataKey="reach" name="Portée" radius={[4, 4, 0, 0]}
                  fill="hsl(174, 85%, 31%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
      )}

      {/* AI insight */}
      {isDemoActive && (
      <Card>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-foreground">Analyse IA</p>
            <Button
              variant="outline"
              size="sm"
              onClick={generateInsight}
              disabled={loadingInsight}
              className="gap-1.5 h-7 text-xs"
            >
              <Sparkles size={12} className={loadingInsight ? 'animate-spin' : ''} />
              {loadingInsight ? 'Analyse…' : 'Obtenir des insights'}
            </Button>
          </div>
          {aiInsight ? (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-foreground leading-relaxed">
              {aiInsight}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Cliquez sur "Obtenir des insights" pour que l'IA analyse vos performances et vous propose des recommandations.
            </p>
          )}
        </div>
      </Card>
      )}

      {/* Export */}
      {isDemoActive && (
      <Button
        variant="outline"
        className="w-full gap-2 text-xs"
        onClick={() => toast.success('Export lancé !', { description: 'Rapport PDF en cours de génération.' })}
      >
        <Download size={13} /> Exporter le rapport complet (PDF)
      </Button>
      )}
    </div>
  );
}