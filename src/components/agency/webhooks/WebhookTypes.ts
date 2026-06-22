/**
 * WebhookTypes — shared interfaces, constants, and sample data
 * for the AgencyWebhooksPanel feature.
 */

// ── Core types ────────────────────────────────────────────────────────────────

export interface WebhookConfig {
  id: string;
  label: string;
  url: string;
  events: WebhookEvent[];
  active: boolean;
  lastTriggered?: string;
  successCount: number;
  failCount: number;
}

export type WebhookEvent =
  | 'lead_qualified'
  | 'no_show_alert'
  | 'review_negative'
  | 'inbox_urgent'
  | 'geo_score_drop';

export interface CRMIntegration {
  id: 'hubspot' | 'make' | 'zapier' | 'custom';
  label: string;
  logo: string;
  description: string;
  color: string;
  apiKeyLabel: string;
  connected: boolean;
  apiKey?: string;
}

// ── Event labels ──────────────────────────────────────────────────────────────

export const EVENT_LABELS: Record<WebhookEvent, { label: string; color: string }> = {
  lead_qualified:  { label: '🎯 Lead qualifié par IA',     color: '#22C55E' },
  no_show_alert:   { label: '🚫 Alerte No-Show',            color: '#EF4444' },
  review_negative: { label: '⭐ Avis négatif détecté',      color: '#F59E0B' },
  inbox_urgent:    { label: '📨 Message Inbox urgent',      color: '#6366F1' },
  geo_score_drop:  { label: '📉 Chute score G.E.O.',        color: '#EC4899' },
};

// ── CRM catalog ───────────────────────────────────────────────────────────────

export const CRM_INTEGRATIONS: CRMIntegration[] = [
  {
    id: 'hubspot',
    label: 'HubSpot CRM',
    logo: '🟠',
    description: 'Envoyez les leads qualifiés directement dans vos pipelines HubSpot.',
    color: '#ff7a59',
    apiKeyLabel: 'Clé API HubSpot (Private App)',
    connected: false,
  },
  {
    id: 'make',
    label: 'Make (ex-Integromat)',
    logo: '🟣',
    description: 'Déclenchez des scénarios Make pour automatiser votre suivi commercial.',
    color: '#a855f7',
    apiKeyLabel: 'URL Webhook Make',
    connected: false,
  },
  {
    id: 'zapier',
    label: 'Zapier',
    logo: '🟡',
    description: 'Connectez vos Zaps pour synchroniser les leads avec 6000+ apps.',
    color: '#f97316',
    apiKeyLabel: 'URL Webhook Zapier (Catch Hook)',
    connected: false,
  },
  {
    id: 'custom',
    label: 'Webhook Personnalisé',
    logo: '🔧',
    description: 'Envoyez les événements vers votre propre endpoint HTTP.',
    color: '#6359F8',
    apiKeyLabel: 'URL de votre endpoint HTTPS',
    connected: false,
  },
];

// ── Sample payload ────────────────────────────────────────────────────────────

export const SAMPLE_PAYLOAD = `{
  "event": "lead_qualified",
  "timestamp": "2026-06-11T10:30:00Z",
  "agency_id": "ag_xxxx",
  "client": {
    "name": "Le Petit Bistro",
    "city": "Bordeaux",
    "sector": "Restaurant"
  },
  "lead": {
    "geo_score": 84,
    "vulnerability": 78,
    "estimated_loss_monthly": 2400,
    "alerts": ["Fiche Google non réclamée", "0 post ce mois"],
    "closing_kit_ready": true
  },
  "source": "Kompilot Agency API v2"
}`;

// ── Default seed data ─────────────────────────────────────────────────────────

export const DEFAULT_WEBHOOKS: WebhookConfig[] = [
  {
    id: 'wh_1',
    label: 'HubSpot — Leads qualifiés',
    url: 'https://api.hubspot.com/crm/v3/objects/contacts',
    events: ['lead_qualified', 'inbox_urgent'],
    active: true,
    lastTriggered: 'Il y a 2h',
    successCount: 47,
    failCount: 0,
  },
];
