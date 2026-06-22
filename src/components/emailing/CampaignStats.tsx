import { useEffect, useState } from 'react';
import { Card, CardContent, Button } from '@blinkdotnew/ui';
import { RotateCcw, TrendingUp, MousePointerClick, UserMinus } from 'lucide-react';

interface CampaignStatsProps {
  onReset: () => void;
}

function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + increment, target);
      setValue(Math.round(current));
      if (current >= target) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [target]);

  return <>{value}{suffix}</>;
}

const STATS = [
  {
    icon: TrendingUp,
    label: "Taux d'ouverture",
    value: 64,
    suffix: '%',
    badge: '🏆 Excellent !',
    badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    numberClass: 'text-emerald-600',
    bgClass: 'bg-emerald-50 border-emerald-200',
    iconBg: 'bg-emerald-100',
    iconClass: 'text-emerald-600',
  },
  {
    icon: MousePointerClick,
    label: 'Taux de clic',
    value: 12,
    suffix: '%',
    badge: '👍 Bon',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
    numberClass: 'text-blue-600',
    bgClass: 'bg-blue-50 border-blue-200',
    iconBg: 'bg-blue-100',
    iconClass: 'text-blue-600',
  },
  {
    icon: UserMinus,
    label: 'Désinscriptions',
    value: 0,
    suffix: '',
    badge: '✅ Parfait',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    numberClass: 'text-slate-700',
    bgClass: 'bg-slate-50 border-slate-200',
    iconBg: 'bg-slate-100',
    iconClass: 'text-slate-500',
  },
];

export function CampaignStats({ onReset }: CampaignStatsProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Success header */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 px-6 py-5 text-center space-y-1">
        <p className="text-2xl">🚀</p>
        <p className="font-bold text-emerald-900 text-base">Campagne envoyée avec succès !</p>
        <p className="text-xs text-emerald-700">Voici les performances en temps réel de votre envoi</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STATS.map(stat => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className={`border ${stat.bgClass} shadow-sm`}>
              <CardContent className="pt-5 pb-5 flex flex-col items-center text-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
                  <Icon size={18} className={stat.iconClass} />
                </div>
                <div>
                  <p className={`text-3xl font-extrabold tabular-nums ${stat.numberClass}`}>
                    <AnimatedNumber target={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${stat.badgeClass}`}>
                  {stat.badge}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Reset */}
      <div className="flex justify-center pt-1">
        <Button onClick={onReset} variant="outline" className="gap-2">
          <RotateCcw size={15} /> ✉️ Lancer une nouvelle campagne
        </Button>
      </div>
    </div>
  );
}
