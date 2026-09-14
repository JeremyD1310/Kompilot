/**
 * SocialAssistantPage — AI-powered social media publishing cockpit.
 * Tabs: Audit → Content Creator → Calendar → Analytics
 */
import { useState } from 'react';
import { Send, BarChart3, Sparkles, CalendarDays, MessagesSquare, Radio } from 'lucide-react';
import {
  Page, PageHeader, PageTitle, PageDescription, PageBody, PageActions,
  Tabs, TabsList, TabsTrigger, TabsContent, Button,
} from '@blinkdotnew/ui';
import { SocialAssistantAudit } from '../components/social/SocialAssistantAudit';
import { SocialAssistantPostCreator } from '../components/social/SocialAssistantPostCreator';
import { SocialAssistantEngagement } from '../components/social/SocialAssistantEngagement';
import { SocialAssistantTrends } from '../components/social/SocialAssistantTrends';

export default function SocialAssistantPage() {
  const [activeTab, setActiveTab] = useState('create');

  return (
    <Page>
      <PageHeader>
        <div className="flex items-center justify-between w-full gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <PageTitle>Assistant Social IA</PageTitle>
              <PageDescription>Optimisez vos publications avec l'IA — audit, adaptation et preview</PageDescription>
            </div>
          </div>
          <PageActions>
            <Button onClick={() => setActiveTab('create')} className="gap-2">
              <Send size={15} /> Nouvelle publication
            </Button>
          </PageActions>
        </div>
      </PageHeader>

      <PageBody>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="audit">
              <BarChart3 size={14} className="mr-1.5" /> Audit
            </TabsTrigger>
            <TabsTrigger value="create">
              <Sparkles size={14} className="mr-1.5" /> Création
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <CalendarDays size={14} className="mr-1.5" /> Calendrier
            </TabsTrigger>
            <TabsTrigger value="replies">
              <MessagesSquare size={14} className="mr-1.5" /> Modération
            </TabsTrigger>
            <TabsTrigger value="trends">
              <Radio size={14} className="mr-1.5" /> Tendances
            </TabsTrigger>
          </TabsList>

          <TabsContent value="audit" className="mt-6">
            <SocialAssistantAudit />
          </TabsContent>

          <TabsContent value="create" className="mt-6">
            <SocialAssistantPostCreator />
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <CalendarDays size={40} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">Intégré au planificateur principal</p>
              <p className="text-xs mt-1">Le calendrier intelligent est accessible depuis le menu « Réseaux Sociaux ».</p>
            </div>
          </TabsContent>

          <TabsContent value="replies" className="mt-6">
            <SocialAssistantEngagement />
          </TabsContent>

          <TabsContent value="trends" className="mt-6">
            <SocialAssistantTrends />
          </TabsContent>
        </Tabs>
      </PageBody>
    </Page>
  );
}
