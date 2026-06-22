import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blink } from '../blink/client';
import { useAuth } from './useAuth';
import { toast } from '@blinkdotnew/ui';

export type TeamRole = 'owner' | 'admin' | 'editor' | 'member';

export interface TeamMember {
  id: string;
  workspaceOwnerId: string;
  memberUserId: string;
  memberEmail: string;
  displayName: string;
  avatarUrl: string;
  role: TeamRole;
  status: 'pending' | 'active' | 'removed';
  invitedBy: string;
  joinedAt: string | null;
  createdAt: string;
}

export const ROLE_LABELS: Record<TeamRole, string> = {
  owner: 'Propriétaire',
  admin: 'Administrateur',
  editor: 'Éditeur',
  member: 'Membre',
};

export const ROLE_COLORS: Record<TeamRole, string> = {
  owner: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
  admin: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  editor: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  member: 'bg-muted text-muted-foreground',
};

function normalise(raw: Record<string, unknown>): TeamMember {
  return {
    id: String(raw.id ?? ''),
    workspaceOwnerId: String(raw.workspaceOwnerId ?? raw.workspace_owner_id ?? ''),
    memberUserId: String(raw.memberUserId ?? raw.member_user_id ?? ''),
    memberEmail: String(raw.memberEmail ?? raw.member_email ?? ''),
    displayName: String(raw.displayName ?? raw.display_name ?? ''),
    avatarUrl: String(raw.avatarUrl ?? raw.avatar_url ?? ''),
    role: (raw.role ?? 'member') as TeamRole,
    status: (raw.status ?? 'pending') as TeamMember['status'],
    invitedBy: String(raw.invitedBy ?? raw.invited_by ?? ''),
    joinedAt: raw.joinedAt ? String(raw.joinedAt) : null,
    createdAt: String(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
  };
}

export function useTeam() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: members = [], isLoading } = useQuery<TeamMember[]>({
    queryKey: ['team-members', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const rows = await blink.db.teamMembers.list({ where: { workspaceOwnerId: user.id }, orderBy: { createdAt: 'asc' }, limit: 50 });
      return (rows as Record<string, unknown>[]).map(normalise);
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const activeMembers = members.filter(m => m.status !== 'removed');
  const pendingMembers = members.filter(m => m.status === 'pending');

  const inviteMutation = useMutation({
    mutationFn: async ({ email, role, displayName }: { email: string; role: TeamRole; displayName: string }) => {
      if (!user?.id) throw new Error('Non authentifié');
      const id = `tm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await blink.db.teamMembers.create({ id, workspaceOwnerId: user.id, memberUserId: '', memberEmail: email, displayName: displayName || email.split('@')[0], avatarUrl: '', role, status: 'pending', invitedBy: user.displayName ?? user.email ?? '', inviteToken: Math.random().toString(36).slice(2), joinedAt: null });
      // Mark onboarding checklist step
      try { localStorage.setItem(`team_member_invited_${user.id}`, '1'); } catch {}
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team-members'] }); toast.success('Invitation envoyée !'); },
    onError: (e: Error) => toast.error(`Erreur : ${e.message}`),
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: TeamRole }) => { await blink.db.teamMembers.update(memberId, { role }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team-members'] }); toast.success('Rôle mis à jour'); },
    onError: (e: Error) => toast.error(`Erreur : ${e.message}`),
  });

  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => { await blink.db.teamMembers.update(memberId, { status: 'removed' }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team-members'] }); toast.success('Membre retiré'); },
    onError: (e: Error) => toast.error(`Erreur : ${e.message}`),
  });

  return { members: activeMembers, pendingMembers, isLoading, invite: inviteMutation.mutate, inviting: inviteMutation.isPending, updateRole: updateRoleMutation.mutate, remove: removeMutation.mutate };
}
