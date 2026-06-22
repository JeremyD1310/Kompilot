import { useState } from 'react';
import { Mail, Shield, Users, UserX } from 'lucide-react';
import { toast } from '@blinkdotnew/ui';

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = 'Admin' | 'Éditeur' | 'Lecteur';
type MemberStatus = 'En attente' | 'Actif';

interface InvitedMember {
  id: string;
  email: string;
  role: Role;
  status: MemberStatus;
}

// ── Role config ───────────────────────────────────────────────────────────────

const ROLES: { value: Role; label: string; description: string; color: string }[] = [
  {
    value: 'Admin',
    label: 'Admin',
    description: 'Accès complet + validation',
    color: 'violet',
  },
  {
    value: 'Éditeur',
    label: 'Éditeur',
    description: 'Créer et modifier des posts',
    color: 'amber',
  },
  {
    value: 'Lecteur',
    label: 'Lecteur',
    description: 'Lecture seule, pas de publication',
    color: 'sky',
  },
];

const ROLE_COLORS: Record<Role, string> = {
  Admin:
    'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800/50',
  Éditeur:
    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50',
  Lecteur:
    'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800/50',
};

const STATUS_COLORS: Record<MemberStatus, string> = {
  'En attente':
    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50',
  Actif:
    'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50',
};

// ── Role Radio Button ─────────────────────────────────────────────────────────

function RoleOption({
  option,
  selected,
  onSelect,
}: {
  option: (typeof ROLES)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  const ringMap: Record<string, string> = {
    violet: 'ring-violet-400/50 border-violet-400/60 bg-violet-50/60 dark:bg-violet-900/20',
    amber: 'ring-amber-400/50 border-amber-400/60 bg-amber-50/60 dark:bg-amber-900/20',
    sky: 'ring-sky-400/50 border-sky-400/60 bg-sky-50/60 dark:bg-sky-900/20',
  };
  const dotMap: Record<string, string> = {
    violet: 'bg-violet-500',
    amber: 'bg-amber-500',
    sky: 'bg-sky-500',
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex-1 flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all duration-150 cursor-pointer ${
        selected
          ? `${ringMap[option.color]} ring-2`
          : 'border-border bg-card hover:bg-muted/50'
      }`}
    >
      {/* Radio dot */}
      <span
        className={`shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
          selected
            ? `border-current ${dotMap[option.color]}`
            : 'border-muted-foreground/40 bg-transparent'
        }`}
      >
        {selected && (
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
        )}
      </span>

      <div className="min-w-0">
        <p className={`text-xs font-bold leading-tight ${selected ? 'text-foreground' : 'text-muted-foreground'}`}>
          {option.label}
        </p>
        <p className="text-[10px] text-muted-foreground/70 mt-0.5 leading-snug">
          {option.description}
        </p>
      </div>
    </button>
  );
}

// ── Member Table Row ──────────────────────────────────────────────────────────

function MemberRow({
  member,
  onRevoke,
}: {
  member: InvitedMember;
  onRevoke: () => void;
}) {
  const initials = member.email.charAt(0).toUpperCase();

  return (
    <tr className="border-b border-border last:border-0 group hover:bg-muted/30 transition-colors">
      {/* Email */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-extrabold text-primary">{initials}</span>
          </div>
          <span className="text-sm text-foreground font-medium truncate max-w-[200px]">
            {member.email}
          </span>
        </div>
      </td>

      {/* Role */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${ROLE_COLORS[member.role]}`}
        >
          <Shield size={10} />
          {member.role}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${STATUS_COLORS[member.status]}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              member.status === 'En attente' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'
            }`}
          />
          {member.status}
        </span>
      </td>

      {/* Revoke */}
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={onRevoke}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-transparent hover:bg-red-50 text-red-500 hover:text-red-600 text-[11px] font-semibold px-2.5 py-1.5 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer dark:border-red-900/40 dark:hover:bg-red-950/30"
          title="Révoquer l'invitation"
        >
          <UserX size={12} />
          Révoquer
        </button>
      </td>
    </tr>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function TeamInviteSection() {
  const [email, setEmail]     = useState('');
  const [emailError, setEmailError] = useState('');
  const [role, setRole]       = useState<Role>('Éditeur');
  const [members, setMembers] = useState<InvitedMember[]>([
    // Seed with one demo "Actif" member so the table is never empty by default
    { id: 'seed-1', email: 'marine.durand@example.com', role: 'Éditeur', status: 'Actif' },
  ]);

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateEmail = (value: string): string => {
    if (!value.trim()) return "L'adresse email est requise.";
    if (!value.includes('@')) return 'Adresse invalide — le symbole "@" est manquant.';
    return '';
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError) setEmailError(validateEmail(value));
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) { setEmailError(err); return; }

    const trimmed = email.trim().toLowerCase();

    setMembers(prev => [
      { id: `inv-${Date.now()}`, email: trimmed, role, status: 'En attente' },
      ...prev,
    ]);

    toast.success(`Invitation envoyée à ${trimmed}`, {
      description: `Rôle : ${role} · L'email d'invitation est en route.`,
    });

    setEmail('');
    setEmailError('');
    setRole('Éditeur');
  };

  // ── Revoke ──────────────────────────────────────────────────────────────────

  const handleRevoke = (id: string, memberEmail: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    toast(`Accès révoqué`, {
      description: `${memberEmail} ne peut plus accéder à l'espace.`,
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Section header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Mail size={18} className="text-primary" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-foreground">✉️ Inviter un membre</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Envoyez une invitation par email avec un rôle défini. Le membre reçoit un lien d'accès.
          </p>
        </div>
      </div>

      {/* ── Invite form ────────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border bg-card p-5 space-y-5"
      >
        {/* Email field */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
            Email du membre
          </label>
          <div className="relative">
            <Mail
              size={14}
              className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                emailError ? 'text-red-400' : 'text-muted-foreground'
              }`}
            />
            <input
              type="text"
              value={email}
              onChange={e => handleEmailChange(e.target.value)}
              onBlur={() => setEmailError(validateEmail(email))}
              placeholder="sophie@restaurant.com"
              className={`w-full pl-9 pr-4 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 transition-shadow ${
                emailError
                  ? 'border-red-400 focus:ring-red-400/30 text-red-700'
                  : 'border-border focus:ring-primary/30'
              }`}
            />
          </div>
          {emailError && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
              <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-red-100 text-red-600 shrink-0 text-[10px] font-extrabold leading-none">!</span>
              {emailError}
            </p>
          )}
        </div>

        {/* Role selector */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Rôle
          </label>
          <div className="flex gap-2 flex-wrap">
            {ROLES.map(option => (
              <RoleOption
                key={option.value}
                option={option}
                selected={role === option.value}
                onSelect={() => setRole(option.value)}
              />
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!email.trim()}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold py-2.5 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] cursor-pointer"
        >
          <Mail size={14} />
          Envoyer l'invitation
        </button>
      </form>

      {/* ── Members list ───────────────────────────────────────────────────── */}
      {members.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Users size={13} />
              Membres invités
              <span className="ml-1 rounded-full bg-muted text-foreground text-[10px] font-extrabold px-1.5 py-0.5">
                {members.length}
              </span>
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-2.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {members.map(member => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    onRevoke={() => handleRevoke(member.id, member.email)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-1">
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              En attente = invitation envoyée, compte non activé
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Actif = membre connecté
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
