import React, { useState, useEffect } from 'react';
import { LayoutGrid, ArrowRight, UserCircle, Briefcase, Zap } from 'lucide-react';
import { Button, Card, Badge, cn } from '@blinkdotnew/ui';

interface AgencyDemoDataBannerProps {
  userId: string;
  onExplore: () => void;
}

export const AgencyDemoDataBanner: React.FC<AgencyDemoDataBannerProps> = ({
  userId,
  onExplore,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isSeen = localStorage.getItem(`agency_demo_seen_${userId}`);
    if (!isSeen) {
      setIsVisible(true);
    }
  }, [userId]);

  const handleExplore = () => {
    localStorage.setItem(`agency_demo_seen_${userId}`, 'true');
    setIsVisible(false);
    onExplore();
  };

  if (!isVisible) return null;

  const demoClients = [
    { name: "Le Bistro du Port", emoji: "🍽️", sector: "Restauration" },
    { name: "Studio Beauté Claire", emoji: "💇", sector: "Bien-être" },
    { name: "Garage Dupont Auto", emoji: "🔧", sector: "Services" },
  ];

  return (
    <div className="px-4 py-4 animate-fade-in">
      <Card className="relative overflow-hidden border-indigo-500/20 bg-gradient-to-br from-white via-indigo-50/20 to-violet-50/30 p-6 shadow-xl shadow-indigo-500/5">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <LayoutGrid size={120} />
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-600/10 text-indigo-600 hover:bg-indigo-600/20 border-indigo-600/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                Données de démonstration
              </Badge>
              <div className="flex items-center gap-1 text-indigo-600 text-xs font-medium bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                <Zap className="h-3 w-3 fill-current" /> Instantané
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">
                🎯 Testez immédiatement les fonctionnalités Agence
              </h2>
              <p className="text-muted-foreground max-w-xl">
                3 comptes clients de démonstration ont été créés pour vous. Explorez comment Kompilot gère automatiquement leur présence locale.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              {demoClients.map((client, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-3 bg-white/60 backdrop-blur-sm px-4 py-2.5 rounded-2xl border border-indigo-100 shadow-sm hover:border-indigo-300 transition-colors"
                >
                  <span className="text-2xl">{client.emoji}</span>
                  <div>
                    <p className="text-sm font-bold text-slate-800 leading-none mb-1">{client.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">{client.sector}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="shrink-0 w-full lg:w-auto">
            <Button 
              size="lg"
              onClick={handleExplore}
              className="w-full lg:w-auto px-10 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg shadow-indigo-200 group text-lg font-bold"
            >
              Explorer les démos
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
