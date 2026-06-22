/**
 * AgencyWebhooksPanel — 🔌 Intégrations & Webhooks Agence
 *
 * Tabs:
 *  • CRM Connecteurs — CRMCard list (HubSpot, Make, Zapier, Custom)
 *  • Webhooks HTTP   — WebhookRow list + JSON payload preview + stats
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Webhook, Plus, Check, Copy, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import { Button, Badge, toast } from '@blinkdotnew/ui';

import { CRMCard }         from './webhooks/CRMCard';
import { WebhookRow }      from './webhooks/WebhookRow';
import { AddWebhookModal } from './webhooks/AddWebhookModal';
import {
  EVENT_LABELS, CRM_INTEGRATIONS, SAMPLE_PAYLOAD, DEFAULT_WEBHOOKS,
} from './webhooks/WebhookTypes';
import type { WebhookConfig, WebhookEvent, CRMIntegration } from './webhooks/WebhookTypes';

// ── Main component ─────────────────────────────────────────────────────────────

export function AgencyWebhooksPanel() {
  // ── State ────────────────────────────────────────────────────────────────────
  const [webhooks,        setWebhooks]        = useState<WebhookConfig[]>(DEFAULT_WEBHOOKS);
  const [crmIntegrations, setCrmIntegrations] = useState<CRMIntegration[]>(CRM_INTEGRATIONS);
  const [activeTab,       setActiveTab]       = useState<'crm' | 'webhooks'>('crm');

  // Modal state
  const [showAddModal,   setShowAddModal]   = useState(false);
  const [newUrl,         setNewUrl]         = useState('');
  const [newLabel,       setNewLabel]       = useState('');
  const [selectedEvents, setSelectedEvents] = useState<WebhookEvent[]>(['lead_qualified']);

  // Payload preview
  const [showPayload, setShowPayload] = useState(false);
  const [copied,      setCopied]      = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleAddWebhook = () => {
    if (!newUrl.trim() || !newLabel.trim() || selectedEvents.length === 0) {
      toast.error('Remplissez tous les champs');
      return;
    }
    const newWh: WebhookConfig = {
      id: `wh_${Date.now()}`, label: newLabel, url: newUrl,
      events: selectedEvents, active: true, successCount: 0, failCount: 0,
    };
    setWebhooks(prev => [...prev, newWh]);
    setShowAddModal(false);
    setNewUrl(''); setNewLabel(''); setSelectedEvents(['lead_qualified']);
    toast.success('Webhook ajouté !', { description: 'Les événements seront envoyés dès maintenant.' });
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhooks(prev => prev.filter(w => w.id !== id));
    toast.success('Webhook supprimé');
  };

  const handleToggleWebhook = (id: string) =>
    setWebhooks(prev => prev.map(w => w.id === id ? { ...w, active: !w.active } : w));

  const handleTestWebhook = () =>
    toast.success('Test envoyé ✓', { description: 'Payload de test transmis à votre endpoint.' });

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(SAMPLE_PAYLOAD);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Payload copié !');
  };

  const handleCRMConnect = (id: CRMIntegration['id'], key: string) =>
    setCrmIntegrations(prev => prev.map(c => c.id === id ? { ...c, connected: true, apiKey: key } : c));

  const toggleEvent = (ev: WebhookEvent) =>
    setSelectedEvents(prev => prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev]);

  // ── Stats ────────────────────────────────────────────────────────────────────

  const stats = [
    { label: 'Total webhooks', value: webhooks.length,                                  color: '#6359F8' },
    { label: 'Envois réussis', value: webhooks.reduce((s, w) => s + w.successCount, 0), color: '#22C55E' },
    { label: 'Échecs',         value: webhooks.reduce((s, w) => s + w.failCount,    0), color: '#EF4444' },
  ];

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">

      {/* ── Panel header ── */}
      <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-violet-950/20 to-indigo-950/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shrink-0">
            <Webhook className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">🔌 Intégrations & Webhooks</h3>
              <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 border-violet-200 dark:border-violet-700 text-[10px] font-bold">
                AGENCE PRO
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Envoyez les leads IA et alertes No-Show vers HubSpot, Make, Zapier ou votre CRM
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 mt-4 bg-muted/30 rounded-xl p-1 w-fit">
          {([
            { id: 'crm'      as const, label: '🏢 CRM Connecteurs' },
            { id: 'webhooks' as const, label: '⚡ Webhooks HTTP'   },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="p-5">

        {/* CRM tab */}
        {activeTab === 'crm' && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground mb-4">
              Connectez votre CRM en 1 clic. Les leads qualifiés par l'IA Kompilot et les alertes
              No-Show seront synchronisés instantanément.
            </p>
            {crmIntegrations.map(crm => (
              <CRMCard key={crm.id} integration={crm} onConnect={handleCRMConnect} />
            ))}
          </div>
        )}

        {/* Webhooks tab */}
        {activeTab === 'webhooks' && (
          <div className="space-y-4">

            {/* Payload preview */}
            <div className="rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setShowPayload(!showPayload)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-muted-foreground" />
                  <span className="text-xs font-bold text-foreground">Voir le payload JSON envoyé</span>
                  <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                    application/json
                  </span>
                </div>
                {showPayload
                  ? <ChevronUp size={14} className="text-muted-foreground" />
                  : <ChevronDown size={14} className="text-muted-foreground" />}
              </button>

              <AnimatePresence>
                {showPayload && (
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border p-4">
                      <div className="flex justify-end mb-2">
                        <button
                          onClick={handleCopyPayload}
                          className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                        >
                          {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                          {copied ? 'Copié !' : 'Copier'}
                        </button>
                      </div>
                      <pre className="text-[11px] font-mono text-foreground/70 leading-relaxed whitespace-pre-wrap overflow-x-auto">
                        {SAMPLE_PAYLOAD}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Webhook list */}
            {webhooks.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {webhooks.length} webhook{webhooks.length > 1 ? 's' : ''} configuré{webhooks.length > 1 ? 's' : ''}
                </p>
                {webhooks.map(wh => (
                  <WebhookRow
                    key={wh.id} wh={wh}
                    onDelete={() => handleDeleteWebhook(wh.id)}
                    onToggle={() => handleToggleWebhook(wh.id)}
                    onTest={handleTestWebhook}
                  />
                ))}
              </div>
            )}

            {/* Add webhook CTA */}
            <Button onClick={() => setShowAddModal(true)} variant="outline" size="sm" className="w-full gap-2 border-dashed">
              <Plus size={14} /> Ajouter un webhook
            </Button>

            {/* Stats */}
            {webhooks.length > 0 && (
              <div className="grid grid-cols-3 gap-3 pt-2">
                {stats.map(stat => (
                  <div key={stat.label} className="rounded-xl border border-border p-3 text-center">
                    <p className="text-xs font-black" style={{ color: stat.color }}>{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Add webhook modal ── */}
      <AddWebhookModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        newLabel={newLabel}       onLabelChange={setNewLabel}
        newUrl={newUrl}           onUrlChange={setNewUrl}
        selectedEvents={selectedEvents}
        onToggleEvent={toggleEvent}
        onConfirm={handleAddWebhook}
      />
    </div>
  );
}
