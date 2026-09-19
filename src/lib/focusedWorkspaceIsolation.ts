import { isDemoDomain } from './demoDomain';
import { BACKEND_HOST } from './backend';

const FOCUSED_PATHS = ['/marketing-attribution', '/repurposing'];
const FOCUSED_API_PREFIXES = ['/api/marketing-attribution/', '/api/content-repurposing/'];
const BLOCKED_THIRD_PARTY_HOSTS = ['firebase', 'crisp.chat', 'googletagmanager', 'hotjar', 'plausible'];

export function isFocusedWorkspacePath(path = window.location.pathname) {
  return FOCUSED_PATHS.includes(path);
}

function emptyResponse() {
  return new Response('', { status: 204, headers: { 'X-Kompilot-Isolated': '1' } });
}

function shouldBlockFocusedRequest(url: string) {
  if (!isFocusedWorkspacePath() || isDemoDomain()) return false;
  if (BLOCKED_THIRD_PARTY_HOSTS.some(host => url.includes(host))) return true;

  try {
    const parsed = new URL(url, window.location.origin);
    if (BACKEND_HOST && parsed.hostname === BACKEND_HOST) {
      return !FOCUSED_API_PREFIXES.some(prefix => parsed.pathname.startsWith(prefix));
    }
    // Prevent unrelated same-origin API clients from starting protected reads.
    return parsed.origin === window.location.origin && parsed.pathname.startsWith('/api/');
  } catch {
    return false;
  }
}

export function stopFocusedWorkspaceBackgroundRequests() {
  if (isDemoDomain() || !isFocusedWorkspacePath()) return;
  const browserWindow = window as Window & { __kompilotFocusedFetchPatched__?: boolean };
  if (!browserWindow.__kompilotFocusedFetchPatched__) {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (shouldBlockFocusedRequest(url)) return emptyResponse();
      return originalFetch(input, init);
    };
    browserWindow.__kompilotFocusedFetchPatched__ = true;
  }

  if ('serviceWorker' in navigator) {
    void navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        void registration.unregister();
      });
    });
  }
}
