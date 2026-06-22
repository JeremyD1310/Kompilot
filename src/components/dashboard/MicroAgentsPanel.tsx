/**
 * MicroAgentsPanel — 3 Micro-Agents IA autonomes activables
 * Style Nimt.ai — toggle switches + live status indicators
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Zap, Star, TrendingUp, Activity, ChevronRight } from 'lucide-react';

interface AgentConfig {
  id: string;
  icon: React.ReactNode;
  name: string;
  tagline: string;
  description: string;
  accentColor: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
  liveStats: string;
  actions: string[];
}

const AGENTS: AgentConfig[] = [
  {
    id: 'presale',
    icon: <Zap size={16} />,
    name: 'Agent de Pré-vente',
    tagline: 'Automatise la capture des leads depuis votre messagerie.',
    description: 'Scanne vos messages entrants, identifie les intentions d\'achat et crée automatiquement des fiches prospects qualifiées dans votre CRM.',
    accentColor: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    dotColor: 'bg-amber-400',
    liveStats: '12 leads capturés aujourd\'hui',
    actions: ['Détection intention d\'achat', 'Création fiche prospect', 'Relance automatique J+1'],
  },
  {
    id: 'reputation',
    icon: <Star size={16} />,
    name: 'Agent Réputation',
    tagline: 'Détecte et signale automatiquement les avis suspects ou hors-sujet.',
    description: 'Analyse chaque nouvel avis Google en temps réel, détecte les faux avis et les avis hors-sujet, et génère les demandes de suppression auprès de Google.',
    accentColor: 'text-violet-500',
    bgColor: 'bg-violet-50 dark:bg-violet-950/30',
    borderColor: 'border-violet-200 dark:border-violet-800',
    dotColor: 'bg-violet-400',
    liveStats: '3 avis suspects signalés ce mois',
    actions: ['Analyse sentiment IA', 'Détection faux avis', 'Signalement automatique'],
  },
  {
    id: 'trendhunter',
    icon: <TrendingUp size={16} />,
    name: 'Agent Trend-Hunter',
    tagline: 'Scanne les réseaux locaux pour adapter votre communication en temps réel.',
    description: 'Surveille les tendances locales (hashtags, sujets viraux, événements) et suggère des créations de contenu adaptées à votre secteur et ville.',
    accentColor: 'text-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    dotColor: 'bg-emerald-400',
    liveStats: '8 tendances détectées cette semaine',
    actions: ['Scan réseaux locaux', 'Suggestions de contenu', 'Alerte événements proches'],
  },
];

function AgentToggle({ active, onChange }: { active: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={active}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none ${active ? 'bg-primary' : 'bg-muted'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${active ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  );
}

function LivePulse({ color }: { color: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-60`} />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
    </span>
  );
}

function AgentCard({ agent }: { agent: AgentConfig }) {
  const [active, setActive]   = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [taskIdx, setTaskIdx] = useState(0);
  const [booting, setBooting] = useState(false);

  const handleToggle = () => {
    if (!active) {
      setBooting(true);
      setTimeout(() => setBooting(false), 900);
    }
    setActive(v => !v);
  };

  // Cycle tasks when active
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setTaskIdx(i => (i + 1) % agent.actions.length), 2200);
    return () => clearInterval(t);
  }, [active, agent.actions.length]);

  return (
    <motion.div
      layout
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${active ? `${agent.borderColor} ${agent.bgColor}` : 'border-border bg-card/40'}`}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Icon */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${active ? `bg-current/10 ${agent.accentColor}` : 'bg-muted text-muted-foreground'}`}>
          {agent.icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-extrabold leading-none ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
              {agent.name}
            </p>
            {active && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1"
              >
                <LivePulse color={agent.dotColor} />
                <span className={`text-[9px] font-bold uppercase tracking-wide ${agent.accentColor}`}>
                  Actif
                </span>
              </motion.div>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug truncate">{agent.tagline}</p>
        </div>

        {/* Toggle + expand */}
        <div className="flex items-center gap-2 shrink-0">
          <AgentToggle active={active} onChange={handleToggle} />
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight size={14} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {/* Live activity ticker (when active) */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 overflow-hidden"
          >
            {booting ? (
              <div className="px-0 pb-3">
                <div className="space-y-2">
                  <div className="nc-skeleton h-3 w-3/4 rounded-lg" />
                  <div className="nc-skeleton h-3 w-1/2 rounded-lg" />
                  <div className="nc-skeleton h-8 rounded-xl" />
                </div>
              </div>
            ) : (
              <div className={`flex items-center gap-2 rounded-lg ${agent.bgColor} border ${agent.borderColor} px-3 py-2 mb-3`}>
                <Activity size={11} className={`${agent.accentColor} animate-pulse shrink-0`} />
                <AnimatePresence mode="wait">
                  <motion.p
                    key={taskIdx}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className={`text-[11px] font-semibold ${agent.accentColor}`}
                  >
                    ↳ {agent.actions[taskIdx]}…
                  </motion.p>
                </AnimatePresence>
                <span className="ml-auto text-[9px] text-muted-foreground font-medium">{agent.liveStats}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-2">
              <p className="text-[11px] text-muted-foreground leading-relaxed">{agent.description}</p>
              <div className="space-y-1">
                {agent.actions.map((action, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className={`w-1 h-1 rounded-full shrink-0 ${agent.dotColor}`} />
                    {action}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function MicroAgentsPanel() {
  return (
    <div className="rounded-2xl border border-border bg-card/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center shrink-0 shadow-md shadow-primary/30">
          <Bot size={17} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-foreground leading-none">⚡ Micro-Agents IA</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Agents autonomes · Activez en un clic</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted rounded-full px-2.5 py-1 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          3 agents disponibles
        </div>
      </div>

      <div className="p-3 space-y-2">
        {AGENTS.map(agent => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-3 border-t border-border bg-muted/20">
        <p className="text-[10px] text-muted-foreground text-center">
          Les agents tournent en continu · 0 action manuelle requise · Résultats automatiques
        </p>
      </div>
    </div>
  );
}
