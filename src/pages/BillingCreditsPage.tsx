/**
 * BillingCreditsPage — Main Credits & Billing dashboard page.
 * Tabs: Vue d'ensemble, Historique, Recharger, Vidéo IA.
 * Uses React Query for data fetching with auth token from Blink SDK.
 */

import { Suspense, lazy } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Page, PageHeader, PageTitle, PageDescription, PageBody,
  Tabs, TabsList, TabsTrigger, TabsContent,
  StatGroup, Stat, Card, CardContent, Progress, Skeleton,
  Badge, Button, toast,
} from '@blinkdotnew/ui';
import {
  Zap, TrendingUp, ArrowDownRight, CreditCard, History,
  RefreshCw, PenLine, Brain, Share2, Video as VideoIcon,
  Loader2, FileText, ExternalLink,
} from 'lucide-react';
import { blink } from '../blink/client';

// ── Sub-components ──────────────────────────────────────────────────────────
import { CreditBalanceCard } from '../components/billing/CreditBalanceCard';
import { CreditCostTable } from '../components/billing/CreditCostTable';
import { CreditPackCards } from '../components/billing/CreditPackCards';
import { CreditTransactionTable, type Transaction } from '../components/billing/CreditTransactionTable';

const TavusVideoGenerator = lazy(() =>
  import('../components/video/TavusVideoGenerator').then((m) => ({ default: m.TavusVideoGenerator }))
);

// ── API helpers ─────────────────────────────────────────────────────────────

const API_BASE = 'https://gbrhsehk.backend.blink.new';

interface CreditBalance {
  balance: number;
  planName: string;
  monthlyQuota: number;
  usedThisMonth: number;
  remaining: number;
  percentage: number;
}

async function fetchBalance(): Promise<CreditBalance> {
  const token = await blink.auth.getValidToken();
  const res = await fetch(`${API_BASE}/api/credits/balance`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Erreur lors du chargement du solde');
  const data = await res.json() as Partial<CreditBalance> & { data?: Partial<CreditBalance>; balance?: number };
  const normalized = data.data ?? data;
  if (typeof normalized.balance !== 'number') throw new Error('Réponse de solde invalide');
  return {
    balance: normalized.balance,
    planName: normalized.planName ?? 'Plan actuel',
    monthlyQuota: normalized.monthlyQuota ?? normalized.monthlyLimit ?? 0,
    usedThisMonth: normalized.usedThisMonth ?? normalized.monthlyUsed ?? 0,
    remaining: normalized.remaining ?? normalized.balance,
    percentage: normalized.percentage ?? 0,
  };
}

interface HistoryResponse {
  transactions: Transaction[];
}

async function fetchHistory(limit = 50, offset = 0): Promise<Transaction[]> {
  const token = await blink.auth.getValidToken();
  const res = await fetch(`${API_BASE}/api/credits/history?limit=${limit}&offset=${offset}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Erreur lors du chargement de l\'historique');
  const data: HistoryResponse = await res.json();
  return Array.isArray(data) ? data : data.transactions ?? [];
}

// ── Quick action buttons ────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { icon: PenLine, label: 'Générer un post', cost: 1, color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' },
  { icon: Brain, label: 'Analyse IA', cost: 3, color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' },
  { icon: Share2, label: 'Multi-canal', cost: 5, color: 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400' },
  { icon: VideoIcon, label: 'Vidéo IA', cost: 10, color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' },
];

// ── Page ────────────────────────────────────────────────────────────────────

export default function BillingCreditsPage() {
  // Balance query
  const {
    data: balance,
    isLoading: balanceLoading,
    error: balanceError,
    refetch: refetchBalance,
  } = useQuery<CreditBalance>({
    queryKey: ['credits-balance'],
    queryFn: fetchBalance,
    retry: 1,
  });

  // History query
  const {
    data: transactions,
    isLoading: historyLoading,
  } = useQuery<Transaction[]>({
    queryKey: ['credits-history'],
    queryFn: () => fetchHistory(50, 0),
    retry: 1,
  });

  // Toast on error
  if (balanceError) {
    toast.error('Impossible de charger les données de crédits');
  }

  const planName = balance?.planName ?? '—';
  const currentBalance = balance?.balance ?? 0;
  const monthlyQuota = balance?.monthlyQuota ?? 0;
  const usedThisMonth = balance?.usedThisMonth ?? 0;
  const remaining = balance?.remaining ?? 0;
  const percentage = balance?.percentage ?? 0;
  const balanceUnavailable = Boolean(balanceError);

  return (
    <Page>
      <PageHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <PageTitle className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard size={18} className="text-primary" />
              </div>
              Crédits & Facturation
            </PageTitle>
            <PageDescription className="mt-1">
              Gérez vos crédits, consultez l'historique et rechargez votre compte.
            </PageDescription>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20 self-start sm:self-auto">
            <Zap size={12} className="mr-1" />
            Plan {planName}
          </Badge>
        </div>
      </PageHeader>

      <PageBody>
        {/* ── Stats row ── */}
        {balanceUnavailable ? (
          <Card className="mb-6 border-destructive/30">
            <CardContent className="py-6 flex items-center justify-between gap-4">
              <div><p className="font-semibold text-foreground">Solde indisponible</p><p className="text-sm text-muted-foreground">Nous n’avons pas pu charger vos crédits. Aucun solde nul n’est affiché.</p></div>
              <Button variant="outline" onClick={() => refetchBalance()} className="gap-2"><RefreshCw size={14} /> Réessayer</Button>
            </CardContent>
          </Card>
        ) : balanceLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-5 pb-4 space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-16" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Balance card with circular progress */}
            <CreditBalanceCard
              balance={currentBalance}
              quota={monthlyQuota}
              planName={planName}
            />

            {/* Used this month */}
            <Card className="card-hover">
              <CardContent className="pt-5 pb-4">
                <Stat
                  label="Utilisés ce mois"
                  value={usedThisMonth.toString()}
                  icon={<ArrowDownRight />}
                  description={`${percentage}% du quota mensuel`}
                  trend={-percentage}
                  trendLabel={`/ ${monthlyQuota}`}
                />
              </CardContent>
            </Card>

            {/* Remaining */}
            <Card className="card-hover">
              <CardContent className="pt-5 pb-4">
                <Stat
                  label="Crédits restants"
                  value={remaining.toString()}
                  icon={<Zap />}
                  description="Disponibles ce mois"
                  trend={100 - percentage}
                  trendLabel={remaining > 0 ? 'Suffisant' : 'Épuisés'}
                />
              </CardContent>
            </Card>

            {/* Current plan */}
            <Card className="card-hover">
              <CardContent className="pt-5 pb-4">
                <Stat
                  label="Plan actuel"
                  value={planName}
                  icon={<CreditCard />}
                  description={`Quota: ${monthlyQuota} crédits/mois`}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Tabs ── */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="w-full sm:w-auto overflow-x-auto">
            <TabsTrigger value="overview" className="gap-1.5">
              <Zap size={14} />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <History size={14} />
              Historique
            </TabsTrigger>
            <TabsTrigger value="recharge" className="gap-1.5">
              <RefreshCw size={14} />
              Recharger
            </TabsTrigger>
            <TabsTrigger value="video" className="gap-1.5">
              <VideoIcon size={14} />
              Vidéo IA
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-1.5">
              <FileText size={14} />
              Factures
            </TabsTrigger>
          </TabsList>

          {/* ── Tab: Overview ── */}
          <TabsContent value="overview" className="space-y-6 animate-fade-in">
            {/* Usage progress */}
            <Card>
              <CardContent className="pt-6 pb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground">
                    Utilisation mensuelle
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {usedThisMonth} / {monthlyQuota} crédits
                  </span>
                </div>
                <Progress
                  value={percentage}
                  className="h-3"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    {percentage}% utilisé
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {remaining} restants
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Credit costs */}
            <CreditCostTable />

            {/* Quick actions */}
            <Card>
              <CardContent className="pt-5 pb-4">
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp size={16} className="text-primary" />
                  Actions rapides
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors group"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
                        <action.icon size={18} />
                      </div>
                      <span className="text-xs font-semibold text-foreground">{action.label}</span>
                      <span className="text-[10px] text-muted-foreground">{action.cost} crédit{action.cost > 1 ? 's' : ''}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab: History ── */}
          <TabsContent value="history" className="animate-fade-in">
            <CreditTransactionTable
              transactions={transactions ?? []}
              isLoading={historyLoading}
            />
          </TabsContent>

          {/* ── Tab: Recharge ── */}
          <TabsContent value="recharge" className="animate-fade-in">
            <div className="mb-4">
              <h3 className="text-base font-bold text-foreground mb-1">Recharger vos crédits</h3>
              <p className="text-sm text-muted-foreground">
                Achetez un pack de crédits pour continuer à utiliser les fonctionnalités IA. Paiement sécurisé via Stripe.
              </p>
            </div>
            <CreditPackCards />
          </TabsContent>

          {/* ── Tab: Vidéo IA ── */}
          <TabsContent value="video" className="animate-fade-in">
            <Suspense
              fallback={
                <div className="space-y-4">
                  <Card>
                    <CardContent className="py-10 flex items-center justify-center">
                      <Loader2 size={24} className="text-primary animate-spin" />
                    </CardContent>
                  </Card>
                </div>
              }
            >
              <TavusVideoGenerator />
            </Suspense>
          </TabsContent>

          {/* ── Tab: Factures ── */}
          <TabsContent value="invoices" className="animate-fade-in">
            <Card>
              <CardContent className="pt-5 pb-4 space-y-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground mb-1">Vos factures</h3>
                    <p className="text-sm text-muted-foreground">
                      Retrouvez et téléchargez toutes vos factures depuis le portail de facturation Stripe.
                      Vos justificatifs comptables sont disponibles en un clic.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={async () => {
                    try {
                      const token = await blink.auth.getValidToken();
                      const res = await fetch(`${API_BASE}/api/billing/portal`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
                      const data = await res.json();
                      if (!res.ok || !data.url) throw new Error(data.error || 'Portail indisponible');
                      window.open(data.url, '_blank', 'noopener,noreferrer');
                    } catch (error) {
                      toast.error('Impossible d’ouvrir le portail Stripe', { description: error instanceof Error ? error.message : 'Veuillez réessayer.' });
                    }
                  }}
                  className="gap-2"
                >
                  <ExternalLink size={15} />
                  Accéder au portail de facturation
                </Button>

                <p className="text-xs text-muted-foreground">
                  Vous serez redirigé vers le portail sécurisé Stripe pour consulter, télécharger vos factures et mettre à jour vos informations de paiement.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageBody>
    </Page>
  );
}
