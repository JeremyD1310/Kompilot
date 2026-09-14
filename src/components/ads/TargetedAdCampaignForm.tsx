import { useEffect, useState } from 'react';
import { Button, Input, Textarea, Card, CardContent, Badge, toast } from '@blinkdotnew/ui';
import { Target, Rocket } from 'lucide-react';
import { apiFetch } from '../../hooks/useSocialPublish';

interface Campaign { id?: string; name: string; objective: string; budgetCents?: number; dailyBudgetCents?: number; status?: string; platform?: string; providerStatus?: string; }

interface TargetedAdCampaignFormProps { open?: boolean; onOpenChange?: (open: boolean) => void; }

export function TargetedAdCampaignForm({ open: controlledOpen, onOpenChange }: TargetedAdCampaignFormProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (value: boolean) => { setInternalOpen(value); onOpenChange?.(value); };
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [form, setForm] = useState({ name: '', platform: 'meta', objective: 'Conversions', locations: '', ageMin: '25', ageMax: '54', interests: '', budget: '20', startDate: '', endDate: '', creativeText: '', imageUrl: '' });
  useEffect(() => { apiFetch<{ campaigns: Campaign[] }>('/api/ad-campaigns').then(r => setCampaigns(r.campaigns ?? [])).catch(() => undefined); }, []);
  const update = (key: string, value: string) => setForm(current => ({ ...current, [key]: value }));
  const save = async () => {
    try {
      const dailyBudgetCents = Math.round(Number(form.budget) * 100);
      if (!form.name.trim() || !form.startDate) { toast.error('Indiquez un nom et une date de début.'); return; }
      const result = await apiFetch<{ campaign: Campaign }>('/api/ad-campaigns', { method: 'POST', body: JSON.stringify({ name: form.name, platform: form.platform, objective: form.objective, audience: { locations: form.locations.split(',').map(v => v.trim()).filter(Boolean), ageMin: Number(form.ageMin), ageMax: Number(form.ageMax), interests: form.interests.split(',').map(v => v.trim()).filter(Boolean) }, budgetCents: dailyBudgetCents, dailyBudgetCents, startDate: form.startDate, endDate: form.endDate, creativeText: form.creativeText, imageUrl: form.imageUrl, status: 'draft' }) });
      setCampaigns(current => [result.campaign, ...current]); setOpen(false); toast.success('Campagne enregistrée');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Impossible de créer la campagne'); }
  };
  const launch = async (campaign: Campaign) => {
    try { await apiFetch(`/api/ad-campaigns/${campaign.id}/launch`, { method: 'POST' }); toast.success('Campagne lancée'); }
    catch (error) {
      const code = (error as Error & { code?: string }).code;
      const message = code === 'PROVIDER_API_NOT_CONFIGURED'
        ? 'La campagne est enregistrée, mais le lancement live Meta nécessite encore la configuration de l’API publicitaire.'
        : error instanceof Error ? error.message : 'Impossible de lancer la campagne';
      toast.info(message);
    }
  };
  return <div className="space-y-3">
    <Button variant="outline" size="sm" onClick={() => setOpen(!open)} className="gap-2"><Target className="h-4 w-4" /> Créer une campagne ciblée</Button>
    {open && <Card><CardContent className="p-4 grid gap-3 sm:grid-cols-2">
      <Input placeholder="Nom de campagne" value={form.name} onChange={e => update('name', e.target.value)} />
      <select className="h-10 rounded-md border bg-background px-3 text-sm" value={form.platform} onChange={e => update('platform', e.target.value)}><option value="meta">Meta Ads</option><option value="tiktok">TikTok Ads</option></select>
      <Input placeholder="Objectif (Conversions, Trafic...)" value={form.objective} onChange={e => update('objective', e.target.value)} />
      <Input placeholder="Lieux, séparés par des virgules" value={form.locations} onChange={e => update('locations', e.target.value)} />
      <div className="flex gap-2"><Input type="number" min="13" placeholder="Âge min" value={form.ageMin} onChange={e => update('ageMin', e.target.value)} /><Input type="number" max="100" placeholder="Âge max" value={form.ageMax} onChange={e => update('ageMax', e.target.value)} /></div>
      <Input placeholder="Centres d'intérêt" value={form.interests} onChange={e => update('interests', e.target.value)} />
      <Input type="number" min="1" placeholder="Budget quotidien (€)" value={form.budget} onChange={e => update('budget', e.target.value)} />
      <Input type="date" value={form.startDate} onChange={e => update('startDate', e.target.value)} />
      <Input type="date" value={form.endDate} onChange={e => update('endDate', e.target.value)} />
      <Textarea className="sm:col-span-2" placeholder="Texte créatif" value={form.creativeText} onChange={e => update('creativeText', e.target.value)} />
      <Input className="sm:col-span-2" placeholder="URL de l'image (optionnel)" value={form.imageUrl} onChange={e => update('imageUrl', e.target.value)} />
      <div className="sm:col-span-2 flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button><Button onClick={save} className="gap-2"><Rocket className="h-4 w-4" /> Enregistrer</Button></div>
    </CardContent></Card>}
    {campaigns.map(c => <div key={c.id ?? c.name} className="flex items-center justify-between rounded-lg border p-3"><div><p className="font-semibold">{c.name}</p><Badge variant="secondary">{c.platform ?? 'meta'} · {c.objective} · {((c.dailyBudgetCents ?? c.budgetCents ?? 0) / 100).toFixed(2)} €/j</Badge></div><Button size="sm" onClick={() => launch(c)} disabled={c.status === 'active'}><Rocket className="h-4 w-4 mr-1" /> {c.status === 'active' ? 'Active' : 'Lancer'}</Button></div>)}
  </div>;
}
