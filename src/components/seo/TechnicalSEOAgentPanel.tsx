import { BACKEND_URL as KOMPILOT_BACKEND_URL } from '@/lib/backend';
/**
 * TechnicalSEOAgentPanel — Module 4: Autonomous SEO Agent
 *
 * Registers sites, crawls pages, analyzes SEO signals (title, meta, schema, alt texts,
 * internal links), generates optimized suggestions via AI.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Plus, Play, ChevronDown, ChevronUp,
  FileText, Image, Link2, Code, BarChart3,
  CheckCircle2, AlertCircle, XCircle, Loader2,
  Download, Wand2, Eye,
} from 'lucide-react';

const BACKEND_URL = KOMPILOT_BACKEND_URL;

// ── Types ────────────────────────────────────────────────────────────────────

interface SeoSite {
  id: string;
  userId: string;
  siteUrl: string;
  sitemapUrl: string;
  lastCrawlAt: string;
  crawlStatus: string;
  pagesCrawled: string;
  totalPages: string;
  overallSeoScore: string;
  createdAt: string;
}

interface PageAnalysis {
  id: string;
  siteId: string;
  pageUrl: string;
  pageType: string;
  currentTitle: string;
  currentMetaDesc: string;
  currentH1: string;
  currentImagesMissingAlt: string;
  currentSchemaMarkup: string;
  currentInternalLinks: string;
  optimizedTitle: string;
  optimizedMetaDesc: string;
  suggestedSchema: string;
  suggestedAltTexts: string;
  suggestedInternalLinks: string;
  titleScore: string | null;
  metaDescScore: string | null;
  schemaScore: string | null;
  imageAltScore: string | null;
  internalLinkScore: string | null;
  pageScore: string | null;
  status: string;
  analyzedAt: string;
}

interface SiteStats {
  total: number;
  avgScore: number;
  titleOptimized: number;
  metaOptimized: number;
  schemaPresent: number;
  imagesMissingAlt: number;
  pagesWithGoodInternalLinks: number;
  byType: Record<string, number>;
}

// ── Score color helper ───────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Correct';
  return 'À optimiser';
}

// ── Mini score badge ─────────────────────────────────────────────────────────

function ScoreBadge({ score, label, icon: Icon }: { score: number | null; label: string; icon: any }) {
  const s = score ?? 0;
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/30 border border-slate-700/50">
      <Icon size={13} className={scoreColor(s)} />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex-1 h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
            <div className={`h-full rounded-full ${scoreBg(s)}`} style={{ width: `${s}%`, transition: 'width 0.5s ease-out' }} />
          </div>
          <span className={`text-[11px] font-bold ${scoreColor(s)}`}>{s}</span>
        </div>
      </div>
    </div>
  );
}

// ── Page type badge ──────────────────────────────────────────────────────────

const PAGE_TYPE_CONFIG: Record<string, { label: string; emoji: string }> = {
  homepage: { label: 'Accueil', emoji: '🏠' },
  service: { label: 'Service', emoji: '⚙️' },
  product: { label: 'Produit', emoji: '🛍️' },
  blog: { label: 'Blog', emoji: '📝' },
  contact: { label: 'Contact', emoji: '📧' },
  about: { label: 'À propos', emoji: '👋' },
  unknown: { label: 'Autre', emoji: '📄' },
};

// ── Main component ──────────────────────────────────────────────────────────

interface TechnicalSEOAgentPanelProps {
  defaultSiteUrl?: string;
}

export function TechnicalSEOAgentPanel({ defaultSiteUrl = '' }: TechnicalSEOAgentPanelProps) {
  const [sites, setSites] = useState<SeoSite[]>([]);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [pages, setPages] = useState<PageAnalysis[]>([]);
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [optimizing, setOptimizing] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [expandedPage, setExpandedPage] = useState<string | null>(null);
  const [newSiteUrl, setNewSiteUrl] = useState(defaultSiteUrl);

  const fetchHeaders = useCallback(async () => {
    const token = await (window as any).__blink?.auth?.getValidToken?.() ?? '';
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  }, []);

  // Load sites
  const loadSites = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await fetchHeaders();
      const res = await fetch(`${BACKEND_URL}/api/seo-agent/sites`, { headers });
      const data = await res.json();
      setSites(data.sites ?? []);
      if (data.sites?.length && !selectedSite) {
        setSelectedSite(data.sites[0].id);
      }
    } catch (e) { console.error('[SEO Agent] load error:', e); }
    setLoading(false);
  }, [fetchHeaders, selectedSite]);

  // Load pages + overview
  const loadDetails = useCallback(async (siteId: string) => {
    try {
      const headers = await fetchHeaders();
      const [resPages, resOverview] = await Promise.all([
        fetch(`${BACKEND_URL}/api/seo-agent/${siteId}/pages`, { headers }),
        fetch(`${BACKEND_URL}/api/seo-agent/${siteId}/overview`, { headers }),
      ]);
      const dataP = await resPages.json();
      const dataO = await resOverview.json();
      setPages(dataP.pages ?? []);
      setStats(dataO.stats ?? null);
    } catch (e) { console.error('[SEO Agent] detail error:', e); }
  }, [fetchHeaders]);

  useEffect(() => { loadSites(); }, [loadSites]);
  useEffect(() => { if (selectedSite) loadDetails(selectedSite); }, [selectedSite, loadDetails]);

  // Register site
  const handleRegister = async () => {
    if (!newSiteUrl.trim()) return;
    try {
      const headers = await fetchHeaders();
      const res = await fetch(`${BACKEND_URL}/api/seo-agent/register`, {
        method: 'POST', headers,
        body: JSON.stringify({ siteUrl: newSiteUrl.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setShowRegister(false);
        setNewSiteUrl('');
        loadSites();
      }
    } catch (e) { console.error('[SEO Agent] register error:', e); }
  };

  // Start crawl
  const handleCrawl = async (siteId: string) => {
    setCrawling(true);
    try {
      const headers = await fetchHeaders();
      const res = await fetch(`${BACKEND_URL}/api/seo-agent/crawl`, {
        method: 'POST', headers,
        body: JSON.stringify({ siteId }),
      });
      const data = await res.json();
      if (data.success) {
        loadSites();
        loadDetails(siteId);
      }
    } catch (e) { console.error('[SEO Agent] crawl error:', e); }
    setCrawling(false);
  };

  // Optimize page
  const handleOptimize = async (pageId: string) => {
    setOptimizing(pageId);
    try {
      const headers = await fetchHeaders();
      const res = await fetch(`${BACKEND_URL}/api/seo-agent/optimize`, {
        method: 'POST', headers,
        body: JSON.stringify({ pageId }),
      });
      const data = await res.json();
      if (data.success && selectedSite) {
        loadDetails(selectedSite);
      }
    } catch (e) { console.error('[SEO Agent] optimize error:', e); }
    setOptimizing(null);
  };

  // Copy JSON-LD to clipboard
  const copySchema = (schema: string) => {
    try {
      const formatted = JSON.stringify(JSON.parse(schema), null, 2);
      navigator.clipboard.writeText(`<script type="application/ld+json">\n${formatted}\n</script>`);
    } catch {
      navigator.clipboard.writeText(schema);
    }
  };

  const activeSite = sites.find(s => s.id === selectedSite);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60">
        <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
          <Code size={18} className="text-cyan-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">Agent Technique SEO</p>
          <p className="text-[11px] text-muted-foreground">Analyse autonome — Schema Markup, Meta Tags, Alt Texts, Maillage interne</p>
        </div>
        <button
          onClick={() => setShowRegister(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition-colors"
        >
          <Plus size={12} /> Enregistrer un site
        </button>
      </div>

      {/* Register form */}
      <AnimatePresence>
        {showRegister && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-border/60 overflow-hidden"
          >
            <div className="px-5 py-4 flex gap-3">
              <input
                value={newSiteUrl} onChange={e => setNewSiteUrl(e.target.value)}
                placeholder="https://monsite.fr"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleRegister}
                disabled={!newSiteUrl.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 transition-colors"
              >
                Enregistrer
              </button>
              <button onClick={() => setShowRegister(false)} className="px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors">
                Annuler
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-5">
        {loading && sites.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="text-cyan-400 animate-spin" />
          </div>
        ) : sites.length === 0 ? (
          <div className="text-center py-8">
            <Globe size={32} className="mx-auto text-slate-600 mb-3" />
            <p className="text-sm text-slate-400">Aucun site enregistré</p>
            <p className="text-xs text-slate-500 mt-1">Enregistrez votre site pour que l'agent SEO l'analyse automatiquement</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sites.map(site => {
              const siteScore = Number(site.overallSeoScore) || 0;
              const isSelected = selectedSite === site.id;

              return (
                <motion.div
                  key={site.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isSelected ? 'border-cyan-500/40 bg-cyan-500/5' : 'border-border/60 hover:border-cyan-500/20'
                  }`}
                >
                  {/* Site summary */}
                  <div
                    className="flex items-center gap-4 px-4 py-3 cursor-pointer"
                    onClick={() => setSelectedSite(isSelected ? null : site.id)}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${scoreBg(siteScore)}/10`}>
                      <span className={`text-sm font-black ${scoreColor(siteScore)}`}>{siteScore}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{site.siteUrl}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-500">{site.pagesCrawled} pages crawlees</span>
                        {site.lastCrawlAt && (
                          <span className="text-[10px] text-slate-500">
                            · {new Date(site.lastCrawlAt).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                        {site.crawlStatus === 'crawling' && (
                          <span className="flex items-center gap-1 text-[10px] text-amber-400">
                            <Loader2 size={10} className="animate-spin" /> Crawling...
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); handleCrawl(site.id); }}
                        disabled={crawling || site.crawlStatus === 'crawling'}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition-colors disabled:opacity-50"
                      >
                        {crawling ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
                        Crawlee
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
                          {/* Stats overview */}
                          {stats && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <div className="px-3 py-2 rounded-xl bg-slate-800/30 border border-slate-700/50 text-center">
                                <p className="text-lg font-black text-white">{stats.total}</p>
                                <p className="text-[10px] text-slate-400">Pages</p>
                              </div>
                              <div className="px-3 py-2 rounded-xl bg-slate-800/30 border border-slate-700/50 text-center">
                                <p className={`text-lg font-black ${scoreColor(stats.avgScore)}`}>{stats.avgScore}</p>
                                <p className="text-[10px] text-slate-400">Score moyen</p>
                              </div>
                              <div className="px-3 py-2 rounded-xl bg-slate-800/30 border border-slate-700/50 text-center">
                                <p className="text-lg font-black text-amber-400">{stats.imagesMissingAlt}</p>
                                <p className="text-[10px] text-slate-400">Images sans alt</p>
                              </div>
                              <div className="px-3 py-2 rounded-xl bg-slate-800/30 border border-slate-700/50 text-center">
                                <p className="text-lg font-black text-cyan-400">{stats.schemaPresent}</p>
                                <p className="text-[10px] text-slate-400">Schema presents</p>
                              </div>
                            </div>
                          )}

                          {/* Page list */}
                          {pages.length === 0 ? (
                            <div className="text-center py-6">
                              <FileText size={24} className="mx-auto text-slate-600 mb-2" />
                              <p className="text-xs text-slate-500">Aucune page analysee. Lancez un crawl pour commencer.</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {pages.map(page => {
                                const pScore = Number(page.pageScore) || 0;
                                const typeCfg = PAGE_TYPE_CONFIG[page.pageType] ?? PAGE_TYPE_CONFIG.unknown;
                                const isExpanded = expandedPage === page.id;

                                return (
                                  <div key={page.id} className="rounded-xl border border-border/40 overflow-hidden">
                                    <div
                                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800/10 cursor-pointer"
                                      onClick={() => setExpandedPage(isExpanded ? null : page.id)}
                                    >
                                      <span className="text-sm shrink-0">{typeCfg.emoji}</span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-foreground truncate">{page.currentTitle || page.pageUrl}</p>
                                        <p className="text-[10px] text-slate-500 truncate">{page.pageUrl}</p>
                                      </div>
                                      <span className={`text-xs font-black ${scoreColor(pScore)}`}>{pScore}</span>
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          onClick={e => { e.stopPropagation(); handleOptimize(page.id); }}
                                          disabled={optimizing === page.id}
                                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition-colors disabled:opacity-50"
                                        >
                                          {optimizing === page.id ? <Loader2 size={10} className="animate-spin" /> : <Wand2 size={10} />}
                                          Optimiser
                                        </button>
                                        {isExpanded ? <ChevronUp size={12} className="text-slate-500" /> : <ChevronDown size={12} className="text-slate-500" />}
                                      </div>
                                    </div>

                                    <AnimatePresence>
                                      {isExpanded && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          className="border-t border-border/40 overflow-hidden"
                                        >
                                          <div className="px-3 py-3 space-y-3">
                                            {/* Score breakdown */}
                                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                              <ScoreBadge score={Number(page.titleScore)} label="Title" icon={FileText} />
                                              <ScoreBadge score={Number(page.metaDescScore)} label="Meta Desc" icon={Eye} />
                                              <ScoreBadge score={Number(page.schemaScore)} label="Schema" icon={Code} />
                                              <ScoreBadge score={Number(page.imageAltScore)} label="Alt Images" icon={Image} />
                                              <ScoreBadge score={Number(page.internalLinkScore)} label="Maillage" icon={Link2} />
                                            </div>

                                            {/* Optimized suggestions */}
                                            {page.optimizedTitle && (
                                              <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3 space-y-2">
                                                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Suggestions IA</p>
                                                <div>
                                                  <p className="text-[10px] text-slate-400 font-bold">Title (max 60 car.)</p>
                                                  <p className="text-xs text-white font-mono">{page.optimizedTitle}</p>
                                                </div>
                                                <div>
                                                  <p className="text-[10px] text-slate-400 font-bold">Meta Description (max 155 car.)</p>
                                                  <p className="text-xs text-white font-mono">{page.optimizedMetaDesc}</p>
                                                </div>
                                              </div>
                                            )}

                                            {/* Schema JSON-LD */}
                                            {page.suggestedSchema && page.suggestedSchema !== '{}' && (
                                              <div className="rounded-xl bg-slate-800/30 border border-slate-700/50 p-3">
                                                <div className="flex items-center justify-between mb-2">
                                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Schema JSON-LD suggere</p>
                                                  <button
                                                    onClick={() => copySchema(page.suggestedSchema)}
                                                    className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                                                  >
                                                    <Download size={10} /> Copier
                                                  </button>
                                                </div>
                                                <pre className="text-[10px] text-slate-300 font-mono overflow-x-auto max-h-40 overflow-y-auto">
                                                  {(() => {
                                                    try { return JSON.stringify(JSON.parse(page.suggestedSchema), null, 2); }
                                                    catch { return page.suggestedSchema; }
                                                  })()}
                                                </pre>
                                              </div>
                                            )}
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                );
                              })}
                            </div>
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
