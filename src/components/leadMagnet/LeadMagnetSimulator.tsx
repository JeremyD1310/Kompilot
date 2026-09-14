/**
 * LeadMagnetSimulator — Simulateur d'Automatisation (Lead Magnet)
 * Fond blanc, 3 champs, accordéon vertical, génération IA + envoi email.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, TrendingUp, Clock, DollarSign, Mail, User, Tag, ChevronDown, ChevronUp, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import { blink } from '../../blink/client';

interface LeadMagnetReport {
  savings_monthly_euros: number;
  hours_saved_monthly: number;
  pain_points: string[];
  recommendations: string[];
  roi_summary: string;
  next_step: string;
}

const POPULAR_TOOLS = [
  'Google Business Profile',
  'Meta Business Suite',
  'Canva',
  'Hootsuite / Buffer',
  'Trello / Notion',
  'Google Sheets / Excel',
  'WordPress',
  'Mailchimp / Brevo',
  'Calendly',
  'Aucun outil spécifique',
];

export function LeadMagnetSimulator() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<LeadMagnetReport | null>(null);
  const [expanded, setExpanded] = useState<string | null>('form');

  const toggleTool = (tool: string) => {
    setSelectedTools(prev =>
      prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setReport(null);
    try {
      const res = await blink.functions.invoke<{ report: LeadMagnetReport; sentToBrevo: boolean }>('api/lead-magnet/generate', {
        method: 'POST',
        body: { name: name.trim(), email: email.trim(), tools: selectedTools },
      });
      const data = (res as any)?.data ?? res;
      setReport(data.report);
      setExpanded('results');
      toast.success(data.sentToBrevo ? 'Rapport généré et envoyé par email !' : 'Rapport généré avec succès !');
    } catch {
      toast.error('Erreur lors de la génération. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const accordionSections = [
    {
      id: 'form',
      title: '1. Votre situation actuelle',
      icon: <User size={14} />,
      content: (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Nom */}
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Votre nom
            </label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Marie Dupont"
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Email professionnel
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="marie@entreprise.fr"
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
              />
            </div>
          </div>

          {/* Outils */}
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Outils actuellement utilisés
            </label>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_TOOLS.map(tool => {
                const isActive = selectedTools.includes(tool);
                return (
                  <button
                    key={tool}
                    onClick={() => toggleTool(tool)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/30'
                        : 'bg-muted/50 text-muted-foreground border border-border/60 hover:border-primary/20'
                    }`}
                  >
                    <Tag size={10} />
                    {tool}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || !name.trim() || !email.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Calcul en cours...</>
            ) : (
              <><Sparkles size={16} /> Calculer mes économies</>
            )}
          </button>
        </div>
      ),
    },
    {
      id: 'results',
      title: '2. Résultats de votre audit',
      icon: <TrendingUp size={14} />,
      disabled: !report,
      content: report ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
              <DollarSign size={18} className="text-emerald-600 mx-auto mb-1" />
              <p className="text-2xl font-extrabold text-emerald-700">{report.savings_monthly_euros}€</p>
              <p className="text-[10px] font-semibold text-emerald-600/70 uppercase">Économies / mois</p>
            </div>
            <div className="rounded-xl bg-sky-50 border border-sky-200 p-4 text-center">
              <Clock size={18} className="text-sky-600 mx-auto mb-1" />
              <p className="text-2xl font-extrabold text-sky-700">{report.hours_saved_monthly}h</p>
              <p className="text-[10px] font-semibold text-sky-600/70 uppercase">Gagnées / mois</p>
            </div>
          </div>

          {/* Pain points */}
          <div className="rounded-xl bg-amber-50/50 border border-amber-200 p-4">
            <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Zap size={12} /> Points de friction détectés
            </h4>
            <ul className="space-y-1.5">
              {report.pain_points.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-amber-800">
                  <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendations */}
          <div className="rounded-xl bg-teal-50/50 border border-teal-200 p-4">
            <h4 className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 size={12} /> Recommandations
            </h4>
            <ul className="space-y-1.5">
              {report.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-teal-800">
                  <span className="text-teal-500 mt-0.5 shrink-0">✓</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>

          {/* ROI Summary */}
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-center">
            <p className="text-sm font-bold text-primary">{report.roi_summary}</p>
            <a
              href="https://www.kompilot.fr/demo"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-lg px-4 py-2 hover:opacity-90 transition-opacity"
            >
              <Send size={12} />
              {report.next_step}
            </a>
          </div>
        </motion.div>
      ) : null,
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-primary/2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Sparkles size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">⚡ Simulateur d'Économies</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Découvrez combien vous pouvez économiser en automatisant votre présence en ligne
            </p>
          </div>
        </div>
      </div>

      {/* Accordion */}
      <div className="divide-y divide-border">
        {accordionSections.map(section => (
          <div key={section.id}>
            <button
              onClick={() => !section.disabled && setExpanded(expanded === section.id ? null : section.id)}
              disabled={section.disabled}
              className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors ${
                section.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-muted/50'
              }`}
            >
              <div className={`w-7 h-7 rounded-lg ${
                report && section.id === 'results' ? 'bg-emerald-100 text-emerald-600' : 'bg-muted text-muted-foreground'
              } flex items-center justify-center shrink-0`}>
                {report && section.id === 'results' ? <CheckCircle2 size={13} /> : section.icon}
              </div>
              <span className={`text-xs font-semibold flex-1 ${
                report && section.id === 'results' ? 'text-emerald-700' : 'text-foreground'
              }`}>
                {section.title}
                {section.id === 'results' && !report && (
                  <span className="ml-2 text-[10px] text-muted-foreground font-normal">
                    (remplissez le formulaire d'abord)
                  </span>
                )}
              </span>
              {!section.disabled && (
                expanded === section.id
                  ? <ChevronUp size={14} className="text-muted-foreground shrink-0" />
                  : <ChevronDown size={14} className="text-muted-foreground shrink-0" />
              )}
            </button>
            <AnimatePresence>
              {expanded === section.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5">{section.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
