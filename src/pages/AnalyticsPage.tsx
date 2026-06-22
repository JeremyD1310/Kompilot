import React, { useState } from 'react';
import { AICopilotPanel } from '../components/shared/AICopilotPanel';
import {
  Page,
  PageHeader,
  PageTitle,
  PageDescription,
  PageBody,
  PageActions,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Button,
  toast
} from '@blinkdotnew/ui';
import { TrendingUp } from 'lucide-react';
import { OverviewTab } from './analytics/OverviewTab';
import { BestTimesTab } from './analytics/BestTimesTab';
import { CompetitorsTab } from './analytics/CompetitorsTab';
import { ReportsTab } from './analytics/ReportsTab';
import { AnalyticsEmptyState } from '../components/analytics/AnalyticsEmptyState';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [hasData] = useState(true);
  // AICopilotPanel mounted below — manages its own FAB/open state

  return (
    <Page className="page-enter">
      <PageHeader>
        <PageTitle>Analyses & Performance</PageTitle>
        <PageDescription>
          Suivez l'évolution de votre présence en ligne et découvrez comment booster votre engagement.
        </PageDescription>
        <PageActions>
          <Button variant="outline" size="sm" onClick={() => toast.success('Données actualisées')}>
            <TrendingUp className="h-4 w-4 mr-2" /> Actualiser
          </Button>
        </PageActions>
      </PageHeader>

      <PageBody>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="best-times">Meilleures heures</TabsTrigger>
            <TabsTrigger value="competitors">Concurrents</TabsTrigger>
            <TabsTrigger value="reports">Rapport PDF</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {hasData ? <OverviewTab /> : <AnalyticsEmptyState />}
          </TabsContent>

          <TabsContent value="best-times">
            <BestTimesTab />
          </TabsContent>

          <TabsContent value="competitors">
            <CompetitorsTab />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab />
          </TabsContent>
        </Tabs>
      </PageBody>

      {/* AI Copilot — manages its own FAB + chat panel */}
      <AICopilotPanel context="analytics" />
    </Page>
  );
}
