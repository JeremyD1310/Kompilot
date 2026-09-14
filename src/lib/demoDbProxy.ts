/**
 * demoDbProxy.ts — Proxy wrapper around blink.db that returns mock data
 * when running on demo.kompilot.fr.
 *
 * Strategy: wrap the real `blink` client so that `blink.db` calls are
 * intercepted and served from MOCK_TABLES. All write operations return
 * success (no-op) without touching the real database.
 *
 * Usage: import { getBlink } from './demoDbProxy' — then use getBlink()
 * instead of `blink` everywhere that does DB calls.
 */

import { blink } from '../blink/client';
import { isDemoRuntime } from './demoDomain';
import { MOCK_TABLES, MOCK_INSTANT_FORM_CONFIGS, MOCK_INSTANT_FORM_APPOINTMENTS } from './demoMockData';

// ── UUID generator for mock creates ────────────────────────────────────────
function mockId(): string {
  return 'mock-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ── Helper: resolve table name (camelCase or snake_case) to mock data ──────
function getMockRows(tableName: string): unknown[] | undefined {
  // Direct match
  if (tableName in MOCK_TABLES) return MOCK_TABLES[tableName];
  // Normalize: try camelCase → snake_case and vice versa
  const snake = tableName.replace(/[A-Z]/g, c => '_' + c.toLowerCase());
  if (snake in MOCK_TABLES) return MOCK_TABLES[snake];
  const camel = tableName.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  if (camel in MOCK_TABLES) return MOCK_TABLES[camel];
  return undefined;
}

// ── Simple filter engine (supports where: { field: value } + AND/OR) ───────
function filterRows(rows: unknown[], where?: Record<string, unknown>): unknown[] {
  if (!where) return rows;

  // Handle AND
  if (where.AND && Array.isArray(where.AND)) {
    return where.AND.reduce((acc: unknown[], clause: Record<string, unknown>) => {
      return filterRows(acc, clause);
    }, rows);
  }

  // Handle OR
  if (where.OR && Array.isArray(where.OR)) {
    const results = new Set<unknown>();
    for (const clause of where.OR) {
      for (const row of filterRows(rows, clause as Record<string, unknown>)) {
        results.add(row);
      }
    }
    return [...results];
  }

  // Simple equality match
  return rows.filter((row: any) => {
    for (const [key, value] of Object.entries(where)) {
      if (key === 'AND' || key === 'OR') continue;
      // Coerce for SQLite-style string/number comparison
      const rowVal = row[key];
      if (rowVal == null && value != null) return false;
      if (String(rowVal) !== String(value)) return false;
    }
    return true;
  });
}

// ── Mock table object (mimics blink.db.table<T>('name')) ───────────────────

function createMockTable(tableName: string) {
  return {
    list: async (opts?: { where?: Record<string, unknown>; orderBy?: Record<string, string>; limit?: number; offset?: number; select?: string[] }) => {
      let rows = getMockRows(tableName) ?? [];

      // Apply where filter
      if (opts?.where) {
        rows = filterRows(rows, opts.where);
      }

      // Apply orderBy
      if (opts?.orderBy) {
        const [field, dir] = Object.entries(opts.orderBy)[0];
        if (field && dir) {
          rows = [...rows].sort((a: any, b: any) => {
            const av = a[field] ?? '';
            const bv = b[field] ?? '';
            return dir === 'desc' ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
          });
        }
      }

      // Apply offset + limit
      if (opts?.offset) rows = rows.slice(opts.offset);
      if (opts?.limit) rows = rows.slice(0, opts.limit);

      return rows;
    },

    get: async (id: string) => {
      const rows = getMockRows(tableName) ?? [];
      return rows.find((r: any) => r.id === id) ?? null;
    },

    create: async (data: Record<string, unknown>) => {
      return { id: data.id ?? mockId(), ...data, createdAt: new Date().toISOString() };
    },

    createMany: async (items: Record<string, unknown>[]) => {
      return items.map(d => ({ id: d.id ?? mockId(), ...d }));
    },

    update: async (_id: string, data: Record<string, unknown>) => {
      return { id: _id, ...data };
    },

    updateMany: async (items: { id: string; [k: string]: unknown }[]) => {
      return items;
    },

    delete: async (_id: string) => { /* no-op */ },

    deleteMany: async (_opts?: unknown) => { /* no-op */ },

    upsert: async (data: Record<string, unknown>) => {
      return { id: data.id ?? mockId(), ...data };
    },

    count: async (opts?: { where?: Record<string, unknown> }) => {
      const rows = getMockRows(tableName) ?? [];
      if (opts?.where) return filterRows(rows, opts.where).length;
      return rows.length;
    },

    exists: async (opts?: { where?: Record<string, unknown> }) => {
      if (!opts?.where) return true;
      return filterRows(getMockRows(tableName) ?? [], opts.where).length > 0;
    },
  };
}

/**
 * createDemoDbProxy() — returns a Proxy object that mimics blink.db
 * with all table operations returning mock data.
 *
 * Usage: (blink as any).db = createDemoDbProxy() on demo domain.
 */
export function createDemoDbProxy() {
  const handler: ProxyHandler<any> = {
    get(_target, prop: string) {
      // blink.db.table<T>('name') — returns a table accessor function
      if (prop === 'table') {
        return (tableName: string) => createMockTable(tableName);
      }
      // blink.db.<tableName> — direct access (proxy fallback used by SDK)
      return createMockTable(prop);
    },
  };
  return new Proxy({}, handler);
}

// ── getBlink() — returns the blink client with mocked DB on demo domain ────

let _cachedBlink: typeof blink | null = null;

export function getBlink(): typeof blink {
  if (!isDemoRuntime()) return blink;

  if (_cachedBlink) return _cachedBlink;

  // Create a proxy that intercepts blink.db access
  const dbHandler: ProxyHandler<any> = {
    get(_target, prop: string) {
      // blink.db.table<T>('name') — returns a table accessor function
      if (prop === 'table') {
        return (tableName: string) => createMockTable(tableName);
      }

      // blink.db.<tableName> — direct access (proxy fallback used by SDK)
      return createMockTable(prop);
    },
  };

  const dbProxy = new Proxy({}, dbHandler);

  // Wrap blink to override .db
  const blinkProxy = new Proxy(blink, {
    get(target, prop: string | symbol, receiver) {
      if (prop === 'db') return dbProxy;
      return Reflect.get(target, prop, receiver);
    },
  }) as typeof blink;

  _cachedBlink = blinkProxy;
  return blinkProxy;
}

/**
 * Intercept fetch calls that go to the Blink DB REST API on demo domain.
 * This catches any DB calls that bypass the SDK (direct REST).
 */
export function installDemoFetchInterceptor(): void {
  if (typeof window === 'undefined') return;
  const origFetch = window.fetch.bind(window);
  const demoFetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    if (!isDemoRuntime()) return origFetch(input, init);

    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    // The dashboard demo is local-only. Never report success for unknown
    // backend/DB/function calls: a successful envelope can make a destructive
    // action look completed and hide a production leak.
    if (url.includes('.backend.blink.new') || url.includes('/api/db/') || url.includes('blink.new/api/db/')) {
      return new Response(JSON.stringify({ blocked: true, status: 'demo', message: 'Cette action est désactivée dans la démonstration.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'X-Kompilot-Demo-Blocked': 'true' },
      });
    }

    // Billing status is read-only and can safely be represented locally.
    if (url.includes('/api/functions/') && url.includes('billing')) {
      return new Response(JSON.stringify({ status: 'active', planId: 'agency', gracePeriodEnd: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ── Email Campaigns demo mocks ────────────────────────────────────────
    // POST /api/campaigns/ — create new campaign (must check BEFORE list interceptor)
    if (url.match(/\/api\/campaigns\/?$/) && init?.method === 'POST') {
      return new Response(JSON.stringify({
        campaign: { id: 'camp-demo-' + Date.now(), name: 'Nouvelle campagne', status: 'draft', recipientCount: 0, openRate: 0, clickRate: 0, createdAt: new Date().toISOString() },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // GET /api/campaigns/ — list campaigns
    if (url.includes('/api/campaigns/') && !url.includes('/api/campaigns/c') && url.endsWith('/api/campaigns/') && init?.method !== 'POST') {
      return new Response(JSON.stringify({
        campaigns: [
          { id: 'camp-demo-001', name: 'Offre été 2026 ☀️', status: 'sent', recipientCount: 1247, openRate: 34.2, clickRate: 8.7, subject: 'Découvrez nos offres exclusives', createdAt: '2026-07-10T09:00:00.000Z' },
          { id: 'camp-demo-002', name: 'Lancement nouveau menu 🍕', status: 'sent', recipientCount: 892, openRate: 41.5, clickRate: 12.3, subject: 'Notre nouveau menu est arrivé !', createdAt: '2026-07-05T14:00:00.000Z' },
          { id: 'camp-demo-003', name: 'Rappel réservation', status: 'scheduled', recipientCount: 456, openRate: 0, clickRate: 0, subject: 'N\'oubliez pas votre réservation', createdAt: '2026-07-18T10:00:00.000Z' },
        ],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (url.includes('/api/campaigns/templates')) {
      return new Response(JSON.stringify({
        templates: [
          { id: 'tpl-001', name: 'Newsletter classique', subject: 'Votre résumé mensuel', htmlPreview: '<h1>Bonjour {{name}}</h1><p>Voici votre résumé du mois.</p>' },
          { id: 'tpl-002', name: 'Promotion', subject: 'Offre spéciale pour vous !', htmlPreview: '<h1>Offre limitée</h1><p>-20% sur votre prochaine visite.</p>' },
        ],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (url.match(/\/api\/campaigns\/[^/]+\/report/)) {
      return new Response(JSON.stringify({
        sent: 1247, opened: 427, clicked: 108, bounced: 12, unsubscribed: 3,
        openRate: 34.2, clickRate: 8.7,
        recentEvents: [
          { type: 'open', email: 'sophie.m@gmail.com', timestamp: '2026-07-10T10:15:00.000Z' },
          { type: 'click', email: 'thomas.d@outlook.fr', timestamp: '2026-07-10T10:20:00.000Z' },
          { type: 'open', email: 'camille.l@yahoo.fr', timestamp: '2026-07-10T11:00:00.000Z' },
        ],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (url.match(/\/api\/campaigns\/[^/]+\/contacts/) && init?.method === 'POST') {
      return new Response(JSON.stringify({ success: true, imported: 50 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (url.match(/\/api\/campaigns\/[^/]+\/send/) && init?.method === 'POST') {
      return new Response(JSON.stringify({ success: true, queued: 456 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (url.match(/\/api\/campaigns\/?$/) && init?.method === 'POST') {
      return new Response(JSON.stringify({
        campaign: { id: 'camp-demo-' + Date.now(), name: 'Nouvelle campagne', status: 'draft', recipientCount: 0, openRate: 0, clickRate: 0, createdAt: new Date().toISOString() },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // ── TikTok Ads demo mocks ──────────────────────────────────────────────
    if (url.includes('/api/tiktok/ads/status')) {
      return new Response(JSON.stringify({
        connected: true,
        expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
        advertisers: [{ id: 'adv-demo-001', name: 'Le Petit Bistro — Ads', status: 'STATUS_ACTIVE' }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (url.includes('/api/tiktok/ads/campaigns')) {
      return new Response(JSON.stringify({
        campaigns: [
          {
            id: 'camp-tt-001', name: 'Printemps TikTok 🌸', status: 'CAMPAIGN_STATUS_ENABLE', objective: 'VIDEO_VIEWS',
            budget: 50, budgetMode: 'BUDGET_MODE_DAY', createdAt: '2026-06-01T10:00:00.000Z',
            metrics: { spend: 842.50, impressions: 124300, clicks: 3890, cpc: 0.22, cpm: 6.78, ctr: 3.13, conversions: 156, costPerConversion: 5.40, videoViews: 89200, video6sViews: 52100, videoP100Watched: 18400, likes: 4520, comments: 312, shares: 189, profileVisits: 780, follows: 245, conversionRate: 4.01 },
          },
          {
            id: 'camp-tt-002', name: 'Été Promo ☀️', status: 'CAMPAIGN_STATUS_ENABLE', objective: 'CONVERSIONS',
            budget: 80, budgetMode: 'BUDGET_MODE_DAY', createdAt: '2026-06-15T14:00:00.000Z',
            metrics: { spend: 1256.80, impressions: 198500, clicks: 6240, cpc: 0.20, cpm: 6.33, ctr: 3.14, conversions: 287, costPerConversion: 4.38, videoViews: 145000, video6sViews: 87300, videoP100Watched: 31200, likes: 8940, comments: 567, shares: 345, profileVisits: 1420, follows: 523, conversionRate: 4.60 },
          },
          {
            id: 'camp-tt-003', name: 'Lancement Menu 🍕', status: 'CAMPAIGN_STATUS_ENABLE', objective: 'REACH',
            budget: 30, budgetMode: 'BUDGET_MODE_DAY', createdAt: '2026-07-01T09:00:00.000Z',
            metrics: { spend: 425.20, impressions: 67800, clicks: 1890, cpc: 0.23, cpm: 6.27, ctr: 2.79, conversions: 72, costPerConversion: 5.91, videoViews: 48900, video6sViews: 28700, videoP100Watched: 9800, likes: 2340, comments: 156, shares: 78, profileVisits: 390, follows: 134, conversionRate: 3.81 },
          },
          {
            id: 'camp-tt-004', name: 'Story Behind 🎬', status: 'CAMPAIGN_STATUS_DISABLE', objective: 'VIDEO_VIEWS',
            budget: 20, budgetMode: 'BUDGET_MODE_DAY', createdAt: '2026-05-20T11:00:00.000Z',
            metrics: { spend: 312.60, impressions: 42100, clicks: 1120, cpc: 0.28, cpm: 7.43, ctr: 2.66, conversions: 38, costPerConversion: 8.23, videoViews: 31500, video6sViews: 16800, videoP100Watched: 5400, likes: 1560, comments: 89, shares: 45, profileVisits: 210, follows: 67, conversionRate: 3.39 },
          },
        ],
        totalCampaigns: 4, advertiserId: 'adv-demo-001',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (url.includes('/api/tiktok/ads/report')) {
      return new Response(JSON.stringify({
        report: {
          totalSpend: 2837.10, totalImpressions: 432700, totalClicks: 13140, totalReach: 312400,
          totalConversions: 553, cpc: 0.22, cpm: 6.56, ctr: 3.04,
          costPerConversion: 5.13, videoViews: 314600, video6sViews: 184900, videoCompletionRate: 59,
          engagementRate: 4.25, totalEngagements: 18360, likes: 17360, comments: 1124, shares: 657,
          profileVisits: 2800, follows: 969, conversionRate: 4.21,
        },
        advertiserId: 'adv-demo-001',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // ── Facebook Reviews demo mocks ────────────────────────────────────────
    if (url.includes('/api/facebook/reviews/status')) {
      return new Response(JSON.stringify({
        connected: true, expiresAt: new Date(Date.now() + 86400000 * 60).toISOString(),
        pages: [{ id: 'page-demo-fb-001', name: 'Le Petit Bistro', category: 'Restaurant' }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (url.includes('/api/facebook/reviews/summary')) {
      return new Response(JSON.stringify({
        connected: true, totalReviews: 47, avgRating: 4.6,
        ratingDistribution: { '5': 28, '4': 12, '3': 4, '2': 2, '1': 1 },
        pagesCount: 1,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (url.includes('/api/facebook/reviews/inbox')) {
      return new Response(JSON.stringify({
        reviews: [
          { id: 'fbr-1', pageId: 'page-demo-fb-001', pageName: 'Le Petit Bistro', reviewerName: 'Claire Fontaine', reviewerId: 'fb-u-1', rating: 5, comment: 'Excellente ambiance et cuisine raffinée ! Le tajine d\'agneau est un délice. Service impeccable.', createdAt: '2026-07-19T18:30:00.000Z', storyId: 'story-fb-001' },
          { id: 'fbr-2', pageId: 'page-demo-fb-001', pageName: 'Le Petit Bistro', reviewerName: 'Marc Duplessis', reviewerId: 'fb-u-2', rating: 5, comment: 'Un vrai coup de cœur pour ce restaurant ! Les produits sont frais et l\'équipe est adorable. Je recommande vivement.', createdAt: '2026-07-17T20:15:00.000Z', storyId: 'story-fb-002' },
          { id: 'fbr-3', pageId: 'page-demo-fb-001', pageName: 'Le Petit Bistro', reviewerName: 'Amélie Rousseau', reviewerId: 'fb-u-3', rating: 4, comment: 'Très bon restaurant, cadre agréable. Un petit bémol sur le temps d\'attente mais la qualité est au rendez-vous.', createdAt: '2026-07-15T13:45:00.000Z', storyId: 'story-fb-003' },
          { id: 'fbr-4', pageId: 'page-demo-fb-001', pageName: 'Le Petit Bistro', reviewerName: 'Jean-Pierre Moreau', reviewerId: 'fb-u-4', rating: 5, comment: 'La meilleure adresse de La Rochelle sans hésitation. Le brunch du dimanche est exceptionnel !', createdAt: '2026-07-13T11:00:00.000Z', storyId: 'story-fb-004' },
          { id: 'fbr-5', pageId: 'page-demo-fb-001', pageName: 'Le Petit Bistro', reviewerName: 'Sophie Laurent', reviewerId: 'fb-u-5', rating: 3, comment: 'Correct sans plus. L\'accueil était un peu froid ce soir-là.', createdAt: '2026-07-10T21:00:00.000Z', storyId: 'story-fb-005' },
          { id: 'fbr-6', pageId: 'page-demo-fb-001', pageName: 'Le Petit Bistro', reviewerName: 'Antoine Bernard', reviewerId: 'fb-u-6', rating: 4, comment: 'Bonne adresse pour un dîner en couple. Les desserts sont particulièrement soignés.', createdAt: '2026-07-08T19:30:00.000Z', storyId: 'story-fb-006' },
        ],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (url.includes('/api/facebook/reviews/reply')) {
      return new Response(JSON.stringify({ success: true, commentId: 'reply-demo-' + Date.now() }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // ── Google Business Profile Reviews demo mocks ─────────────────────────
    if (url.includes('/api/gbp/reviews-summary')) {
      return new Response(JSON.stringify({
        connected: true, totalReviews: 128, avgRating: 4.7,
        ratingDistribution: { FIVE: 78, FOUR: 32, THREE: 12, TWO: 4, ONE: 2 },
        unrepliedCount: 5, accountsCount: 1,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (url.includes('/api/gbp/reviews-inbox')) {
      return new Response(JSON.stringify({
        reviews: [
          { id: 'gbr-1', reviewId: 'gbrv-1', senderName: 'Thomas R.', rating: 5, comment: 'Service impeccable et équipe très réactive ! Le cadre est magnifique et la cuisine excellente.', isRead: false, isStarred: true, createdAt: '2026-07-17T10:00:00.000Z' },
          { id: 'gbr-2', reviewId: 'gbrv-2', senderName: 'Marie C.', rating: 4, comment: 'Très bon restaurant, je recommande. Seul bémol : le service un peu long.', isRead: false, isStarred: false, createdAt: '2026-07-15T14:30:00.000Z' },
          { id: 'gbr-3', reviewId: 'gbrv-3', senderName: 'Pierre D.', rating: 5, comment: 'Une pépite à La Rochelle ! Les plats du jour sont toujours une surprise agréable.', isRead: true, isStarred: false, createdAt: '2026-07-12T09:00:00.000Z' },
          { id: 'gbr-4', reviewId: 'gbrv-4', senderName: 'Isabelle M.', rating: 3, comment: 'Correct mais les prix sont un peu élevés pour la portion.', isRead: true, isStarred: false, createdAt: '2026-07-10T16:45:00.000Z' },
          { id: 'gbr-5', reviewId: 'gbrv-5', senderName: 'Laurent B.', rating: 5, comment: 'Le brunch du dimanche est devenu notre rituel ! Merci à toute l\'équipe.', isRead: false, isStarred: true, createdAt: '2026-07-08T11:15:00.000Z' },
        ],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (url.includes('/api/gbp/reviews-reply')) {
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (url.includes('/api/gbp/reviews-sync')) {
      return new Response(JSON.stringify({ success: true, newSynced: 0, message: 'Déjà à jour' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // ── Advisory demo mocks ────────────────────────────────────────────────
    if (url.includes('/api/advisory/')) {
      return new Response(JSON.stringify({ error: 'Demo data is provided locally' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ── Command Center demo mocks ──────────────────────────────────────────
    if (url.includes('/api/command-center/')) {
      return new Response(JSON.stringify({
        success: true,
        killSwitchActive: false,
        status: 'demo',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // ── Social connection demo mocks ───────────────────────────────────────
    if (url.includes('/api/meta/oauth/connect') || url.includes('/api/meta/oauth/refresh')) {
      return new Response(JSON.stringify({ url: `${window.location.origin}/settings?meta_error=${encodeURIComponent('La connexion Meta est désactivée dans le mode démo.')}` }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (url.includes('/api/meta/oauth/status') || url.includes('/api/meta/pages') || url.includes('/api/tiktok/oauth/status')) {
      return new Response(JSON.stringify({ connected: false, status: 'disconnected', pages: [], accounts: [], locations: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (url.includes('/api/meta/accounts/select') || url.includes('/api/meta/accounts/') || url.includes('/api/meta/oauth/disconnect')) {
      return new Response(JSON.stringify({ success: true, accounts: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ── Campaign Health demo mock ──────────────────────────────────────────
    if (url.includes('/api/campaign-health')) {
      return new Response(JSON.stringify({
        meta: { connected: false, matchRate: null, spend: 0, attributedRevenue: 0, conversionCount: 0, matchedConversions: 0, lastSync: null, alertGap: null, alertSeverity: 'ok' },
        tiktok: { connected: false, matchRate: null, spend: 0, attributedRevenue: 0, conversionCount: 0, matchedConversions: 0, lastSync: null, alertGap: null, alertSeverity: 'ok' },
        overallMatchRate: null,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // ── Conversion KPIs demo mocks ─────────────────────────────────────────
    if (url.includes('/api/conversion-kpis/summary')) {
      return new Response(JSON.stringify({
        totalImpressions: 482500, totalClicks: 14680, totalConversions: 623,
        avgCtr: 3.04, avgConversionRate: 4.24, avgCpc: 0.22,
        totalAdSpend: 3229.70, totalRevenue: 18690.00,
        roas: 5.79, periodDays: 30,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (url.includes('/api/conversion-kpis/timeline')) {
      return new Response(JSON.stringify({
        timeline: [
          { date: '2026-06-22', impressions: 15200, clicks: 468, conversions: 18, spend: 103.20 },
          { date: '2026-06-25', impressions: 16800, clicks: 520, conversions: 22, spend: 114.40 },
          { date: '2026-06-28', impressions: 14300, clicks: 410, conversions: 15, spend: 90.20 },
          { date: '2026-07-01', impressions: 18900, clicks: 612, conversions: 28, spend: 134.60 },
          { date: '2026-07-04', impressions: 21200, clicks: 698, conversions: 32, spend: 153.50 },
          { date: '2026-07-07', impressions: 19400, clicks: 590, conversions: 25, spend: 129.80 },
          { date: '2026-07-10', impressions: 22100, clicks: 724, conversions: 35, spend: 159.30 },
          { date: '2026-07-13', impressions: 20600, clicks: 680, conversions: 30, spend: 149.60 },
          { date: '2026-07-16', impressions: 23800, clicks: 790, conversions: 38, spend: 173.80 },
          { date: '2026-07-19', impressions: 25100, clicks: 842, conversions: 42, spend: 185.20 },
        ],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // ── Instant Forms demo mocks ───────────────────────────────────────────
    if (url.includes('/api/instant-forms/appointments')) {
      return new Response(JSON.stringify({ appointments: MOCK_INSTANT_FORM_APPOINTMENTS }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (url.includes('/api/instant-forms/config') && !url.includes('sync-test')) {
      return new Response(JSON.stringify({ configs: MOCK_INSTANT_FORM_CONFIGS }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (url.includes('/api/instant-forms/sync-test')) {
      return new Response(JSON.stringify({ success: true, message: 'Sync test réussi — 3 leads importés' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Public demo routes must never call the deployed backend with a synthetic
    // token. Return a safe envelope for any unrecognised backend request so
    // optional widgets cannot leak 401s into the prospect experience.
    if (url.includes('.backend.blink.new')) {
      return new Response(JSON.stringify({ success: true, status: 'demo', data: [], items: [], results: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Block every non-local request by default. Local assets, Vite HMR and
    // same-origin navigation remain available for the real dashboard shell.
    if (url.startsWith('http') && !url.startsWith(window.location.origin)) {
      return new Response(JSON.stringify({ blocked: true, status: 'demo', message: 'External calls are disabled in demo mode.' }), {
        status: 204,
        headers: { 'Content-Type': 'application/json', 'X-Kompilot-Demo-Blocked': 'true' },
      });
    }

    return origFetch(input, init);
  };
  window.fetch = demoFetch;
}
