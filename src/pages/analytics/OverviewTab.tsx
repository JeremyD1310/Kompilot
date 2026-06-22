import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  cn
} from '@blinkdotnew/ui';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Calendar,
  ArrowRight,
  Eye,
  Heart,
  MessageCircle
} from 'lucide-react';

// Stable mock data — no Math.random() to prevent flickering
const STABLE_LINKEDIN = [620,710,680,750,820,790,860,920,880,950,1010,970,1050,1100,1080,1150,1200,1180,1250,1310,1290,1350,1400,1380,1430,1490,1470,1520,1560,1580];
const STABLE_INSTAGRAM = [380,420,400,450,490,470,510,540,520,560,590,570,610,640,620,660,690,670,700,730,720,750,770,760,790,810,800,820,840,850];
const STABLE_OVERVIEW_DATA = Array.from({ length: 30 }, (_, i) => ({
  date: `${i + 1} mai`,
  linkedin: STABLE_LINKEDIN[i],
  instagram: STABLE_INSTAGRAM[i],
}));

const channelDistribution = [
  { name: 'LinkedIn', value: 45, color: 'hsl(var(--primary))' },
  { name: 'Instagram', value: 30, color: 'hsl(171 77% 75%)' },
  { name: 'Google Business', value: 15, color: 'hsl(var(--accent))' },
  { name: 'TikTok', value: 10, color: 'hsl(var(--muted-foreground))' },
];

const weeklyPubsData = [
  { week: 'Semaine 1', publiées: 8, planifiées: 2 },
  { week: 'Semaine 2', publiées: 7, planifiées: 3 },
  { week: 'Semaine 3', publiées: 9, planifiées: 1 },
  { week: 'Semaine 4', publiées: 10, planifiées: 4 },
];

// 3 KPI Cards principales
const KPI_CARDS = [
  {
    id: 'visibility',
    emoji: '👁️',
    label: 'Visibilité',
    sublabel: 'Portée totale',
    value: '12 840',
    change: '+18%',
    trend: 'up',
    bgLight: 'bg-teal-50 border-teal-200',
    textColor: 'text-teal-700',
    desc: 'Personnes qui ont vu vos posts ce mois-ci'
  },
  {
    id: 'engagement',
    emoji: '❤️',
    label: 'Engagement',
    sublabel: 'Likes & Abonnés',
    value: '847',
    change: '+12%',
    trend: 'up',
    bgLight: 'bg-pink-50 border-pink-200',
    textColor: 'text-pink-700',
    desc: 'Interactions totales sur tous vos réseaux'
  },
  {
    id: 'actions',
    emoji: '🖱️',
    label: 'Actions Clients',
    sublabel: 'Clics & Conversions',
    value: '234',
    change: '+31%',
    trend: 'up',
    bgLight: 'bg-violet-50 border-violet-200',
    textColor: 'text-violet-700',
    desc: 'Clics vers téléphone, itinéraire ou réservation'
  },
];

const KPIStat = ({ label, value, trend, trendLabel, icon: Icon }: any) => (
  <Card className="hover:border-primary/30 transition-colors cursor-default hover:shadow-sm">
    <CardContent className="pt-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-bold">{value}</h3>
        {trend !== undefined && (
          <span className={cn(
            "text-xs font-medium flex items-center gap-0.5",
            trend > 0 ? "text-green-600" : "text-red-600"
          )}>
            {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend)}{trendLabel}
          </span>
        )}
      </div>
    </CardContent>
  </Card>
);

export function OverviewTab() {
  // Use stable module-level data (no per-render randomness)
  const overviewData = STABLE_OVERVIEW_DATA;
  const navigate = useNavigate();

  return (
    <div className="space-y-6 page-enter">

      {/* ─── Meilleur post du mois ─── */}
      <div className="w-full max-w-2xl mx-auto md:mx-0">
        <div className={cn(
          "rounded-2xl border border-amber-200/60 p-5",
          "bg-gradient-to-r from-amber-50 to-yellow-50",
          "dark:from-amber-950/20 dark:to-yellow-950/10",
          "transition-all hover:shadow-md hover:-translate-y-0.5 group"
        )}>
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl leading-none">🏆</span>
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300 leading-tight">
                  Meilleur post du mois
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide border border-amber-200/60 dark:border-amber-700/40">
                    ⭐ TOP PERFORMANCE
                  </span>
                </div>
              </div>
            </div>
            {/* Canal + date */}
            <div className="text-right shrink-0">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0077B5] bg-[#0077B5]/10 rounded-full px-2 py-0.5">
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </span>
              <p className="text-[10px] text-muted-foreground mt-1">il y a 8 jours</p>
            </div>
          </div>

          {/* Post text */}
          <p className="text-sm text-foreground/80 dark:text-foreground/70 leading-relaxed mb-4 line-clamp-2">
            "5 astuces pour augmenter votre chiffre d'affaires..."
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-4 mb-4">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
              <Eye className="h-3.5 w-3.5" />
              <span>+847 vues</span>
            </span>
            <span className="w-px h-3 bg-amber-200 dark:bg-amber-700/50 rounded-full" />
            <span className="flex items-center gap-1.5 text-xs font-semibold text-pink-600 dark:text-pink-400">
              <Heart className="h-3.5 w-3.5" />
              <span>124 likes</span>
            </span>
            <span className="w-px h-3 bg-amber-200 dark:bg-amber-700/50 rounded-full" />
            <span className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>38 commentaires</span>
            </span>
          </div>

          {/* CTA */}
          <button
            onClick={() => navigate({ to: '/calendar' })}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-bold",
              "text-amber-700 dark:text-amber-400",
              "hover:text-amber-900 dark:hover:text-amber-200",
              "transition-colors group/btn"
            )}
          >
            Voir le post
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* Section KPI principale — 3 métriques clés */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {KPI_CARDS.map(kpi => (
          <div
            key={kpi.id}
            className={`rounded-2xl border p-5 ${kpi.bgLight} transition-all hover:shadow-md hover:-translate-y-0.5`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-2xl mb-0.5">{kpi.emoji}</p>
                <p className={`text-xs font-bold uppercase tracking-wide ${kpi.textColor}`}>{kpi.label}</p>
                <p className="text-[10px] text-muted-foreground">{kpi.sublabel}</p>
              </div>
              <span className={`flex items-center gap-1 rounded-full text-[10px] font-bold px-2 py-0.5 ${
                kpi.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {kpi.trend === 'up' ? '↑' : '↓'} {kpi.change}
              </span>
            </div>
            <p className="text-3xl font-extrabold text-foreground">{kpi.value}</p>
            <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{kpi.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPIStat 
          label="Portée totale" 
          value="48 200" 
          trend={22} 
          trendLabel="% vs mois dernier" 
          icon={Users} 
        />
        <KPIStat 
          label="Engagement moyen" 
          value="6,4%" 
          trend={1.2} 
          trendLabel="pt" 
          icon={MessageSquare} 
        />
        <KPIStat 
          label="Publications" 
          value="34" 
          trendLabel="ce mois" 
          icon={Calendar} 
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Portée des 30 derniers jours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overviewData}>
                <defs>
                  <linearGradient id="colorLinkedin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInstagram" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(171 77% 75%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(171 77% 75%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  interval={4}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    fontSize: '12px'
                  }}
                />
                <Legend verticalAlign="top" align="right" height={36} />
                <Area 
                  type="monotone" 
                  dataKey="linkedin" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorLinkedin)" 
                  name="LinkedIn"
                />
                <Area 
                  type="monotone" 
                  dataKey="instagram" 
                  stroke="hsl(171 77% 75%)" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorInstagram)" 
                  name="Instagram"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Répartition par canal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {channelDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Publications par semaine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyPubsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="week" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="publiées" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Publiées" />
                  <Bar dataKey="planifiées" fill="hsl(var(--primary) / 0.4)" radius={[4, 4, 0, 0]} name="Planifiées" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
