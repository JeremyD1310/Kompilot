import { useEffect, useMemo, useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Skeleton, toast } from '@blinkdotnew/ui';
import { AlertCircle, Check, ExternalLink, Link2Off, Loader2, RefreshCw, ShieldCheck, Unlink } from 'lucide-react';
import { BACKEND_URL } from '../../lib/backend';
import { blink } from '../../blink/client';
import { ResponsiveImage } from '../shared/ResponsiveImage';

interface MetaAccount {
  id: string;
  network: 'facebook' | 'instagram';
  externalId: string;
  name: string;
  username: string;
  profilePictureUrl: string;
  parentPageName: string;
  selected: boolean;
  status: 'available' | 'connected' | 'token_expired' | 'sync_error' | 'disconnected' | string;
  lastError: string;
}

interface MetaStatus {
  connected: boolean;
  status: string;
  expiresAt?: string;
  accounts: MetaAccount[];
}

async function metaFetch<T>(path: string, init: RequestInit = {}) {
  const token = await blink.auth.getValidToken();
  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || body.message || `Erreur Meta (${response.status})`);
  return body as T;
}

function FacebookGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="fill-current">
      <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073c0 6.019 4.388 11.006 10.125 11.927v-8.437H7.078v-3.49h3.047V9.412c0-3.027 1.791-4.698 4.533-4.698 1.312 0 2.686.236 2.686.236v2.973h-1.515c-1.491 0-1.956.93-1.956 1.885v2.265h3.328l-.532 3.49h-2.796V24C19.612 23.079 24 18.092 24 12.073Z" />
    </svg>
  );
}

function InstagramGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="fill-none stroke-current" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" className="fill-current stroke-none" />
    </svg>
  );
}

function AccountIcon({ network }: { network: MetaAccount['network'] }) {
  return network === 'facebook'
    ? <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1877F2]/10 text-[#1877F2]"><FacebookGlyph /></span>
    : <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500/10 text-pink-600"><InstagramGlyph /></span>;
}

function statusLabel(account: MetaAccount) {
  if (account.status === 'connected') return { label: 'Actif', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (account.status === 'token_expired') return { label: 'Token expiré', className: 'bg-amber-50 text-amber-700 border-amber-200' };
  if (account.status === 'sync_error') return { label: 'Erreur de synchro', className: 'bg-red-50 text-red-700 border-red-200' };
  if (account.status === 'token_error') return { label: 'Erreur de sécurité', className: 'bg-red-50 text-red-700 border-red-200' };
  if (account.status === 'disconnected') return { label: 'Dissocié', className: 'bg-slate-50 text-slate-600 border-slate-200' };
  return { label: 'Disponible', className: 'bg-slate-50 text-slate-600 border-slate-200' };
}

export function MetaAccountsManager() {
  const [status, setStatus] = useState<MetaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await metaFetch<MetaStatus>('/api/meta/oauth/status');
      setStatus(data);
      setSelectedIds(data.accounts.filter((account) => account.selected).map((account) => account.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les comptes Meta.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('meta_connected');
    const metaError = params.get('meta_error');
    if (connected === 'true') toast.success('Connexion Meta réussie', { description: 'Sélectionnez les Pages et comptes Instagram à gérer.' });
    if (metaError) toast.error('Connexion Meta refusée', { description: metaError });
    if (connected || metaError) {
      window.history.replaceState({}, '', window.location.pathname);
      void load();
    }
  }, []);

  const selectedCount = selectedIds.length;
  const availableAccounts = useMemo(() => status?.accounts ?? [], [status]);

  const updateSelection = async (accountId: string) => {
    const previous = selectedIds;
    const next = previous.includes(accountId) ? previous.filter((id) => id !== accountId) : [...previous, accountId];
    setSelectedIds(next);
    setWorking(true);
    try {
      const data = await metaFetch<{ accounts: MetaAccount[] }>('/api/meta/accounts/select', { method: 'POST', body: JSON.stringify({ accountIds: next }) });
      setStatus((current) => current ? { ...current, accounts: data.accounts } : current);
      setSelectedIds(data.accounts.filter((account) => account.selected).map((account) => account.id));
      toast.success(next.includes(accountId) ? 'Compte lié à Kompilot' : 'Compte dissocié');
    } catch (err) {
      setSelectedIds(previous);
      toast.error('Mise à jour impossible', { description: err instanceof Error ? err.message : 'Erreur inconnue' });
    } finally {
      setWorking(false);
    }
  };

  const reconnect = async () => {
    setWorking(true);
    try {
      const data = await metaFetch<{ url: string }>('/api/meta/oauth/refresh', { method: 'POST' });
      window.location.href = data.url;
    } catch (err) {
      toast.error('Impossible de relancer la connexion', { description: err instanceof Error ? err.message : 'Erreur inconnue' });
      setWorking(false);
    }
  };

  const disconnectAccount = async (accountId: string) => {
    setWorking(true);
    try {
      await metaFetch(`/api/meta/accounts/${accountId}`, { method: 'DELETE' });
      await load();
      toast.success('Compte dissocié de Kompilot');
    } catch (err) {
      toast.error('Dissociation impossible', { description: err instanceof Error ? err.message : 'Erreur inconnue' });
    } finally {
      setWorking(false);
    }
  };

  const disconnectMeta = async () => {
    setWorking(true);
    try {
      await metaFetch('/api/meta/oauth/disconnect', { method: 'POST' });
      await load();
      toast.success('Connexion Meta supprimée');
    } catch (err) {
      toast.error('Déconnexion impossible', { description: err instanceof Error ? err.message : 'Erreur inconnue' });
    } finally {
      setWorking(false);
    }
  };

  if (loading) {
    return <Card><CardHeader><CardTitle>Comptes Meta connectés</CardTitle></CardHeader><CardContent className="space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></CardContent></Card>;
  }

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/60 pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1877F2]/10 text-[#1877F2]"><FacebookGlyph size={20} /></div>
            <div><CardTitle className="text-base">Comptes Meta connectés</CardTitle><p className="mt-1 text-xs text-muted-foreground">Facebook Pages et comptes Instagram Business gérés depuis un seul espace.</p></div>
          </div>
          <Button size="sm" onClick={reconnect} disabled={working} className="shrink-0 gap-2"><ExternalLink size={14} />{status?.connected ? 'Ajouter un compte' : 'Connecter un compte Meta'}</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-5 sm:p-6">
        {error && <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"><AlertCircle size={15} className="mt-0.5 shrink-0" /><div><p>{error}</p><Button variant="ghost" size="sm" onClick={() => void load()} className="mt-2 h-7 px-2 text-xs text-red-700">Réessayer</Button></div></div>}
        {!error && !status?.connected && <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-5 py-8 text-center"><ShieldCheck className="mx-auto mb-3 text-slate-400" size={26} /><p className="text-sm font-semibold text-foreground">Aucun compte Meta connecté</p><p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">La connexion sécurisée vous redirige vers Meta. Kompilot ne conserve jamais vos identifiants Facebook.</p><Button onClick={reconnect} disabled={working} className="mt-4 gap-2"><FacebookGlyph size={15} />Connecter un compte Meta</Button></div>}
        {status?.connected && <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-xs"><span className="flex items-center gap-2 font-semibold text-emerald-800"><Check size={14} />{selectedCount} compte{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}</span><span className="text-emerald-700">{status.expiresAt ? `Token jusqu'au ${new Date(status.expiresAt).toLocaleDateString('fr-FR')}` : 'Token longue durée'}</span></div>
          {(status.status === 'token_expired' || status.status === 'token_error') && <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-start gap-2"><AlertCircle size={16} className="mt-0.5 shrink-0" />{status.status === 'token_error' ? 'Le token Meta ne peut pas être déchiffré. Reconnectez votre compte pour restaurer la sécurité.' : 'Votre session Meta a expiré. Reconnectez-vous pour restaurer la synchronisation.'}</p><Button variant="outline" size="sm" onClick={reconnect} disabled={working} className="gap-2 border-amber-300"><RefreshCw size={14} />Rafraîchir le token</Button></div>}
          {availableAccounts.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-muted-foreground">Aucune Page accessible avec les permissions accordées. Vérifiez que vous administrez une Page Facebook et qu'elle est liée à un compte Instagram professionnel.</div>}
          <div className="grid gap-3 md:grid-cols-2">{availableAccounts.map((account) => { const badge = statusLabel(account); return <div key={account.id} className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${account.selected ? 'border-primary/40 bg-primary/[0.03]' : 'border-slate-200 bg-background'}`}>
            {account.profilePictureUrl ? <ResponsiveImage src={account.profilePictureUrl} alt={`Photo du compte ${account.name}`} width={36} height={36} sizes="36px" className="h-9 w-9 rounded-xl object-cover" /> : <AccountIcon network={account.network} />}
            <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-semibold">{account.name}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{account.network === 'instagram' ? `@${account.username || account.name}` : 'Facebook Page'}{account.parentPageName ? ` · ${account.parentPageName}` : ''}</p></div><span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}>{badge.label}</span></div><div className="mt-3 flex items-center gap-2"><Button size="sm" variant={account.selected ? 'default' : 'outline'} onClick={() => void updateSelection(account.id)} disabled={working || account.status === 'token_expired'} className="h-8 gap-1.5 text-xs">{account.selected ? <Check size={13} /> : <Link2Off size={13} />}{account.selected ? 'Lié à Kompilot' : 'Lier ce compte'}</Button>{account.selected && <Button size="sm" variant="ghost" onClick={() => void disconnectAccount(account.id)} disabled={working} className="h-8 gap-1.5 text-xs text-red-600 hover:text-red-700"><Unlink size={13} />Dissocier</Button>}</div>{account.lastError && <p className="mt-2 text-[11px] text-red-600">{account.lastError}</p>}</div>
          </div>})}</div>
          <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-[11px] text-muted-foreground">Les permissions demandées : Pages, publication et Instagram Business. Les jetons sont chiffrés côté serveur.</p><Button variant="ghost" size="sm" onClick={disconnectMeta} disabled={working} className="w-fit gap-2 text-xs text-red-600 hover:text-red-700"><Loader2 size={13} className={working ? 'animate-spin' : 'hidden'} />Déconnecter Meta</Button></div>
        </>}
      </CardContent>
    </Card>
  );
}