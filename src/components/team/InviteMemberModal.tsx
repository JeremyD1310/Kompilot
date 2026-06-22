import { useState } from 'react';
import { Mail, UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button } from '@blinkdotnew/ui';
import { cn } from '@/lib/utils';
import { type TeamRole, ROLE_LABELS } from '../../hooks/useTeam';

const ROLES: { role: TeamRole; description: string }[] = [
  { role: 'admin',  description: 'Gère les membres, publie et accède à tout' },
  { role: 'editor', description: 'Crée et planifie des posts, répond aux messages' },
  { role: 'member', description: 'Lecture seule + commentaires sur les posts' },
];

interface InviteMemberModalProps { open: boolean; onClose: () => void; onInvite: (params: { email: string; role: TeamRole; displayName: string }) => void; inviting: boolean; }

export function InviteMemberModal({ open, onClose, onInvite, inviting }: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<TeamRole>('editor');
  const handleSubmit = () => { if (!email.trim() || !email.includes('@')) return; onInvite({ email: email.trim(), role, displayName: displayName.trim() }); setEmail(''); setDisplayName(''); setRole('editor'); onClose(); };
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus size={18} className="text-primary" />Inviter un membre</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Adresse email <span className="text-destructive">*</span></label>
            <div className="relative"><Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="prenom@exemple.com" className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground" /></div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Prénom / Nom (optionnel)</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Marie Dupont" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Rôle</label>
            <div className="space-y-2">
              {ROLES.map(({ role: r, description }) => (
                <button key={r} type="button" onClick={() => setRole(r)} className={cn('w-full flex items-start gap-3 rounded-xl border p-3 text-left transition-all', role === r ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/30')}>
                  <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors', role === r ? 'border-primary bg-primary' : 'border-border')}>{role === r && <div className="w-1.5 h-1.5 rounded-full bg-white" />}</div>
                  <div><p className="text-sm font-semibold text-foreground">{ROLE_LABELS[r]}</p><p className="text-xs text-muted-foreground mt-0.5">{description}</p></div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button onClick={handleSubmit} disabled={!email.includes('@') || inviting} className="gap-2"><UserPlus size={14} />{inviting ? 'Envoi…' : "Envoyer l'invitation"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
