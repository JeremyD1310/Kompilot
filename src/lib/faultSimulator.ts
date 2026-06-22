/**
 * faultSimulator — Developer / QA tool for simulating specific service failures.
 *
 * Supports granular fault types across 3 service groups:
 *
 * ── Database (SQLite / Blink DB) ──────────────────────────────────────────────
 *   db_timeout          SQLITE_BUSY        Slow query / lock contention
 *   db_cantopen         SQLITE_CANTOPEN    File can't be opened
 *   db_corrupt          SQLITE_CORRUPT     Database file corruption
 *   db_constraint       SQLITE_CONSTRAINT  Unique / FK constraint violation
 *   db_full             SQLITE_FULL        Disk quota exceeded
 *   db_readonly         SQLITE_READONLY    Write attempt on read-only DB
 *
 * ── Authentication ────────────────────────────────────────────────────────────
 *   auth_server_down    503                Auth service unreachable
 *   auth_token_expired  JWT TokenExpiredError
 *   auth_token_invalid  JWT JsonWebTokenError   Malformed / tampered token
 *   auth_token_type     JWT TokenTypeError      Wrong token type (e.g. refresh used as access)
 *   auth_rate_limit     429                Too many auth attempts
 *   auth_user_disabled  403                Account suspended / banned
 *
 * ── External APIs ─────────────────────────────────────────────────────────────
 *   geo_api             Timeout 504        AI GEO providers unreachable
 *   whatsapp            503                WhatsApp Business API down
 *
 * Each fault is persisted to localStorage so it survives hot-reloads.
 * `safeApiCall` calls `interceptFaultOrPass(serviceLabel)` before executing
 * the real API function — if matched, it throws immediately.
 *
 * Usage:
 *   activateFault('db_constraint')   // enable
 *   deactivateFault('db_constraint') // disable
 *   isActiveFault('db_constraint')   // query
 *   getActiveFaults()                // all active ids
 *   clearAllFaults()                 // reset everything
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type FaultType =
  // Database
  | 'db_timeout'
  | 'db_cantopen'
  | 'db_corrupt'
  | 'db_constraint'
  | 'db_full'
  | 'db_readonly'
  // Authentication
  | 'auth_server_down'
  | 'auth_token_expired'
  | 'auth_token_invalid'
  | 'auth_token_type'
  | 'auth_rate_limit'
  | 'auth_user_disabled'
  // External APIs
  | 'geo_api'
  | 'whatsapp';

export interface FaultDefinition {
  id: FaultType;
  label: string;
  /** Internal service label matched against safeApiCall options.serviceLabel */
  service: string;
  emoji: string;
  description: string;
  /** Human-readable error thrown by the interceptor */
  errorMessage: string;
  /**
   * Machine-readable error code (SQLite code, HTTP status text, JWT error class).
   * Displayed as a monospace badge in the admin UI.
   */
  errorCode: string;
  httpStatus?: number;
  /** Tailwind color prefix used for UI card ring */
  color: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface FaultLog {
  id: string;
  faultId: FaultType;
  /** errorCode of the matched fault at interception time */
  errorCode: string;
  service: string;
  interceptedAt: string;
  callerCacheKey?: string;
}

// ── Fault registry ─────────────────────────────────────────────────────────────

export const FAULT_DEFINITIONS: FaultDefinition[] = [
  // ── Database faults ──────────────────────────────────────────────────────────
  {
    id: 'db_timeout',
    label: 'DB — Timeout (lock contention)',
    service: 'Blink DB',
    emoji: '🗄️',
    description: 'Simule une requête SQLite trop lente à cause d\'un verrou. Déclenche le fallback cache.',
    errorMessage: 'SQLITE_BUSY: database is locked — query timeout after 8000ms',
    errorCode: 'SQLITE_BUSY',
    httpStatus: 503,
    color: 'orange',
    severity: 'high',
  },
  {
    id: 'db_cantopen',
    label: 'DB — Fichier inaccessible',
    service: 'Blink DB',
    emoji: '💥',
    description: 'Simule une erreur d\'ouverture du fichier base de données. Aucune donnée disponible.',
    errorMessage: 'SQLITE_CANTOPEN: unable to open database file — no such file or directory',
    errorCode: 'SQLITE_CANTOPEN',
    httpStatus: 500,
    color: 'red',
    severity: 'critical',
  },
  {
    id: 'db_corrupt',
    label: 'DB — Corruption du fichier',
    service: 'Blink DB',
    emoji: '☠️',
    description: 'Simule un fichier SQLite corrompu. Toutes les lectures échouent avec un magic number invalide.',
    errorMessage: 'SQLITE_CORRUPT: database disk image is malformed — invalid magic number',
    errorCode: 'SQLITE_CORRUPT',
    httpStatus: 500,
    color: 'red',
    severity: 'critical',
  },
  {
    id: 'db_constraint',
    label: 'DB — Violation de contrainte',
    service: 'Blink DB',
    emoji: '🔒',
    description: 'Simule un échec d\'écriture par violation de contrainte UNIQUE ou FK. L\'insert/update est rejeté.',
    errorMessage: 'SQLITE_CONSTRAINT: UNIQUE constraint failed: scheduled_posts.id',
    errorCode: 'SQLITE_CONSTRAINT',
    httpStatus: 409,
    color: 'yellow',
    severity: 'medium',
  },
  {
    id: 'db_full',
    label: 'DB — Espace disque épuisé',
    service: 'Blink DB',
    emoji: '💾',
    description: 'Simule un quota disque dépassé. Les écritures échouent silencieusement.',
    errorMessage: 'SQLITE_FULL: database or disk is full — quota exceeded',
    errorCode: 'SQLITE_FULL',
    httpStatus: 507,
    color: 'orange',
    severity: 'high',
  },
  {
    id: 'db_readonly',
    label: 'DB — Base de données en lecture seule',
    service: 'Blink DB',
    emoji: '🚫',
    description: 'Simule une tentative d\'écriture sur une base read-only. Toutes les mutations sont bloquées.',
    errorMessage: 'SQLITE_READONLY: attempt to write a readonly database — write operations not permitted',
    errorCode: 'SQLITE_READONLY',
    httpStatus: 403,
    color: 'slate',
    severity: 'medium',
  },

  // ── Authentication faults ─────────────────────────────────────────────────────
  {
    id: 'auth_server_down',
    label: 'Auth — Serveur inaccessible (503)',
    service: 'Auth Server',
    emoji: '🔐',
    description: 'Simule une indisponibilité totale du serveur d\'authentification (503).',
    errorMessage: 'AuthServiceError: 503 Service Unavailable — auth.blink.new is unreachable, retry in 30s',
    errorCode: 'AUTH_SERVICE_UNAVAILABLE',
    httpStatus: 503,
    color: 'violet',
    severity: 'critical',
  },
  {
    id: 'auth_token_expired',
    label: 'Auth — Token JWT expiré',
    service: 'Auth Server',
    emoji: '⏱️',
    description: 'Simule un access token JWT arrivé à expiration. L\'utilisateur doit se reconnecter.',
    errorMessage: 'JsonWebTokenError[TokenExpiredError]: jwt expired — exp claim: 2026-06-01T00:00:00Z, now: 2026-06-02T00:00:00Z',
    errorCode: 'JWT_TOKEN_EXPIRED',
    httpStatus: 401,
    color: 'yellow',
    severity: 'medium',
  },
  {
    id: 'auth_token_invalid',
    label: 'Auth — Token JWT invalide / falsifié',
    service: 'Auth Server',
    emoji: '⚠️',
    description: 'Simule un token JWT dont la signature est invalide ou dont le payload a été altéré.',
    errorMessage: 'JsonWebTokenError: invalid signature — token payload tampered or signed with wrong secret',
    errorCode: 'JWT_INVALID_SIGNATURE',
    httpStatus: 401,
    color: 'red',
    severity: 'high',
  },
  {
    id: 'auth_token_type',
    label: 'Auth — Mauvais type de token',
    service: 'Auth Server',
    emoji: '🔄',
    description: 'Simule l\'utilisation d\'un refresh token à la place d\'un access token (ou vice-versa).',
    errorMessage: 'TokenTypeError: expected token_type=access but received token_type=refresh — use /token/refresh',
    errorCode: 'JWT_WRONG_TOKEN_TYPE',
    httpStatus: 401,
    color: 'yellow',
    severity: 'medium',
  },
  {
    id: 'auth_rate_limit',
    label: 'Auth — Limite de tentatives atteinte (429)',
    service: 'Auth Server',
    emoji: '🚦',
    description: 'Simule un blocage de compte après trop de tentatives de connexion.',
    errorMessage: 'RateLimitError: 429 Too Many Requests — login attempts exceeded (10/min), retry-after: 60s',
    errorCode: 'AUTH_RATE_LIMIT_EXCEEDED',
    httpStatus: 429,
    color: 'orange',
    severity: 'medium',
  },
  {
    id: 'auth_user_disabled',
    label: 'Auth — Compte suspendu (403)',
    service: 'Auth Server',
    emoji: '🔴',
    description: 'Simule un compte utilisateur suspendu ou banni par un administrateur.',
    errorMessage: 'AuthorizationError: 403 Forbidden — user account has been disabled by an administrator',
    errorCode: 'AUTH_USER_DISABLED',
    httpStatus: 403,
    color: 'red',
    severity: 'high',
  },

  // ── External API faults ───────────────────────────────────────────────────────
  {
    id: 'geo_api',
    label: 'ChatGPT / Gemini / Perplexity — Timeout',
    service: 'ChatGPT/Gemini/Perplexity GEO',
    emoji: '🤖',
    description: 'Simule un timeout des APIs IA GEO. L\'audit bascule en mode données locales.',
    errorMessage: 'TimeoutError: no response after 6000ms — all GEO AI providers unreachable (ChatGPT, Gemini, Perplexity)',
    errorCode: 'GEO_API_TIMEOUT',
    httpStatus: 504,
    color: 'blue',
    severity: 'medium',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp Business — Erreur 503',
    service: 'WhatsApp Business API',
    emoji: '💬',
    description: 'Simule une indisponibilité de l\'API WhatsApp. Les messages sont mis en file d\'attente.',
    errorMessage: 'WhatsAppBusinessAPIError: 503 Service Temporarily Unavailable — graph.facebook.com unreachable',
    errorCode: 'WHATSAPP_SERVICE_UNAVAILABLE',
    httpStatus: 503,
    color: 'green',
    severity: 'high',
  },
];

// ── Fault activation metadata ─────────────────────────────────────────────────

/**
 * Metadata recorded when a fault is activated.
 * Stored alongside the active fault set so the UI can display
 * "activated at <time> by <user>" on each fault card.
 */
export interface FaultActivation {
  id: FaultType;
  activatedAt: string;   // ISO timestamp
  activatedBy: string;   // Display name or email of activating admin
  userId: string;        // Admin user ID (from blink.auth.me() or localStorage)
  /** How many times this fault has been intercepted since activation */
  interceptCount: number;
  /** ISO timestamp of the last interception — updated live */
  lastInterceptAt?: string;
}

// ── Persistence ────────────────────────────────────────────────────────────────

const ACTIVE_KEY       = 'kompilot_active_faults';
const ACTIVATIONS_KEY  = 'kompilot_fault_activations';
const LOG_KEY          = 'kompilot_fault_log';
const MAX_LOG          = 100;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Try to resolve the current admin user label from localStorage auth cache */
function resolveCurrentUser(): { userId: string; displayName: string } {
  try {
    // Blink SDK stores user info under various keys; we try the most common one first
    const raw = localStorage.getItem('blink_user') ?? localStorage.getItem('kompilot_admin_user');
    if (raw) {
      const parsed = JSON.parse(raw) as { id?: string; email?: string; displayName?: string; display_name?: string };
      return {
        userId: parsed.id ?? 'unknown',
        displayName: parsed.displayName ?? parsed.display_name ?? parsed.email ?? 'Admin',
      };
    }
  } catch { /* noop */ }
  return { userId: 'admin', displayName: 'Admin' };
}

// ── Activations store ─────────────────────────────────────────────────────────

function readActivations(): Map<FaultType, FaultActivation> {
  try {
    const raw = localStorage.getItem(ACTIVATIONS_KEY);
    if (!raw) return new Map();
    const arr = JSON.parse(raw) as FaultActivation[];
    return new Map(arr.map(a => [a.id, a]));
  } catch { return new Map(); }
}

function writeActivations(map: Map<FaultType, FaultActivation>): void {
  try {
    localStorage.setItem(ACTIVATIONS_KEY, JSON.stringify([...map.values()]));
  } catch { /* noop */ }
}

function readActiveFaults(): Set<FaultType> {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    return new Set(raw ? JSON.parse(raw) as FaultType[] : []);
  } catch { return new Set(); }
}

function writeActiveFaults(set: Set<FaultType>): void {
  try {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify([...set]));
  } catch { /* noop */ }
}

// ── Public API — fault control ─────────────────────────────────────────────────

export function activateFault(id: FaultType): void {
  const active = readActiveFaults();
  active.add(id);
  writeActiveFaults(active);

  // Record activation metadata
  const activations = readActivations();
  const { userId, displayName } = resolveCurrentUser();
  activations.set(id, {
    id,
    activatedAt: new Date().toISOString(),
    activatedBy: displayName,
    userId,
    interceptCount: 0,
  });
  writeActivations(activations);
}

export function deactivateFault(id: FaultType): void {
  const active = readActiveFaults();
  active.delete(id);
  writeActiveFaults(active);

  // Remove activation record
  const activations = readActivations();
  activations.delete(id);
  writeActivations(activations);
}

export function toggleFault(id: FaultType): boolean {
  if (readActiveFaults().has(id)) {
    deactivateFault(id);
    return false;
  } else {
    activateFault(id);
    return true;
  }
}

export function isActiveFault(id: FaultType): boolean {
  return readActiveFaults().has(id);
}

export function getActiveFaults(): FaultType[] {
  return [...readActiveFaults()];
}

/** Returns activation metadata for a specific fault, or undefined if not active */
export function getFaultActivation(id: FaultType): FaultActivation | undefined {
  return readActivations().get(id);
}

/** Returns all activation records for currently active faults */
export function getAllActivations(): FaultActivation[] {
  return [...readActivations().values()];
}

export function clearAllFaults(): void {
  try {
    localStorage.removeItem(ACTIVE_KEY);
    localStorage.removeItem(ACTIVATIONS_KEY);
  } catch { /* noop */ }
}

// ── Fault log ──────────────────────────────────────────────────────────────────

export function appendFaultLog(entry: Omit<FaultLog, 'id'>): void {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    const logs: FaultLog[] = raw ? JSON.parse(raw) : [];
    logs.unshift({ ...entry, id: `fl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}` });
    if (logs.length > MAX_LOG) logs.splice(MAX_LOG);
    localStorage.setItem(LOG_KEY, JSON.stringify(logs));
  } catch { /* noop */ }
}

export function getFaultLog(): FaultLog[] {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function clearFaultLog(): void {
  try { localStorage.removeItem(LOG_KEY); } catch { /* noop */ }
}

// ── Interceptor — called by safeApiCall ────────────────────────────────────────

/**
 * Checks if any active fault matches the given service label.
 * If matched, logs the interception (with errorCode) and throws the configured error.
 * Called BEFORE the real API function is invoked in safeApiCall.
 */
export function interceptFaultOrPass(serviceLabel: string, cacheKey?: string): void {
  const active = readActiveFaults();
  if (active.size === 0) return;

  for (const faultId of active) {
    const def = FAULT_DEFINITIONS.find(d => d.id === faultId);
    if (!def) continue;

    // Match by service label substring (case-insensitive)
    const sl = serviceLabel.toLowerCase();
    const fs = def.service.toLowerCase();
    const matches = sl.includes(fs) || fs.includes(sl);

    // Broad pattern rules for DB and Auth groups
    const isDbFault = faultId.startsWith('db_');
    const isDbLabel = /\bdb\b|database|blink db/i.test(serviceLabel);
    const isAuthFault = faultId.startsWith('auth_');
    const isAuthLabel = /auth|login|token|jwt/i.test(serviceLabel);

    if (matches || (isDbFault && isDbLabel) || (isAuthFault && isAuthLabel)) {
      const now = new Date().toISOString();

      appendFaultLog({
        faultId,
        errorCode: def.errorCode,
        service: serviceLabel,
        interceptedAt: now,
        callerCacheKey: cacheKey,
      });

      // Update activation record: increment counter + record last intercept time
      try {
        const activations = readActivations();
        const record = activations.get(faultId);
        if (record) {
          record.interceptCount = (record.interceptCount ?? 0) + 1;
          record.lastInterceptAt = now;
          writeActivations(activations);
        }
      } catch { /* noop */ }

      const err = new Error(`[FaultSimulator:${faultId}] [${def.errorCode}] ${def.errorMessage}`);
      (err as Error & { faultId: string; errorCode: string; httpStatus?: number }).faultId = faultId;
      (err as Error & { faultId: string; errorCode: string; httpStatus?: number }).errorCode = def.errorCode;
      (err as Error & { faultId: string; errorCode: string; httpStatus?: number }).httpStatus = def.httpStatus;
      throw err;
    }
  }
}
