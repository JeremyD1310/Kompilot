/**
 * LeadScoringPage — /lead-scoring
 *
 * AI-powered lead scoring for Reddit/forum threads.
 * Analyzes purchase intent signals and prioritizes high-value prospects.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Page, PageHeader, PageTitle, PageDescription, PageBody,
  Button, Badge, Card, CardContent, StatGroup, Stat, toast,
} from '@blinkdotnew/ui';
import {
  BrainCircuit, Target, Flame, Filter,
  ChevronDown, ChevronUp, Sparkles, ExternalLink,
  RefreshCw, Search, MessageSquare, Zap, BarChart3,
  Loader2,
} from 'lucide-react';
import { blink } from '../blink/client';
import { useDemoMode } from '../context/DemoModeContext';

import { backendFetch } from '../lib/backend';

// ── Types ────────────────────────────────────────────────────────────────────

interface ScoredThread {
  threadId: string;
  title: string;
  subreddit: string;
  url: string;
  intentType: string;
  score: number;
  status: string;
  confidence?: number;
  scoringVersion?: string;
  keySignals: string[];
  reasoning: string;
  recommendedAction: string;
  scoredAt: string;
}

interface LeadStats {
  totalThreads: number;
  scoredThreads: number;
  avgScore: number;
  scoreBreakdown: Record<string, number>;
  intentDistribution: Record<string, number>;
  statusBreakdown: Record<string, number>;
  topLeads: ScoredThread[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const INTENT_TYPE_OPTIONS = [
  { value: '', label: 'Tous les types d\'intention' },
  { value: 'purchase_intent', label: 'Intention d\'achat' },
  { value: 'service_request', label: 'Demande de service' },
  { value: 'complaint', label: 'Plainte / outil actuel' },
  { value: 'recommendation_request', label: 'Recherche de recommandation' },
  { value: 'general_discussion', label: 'Discussion générale' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'scored', label: 'Scoré' },
  { value: 'unscored', label: 'Non scoré' },
  { value: 'contacted', label: 'Contacté' },
  { value: 'converted', label: 'Converti' },
  { value: 'ignored', label: 'Ignoré' },
];

// ── Demo seed data ───────────────────────────────────────────────────────────

const DEMO_THREADS: ScoredThread[] = [
  {
    threadId: 'demo-1',
    title: 'Best CRM for a small restaurant? Need something simple',
    subreddit: 'r/smallbusiness',
    url: 'https://reddit.com/r/smallbusiness/thread1',
    intentType: 'recommendation_request',
    score: 92,
    status: 'scored',
    keySignals: ['Cherche activement une solution', 'Budget mentionné', 'Urgence exprimée ("need")'],
    reasoning: 'L\'utilisateur exprime un besoin urgent pour un CRM adapté aux restaurants. Le secteur (restauration) correspond à notre cible. Le score élevé reflète l\'intention d\'achat imminente.',
    recommendedAction: 'Contacter avec une démo personnalisée du module restauration. Mettre en avant les intégrations POS.',
    scoredAt: '2026-01-22T14:30:00Z',
  },
  {
    threadId: 'demo-2',
    title: 'How do you handle Google reviews for multiple locations?',
    subreddit: 'r/SEO',
    url: 'https://reddit.com/r/SEO/thread2',
    intentType: 'problem_awareness',
    score: 87,
    status: 'scored',
    keySignals: ['Problème multi-sites', 'Gestion de réputation', 'Solution recherchée implicitement'],
    reasoning: 'L\'utilisateur gère plusieurs établissements et cherche à centraliser la gestion des avis Google — cas d\'usage parfait pour Kompilot.',
    recommendedAction: 'Envoyer un case study sur la gestion multi-établissements. Proposer un essai avec import des fiches.',
    scoredAt: '2026-01-21T09:15:00Z',
  },
  {
    threadId: 'demo-3',
    title: 'Looking for an all-in-one social media + SEO tool for my agency',
    subreddit: 'r/marketing',
    url: 'https://reddit.com/r/marketing/thread3',
    intentType: 'purchase_intent',
    score: 95,
    status: 'scored',
    keySignals: ['Recherche explicite d\'outil', 'Agence = compte premium', 'Besoin multi-fonctionnel'],
    reasoning: 'Lead agence à très fort potentiel. Recherche explicite d\'une solution tout-en-un. Le panier moyen agence est 5x supérieur au compte standard.',
    recommendedAction: 'Appeler dans les 24h. Présenter le plan Agency avec tarification personnalisée.',
    scoredAt: '2026-01-22T08:00:00Z',
  },
  {
    threadId: 'demo-4',
    title: 'Is it worth paying for reputation management software?',
    subreddit: 'r/entrepreneur',
    url: 'https://reddit.com/r/entrepreneur/thread4',
    intentType: 'complaint',
    score: 68,
    status: 'scored',
    keySignals: ['Phase de comparaison', 'Question sur le ROI', 'Pas encore convaincu'],
    reasoning: 'L\'utilisateur est en phase d\'évaluation. Score modéré car la décision n\'est pas imminente, mais l\'intérêt est réel.',
    recommendedAction: 'Partager le calculateur de ROI. Nurturing par email avec témoignages clients.',
    scoredAt: '2026-01-20T16:45:00Z',
  },
  {
    threadId: 'demo-5',
    title: 'Anyone else struggling with Instagram algorithm changes?',
    subreddit: 'r/socialmedia',
    url: 'https://reddit.com/r/socialmedia/thread5',
    intentType: 'general_interest',
    score: 35,
    status: 'scored',
    keySignals: ['Frustration exprimée', 'Pas de recherche de solution explicite'],
    reasoning: 'Discussion générale sans intention d\'achat claire. Peut être nurturing à long terme.',
    recommendedAction: 'Surveiller le fil. Intervention utile si la conversation évolue vers la recherche de solutions.',
    scoredAt: '2026-01-19T11:20:00Z',
  },
  {
    threadId: 'demo-6',
    title: 'Best tools for local SEO in 2026 — comparing top options',
    subreddit: 'r/localseo',
    url: 'https://reddit.com/r/localseo/thread6',
    intentType: 'complaint',
    score: 78,
    status: 'scored',
    keySignals: ['Comparaison active d\'outils', 'Recherche 2026 = intention fraîche', 'Local SEO = niche Kompilot'],
    reasoning: 'Comparaison récente d\'outils SEO local. Le thread est actif et l\'utilisateur est en phase de décision avancée.',
    recommendedAction: 'Intervenir dans la discussion avec une analyse comparative objective. Proposer un essai gratuit.',
    scoredAt: '2026-01-22T10:30:00Z',
  },
  {
    threadId: 'demo-7',
    title: 'Need help managing Google Business Profile for my medical practice',
    subreddit: 'r/GoogleMyBusiness',
    url: 'https://reddit.com/r/GoogleMyBusiness/thread7',
    intentType: 'purchase_intent',
    score: 89,
    status: 'scored',
    keySignals: ['Besoin explicite', 'Secteur médical = haute valeur', 'GBP = produit cœur Kompilot'],
    reasoning: 'Professionnel de santé cherchant activement une solution GBP. Secteur à forte valeur avec besoin de conformité.',
    recommendedAction: 'Contacter avec une offre secteur médical. Mettre en avant la conformité RGPD et les avis patients.',
    scoredAt: '2026-01-22T12:00:00Z',
  },
  {
    threadId: 'demo-8',
    title: 'What do you use to schedule posts across platforms?',
    subreddit: 'r/digital_marketing',
    url: 'https://reddit.com/r/digital_marketing/thread8',
    intentType: 'recommendation_request',
    score: 55,
    status: 'unscored',
    keySignals: ['Recherche de recommandations', 'Multi-plateforme'],
    reasoning: 'Score en attente d\'analyse approfondie.',
    recommendedAction: 'Lancer le scoring IA pour évaluation détaillée.',
    scoredAt: '2026-01-22T15:00:00Z',
  },
];

const DEMO_STATS: LeadStats = {
  totalThreads: 8,
  scoredThreads: 7,
  avgScore: 74,
  scoreBreakdown: { '80-100': 4, '60-79': 2, '40-59': 1, '0-39': 1 },
  intentDistribution: {
    purchase_intent: 2,
    recommendation_seeking: 2,
    comparison_shopping: 2,
    problem_awareness: 1,
    general_interest: 1,
  },
  statusBreakdown: { scored: 7, unscored: 1, contacted: 0, converted: 0, ignored: 0 },
  topLeads: DEMO_THREADS.filter(t => t.score >= 70).slice(0, 5),
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 80) return 'bg-red-100 text-red-700 border-red-200';
  if (score >= 60) return 'bg-amber-100 text-amber-700 border-amber-200';
  if (score >= 40) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  return 'bg-slate-100 text-slate-500 border-slate-200';
}

function scoreBgBar(score: number): string {
  if (score >= 80) return 'bg-red-500';
  if (score >= 60) return 'bg-amber-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-slate-400';
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    scored: { label: 'Scoré', className: 'bg-primary/10 text-primary border-primary/20' },
    unscored: { label: 'À scorer', className: 'bg-slate-100 text-slate-500 border-slate-200' },
    contacted: { label: 'Contacté', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    converted: { label: 'Converti', className: 'bg-green-100 text-green-700 border-green-200' },
    ignored: { label: 'Ignoré', className: 'bg-slate-100 text-slate-400 border-slate-200' },
  };
  const m = map[status] ?? map.unscored;
  return <Badge className={`text-[11px] font-semibold ${m.className}`}>{m.label}</Badge>;
}

function confidenceLabel(value: number | undefined): string {
  if (value === undefined || value <= 0) return 'Confiance non disponible';
  if (value < 50) return `Confiance faible · ${value}%`;
  if (value < 80) return `Confiance moyenne · ${value}%`;
  return `Confiance élevée · ${value}%`;
}

function intentBadge(intentType: string) {
  const map: Record<string, { label: string; className: string }> = {
    purchase_intent: { label: '💰 Achat', className: 'bg-red-100 text-red-700 border-red-200' },
    service_request: { label: 'Demande de service', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    complaint: { label: 'Plainte / outil actuel', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    recommendation_request: { label: 'Recommandation', className: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    general_discussion: { label: 'Discussion générale', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  };
  const m = map[intentType] ?? map.general_discussion;
  return <Badge className={`text-[11px] font-medium gap-1 ${m.className}`}>{m.label}</Badge>;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

// ── Skeleton loader ──────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border animate-pulse">
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/3" />
      </div>
      <div className="h-6 w-20 bg-muted rounded-full" />
      <div className="h-6 w-16 bg-muted rounded" />
      <div className="h-8 w-24 bg-muted rounded-lg" />
    </div>
  );
}

function SkeletonPage() {
  return (
    <Page>
      <PageHeader>
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded w-72" />
          <div className="h-4 bg-muted rounded w-96" />
        </div>
      </PageHeader>
      <PageBody>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}><CardContent className="p-4"><div className="h-12 bg-muted rounded" /></CardContent></Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {[1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}
          </CardContent>
        </Card>
      </PageBody>
    </Page>
  );
}

// ── Expandable thread row ────────────────────────────────────────────────────

function ThreadRow({
  thread,
  onScore,
  scoring,
}: {
  thread: ScoredThread;
  onScore: (id: string) => void;
  scoring: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-border last:border-b-0">
      {/* Main row */}
      <div
        className="flex flex-wrap items-center gap-3 p-4 hover:bg-muted/30 transition-colors cursor-pointer"
        onClick={() => setExpanded(e => !e)}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setExpanded(e => !e); }}
      >
        {/* Expand toggle */}
        <div className="shrink-0 text-muted-foreground">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>

        {/* Thread info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground truncate max-w-[420px]">
              {thread.title}
            </span>
            {thread.url && (
              <a
                href={thread.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                title="Voir le thread original"
              >
                <ExternalLink size={14} />
              </a>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge className="text-[10px] bg-slate-100 text-slate-600 border-slate-200 font-medium">
              r/{thread.subreddit}
            </Badge>
            {intentBadge(thread.intentType)}
            {statusBadge(thread.status)}
            <span className="text-[11px] text-muted-foreground">
              {formatDate(thread.scoredAt)}
            </span>
          </div>
        </div>

        {/* Score bar */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-muted-foreground">{confidenceLabel(thread.confidence)}</span>
          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${scoreBgBar(thread.score)}`}
              style={{ width: `${thread.score}%` }}
            />
          </div>
          <Badge className={`text-xs font-bold min-w-[44px] justify-center ${scoreColor(thread.score)}`}>
            {thread.score}
          </Badge>
        </div>

        {/* Score button */}
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5 h-8 text-xs"
          onClick={e => { e.stopPropagation(); onScore(thread.threadId); }}
          disabled={scoring}
        >
          {scoring ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Sparkles size={12} />
          )}
          Score IA
        </Button>
      </div>

      {/* Expanded AI analysis */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 bg-muted/20 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            {/* Key signals */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Target size={12} /> Signaux clés
              </h4>
              <div className="space-y-1.5">
                {thread.keySignals.length > 0 ? (
                  thread.keySignals.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      {s}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">Aucun signal extrait — lancez le scoring IA.</p>
                )}
              </div>
            </div>

            {/* Reasoning */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <BrainCircuit size={12} /> Raisonnement
              </h4>
              <p className="text-sm text-foreground leading-relaxed">
                {thread.reasoning || 'Analyse non disponible.'}
              </p>
            </div>

            {/* Recommended action */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Zap size={12} /> Action recommandée
              </h4>
              <p className="text-sm text-primary font-medium leading-relaxed">
                {thread.recommendedAction || 'Action non définie.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page component ──────────────────────────────────────────────────────

export default function LeadScoringPage() {
  const { isDemoActive } = useDemoMode();

  // ── State ──
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<ScoredThread[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'high'>('all');
  const [minScore, setMinScore] = useState(0);
  const [intentFilter, setIntentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [scoringIds, setScoringIds] = useState<Set<string>>(new Set());
  const [bulkScoring, setBulkScoring] = useState(false);

  // ── Data fetching ──
  const fetchData = useCallback(async () => {
    if (isDemoActive) {
      setThreads(DEMO_THREADS);
      setStats(DEMO_STATS);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const token = await blink.auth.getValidToken();
      const headers = { Authorization: `Bearer ${token}` };

      const params = new URLSearchParams();
      if (minScore > 0) params.set('minScore', String(minScore));
      if (intentFilter) params.set('intentType', intentFilter);
      if (statusFilter) params.set('status', statusFilter);
      params.set('limit', '50');
      params.set('offset', '0');

      const [threadsRes, statsRes] = await Promise.all([
        backendFetch(`/api/lead-scoring/threads?${params.toString()}`, { headers }, 12000),
        backendFetch('/api/lead-scoring/stats', { headers }, 12000),
      ]);

      if (threadsRes.ok) {
        const data = await threadsRes.json();
        setThreads((data.threads ?? data ?? []).map((thread: any) => ({ ...thread, threadId: thread.threadId ?? thread.id, confidence: Number(thread.confidence ?? 0), scoringVersion: thread.scoringVersion ?? '' })));
      }
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (err: any) {
      console.error('Lead scoring fetch error:', err);
      toast.error('Erreur de chargement', {
        description: 'Impossible de charger les données de scoring.',
      });
    } finally {
      setLoading(false);
    }
  }, [isDemoActive, minScore, intentFilter, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Score one thread ──
  const scoreThread = useCallback(async (threadId: string) => {
    if (isDemoActive) {
      toast.success('Score IA simulé', {
        description: 'En mode démo, le scoring est instantané.',
      });
      setThreads(prev =>
        prev.map(t =>
          t.threadId === threadId
            ? { ...t, status: 'scored' as const, score: Math.floor(Math.random() * 40) + 55 }
            : t
        )
      );
      return;
    }

    setScoringIds(prev => new Set(prev).add(threadId));
    try {
      const token = await blink.auth.getValidToken();
      const res = await backendFetch(`/api/lead-scoring/score-thread/${threadId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }, 20000);
      if (res.ok) {
        toast.success('Score IA calculé', {
          description: 'Le thread a été analysé avec succès.',
        });
        await fetchData();
      } else {
        throw new Error('Scoring failed');
      }
    } catch {
      toast.error('Échec du scoring', {
        description: 'Impossible d\'analyser ce thread.',
      });
    } finally {
      setScoringIds(prev => {
        const next = new Set(prev);
        next.delete(threadId);
        return next;
      });
    }
  }, [isDemoActive, fetchData]);

  // ── Bulk score all unscored ──
  const bulkScore = useCallback(async () => {
    const unscored = unscoredThreads;
    if (unscored.length === 0) {
      toast('Aucun thread à analyser', {
        description: 'Tous les threads ont déjà été scorés.',
      });
      return;
    }

    if (isDemoActive) {
      toast.success(`${unscored.length} threads analysés`, {
        description: 'Scoring IA simulé en mode démo.',
      });
      setThreads(prev =>
        prev.map(t =>
          t.status === 'unscored'
            ? { ...t, status: 'scored' as const, score: Math.floor(Math.random() * 40) + 55 }
            : t
        )
      );
      return;
    }

    setBulkScoring(true);
    let completed = 0;
    let failed = 0;
    try {
      const token = await blink.auth.getValidToken();
      for (const t of unscored) {
        try {
          const res = await backendFetch(`/api/lead-scoring/score-thread/${t.threadId}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          }, 20000);
          if (res.ok) completed++;
          else failed++;
        } catch {
          failed++;
        }
      }
      toast.success(`Analyse terminée`, {
        description: `${completed} scorés, ${failed} échecs.`,
      });
      await fetchData();
    } catch {
      toast.error('Échec de l\'analyse groupée');
    } finally {
      setBulkScoring(false);
    }
  }, [unscoredThreads, isDemoActive, fetchData]);

  // ── Trigger alerts ──
  const triggerAlerts = useCallback(async () => {
    if (isDemoActive) {
      toast.success('Alertes déclenchées (simulation)', {
        description: 'Les leads à fort potentiel seraient notifiés.',
      });
      return;
    }
    try {
      const token = await blink.auth.getValidToken();
      const res = await backendFetch('/api/lead-scoring/alert', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      }, 15000);
      if (res.ok) {
        toast.success('Alertes envoyées', {
          description: 'Les leads prioritaires ont été signalés.',
        });
      }
    } catch {
      toast.error('Erreur lors de l\'envoi des alertes');
    }
  }, [isDemoActive]);

  // ── Derived data ──
  const filteredThreads = useMemo(() => {
    let list = threads;
    if (activeTab === 'high') {
      list = list.filter(t => t.score >= 70);
    }
    return list;
  }, [threads, activeTab]);

  const unscoredThreads = useMemo(() => threads.filter(t => t.status === 'unscored'), [threads]);
  const scoredThreads = useMemo(() => threads.filter(t => t.status === 'scored'), [threads]);
  const highPriorityThreads = useMemo(() => threads.filter(t => t.score >= 70), [threads]);
  const averageScoredScore = useMemo(() => scoredThreads.length > 0 ? Math.round(scoredThreads.reduce((sum, thread) => sum + thread.score, 0) / scoredThreads.length) : 0, [scoredThreads]);
  const topLeads = useMemo(() => stats?.topLeads ?? highPriorityThreads.slice(0, 5), [stats, highPriorityThreads]);
  const hotLeadsCount = useMemo(() => threads.filter(t => t.score >= 80).length, [threads]);

  // ── Loading state ──
  if (loading) return <SkeletonPage />;

  // ── Render ──
  return (
    <Page>
      <PageHeader>
        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <PageTitle>Scoring prédictif des leads</PageTitle>
              <PageDescription>
                Analyse IA des intentions d'achat sur Reddit et les forums
              </PageDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={triggerAlerts}
              >
                <Flame size={14} /> Alertes leads chauds
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={bulkScore}
                disabled={bulkScoring || unscoredThreads.length === 0}
              >
                {bulkScoring ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                Analyser tout
              </Button>
            </div>
          </div>
        </div>
      </PageHeader>

      <PageBody>
        <div className="page-enter space-y-6">
          {/* ── Stats row ── */}
          <StatGroup>
            <Stat
              label="Threads totaux"
              value={String(stats?.totalThreads ?? threads.length)}
              icon={<MessageSquare size={18} />}
            />
            <Stat
              label="Scorés"
              value={String(stats?.scoredThreads ?? scoredThreads.length)}
              icon={<BarChart3 size={18} />}
            />
            <Stat
              label="Score moyen"
              value={String(stats?.avgScore ?? averageScoredScore)}
              icon={<Target size={18} />}
            />
            <Stat
              label="Leads chauds"
              value={String(hotLeadsCount)}
              trend={hotLeadsCount > 0 ? hotLeadsCount : undefined}
              trendLabel="score ≥ 80"
              icon={<Flame size={18} />}
            />
          </StatGroup>

          {/* ── Top 5 leads highlight ── */}
          {topLeads.length > 0 && (
            <Card className="border-primary/20 bg-primary/[0.02] overflow-hidden">
              <div className="flex items-center gap-2 px-5 pt-5 pb-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Flame size={16} />
                </div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                  Top {topLeads.length} leads prioritaires
                </h3>
              </div>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {topLeads.map((lead, i) => (
                    <div
                      key={lead.threadId}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors"
                    >
                      <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">
                        #{i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {lead.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-muted-foreground">
                            r/{lead.subreddit}
                          </span>
                          {intentBadge(lead.intentType)}
                        </div>
                      </div>
                      <Badge className={`text-xs font-bold ${scoreColor(lead.score)}`}>
                        {lead.score}/100
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Filter bar ── */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Filter size={16} className="text-muted-foreground shrink-0" />

                {/* Min score range */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                    Score min
                  </label>
                  <select
                    value={minScore}
                    onChange={e => setMinScore(Number(e.target.value))}
                    className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value={0}>Tous</option>
                    <option value={80}>≥ 80 (Chaud)</option>
                    <option value={60}>≥ 60 (Tiède)</option>
                    <option value={40}>≥ 40 (Froid)</option>
                  </select>
                </div>

                {/* Intent type */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                    Intention
                  </label>
                  <select
                    value={intentFilter}
                    onChange={e => setIntentFilter(e.target.value)}
                    className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {INTENT_TYPE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                    Statut
                  </label>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {STATUS_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Refresh */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 ml-auto"
                  onClick={fetchData}
                >
                  <RefreshCw size={14} /> Actualiser
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ── Tabs ── */}
          <div className="flex items-center gap-1 border-b border-border">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
                activeTab === 'all'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Tous les leads
            </button>
            <button
              onClick={() => setActiveTab('high')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px] flex items-center gap-1.5 ${
                activeTab === 'high'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Flame size={14} />
              Haute priorité
              {highPriorityThreads.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === 'high'
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {highPriorityThreads.length}
                </span>
              )}
            </button>
          </div>

          {/* ── Thread list ── */}
          <Card>
            <CardContent className="p-0">
              {filteredThreads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                  <Search size={36} className="opacity-30" />
                  <p className="text-sm font-medium">Aucun lead trouvé</p>
                  <p className="text-xs">
                    Ajustez les filtres ou lancez une analyse pour découvrir des prospects.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredThreads.map(thread => (
                    <ThreadRow
                      key={thread.threadId}
                      thread={thread}
                      onScore={scoreThread}
                      scoring={scoringIds.has(thread.threadId)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Stats recap ── */}
          {stats?.scoreBreakdown && (
            <Card>
              <CardContent className="p-5">
                <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BarChart3 size={16} className="text-primary" />
                  Répartition des scores
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(stats.scoreBreakdown).map(([range, count]) => {
                    const [lo] = range.split('-').map(Number);
                    return (
                      <div key={range} className="text-center">
                        <div className={`text-2xl font-bold mb-1 ${lo >= 80 ? 'text-red-600' : lo >= 60 ? 'text-amber-600' : lo >= 40 ? 'text-yellow-600' : 'text-slate-400'}`}>
                          {count}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-medium">
                          {range}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </PageBody>
    </Page>
  );
}
