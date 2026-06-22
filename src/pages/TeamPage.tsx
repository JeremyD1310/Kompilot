/**
 * TeamPage — Team collaboration hub.
 * Tabs: Members | Chat | Activity Feed
 */
import { useState, useRef, useCallback } from 'react';
import { Users, MessageSquare, Activity, UserPlus, Copy, Check, Crown } from 'lucide-react';
import {
  Page, PageHeader, PageTitle, PageDescription, PageActions, PageBody,
  Button, Tabs, TabsList, TabsTrigger, TabsContent, StatGroup, Stat,
} from '@blinkdotnew/ui';
import { useAuth } from '../hooks/useAuth';
import { useTeam } from '../hooks/useTeam';
import { useTeamActivity } from '../hooks/useTeamActivity';
import { MemberCard } from '../components/team/MemberCard';
import { TeamChat } from '../components/team/TeamChat';
import { TeamActivityPanel } from '../components/team/TeamActivityPanel';
import { InviteMemberModal } from '../components/team/InviteMemberModal';

export default function TeamPage() {
  const { user } = useAuth();
  const { members, pendingMembers, isLoading, invite, inviting, updateRole, remove } = useTeam();
  const { items: activityItems } = useTeamActivity(user?.id);
  const [showInvite, setShowInvite] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [activeTab, setActiveTab] = useState('members');
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ownerId = user?.id ?? '';

  const ownerEntry = {
    id: 'owner',
    workspaceOwnerId: ownerId,
    memberUserId: ownerId,
    memberEmail: user?.email ?? '',
    displayName: user?.displayName ?? user?.email ?? 'Vous',
    avatarUrl: '',
    role: 'owner' as const,
    status: 'active' as const,
    invitedBy: '',
    joinedAt: null,
    createdAt: '',
  };

  const allMembers = [ownerEntry, ...members];
  const totalActive = 1 + members.filter(m => m.status === 'active').length;

  const copyInviteLink = useCallback(async () => {
    const link = `${window.location.origin}/join?workspace=${ownerId}`;
    // Clear any existing timeout to avoid state flicker on rapid clicks
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setCopyError(false);
    } catch {
      // Clipboard API blocked (e.g. Firefox non-HTTPS, iOS Safari restriction)
      // Fallback: select a hidden input
      setCopyError(true);
    }
    copyTimeoutRef.current = setTimeout(() => {
      setCopiedLink(false);
      setCopyError(false);
      copyTimeoutRef.current = null;
    }, 2500);
  }, [ownerId]);

  return (
    <Page>
      <PageHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users size={20} className="text-primary" />
          </div>
          <div>
            <PageTitle>Équipe & Collaboration</PageTitle>
            <PageDescription>Gérez les membres, messagerie et activités de votre espace de travail</PageDescription>
          </div>
        </div>
        <PageActions>
          <Button variant="outline" onClick={copyInviteLink} className="gap-2 text-sm">
            {copiedLink ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
            {copiedLink ? 'Lien copié !' : "Copier le lien d'invit."}
          </Button>
          <Button onClick={() => setShowInvite(true)} className="gap-2">
            <UserPlus size={14} />
            Inviter un membre
          </Button>
        </PageActions>
      </PageHeader>

      <PageBody>
        {/* KPI row */}
        <StatGroup className="mb-6">
          <Stat label="Membres actifs" value={String(totalActive)} icon={<Users size={16} />} />
          <Stat label="Invitations en attente" value={String(pendingMembers.length)} icon={<UserPlus size={16} />} />
          <Stat label="Actions récentes" value={String(activityItems.length)} icon={<Activity size={16} />} />
        </StatGroup>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="members" className="flex items-center gap-1.5">
              <Users size={13} /> Membres
              {pendingMembers.length > 0 && (
                <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {pendingMembers.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-1.5">
              <MessageSquare size={13} /> Chat équipe
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-1.5">
              <Activity size={13} /> Activité
            </TabsTrigger>
          </TabsList>

          {/* Members tab */}
          <TabsContent value="members">
            <div className="space-y-4">
              {pendingMembers.length > 0 && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/60 dark:bg-amber-950/20 px-4 py-3 flex items-center gap-3">
                  <span className="text-lg">⏳</span>
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    <strong>{pendingMembers.length} invitation(s)</strong> en attente d'acceptation.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground"><Crown size={11} className="text-violet-600" /> Propriétaire : accès total</span>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-muted-foreground">Admin : gestion des membres</span>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-muted-foreground">Éditeur : publie des posts</span>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-muted-foreground">Membre : lecture + commentaires</span>
              </div>

              <div className="space-y-2">
                {isLoading
                  ? [1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl border border-border bg-muted/20 animate-pulse" />)
                  : allMembers.map(member => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      isCurrentUser={member.memberUserId === user?.id || member.id === 'owner'}
                      canManage={true}
                      onUpdateRole={role => updateRole({ memberId: member.id, role })}
                      onRemove={() => remove(member.id)}
                    />
                  ))
                }
              </div>

              {!isLoading && members.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-border bg-muted/10 px-8 py-12 text-center mt-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <UserPlus size={20} className="text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-1">Invitez votre équipe</h3>
                  <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
                    Collaborez sur les publications, répondez aux messages et suivez les avis ensemble.
                  </p>
                  <Button onClick={() => setShowInvite(true)} size="sm" className="gap-2">
                    <UserPlus size={13} /> Inviter un membre
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Chat tab */}
          <TabsContent value="chat">
            <div className="rounded-2xl border border-border bg-card overflow-hidden" style={{ height: '65vh' }}>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/20">
                <div className="flex -space-x-1.5">
                  {allMembers.slice(0, 4).map((m, i) => (
                    <div key={m.id} className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-[9px] flex items-center justify-center border-2 border-card" style={{ zIndex: 10 - i }}>
                      {(m.displayName || m.memberEmail).charAt(0).toUpperCase()}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground"># général</p>
                  <p className="text-[11px] text-muted-foreground">{totalActive} membre(s) actif(s)</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[11px] text-muted-foreground">En ligne</span>
                </div>
              </div>
              <TeamChat workspaceOwnerId={ownerId} className="h-[calc(65vh-57px)]" />
            </div>
          </TabsContent>

          {/* Activity tab */}
          <TabsContent value="activity">
            <div className="rounded-2xl border border-border bg-card overflow-hidden" style={{ height: '65vh' }}>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/20">
                <Activity size={15} className="text-primary" />
                <p className="text-sm font-bold text-foreground">Fil d'activité</p>
                <span className="text-[11px] text-muted-foreground ml-1">— toutes les actions de votre équipe</span>
              </div>
              <TeamActivityPanel workspaceOwnerId={ownerId} className="h-[calc(65vh-57px)]" />
            </div>
          </TabsContent>
        </Tabs>
      </PageBody>

      <InviteMemberModal
        open={showInvite}
        onClose={() => setShowInvite(false)}
        onInvite={invite}
        inviting={inviting}
      />
    </Page>
  );
}
