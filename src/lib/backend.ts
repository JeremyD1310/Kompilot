import { blink } from '../blink/client';

const configuredBackendUrl = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_BACKEND_URL?.trim() ?? '';
export const BACKEND_URL = configuredBackendUrl.replace(/\/$/, '');
export const BACKEND_HOST = BACKEND_URL ? new URL(BACKEND_URL).host : '';

export const BACKEND_URL_CONFIG_MISSING = 'BACKEND_URL_CONFIG_MISSING';

export function backendUrl(path: string): string {
  if (!BACKEND_URL) {
    throw new Error(`${BACKEND_URL_CONFIG_MISSING}: VITE_BACKEND_URL is required.`);
  }
  return `${BACKEND_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function isPublicRoute(path: string) {
  return path === '/health' || path.startsWith('/api/webhooks/');
}

export async function authHeaders(json = false): Promise<Record<string, string>> {
  const token = await blink.auth.getValidToken();
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${token}`,
  };
}

export async function backendFetch(path: string, init: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url = backendUrl(path);
    const response = await fetch(url, {
      ...init,
      signal: init.signal ?? controller.signal,
    });
    // Protected API callers handle HTTP 401 themselves. Do not turn it into a
    // noisy global network error during auth hydration or token refresh.
    if (response.status === 401 && !isPublicRoute(path)) return response;
    return response;
  } catch (error) {
    const message = error instanceof DOMException && error.name === 'AbortError'
      ? `La requête vers ${path} a dépassé ${timeoutMs} ms.`
      : error instanceof Error ? error.message : String(error);
    console.error('[backendFetch] Request failed', {
      url: BACKEND_URL ? `${BACKEND_URL}${path}` : path,
      method: init.method ?? 'GET',
      message,
      cause: error,
    });
    throw new Error(message);
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function readBackendError(response: Response, fallback: string): Promise<Error> {
  const body = await response.json().catch(() => ({}));
  return new Error(body?.error || body?.message || fallback);
}
