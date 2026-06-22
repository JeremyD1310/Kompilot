/**
 * AgencyAPIStack — "Stack API Agence" tabs section (audit, meta-audit, data, webhooks).
 */
import { Database, FileSearch, Megaphone, Webhook } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@blinkdotnew/ui';
import { DataSourcesPanel } from './DataSourcesPanel';
import { AgencyWebhooksPanel } from './AgencyWebhooksPanel';
import { AuditFlashGenerator } from './AuditFlashGenerator';
import { MetaAdsAuditPanel } from '../ads/MetaAdsAuditPanel';

export function AgencyAPIStack() {
  return (
    <div className="mb-6 rounded-2xl border border-border overflow-hidden">
      {/* Section header */}
      <div className="px-5 py-3 bg-gradient-to-r from-slate-900/60 to-slate-800/40 border-b border-border flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
          <Database size={14} style={{ color: 'hsl(var(--primary))' }} />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Stack API Agence</p>
          <p className="text-xs text-muted-foreground">Données, CRM & Prospection concurrentielle</p>
        </div>
      </div>
      <Tabs defaultValue="audit" className="p-0">
        <div className="px-5 pt-4 border-b border-border overflow-x-auto">
          <TabsList className="gap-1">
            <TabsTrigger value="audit" className="gap-1.5 text-xs">
              <FileSearch size={13} />
              Audit Flash Lead Magnet
            </TabsTrigger>
            <TabsTrigger value="meta-audit" className="gap-1.5 text-xs">
              <Megaphone size={13} />
              🔍 Audit Tunnel Meta
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-1.5 text-xs">
              <Database size={13} />
              Sources de données
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="gap-1.5 text-xs">
              <Webhook size={13} />
              Intégrations & Webhooks
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="audit" className="p-5 m-0">
          <AuditFlashGenerator />
        </TabsContent>
        <TabsContent value="meta-audit" className="p-5 m-0">
          <MetaAdsAuditPanel />
        </TabsContent>
        <TabsContent value="data" className="p-5 m-0">
          <DataSourcesPanel />
        </TabsContent>
        <TabsContent value="webhooks" className="p-5 m-0">
          <AgencyWebhooksPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
