import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  cn
} from '@blinkdotnew/ui';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp } from 'lucide-react';

const heatmapData = [
  { day: 'Lun', '08h': 20, '10h': 45, '12h': 30, '14h': 25, '16h': 50, '18h': 80, '20h': 40 },
  { day: 'Mar', '08h': 15, '10h': 35, '12h': 40, '14h': 30, '16h': 45, '18h': 75, '20h': 35 },
  { day: 'Mer', '08h': 25, '10h': 50, '12h': 35, '14h': 35, '16h': 60, '18h': 90, '20h': 45 },
  { day: 'Jeu', '08h': 20, '10h': 40, '12h': 30, '14h': 25, '16h': 55, '18h': 85, '20h': 40 },
  { day: 'Ven', '08h': 30, '10h': 55, '12h': 45, '14h': 40, '16h': 70, '18h': 95, '20h': 50 },
  { day: 'Sam', '08h': 10, '10h': 30, '12h': 50, '14h': 60, '16h': 40, '18h': 30, '20h': 20 },
  { day: 'Dim', '08h': 5, '10h': 20, '12h': 40, '14h': 50, '16h': 35, '18h': 25, '20h': 15 },
];

const engagementByDay = [
  { name: 'Lun', engagement: 4.2 },
  { name: 'Mar', engagement: 3.8 },
  { name: 'Mer', engagement: 5.1 },
  { name: 'Jeu', engagement: 4.5 },
  { name: 'Ven', engagement: 5.8 },
  { name: 'Sam', engagement: 4.9 },
  { name: 'Dim', engagement: 3.5 },
];

const HeatmapCell = ({ value, isOptimal }: { value: number; isOptimal?: boolean }) => {
  const opacity = Math.max(0.1, value / 100);
  return (
    <div 
      className={cn(
        "h-12 w-full rounded-sm flex items-center justify-center transition-all relative group",
        isOptimal ? "ring-2 ring-primary ring-offset-2 z-10" : ""
      )}
      style={{ backgroundColor: `hsl(var(--primary) / ${opacity})` }}
    >
      <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        {value}%
      </span>
      {isOptimal && (
        <Badge variant="default" className="absolute -top-2 -right-2 px-1 py-0 text-[8px] h-4 bg-primary text-primary-foreground scale-75">
          Optimal ✓
        </Badge>
      )}
    </div>
  );
};

export function BestTimesTab() {
  return (
    <Card className="page-enter hover:border-primary/20 transition-colors">
      <CardHeader>
        <CardTitle>Quand publier pour maximiser votre portée ?</CardTitle>
        <CardDescription>Données basées sur vos 60 dernières publications.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="overflow-x-auto">
          <div className="min-w-[600px] space-y-2">
            <div className="grid grid-cols-9 gap-2 mb-4">
              <div className="col-span-1"></div>
              {['08h', '10h', '12h', '14h', '16h', '18h', '20h', 'Total'].map(time => (
                <div key={time} className="text-center text-xs font-medium text-muted-foreground uppercase">{time}</div>
              ))}
            </div>
            {heatmapData.map((row, i) => (
              <div key={row.day} className="grid grid-cols-9 gap-2 items-center">
                <div className="text-sm font-semibold">{row.day}</div>
                <HeatmapCell value={row['08h']} />
                <HeatmapCell value={row['10h']} />
                <HeatmapCell value={row['12h']} />
                <HeatmapCell value={row['14h']} />
                <HeatmapCell value={row['16h']} />
                <HeatmapCell value={row['18h']} isOptimal={i === 4} />
                <HeatmapCell value={row['20h']} />
                <div className="text-center text-xs font-bold text-primary">
                  {Math.floor((row['08h'] + row['10h'] + row['12h'] + row['14h'] + row['16h'] + row['18h'] + row['20h']) / 7)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t">
          <h4 className="text-sm font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Engagement par jour de la semaine (Lun-Dim)
          </h4>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementByDay}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  unit="%"
                />
                <Tooltip />
                <Bar dataKey="engagement" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}