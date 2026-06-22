import React, { useState } from 'react';
import { Page, PageHeader, PageTitle, PageDescription, PageBody, PageActions, Tabs, TabsList, TabsTrigger, TabsContent, Button } from '@blinkdotnew/ui';
import { InteractionTrackingDashboard } from '../components/social/InteractionTrackingDashboard';
import { MultiPlatformScheduler } from '../components/social/MultiPlatformScheduler';
import { Share2, LayoutDashboard, Sparkles } from 'lucide-react';
import { AIContentGeneratorModal } from '../components/ai/AIContentGeneratorModal';

const SocialMediaPage: React.FC = () => {
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <Page>
      <PageHeader>
        <div className="flex items-center justify-between w-full gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Share2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <PageTitle>Gestion Sociale</PageTitle>
              <PageDescription>Gérez vos publications et analysez vos performances sur tous les réseaux.</PageDescription>
            </div>
          </div>
          <PageActions>
            <Button
              variant="outline"
              onClick={() => setAiOpen(true)}
              className="gap-2 text-sm shrink-0"
            >
              <Sparkles size={15} />
              <span className="hidden sm:inline">Générer avec l'IA</span>
              <span className="sm:hidden">IA</span>
            </Button>
          </PageActions>
        </div>
      </PageHeader>

      <PageBody>
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="h-4 w-4" /> Analyse des Interactions
            </TabsTrigger>
            <TabsTrigger value="scheduler" className="gap-2">
              <Share2 className="h-4 w-4" /> Planificateur Multi-Canaux
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <InteractionTrackingDashboard />
          </TabsContent>

          <TabsContent value="scheduler" className="space-y-6">
            <MultiPlatformScheduler />
          </TabsContent>
        </Tabs>
      </PageBody>

      {/* AI Content Generator modal */}
      <AIContentGeneratorModal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
      />
    </Page>
  );
};

export default SocialMediaPage;
