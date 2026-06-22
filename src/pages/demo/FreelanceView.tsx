import { TrendingUp, Star, ShieldCheck, Zap } from 'lucide-react';
import { Card, Badge, Stat, StatGroup } from '@blinkdotnew/ui';
import { FeedItem } from './DemoShared';

const chantiers = [
  { label: 'Rénovation salle de bain – Nantes',    status: 'Devis accepté',  icon: '🛁', amount: '4 200€' },
  { label: 'Carrelage cuisine – Saint-Herblain',   status: 'En attente',     icon: '🏗️', amount: '1 800€' },
  { label: 'Peinture appartement – Rennes',        status: 'Devis envoyé',   icon: '🎨', amount: '950€'  },
  { label: 'Installation VMC – Brest',             status: 'Devis accepté',  icon: '🌬️', amount: '2 300€' },
  { label: 'Parquet salon – Lorient',              status: 'En cours',       icon: '🪵', amount: '1 650€' },
];

function statusClass(status: string) {
  if (status === 'Devis accepté' || status === 'En cours')
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  if (status === 'Devis envoyé')
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
}

/* ══════════════════════════════════════════════════════════════
   VUE ARTISAN / BÂTIMENT
══════════════════════════════════════════════════════════════ */
export function FreelanceView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Menuiserie Durand & Fils</h1>
          <p className="text-slate-500 text-sm">Artisan menuisier — Bretagne (Plan Pro 99€/mois)</p>
        </div>
        <Badge className="bg-amber-100 text-amber-700 border-none dark:bg-amber-900/30 dark:text-amber-400">
          📍 Rayon 35 km
        </Badge>
      </div>

      <StatGroup className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Trajets évités ce mois" value="6" trend={-6} trendLabel="déplacements inutiles" icon={<ShieldCheck className="text-amber-500" />} />
        <Stat label="Économies déplacements" value="270€" icon={<TrendingUp className="text-amber-500" />} />
        <Stat label="Devis en cours" value="5" icon={<Star className="text-slate-500" />} />
      </StatGroup>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold text-base mb-4">Pipeline chantiers</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {chantiers.map((c, i) => (
              <div key={i} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl shrink-0">{c.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.label}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusClass(c.status)}`}>
                      {c.status}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 shrink-0">{c.amount}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> Devis sans déplacement
            </h3>
            <FeedItem
              icon="📋"
              title="Devis digital envoyé par WhatsApp"
              desc="Le client signe en ligne — aucun déplacement requis"
              color="amber"
            />
            <FeedItem
              icon="📍"
              title="Rayon d'intervention configuré"
              desc="Alertes auto si prospect hors zone de 35 km"
              color="amber"
            />
          </Card>

          <Card className="p-4 bg-amber-50/60 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30">
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
              🚗 Ce mois : 6 déplacements évités × 45€ = <strong>270€ économisés</strong>
            </p>
            <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
              L'IA qualifie vos prospects avant votre visite et vous envoie uniquement les devis chauds.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
