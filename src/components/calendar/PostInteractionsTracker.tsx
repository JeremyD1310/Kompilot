import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Eye, TrendingUp, FileText } from 'lucide-react';
import { Card, Badge, Button, toast } from '@blinkdotnew/ui';

interface PostInteractionsTrackerProps {
  postId: string;
  postText: string;
  className?: string;
}

const MOCK = {
  likes: 247,
  comments: 38,
  shares: 62,
  reach: 4820,
  engagementRate: 7.2,
  week: [
    { day: 'Lun', likes: 32, comments: 5, shares: 8, reach: 680 },
    { day: 'Mar', likes: 45, comments: 8, shares: 12, reach: 820 },
    { day: 'Mer', likes: 28, comments: 3, shares: 6, reach: 540 },
    { day: 'Jeu', likes: 52, comments: 9, shares: 15, reach: 910 },
    { day: 'Ven', likes: 38, comments: 6, shares: 9, reach: 720 },
    { day: 'Sam', likes: 22, comments: 3, shares: 5, reach: 480 },
    { day: 'Dim', likes: 30, comments: 4, shares: 7, reach: 670 },
  ],
};

const TOTALS = MOCK.week.reduce(
  (a, d) => ({
    likes: a.likes + d.likes,
    comments: a.comments + d.comments,
    shares: a.shares + d.shares,
    reach: a.reach + d.reach,
  }),
  { likes: 0, comments: 0, shares: 0, reach: 0 },
);

function fmtNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function PostInteractionsTracker({ postId: _postId, postText, className }: PostInteractionsTrackerProps) {
  const maxReach = Math.max(...MOCK.week.map((d) => d.reach));
  const avgRate = (
    ((TOTALS.likes + TOTALS.comments + TOTALS.shares * 2) / TOTALS.reach) *
    100
  ).toFixed(1);

  const metrics = [
    { icon: Heart, label: 'J\'aime', value: MOCK.likes, color: 'text-rose-500', bg: 'bg-rose-50' },
    { icon: MessageCircle, label: 'Commentaires', value: MOCK.comments, color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: Share2, label: 'Partages', value: MOCK.shares, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { icon: Eye, label: 'Portée', value: MOCK.reach, color: 'text-violet-500', bg: 'bg-violet-50', format: true },
  ];

  return (
    <Card className={className}>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            <span className="text-sm font-bold text-foreground">Interactions du post</span>
          </div>
          <Badge variant="secondary">{avgRate}% engagement</Badge>
        </div>

        {/* Post excerpt */}
        <p className="text-xs text-muted-foreground line-clamp-2 bg-muted/50 rounded-lg px-3 py-2">
          {postText}
        </p>

        {/* Metrics grid */}
        <div className="grid grid-cols-4 gap-2">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className={`${m.bg} rounded-xl p-2.5 text-center`}
            >
              <m.icon size={14} className={`${m.color} mx-auto mb-1`} />
              <motion.span
                className={`text-lg font-extrabold ${m.color} block tabular-nums`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
              >
                {m.format ? fmtNum(m.value) : m.value}
              </motion.span>
              <span className="text-[10px] text-muted-foreground font-medium">{m.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Weekly bar chart (inline SVG) */}
        <div>
          <p className="text-xs font-semibold text-foreground mb-3">Portée — 7 derniers jours</p>
          <div className="flex items-end gap-1.5 h-20">
            {MOCK.week.map((d, i) => {
              const h = (d.reach / maxReach) * 100;
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    className="w-full rounded-t-sm bg-primary/70"
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: 0.3 + i * 0.06, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                    title={`${d.day}: ${fmtNum(d.reach)} vues`}
                  />
                  <span className="text-[9px] text-muted-foreground font-medium">{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Engagement rate detail */}
        <div className="rounded-lg border border-border p-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Taux d'engagement moyen</span>
            <span className="text-sm font-extrabold text-primary">{avgRate}%</span>
          </div>
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(Number(avgRate) * 10, 100)}%` }}
              transition={{ delay: 0.5, duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {TOTALS.likes + TOTALS.comments + TOTALS.shares} interactions · {fmtNum(TOTALS.reach)} portée totale
          </p>
        </div>

        {/* Generate report button */}
        <Button
          className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 hover:opacity-90"
          onClick={() =>
            toast.success('Rapport généré !', {
              description: 'Le rapport d\'engagement a été envoyé par email.',
            })
          }
        >
          <FileText size={14} />
          Générer un rapport
        </Button>
      </div>
    </Card>
  );
}
