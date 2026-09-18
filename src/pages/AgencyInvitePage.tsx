import { BACKEND_URL as KOMPILOT_BACKEND_URL } from '@/lib/backend';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { Building2, CheckCircle2, Clock, Loader2, ShieldCheck } from 'lucide-react';
import { blink } from '../blink/client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? KOMPILOT_BACKEND_URL;

type Invite = { clientName: string; clientEmail: string; agencyName: string; expiresAt: string };

export default function AgencyInvitePage() {
  const { token } = useParams({ strict: false }) as { token: string };
  const navigate = useNavigate();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    document.title = 'Invitation agence — Kompilot';
    try { sessionStorage.setItem('kompilot_invite_token', token); } catch { /* private browsing */ }
    fetch(`${BACKEND_URL}/api/agency/invites/${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Invitation introuvable');
        setInvite(data.invite);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const acceptInvite = async () => {
    setAccepting(true);
    try {
      const authToken = await blink.auth.getValidToken();
      const res = await fetch(`${BACKEND_URL}/api/agency/invites/${encodeURIComponent(token)}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Impossible d’accepter l’invitation');
      navigate({ to: '/dashboard' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connectez-vous avec l’adresse invitée.');
      setAccepting(false);
    }
  };

  if (loading) return <InviteShell><Loader2 className="h-8 w-8 animate-spin text-primary" /></InviteShell>;
  if (error || !invite) return <InviteShell><p className="text-sm text-destructive text-center">{error || 'Invitation invalide ou expirée.'}</p><Link to="/login" className="text-sm text-primary hover:underline">Retour à la connexion</Link></InviteShell>;

  return (
    <InviteShell>
      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center"><Building2 className="h-7 w-7 text-primary" /></div>
      <div className="text-center space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Invitation client</p>
        <h1 className="text-2xl font-black text-foreground">Rejoindre {invite.agencyName || 'votre agence'}</h1>
        <p className="text-sm text-muted-foreground">Votre espace <strong>{invite.clientName}</strong> est prêt à être associé à votre compte Kompilot.</p>
      </div>
      <div className="w-full rounded-xl border border-border bg-muted/30 p-4 space-y-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Accès client sécurisé</div>
        <div className="flex items-center gap-2 text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> Données isolées de l’agence</div>
        <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4 text-amber-500" /> Valide jusqu’au {new Date(invite.expiresAt).toLocaleDateString('fr-FR')}</div>
      </div>
      <div className="w-full space-y-3">
        <button onClick={acceptInvite} disabled={accepting} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60">{accepting ? 'Association en cours…' : 'Accepter avec mon compte'}</button>
        <Link to={`/signup?invite_token=${encodeURIComponent(token)}`} className="block w-full rounded-xl border border-border px-4 py-3 text-center text-sm font-semibold text-foreground hover:bg-muted no-underline">Créer mon compte client</Link>
      </div>
    </InviteShell>
  );
}

function InviteShell({ children }: { children: ReactNode }) {
  return <main className="min-h-screen bg-background flex items-center justify-center p-4"><section className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-xl flex flex-col items-center gap-5">{children}</section></main>;
}