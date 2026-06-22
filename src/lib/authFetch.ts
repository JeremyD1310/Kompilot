/**
 * authFetch — Intercepteur global pour toutes les requêtes API.
 *
 * Comportement :
 * - Sur 401 : tente un silent token refresh via blink.auth.getValidToken()
 *   et rejoue la requête une seule fois.
 * - Si le refresh échoue → émet un événement 'kompilot:auth-expired' que
 *   l'app peut écouter pour afficher un toast ou rediriger.
 * - Ne throw JAMAIS directement — renvoie la Response originale ou refreshée
 *   pour ne pas crasher les composants consommateurs.
 *
 * Usage : remplace fetch() par authFetch() dans les appels API backend.
 * Les appels blink.db.* et blink.ai.* gèrent déjà leur propre refresh
 * en interne — ne pas les envelopper ici.
 */

import { blink } from '../blink/client';

const AUTH_EXPIRED_EVENT = 'kompilot:auth-expired';

/** Émet un événement global discret pour signaler une session expirée. */
function emitAuthExpired(reason: string) {
  console.warn('[authFetch] session expirée:', reason);
  try {
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT, { detail: { reason } }));
  } catch { /* noop */ }
}

/**
 * Tente de rafraîchir le token silencieusement.
 * Retourne le nouveau token ou null si impossible.
 */
async function silentRefresh(): Promise<string | null> {
  try {
    const token = await blink.auth.getValidToken();
    return token ?? null;
  } catch {
    return null;
  }
}

/**
 * Version améliorée de fetch() avec :
 * - Interception des 401 + retry automatique après silent refresh
 * - Timeout configurable (default 15s)
 * - Ne throw jamais sur 401/403 — retourne la Response
 */
export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 15_000, ...fetchInit } = init;

  // Injecte automatiquement le token courant si disponible
  async function buildHeaders(base?: HeadersInit): Promise<Headers> {
    const headers = new Headers(base);
    if (!headers.has('Content-Type') && !(fetchInit.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    try {
      const token = await blink.auth.getValidToken();
      if (token) headers.set('Authorization', `Bearer ${token}`);
    } catch { /* pas de token disponible — requête anonyme */ }
    return headers;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = await buildHeaders(fetchInit.headers);
    const res = await fetch(input, {
      ...fetchInit,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Pas de 401 → réponse normale
    if (res.status !== 401) return res;

    // ── 401 : tentative de silent refresh ─────────────────────────────────
    const freshToken = await silentRefresh();

    if (!freshToken) {
      // Refresh impossible → session définitivement expirée
      emitAuthExpired('silent-refresh-failed');
      return res; // retourne la 401 originale sans throw
    }

    // Rejoue la requête avec le nouveau token
    const retryHeaders = await buildHeaders(fetchInit.headers);
    retryHeaders.set('Authorization', `Bearer ${freshToken}`);

    const retryController = new AbortController();
    const retryTimeout = setTimeout(() => retryController.abort(), timeoutMs);

    try {
      const retryRes = await fetch(input, {
        ...fetchInit,
        headers: retryHeaders,
        signal: retryController.signal,
      });
      clearTimeout(retryTimeout);

      if (retryRes.status === 401) {
        // Même après refresh → session expirée côté serveur
        emitAuthExpired('retry-still-401');
      }

      return retryRes;
    } finally {
      clearTimeout(retryTimeout);
    }
  } catch (err) {
    clearTimeout(timeoutId);
    // AbortError ou erreur réseau — on re-throw pour que React Query / useQuery gèrent
    throw err;
  }
}

export { AUTH_EXPIRED_EVENT };
