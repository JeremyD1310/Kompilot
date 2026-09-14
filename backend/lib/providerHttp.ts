import { safeError, operationalLog, type OperationContext } from './operations';

export function retryAfterMs(response: Response): number {
  const value = response.headers.get('retry-after');
  if (!value) return 0;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.min(60_000, Math.max(0, seconds * 1000));
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.min(60_000, Math.max(0, date - Date.now())) : 0;
}

export function isRetryableProviderStatus(status: number) { return status === 408 || status === 425 || status === 429 || status >= 500; }

export async function fetchWithBackoff(input: RequestInfo | URL, init: RequestInit, context: OperationContext, options: { attempts?: number; timeoutMs?: number; provider?: string } = {}): Promise<Response> {
  const attempts = Math.min(5, Math.max(1, options.attempts ?? 3));
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 20_000);
    try {
      const response = await fetch(input, { ...init, signal: init.signal ?? controller.signal });
      clearTimeout(timeout);
      if (!isRetryableProviderStatus(response.status) || attempt === attempts) return response;
      const wait = retryAfterMs(response) || Math.min(8_000, 250 * (2 ** (attempt - 1)) + Math.floor(Math.random() * 250));
      operationalLog('provider_retry', context, { provider: options.provider, attempt, status: response.status, waitMs: wait });
      await new Promise(resolve => setTimeout(resolve, wait));
    } catch (error) {
      clearTimeout(timeout);
      if (attempt === attempts) throw error;
      const wait = Math.min(8_000, 250 * (2 ** (attempt - 1)) + Math.floor(Math.random() * 250));
      operationalLog('provider_network_retry', context, { provider: options.provider, attempt, waitMs: wait, error: safeError(error) });
      await new Promise(resolve => setTimeout(resolve, wait));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error('Provider request attempts exhausted');
}
