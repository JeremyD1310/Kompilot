/**
 * LLMVisibilityTracker — Module 3: Real-time LLM Visibility Tracking
 *
 * Tracks whether a brand is cited by AI engines (OpenAI, Gemini, Perplexity, Claude)
 * on user-defined natural queries. Shows per-engine results, score history,
 * and sentiment analysis.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Plus, Play, Trash2, ChevronDown, ChevronUp,
  TrendingUp, Globe, Search, RefreshCw, ExternalLink,
  AlertCircle, CheckCircle2, XCircle, Minus, Loader2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const BACKEND_URL = 'https://gbrhsehk.backend.blink.new';

// ── Types ────────────────────────────────────────────────────────────────────

interface Tracker {
  id: string;
  userId: string;
  brandName: string;
  domainUrl: string;
  naturalQueries: string;
  enginesToCheck: string;
  checkFrequency: string;
  isActive: string;
  lastCheckAt: string;
  overallVisibilityScore: string;
  createdAt: string;
}

interface TrackerResult {
  id: string;
  trackerId: string;
  queryText: string;
  engine: string;
  responseText: string;
  brandMentioned: string;
  brandPosition: string | null;
  urlCited: string;
  sentiment: string;
  tokensUsed: string;
  checkedAt: string;
}

interface HistoryEntry {
  id: string;
  trackerId: string;
  score: string;
  queriesChecked: string;
  brandMentions: string;
  snapshotDate: string;
}

// ── Engine badge ─────────────────────────────────────────────────────────────

const ENGINE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  openai: { label: 'OpenAI', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  gemini: { label: 'Gemini', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  perplexity: { label: 'Perplexity', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  claude: { label: 'Claude', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
};

function EngineBadge({ engine }: { engine: string }) {
  const cfg = ENGINE_CONFIG[engine] ?? { label: engine, color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.color} ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
}

function SentimentIcon({ sentiment }: { sentiment: string }) {
  if (sentiment === 'positive') return <CheckCircle2 size={12} className="text-emerald-400" />;
  if (sentiment === 'negative') return <XCircle size={12} className="text-red-400" />;
  return <Minus size={12} className="text-slate-500" />;
}

// ── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="4" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease-out' }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-white">{score}</span>
    </div>
  );
}

// ── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return <p className="text-[10px] text-slate-500">Pas assez de données</p>;
  const max = Math.max(...data, 1);
  const w = 120, h = 32;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(' ');

  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
      {data.map((v, i) => (
        <circle key={i} cx={(i / (data.length - 1)) * w} cy={h - (v / max) * h} r="2" fill="#10b981" />
      ))}
    </svg>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

interface LLMVisibilityTrackerProps {
  brandName?: string;
  domainUrl?: string;
}

export function LLMVisibilityTracker({ brandName = '', domainUrl = '' }: LLMVisibilityTrackerProps) {
  const { user } = useAuth();
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [selectedTracker, setSelectedTracker] = useState<string | null>(null);
  const [results, setResults] = useState<TrackerResult[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Create form
  const [newBrand, setNewBrand] = useState(brandName);
  const [newDomain, setNewDomain] = useState(domainUrl);
  const [newQueries, setNewQueries] = useState('');

  const fetchHeaders = useCallback(async () => {
    const token = await (window as any).__blink?.auth?.getValidToken?.() ?? '';
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  }, []);

  // Load trackers
  const loadTrackers = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await fetchHeaders();
      const res = await fetch(`${BACKEND_URL}/api/llm-tracker/list`, { headers });
      const data = await res.json();
      setTrackers(data.trackers ?? []);
      if (data.trackers?.length && !selectedTracker) {
        setSelectedTracker(data.trackers[0].id);
      }
    } catch (e) { console.error('[LLM Tracker] load error:', e); }
    setLoading(false);
  }, [fetchHeaders, selectedTracker]);

  // Load results + history for selected tracker
  const loadDetails = useCallback(async (trackerId: string) => {
    try {
      const headers = await fetchHeaders();
      const [resResults, resHistory] = await Promise.all([
        fetch(`${BACKEND_URL}/api/llm-tracker/${trackerId}/results`, { headers }),
        fetch(`${BACKEND_URL}/api/llm-tracker/${trackerId}/history`, { headers }),
      ]);
      const dataR = await resResults.json();
      const dataH = await resHistory.json();
      setResults(dataR.results ?? []);
      setHistory(dataH.history ?? []);
    } catch (e) { console.error('[LLM Tracker] detail error:', e); }
  }, [fetchHeaders]);

  useEffect(() => { loadTrackers(); }, [loadTrackers]);
  useEffect(() => { if (selectedTracker) loadDetails(selectedTracker); }, [selectedTracker, loadDetails]);

  // Create tracker
  const handleCreate = async () => {
    if (!newBrand || !newQueries.trim()) return;
    const queries = newQueries.split('\n').map(q => q.trim()).filter(Boolean);
    try {
      const headers = await fetchHeaders();
      const res = await fetch(`${BACKEND_URL}/api/llm-tracker/create`, {
        method: 'POST', headers,
        body: JSON.stringify({ brandName: newBrand, domainUrl: newDomain, naturalQueries: queries }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreate(false);
        setNewQueries('');
        loadTrackers();
      }
    } catch (e) { console.error('[LLM Tracker] create error:', e); }
  };

  // Run check
  const handleCheck = async (trackerId: string) => {
    setChecking(true);
    try {
      const headers = await fetchHeaders();
      const res = await fetch(`${BACKEND_URL}/api/llm-tracker/check`, {
        method: 'POST', headers,
        body: JSON.stringify({ trackerId }),
      });
      const data = await res.json();
      if (data.success) {
        loadTrackers();
        loadDetails(trackerId);
      }
    } catch (e) { console.error('[LLM Tracker] check error:', e); }
    setChecking(false);
  };

  // Delete tracker
  const handleDelete = async (trackerId: string) => {
    try {
      const headers = await fetchHeaders();
      await fetch(`${BACKEND_URL}/api/llm-tracker/${trackerId}`, { method: 'DELETE', headers });
      setTrackers(prev => prev.filter(t => t.id !== trackerId));
      if (selectedTracker === trackerId) setSelectedTracker(null);
    } catch (e) { console.error('[LLM Tracker] delete error:', e); }
  };

  // Group results by query
  const groupedResults = results.reduce<Record<string, TrackerResult[]>>((acc, r) => {
    (acc[r.queryText] ??= []).push(r);
    return acc;
  }, {});

  const activeTracker = trackers.find(t => t.id === selectedTracker);
  const historyScores = history.map(h => Number(h.score));

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60">
        <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
          <Brain size={18} className="text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">LLM Visibility Tracker</p>
          <p className="text-[11px] text-muted-foreground">Suivi en temps réel de votre visibilité sur ChatGPT, Gemini, Perplexity et Claude</p>
        </div>
        <button
          onClick={() => setShowCreate(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 transition-colors"
        >
          <Plus size={12} /> Nouveau tracker
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-border/60 overflow-hidden"
          >
            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Marque</label>
                  <input
                    value={newBrand} onChange={e => setNewBrand(e.target.value)}
                    placeholder="Ex: Kompilot"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Domaine URL</label>
                  <input
                    value={newDomain} onChange={e => setNewDomain(e.target.value)}
                    placeholder="Ex: kompilot.fr"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Requêtes naturelles (une par ligne)</label>
                <textarea
                  value={newQueries} onChange={e => setNewQueries(e.target.value)}
                  placeholder={"Quel est le meilleur outil de gestion pour PME ?\nQuels logiciels recommandez-vous pour gérer un commerce local ?"}
                  rows={3}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={!newBrand || !newQueries.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Créer le tracker
                </button>
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors">
                  Annuler
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tracker list + details */}
      <div className="p-5">
        {loading && trackers.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="text-violet-400 animate-spin" />
          </div>
        ) : trackers.length === 0 ? (
          <div className="text-center py-8">
            <Brain size={32} className="mx-auto text-slate-600 mb-3" />
            <p className="text-sm text-slate-400">Aucun tracker configuré</p>
            <p className="text-xs text-slate-500 mt-1">Créez un tracker pour surveiller votre visibilité sur les moteurs IA</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trackers.map(tracker => {
              const score = Number(tracker.overallVisibilityScore) || 0;
              const queries: string[] = JSON.parse(tracker.naturalQueries || '[]');
              const isSelected = selectedTracker === tracker.id;

              return (
                <motion.div
                  key={tracker.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isSelected ? 'border-violet-500/40 bg-violet-500/5' : 'border-border/60 hover:border-violet-500/20'
                  }`}
                >
                  {/* Tracker summary row */}
                  <div
                    className="flex items-center gap-4 px-4 py-3 cursor-pointer"
                    onClick={() => setSelectedTracker(isSelected ? null : tracker.id)}
                  >
                    <ScoreRing score={score} size={48} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{tracker.brandName}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{tracker.domainUrl || 'Pas de domaine'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-500">{queries.length} requêtes</span>
                        {tracker.lastCheckAt && (
                          <span className="text-[10px] text-slate-500">
                            · Dernier scan: {new Date(tracker.lastCheckAt).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); handleCheck(tracker.id); }}
                        disabled={checking}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 transition-colors disabled:opacity-50"
                      >
                        {checking ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
                        Scanner
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(tracker.id); }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                      {isSelected ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                    </div>
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border/40 overflow-hidden"
                      >
                        <div className="px-4 py-4 space-y-4">
                          {/* Score history sparkline */}
                          {historyScores.length > 1 && (
                            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/30 border border-slate-700/50">
                              <TrendingUp size={14} className="text-emerald-400 shrink-0" />
                              <div className="flex-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Évolution du score</p>
                                <Sparkline data={historyScores} />
                              </div>
                              <span className="text-xs font-bold text-emerald-400">
                                {historyScores[historyScores.length - 1] - historyScores[0] > 0 ? '+' : ''}
                                {historyScores[historyScores.length - 1] - historyScores[0]} pts
                              </span>
                            </div>
                          )}

                          {/* Results grouped by query */}
                          {Object.keys(groupedResults).length === 0 ? (
                            <div className="text-center py-6">
                              <Search size={24} className="mx-auto text-slate-600 mb-2" />
                              <p className="text-xs text-slate-500">Aucun scan effectué. Cliquez sur "Scanner" pour lancer une analyse.</p>
                            </div>
                          ) : (
                            Object.entries(groupedResults).map(([query, queryResults]) => (
                              <div key={query} className="rounded-xl border border-border/40 overflow-hidden">
                                <div className="px-3 py-2 bg-slate-800/20 border-b border-border/40">
                                  <p className="text-xs font-bold text-foreground flex items-center gap-2">
                                    <Search size={11} className="text-violet-400" />
                                    "{query}"
                                  </p>
                                </div>
                                <div className="divide-y divide-border/30">
                                  {queryResults.map(r => (
                                    <div
                                      key={r.id}
                                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800/10 cursor-pointer"
                                      onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                                    >
                                      <EngineBadge engine={r.engine} />
                                      <div className="flex-1 min-w-0">
                                        {Number(r.brandMentioned) > 0 ? (
                                          <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                                            <CheckCircle2 size={11} /> Marque citée
                                            {r.brandPosition && <span className="text-slate-500 font-normal">(pos. {r.brandPosition})</span>}
                                          </span>
                                        ) : (
                                          <span className="flex items-center gap-1 text-[11px] text-red-400 font-bold">
                                            <XCircle size={11} /> Non citée
                                          </span>
                                        )}
                                      </div>
                                      <SentimentIcon sentiment={r.sentiment} />
                                      {Number(r.urlCited) > 0 && (
                                        <Globe size={11} className="text-cyan-400" title="URL citée" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
