import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blink } from '../blink/client';
import { useAuth } from './useAuth';

export interface TeamMessage {
  id: string;
  workspaceOwnerId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  messageType: 'text' | 'system';
  replyToId: string;
  reactions: Record<string, string[]>;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
}

function normalise(raw: Record<string, unknown>): TeamMessage {
  let reactions: Record<string, string[]> = {};
  try { reactions = JSON.parse(String(raw.reactions ?? '{}')); } catch { }
  return {
    id: String(raw.id ?? ''),
    workspaceOwnerId: String(raw.workspaceOwnerId ?? raw.workspace_owner_id ?? ''),
    senderId: String(raw.senderId ?? raw.sender_id ?? ''),
    senderName: String(raw.senderName ?? raw.sender_name ?? ''),
    senderAvatar: String(raw.senderAvatar ?? raw.sender_avatar ?? ''),
    content: String(raw.content ?? ''),
    messageType: (raw.messageType ?? raw.message_type ?? 'text') as 'text' | 'system',
    replyToId: String(raw.replyToId ?? raw.reply_to_id ?? ''),
    reactions,
    isEdited: Number(raw.isEdited ?? raw.is_edited ?? 0) > 0,
    isDeleted: Number(raw.isDeleted ?? raw.is_deleted ?? 0) > 0,
    createdAt: String(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
  };
}

export function useTeamMessages(workspaceOwnerId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: messages = [], isLoading } = useQuery<TeamMessage[]>({
    queryKey: ['team-messages', workspaceOwnerId],
    queryFn: async () => {
      if (!workspaceOwnerId) return [];
      const rows = await blink.db.teamMessages.list({ where: { workspaceOwnerId }, orderBy: { createdAt: 'asc' }, limit: 100 });
      return (rows as Record<string, unknown>[]).map(normalise).filter(m => !m.isDeleted);
    },
    enabled: !!workspaceOwnerId,
    refetchInterval: 5_000,
    staleTime: 4_000,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id || !workspaceOwnerId || !content.trim()) return;
      await blink.db.teamMessages.create({ id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, workspaceOwnerId, senderId: user.id, senderName: user.displayName ?? user.email ?? 'Moi', senderAvatar: '', content: content.trim(), messageType: 'text', replyToId: '', attachments: '[]', reactions: '{}', isEdited: 0, isDeleted: 0 });
    },
    onMutate: async (content) => {
      await qc.cancelQueries({ queryKey: ['team-messages', workspaceOwnerId] });
      const prev = qc.getQueryData<TeamMessage[]>(['team-messages', workspaceOwnerId]) ?? [];
      const optimistic: TeamMessage = { id: `opt_${Date.now()}`, workspaceOwnerId, senderId: user?.id ?? '', senderName: user?.displayName ?? user?.email ?? 'Moi', senderAvatar: '', content, messageType: 'text', replyToId: '', reactions: {}, isEdited: false, isDeleted: false, createdAt: new Date().toISOString() };
      qc.setQueryData<TeamMessage[]>(['team-messages', workspaceOwnerId], [...prev, optimistic]);
      return { prev };
    },
    onError: (_e: Error, _v: string, ctx: { prev: TeamMessage[] } | undefined) => { if (ctx?.prev) qc.setQueryData(['team-messages', workspaceOwnerId], ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: ['team-messages', workspaceOwnerId] }),
  });

  const addReactionMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      if (!user?.id) return;
      const msg = messages.find(m => m.id === messageId);
      if (!msg) return;
      const reactions = { ...msg.reactions };
      const users = reactions[emoji] ?? [];
      if (users.includes(user.id)) { reactions[emoji] = users.filter(u => u !== user.id); if (reactions[emoji].length === 0) delete reactions[emoji]; } else { reactions[emoji] = [...users, user.id]; }
      await blink.db.teamMessages.update(messageId, { reactions: JSON.stringify(reactions) });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['team-messages', workspaceOwnerId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (messageId: string) => { await blink.db.teamMessages.update(messageId, { isDeleted: 1 }); },
    onSettled: () => qc.invalidateQueries({ queryKey: ['team-messages', workspaceOwnerId] }),
  });

  return { messages, isLoading, send: sendMutation.mutate, sending: sendMutation.isPending, addReaction: addReactionMutation.mutate, deleteMessage: deleteMutation.mutate };
}
