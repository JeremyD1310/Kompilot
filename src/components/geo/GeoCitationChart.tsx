/**
 * GeoCitationChart — 30-day AI citation history
 * Uses recharts AreaChart to show how citation frequency evolved.
 */
import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

// Generate simulated 30-day citation data
function generateChartData(baseScore: number) {
  const today = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const date = subDays(today, 29 - i);
    const noise = () => Math.round((Math.random() - 0.5) * 18);
    const trend = Math.round((i / 29) * 12); // slight upward trend
    return {
      day: format(date, 'd MMM', { locale: fr }),
      ChatGPT: Math.min(100, Math.max(0, baseScore + noise() + trend - 6)),
      Gemini: Math.min(100, Math.max(0, baseScore - 28 + noise() + trend)),
      Perplexity: Math.min(100, Math.max(0, baseScore - 12 + noise() + trend - 4)),
      Claude: Math.min(100, Math.max(0, baseScore - 14 + noise() + trend - 2)),
    };
  });
}

interface GeoCitationChartProps {
  globalScore: number;
}

const LLM_COLORS: Record<string, string> = {
  ChatGPT: '#10b981',
  Gemini: '#3b82f6',
  Perplexity: '#8b5cf6',
  Claude: '#f59e0b',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-background shadow-xl p-3 text-xs space-y-1 min-w-[160px]">
      <p className="font-bold text-foreground mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="font-bold text-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export function GeoCitationChart({ globalScore }: GeoCitationChartProps) {
  const data = useMemo(() => generateChartData(globalScore), [globalScore]);

  // Calculate delta between day 1 and day 30 for each LLM
  const trend = data[29].ChatGPT - data[0].ChatGPT;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <TrendingUp size={15} className="text-primary" />
            Évolution de vos citations IA — 30 derniers jours
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Fréquence estimée de mention dans les réponses de chaque LLM.
          </p>
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold rounded-full px-2 py-1 ${trend >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
          <TrendingUp size={11} className={trend < 0 ? 'rotate-180' : ''} />
          {trend >= 0 ? '+' : ''}{trend} pts
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            {Object.entries(LLM_COLORS).map(([name, color]) => (
              <linearGradient key={name} id={`grad-${name}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.18} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            interval={6}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {Object.entries(LLM_COLORS).map(([name, color]) => (
            <Area
              key={name}
              type="monotone"
              dataKey={name}
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#grad-${name})`}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          ))}
          <Legend
            wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
            iconType="circle"
            iconSize={8}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
