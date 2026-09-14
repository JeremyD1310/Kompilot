import { backendFetch, authHeaders, readBackendError } from './backend';

export type CenterNotification = {
  id: string;
  title: string;
  body: string;
  type: string;
  url: string;
  status: string;
  read: boolean;
  createdAt: string;
};

export async function listCenterNotifications() {
  const response = await backendFetch('/api/notifications', { headers: await authHeaders() });
  if (!response.ok) throw await readBackendError(response, 'Impossible de charger les notifications');
  const data = await response.json() as { notifications: CenterNotification[] };
  return data.notifications.map((notification): import('../hooks/useEmailNotifications').AppNotification => ({
    id: notification.id,
    type: notification.type === 'approval_required' ? 'post_reminder' : notification.type === 'review' ? 'review' : notification.type === 'weekly_digest' ? 'weekly_digest' : 'message',
    title: notification.title,
    body: notification.body,
    timestamp: new Date(notification.createdAt).getTime(),
    read: notification.read,
    emailSent: false,
  }));
}

export async function markCenterNotificationRead(id: string) {
  const response = await backendFetch(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH', headers: await authHeaders() });
  if (!response.ok) throw await readBackendError(response, 'Impossible de marquer la notification');
}

export async function markAllCenterNotificationsRead() {
  const response = await backendFetch('/api/notifications/read-all', { method: 'POST', headers: await authHeaders(true), body: '{}' });
  if (!response.ok) throw await readBackendError(response, 'Impossible de marquer les notifications');
}

export async function clearCenterNotifications() {
  const response = await backendFetch('/api/notifications/clear-all', { method: 'POST', headers: await authHeaders(true), body: '{}' });
  if (!response.ok) throw await readBackendError(response, 'Impossible d’effacer les notifications');
}
