import type { LocalVisibilityData } from '../components/gmaps/LocalVisibilityWidget';
import { authHeaders, backendFetch, readBackendError } from './backend';

export type DashboardActionResolution = 'ignored' | 'snoozed';

export interface DashboardActionPreference {
  actionId: string;
  resolution: DashboardActionResolution;
  snoozedUntil: string | null;
  updatedAt: string;
}

export interface RecordedMilestone {
  id: string;
  recordedAt: string;
  data: LocalVisibilityData;
}

export interface DashboardServerState {
  preferences: DashboardActionPreference[];
  milestone: RecordedMilestone | null;
}

export async function fetchDashboardState(): Promise<DashboardServerState> {
  const response = await backendFetch('/api/dashboard/state', { headers: await authHeaders() });
  if (!response.ok) throw await readBackendError(response, 'État du dashboard indisponible.');
  return response.json() as Promise<DashboardServerState>;
}

export async function saveDashboardActionPreference(
  actionId: string,
  resolution: DashboardActionResolution,
  snoozedUntil: string | null,
): Promise<void> {
  const response = await backendFetch(`/api/dashboard/actions/${encodeURIComponent(actionId)}`, {
    method: 'PUT',
    headers: await authHeaders(true),
    body: JSON.stringify({ resolution, snoozedUntil }),
  });
  if (!response.ok) throw await readBackendError(response, 'Préférence non enregistrée.');
}

export async function acknowledgeDashboardMilestone(eventId: string): Promise<void> {
  const response = await backendFetch(`/api/dashboard/milestones/${encodeURIComponent(eventId)}/acknowledge`, {
    method: 'POST',
    headers: await authHeaders(true),
    body: '{}',
  });
  if (!response.ok) throw await readBackendError(response, 'Jalon non acquitté.');
}
