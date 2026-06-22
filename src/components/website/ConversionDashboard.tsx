import { Card, Badge } from '@blinkdotnew/ui';
import { TrendingUp, TrendingDown, Globe, MapPin, RefreshCw, Users } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
  subtext: string;
  gradient: string;
  sparklinePath: string;
}

function StatCard({ title, value, trend, trendUp, subtext, gradient, sparklinePath }: StatCardProps) {
  return (
    <Card className={`relative overflow-hidden border-none text-white ${gradient} p-6 shadow-lg`}>
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <span className="text-sm font-medium opacity-90">{title}</span>
          <Badge className={`bg-white/20 hover:bg-white/30 text-white border-none gap-1 py-0.5 px-2`}>
            {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend}
          </Badge>
        </div>
        
        <div className="mt-auto">
          <h3 className="text-3xl font-bold mb-1">{value}</h3>
          <p className="text-xs opacity-80">{subtext}</p>
        </div>

        <div className="absolute bottom-0 right-0 left-0 h-16 pointer-events-none opacity-30 px-2">
          <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
            <path
              d={sparklinePath}
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-pulse"
            />
          </svg>
        </div>
      </div>
    </Card>
  );
}

export default function ConversionDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Chiffre d'affaires généré"
          value="1 890 €"
          trend="+22%"
          trendUp={true}
          subtext="via réservations en ligne"
          gradient="bg-gradient-to-br from-violet-600 to-indigo-700"
          sparklinePath="M0 30 Q15 35 30 20 T60 25 T100 10"
        />
        <StatCard
          title="Taux de conversion"
          value="4.8%"
          trend="vs 3.1%"
          trendUp={true}
          subtext="visiteurs → clients"
          gradient="bg-gradient-to-br from-teal-500 to-emerald-600"
          sparklinePath="M0 35 L20 25 L40 30 L60 15 L80 20 L100 5"
        />
        <StatCard
          title="Leads qualifiés"
          value="42 prospects"
          trend="En hausse"
          trendUp={true}
          subtext="ce mois-ci"
          gradient="bg-gradient-to-br from-orange-400 to-rose-500"
          sparklinePath="M0 20 L15 25 L30 15 L45 20 L60 10 L80 15 L100 5"
        />
      </div>

      <div className="flex flex-wrap items-center gap-6 px-4 py-3 bg-muted/30 rounded-xl border border-border/50 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <RefreshCw size={14} className="text-primary animate-spin" style={{ animationDuration: '3s' }} />
          <span>Dernière synchro : il y a 2 min</span>
        </div>
        <div className="flex items-center gap-2">
          <Globe size={14} className="text-teal-500" />
          <span>147 visiteurs actifs aujourd'hui</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-rose-500" />
          <span>Source #1: Google Maps</span>
        </div>
      </div>
    </div>
  );
}
