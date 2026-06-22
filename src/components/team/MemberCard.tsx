import { useState } from 'react';
import { Trash2, ChevronDown, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type TeamMember, type TeamRole, ROLE_LABELS, ROLE_COLORS } from '../../hooks/useTeam';

function getInitials(name: string) { return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'; }

interface MemberCardProps { member: TeamMember; isCurrentUser: boolean; canManage: boolean; onUpdateRole: (role: TeamRole) => void; onRemove: () => void; }

const ASSIGNABLE_ROLES: TeamRole[] = ['admin', 'editor', 'member'];

export function MemberCard({ member, isCurrentUser, canManage, onUpdateRole, onRemove }: MemberCardProps) {
  const [roleDropdown, setRoleDropdown] = useState(false);
  const isPending = member.status === 'pending';
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted/20 transition-colors group">
      <div className="relative shrink-0">
        {member.avatarUrl ? <img src={member.avatarUrl} alt={member.displayName} className="w-9 h-9 rounded-full object-cover" /> : <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">{getInitials(member.displayName || member.memberEmail)}</div>}
        <span className={cn('absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card', isPending ? 'bg-amber-400' : 'bg-green-500')} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2"><p className="text-sm font-semibold text-foreground truncate">{member.displayName || member.memberEmail}</p>{isCurrentUser && <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full shrink-0">Vous</span>}</div>
        <div className="flex items-center gap-1.5 mt-0.5"><p className="text-xs text-muted-foreground truncate">{member.memberEmail}</p>{isPending ? <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-semibold shrink-0"><Clock size={9} /> En attente</span> : <span className="flex items-center gap-0.5 text-[10px] text-green-600 font-semibold shrink-0"><CheckCircle2 size={9} /> Actif</span>}</div>
      </div>
      <div className="relative shrink-0">
        {canManage && member.role !== 'owner' && !isCurrentUser ? (
          <button onClick={() => setRoleDropdown(v => !v)} className={cn('flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors', ROLE_COLORS[member.role])}>{ROLE_LABELS[member.role]}<ChevronDown size={11} /></button>
        ) : (
          <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', ROLE_COLORS[member.role])}>{ROLE_LABELS[member.role]}</span>
        )}
        {roleDropdown && (
          <div className="absolute right-0 top-full mt-1 z-20 w-36 bg-popover border border-border rounded-xl shadow-lg py-1 overflow-hidden">
            {ASSIGNABLE_ROLES.map(r => <button key={r} onClick={() => { onUpdateRole(r); setRoleDropdown(false); }} className={cn('w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-colors', member.role === r ? 'text-primary bg-primary/5' : 'text-foreground')}>{ROLE_LABELS[r]}</button>)}
          </div>
        )}
      </div>
      {canManage && !isCurrentUser && member.role !== 'owner' && <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all shrink-0" title="Retirer"><Trash2 size={14} /></button>}
    </div>
  );
}
