/**
 * MonEquipePage — AI Agent Roster & Interactive Workspace
 *
 * View 1: "Mon Équipe" overview — displays AI agents as virtual employees
 * View 2: Agent workspace — focused command center for a single agent
 *
 * Design: deep charcoal #0B0B0C, warm amber/orange #FF6B00 glow accents.
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Send, ChevronRight, Sparkles, Image, Globe,
  Lock, Zap, Crown, ToggleLeft, ToggleRight, Users,
  FileText, Search, Workflow, Loader2,
} from 'lucide-react';
import { Page, PageHeader, PageTitle, PageDescription, PageBody, toast } from '@blinkdotnew/ui';
import { useAuth } from '../hooks/useAuth';
import { AgentUpsellModal } from '../components/team/AgentUpsellModal';

// ── Agent data ───────────────────────────────────────────────────────────────

type AgentTier = 'junior' | 'senior';

interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  tier: AgentTier;
  avatar: string;         // emoji or initial
  color: string;           // glow color
  bgGradient: string;      // card gradient
  icon: typeof FileText;
}

const AGENTS: Agent[] = [
  {
    id: 'stan',
    name: 'Stan',
    role: 'Creative Studio',
    description: 'Content & Social Media',
    tier: 'junior',
    avatar: 'S',
    color: '#FF6B00',
    bgGradient: 'linear-gradient(135deg, rgba(255,107,0,.08), rgba(255,140,64,.03))',
    icon: FileText,
  },
  {
    id: 'sacha',
    name: 'Sacha',
    role: 'SEO & AIO',
    description: 'Search Optimization & Server-Side Tracking',
    tier: 'junior',
    avatar: 'S',
    color: '#22D3EE',
    bgGradient: 'linear-gradient(135deg, rgba(34,211,238,.08), rgba(34,211,238,.03))',
    icon: Search,
  },
  {
    id: 'alex',
    name: 'Alex',
    role: 'Automation & Sync',
    description: 'API Integrations & CRM Workflows',
    tier: 'junior',
    avatar: 'A',
    color: '#A78BFA',
    bgGradient: 'linear-gradient(135deg, rgba(167,139,250,.08), rgba(167,139,250,.03))',
    icon: Workflow,
  },
];

// ── Platform selector ────────────────────────────────────────────────────────

const PLATFORMS = [
  { id: 'linkedin', label: 'LinkedIn', icon: Globe, color: '#0A66C2' },
  { id: 'twitter', label: 'X', icon: FileText, color: '#E7E9EA' },
  { id: 'facebook', label: 'Facebook', icon: Users, color: '#1877F2' },
  { id: 'instagram', label: 'Instagram', icon: Image, color: '#E4405F' },
];

// ── View 1: Team Roster ─────────────────────────────────────────────────────

function TeamRoster({ onSelectAgent }: { onSelectAgent: (agent: Agent) => void }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,107,0,.1)', border: '1px solid rgba(255,107,0,.2)' }}>
          <Users size={20} style={{ color: '#FF6B00' }} />
        </div>
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Mon Équipe</h2>
          <p className="text-xs text-slate-500">Vos agents IA — disponibles 24/7, jamais en pause</p>
        </div>
      </div>

      {/* Agent cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {AGENTS.map((agent, i) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => onSelectAgent(agent)}
            className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all hover:translate-y-[-2px]"
            style={{
              background: agent.bgGradient,
              border: `1px solid rgba(255,255,255,.06)`,
            }}
          >
            {/* Glow on hover */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: `radial-gradient(circle at 50% 30%, ${agent.color}15, transparent 70%)` }}
            />

            <div className="relative p-5">
              {/* Avatar + tier badge */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black text-white"
                  style={{
                    background: `linear-gradient(135deg, ${agent.color}30, ${agent.color}10)`,
                    border: `1px solid ${agent.color}30`,
                    boxShadow: `0 0 24px ${agent.color}15`,
                  }}
                >
                  {agent.avatar}
                </div>

                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    background: agent.tier === 'senior' ? 'rgba(255,107,0,.15)' : 'rgba(255,255,255,.05)',
                    color: agent.tier === 'senior' ? '#FF6B00' : '#64748B',
                    border: `1px solid ${agent.tier === 'senior' ? 'rgba(255,107,0,.3)' : 'rgba(255,255,255,.08)'}`,
                  }}
                >
                  {agent.tier === 'senior' ? <Crown size={9} /> : null}
                  {agent.tier}
                </span>
              </div>

              {/* Name + role */}
              <h3 className="text-base font-bold text-white mb-0.5">{agent.name}</h3>
              <p className="text-xs font-semibold mb-1" style={{ color: agent.color }}>{agent.role}</p>
              <p className="text-[11px] text-slate-500 mb-4">{agent.description}</p>

              {/* Action */}
              <div className="flex items-center gap-2 text-xs font-bold group-hover:gap-3 transition-all" style={{ color: agent.color }}>
                <span>Donner un ordre</span>
                <ChevronRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Info strip */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)' }}>
        <Sparkles size={14} style={{ color: '#FF6B00' }} className="shrink-0" />
        <p className="text-[11px] text-slate-500">
          Chaque agent est un expert IA spécialisé. Cliquez sur un agent pour lui donner un ordre direct.
          <span className="text-slate-400 font-medium"> Junior inclus dans votre plan · Senior = +29€/mois.</span>
        </p>
      </div>
    </div>
  );
}

// ── View 2: Agent Workspace (Stan) ──────────────────────────────────────────

function AgentWorkspace({ agent, onBack }: { agent: Agent; onBack: () => void }) {
  const [command, setCommand] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set(['linkedin']));
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<Record<string, string> | null>(null);
  const [autoPublish, setAutoPublish] = useState(false);
  const [showVisuals, setShowVisuals] = useState(false);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [upsellFeature, setUpsellFeature] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isSenior = agent.tier === 'senior';

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (!command.trim()) return;
    setIsGenerating(true);
    setGeneratedContent(null);

    // Simulate AI generation
    await new Promise(r => setTimeout(r, 2000));

    const platforms = Array.from(selectedPlatforms);
    const content: Record<string, string> = {};
    for (const p of platforms) {
      const platformName = PLATFORMS.find(pl => pl.id === p)?.label ?? p;
      content[p] = `[${platformName}] ${command}\n\nVoici une version adaptée pour ${platformName} :\n\n${command.length > 50 ? command.slice(0, 120) + '...' : command}\n\n#Kompilot #${platformName} #MarketingLocal`;
    }
    setGeneratedContent(content);
    setIsGenerating(false);
    toast.success(`${agent.name} a généré votre contenu !`);
  };

  const handlePublishToggle = () => {
    if (!isSenior) {
      setUpsellFeature('la publication automatique multi-canal directe');
      setUpsellOpen(true);
      return;
    }
    setAutoPublish(v => !v);
    toast.success(autoPublish ? 'Publication auto désactivée' : 'Publication auto activée');
  };

  const handleVisualClick = () => {
    if (!isSenior) {
      setUpsellFeature('la génération de visuels automatiques à votre charte');
      setUpsellOpen(true);
      return;
    }
    setShowVisuals(v => !v);
  };

  return (
    <div className="space-y-5">
      {/* Back + agent header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={15} className="text-slate-400" />
        </button>
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-base font-black text-white"
          style={{
            background: `linear-gradient(135deg, ${agent.color}30, ${agent.color}10)`,
            border: `1px solid ${agent.color}30`,
          }}
        >
          {agent.avatar}
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">{agent.name} <span className="text-slate-500 font-normal text-sm">— {agent.role}</span></h2>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-0.5"
            style={{
              background: isSenior ? 'rgba(255,107,0,.15)' : 'rgba(255,255,255,.05)',
              color: isSenior ? '#FF6B00' : '#64748B',
              border: `1px solid ${isSenior ? 'rgba(255,107,0,.3)' : 'rgba(255,255,255,.08)'}`,
            }}
          >
            {isSenior ? <Crown size={8} /> : null}
            {agent.tier}
          </span>
        </div>
      </div>

      {/* Command input */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}>
        <div className="p-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Que doit faire {agent.name} aujourd'hui ?
          </p>
          <textarea
            ref={inputRef}
            value={command}
            onChange={e => setCommand(e.target.value)}
            placeholder={`Ex: Rédige un post LinkedIn et décline-le sur Facebook/Instagram pour notre prochain lancement...`}
            rows={3}
            className="w-full bg-transparent text-sm text-white placeholder:text-slate-600 outline-none resize-none leading-relaxed"
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
          />
        </div>

        {/* Platform selector */}
        <div className="flex items-center gap-2 px-4 pb-3">
          <Globe size={12} className="text-slate-600 shrink-0" />
          {PLATFORMS.map(p => {
            const active = selectedPlatforms.has(p.id);
            return (
              <button
                key={p.id}
                onClick={() => togglePlatform(p.id)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                style={{
                  background: active ? `${p.color}18` : 'rgba(255,255,255,.03)',
                  border: `1px solid ${active ? `${p.color}40` : 'rgba(255,255,255,.06)'}`,
                  color: active ? p.color : '#475569',
                }}
              >
                <p.icon size={12} />
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-white/5">
          <button
            onClick={handleVisualClick}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all"
            style={{
              background: isSenior ? 'rgba(255,107,0,.1)' : 'rgba(255,255,255,.03)',
              border: `1px solid ${isSenior ? 'rgba(255,107,0,.25)' : 'rgba(255,255,255,.06)'}`,
              color: isSenior ? '#FF6B00' : '#475569',
            }}
          >
            <Image size={12} />
            Visuels
            {!isSenior && <Lock size={9} className="text-slate-600" />}
          </button>

          <button
            onClick={handlePublishToggle}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all"
            style={{
              background: autoPublish ? 'rgba(255,107,0,.1)' : 'rgba(255,255,255,.03)',
              border: `1px solid ${autoPublish ? 'rgba(255,107,0,.25)' : 'rgba(255,255,255,.06)'}`,
              color: autoPublish ? '#FF6B00' : '#475569',
            }}
          >
            {autoPublish ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            Planifier & Publier
            {!isSenior && <Lock size={9} className="text-slate-600" />}
          </button>

          <div className="flex-1" />

          <button
            onClick={handleGenerate}
            disabled={!command.trim() || isGenerating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(135deg, ${agent.color}, ${agent.color}CC)`,
              boxShadow: `0 4px 16px ${agent.color}30`,
            }}
          >
            {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            {isGenerating ? `${agent.name} rédige...` : `Envoyer à ${agent.name}`}
          </button>
        </div>
      </div>

      {/* Generated content */}
      <AnimatePresence>
        {generatedContent && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="space-y-4"
          >
            {Object.entries(generatedContent).map(([platform, content]) => {
              const p = PLATFORMS.find(pl => pl.id === platform);
              if (!p) return null;
              return (
                <div key={platform} className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)' }}>
                  {/* Platform header */}
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
                    <p.icon size={14} style={{ color: p.color }} />
                    <span className="text-xs font-bold" style={{ color: p.color }}>{p.label}</span>
                    <span className="text-[10px] text-slate-600 ml-auto">Draft</span>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{content}</p>
                  </div>
                </div>
              );
            })}

            {/* Visual preview zone (Junior = blurred, Senior = real) */}
            <div className="relative rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)' }}>
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Image size={14} style={{ color: '#FF6B00' }} />
                  <span className="text-xs font-bold text-slate-300">Visual Generation</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {['Square', 'Vertical'].map(format => (
                    <span key={format} className="px-2 py-0.5 rounded text-[9px] font-bold text-slate-500 bg-white/5 border border-white/5">
                      {format}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                {[1, 2].map(i => (
                  <div key={i} className="aspect-square rounded-xl" style={{
                    background: `linear-gradient(135deg, ${agent.color}15, ${agent.color}05)`,
                    border: `1px solid ${agent.color}15`,
                    filter: isSenior ? 'none' : 'blur(6px)',
                  }}>
                    {isSenior && (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image size={28} style={{ color: agent.color }} className="opacity-30" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {!isSenior && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="px-4 py-2.5 rounded-xl text-center pointer-events-auto" style={{ background: 'rgba(11,11,12,.9)', border: '1px solid rgba(255,107,0,.2)' }}>
                    <Lock size={16} style={{ color: '#FF6B00' }} className="mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-white">Visuels Premium</p>
                    <p className="text-[10px] text-slate-500">Passez {agent.name} en Senior</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upsell modal */}
      <AgentUpsellModal
        open={upsellOpen}
        onClose={() => setUpsellOpen(false)}
        agentName={agent.name}
        feature={upsellFeature}
        onConfirm={() => toast.success(`${agent.name} promu Senior !`, { description: 'Fonctionnalités premium débloquées.' })}
      />
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function MonEquipePage() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  return (
    <Page>
      <PageHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,107,0,.1)', border: '1px solid rgba(255,107,0,.2)' }}>
            <Sparkles size={20} style={{ color: '#FF6B00' }} />
          </div>
          <div>
            <PageTitle>{selectedAgent ? `Espace ${selectedAgent.name}` : 'Mon Équipe'}</PageTitle>
            <PageDescription>
              {selectedAgent
                ? `${selectedAgent.role} — Donnez vos ordres directement`
                : 'Vos agents IA — disponibles 24/7, jamais en pause'
              }
            </PageDescription>
          </div>
        </div>
      </PageHeader>

      <PageBody>
        <AnimatePresence mode="wait">
          {selectedAgent ? (
            <motion.div
              key="workspace"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <AgentWorkspace agent={selectedAgent} onBack={() => setSelectedAgent(null)} />
            </motion.div>
          ) : (
            <motion.div
              key="roster"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              <TeamRoster onSelectAgent={setSelectedAgent} />
            </motion.div>
          )}
        </AnimatePresence>
      </PageBody>
    </Page>
  );
}
