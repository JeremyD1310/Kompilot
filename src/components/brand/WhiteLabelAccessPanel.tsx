import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Copy, Globe2, KeyRound, Loader2, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, toast } from '@blinkdotnew/ui';
import { BACKEND_URL, authHeaders, backendFetch, readBackendError } from '../../lib/backend';

interface DomainConfig { configured: boolean; subdomain?: string; cnameTarget?: string; status?: string; sslStatus?: string; checkedAt?: string; }
interface PartnerKey { id: string; keyName: string; prefix: string; scopes: string[]; isActive: boolean; createdAt: string; }

async function request<T>(path: string, init: RequestInit = {}) {
  const response = await backendFetch(path, { ...init, headers: { ...(await authHeaders(init.body ? true : false)), ...(init.headers ?? {}) } });
  if (!response.ok) throw await readBackendError(response, `Erreur ${response.status}`);
  return response.json() as Promise<T>;
}

export function WhiteLabelAccessPanel() {
  const [domain, setDomain] = useState<DomainConfig | null>(null);
  const [keys, setKeys] = useState<PartnerKey[]>([]);
  const [domainInput, setDomainInput] = useState('');
  const [keyName, setKeyName] = useState('Intégration principale');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [createdKey, setCreatedKey] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [domainData, keyData] = await Promise.all([
        request<DomainConfig>('/api/agency/custom-domain'),
        request<{ keys: PartnerKey[] }>('/api/partner/keys'),
      ]);
      setDomain(domainData);
      setKeys(keyData.keys ?? []);
      if (domainData.subdomain) setDomainInput(domainData.subdomain);
    } catch (error) {
      toast.error('Configuration indisponible', { description: error instanceof Error ? error.message : 'Réessayez.' });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const saveDomain = async () => {
    if (!domainInput.trim()) return;
    setBusy(true);
    try {
      await request('/api/agency/custom-domain', { method: 'POST', body: JSON.stringify({ subdomain: domainInput.trim().toLowerCase() }) });
      toast.success('Domaine enregistré', { description: 'Ajoutez le CNAME indiqué puis lancez une vérification DNS.' });
      await load();
    } catch (error) { toast.error('Domaine invalide', { description: error instanceof Error ? error.message : 'Vérifiez le format.' }); }
    finally { setBusy(false); }
  };

  const checkDomain = async () => {
    setBusy(true);
    try { await request('/api/agency/custom-domain/check', { method: 'POST' }); toast.success('Vérification DNS terminée'); await load(); }
    catch (error) { toast.error('Vérification impossible', { description: error instanceof Error ? error.message : 'Réessayez.' }); }
    finally { setBusy(false); }
  };

  const createKey = async () => {
    setBusy(true);
    try {
      const data = await request<{ apiKey: string }>('/api/partner/keys', { method: 'POST', body: JSON.stringify({ keyName, scopes: ['read'] }) });
      setCreatedKey(data.apiKey);
      toast.success('Clé créée', { description: 'Copiez-la maintenant : elle ne sera plus affichée.' });
      await load();
    } catch (error) { toast.error('Création impossible', { description: error instanceof Error ? error.message : 'Réessayez.' }); }
    finally { setBusy(false); }
  };

  const revokeKey = async (id: string) => {
    setBusy(true);
    try { await request(`/api/partner/keys/${id}`, { method: 'DELETE' }); toast.success('Clé révoquée'); await load(); }
    catch (error) { toast.error('Révocation impossible', { description: error instanceof Error ? error.message : 'Réessayez.' }); }
    finally { setBusy(false); }
  };

  if (loading) return <Card><CardContent className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-primary" /></CardContent></Card>;
  return <div className="grid gap-6 xl:grid-cols-2">
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Globe2 size={18} className="text-primary" /> Domaine marque blanche</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Servez votre espace client sur votre domaine avec votre identité visuelle.</p>
        <div className="flex gap-2"><Input value={domainInput} onChange={event => setDomainInput(event.target.value)} placeholder="app.votre-agence.fr" /><Button onClick={saveDomain} disabled={busy}>Enregistrer</Button></div>
        {domain?.configured && <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3 text-sm"><div className="flex items-center justify-between"><span className="font-semibold">{domain.subdomain}</span><span className={domain.status === 'active' ? 'text-emerald-600' : 'text-amber-600'}>{domain.status === 'active' ? 'Actif' : 'En propagation'}</span></div><p className="text-xs text-muted-foreground">CNAME : <code>{domain.cnameTarget}</code></p><Button variant="outline" size="sm" onClick={checkDomain} disabled={busy} className="gap-2"><RefreshCw size={13} /> Vérifier le DNS</Button></div>}
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck size={14} className="text-primary" /> SSO et connexion restent gérés par Blink Auth.</div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound size={18} className="text-primary" /> API partenaire</CardTitle></CardHeader>
      <CardContent className="space-y-4"><p className="text-sm text-muted-foreground">Donnez à vos outils d’agence un accès lecture contrôlé aux données Kompilot.</p><div className="flex gap-2"><Input value={keyName} onChange={event => setKeyName(event.target.value)} /><Button onClick={createKey} disabled={busy}>Créer une clé</Button></div>{createdKey && <div className="rounded-xl border border-amber-300 bg-amber-50 p-3"><p className="text-xs font-bold text-amber-800 mb-2">Copiez cette clé maintenant</p><div className="flex gap-2"><code className="flex-1 overflow-x-auto text-xs text-amber-900">{createdKey}</code><Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(createdKey)}><Copy size={13} /></Button></div></div>}<div className="space-y-2">{keys.filter(key => key.isActive).map(key => <div key={key.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"><div><p className="text-sm font-semibold">{key.keyName}</p><code className="text-xs text-muted-foreground">{key.prefix}••••••</code></div><Button variant="ghost" size="icon" onClick={() => revokeKey(key.id)} disabled={busy} aria-label="Révoquer"><Trash2 size={14} className="text-red-500" /></Button></div>)}</div>{keys.length === 0 && <p className="text-xs text-muted-foreground">Aucune clé active.</p>}<div className="flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle2 size={14} className="text-emerald-600" /> Les secrets complets ne sont jamais stockés côté navigateur.</div></CardContent>
    </Card>
  </div>;
}
