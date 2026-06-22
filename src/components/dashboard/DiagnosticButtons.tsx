import { useState } from 'react';
import { ChevronRight, Building2, Zap, CheckCircle2, Circle, X, TrendingUp, Wifi, Star, MessageSquare } from 'lucide-react';
import { useEstablishment } from '../../context/EstablishmentContext';

// ── GEO Health Checklist Modal ────────────────────────────────────────────────

interface CheckItem {
  id: string;
  label: string;
  done: boolean;
  impact: 'high' | 'medium' | 'low';
}

const GEO_CHECKLIST: CheckItem[] = [
  { id: 'gmb', label: 'Fiche Google Business Profile complète à 100%', done: true, impact: 'high' },
  { id: 'photos', label: 'Minimum 10 photos récentes publiées', done: true, impact: 'high' },
  { id: 'reviews', label: 'Taux de réponse aux avis > 90%', done: false, impact: 'high' },
  { id: 'keywords', label: 'Mots-clés sémantiques ciblés dans les posts', done: false, impact: 'high' },
  { id: 'schedule', label: 'Publications régulières (≥ 3 fois / semaine)', done: true, impact: 'medium' },
  { id: 'hours', label: 'Horaires d\'ouverture à jour (jours fériés compris)', done: true, impact: 'medium' },
  { id: 'website', label: 'Lien site web avec balises Schema LocalBusiness', done: false, impact: 'medium' },
  { id: 'qa', label: 'Section Q&R Google renseignée', done: false, impact: 'low' },
];

function GeoHealthModal({ onClose }: { onClose: () => void }) {
  const done = GEO_CHECKLIST.filter(c => c.done).length;
  const total = GEO_CHECKLIST.length;
  const pct = Math.round((done / total) * 100);

  const impactColor = (impact: CheckItem['impact']) =>
    impact === 'high' ? 'text-red-500' : impact === 'medium' ? 'text-amber-500' : 'text-slate-400';

  const impactLabel = (impact: CheckItem['impact']) =>
    impact === 'high' ? 'Impact fort' : impact === 'medium' ? 'Impact moyen' : 'Impact faible';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center">
              <Building2 size={16} className="text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Santé de votre établissement</p>
              <p className="text-[11px] text-muted-foreground">Checklist G.E.O. locale</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Score */}
        <div className="px-5 py-4 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-teal-800">Score de santé G.E.O.</span>
            <span className="text-xl font-extrabold text-teal-700">{pct}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-teal-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[11px] text-teal-700 mt-1.5 font-medium">
            {done}/{total} critères validés — {total - done} optimisation{total - done > 1 ? 's' : ''} restante{total - done > 1 ? 's' : ''}
          </p>
        </div>

        {/* Checklist */}
        <div className="px-5 py-3 max-h-72 overflow-y-auto space-y-2">
          {GEO_CHECKLIST.map(item => (
            <div
              key={item.id}
              className={`flex items-start gap-3 rounded-xl p-3 transition-colors ${
                item.done ? 'bg-emerald-50/50' : 'bg-muted/40 hover:bg-muted/60'
              }`}
            >
              {item.done ? (
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
              ) : (
                <Circle size={16} className="text-muted-foreground/40 mt-0.5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium leading-snug ${item.done ? 'text-foreground' : 'text-foreground/80'}`}>
                  {item.label}
                </p>
                <p className={`text-[10px] font-semibold mt-0.5 ${impactColor(item.impact)}`}>
                  {impactLabel(item.impact)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-5 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold py-3 hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm"
          >
            <Zap size={14} /> Optimiser automatiquement avec l'IA
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Best Channel Modal ────────────────────────────────────────────────────────

function BestChannelModal({ onClose }: { onClose: () => void }) {
  const { activeEstablishment } = useEstablishment();
  const kpi = activeEstablishment.kpi;

  const channels = [
    {
      name: 'Google Business',
      icon: Star,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      leads: 112,
      pct: 42,
      bar: 'bg-amber-400',
      label: 'Canal #1 — Avis & Recherche locale',
      tip: 'Vos avis Google génèrent 42% de vos leads. Répondez à chaque avis pour amplifier l\'effet.'
    },
    {
      name: 'WhatsApp Business',
      icon: MessageSquare,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      leads: 68,
      pct: 26,
      bar: 'bg-emerald-400',
      label: 'Canal #2 — Messagerie directe',
      tip: 'Les campagnes WhatsApp ont un taux d\'ouverture de 98%. Activez les campagnes flash.'
    },
    {
      name: 'Instagram',
      icon: Wifi,
      color: 'text-pink-500',
      bg: 'bg-pink-50',
      leads: 53,
      pct: 20,
      bar: 'bg-pink-400',
      label: 'Canal #3 — Réseaux sociaux',
      tip: 'Vos reels génèrent le plus d\'engagement. Publiez 3x/semaine pour optimiser.'
    },
    {
      name: 'Référencement local',
      icon: TrendingUp,
      color: 'text-violet-500',
      bg: 'bg-violet-50',
      leads: 32,
      pct: 12,
      bar: 'bg-violet-400',
      label: 'Canal #4 — SEO local',
      tip: 'Enrichissez vos citations locales (Pages Jaunes, Tripadvisor) pour augmenter ce score.'
    },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
              <TrendingUp size={16} className="text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Canal d'acquisition</p>
              <p className="text-[11px] text-muted-foreground">Répartition de vos leads ce mois</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Channels */}
        <div className="px-5 py-4 space-y-3 max-h-80 overflow-y-auto">
          {channels.map(ch => {
            const Icon = ch.icon;
            return (
              <div key={ch.name} className="rounded-xl border border-border p-3.5 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg ${ch.bg} flex items-center justify-center shrink-0`}>
                    <Icon size={15} className={ch.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-foreground truncate">{ch.name}</p>
                      <span className="text-xs font-extrabold text-foreground tabular-nums shrink-0">{ch.leads} leads</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium">{ch.label}</p>
                  </div>
                </div>
                {/* Bar */}
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${ch.bar} transition-all duration-700`} style={{ width: `${ch.pct}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{ch.tip}</p>
              </div>
            );
          })}
        </div>

        <div className="px-5 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-primary text-primary-foreground text-sm font-bold py-3 hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            Amplifier mon canal #1
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function DiagnosticButtons() {
  const [geoOpen, setGeoOpen] = useState(false);
  const [channelOpen, setChannelOpen] = useState(false);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Santé établissement */}
        <button
          onClick={() => setGeoOpen(true)}
          className="group flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 text-left hover:border-teal-300 hover:bg-teal-50/30 hover:shadow-sm active:scale-[0.99] transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0 group-hover:bg-teal-100 transition-colors">
            <Building2 size={18} className="text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground leading-tight">Santé de votre établissement local</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Checklist G.E.O. · 5/8 critères validés</p>
          </div>
          <ChevronRight
            size={18}
            className="text-muted-foreground/60 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all shrink-0"
          />
        </button>

        {/* Canal d'acquisition */}
        <button
          onClick={() => setChannelOpen(true)}
          className="group flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 text-left hover:border-violet-300 hover:bg-violet-50/30 hover:shadow-sm active:scale-[0.99] transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0 group-hover:bg-violet-100 transition-colors">
            <TrendingUp size={18} className="text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground leading-tight">Votre canal d'acquisition le plus performant</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Google Business · 112 leads ce mois</p>
          </div>
          <ChevronRight
            size={18}
            className="text-muted-foreground/60 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all shrink-0"
          />
        </button>
      </div>

      {geoOpen && <GeoHealthModal onClose={() => setGeoOpen(false)} />}
      {channelOpen && <BestChannelModal onClose={() => setChannelOpen(false)} />}
    </>
  );
}
