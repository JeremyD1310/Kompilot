/**
 * metaMarketingService.ts — Meta Marketing API v20.0 connector
 *
 * Gère la connexion sécurisée à l'API Marketing de Meta via le token système
 * longue durée (System User Token). Fournit :
 *   - checkMetaConnection()  : valide le token et les permissions
 *   - getAdAccounts()        : liste les comptes publicitaires accessibles
 *   - getCampaigns()         : liste les campagnes d'un compte
 *   - getAdInsights()        : récupère les métriques de performance
 *
 * Variables d'environnement requises (Cloudflare Workers bindings) :
 *   META_APP_ID            — ID de l'app Meta
 *   META_APP_SECRET        — Secret de l'app Meta
 *   META_SYSTEM_USER_TOKEN — Token système longue durée (non-expirant)
 */

const META_GRAPH_VERSION = 'v20.0';
const META_GRAPH_BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`;
const FETCH_TIMEOUT_MS = 10_000;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MetaConnectionStatus {
  connected: boolean;
  userId?: string;
  name?: string;
  scopes?: string[];
  adAccountIds?: string[];
  error?: string;
  errorCode?: number;
  checkedAt: string;
}

export interface MetaAdAccount {
  id: string;
  name: string;
  currency: string;
  account_status: number;
  amount_spent: string;
  balance: string;
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
}

export interface MetaInsight {
  campaign_id?: string;
  campaign_name?: string;
  impressions: string;
  clicks: string;
  spend: string;
  cpc: string;
  cpm: string;
  ctr: string;
  reach: string;
  date_start: string;
  date_stop: string;
}

interface GraphResponse<T> {
  data?: T[];
  error?: MetaGraphError;
  paging?: { cursors?: { before: string; after: string }; next?: string };
}

interface MetaGraphError {
  message: string;
  type: string;
  code: number;
  fbtrace_id?: string;
}

// ── MetaApiError ──────────────────────────────────────────────────────────────

export class MetaApiError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly type?: string,
  ) {
    super(message);
    this.name = 'MetaApiError';
  }

  get isTokenInvalid(): boolean { return [190, 102, 104].includes(this.code); }
  get isPermissionError(): boolean { return [10, 200, 299].includes(this.code); }
  get isRateLimited(): boolean { return [4, 17, 32, 613].includes(this.code); }
}

// ── graphFetch — fetch avec timeout et parsing unifié ────────────────────────

async function graphFetch<T>(
  path: string,
  token: string,
  extraParams: Record<string, string> = {},
): Promise<T> {
  const params = new URLSearchParams({ access_token: token, ...extraParams });
  const url = `${META_GRAPH_BASE}/${path}?${params.toString()}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : String(err);
    throw new MetaApiError(
      msg.includes('abort') ? 'Timeout réseau Meta API (10s)' : `Erreur réseau : ${msg}`,
      0,
    );
  }
  clearTimeout(timer);

  const json = await response.json() as (T & { error?: MetaGraphError });
  if (json.error) throw new MetaApiError(json.error.message, json.error.code, json.error.type);
  if (!response.ok) throw new MetaApiError(`HTTP ${response.status}`, response.status);
  return json;
}

// ── checkMetaConnection ───────────────────────────────────────────────────────

/**
 * Valide le System User Token en appelant /me et /me/adaccounts.
 * Retourne un MetaConnectionStatus complet pour l'affichage dans l'UI.
 */
export async function checkMetaConnection(token: string): Promise<MetaConnectionStatus> {
  const checkedAt = new Date().toISOString();

  if (!token || token.trim() === '') {
    return {
      connected: false,
      error: 'META_SYSTEM_USER_TOKEN est manquant. Configurez le token dans les secrets.',
      checkedAt,
    };
  }

  try {
    // Étape 1 : validation identité
    const me = await graphFetch<{ id: string; name: string }>(
      'me', token, { fields: 'id,name' },
    );

    // Étape 2 : comptes publicitaires
    let adAccountIds: string[] = [];
    try {
      const accounts = await graphFetch<GraphResponse<{ id: string }>>(
        'me/adaccounts', token, { fields: 'id', limit: '50' },
      );
      adAccountIds = (accounts.data ?? []).map((a) => a.id);
    } catch (err) {
      console.warn('[metaMarketingService] Impossible de lister les adaccounts:', err);
    }

    // Étape 3 : scopes du token
    let scopes: string[] = [];
    try {
      const debug = await graphFetch<{ data?: { scopes?: string[] } }>(
        'debug_token', token, { input_token: token },
      );
      scopes = debug.data?.scopes ?? [];
    } catch { /* non bloquant */ }

    return { connected: true, userId: me.id, name: me.name, scopes, adAccountIds, checkedAt };
  } catch (err) {
    if (err instanceof MetaApiError) {
      let errorMsg = err.message;
      if (err.isTokenInvalid) {
        errorMsg = `Token invalide ou expiré (code ${err.code}). Régénérez un System User Token dans Meta Business Suite.`;
      } else if (err.isPermissionError) {
        errorMsg = `Permissions insuffisantes (code ${err.code}). Vérifiez les scopes ads_management, ads_read, business_management.`;
      } else if (err.isRateLimited) {
        errorMsg = `Rate limit Meta atteint (code ${err.code}). Réessayez dans quelques minutes.`;
      }
      return { connected: false, error: errorMsg, errorCode: err.code, checkedAt };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return { connected: false, error: msg, checkedAt };
  }
}

// ── getAdAccounts ─────────────────────────────────────────────────────────────

/** Liste les comptes publicitaires accessibles par le System User. */
export async function getAdAccounts(token: string): Promise<MetaAdAccount[]> {
  const res = await graphFetch<GraphResponse<MetaAdAccount>>('me/adaccounts', token, {
    fields: 'id,name,currency,account_status,amount_spent,balance',
    limit: '50',
  });
  return res.data ?? [];
}

// ── getCampaigns ──────────────────────────────────────────────────────────────

/** Retourne les campagnes d'un compte publicitaire (act_XXXXXXX). */
export async function getCampaigns(
  token: string,
  accountId: string,
  status: 'ACTIVE' | 'PAUSED' | 'ALL' = 'ALL',
): Promise<MetaCampaign[]> {
  const params: Record<string, string> = {
    fields: 'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time',
    limit: '100',
  };
  if (status !== 'ALL') params.effective_status = `["${status}"]`;
  const res = await graphFetch<GraphResponse<MetaCampaign>>(`${accountId}/campaigns`, token, params);
  return res.data ?? [];
}

// ── getAdInsights ─────────────────────────────────────────────────────────────

/** Métriques agrégées pour un compte ou une campagne sur une période donnée. */
export async function getAdInsights(
  token: string,
  objectId: string,
  datePreset: 'last_7d' | 'last_30d' | 'last_90d' | 'this_month' = 'last_30d',
): Promise<MetaInsight[]> {
  const res = await graphFetch<GraphResponse<MetaInsight>>(`${objectId}/insights`, token, {
    fields: 'campaign_id,campaign_name,impressions,clicks,spend,cpc,cpm,ctr,reach',
    date_preset: datePreset,
    level: 'campaign',
    limit: '50',
  });
  return res.data ?? [];
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORT CALENDAR CAMPAIGN → META ADS MANAGER
// ══════════════════════════════════════════════════════════════════════════════

/**
 * CampaignExportData — données d'une campagne Kompilot à exporter vers Meta.
 *
 * Correspond à un ScheduledPost enrichi avec les données de ciblage et budget
 * récupérées depuis la page Campaign Calendar.
 */
export interface CampaignExportData {
  /** Texte principal de la publicité (body copy) */
  message: string;
  /** Titre court de la campagne (≤ 40 chars recommandé pour Meta) */
  campaignName: string;
  /** Objectif Meta : REACH, LINK_CLICKS, POST_ENGAGEMENT, CONVERSIONS, BRAND_AWARENESS */
  objective: 'REACH' | 'LINK_CLICKS' | 'POST_ENGAGEMENT' | 'CONVERSIONS' | 'BRAND_AWARENESS';
  /** Budget journalier en centimes (ex: 1000 = 10,00€) — minimum 100 (1€/jour) */
  dailyBudgetCents: number;
  /** Date de début ISO (ex: '2025-01-01') */
  startDate: string;
  /** Date de fin ISO (ex: '2025-01-31'). Optionnelle : si absente, campagne continue */
  endDate?: string;
  /** Pays de ciblage (ex: 'FR') */
  targetCountry: string;
  /** Tranches d'âge minimale */
  ageMin?: number;
  /** Tranches d'âge maximale */
  ageMax?: number;
  /** Genres ciblés : 0=tous, 1=homme, 2=femme */
  genders?: number[];
  /** URL de destination (si objectif = LINK_CLICKS) */
  destinationUrl?: string;
  /** URL de l'image à utiliser (doit être accessible publiquement) */
  imageUrl?: string;
}

/**
 * CampaignExportResult — résultat de la création dans Meta Ads Manager.
 */
export interface CampaignExportResult {
  success: boolean;
  /** ID de la campagne créée (ex: "120200000XXXXXXX") */
  campaignId?: string;
  /** ID de l'ad set créé */
  adSetId?: string;
  /** URL directe vers le Gestionnaire de Publicités Meta */
  adsManagerUrl?: string;
  /** Message d'erreur si success = false */
  error?: string;
  /** Code d'erreur Meta (pour diagnostic) */
  metaErrorCode?: number;
  /** Statut de la campagne créée */
  status?: 'PAUSED' | 'ACTIVE';
}

/**
 * CampaignPerformanceMetrics — métriques de performance d'une campagne active.
 * Retournées par fetchCampaignPerformance().
 */
export interface CampaignPerformanceMetrics {
  campaignId: string;
  campaignName: string;
  status: string;
  /** Dépenses totales en euros */
  spendEur: number;
  /** Nombre total de clics */
  clicks: number;
  /** Nombre total d'impressions */
  impressions: number;
  /** CTR en % (clicks / impressions × 100) */
  ctrPct: number;
  /** Coût par clic moyen en euros */
  cpcEur: number;
  /** CPM (coût pour 1 000 impressions) en euros */
  cpmEur: number;
  /** Portée unique (personnes atteintes) */
  reach: number;
  /** Période des données */
  dateRange: { start: string; end: string };
}

// ── graphPost — POST vers l'API Graph Meta ────────────────────────────────────

/**
 * graphPost — effectue un appel POST vers l'API Marketing de Meta.
 * Utilisé pour créer des campagnes, ad sets et ads (Draft ou Active).
 *
 * @param path   Endpoint relatif (ex: "act_123/campaigns")
 * @param token  System User Token Meta
 * @param body   Payload POST en JSON
 */
async function graphPost<T>(
  path: string,
  token: string,
  body: Record<string, unknown>,
): Promise<T> {
  const url = `${META_GRAPH_BASE}/${path}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  // Construction du FormData pour l'API Graph Meta (accepte JSON ou form-data)
  const formData = new URLSearchParams();
  formData.append('access_token', token);
  for (const [k, v] of Object.entries(body)) {
    formData.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : String(err);
    throw new MetaApiError(
      msg.includes('abort') ? 'Timeout réseau Meta API (10s)' : `Erreur réseau POST : ${msg}`,
      0,
    );
  }
  clearTimeout(timer);

  const json = await response.json() as (T & { error?: MetaGraphError });
  if (json.error) throw new MetaApiError(json.error.message, json.error.code, json.error.type);
  if (!response.ok) throw new MetaApiError(`HTTP ${response.status}`, response.status);
  return json;
}

// ── validateBudget — garde-fou budget Meta ────────────────────────────────────

/**
 * validateBudget — vérifie que le budget respecte les minimums Meta.
 *
 * Meta impose :
 *   - Minimum absolu : 100 centimes (1€) par jour par Ad Set
 *   - Les objectifs CPM (REACH, BRAND_AWARENESS) nécessitent souvent ≥ 500c/j
 *
 * @throws {Error} si le budget est insuffisant
 */
function validateBudget(dailyBudgetCents: number, objective: string): void {
  const MIN_BUDGET = 100; // 1€ en centimes
  const MIN_BUDGET_CPM = 500; // 5€ pour les objectifs à optimisation CPM

  if (dailyBudgetCents < MIN_BUDGET) {
    throw new MetaApiError(
      `Budget journalier insuffisant : ${dailyBudgetCents / 100}€. Minimum Meta : ${MIN_BUDGET / 100}€/jour.`,
      100,
      'invalid_request_error',
    );
  }

  if (['REACH', 'BRAND_AWARENESS'].includes(objective) && dailyBudgetCents < MIN_BUDGET_CPM) {
    throw new MetaApiError(
      `Pour l'objectif ${objective}, Meta recommande un minimum de ${MIN_BUDGET_CPM / 100}€/jour. Budget fourni : ${dailyBudgetCents / 100}€.`,
      100,
      'invalid_request_error',
    );
  }
}

// ── checkAccountStatus — vérifie que le compte pub est actif ─────────────────

/**
 * checkAccountStatus — interroge le compte publicitaire pour s'assurer qu'il
 * est actif (account_status = 1) avant toute création.
 *
 * Codes Meta account_status :
 *   1 = ACTIVE, 2 = DISABLED, 3 = UNSETTLED, 7 = PENDING_RISK_REVIEW
 *   8 = PENDING_SETTLEMENT, 9 = IN_GRACE_PERIOD, 100 = PENDING_CLOSURE
 */
async function checkAccountStatus(token: string, accountId: string): Promise<void> {
  const STATUS_LABELS: Record<number, string> = {
    2: 'désactivé (DISABLED)',
    3: 'règlement en attente (UNSETTLED)',
    7: 'en révision de risque (PENDING_RISK_REVIEW)',
    8: 'en attente de règlement (PENDING_SETTLEMENT)',
    9: 'en période de grâce (IN_GRACE_PERIOD)',
    100: 'en attente de clôture (PENDING_CLOSURE)',
    101: 'fermé (CLOSED)',
    201: 'indépendant (ANY)',
  };

  const account = await graphFetch<{ account_status: number; name: string; disable_reason?: number }>(
    accountId,
    token,
    { fields: 'account_status,name,disable_reason' },
  );

  if (account.account_status !== 1) {
    const label = STATUS_LABELS[account.account_status] ?? `code ${account.account_status}`;
    throw new MetaApiError(
      `Compte publicitaire "${account.name}" ${label}. Impossible de créer une campagne. Vérifiez votre Business Manager.`,
      200,
      'account_disabled',
    );
  }
}

// ── exportCampaignToMeta — création Draft Campaign + Ad Set ──────────────────

/**
 * exportCampaignToMeta — exporte une campagne Kompilot validée vers Meta Ads Manager.
 *
 * Flux de création :
 *   1. Vérification du statut du compte publicitaire
 *   2. Validation du budget (minimums Meta)
 *   3. POST /act_{id}/campaigns → création de la Campaign (status = PAUSED = draft)
 *   4. POST /act_{id}/adsets    → création de l'Ad Set avec ciblage et budget
 *   5. Retour des IDs + URL Ads Manager
 *
 * Les campagnes sont créées en statut PAUSED (brouillon) pour que l'utilisateur
 * puisse les vérifier dans le Gestionnaire de Publicités avant d'activer.
 *
 * @param token      System User Token Meta
 * @param accountId  ID du compte pub (ex: "act_123456")
 * @param campaign   Données de la campagne depuis le Calendar Kompilot
 */
export async function exportCampaignToMeta(
  token: string,
  accountId: string,
  campaign: CampaignExportData,
): Promise<CampaignExportResult> {
  try {
    // ── 1. Vérification du compte publicitaire ──────────────────────────────
    await checkAccountStatus(token, accountId);

    // ── 2. Validation du budget ─────────────────────────────────────────────
    validateBudget(campaign.dailyBudgetCents, campaign.objective);

    // ── 3. Création de la Campaign (PAUSED = draft) ─────────────────────────
    // La campagne est créée en mode PAUSED pour permettre à l'utilisateur
    // de la vérifier avant activation manuelle dans Meta Ads Manager.
    const campaignPayload: Record<string, unknown> = {
      name: campaign.campaignName,
      objective: campaign.objective,
      status: 'PAUSED',        // brouillon — l'utilisateur active manuellement
      special_ad_categories: '[]', // obligatoire même vide pour les campagnes standard
    };

    const campaignRes = await graphPost<{ id: string }>(
      `${accountId}/campaigns`,
      token,
      campaignPayload,
    );
    const campaignId = campaignRes.id;

    // ── 4. Création de l'Ad Set avec ciblage géo + démographique ───────────
    // L'Ad Set contient le budget, le calendrier, et le ciblage d'audience.
    const targeting: Record<string, unknown> = {
      geo_locations: { countries: [campaign.targetCountry] },
      age_min: campaign.ageMin ?? 18,
      age_max: campaign.ageMax ?? 65,
    };

    // Filtre genre : 0=tous (défaut), 1=homme, 2=femme
    if (campaign.genders && campaign.genders.length > 0 && !campaign.genders.includes(0)) {
      targeting.genders = campaign.genders;
    }

    const adSetPayload: Record<string, unknown> = {
      name: `${campaign.campaignName} — Ad Set`,
      campaign_id: campaignId,
      status: 'PAUSED',
      daily_budget: String(campaign.dailyBudgetCents),  // en centimes, format string requis par Meta
      billing_event: 'IMPRESSIONS',
      optimization_goal: campaign.objective === 'LINK_CLICKS' ? 'LINK_CLICKS' : 'REACH',
      targeting: JSON.stringify(targeting),
      start_time: new Date(campaign.startDate).toISOString(),
    };

    // Optionnel : date de fin (stop_time)
    if (campaign.endDate) {
      adSetPayload.end_time = new Date(campaign.endDate).toISOString();
    }

    const adSetRes = await graphPost<{ id: string }>(
      `${accountId}/adsets`,
      token,
      adSetPayload,
    );
    const adSetId = adSetRes.id;

    // ── 5. Construction URL Ads Manager ────────────────────────────────────
    // URL directe vers la campagne dans le Gestionnaire de Publicités
    const numericAccountId = accountId.replace('act_', '');
    const adsManagerUrl = `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${numericAccountId}&selected_campaign_ids=${campaignId}`;

    return {
      success: true,
      campaignId,
      adSetId,
      adsManagerUrl,
      status: 'PAUSED',
    };

  } catch (err) {
    if (err instanceof MetaApiError) {
      // Traduction des codes d'erreur Meta fréquents en messages lisibles
      let errorMsg = err.message;

      if (err.isTokenInvalid) {
        errorMsg = `Token Meta invalide ou expiré (code ${err.code}). Reconnectez votre compte Meta dans les Intégrations.`;
      } else if (err.code === 200 || err.type === 'account_disabled') {
        errorMsg = err.message; // déjà traduit par checkAccountStatus
      } else if (err.isPermissionError) {
        errorMsg = `Permissions insuffisantes (code ${err.code}). Votre token nécessite ads_management et business_management.`;
      } else if (err.isRateLimited) {
        errorMsg = `Limite d'appels API Meta atteinte. Réessayez dans quelques minutes.`;
      } else if (err.code === 100) {
        // Budget ou paramètre invalide
        errorMsg = `Paramètre invalide (code 100) : ${err.message}`;
      } else if (err.code === 2635) {
        errorMsg = `Budget journalier insuffisant. Meta requiert un minimum de 1€/jour.`;
      }

      return { success: false, error: errorMsg, metaErrorCode: err.code };
    }

    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// ── fetchCampaignPerformance — métriques temps réel ──────────────────────────

/**
 * fetchCampaignPerformance — récupère les métriques de performance de toutes
 * les campagnes actives d'un compte publicitaire Meta.
 *
 * Interroge l'endpoint /insights de Meta avec un niveau "campaign" pour
 * obtenir les KPIs par campagne : dépenses, clics, impressions, CTR.
 *
 * @param token      System User Token Meta
 * @param accountId  ID du compte pub (ex: "act_123456")
 * @param datePreset Période d'analyse
 */
export async function fetchCampaignPerformance(
  token: string,
  accountId: string,
  datePreset: 'last_7d' | 'last_30d' | 'this_month' = 'last_30d',
): Promise<CampaignPerformanceMetrics[]> {
  // ── Étape 1 : récupérer la liste des campagnes actives/pausées ─────────────
  // On inclut PAUSED car les drafts exportés depuis Kompilot restent en PAUSED
  // jusqu'à activation manuelle par l'utilisateur dans Meta Ads Manager.
  const campaigns = await getCampaigns(token, accountId, 'ALL');
  if (campaigns.length === 0) return [];

  // ── Étape 2 : interroger /insights au niveau compte, par campagne ──────────
  // L'endpoint account/insights avec level=campaign retourne les métriques
  // agrégées pour toutes les campagnes sur la période demandée.
  const insightsRes = await graphFetch<GraphResponse<MetaInsight>>(
    `${accountId}/insights`,
    token,
    {
      fields: 'campaign_id,campaign_name,impressions,clicks,spend,cpc,cpm,ctr,reach,date_start,date_stop',
      date_preset: datePreset,
      level: 'campaign',
      limit: '100',
    },
  );

  const insights = insightsRes.data ?? [];

  // ── Étape 3 : enrichir les insights avec le statut de chaque campagne ──────
  // On joint insights (métriques) + campaigns (statut) par campaign_id
  const campaignStatusMap = new Map(campaigns.map(c => [c.id, c.status]));

  return insights.map((ins): CampaignPerformanceMetrics => {
    const spendEur  = parseFloat(ins.spend  || '0');
    const clicks    = parseInt(ins.clicks   || '0', 10);
    const impressions = parseInt(ins.impressions || '0', 10);
    const cpcEur    = parseFloat(ins.cpc    || '0');
    const cpmEur    = parseFloat(ins.cpm    || '0');
    const reach     = parseInt(ins.reach    || '0', 10);
    // CTR calculé localement (Meta renvoie "0.123456" = 0.12%)
    const ctrPct    = impressions > 0 ? (clicks / impressions) * 100 : 0;

    return {
      campaignId:   ins.campaign_id   ?? '',
      campaignName: ins.campaign_name ?? 'Campagne inconnue',
      status:       campaignStatusMap.get(ins.campaign_id ?? '') ?? 'UNKNOWN',
      spendEur,
      clicks,
      impressions,
      ctrPct: Math.round(ctrPct * 100) / 100,  // 2 décimales
      cpcEur,
      cpmEur,
      reach,
      dateRange: { start: ins.date_start ?? '', end: ins.date_stop ?? '' },
    };
  });
}
