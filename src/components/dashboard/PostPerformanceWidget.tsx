import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { BarChart2, TrendingUp, Award, ArrowRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useDemoMode } from '../../context/DemoModeContext';

// ── Simulated post performance data ──────────────────────────────────────────

const BASE_POSTS = [
  { name: 'Lancement produit', platform: 'LinkedIn',  views: 1840, likes: 94,  comments: 23, color: '#7C3AED' },
  { name: 'Conseils PME 2024', platform: 'Instagram', views: 3210, likes: 287, comments: 61, color: '#F43F5E' },
  { name: 'Recrutement ouvert', platform: 'Facebook', views:  940, likes: 41,  comments: 8,  color: '#3B82F6' },
  { name: 'Coulisses atelier',  platform: 'Instagram',views: 2670, likes: 319, comments: 48, color: '#F43F5E' },
  { name: 'Promo Mai -20%',     platform: 'LinkedIn', views: 1120, likes: 57,  comments: 14, color: '#7C3AED' },
];

const METRIC_OPTIONS = [
  { key: 'views',    label: 'Vues',        suffix: '' },
  { key: 'likes',    label: 'Likes',       suffix: '' },
  { key: 'comments', label: 'Commentaires',suffix: '' },
] as const;

type MetricKey = 'views' | 'likes' | 'comments';

// ── Custom tooltip ────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label, metric }: any) {
  if (!active || !payload?.length) return null;
  const val: number = payload[0]?.value ?? 0;
  const meta = METRIC_OPTIONS.find(m => m.key === metric)!;
  return (
    <div className="rounded-xl border border-border bg-background shadow-xl px-4 py-3 text-sm min-w-[160px]">
      <p className="font-bold text-foreground truncate mb-1">{label}</p>
      <p className="text-muted-foreground text-xs">{meta.label}</p>
      <p className="text-xl font-extrabold text-foreground">{val.toLocaleString('fr-FR')}</p>
    </div>
  );
}

// ── Platform dot ──────────────────────────────────────────────────────────────

function PlatformDot({ platform }: { platform: string }) {
  const colors: Record<string, string> = {
    LinkedIn: 'bg-violet-100 text-violet-700',
    Instagram: 'bg-rose-100 text-rose-600',
    Facebook: 'bg-blue-100 text-blue-600',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${colors[platform] ?? 'bg-muted text-muted-foreground'}`}>
      {platform}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PostPerformanceWidget() {
  const [metric, setMetric] = useState<MetricKey>('views');
  const { isDemoActive, demoData } = useDemoMode();

  const posts = isDemoActive
    ? demoData.posts.slice(0, 5).map((p, i) => ({
        name: p.title.slice(0, 22),
        platform: p.platform,
        views:    BASE_POSTS[i % BASE_POSTS.length].views + Math.round(Math.random() * 400),
        likes:    BASE_POSTS[i % BASE_POSTS.length].likes + Math.round(Math.random() * 50),
        comments: BASE_POSTS[i % BASE_POSTS.length].comments + Math.round(Math.random() * 10),
        color:    BASE_POSTS[i % BASE_POSTS.length].color,
      }))
    : BASE_POSTS.map(p => ({ ...p, name: p.name.slice(0, 22) }));

  const bestIdx = posts.reduce((best, p, i) =>
    (p[metric] > posts[best][metric] ? i : best), 0);
  const best = posts[bestIdx];

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <BarChart2 size={16} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Performance des posts</p>
            <p className="text-[11px] text-muted-foreground">5 dernières publications</p>
          </div>
        </div>

        {/* Metric picker */}
        <div className="flex items-center rounded-lg border border-border overflow-hidden text-xs shrink-0">
          {METRIC_OPTIONS.map(m => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={`px-2.5 py-1.5 font-medium transition-colors whitespace-nowrap ${
                metric === m.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="px-3 pb-2" style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={posts} barSize={28} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false} tickLine={false}
              interval={0}
              tickFormatter={v => v.length > 12 ? v.slice(0, 12) + '…' : v}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false} tickLine={false}
              tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
            />
            <Tooltip content={<CustomTooltip metric={metric} />} cursor={{ fill: 'hsl(var(--muted)/0.5)', radius: 6 }} />
            <Bar dataKey={metric} radius={[6, 6, 0, 0]}>
              {posts.map((p, i) => (
                <Cell
                  key={i}
                  fill={p.color}
                  opacity={i === bestIdx ? 1 : 0.55}
                  stroke={i === bestIdx ? p.color : 'none'}
                  strokeWidth={i === bestIdx ? 2 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Best post callout */}
      <div className="mx-4 mb-4 rounded-xl bg-gradient-to-r from-primary/8 to-emerald-500/8 border border-primary/20 px-4 py-3 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
          <Award size={14} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Meilleur post ce mois</p>
          <p className="text-xs font-bold text-foreground truncate">{best.name}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-extrabold text-foreground">{best[metric].toLocaleString('fr-FR')}</p>
          <PlatformDot platform={best.platform} />
        </div>
      </div>

      {/* Footer link */}
      <Link
        to="/analytics"
        className="flex items-center justify-between px-5 py-3 border-t border-border/50 hover:bg-muted/30 transition-colors group"
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
          <TrendingUp size={12} /> Voir l'analyse complète
        </div>
        <ArrowRight size={13} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </Link>
    </div>
  );
}
