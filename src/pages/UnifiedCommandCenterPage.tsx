/**
 * UnifiedCommandCenterPage — Tableau de bord principal unifié
 *
 * Remplace les pages DashboardPage, ROASPage, GeoCommandCenterPage, LeadScoringPage
 * en une seule vue combinée. Utilise @blinkdotnew/ui + design white/minimalist teal.
 */
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Page, PageHeader, PageTitle, PageDescription, PageActions, PageBody,
  Card, CardHeader, CardTitle, CardContent,
  StatGroup, Stat, Button, Badge, Skeleton, toast,
} from '@blinkdotnew/ui';
import {
  Globe, Users, MessageSquare, Zap, BrainCircuit,
  Plus, Rocket, Search, Video, Layers, ShieldAlert, Eye,
  ChevronRight, RefreshCw, Activity, AlertTriangle, Power, PowerOff,
  BarChart3, Target, Sparkles, Radar,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDemoMode } from '@/context/DemoModeContext';
import { blink } from '@/blink/client';
import { BACKEND_URL, backendFetch, authHeaders, readBackendError } from '@/lib/backend';
import { cn } from '@/lib/utils';
import { DashboardErrorBoundary } from '@/components/shared/DashboardErrorBoundary';
import { AdTruthDetector } from '@/components/roas/AdTruthDetector';
import { CampaignHealthWidget } from '@/components/dashboard/CampaignHealthWidget';
import { AdvisoryEnginePanel } from '@/components/advisory/AdvisoryEnginePanel';
import { AttributionOverviewWidget } from '@/components/dashboard/AttributionOverviewWidget';
import { ContentQuotaWidget } from '@/components/dashboard/ContentQuotaWidget';
import { WebsiteTrafficCard } from '@/components/dashboard/WebsiteTrafficCard';

// ── Constants ──────────────────────────────────────────────────────────────────

const CREDIT_TOTAL = 500;

// ── Types ──────────────────────────────────────────────────────────────────────

interface LeadRow {
  id: string;
  name: string;
  source: string;
  score: number;
  intent: string;
  status: 'contacted' | 'monitor' | 'ignored';
  scoredAt: string;
}

interface ActivityEvent {
  id: string;
  type: 'post' | 'message' | 'review' | 'campaign' | 'geo';
  label: string;
  timestamp: string;
}

interface DashboardData {
  geoScore: number;
  geoScoreTrend: number;
  declaredRoas: number;
  realRoas: number;
  qualifiedLeads: number;
  conversionRate: number;
  postsThisWeek: number;
  unreadMessages: number;
  aiCreditsRemaining: number;
  leads: LeadRow[];
  activity: ActivityEvent[];
  killSwitchActive: boolean;
  espionMaturityScore?: number;
  espionMaturityCount?: number;
}

// ── Demo data ──────────────────────────────────────────────────────────────────

const DEMO_DATA: DashboardData = {
  geoScore: 78,
  geoScoreTrend: 5.2,
  declaredRoas: 3.8,
  realRoas: 1.4,
  qualifiedLeads: 23,
  conversionRate: 11.4,
  postsThisWeek: 12,
  unreadMessages: 8,
  aiCreditsRemaining: 342,
  leads: [
    { id: 'l1', name: 'Sophie Marchand', source: 'Reddit', score: 94, intent: 'achat immobilier', status: 'monitor', scoredAt: new Date(Date.now() - 36e5).toISOString() },
    { id: 'l2', name: 'Thomas Roux', source: 'LinkedIn', score: 87, intent: 'refonte SEO', status: 'monitor', scoredAt: new Date(Date.now() - 72e5).toISOString() },
    { id: 'l3', name: 'Julie Fabre', source: 'Forum', score: 81, intent: 'campagne ads', status: 'contacted', scoredAt: new Date(Date.now() - 108e5).toISOString() },
    { id: 'l4', name: 'Marc Lenoir', source: 'Reddit', score: 76, intent: 'création site', status: 'monitor', scoredAt: new Date(Date.now() - 144e5).toISOString() },
    { id: 'l5', name: 'Emma Blanc', source: 'Instagram', score: 72, intent: 'social media', status: 'ignored', scoredAt: new Date(Date.now() - 180e5).toISOString() },
  ],
  activity: [
    { id: 'a1', type: 'post', label: 'Post Instagram publié — "Nouveau menu d\'été"', timestamp: new Date(Date.now() - 18e5).toISOString() },
    { id: 'a2', type: 'message', label: 'Nouveau message de Arnaud Petit', timestamp: new Date(Date.now() - 42e5).toISOString() },
    { id: 'a3', type: 'review', label: 'Avis Google 5★ de Claire Dubois', timestamp: new Date(Date.now() - 90e5).toISOString() },
    { id: 'a4', type: 'campaign', label: 'Campagne Meta "Soldes été" — ROAS 2.4', timestamp: new Date(Date.now() - 150e5).toISOString() },
    { id: 'a5', type: 'geo', label: 'Visibilité GEO +3 points (ChatGPT)', timestamp: new Date(Date.now() - 230e5).toISOString() },
    { id: 'a6', type: 'post', label: 'Post LinkedIn publié — "Étude de cas"', timestamp: new Date(Date.now() - 310e5).toISOString() },
    { id: 'a7', type: 'message', label: 'Message Instagram de Sophie M.', timestamp: new Date(Date.now() - 420e5).toISOString() },
    { id: 'a8', type: 'campaign', label: 'Budget Google Ads ajusté automatiquement', timestamp: new Date(Date.now() - 520e5).toISOString() },
    { id: 'a9', type: 'post', label: 'Post Facebook publié — "Témoignage client"', timestamp: new Date(Date.now() - 640e5).toISOString() },
    { id: 'a10', type: 'review', label: 'Avis Google 4★ de Lucas Moreau', timestamp: new Date(Date.now() - 780e5).toISOString() },
  ],
  killSwitchActive: false,
  espionMaturityScore: 74,
  espionMaturityCount: 3,
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "à l'instant";
    if (mins < 60) return `il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    return `il y a ${Math.floor(hours / 24)}j`;
  } catch { return iso; }
}

function fmtDate(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ActivityIcon({ type }: { type: ActivityEvent['type'] }) {
  const cls = 'h-3.5 w-3.5 shrink-0 mt-0.5';
  switch (type) {
    case 'post': return <Zap className={cn(cls, 'text-violet-500')} />;
    case 'message': return <MessageSquare className={cn(cls, 'text-blue-500')} />;
    case 'review': return <StarMini className={cn(cls, 'text-amber-500')} />;
    case 'campaign': return <Target className={cn(cls, 'text-emerald-500')} />;
    case 'geo': return <Globe className={cn(cls, 'text-teal-500')} />;
    default: return <Activity className={cn(cls, 'text-muted-foreground')} />;
  }
}

function StarMini({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1.5l1.8 4.2 4.5.4-3.3 3 .9 4.4L8 11.2l-3.9 2.3.9-4.4-3.3-3 4.5-.4L8 1.5z" />
    </svg>
  );
}

function LeadStatusBadge({ status }: { status: LeadRow['status'] }) {
  switch (status) {
    case 'contacted': return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">Contacté</Badge>;
    case 'monitor': return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">À suivre</Badge>;
    case 'ignored': return <Badge className="bg-muted text-muted-foreground border-border text-[10px]">Ignoré</Badge>;
  }
}

function LeadScoreBar({ score }: { score: number }) {
  const color = score >= 85 ? 'bg-emerald-500' : score >= 70 ? 'bg-amber-500' : 'bg-muted-foreground/30';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold tabular-nums text-muted-foreground">{score}</span>
    </div>
  );
}

function QuickActionCard({
  icon, label, href, color,
}: { icon: React.ReactNode; label: string; href: string; color: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate({ to: href })}
      className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card',
        'hover:border-primary/20 hover:shadow-sm transition-all duration-200',
        'active:scale-[0.98]',
      )}
    >
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
        {icon}
      </div>
      <span className="text-xs font-medium text-foreground text-center leading-tight">{label}</span>
    </button>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function UnifiedCommandCenterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDemoActive } = useDemoMode();

  // Kill-switch local state
  const [killSwitch, setKillSwitch] = useState(false);
  const [ksToggling, setKsToggling] = useState(false);

  // ── Data fetch ────────────────────────────────────────────────────────────

  const { data, isLoading, isError, error, refetch } = useQuery<DashboardData>({
    queryKey: ['unified-command-center', user?.id],
    queryFn: async () => {
      if (isDemoActive) {
        await new Promise(r => setTimeout(r, 600));
        return DEMO_DATA;
      }
      const token = await blink.auth.getValidToken();
      const res = await backendFetch('/api/command-center/unified', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw await readBackendError(res, `Erreur ${res.status}`);
      return res.json();
    },
    staleTime: 30_000,
    refetchInterval: 120_000,
  });

  const d: DashboardData = isDemoActive ? {
    ...DEMO_DATA,
    ...(data ?? {}),
  } : {
    geoScore: Number(data?.geoScore ?? 0),
    geoScoreTrend: Number(data?.geoScoreTrend ?? 0),
    declaredRoas: Number(data?.declaredRoas ?? 0),
    realRoas: Number(data?.realRoas ?? 0),
    qualifiedLeads: Number(data?.qualifiedLeads ?? 0),
    conversionRate: Number(data?.conversionRate ?? 0),
    postsThisWeek: Number(data?.postsThisWeek ?? 0),
    unreadMessages: Number(data?.unreadMessages ?? 0),
    aiCreditsRemaining: Number(data?.aiCreditsRemaining ?? 0),
    leads: Array.isArray(data?.leads) ? data.leads : [],
    activity: Array.isArray(data?.activity) ? data.activity : [],
    killSwitchActive: typeof data?.killSwitchActive === 'boolean' ? data.killSwitchActive : false,
    espionMaturityScore: Number(data?.espionMaturityScore ?? 0),
    espionMaturityCount: Number(data?.espionMaturityCount ?? 0),
  };

  // ── Kill-switch toggle ────────────────────────────────────────────────────

  const toggleKillSwitch = async () => {
    setKsToggling(true);
    if (isDemoActive) {
      await new Promise(r => setTimeout(r, 500));
      setKillSwitch(prev => !prev);
      toast.success(killSwitch ? 'Kill-switch désactivé' : 'Kill-switch activé', {
        description: killSwitch ? 'Campagnes réactivées.' : 'Campagnes sous-performantes suspendues.',
      });
      setKsToggling(false);
      return;
    }
    try {
      const res = await backendFetch(`/api/command-center/kill-switch/${killSwitch ? 'deactivate' : 'activate'}`, {
        method: 'POST',
        headers: await authHeaders(true),
        body: JSON.stringify({ target: 'user_id', userId: user?.id, reason: 'Action manuelle depuis le Command Center' }),
      });
      if (!res.ok) throw await readBackendError(res, `Erreur ${res.status}`);
      setKillSwitch(!killSwitch);
      toast.success(killSwitch ? 'Kill-switch désactivé' : 'Kill-switch activé');
    } catch (e: any) {
      toast.error('Échec', { description: e?.message || 'Erreur kill-switch' });
    } finally {
      setKsToggling(false);
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Page>
        <PageHeader>
          <PageTitle>Command Center</PageTitle>
          <PageDescription>Chargement de votre tableau de bord…</PageDescription>
        </PageHeader>
        <PageBody>
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-48 rounded-xl" />
                <Skeleton className="h-36 rounded-xl" />
                <Skeleton className="h-40 rounded-xl" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-56 rounded-xl" />
                <Skeleton className="h-64 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
              </div>
            </div>
          </div>
        </PageBody>
      </Page>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────

  if (isError && !isDemoActive) {
    return (
      <Page>
        <PageHeader>
          <PageTitle>Command Center</PageTitle>
          <PageDescription>Données temporaires indisponibles</PageDescription>
        </PageHeader>
        <PageBody>
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="flex flex-col items-center gap-4 py-10">
              <AlertTriangle size={36} className="text-amber-600" />
              <div className="max-w-md space-y-2 text-center">
                <h2 className="text-base font-semibold">Les données live ne sont pas disponibles</h2>
                <p className="text-sm text-muted-foreground">Aucune donnée live n'est disponible pour ce compte. Réessayez la synchronisation.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" onClick={() => refetch()}>
                  <RefreshCw size={16} className="mr-2" /> Réessayer
                </Button>
                <Button variant="ghost" onClick={() => navigate({ to: '/command-center' })}>
                  Retour au Command Center
                </Button>
              </div>
            </CardContent>
          </Card>
        </PageBody>
      </Page>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Page>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <PageHeader className="px-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
          <div>
            <PageTitle>Command Center</PageTitle>
            <PageDescription>{fmtDate()} — Bonjour{user?.email ? ` ${user.email.split('@')[0]}` : ''} 👋</PageDescription>
          </div>
          <PageActions className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button size="sm" variant="outline" className="min-h-11 w-full sm:w-auto" onClick={() => navigate({ to: '/cockpit' })}>
              <Plus size={14} className="mr-1.5" />
              Créer un post
            </Button>
            <Button size="sm" onClick={() => navigate({ to: '/campaigns' })}>
              <Rocket size={14} className="mr-1.5" />
              Nouvelle campagne
            </Button>
          </PageActions>
        </div>
      </PageHeader>

      <PageBody className="px-4 sm:px-6">
        <div className="space-y-6 sm:space-y-8 min-w-0">
          {/* ── 1. KPI Banner ─────────────────────────────────────────────── */}
          <StatGroup className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <button onClick={() => navigate({ to: '/geo-command-center' })} className="text-left w-full">
              <Stat
                label="Visibilité GEO"
                value={`${d.geoScore}/100`}
                trend={d.geoScoreTrend}
                trendLabel="vs mois dernier"
                icon={<Globe size={16} />}
              />
            </button>
            <button onClick={() => navigate({ to: '/roas' })} className="text-left w-full">
              <Stat
                label="ROAS Réel"
                value={`${d.realRoas}x`}
                trend={d.declaredRoas - d.realRoas > 0 ? -Math.round((1 - d.realRoas / d.declaredRoas) * 100) : 0}
                trendLabel={`vs déclaré ${d.declaredRoas}x`}
                icon={<BarChart3 size={16} />}
              />
            </button>
            <button onClick={() => navigate({ to: '/lead-scoring' })} className="text-left w-full">
              <Stat
                label="Leads Qualifiés"
                value={String(d.qualifiedLeads)}
                trend={d.conversionRate}
                trendLabel="taux de conversion"
                icon={<Users size={16} />}
              />
            </button>
            <button onClick={() => navigate({ to: '/calendar' })} className="text-left w-full">
              <Stat
                label="Posts Publiés"
                value={String(d.postsThisWeek)}
                trend={undefined}
                trendLabel="cette semaine"
                icon={<Zap size={16} />}
              />
            </button>
            <button onClick={() => navigate({ to: '/inbox' })} className="text-left w-full">
              <Stat
                label="Messages Non-Lus"
                value={String(d.unreadMessages)}
                trend={undefined}
                icon={<MessageSquare size={16} />}
              />
            </button>
            <button onClick={() => navigate({ to: '/espion' })} className="text-left w-full">
              <Stat
                label="Maturité publicitaire"
                value={d.espionMaturityCount ? `${d.espionMaturityScore}/100` : '—'}
                trend={undefined}
                trendLabel={d.espionMaturityCount ? `${d.espionMaturityCount} pépite(s) analysée(s)` : 'Lancez votre premier scan'}
                icon={<Radar size={16} />}
              />
            </button>
            <button onClick={() => navigate({ to: '/billing' })} className="text-left w-full">
              <Stat
                label="Crédits IA"
                value={String(d.aiCreditsRemaining)}
                trend={undefined}
                trendLabel={`/ ${CREDIT_TOTAL}`}
                icon={<BrainCircuit size={16} />}
              />
            </button>
          </StatGroup>

          {/* ── 2. Strategic AI advisory ─────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base"><BrainCircuit size={18} className="text-primary" /> Analyse & Conseil IA</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">Les priorités stratégiques issues de vos cinq piliers marketing.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/advisory-engine' })}>Voir le cockpit <ChevronRight size={14} className="ml-1" /></Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <DashboardErrorBoundary pageName="L’analyse et le conseil IA">
                <AdvisoryEnginePanel />
              </DashboardErrorBoundary>
            </CardContent>
          </Card>

          {/* ── 3. Real website traffic ───────────────────────────────────── */}
          <WebsiteTrafficCard />

          {/* ── 4. Main Grid ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── Left column (2/3) ───────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-6">
              {/* AdTruthDetector */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ShieldAlert size={18} className="text-primary" />
                      AdTruthDetector
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/roas' })}>
                      Détails <ChevronRight size={14} className="ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <DashboardErrorBoundary pageName="Le détecteur d’attribution">
                    <AdTruthDetector activeChannel={isDemoActive ? 'local' : 'google'} />
                  </DashboardErrorBoundary>
                </CardContent>
              </Card>

              {/* GEO Visibility */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Eye size={18} className="text-primary" />
                      Visibilité GEO
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/geo-command-center' })}>
                      Centre GEO <ChevronRight size={14} className="ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Score gauge */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                          <circle cx="32" cy="32" r="27" fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
                          <circle cx="32" cy="32" r="27" fill="none"
                            stroke="hsl(173 80% 36%)"
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={`${(d.geoScore / 100) * 170} 170`}
                          />
                        </svg>
                        <span className="absolute text-lg font-bold text-foreground">{d.geoScore}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Score LLM</p>
                        <p className={cn('text-xs font-medium', d.geoScoreTrend >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                          {d.geoScoreTrend >= 0 ? '+' : ''}{d.geoScoreTrend}% ce mois
                        </p>
                      </div>
                    </div>
                    {/* Alertes */}
                    <div className="flex-1 grid grid-cols-2 gap-2 w-full">
                      {isDemoActive ? [
                        { engine: 'ChatGPT', score: 82, color: 'text-emerald-600 bg-emerald-50' },
                        { engine: 'Claude', score: 71, color: 'text-violet-600 bg-violet-50' },
                        { engine: 'Perplexity', score: 88, color: 'text-sky-600 bg-sky-50' },
                        { engine: 'Gemini', score: 65, color: 'text-amber-600 bg-amber-50' },
                      ].map(e => (
                        <div key={e.engine} className={cn('flex items-center justify-between px-3 py-2 rounded-lg border border-border/60', e.color, 'bg-opacity-30')}>
                          <span className="text-xs font-medium">{e.engine}</span>
                          <span className="text-xs font-bold">{e.score}%</span>
                        </div>
                      )) : (
                        <div className="col-span-2 rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                          Aucun détail par moteur disponible pour ce compte.
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Campaign Health */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity size={18} className="text-primary" />
                    Santé des campagnes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DashboardErrorBoundary pageName="La santé des campagnes">
                    <CampaignHealthWidget />
                  </DashboardErrorBoundary>
                </CardContent>
              </Card>
            </div>

            {/* ── Right column (1/3) ───────────────────────────────────────── */}
            <div className="space-y-6">
              {/* Lead Scoring feed */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Target size={18} className="text-primary" />
                      Lead Scoring
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/lead-scoring' })}>
                      Tout voir <ChevronRight size={14} className="ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {d.leads.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-8">
                      <Users size={32} className="text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground text-center">Aucun lead scoré pour le moment.</p>
                      <Button size="sm" variant="outline" onClick={() => navigate({ to: '/lead-gen' })}>
                        <Sparkles size={14} className="mr-1.5" /> Lancer une analyse
                      </Button>
                    </div>
                  ) : (
                    d.leads.slice(0, 5).map((lead) => (
                      <div key={lead.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/60 bg-card hover:bg-muted/30 transition-colors">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                          lead.score >= 85 ? 'bg-emerald-100 text-emerald-700' :
                          lead.score >= 70 ? 'bg-amber-100 text-amber-700' :
                          'bg-muted text-muted-foreground',
                        )}>
                          {lead.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground truncate">{lead.name}</p>
                            <LeadStatusBadge status={lead.status} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{lead.source} · {lead.intent}</p>
                          <div className="flex items-center justify-between mt-2">
                            <LeadScoreBar score={lead.score} />
                            <div className="flex items-center gap-1">
                              <button
                                className="text-[10px] font-medium text-primary hover:text-primary/80 transition-colors"
                                onClick={() => toast.success('Lead contacté', { description: `${lead.name} sera notifié.` })}
                              >
                                Contacter
                              </button>
                              <span className="text-muted-foreground/30">·</span>
                              <button
                                className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                                onClick={() => toast('Lead ignoré')}
                              >
                                Ignorer
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity size={18} className="text-primary" />
                    Activité récente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {d.activity.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-8">
                      <Activity size={32} className="text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground text-center">Aucune activité récente.</p>
                    </div>
                  ) : (
                    d.activity.slice(0, 10).map((event) => (
                      <div key={event.id} className="flex items-start gap-3 text-sm">
                        <ActivityIcon type={event.type} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground/80 leading-relaxed">{event.label}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{fmtRelative(event.timestamp)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Quick Kill-Switch */}
              <Card className={cn(
                'border-2 transition-colors duration-300',
                killSwitch ? 'border-red-500/50 bg-red-500/[0.02]' : 'border-border',
              )}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Power size={16} className={killSwitch ? 'text-red-500' : 'text-primary'} />
                    Kill-Switch rapide
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-4">
                    {killSwitch
                      ? 'Campagnes sous-performantes suspendues. Cliquez pour réactiver.'
                      : 'Suspendre instantanément les campagnes sous-performantes.'}
                  </p>
                  <Button
                    variant={killSwitch ? 'outline' : 'default'}
                    size="sm"
                    className={cn(
                      'w-full',
                      killSwitch ? 'border-emerald-500/40 text-emerald-600 hover:bg-emerald-50' : 'bg-red-600 hover:bg-red-700 text-white border-0',
                    )}
                    onClick={toggleKillSwitch}
                    disabled={ksToggling}
                  >
                    {ksToggling ? (
                      <RefreshCw size={14} className="mr-1.5 animate-spin" />
                    ) : killSwitch ? (
                      <Power size={14} className="mr-1.5" />
                    ) : (
                      <PowerOff size={14} className="mr-1.5" />
                    )}
                    {killSwitch ? 'Réactiver les campagnes' : 'Pause urgence'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ── 3. Bottom Row — Actions Rapides ────────────────────────────── */}
          <AttributionOverviewWidget />
          <ContentQuotaWidget />

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <QuickActionCard
                  icon={<Zap size={18} className="text-violet-500" />}
                  label="Créer un post"
                  href="/cockpit"
                  color="bg-violet-500/10"
                />
                <QuickActionCard
                  icon={<CalendarClock size={18} className="text-primary" />}
                  label="Planifier sur les réseaux"
                  href="/social"
                  color="bg-primary/10"
                />
                <QuickActionCard
                  icon={<Search size={18} className="text-blue-500" />}
                  label="Scanner un concurrent"
                  href="/tunnels"
                  color="bg-blue-500/10"
                />
                <QuickActionCard
                  icon={<Globe size={18} className="text-teal-500" />}
                  label="Analyser un site"
                  href="/website-scan"
                  color="bg-teal-500/10"
                />
                <QuickActionCard
                  icon={<Video size={18} className="text-rose-500" />}
                  label="Générer une vidéo"
                  href="/creative-studio"
                  color="bg-rose-500/10"
                />
                <QuickActionCard
                  icon={<Layers size={18} className="text-amber-500" />}
                  label="Voir les tunnels"
                  href="/tunnels"
                  color="bg-amber-500/10"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </Page>
  );
}
