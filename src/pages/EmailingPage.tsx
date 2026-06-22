import {
  Page, PageHeader, PageTitle, PageDescription, PageBody,
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@blinkdotnew/ui';
import { Users, Mail, ShieldCheck } from 'lucide-react';
import { ClientsTable } from '../components/emailing/ClientsTable';
import { CampaignCreator } from '../components/emailing/CampaignCreator';
import { DomainHealthSection } from '../components/emailing/DomainHealthSection';

export default function EmailingPage() {
  return (
    <Page>
      <PageHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users size={20} className="text-primary" />
          </div>
          <div>
            <PageTitle>👥 Clients &amp; Emailing</PageTitle>
            <PageDescription>
              Gérez votre base clients et lancez des campagnes email personnalisées par IA
            </PageDescription>
          </div>
        </div>
      </PageHeader>

      <PageBody>
        <Tabs defaultValue="clients" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="clients" className="gap-2">
              <Users size={14} /> Base Clients
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2">
              <Mail size={14} /> Campagnes Email
            </TabsTrigger>
            <TabsTrigger value="deliverability" className="gap-2">
              <ShieldCheck size={14} /> Délivrabilité
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="animate-fade-in">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <ClientsTable />
            </div>
          </TabsContent>

          <TabsContent value="campaigns" className="animate-fade-in">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <CampaignCreator />
            </div>
          </TabsContent>

          <TabsContent value="deliverability" className="animate-fade-in">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <DomainHealthSection />
            </div>
          </TabsContent>
        </Tabs>
      </PageBody>
    </Page>
  );
}