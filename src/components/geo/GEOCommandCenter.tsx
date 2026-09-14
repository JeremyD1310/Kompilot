/**
 * GEOCommandCenter — Page principale du GEO Command Center
 * 4 onglets: Visibilité LLM, Annuaires IA, Preuves Sociales, Backlinks
 */
import { Page, PageHeader, PageTitle, PageDescription, PageBody, Tabs, TabsList, TabsTrigger, TabsContent } from '@blinkdotnew/ui';
import { Globe, Search, Link2, MessageSquare, Sparkles } from 'lucide-react';
import { GeoVisibilityTab } from './GeoVisibilityTab';
import { LocalVisibilityScanner } from './LocalVisibilityScanner';
import { AiDirectoriesTab } from './AiDirectoriesTab';
import { SocialProofTab } from './SocialProofTab';
import { BacklinksTab } from './BacklinksTab';

export function GEOCommandCenter() {
  return (
    <Page>
      <PageHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <PageTitle>GEO Command Center</PageTitle>
            <PageDescription>
              Optimisez votre visibilité dans les réponses des moteurs de recherche IA
            </PageDescription>
          </div>
        </div>
      </PageHeader>
      <PageBody>
        <div className="mb-6">
          <LocalVisibilityScanner />
          <p className="mt-2 text-[11px] text-muted-foreground">Les résultats affichés sont des estimations tant que vos connexions Google Business et réseaux sociaux ne sont pas activées.</p>
        </div>
        <Tabs defaultValue="visibility" className="space-y-6">
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="visibility" className="gap-2 text-xs sm:text-sm flex-1 min-w-0">
              <Globe className="h-4 w-4 shrink-0" />
              <span className="truncate">Visibilité LLM</span>
            </TabsTrigger>
            <TabsTrigger value="directories" className="gap-2 text-xs sm:text-sm flex-1 min-w-0">
              <Search className="h-4 w-4 shrink-0" />
              <span className="truncate">Annuaires IA</span>
            </TabsTrigger>
            <TabsTrigger value="social-proof" className="gap-2 text-xs sm:text-sm flex-1 min-w-0">
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span className="truncate">Preuves Sociales</span>
            </TabsTrigger>
            <TabsTrigger value="backlinks" className="gap-2 text-xs sm:text-sm flex-1 min-w-0">
              <Link2 className="h-4 w-4 shrink-0" />
              <span className="truncate">Backlinks</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visibility">
            <GeoVisibilityTab />
          </TabsContent>
          <TabsContent value="directories">
            <AiDirectoriesTab />
          </TabsContent>
          <TabsContent value="social-proof">
            <SocialProofTab />
          </TabsContent>
          <TabsContent value="backlinks">
            <BacklinksTab />
          </TabsContent>
        </Tabs>
      </PageBody>
    </Page>
  );
}

export default GEOCommandCenter;
