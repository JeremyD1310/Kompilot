import { blink } from '../../blink/client';
import { optimizeImageToWebP } from '../imageOptimizer';
import { BACKEND_URL } from '../backend';

export type Workspace = { id: string; name: string; role?: string; ownerId?: string };
export type AgencyAsset = { id: string; name: string; fileUrl: string; fileType: string; fileSize: number; tags: string; createdAt: string };
export type AgencyBrandKit = { id: string; name: string; logoUrl: string; primaryColor: string; secondaryColor: string; headingFont: string; bodyFont: string };
export type AgencyContentItem = { id: string; title: string; contentType: string; status: string; currentVersionId?: string; assignedTo?: string; createdAt: string; updatedAt: string };
export type AgencyVersion = { id: string; contentItemId: string; versionNumber: number; body: string; metadata: string; createdBy: string; createdAt: string };
export type AgencyApproval = { id: string; contentItemId: string; versionId: string; status: string; requestedBy: string; reviewedBy?: string; feedback: string };
export type AgencyComment = { id: string; contentItemId: string; versionId?: string; authorId: string; body: string; createdAt: string };
export type AgencyCalendarEvent = { id: string; contentItemId?: string; title: string; startsAt: string; endsAt?: string; channel: string; status: string };
export type AgencySummary = { workspaceId: string; content: { total: number; byStatus: Record<string, number> }; assets: number; approvals: { total: number; pending: number }; calendarEvents: number };

export type AgencyResourceMap = {
  assets: AgencyAsset[];
  'brand-kits': AgencyBrandKit[];
  content: AgencyContentItem[];
  versions: AgencyVersion[];
  approvals: AgencyApproval[];
  comments: AgencyComment[];
  calendar: AgencyCalendarEvent[];
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await blink.auth.getValidToken();
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${BACKEND_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    const body: unknown = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string'
        ? body.error
        : `Request failed (${response.status})`;
      throw new Error(message);
    }
    return body as T;
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

export const agencyApi = {
  workspaces: () => request<{ workspaces: Workspace[] }>('/api/agency/workspaces'),
  createWorkspace: (name: string) => request<Workspace>('/api/agency/workspaces', { method: 'POST', body: JSON.stringify({ name }) }),
  resource: <K extends keyof AgencyResourceMap>(workspaceId: string, resource: K) => request<{ [P in K]: AgencyResourceMap[P] }>(`/api/agency/workspaces/${encodeURIComponent(workspaceId)}/${resource}`),
  create: (workspaceId: string, resource: keyof AgencyResourceMap, data: Record<string, unknown>) => request<Record<string, unknown>>(`/api/agency/workspaces/${encodeURIComponent(workspaceId)}/${resource}`, { method: 'POST', body: JSON.stringify(data) }),
  status: (workspaceId: string, id: string, status: string) => request<AgencyContentItem>(`/api/agency/workspaces/${encodeURIComponent(workspaceId)}/content/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  approvalStatus: (workspaceId: string, id: string, status: string, feedback?: string) => request<AgencyApproval>(`/api/agency/workspaces/${encodeURIComponent(workspaceId)}/approvals/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ status, feedback }) }),
  summary: (workspaceId: string) => request<AgencySummary>(`/api/agency/workspaces/${encodeURIComponent(workspaceId)}/report/summary`),
};

export async function uploadAgencyAsset(file: File, workspaceId: string) {
  const isImage = file.type.startsWith('image/');
  const optimized = isImage ? await optimizeImageToWebP(file, { maxWidthPx: 1600, quality: 0.82 }) : { file, wasOptimized: false };
  const uploadFile = optimized.file;
  const extension = uploadFile.name.split('.').pop() || 'bin';
  const { publicUrl } = await blink.storage.upload(uploadFile, `agency-assets/${workspaceId}/${crypto.randomUUID()}.${extension}`);
  return agencyApi.create(workspaceId, 'assets', { name: file.name, fileUrl: publicUrl, fileType: uploadFile.type || file.type || 'other', fileSize: uploadFile.size, tags: '[]' });
}
