import { blink } from '../blink/client';
import type { AdvisoryReport } from './advisoryTypes';
import { BACKEND_URL, authHeaders, backendFetch, readBackendError } from './backend';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await backendFetch(path, {
    ...init,
    headers: { ...(await authHeaders(true)), ...(init?.headers ?? {}) },
  });
  if (!response.ok) throw await readBackendError(response, `Erreur ${response.status}`);
  return response.json() as Promise<T>;
}

export async function fetchLatestAdvisory(): Promise<AdvisoryReport | null> {
  const token = await blink.auth.getValidToken();
  const response = await fetch(`${BACKEND_URL}/api/advisory/latest`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Impossible de charger l’analyse (${response.status})`);
  return response.json() as Promise<AdvisoryReport>;
}

export function generateAdvisory(): Promise<AdvisoryReport> {
  return request<AdvisoryReport>('/api/advisory/analyze', { method: 'POST', body: '{}' });
}

export function fetchAdvisoryImpact(): Promise<import('./advisoryTypes').AdvisoryImpactReport> {
  return request<import('./advisoryTypes').AdvisoryImpactReport>('/api/advisory/impact');
}
