/**
 * StepAgencyReports — Onboarding Agence : Rapports PDF marque blanche automatisés
 * Permet à l'agence de configurer ses rapports clients dès l'onboarding.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, Download, CheckCircle2, ArrowRight, Calendar, FileText } from 'lucide-react';

interface Props { onComplete: () => void }

const TEMPLATES = [
  {
    id: 'monthly',
    label: 'Rapport mensuel',
    desc: 'KPIs, avis, publications, CA récupéré',
    icon: '📊',
    popular: true,
  },
  {
    id: 'performance',
    label: 'Rapport de performance',
    desc: 'Analyse GEO, visibilité IA, tendances',
    icon: '📈',
  },
  {
    id: 'annual',
    label: 'Bilan annuel',
    desc: 'Synthèse ROI, progression, recommandations',
    icon: '🏆',
  },
];

const KPI_OPTIONS = [
  { id: 'geo', label: 'Score GEO IA', emoji: '🌍', defaultOn: true },
  { id: 'reviews', label: 'Avis traités', emoji: '⭐', defaultOn: true },
  { id: 'posts', label: 'Publications', emoji: '📝', defaultOn: true },
  { id: 'revenue', label: 'CA récupéré', emoji: '💰', defaultOn: true },
  { id: 'sms', label: 'SMS envoyés', emoji: '📱', defaultOn: false },
  { id: 'leads', label: 'Leads capturés', emoji: '🎯', defaultOn: false },
];

const SEND_OPTIONS = [
  { id: 'auto', label: 'Automatique le 1er du mois', icon: '🤖' },
  { id: 'manual', label: 'Envoi manuel sur demande', icon: '✋' },
];

export function StepAgencyReports({ onComplete }: Props) {
  const [template, setTemplate] = useState('monthly');
  const [kpis, setKpis] = useState<Set<string>>(new Set(KPI_OPTIONS.filter(k => k.defaultOn).map(k => k.id)));
  const [sendMode, setSendMode] = useState('auto');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const toggleKpi = (id: string) => {
    setKpis(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerated(true);
      setTimeout(onComplete, 800);
    }, 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 px-3.5 py-3 flex items-start gap-2.5">
        <BarChart2 size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
          <strong>RAPPORTS PDF AUTOMATISÉS :</strong> Générez et envoyez des rapports marque blanche
          à chaque client chaque mois. Zéro effort — votre logo, vos couleurs, vos données.
        </p>
      </div>

      {/* Template selector */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Template de rapport</p>
        <div className="space-y-1.5">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => setTemplate(t.id)}
              className={`relative w-full flex items-center gap-3 rounded-xl border-2 px-3.5 py-2.5 text-left transition-all ${
                template === t.id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              {t.popular && (
                <span className="absolute -top-2 left-3 text-[9px] font-black bg-violet-500 text-white rounded-full px-2 py-0.5 uppercase">Populaire</span>
              )}
              <span className="text-xl shrink-0">{t.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground">{t.label}</p>
                <p className="text-[10px] text-muted-foreground">{t.desc}</p>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                template === t.id ? 'border-primary bg-primary' : 'border-border'
              }`}>
                {template === t.id && <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.2" strokeLinecap="round"/></svg>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* KPI selector */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">KPIs inclus</p>
        <div className="grid grid-cols-3 gap-1.5">
          {KPI_OPTIONS.map(kpi => (
            <button
              key={kpi.id}
              onClick={() => toggleKpi(kpi.id)}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2.5 text-center transition-all ${
                kpis.has(kpi.id) ? 'border-primary bg-primary/5' : 'border-border bg-card opacity-50 hover:opacity-80'
              }`}
            >
              <span className="text-base">{kpi.emoji}</span>
              <span className="text-[9px] font-bold text-foreground leading-tight">{kpi.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Send mode */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Mode d'envoi</p>
        <div className="grid grid-cols-2 gap-2">
          {SEND_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => setSendMode(opt.id)}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition-all ${
                sendMode === opt.id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <span className="text-xl">{opt.icon}</span>
              <span className="text-[10px] font-bold text-foreground leading-tight">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <AnimatePresence mode="wait">
        {!generated ? (
          <motion.button
            key="cta"
            onClick={handleGenerate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold py-2.5 shadow-md disabled:opacity-70 transition-all active:scale-[0.98]"
          >
            {generating ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Génération du rapport exemple…
              </>
            ) : (
              <>
                <FileText size={14} />
                Générer mon rapport d'exemple
                <Download size={14} />
              </>
            )}
          </motion.button>
        ) : (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 px-3.5 py-3 flex items-center gap-3"
          >
            <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                Rapports configurés — envoi automatique activé !
              </p>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                {kpis.size} KPIs inclus · Envoi le 1er du mois
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
