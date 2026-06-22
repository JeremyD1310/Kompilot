/**
 * errorLogger.ts
 * Système de logs d'erreurs centralisé — Sentry-ready.
 *
 * Architecture :
 *   - En prod  : envoie vers Sentry (si VITE_SENTRY_DSN est configuré)
 *     ou stocke dans localStorage pour analyse manuelle.
 *   - En dev   : console.error uniquement.
 *   - Toujours : capture contexte (user, url, timestamp, stack).
 *
 * Pour connecter Sentry :
 *   1. bun add @sentry/react
 *   2. Ajouter VITE_SENTRY_DSN=https://xxxx@sentry.io/yyyy dans .env.local
 *   3. Décommenter le bloc Sentry ci-dessous.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

interface ErrorContext {
  userId?: string;
  route?: string;
  component?: string;
  extra?: Record<string, unknown>;
}

interface LoggedError {
  id: string;
  message: string;
  stack?: string;
  context: ErrorContext;
  url: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
}

// ── In-memory buffer (ringbuffer of last 50 errors) ──────────────────────────

const MAX_BUFFER = 50;
let _buffer: LoggedError[] = [];

function push(entry: LoggedError) {
  _buffer = [entry, ..._buffer].slice(0, MAX_BUFFER);
  // Persist to sessionStorage for manual inspection / support
  try {
    sessionStorage.setItem('kompilot_error_log', JSON.stringify(_buffer));
  } catch {
    // sessionStorage might be full — ignore
  }
}

// ── Sentry integration (opt-in) ───────────────────────────────────────────────
// Uncomment when VITE_SENTRY_DSN is configured.
//
// import * as Sentry from '@sentry/react';
// let _sentryInitialized = false;
//
// function initSentry() {
//   if (_sentryInitialized) return;
//   const dsn = import.meta.env.VITE_SENTRY_DSN;
//   if (!dsn) return;
//   Sentry.init({
//     dsn,
//     environment: import.meta.env.MODE,
//     tracesSampleRate: 0.15,
//     replaysSessionSampleRate: 0,
//     replaysOnErrorSampleRate: 0.05,
//     integrations: [Sentry.browserTracingIntegration()],
//   });
//   _sentryInitialized = true;
// }

// ── Public API ────────────────────────────────────────────────────────────────

const isDev = import.meta.env.DEV;

/**
 * Capture une erreur et l'envoie au système de monitoring.
 */
export function captureError(
  error: unknown,
  context: ErrorContext = {}
): void {
  const err = error instanceof Error ? error : new Error(String(error));
  const entry: LoggedError = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    message: err.message,
    stack: err.stack,
    context: {
      route: window.location.pathname,
      ...context,
    },
    url: window.location.href,
    timestamp: new Date().toISOString(),
    level: 'error',
  };

  push(entry);

  if (isDev) {
    console.error('[ErrorLogger]', entry.message, '\nContext:', context, '\n', err);
    return;
  }

  // ── Sentry (when configured) ──────────────────────────────────────────────
  // initSentry();
  // Sentry.withScope(scope => {
  //   if (context.userId) scope.setUser({ id: context.userId });
  //   if (context.component) scope.setTag('component', context.component);
  //   if (context.extra) scope.setExtras(context.extra as Parameters<typeof scope.setExtras>[0]);
  //   Sentry.captureException(err);
  // });

  // ── Fallback: silent in prod (prevents console spam) ─────────────────────
  // Remove this if Sentry is active
}

/**
 * Log un avertissement (non-bloquant).
 */
export function captureWarning(message: string, context: ErrorContext = {}): void {
  const entry: LoggedError = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    message,
    context: { route: window.location.pathname, ...context },
    url: window.location.href,
    timestamp: new Date().toISOString(),
    level: 'warning',
  };
  push(entry);
  if (isDev) console.warn('[ErrorLogger]', message, context);
}

/**
 * Retourne le buffer d'erreurs (pour le panneau admin / support).
 */
export function getErrorBuffer(): LoggedError[] {
  return [..._buffer];
}

/**
 * Vide le buffer.
 */
export function clearErrorBuffer(): void {
  _buffer = [];
  try { sessionStorage.removeItem('kompilot_error_log'); } catch { /* noop */ }
}

/**
 * Initialise un listener global pour capturer les erreurs non-gérées.
 * À appeler une seule fois dans main.tsx ou App.tsx.
 */
export function installGlobalErrorHandlers(userId?: string): void {
  window.addEventListener('error', (event) => {
    captureError(event.error ?? new Error(event.message), {
      userId,
      component: 'window.onerror',
      extra: { filename: event.filename, lineno: event.lineno, colno: event.colno },
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    captureError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      { userId, component: 'unhandledrejection' }
    );
  });
}
