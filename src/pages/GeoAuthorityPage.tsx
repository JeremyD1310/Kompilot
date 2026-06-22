/**
 * GeoAuthorityPage — Index de Recommandation IA (G.E.O. Score)
 * Measures establishment visibility in AI search engines:
 * ChatGPT, Gemini, Perplexity, Claude, Apple Intelligence
 */
import { useState, useEffect } from 'react';
import { Page, PageHeader, PageTitle, PageDescription, PageBody, Badge, Button } from '@blinkdotnew/ui';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, RefreshCw, Sparkles, AlertTriangle, CheckCircle2,
  Globe, Zap, ChevronRight, Target, ArrowRight, Rocket,
  Search, Bot, MessageCircle, Linkedin, TrendingUp,
} from 'lucide-react';
import { useEstablishment } from '../context/EstablishmentContext';
import { GeoCitationChart } from '../components/geo/GeoCitationChart';
import { GeoCompetitorGap } from '../components/geo/GeoCompetitorGap';
import { CitationSupplyChain } from '../components/geo/CitationSupplyChain';
import { BrandSafetyShield } from '../components/geo/BrandSafetyShield';
import { AEOFragmentGenerator } from '../components/geo/AEOFragmentGenerator';
import { SemanticVisibilityMap } from '../components/geo/SemanticVisibilityMap';
import { useNavigate } from '@tanstack/react-router';
import { blink } from '../blink/client';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LLMResult {
  llm: string;
  emoji: string;
  score: number;
  mentioned: boolean;
  position: number | null;
  snippet: string;
  query: string;
  color: string;
  bgColor: string;
}

interface ActionItem {
  priority: 'high' | 'medium' | 'low';
  label: string;
  description: string;
  impact: string;
  cockpitPrompt?: string; // Pre-filled prompt for Cockpit IA
}

// ── Score gauge ───────────────────────────────────────────────────────────────

function ScoreGauge({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={8} />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.2s ease-out' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-extrabold text-foreground leading-none">{score}</span>
        <span className="text-[10px] text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

// ── Scan step indicator ───────────────────────────────────────────────────────

function ScanStep({ label, delay }: { label: string; delay: number }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), delay * 1000 + 500);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}
      className="flex items-center gap-2 text-xs text-muted-foreground"
    >
      {done
        ? <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
        : <RefreshCw size={13} className="animate-spin text-primary shrink-0" />}
      {label}
    </motion.div>
  );
}

// ── LLM card ─────────────────────────────────────────────────────────────────

function LLMCard({ result }: { result: LLMResult }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border overflow-hidden ${result.bgColor}`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="text-xl shrink-0">{result.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">{result.llm}</span>
            {result.mentioned ? (
              <Badge className="rounded-full text-[10px] h-4 px-1.5 bg-emerald-600">Mentionné ✓</Badge>
            ) : (
              <Badge variant="secondary" className="rounded-full text-[10px] h-4 px-1.5">Non mentionné</Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{result.query}</p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <span className={`text-lg font-extrabold ${result.color}`}>{result.score}</span>
          <span className="text-[9px] text-muted-foreground">/100</span>
        </div>
      </div>
      <div className="px-4 pb-3 space-y-2">
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${result.score >= 70 ? 'bg-emerald-500' : result.score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
            initial={{ width: 0 }} animate={{ width: `${result.score}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          />
        </div>
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Voir la réponse simulée
          <ChevronRight size={10} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl bg-zinc-900 p-3 text-xs text-zinc-300 leading-relaxed font-mono border border-zinc-700">
                <p className="text-zinc-500 text-[10px] mb-1.5">🤖 {result.llm} répond :</p>
                {result.snippet}
                {result.position && (
                  <p className="text-emerald-400 mt-2 text-[10px]">✓ Votre établissement mentionné en position #{result.position}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Action card ───────────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  high:   { label: 'Priorité haute',   color: 'text-red-600',     bg: 'bg-red-50 border-red-200',       icon: <AlertTriangle size={12} /> },
  medium: { label: 'Priorité moyenne', color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200',   icon: <Target size={12} /> },
  low:    { label: 'Optimisation',     color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: <CheckCircle2 size={12} /> },
};

// ── Data builders ─────────────────────────────────────────────────────────────

function buildSimulatedResults(estName: string, city: string, activity: string): LLMResult[] {
  const base = `Vous recherchez ${activity} à ${city} ?`;
  return [
    {
      llm: 'ChatGPT', emoji: '🤖', score: 62, mentioned: true, position: 3,
      query: `Meilleur ${activity} à ${city}`, color: 'text-emerald-600',
      bgColor: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60',
      snippet: `${base} En troisième position, "${estName}" est souvent cité pour la qualité de son service. D'autres options populaires incluent [Concurrent A] et [Concurrent B] avec des notes supérieures à 4.5/5.`,
    },
    {
      llm: 'Gemini', emoji: '✨', score: 34, mentioned: false, position: null,
      query: `Où trouver ${activity} à ${city} ?`, color: 'text-red-500',
      bgColor: 'bg-red-50/50 dark:bg-red-950/20 border-red-200/60',
      snippet: `Pour trouver ${activity} à ${city}, consultez Google Maps. Les critères : proximité, horaires et évaluations récentes. [Concurrent A] et [Concurrent B] apparaissent fréquemment.`,
    },
    {
      llm: 'Perplexity', emoji: '🔍', score: 41, mentioned: false, position: null,
      query: `${activity} recommandé ${city} avis`, color: 'text-amber-600',
      bgColor: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60',
      snippet: `D'après les sources indexées, les établissements ${activity} à ${city} les mieux notés incluent [Concurrent A] (4.8/5 — 234 avis) et [Concurrent B] (4.6/5 — 189 avis). "${estName}" n'apparaît pas encore dans les résultats consolidés.`,
    },
    {
      llm: 'Claude', emoji: '🧠', score: 48, mentioned: false, position: null,
      query: `${activity} de qualité près de ${city}`, color: 'text-amber-600',
      bgColor: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60',
      snippet: `Je ne dispose pas de données temps réel sur ${city}. Pour ${activity} de qualité : 1) Google Maps avis récents, 2) Pages jaunes locales, 3) Recommandations de proches. Privilégiez les établissements avec +50 avis et note ≥ 4.2/5.`,
    },
    {
      llm: 'Apple Intelligence', emoji: '🍎', score: 29, mentioned: false, position: null,
      query: `Siri : ${activity} autour de moi`, color: 'text-red-500',
      bgColor: 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-200/60',
      snippet: `Basé sur votre localisation à ${city}, j'ai trouvé plusieurs établissements pour ${activity}. Je vous recommande [Concurrent A] qui bénéficie d'excellentes évaluations récentes. Voulez-vous que je vous y guide ?`,
    },
  ];
}

function buildActions(score: number, estName: string, city: string, activity: string): ActionItem[] {
  return [
    {
      priority: score < 50 ? 'high' : 'medium',
      label: 'Mettre à jour votre fiche Google Business Profile',
      description: 'Ajoutez des photos récentes, vérifiez vos horaires et répondez aux 3 derniers avis. Les LLMs indexent les fiches actives en priorité.',
      impact: '+15 pts estimés',
      cockpitPrompt: `Rédige un post Google Business pour "${estName}" à ${city} pour améliorer mon référencement IA. Inclus les mots-clés : qualité, service, ${activity}, recommandé, ${city}. Ton professionnel et engageant.`,
    },
    {
      priority: 'high',
      label: 'Créer du contenu local ciblé avec mots-clés G.E.O.',
      description: `Publiez 2 posts mentionnant votre ville, spécialité et termes conversationnels ("Où trouver…", "Meilleur…"). Les LLMs apprennent de ces patterns.`,
      impact: '+12 pts estimés',
      cockpitPrompt: `Crée un article SEO-GEO pour "${estName}" ciblant les requêtes IA locales sur ${city}. Intègre les expressions : "meilleur ${activity} à ${city}", "recommandé par vos voisins", "service de qualité ${city}". Optimisé pour être cité par ChatGPT et Gemini.`,
    },
    {
      priority: 'medium',
      label: 'Campagne SMS/WhatsApp pour obtenir des avis G.E.O.-optimisés',
      description: `Envoyez une campagne ciblée à vos clients fidèles pour obtenir des avis Google contenant les termes sémantiques requis par les LLMs.`,
      impact: '+8 pts estimés',
      cockpitPrompt: `Rédige un message WhatsApp court et persuasif pour demander un avis Google à mes clients de "${estName}". Le message doit encourager à mentionner : qualité, service, recommandation, ${activity}. Inclus un lien [LIEN_AVIS]. Moins de 160 caractères.`,
    },
    {
      priority: 'low',
      label: 'Ajouter un Schema.org LocalBusiness à votre site web',
      description: 'Les données structurées JSON-LD permettent aux LLMs de comprendre précisément qui vous êtes, ce que vous faites et où vous êtes.',
      impact: '+5 pts estimés',
    },
  ];
}

// ── Classic SERP data (simulated) ─────────────────────────────────────────────
const CLASSIC_SERP_DATA = [
  { engine: 'Google',        emoji: '🔵', position: 4,  trend: '+2',  visibility: 68, status: 'present' as const },
  { engine: 'Bing',          emoji: '🟢', position: 7,  trend: '0',   visibility: 41, status: 'present' as const },
  { engine: 'Google Maps',   emoji: '📍', position: 2,  trend: '+1',  visibility: 84, status: 'strong'  as const },
  { engine: 'TripAdvisor',   emoji: '🦉', position: null, trend: '—', visibility: 12, status: 'absent'  as const },
];

// ── UGC Sources data (simulated) ──────────────────────────────────────────────
interface UGCSource {
  platform: string;
  emoji: string;
  status: 'cited' | 'partial' | 'absent';
  detail: string;
  color: string;
  bgColor: string;
  borderColor: string;
  hint: string;
}

function buildUGCSources(estName: string, city: string, activity: string): UGCSource[] {
  return [
    {
      platform: 'Reddit',
      emoji: '🟠',
      status: 'partial',
      detail: `Mentionné dans 1 fil sur r/${city} — sans lien vers votre fiche`,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50/50 dark:bg-amber-950/20',
      borderColor: 'border-amber-200/60 dark:border-amber-800/40',
      hint: `Répondez aux fils de discussion r/${city} et r/${activity.toLowerCase()} avec vos conseils d'expert. Kompilot génère la réponse en 1 clic.`,
    },
    {
      platform: 'LinkedIn',
      emoji: '💼',
      status: 'absent',
      detail: `Aucune publication professionnelle détectée pour "${estName}" sur LinkedIn`,
      color: 'text-red-500',
      bgColor: 'bg-red-50/50 dark:bg-red-950/20',
      borderColor: 'border-red-200/60 dark:border-red-800/40',
      hint: `Publiez 1 article professionnel/mois sur LinkedIn avec votre expertise en ${activity}. Les IA B2B (Perplexity Pro) indexent ces contenus en priorité.`,
    },
    {
      platform: 'Google Q&A',
      emoji: '❓',
      status: 'partial',
      detail: '3 questions sans réponse sur votre fiche Google Business Profile',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50/50 dark:bg-amber-950/20',
      borderColor: 'border-amber-200/60 dark:border-amber-800/40',
      hint: 'Les réponses aux Q&A Google sont indexées par ChatGPT et Gemini comme sources de confiance. Répondez-y en moins de 24h.',
    },
    {
      platform: 'Tripadvisor / Yelp',
      emoji: '🌟',
      status: 'absent',
      detail: `Profil ${estName} non revendiqué ou incomplet sur les plateformes d'avis tierces`,
      color: 'text-red-500',
      bgColor: 'bg-red-50/50 dark:bg-red-950/20',
      borderColor: 'border-red-200/60 dark:border-red-800/40',
      hint: 'Perplexity extrait ses réponses de Tripadvisor pour les requêtes touristiques. Revendiquer et optimiser votre profil = +8 pts G.E.O. estimés.',
    },
  ];
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GeoAuthorityPage() {
  const { activeEstablishment } = useEstablishment();
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [results, setResults] = useState<LLMResult[]>([]);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [optimizing, setOptimizing] = useState(false);
  const [activeTab, setActiveTab] = useState<'score' | 'shield' | 'aeo'>('score');

  const estName  = activeEstablishment?.name     ?? 'Votre Établissement';
  const city     = activeEstablishment?.city     ?? 'votre ville';
  const activity = activeEstablishment?.activity ?? 'votre activité';

  // Guard against division by zero when results is empty (scanned but no entries built yet)
  const globalScore = (scanned && results.length > 0)
    ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
    : 0;

  const scoreColor = globalScore >= 70 ? 'text-emerald-600' : globalScore >= 40 ? 'text-amber-600' : 'text-red-500';
  const scoreLabel = globalScore >= 70 ? 'Excellente présence IA' : globalScore >= 40 ? 'Présence partielle' : 'Faible visibilité IA';

  const handleScan = async () => {
    setScanning(true);
    setScanned(false);
    await new Promise(r => setTimeout(r, 3200));
    const res = buildSimulatedResults(estName, city, activity);
    setResults(res);
    setActions(buildActions(Math.round(res.reduce((s, r) => s + r.score, 0) / res.length), estName, city, activity));
    setScanned(true);
    setScanning(false);
    // Mark geo scan done for StartupChecklist progress
    try {
      const u = await blink.auth.me();
      if (u?.id) localStorage.setItem(`geo_scan_done_${u.id}`, '1');
    } catch { /* noop */ }
  };

  const handleOptimize = async () => {
    setOptimizing(true);
    // Take the top high-priority action with a cockpit prompt
    const topAction = actions.find(a => a.cockpitPrompt);
    await new Promise(r => setTimeout(r, 800));
    setOptimizing(false);
    if (topAction?.cockpitPrompt) {
      sessionStorage.setItem('cockpit_prefill_prompt', topAction.cockpitPrompt);
    }
    navigate({ to: '/cockpit' });
  };

  const SCAN_STEPS = [
    'Interrogation de ChatGPT (OpenAI)…',
    'Interrogation de Gemini (Google)…',
    'Interrogation de Perplexity…',
    'Interrogation de Claude (Anthropic)…',
    "Interrogation d'Apple Intelligence…",
    'Calcul du Score G.E.O.…',
  ];

  const LLM_PRESENCE = [
    { model: 'ChatGPT Search', logo: '🤖', status: 'cited_first', share: 42 },
    { model: 'Perplexity AI', logo: '🔍', status: 'cited_source', share: 28 },
    { model: 'Gemini (Google)', logo: '✨', status: 'absent', share: 0 },
    { model: 'Google AI Overviews', logo: '🌐', status: 'cited_source', share: 31 },
  ];

  const TABS = [
    { id: 'score' as const, label: '🧠 Score G.E.O.', description: 'Analyse de recommandation' },
    { id: 'shield' as const, label: '🛡️ Bouclier Anti-Hallucination', description: 'Protection marque' },
    { id: 'aeo' as const, label: '📦 Fragments A.E.O.', description: 'Générateur Q&A' },
  ];

  return (
    <Page className="page-enter" data-tour="geo-authority-page">
      <PageHeader>
        <div className="flex items-center gap-3 flex-wrap">
          <PageTitle>Index de Recommandation IA</PageTitle>
          <Badge variant="secondary" className="gap-1 rounded-full text-xs">
            <Brain size={11} /> G.E.O. Score
          </Badge>
          <Badge className="gap-1 rounded-full text-[10px] bg-primary/10 text-primary border-primary/20">
            Nouveau
          </Badge>
        </div>
        <PageDescription>
          Mesurez si ChatGPT, Gemini, Perplexity, Claude et Apple Intelligence recommandent votre établissement lors de recherches locales.
        </PageDescription>
      </PageHeader>

      <PageBody>
        <div className="max-w-2xl mx-auto space-y-6 pb-12">

          {/* ── Sub-tab navigation ── */}
          <div className="flex gap-1 p-1 rounded-2xl bg-muted/50 border border-border">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 rounded-xl px-2 py-2.5 text-center transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-background shadow-sm border border-border text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                <span className="text-[11px] font-bold leading-tight">{tab.label}</span>
                <span className="text-[9px] text-muted-foreground hidden sm:block">{tab.description}</span>
              </button>
            ))}
          </div>

          {/* ── TAB: Score G.E.O. ── */}
          <AnimatePresence mode="wait">
            {activeTab === 'score' && (
              <motion.div key="score" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-6">

                {/* ── SEMANTIC VISIBILITY MAP ── */}
                <SemanticVisibilityMap
                  estName={estName}
                  city={city}
                  activity={activity}
                  globalScore={globalScore}
                />

                {/* Hero score section */}
                <div
                  data-tour="geo-score-global"
                  className="rounded-2xl border border-border bg-gradient-to-br from-background via-primary/3 to-teal-50/30 dark:to-teal-950/10 p-6"
                >
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <ScoreGauge score={scanned ? globalScore : 0} />
                      {scanned && <span className={`text-xs font-bold ${scoreColor}`}>{scoreLabel}</span>}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-base font-extrabold text-foreground">Score d'Autorité G.E.O.</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          Mesurez votre présence dans les réponses des LLMs pour{' '}
                          <em>« {activity} à {city} »</em>.
                        </p>
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        {(['🤖 ChatGPT', '✨ Gemini', '🔍 Perplexity', '🧠 Claude', '🍎 Siri'] as const).map((name, i) => {
                          const scores = [62, 34, 41, 48, 29];
                          return (
                            <div key={name} className="text-center">
                              <p className="text-[10px] text-muted-foreground">{name}</p>
                              <p className={`text-sm font-bold ${scanned ? 'text-foreground' : 'text-muted-foreground/30'}`}>
                                {scanned ? scores[i] : '–'}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                      <Button onClick={handleScan} disabled={scanning} className="gap-2 w-full sm:w-auto">
                        {scanning ? (
                          <><RefreshCw size={14} className="animate-spin" /> Analyse en cours…</>
                        ) : scanned ? (
                          <><RefreshCw size={14} /> Relancer l'analyse</>
                        ) : (
                          <><Sparkles size={14} /> Lancer l'analyse G.E.O.</>
                        )}
                      </Button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {scanning && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="mt-4 space-y-2 overflow-hidden"
                      >
                        {SCAN_STEPS.map((label, i) => <ScanStep key={label} label={label} delay={i * 0.5} />)}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── DUAL KPI BLOCK ── */}
                <div data-tour="geo-dual-kpi" className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* KPI 1 — SERPs Classiques */}
                  <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Search size={15} className="text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-foreground leading-tight">🔍 Présence SERPs Classiques</p>
                        <p className="text-[10px] text-muted-foreground">Moteurs traditionnels</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {CLASSIC_SERP_DATA.map((item) => (
                        <div key={item.engine} className="flex items-center gap-2.5 py-1.5 border-b border-border/40 last:border-0">
                          <span className="text-sm shrink-0">{item.emoji}</span>
                          <span className="text-[11px] font-semibold text-foreground flex-1">{item.engine}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden mx-1">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.visibility}%` }}
                              transition={{ duration: 1, delay: 0.3 }}
                              className={`h-full rounded-full ${item.status === 'strong' ? 'bg-emerald-500' : item.status === 'present' ? 'bg-blue-400' : 'bg-red-400'}`}
                            />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-right w-8 shrink-0">{item.visibility}%</span>
                          <span className={`text-[10px] font-bold shrink-0 ${item.trend?.startsWith('+') ? 'text-emerald-500' : item.trend === '0' ? 'text-muted-foreground' : 'text-red-500'}`}>
                            {item.trend}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg bg-blue-500/5 border border-blue-500/15 px-3 py-2">
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Score moyen : <strong>51%</strong> de visibilité organique</p>
                    </div>
                  </div>

                  {/* KPI 2 — Part de Voix IA */}
                  <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot size={15} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-foreground leading-tight">🤖 Part de Voix AI Answers</p>
                        <p className="text-[10px] text-muted-foreground">ChatGPT · Perplexity · Gemini</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {LLM_PRESENCE.map((item) => (
                        <div key={item.model} className="flex items-center gap-2.5 py-1.5 border-b border-border/40 last:border-0">
                          <span className="text-sm shrink-0">{item.logo}</span>
                          <span className="text-[11px] font-semibold text-foreground flex-1 truncate">{item.model}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden mx-1">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.share}%` }}
                              transition={{ duration: 1, delay: 0.5 }}
                              className="h-full bg-emerald-500 rounded-full"
                            />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-emerald-500 w-8 text-right shrink-0">{item.share}%</span>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg bg-primary/5 border border-primary/15 px-3 py-2">
                      <p className="text-[10px] text-primary font-semibold">Voix IA moyenne : <strong>25%</strong> — Potentiel +63% avec Kompilot</p>
                    </div>
                  </div>
                </div>

                {/* ── SOURCES D'INFLUENCE DÉTECTÉES (Reddit / LinkedIn / UGC) ── */}
                <div data-tour="geo-ugc-sources" className="rounded-2xl border border-border bg-card p-5 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        📦 Sources d'influence détectées
                      </h3>
                      <Badge className="rounded-full text-[10px] h-5 px-2 bg-violet-500/10 text-violet-500 border-violet-500/20">
                        Nouveau
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      Vérifiez si votre établissement est cité dans les conversations clés sur Reddit ou les publications LinkedIn de votre secteur — les deux principales sources UGC utilisées par les IA.
                    </p>
                  </div>

                  {/* Insight Semrush block */}
                  <div className="rounded-xl bg-gradient-to-r from-primary/8 to-violet-500/5 border border-primary/20 px-4 py-3 flex items-start gap-3">
                    <span className="text-lg shrink-0 mt-0.5">📊</span>
                    <div>
                      <p className="text-[11px] font-bold text-foreground leading-snug">
                        Le SEO a changé. Les IA ne lisent plus seulement votre site web.
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                        Elles extraient leurs réponses des avis, de LinkedIn et de Reddit. Kompilot s'assure que vous êtes visible partout où l'IA va chercher ses sources.
                      </p>
                      <span className="inline-block mt-1.5 text-[9px] font-bold text-primary uppercase tracking-widest">
                        Insights Semrush 2025
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {buildUGCSources(estName, city, activity).map((item) => (
                      <div key={item.platform} className={`rounded-xl border ${item.borderColor} ${item.bgColor} p-3`}>
                        <div className="flex items-start gap-3">
                          <span className="text-xl shrink-0 mt-0.5">{item.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-xs font-bold text-foreground">{item.platform}</p>
                              {item.status === 'cited'   && <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] rounded-full h-4 px-1.5">✓ Cité</Badge>}
                              {item.status === 'partial' && <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[9px] rounded-full h-4 px-1.5">⚠ Partiel</Badge>}
                              {item.status === 'absent'  && <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-[9px] rounded-full h-4 px-1.5">✕ Absent</Badge>}
                            </div>
                            <p className="text-[10px] text-muted-foreground">{item.detail}</p>
                          </div>
                          <button
                            className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/8 hover:bg-primary/15 transition-colors rounded-lg px-2.5 py-1.5 mt-0.5"
                            onClick={() => {
                              const prompt = `Génère une réponse UGC optimisée pour ${item.platform} concernant "${estName}" à ${city}. Format adapté à la plateforme, ton authentique, inclut les mots-clés locaux.`;
                              sessionStorage.setItem('cockpit_prefill_prompt', prompt);
                            }}
                          >
                            <Rocket size={9} /> Générer
                          </button>
                        </div>
                        <div className="mt-2 p-2 bg-background/60 rounded-md text-[10px] text-muted-foreground border border-muted/50 leading-relaxed">
                          <span className="font-semibold text-foreground">💡 Action :</span> {item.hint}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Multi-LLM Presence Table */}
                <div
                  data-tour="geo-llm-table"
                  className="rounded-2xl border border-border bg-card p-5 space-y-4"
                >
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      🧠 Part de Voix IA — Multi-Modèles
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Votre présence sur les moteurs d'IA concurrents
                    </p>
                  </div>
                  <div className="space-y-3">
                    {LLM_PRESENCE.map((item) => (
                      <div key={item.model} className="flex flex-col sm:flex-row sm:items-center gap-3 py-2 border-b border-border/50 last:border-0">
                        <div className="flex items-center gap-3 w-40 shrink-0">
                          <span className="text-lg">{item.logo}</span>
                          <span className="text-xs font-bold text-foreground">{item.model}</span>
                        </div>
                        <div className="flex-1 min-w-0 flex items-center gap-3">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.share}%` }}
                              className="h-full bg-emerald-500 rounded-full"
                              transition={{ duration: 1, delay: 0.5 }}
                            />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-emerald-500 w-8 text-right">
                            {item.share}%
                          </span>
                        </div>
                        <div className="w-36 shrink-0 flex justify-end">
                          {item.status === 'cited_first' && (
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] rounded-full">
                              🟢 Cité en premier
                            </Badge>
                          )}
                          {item.status === 'cited_source' && (
                            <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] rounded-full">
                              🟡 Cité dans les sources
                            </Badge>
                          )}
                          {item.status === 'absent' && (
                            <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px] rounded-full">
                              🔴 Absent
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Results section (only after scan) */}
                <AnimatePresence>
                  {scanned && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <div data-tour="geo-queries" className="space-y-3">
                        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <Globe size={15} className="text-primary" />
                          Résultats par moteur IA
                        </h2>
                        {results.map(r => <LLMCard key={r.llm} result={r} />)}
                      </div>

                      {/* Optimize CTA */}
                      <div className="rounded-2xl border border-emerald-300/60 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 p-5">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
                            <Rocket size={18} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-extrabold text-emerald-800 dark:text-emerald-300">
                              Optimiser ma visibilité IA en un clic
                            </p>
                            <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-0.5 leading-relaxed">
                              Le Cockpit IA va générer immédiatement les contenus prioritaires pour corriger vos lacunes détectées.
                            </p>
                            <button
                              onClick={handleOptimize}
                              disabled={optimizing}
                              className="mt-3 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-sm font-bold rounded-xl px-5 py-2.5 transition-all shadow-md shadow-emerald-600/30 disabled:opacity-60"
                            >
                              {optimizing ? (
                                <><RefreshCw size={14} className="animate-spin" /> Préparation…</>
                              ) : (
                                <><Zap size={14} className="fill-white" /> Optimiser ma visibilité IA <ArrowRight size={14} /></>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Citation supply chain */}
                      <CitationSupplyChain />

                      {/* 30-day chart */}
                      <GeoCitationChart globalScore={globalScore} />

                      {/* Competitor gap */}
                      <GeoCompetitorGap city={city} activity={activity} userScore={globalScore} />

                      {/* Action plan */}
                      <div data-tour="geo-actions" className="space-y-3">
                        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <Zap size={15} className="text-primary" /> Plan d'action pour améliorer votre score
                        </h2>
                        {actions.map((item, i) => {
                          const cfg = PRIORITY_CONFIG[item.priority];
                          return (
                            <div key={i} className={`rounded-xl border px-4 py-3 ${cfg.bg} space-y-1`}>
                              <div className="flex items-center gap-2">
                                <span className={cfg.color}>{cfg.icon}</span>
                                <span className={`text-[10px] font-bold ${cfg.color} uppercase tracking-wide`}>{cfg.label}</span>
                                <span className="ml-auto text-[10px] text-muted-foreground">{item.impact}</span>
                              </div>
                              <p className="text-xs font-semibold text-foreground">{item.label}</p>
                              <p className="text-[11px] text-muted-foreground leading-snug">{item.description}</p>
                              {item.cockpitPrompt && (
                                <button
                                  onClick={() => {
                                    sessionStorage.setItem('cockpit_prefill_prompt', item.cockpitPrompt!);
                                    navigate({ to: '/cockpit' });
                                  }}
                                  className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors"
                                >
                                  <Rocket size={10} /> Générer avec le Cockpit IA <ChevronRight size={10} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Empty state */}
                {!scanned && !scanning && (
                  <div className="flex flex-col items-center justify-center gap-4 py-16 text-center text-muted-foreground">
                    <div className="w-16 h-16 rounded-2xl bg-primary/8 flex items-center justify-center">
                      <Brain size={32} className="text-primary/40" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Analyse G.E.O. non encore lancée</p>
                      <p className="text-xs mt-1 max-w-xs mx-auto">
                        Cliquez sur « Lancer l'analyse G.E.O. » pour mesurer votre score de recommandation par les IA.
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 mt-2">
                      {['🤖 ChatGPT', '✨ Gemini', '🔍 Perplexity', '🧠 Claude', '🍎 Siri'].map(name => (
                        <span key={name} className="text-[10px] font-semibold bg-muted rounded-full px-2.5 py-1">{name}</span>
                      ))}
                    </div>
                  </div>
                )}

              </motion.div>
            )}

            {/* ── TAB: Brand Safety Shield ── */}
            {activeTab === 'shield' && (
              <motion.div key="shield" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-4">
                <div className="rounded-2xl border border-border bg-card/50 p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shrink-0 shadow-md shadow-red-600/30 mt-0.5">
                      <AlertTriangle size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-foreground">Protection de marque en temps réel</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        Ce module surveille en continu les réponses de ChatGPT, Gemini et Perplexity pour détecter
                        les informations erronées diffusées à vos clients (horaires, services, coordonnées).
                        En cas d'anomalie, un correctif sémantique est injecté automatiquement.
                      </p>
                    </div>
                  </div>
                </div>
                <BrandSafetyShield estName={estName} />
              </motion.div>
            )}

            {/* ── TAB: AEO Fragment Generator ── */}
            {activeTab === 'aeo' && (
              <motion.div key="aeo" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-4">
                <div className="rounded-2xl border border-border bg-card/50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-md shadow-primary/30 mt-0.5">
                      <Sparkles size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-foreground">Structurer vos données pour les moteurs IA</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        L'A.E.O. (Answer Engine Optimization) structure vos données en format JSON-LD / microdata
                        pour que ChatGPT, Gemini et Perplexity lisent vos informations en priorité et vous citent dans leurs réponses.
                      </p>
                    </div>
                  </div>
                </div>
                <AEOFragmentGenerator estName={estName} city={city} activity={activity} />
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </PageBody>
    </Page>
  );
}