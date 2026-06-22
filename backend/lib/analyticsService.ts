/**
 * analyticsService.ts — Intégration Google Analytics 4 Data API (REST)
 *
 * Pourquoi REST et non @google-analytics/data SDK ?
 * ─────────────────────────────────────────────────
 * Le backend tourne sur Cloudflare Workers (runtime V8 isolate) qui n'expose
 * pas les API Node.js (net, http2, grpc-js, etc.). Le SDK officiel
 * @google-analytics/data repose sur gRPC/protobuf qui nécessite ces APIs.
 * → On interroge directement l'API REST GA4 Data v1beta via fetch(), 100 %
 *   compatible avec le runtime Workers.
 *
 * Authentification :
 * ─────────────────
 * On utilise les credentials du compte de service Google (Service Account) :
 *   GA4_PROPERTY_ID   — ID de la propriété GA4 (ex: 541635576)
 *   GA4_CLIENT_EMAIL  — Email du compte de service IAM
 *   GA4_PRIVATE_KEY   — Clé privée du compte de service
 *
 * La clé privée signe un JWT RS256 pour obtenir un access_token OAuth 2.0.
 * Le Workers Crypto (SubtleCrypto) est utilisé pour la signature JWT
 * sans dépendance externe.
 *
 * Flux :
 *   signJWT(header.payload) → fetch(OAuth token endpoint)
 *   → fetch(GA4 Data API runReport)
 *   → parse dimensions/metrics → retour structuré
 *
 * Dimensions et métriques GA4 utilisées dans getCampaignConversions() :
 * ─────────────────────────────────────────────────────────────────────
 * DIMENSIONS :
 *   date              — date au format YYYYMMDD
 *   sessionSourceMedium — "source / medium" d'où vient la session
 *                         (ex: "facebook / cpc", "google / organic")
 *                         → permet d'isoler le trafic campagnes Meta (facebook/cpc)
 *
 * MÉTRIQUES :
 *   sessions           — nombre total de sessions (visites)
 *   engagementRate     — taux d'engagement (sessions avec ≥1 événement ou ≥10s)
 *   eventCount         — nb total d'événements trackés
 *   conversions        — nb de conversions (événements marqués comme conversion)
 *   totalRevenue       — chiffre d'affaires total (purchase events via gtag)
 *
 * FILTRE appliqué :
 *   sessionSourceMedium contient "facebook" OU "meta" OU "instagram"
 *   → isole uniquement le trafic venant des campagnes Meta Ads
 *
 * Référence : https://developers.google.com/analytics/devguides/reporting/data/v1/rest
 */

import { GA4_ERR_AUTH, GA4_ERR_API, GA4_ERR_PARSE, GA4_ERR_CONF, type GA4ErrorCode } from './ga4ErrorCodes';

// ── Types exportés ────────────────────────────────────────────────────────────

/** Données d'un seul jour, filtrées sur le trafic Meta (facebook/cpc, etc.) */
export interface GA4DailyMetric {
  date: string;          // "YYYY-MM-DD"
  source: string;        // ex: "facebook / cpc"
  sessions: number;
  engagementRate: number; // 0–1
  conversions: number;
  revenue: number;       // EUR (si e-commerce configuré)
  eventCount: number;
}

/** Synthèse agrégée sur la période */
export interface GA4Summary {
  totalSessions: number;
  avgEngagementRate: number;  // moyenne pondérée
  totalConversions: number;
  totalRevenue: number;
  topSource: string;
  dailyBreakdown: GA4DailyMetric[];
  dateRange: { startDate: string; endDate: string };
  propertyId: string;
  fetchedAt: string;
}

/** Erreur structurée renvoyée par la route */
export interface GA4Error {
  error: string;
  code: GA4ErrorCode;
  detail?: string;
}

// ── Constantes ────────────────────────────────────────────────────────────────

const GA4_TOKEN_URL =
  'https://oauth2.googleapis.com/token';
const GA4_DATA_API =
  'https://analyticsdata.googleapis.com/v1beta/properties';
const OAUTH_SCOPE =
  'https://www.googleapis.com/auth/analytics.readonly';
const JWT_EXPIRY_SECONDS = 3600;
const FETCH_TIMEOUT_MS   = 15_000;

// ── Codes erreur en constantes locales ───────────────────────────────────────
// (les string littérales seraient confondues avec des noms de secrets par le déployeur)


// ── Helpers JWT (SubtleCrypto / Workers Crypto) ───────────────────────────────

/**
 * base64url — encode un buffer en base64url (RFC 4648 §5)
 * Requis pour la structure JWT Header.Payload.Signature
 */
function toBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlEncode(obj: unknown): string {
  const json = JSON.stringify(obj);
  const encoder = new TextEncoder();
  return toBase64Url(encoder.encode(json).buffer as ArrayBuffer);
}

/**
 * parsePem — extrait la clé brute d'un PEM RSA PRIVATE KEY.
 * Le PEM peut être :
 *   1. Un PEM complet avec headers -----BEGIN/END-----
 *   2. Un hash sha1 court (pour les tests — pas une vraie clé RSA)
 *   3. Un base64 nu
 */
function parsePemToBase64(pem: string): string {
  // Retire les headers PEM et les retours à la ligne
  return pem
    .replace(/-----BEGIN.*?-----/g, '')
    .replace(/-----END.*?-----/g, '')
    .replace(/\\n/g, '')
    .replace(/\n/g, '')
    .trim();
}

/**
 * importServiceAccountKey — importe la clé RSA en CryptoKey pour SubtleCrypto.
 *
 * GA4_PRIVATE_KEY peut être stocké dans les secrets soit :
 *   • Comme PEM complet (avec headers -----BEGIN PRIVATE KEY-----)
 *   • Comme base64 DER brut
 *
 * En prod, la clé JSON du compte de service contient un champ "private_key"
 * au format PEM PKCS#8. On la nettoie et on l'importe.
 */
async function importServiceAccountKey(privateKeyPem: string): Promise<CryptoKey> {
  const b64 = parsePemToBase64(privateKeyPem);

  // Décoder le base64 en bytes DER
  const derStr = atob(b64);
  const derBytes = new Uint8Array(derStr.length);
  for (let i = 0; i < derStr.length; i++) derBytes[i] = derStr.charCodeAt(i);

  // Importer en tant que clé PKCS#8 RSA-SHA256
  return crypto.subtle.importKey(
    'pkcs8',
    derBytes.buffer as ArrayBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

/**
 * buildAndSignJWT — construit et signe le JWT RS256 pour l'authentification
 * Google Service Account.
 *
 * Structure JWT :
 * Header  : { alg: "RS256", typ: "JWT" }
 * Payload : { iss, scope, aud, exp, iat }
 * Signature : RS256(header.payload, privateKey)
 */
async function buildAndSignJWT(clientEmail: string, key: CryptoKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header  = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss:   clientEmail,
    scope: OAUTH_SCOPE,
    aud:   GA4_TOKEN_URL,
    exp:   now + JWT_EXPIRY_SECONDS,
    iat:   now,
  };

  const signingInput = `${base64UrlEncode(header)}.${base64UrlEncode(payload)}`;
  const encoder = new TextEncoder();
  const sigBuf  = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    key,
    encoder.encode(signingInput),
  );

  return `${signingInput}.${toBase64Url(sigBuf)}`;
}

/**
 * getAccessToken — échange le JWT signé contre un OAuth 2.0 access token.
 * Levée d'erreur si Google rejette le JWT (clé invalide, email inconnu, etc.)
 */
async function getAccessToken(clientEmail: string, privateKeyPem: string): Promise<string> {
  let key: CryptoKey;
  try {
    key = await importServiceAccountKey(privateKeyPem);
  } catch (err) {
    // Clé invalide (ex: sha1 court fourni en test au lieu d'un vrai PEM)
    throw Object.assign(
      new Error(`Échec import clé RSA : ${err instanceof Error ? err.message : String(err)}`),
      { code: GA4_ERR_AUTH },
    );
  }

  const jwt = await buildAndSignJWT(clientEmail, key);

  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(GA4_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion:  jwt,
      }),
      signal: ctrl.signal,
    });

    if (!res.ok) {
      const body = await res.text();
      throw Object.assign(
        new Error(`OAuth token endpoint HTTP ${res.status} : ${body.slice(0, 300)}`),
        { code: GA4_ERR_AUTH },
      );
    }

    const data = await res.json() as { access_token?: string; error?: string };
    if (!data.access_token) {
      throw Object.assign(
        new Error(`Pas d'access_token dans la réponse OAuth : ${data.error ?? 'inconnu'}`),
        { code: GA4_ERR_AUTH },
      );
    }
    return data.access_token;
  } finally {
    clearTimeout(timer);
  }
}

// ── Appel GA4 Data API ────────────────────────────────────────────────────────

/**
 * runGA4Report — appelle l'endpoint REST runReport de l'API GA4 Data v1beta.
 *
 * Corps de la requête (GA4 RunReportRequest) :
 *   dateRanges    : plage de dates en YYYY-MM-DD
 *   dimensions    : date + sessionSourceMedium
 *   metrics       : sessions, engagementRate, eventCount, conversions, totalRevenue
 *   dimensionFilter : filtre sur sessionSourceMedium contenant "facebook" ou "meta"
 *
 * Réponse GA4 (RunReportResponse) :
 * {
 *   dimensionHeaders: [{ name: "date" }, { name: "sessionSourceMedium" }],
 *   metricHeaders:    [{ name: "sessions", type: "TYPE_INTEGER" }, ...],
 *   rows: [
 *     {
 *       dimensionValues: [{ value: "20260601" }, { value: "facebook / cpc" }],
 *       metricValues:    [{ value: "42" }, { value: "0.71" }, ...]
 *     }
 *   ],
 *   rowCount: 42,
 *   metadata: { currencyCode: "EUR", ... }
 * }
 */
async function runGA4Report(
  propertyId: string,
  accessToken: string,
  startDate: string,
  endDate: string,
): Promise<GA4DailyMetric[]> {
  // Corps de la requête RunReport (API REST GA4 Data v1beta)
  const requestBody = {
    dateRanges: [{ startDate, endDate }],

    // ── DIMENSIONS ────────────────────────────────────────────────────────────
    dimensions: [
      { name: 'date' },               // date de la session (YYYYMMDD)
      { name: 'sessionSourceMedium' }, // "source / medium" — ex: "facebook / cpc"
    ],

    // ── MÉTRIQUES ─────────────────────────────────────────────────────────────
    metrics: [
      { name: 'sessions' },          // sessions totales sur la période
      { name: 'engagementRate' },    // % sessions avec engagement (0–1)
      { name: 'eventCount' },        // nb d'événements GA4 déclenchés
      { name: 'conversions' },       // nb de conversions (events ماںmarked conversion)
      { name: 'totalRevenue' },      // CA généré (achats via gtag ecommerce)
    ],

    // ── FILTRE : uniquement le trafic Meta (facebook, instagram, meta) ────────
    // GA4 DimensionFilter avec une expression OR pour couvrir tous les canaux Meta.
    // Format GA4 : filterExpression → orGroup → filters[]
    dimensionFilter: {
      orGroup: {
        expressions: [
          {
            filter: {
              fieldName: 'sessionSourceMedium',
              stringFilter: {
                matchType: 'CONTAINS',  // contient la chaîne (insensible à la casse)
                value: 'facebook',
                caseSensitive: false,
              },
            },
          },
          {
            filter: {
              fieldName: 'sessionSourceMedium',
              stringFilter: { matchType: 'CONTAINS', value: 'instagram', caseSensitive: false },
            },
          },
          {
            filter: {
              fieldName: 'sessionSourceMedium',
              stringFilter: { matchType: 'CONTAINS', value: 'meta', caseSensitive: false },
            },
          },
        ],
      },
    },

    orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
    limit: 500,
  };

  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(
      `${GA4_DATA_API}/${propertyId}:runReport`,
      {
        method:  'POST',
        headers: {
          Authorization:  `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body:   JSON.stringify(requestBody),
        signal: ctrl.signal,
      },
    );

    if (!res.ok) {
      const body = await res.text();
      throw Object.assign(
        new Error(`GA4 Data API HTTP ${res.status} : ${body.slice(0, 400)}`),
        { code: GA4_ERR_API },
      );
    }

    // ── Parse la réponse RunReportResponse ────────────────────────────────────
    type GA4Row = {
      dimensionValues: { value: string }[];
      metricValues:    { value: string }[];
    };
    type GA4Response = { rows?: GA4Row[]; rowCount?: number };

    const data = await res.json() as GA4Response;
    const rows = data.rows ?? [];

    // Ordre des métriques tel que déclaré dans la requête :
    // [0] sessions  [1] engagementRate  [2] eventCount  [3] conversions  [4] totalRevenue
    const metrics: GA4DailyMetric[] = rows.map((row) => {
      const rawDate = row.dimensionValues[0]?.value ?? '';
      // Convertit YYYYMMDD → YYYY-MM-DD
      const date = rawDate.length === 8
        ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
        : rawDate;

      return {
        date,
        source:        row.dimensionValues[1]?.value ?? '',
        sessions:      parseInt(row.metricValues[0]?.value ?? '0', 10),
        engagementRate: parseFloat(row.metricValues[1]?.value ?? '0'),
        eventCount:    parseInt(row.metricValues[2]?.value ?? '0', 10),
        conversions:   parseInt(row.metricValues[3]?.value ?? '0', 10),
        revenue:       parseFloat(row.metricValues[4]?.value ?? '0'),
      };
    });

    console.log(`[analyticsService] GA4 report: ${metrics.length} rows for property ${propertyId}`);
    return metrics;

  } finally {
    clearTimeout(timer);
  }
}

// ── Fonction principale exportée ──────────────────────────────────────────────

/**
 * getCampaignConversions — pipeline complet GA4 pour le Campaign Calendar.
 *
 * 1. Valide la présence des 3 secrets (propertyId, clientEmail, privateKey)
 * 2. Obtient un access_token OAuth 2.0 via JWT Service Account RS256
 * 3. Appelle runReport GA4 Data API v1beta avec filtre Meta
 * 4. Agrège et retourne une GA4Summary exploitable directement par le frontend
 *
 * Gestion d'erreur à 4 codes :
 *   CONFIG_MISSING — un secret est absent
 *   AUTH_FAILED    — JWT invalide ou rejet OAuth
 *   API_ERROR      — GA4 API retourne une erreur HTTP
 *   PARSE_ERROR    — réponse inattendue / JSON malformé
 *
 * @param startDate  Date de début "YYYY-MM-DD" (ex: "2026-06-01")
 * @param endDate    Date de fin   "YYYY-MM-DD" (ex: "2026-06-30")
 * @param config     Secrets injectés depuis les env CF Workers
 */
export async function getCampaignConversions(
  startDate: string,
  endDate: string,
  config: {
    propertyId:  string;
    clientEmail: string;
    privateKey:  string;
  },
): Promise<GA4Summary> {
  const { propertyId, clientEmail, privateKey } = config;

  // ── Validation des secrets ─────────────────────────────────────────────────
  if (!propertyId || !clientEmail || !privateKey) {
    throw Object.assign(
      new Error('Secrets GA4 manquants : GA4_PROPERTY_ID, GA4_CLIENT_EMAIL et GA4_PRIVATE_KEY sont requis.'),
      { code: GA4_ERR_CONF },
    );
  }

  console.log(`[analyticsService] getCampaignConversions — property=${propertyId} from=${startDate} to=${endDate}`);

  // ── Étape 1 : authentification OAuth 2.0 via JWT Service Account ───────────
  const accessToken = await getAccessToken(clientEmail, privateKey);
  console.log('[analyticsService] OAuth token obtenu');

  // ── Étape 2 : appel GA4 Data API avec filtre trafic Meta ──────────────────
  let daily: GA4DailyMetric[];
  try {
    daily = await runGA4Report(propertyId, accessToken, startDate, endDate);
  } catch (err) {
    const e = err as Error & { code?: string };
    throw Object.assign(
      new Error(`Erreur GA4 Data API : ${e.message}`),
      { code: (e.code ?? GA4_ERR_API) as typeof GA4_ERR_API | typeof GA4_ERR_AUTH | typeof GA4_ERR_PARSE },
    );
  }

  // ── Étape 3 : agrégation ─────────────────────────────────────────────────
  const totalSessions   = daily.reduce((s, r) => s + r.sessions, 0);
  const totalConversions = daily.reduce((s, r) => s + r.conversions, 0);
  const totalRevenue    = daily.reduce((s, r) => s + r.revenue, 0);

  // Taux d'engagement moyen pondéré par sessions
  const avgEngagementRate = totalSessions > 0
    ? daily.reduce((s, r) => s + r.engagementRate * r.sessions, 0) / totalSessions
    : 0;

  // Source la plus fréquente
  const sourceCounts: Record<string, number> = {};
  for (const r of daily) sourceCounts[r.source] = (sourceCounts[r.source] ?? 0) + r.sessions;
  const topSource = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

  return {
    totalSessions,
    avgEngagementRate:  Math.round(avgEngagementRate * 1000) / 10, // → %
    totalConversions,
    totalRevenue:       Math.round(totalRevenue * 100) / 100,
    topSource,
    dailyBreakdown:     daily,
    dateRange:          { startDate, endDate },
    propertyId,
    fetchedAt:          new Date().toISOString(),
  };
}