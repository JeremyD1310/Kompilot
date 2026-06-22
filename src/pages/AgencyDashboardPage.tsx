/**
 * AgencyDashboardPage — /agence/dashboard
 * Bird's-eye view of all agency clients with GEO scores and quick actions.
 */
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Building2, Plus } from 'lucide-react';
import {
  Page, PageHeader, PageTitle, PageDescription, PageActions, PageBody,
  Button,
  toast,
} from '@blinkdotnew/ui';
import { useAuth } from '../hooks/useAuth';
import { useAgencyClients } from '../hooks/useAgencyClients';
import { useAgencyRealTimeKPIs } from '../hooks/useAgencyRealTimeKPIs';

/* ── Sub-components ── */
import { type MockClient } from '../components/agency/ClientCard';
import { AgencyAlertsPanel } from '../components/agency/AgencyAlertsPanel';
import { AddClientModal } from '../components/agency/AddClientModal';
import { AgencyKPIStrip } from '../components/agency/AgencyKPIStrip';
import { AgencyClientGrid } from '../components/agency/AgencyClientGrid';
import { AgencyAPIStack } from '../components/agency/AgencyAPIStack';

/* ── Other agency components ── */
import { LiveCloningEngine } from '../components/agency/LiveCloningEngine';
import { AgencyPRSalesKit } from '../components/agency/AgencyPRSalesKit';
import { AILeadProspectionEngine } from '../components/agency/AILeadProspectionEngine';
import { WhiteLabelInstantPreview } from '../components/agency/WhiteLabelInstantPreview';
import { AgencyDemoDataBanner } from '../components/agency/AgencyDemoDataBanner';
import { AgencyOpportunityAlerts } from '../components/agency/AgencyOpportunityAlerts';
import { ValidationLinkGenerator } from '../components/agency/ValidationLinkGenerator';
import { DomainReputationMonitor } from '../components/agency/DomainReputationMonitor';
import { CustomDomainPanel } from '../components/agency/CustomDomainPanel';
import { useQuery } from '@tanstack/react-query';
import { blink } from '../blink/client';
import { Download, Globe, MessageSquare, Star } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'https://gbrhsehk.backend.blink.new';

/** Fetch aggregated stats for all sub-accounts */
function useAgencyAggregate(userId: string | undefined, skip: boolean) {
  return useQuery({
    queryKey: ['agency-aggregate', userId],
    enabled: !!userId && !skip, // skip when demo data
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const token = await blink.auth.getValidToken();
      const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      const res = await fetch(`${BACKEND_URL}/api/agency/aggregate?since=${since}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return res.json() as Promise<{
        totals: {
          total_sms_sent: number;
          total_reviews_handled: number;
          total_posts_published: number;
          total_noshow_revenue_cents: number;
          clients_with_improvement: number;
        };
        sub_accounts_count: number;
      }>;
    },
  });
}

export default function AgencyDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const { clients: allClients, isLoading, isDemo, refetch } = useAgencyClients(user?.id);
  const aggregate = useAgencyAggregate(user?.id, isDemo);

  // Real-time KPIs from daily_analytics for all sub-account user IDs
  const subAccountUserIds = isDemo ? [] : allClients.map(c => c.id);
  const realTimeKPIs = useAgencyRealTimeKPIs(user?.id, subAccountUserIds);

  const totalClients = allClients.length;
  const alertClients = allClients.filter(c => c.status === 'alert').length;
  const avgScore = totalClients > 0
    ? Math.round(allClients.reduce((s, c) => s + c.geoScore, 0) / totalClients)
    : 0;

  const handlePilot = (clientId: string) => {
    const client = allClients.find(c => c.id === clientId);
    if (isDemo) {
      toast('Mode démonstration', {
        description: `En production, vous piloteriez "${client?.name ?? 'ce client'}" depuis son dashboard dédié.`,
      });
      return;
    }
    localStorage.setItem('agency_active_client', clientId);
    navigate({ to: '/dashboard' });
  };

  const handleAddClient = (_client: MockClient) => {
    refetch();
  };

  if (isLoading) {
    return (
      <Page>
        <PageBody>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, color: 'hsl(var(--muted-foreground))', fontSize: '.9rem' }}>
            Chargement du tableau de bord…
          </div>
        </PageBody>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,89,248,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={18} style={{ color: '#A78BFA' }} />
          </div>
          <div>
            <PageTitle>Tableau de bord Agence</PageTitle>
            <PageDescription>Vue d'ensemble de tous vos clients — {totalClients} établissements pilotés</PageDescription>
          </div>
        </div>
        <PageActions>
          <Button size="sm" className="gap-2" onClick={() => setShowAddModal(true)}>
            <Plus size={14} />
            Ajouter un client
          </Button>
        </PageActions>
      </PageHeader>

      <PageBody>
        {/* ── Agency Demo Data Banner (first visit) ── */}
        {user && (
          <div className="mb-6">
            <AgencyDemoDataBanner userId={user.id} onExplore={() => localStorage.setItem(`agency_demo_seen_${user.id}`, '1')} />
          </div>
        )}

        {/* ── White-Label Instant Preview ── */}
        <div className="mb-6">
          <WhiteLabelInstantPreview onUpgrade={() => navigate({ to: '/subscription' })} />
        </div>

        {/* ── 📈 Monitor de Réputation Domaine ── */}
        <div className="mb-6">
          <DomainReputationMonitor domain="app.mon-agence.fr" />
        </div>

        {/* ── 🔗 Validation Client — Magic Link ── */}
        <div className="mb-6">
          <ValidationLinkGenerator />
        </div>

        {/* ── 🌐 Custom Domain (White-Label) ── */}
        <div className="mb-6">
          <CustomDomainPanel />
        </div>

        {/* ── KPI summary strip ── */}
        <AgencyKPIStrip
          totalClients={totalClients}
          alertClients={alertClients}
          avgScore={avgScore}
          totalSmsSent={aggregate.data?.totals?.total_sms_sent ?? realTimeKPIs.totalSmsSent}
          totalLeads={undefined}
          totalUnhandledReviews={realTimeKPIs.totalUnhandledReviews || undefined}
          avgGeoScore={realTimeKPIs.avgGeoScore || undefined}
          weekTrend={realTimeKPIs.weekTrend}
          clientsImproved={realTimeKPIs.clientsImproved}
        />

        {/* ── Aggregated consumption stats (real data from sub-accounts) ── */}
        {aggregate.data?.totals && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {([
              { label: 'SMS envoyés (30j)', value: aggregate.data.totals.total_sms_sent, icon: <MessageSquare size={14} />, color: '#6366F1' },
              { label: 'Avis traités (30j)', value: aggregate.data.totals.total_reviews_handled, icon: <Star size={14} />, color: '#F59E0B' },
              { label: 'Posts publiés (30j)', value: aggregate.data.totals.total_posts_published, icon: <Globe size={14} />, color: '#0D9488' },
              { label: 'Revenus No-Show', value: `${(aggregate.data.totals.total_noshow_revenue_cents / 100).toFixed(0)}€`, icon: <Download size={14} />, color: '#22C55E' },
            ] as const).map(k => (
              <div
                key={k.label}
                className="rounded-xl border border-border bg-card p-3.5"
              >
                <div className="flex items-center gap-1.5 mb-1.5" style={{ color: k.color }}>
                  {k.icon}
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{k.label}</p>
                </div>
                <p className="text-xl font-black" style={{ color: k.color }}>{k.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* 🚨 AI Opportunity Alerts — surveillance temps réel du parc clients */}
        <div className="mb-6">
          <AgencyOpportunityAlerts />
        </div>

        {/* ── AI Lead Prospection Engine ── */}
        <div className="mb-6">
          <AILeadProspectionEngine />
        </div>

        {/* ── 🆕 Stack API Agence — Data, CRM & Prospection ── */}
        <AgencyAPIStack />

        {/* ── Agency PR & Sales Kit ── */}
        <div className="mb-6">
          <AgencyPRSalesKit />
        </div>

        {/* ── Live Cloning Engine ── */}
        <div className="mb-6">
          <LiveCloningEngine />
        </div>

        {/* ── Priority Alerts Panel ── */}
        <AgencyAlertsPanel
          clients={allClients}
          clientSnapshots={realTimeKPIs.clientSnapshots}
          onPilot={handlePilot}
        />

        {/* ── Client grid (search + cards + empty state + footer note) ── */}
        <AgencyClientGrid
          clients={allClients}
          isDemoData={isDemo}
          onPilot={handlePilot}
          onAddClient={() => setShowAddModal(true)}
        />
      </PageBody>

      {/* ── Add Client Modal ── */}
      <AddClientModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddClient}
        userId={user?.id ?? ''}
      />
    </Page>
  );
}