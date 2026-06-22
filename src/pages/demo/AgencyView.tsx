import { TrendingUp, Users, AlertCircle, ShieldCheck, ChevronRight, Globe } from 'lucide-react';
import { Button, Card, Badge, Progress, Stat, StatGroup } from '@blinkdotnew/ui';

const subClients = [
  { name: 'Restaurant Le Bistrot', score: 91, icon: '🍽️' },
  { name: 'Salon Beauté Céline',   score: 76, icon: '💆' },
  { name: 'Plomberie Durand',      score: 64, icon: '🏗️' },
  { name: 'Boulangerie Patisse',   score: 88, icon: '🥐' },
  { name: 'Garage Auto Pro',       score: 72, icon: '🚗' },
  { name: 'Hôtel Belle Vue',       score: 95, icon: '🏨' },
];

const premiumFeatures = ['API & Webhooks', 'Rapports PDF', 'Marque Blanche', 'ROI Sliders'];

/* ══════════════════════════════════════════════════════════════
   VUE AGENCE PREMIUM
══════════════════════════════════════════════════════════════ */
export function AgencyView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Agence Réseaux Pro</h1>
            <p className="text-slate-500 text-sm">Plan Pro Agence (599€/mois)</p>
          </div>
          <div className="hidden md:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
            <Globe className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] font-mono text-slate-500">agence.kompilot.app</span>
          </div>
        </div>
      </div>

      <StatGroup className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Sous-comptes actifs" value="28 / ∞" icon={<Users className="text-indigo-500" />} />
        <Stat
          label="Crédits IA"
          value="380k / 500k"
          description={<Progress value={76} className="h-1.5 mt-2" indicatorClassName="bg-indigo-500" />}
        />
        <Stat label="MRR clients" value="8 750€" trend={12} trendLabel="ce mois" icon={<TrendingUp className="text-indigo-500" />} />
      </StatGroup>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold text-base mb-4">Gestion des sous-comptes</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {subClients.map((c, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/40 px-2 rounded-lg transition-colors group">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{c.icon}</span>
                  <div>
                    <p className="text-sm font-semibold">{c.name}</p>
                    <p className="text-xs text-slate-400">Score G.E.O. : {c.score}/100</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 h-7 group-hover:translate-x-0.5 transition-all">
                  Gérer <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5 border-amber-100 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-900/10">
            <h3 className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2 text-sm mb-3">
              <AlertCircle className="w-4 h-4" /> Alerte Consommation
            </h3>
            <div className="flex justify-between text-xs text-amber-600 mb-1.5">
              <span>Limite mensuelle IA</span><span>76%</span>
            </div>
            <Progress value={76} className="h-2" indicatorClassName="bg-amber-500" />
            <p className="text-[10px] text-slate-500 italic mt-2">Alerte automatique à 90%</p>
          </Card>

          <Card className="p-5 bg-slate-900 text-white">
            <h3 className="font-bold mb-3 flex items-center gap-2 text-sm">
              <ShieldCheck className="w-4 h-4 text-[#0D9488]" /> Fonctionnalités Premium
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {premiumFeatures.map(f => (
                <div key={f} className="flex items-center gap-1.5 text-xs text-slate-300">
                  <div className="w-3 h-3 rounded-full bg-[#0D9488]/20 flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
                  </div>
                  {f}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <Badge className="bg-indigo-100 text-indigo-700 border-none dark:bg-indigo-900/30 dark:text-indigo-400 text-xs">
              White Label inclus
            </Badge>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              Revendez Kompilot sous votre propre marque à vos clients, avec vos tarifs et votre domaine personnalisé.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
