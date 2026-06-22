import { useQuery } from '@tanstack/react-query';
import { blink } from '../blink/client';
import { useAuth } from './useAuth';

export interface TeamActivityItem {
  id: string;
  actorName: string;
  actorAvatar: string;
  actionType: string;
  entityType: string;
  entityLabel: string;
  createdAt: string;
}

const ACTION_LABELS: Record<string, { emoji: string; label: (entity: string) => string }> = {
  invite_sent:      { emoji: '📨', label: e => `Invitation envoyée à ${e}` },
  member_joined:    { emoji: '🎉', label: _ => `a rejoint l'équipe` },
  member_removed:   { emoji: '👋', label: _ => `a quitté l'équipe` },
  role_changed:     { emoji: '🔑', label: e => `Rôle mis à jour : ${e}` },
  post_created:     { emoji: '📝', label: e => `Post créé : ${e}` },
  post_published:   { emoji: '🚀', label: e => `Post publié : ${e}` },
  post_scheduled:   { emoji: '📅', label: e => `Post planifié : ${e}` },
  comment_added:    { emoji: '💬', label: e => `Commentaire sur : ${e}` },
  comment_resolved: { emoji: '✅', label: e => `Résolu : ${e}` },
};

export function formatActivity(item: TeamActivityItem): { emoji: string; text: string } {
  const def = ACTION_LABELS[item.actionType];
  if (!def) return { emoji: '🔔', text: `${item.actorName} — ${item.actionType}` };
  return { emoji: def.emoji, text: `${item.actorName} ${def.label(item.entityLabel)}` };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${Math.floor(hours / 24)}j`;
}

export function useTeamActivity(workspaceOwnerId?: string) {
  const { user } = useAuth();
  const ownerId = workspaceOwnerId ?? user?.id ?? '';
  const { data: items = [], isLoading } = useQuery<TeamActivityItem[]>({
    queryKey: ['team-activity', ownerId],
    queryFn: async () => {
      if (!ownerId) return [];
      const rows = await blink.db.teamActivityFeed.list({ where: { workspaceOwnerId: ownerId }, orderBy: { createdAt: 'desc' }, limit: 30 });
      return (rows as Record<string, unknown>[]).map(r => ({ id: String(r.id ?? ''), actorName: String(r.actorName ?? r.actor_name ?? ''), actorAvatar: String(r.actorAvatar ?? r.actor_avatar ?? ''), actionType: String(r.actionType ?? r.action_type ?? ''), entityType: String(r.entityType ?? r.entity_type ?? ''), entityLabel: String(r.entityLabel ?? r.entity_label ?? ''), createdAt: String(r.createdAt ?? r.created_at ?? new Date().toISOString()) }));
    },
    enabled: !!ownerId,
    refetchInterval: 20_000,
    staleTime: 15_000,
  });
  const itemsWithMeta = items.map(item => ({ ...item, timeAgo: timeAgo(item.createdAt), ...formatActivity(item) }));
  return { items: itemsWithMeta, isLoading };
}
