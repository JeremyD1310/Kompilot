/**
 * AntiVideEngine — Orchestrateur principal
 *
 * Module "Growth Anti-Vide" : fin du contenu invisible.
 * 3 modes :
 *   Hook Generator  → AIDA / PAS / Hook Répulsif au Vide
 *   Local Sync      → recycle avis 5★ ou événement local en post scénarisé
 *   Adaptation      → adapte le contenu pour chaque réseau sélectionné
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Copy, Check, RefreshCw, Sparkles, Target, ChevronDown } from 'lucide-react';
import { Card, Button, Badge, Tabs, TabsList, TabsTrigger, TabsContent, toast } from '@blinkdotnew/ui';
import { aiGenerate } from '@/lib/aiRouterClient';
import type { GoogleReview } from '@/components/inbox/reviewsData';

import {
  NETWORK_CONFIG,
  buildHookPrompt, buildReviewSyncPrompt, buildEventSyncPrompt, buildAdaptPrompt,
  type Mode, type Structure, type Network, type LocalEvent,
} from './types';
import { HookGeneratorTab, LocalSyncTab, AdaptTab } from './Tabs';

/* ── Composant ───────────────────────────────────────────────── */
export function AntiVideEngine({ name, city }: { name: string; city: string }) {
  /* ── State ─────────────────────────────────────────────────── */
  const [activeMode,     setActiveMode]     = useState<Mode>('hooks');
  const [structure,      setStructure]      = useState<Structure>('HOOK_REPULSIF');
  const [networks,       setNetworks]       = useState<Network[]>(['instagram']);
  const [topic,          setTopic]          = useState('');
  const [selectedEvent,  setSelectedEvent]  = useState<LocalEvent | null>(null);
  const [selectedReview, setSelectedReview] = useState<GoogleReview | null>(null);
  const [output,         setOutput]         = useState('');
  const [loading,        setLoading]        = useState(false);
  const [copied,         setCopied]         = useState(false);
  const [showNets,       setShowNets]       = useState(false);

  const primaryNet = networks[0] ?? 'instagram';

  /* ── Toggle réseau ─────────────────────────────────────────── */
  const toggleNetwork = useCallback((n: Network) => {
    setNetworks(prev =>
      prev.includes(n)
        ? prev.length > 1 ? prev.filter(x => x !== n) : prev
        : [...prev, n]
    );
  }, []);

  /* ── Génération IA ─────────────────────────────────────────── */
  const generate = useCallback(async () => {
    if (loading) return;

    let prompt = '';
    let taskType: 'MARKETING_COPY' | 'CREATIVE_CONTENT' = 'MARKETING_COPY';

    if (activeMode === 'hooks') {
      if (!topic.trim()) { toast.error('Saisissez le sujet du post'); return; }
      prompt = buildHookPrompt(structure, topic, primaryNet, name, city);
    } else if (activeMode === 'local-sync') {
      if (selectedReview) {
        prompt    = buildReviewSyncPrompt(selectedReview, primaryNet, name);
        taskType  = 'CREATIVE_CONTENT';
      } else if (selectedEvent) {
        prompt    = buildEventSyncPrompt(selectedEvent, topic, primaryNet, name, city);
        taskType  = 'CREATIVE_CONTENT';
      } else {
        toast.error('Sélectionnez un avis ou un événement local'); return;
      }
    } else {
      // adapt
      if (!output.trim()) { toast.error('Générez d\'abord un contenu en mode Hook ou Local Sync'); return; }
      prompt   = buildAdaptPrompt(output, networks);
      taskType = 'CREATIVE_CONTENT';
    }

    setLoading(true);
    setOutput('');
    try {
      const res = await aiGenerate({ taskType, prompt, contextData: { establishmentName: name, city }, maxTokens: 1200 });
      setOutput(res.content);
    } catch {
      toast.error('Erreur IA — réessayez dans un instant');
    } finally {
      setLoading(false);
    }
  }, [loading, activeMode, topic, structure, primaryNet, selectedReview, selectedEvent, name, city, output, networks]);

  /* ── Copy ──────────────────────────────────────────────────── */
  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success('Contenu copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Labels CTA Générer ─────────────────────────────────────── */
  const generateLabel: Record<Mode, string> = {
    hooks:        'Générer le Hook IA',
    'local-sync': 'Générer le Post depuis ce Signal',
    adapt:        'Adapter sur tous les réseaux sélectionnés',
  };

  return (
    <Card className="overflow-hidden border-2 border-violet-200 dark:border-violet-900/50 bg-gradient-to-br from-white via-violet-50/30 to-white dark:from-slate-900 dark:via-violet-950/10 dark:to-slate-900 shadow-xl shadow-violet-100/50 dark:shadow-none">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-violet-100 dark:border-violet-900/30 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              Growth Anti-Vide Engine
              <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-none text-[10px]">BETA IA</Badge>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Hooks AIDA/PAS · Recyclage local · Adaptation multi-réseaux</p>
          </div>
        </div>

        {/* Network picker */}
        <div className="relative">
          <button
            onClick={() => setShowNets(v => !v)}
            className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="text-slate-500">Réseaux :</span>
            <span className="font-bold text-slate-900 dark:text-white">{networks.map(n => NETWORK_CONFIG[n].label).join(', ')}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showNets ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showNets && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 min-w-[200px] space-y-1"
              >
                {(Object.entries(NETWORK_CONFIG) as [Network, typeof NETWORK_CONFIG[Network]][]).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => toggleNetwork(key)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      networks.includes(key)
                        ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-semibold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className={`shrink-0 text-xs ${cfg.color.split(' ')[1]}`}>{cfg.label[0]}</span>
                    <span className="flex-1 text-left">{cfg.label}</span>
                    <span className="text-[10px] text-slate-400">{cfg.format}</span>
                    {networks.includes(key) && <Check className="w-3.5 h-3.5 text-violet-500" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <Tabs value={activeMode} onValueChange={v => { setActiveMode(v as Mode); setOutput(''); }}>
        <div className="px-5 pt-4">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="hooks"><Zap className="w-3.5 h-3.5 mr-1.5" />Hook Generator</TabsTrigger>
            <TabsTrigger value="local-sync"><Sparkles className="w-3.5 h-3.5 mr-1.5" />Local Sync</TabsTrigger>
            <TabsTrigger value="adapt"><Target className="w-3.5 h-3.5 mr-1.5" />Adaptation</TabsTrigger>
          </TabsList>
        </div>

        <div className="p-5 space-y-5">
          <TabsContent value="hooks" className="mt-0">
            <HookGeneratorTab structure={structure} setStructure={setStructure} topic={topic} setTopic={setTopic} networks={networks} />
          </TabsContent>
          <TabsContent value="local-sync" className="mt-0">
            <LocalSyncTab selectedReview={selectedReview} setSelectedReview={setSelectedReview} selectedEvent={selectedEvent} setSelectedEvent={setSelectedEvent} topic={topic} setTopic={setTopic} networks={networks} />
          </TabsContent>
          <TabsContent value="adapt" className="mt-0">
            <AdaptTab currentOutput={output} networks={networks} toggleNetwork={toggleNetwork} />
          </TabsContent>

          {/* ── CTA Générer ─────────────────────────────────── */}
          <div className="relative">
            {!loading && (
              <motion.div
                className="absolute -inset-[2px] rounded-xl bg-gradient-to-r from-violet-400/20 via-purple-400/25 to-violet-400/20 blur-sm"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
            <Button
              onClick={generate}
              disabled={loading}
              className="relative w-full h-11 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-bold rounded-xl gap-2.5 shadow-lg shadow-violet-500/30 transition-all hover:scale-[1.01] disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
            >
              {loading
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Génération en cours…</>
                : <><Zap className="w-4 h-4" /> {generateLabel[activeMode]}</>}
            </Button>
          </div>

          {/* ── Output ──────────────────────────────────────── */}
          <AnimatePresence>
            {(output || loading) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-violet-500" /> Contenu généré
                  </span>
                  {output && (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={generate} className="h-7 px-2 text-xs text-slate-500">
                        <RefreshCw className="w-3 h-3 mr-1" /> Regénérer
                      </Button>
                      <Button size="sm" onClick={handleCopy}
                        className={`h-7 px-3 text-xs ${copied ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-violet-500 hover:bg-violet-600'} text-white`}
                      >
                        {copied ? <><Check className="w-3 h-3 mr-1" />Copié !</> : <><Copy className="w-3 h-3 mr-1" />Copier</>}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="relative rounded-2xl border border-violet-200 dark:border-violet-900/40 bg-white dark:bg-slate-900 min-h-[140px]">
                  {loading ? (
                    <div className="flex items-center justify-center h-36">
                      <div className="space-y-2.5 w-3/4">
                        {[100, 85, 90, 70, 95, 60].map((w, i) => (
                          <div key={i} className="h-3 rounded-full bg-violet-100 dark:bg-violet-900/30 animate-pulse" style={{ width: `${w}%` }} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <pre className="p-5 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">{output}</pre>
                  )}
                </div>

                {output && (
                  <div className="flex flex-wrap gap-2">
                    {networks.map(n => (
                      <span key={n} className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${NETWORK_CONFIG[n].color} bg-white dark:bg-slate-900`}>
                        {NETWORK_CONFIG[n].label} · {NETWORK_CONFIG[n].format}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Tabs>
    </Card>
  );
}
