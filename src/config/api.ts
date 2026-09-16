/**
 * api.ts — Centralized API configuration
 *
 * Single source of truth for the backend base URL.
 * Used by all frontend service calls to avoid hardcoded URLs.
 */

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  'https://gbrhsehk.backend.blink.new';

/** Default request timeout in milliseconds */
const DEFAULT_TIMEOUT_MS = 10_000;

/** Build a full backend API URL */
export function apiUrl(path: string): string {
  return `${BACKEND_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

const PROTECTED_PATH_PREFIXES = [
  '/onboarding', '/dashboard', '/setup', '/calendrier', '/inbox', '/settings', '/profile',
  '/guide', '/subscription', '/billing', '/admin', '/referral', '/widget', '/library',
  '/analytics', '/account', '/emailing', '/social', '/establishments', '/posts-data',
  '/cockpit', '/growth', '/performance', '/reviews', '/seo-local', '/google-maps',
  '/local-ads', '/academy', '/live-chat', '/notifications', '/geo-authority', '/agence',
  '/lead-gen', '/semantic', '/qrcode', '/caisse', '/brand', '/creative-factory',
  '/ai-creative-studio', '/features-showcase', '/tunnels', '/aio', '/roas',
  '/email-marketing', '/website-scan', '/email-sequences', '/mon-equipe', '/engagement', '/espion',
];

/** Only authenticated application routes may query protected backend modules. */
export function isProtectedAppPath(path: string = typeof window === 'undefined' ? '' : window.location.pathname): boolean {
  return PROTECTED_PATH_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`));
}

export function canRequestProtectedApi({ authenticated, demo, path }: { authenticated: boolean; demo: boolean; path?: string }): boolean {
  return authenticated && !demo && (path === undefined || isProtectedAppPath(path));
}

/**
 * Authenticated fetch wrapper — attaches the user's JWT automatically.
 * - Throws on non-2xx responses with the backend error message.
 * - Enforces a 10 s timeout via AbortController (configurable via `timeoutMs`).
 * - Supports caller-provided AbortSignal for component-unmount cancellation.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit & { token: string; timeoutMs?: number; signal?: AbortSignal },
): Promise<T> {
  const { token, timeoutMs = DEFAULT_TIMEOUT_MS, signal: callerSignal, ...init } = options;

  // Merge caller signal with our timeout signal
  const timeoutController = new AbortController();
  const timer = setTimeout(() => timeoutController.abort(), timeoutMs);

  // If the caller passed its own signal, abort our fetch when it fires too
  callerSignal?.addEventListener('abort', () => timeoutController.abort());

  try {
    const response = await fetch(apiUrl(path), {
      ...init,
      signal: timeoutController.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
    });

    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      try {
        const body = await response.json() as { error?: string };
        if (body.error) message = body.error;
      } catch { /* noop */ }
      throw new Error(message);
    }

    return response.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}
