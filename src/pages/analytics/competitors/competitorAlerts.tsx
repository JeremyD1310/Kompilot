import { useEffect, useState } from 'react';
import { Bell, BellOff, Plus, Trash2 } from 'lucide-react';
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, toast } from '@blinkdotnew/ui';
import { blink } from '../../../blink/client';
import { BACKEND_URL } from '../../../lib/backend';
import type { Competitor } from './types';

interface CompetitorAlert {
  id: string;
  competitorId: string;
  competitorName: string;
  metric: string;
  operator: 'above' | 'below';
  threshold: number;
  cadence: string;
  enabled: boolean | string;
}

async function request<T>(path: string, init: RequestInit = {}) {
  const token = await blink.auth.getValidToken();
  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || `Erreur ${response.status}`);
  return body as T;
}

export function CompetitorAlerts({ competitors }: { competitors: Competitor[] }) {
  const [alerts, setAlerts] = useState<CompetitorAlert[]>([]);
  const [competitorId, setCompetitorId] = useState(competitors[0]?.id ?? '');
  const [metric, setMetric] = useState('engagement');
  const [operator, setOperator] = useState<'above' | 'below'>('above');
  const [threshold, setThreshold] = useState('5');
  const [cadence, setCadence] = useState('daily');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!competitorId && competitors[0]?.id) setCompetitorId(competitors[0].id);
  }, [competitors, competitorId]);

  const loadAlerts = async () => {
    try {
      const data = await request<{ alerts: CompetitorAlert[] }>('/api/competitor-alerts');
      setAlerts(data.alerts ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Alertes indisponibles');
    }
  };

  useEffect(() => { void loadAlerts(); }, []);

  const createAlert = async () => {
    const competitor = competitors.find(item => item.id === competitorId);
    const value = Number(threshold);
    if (!competitor || !Number.isFinite(value)) return;
    setSaving(true);
    try {
      const data = await request<{ alert: CompetitorAlert }>('/api/competitor-alerts', {
        method: 'POST',
        body: JSON.stringify({ competitorId, competitorName: competitor.name, metric, operator, threshold: value, cadence, channels: ['in_app'] }),
      });
      setAlerts(previous => [data.alert, ...previous]);
      toast.success('Alerte concurrent créée');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible de créer l’alerte');
    } finally { setSaving(false); }
  };

  const toggleAlert = async (alert: CompetitorAlert) => {
    try {
      const data = await request<{ alert: CompetitorAlert }>(`/api/competitor-alerts/${alert.id}`, { method: 'PATCH', body: JSON.stringify({ enabled: !Number(alert.enabled) }) });
      setAlerts(previous => previous.map(item => item.id === alert.id ? data.alert : item));
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Impossible de modifier l’alerte'); }
  };

  const removeAlert = async (id: string) => {
    try {
      await request(`/api/competitor-alerts/${id}`, { method: 'DELETE' });
      setAlerts(previous => previous.filter(alert => alert.id !== id));
      toast.success('Alerte supprimée');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Impossible de supprimer l’alerte'); }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div><h3 className="flex items-center gap-2 text-base font-bold"><Bell size={16} className="text-primary" /> Alertes personnalisées</h3><p className="mt-1 text-xs text-muted-foreground">Définissez les seuils de veille prioritaires pour chaque concurrent.</p></div>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">{alerts.filter(alert => Number(alert.enabled) > 0).length} active(s)</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <Select value={competitorId} onValueChange={setCompetitorId}><SelectTrigger><SelectValue placeholder="Concurrent" /></SelectTrigger><SelectContent>{competitors.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>
        <Select value={metric} onValueChange={setMetric}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="engagement">Engagement</SelectItem><SelectItem value="posts_per_week">Posts / semaine</SelectItem><SelectItem value="followers">Abonnés</SelectItem><SelectItem value="last_post_days">Jours depuis post</SelectItem></SelectContent></Select>
        <Select value={operator} onValueChange={value => setOperator(value as 'above' | 'below')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="above">Dépasse</SelectItem><SelectItem value="below">Passe sous</SelectItem></SelectContent></Select>
        <Input type="number" min="0" step="0.1" value={threshold} onChange={event => setThreshold(event.target.value)} placeholder="Seuil" />
        <Select value={cadence} onValueChange={setCadence}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="daily">Chaque jour</SelectItem><SelectItem value="weekly">Chaque semaine</SelectItem></SelectContent></Select>
      </div>
      <Button onClick={() => void createAlert()} disabled={saving || !competitorId} className="gap-2"><Plus size={14} /> Créer l’alerte</Button>
      <div className="space-y-2">{alerts.map(alert => <div key={alert.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border px-3 py-2.5"><div className="flex-1 min-w-0"><p className="text-xs font-bold text-foreground">{alert.competitorName}</p><p className="text-[11px] text-muted-foreground">{alert.metric} {alert.operator === 'above' ? 'dépasse' : 'passe sous'} {alert.threshold} · {alert.cadence === 'daily' ? 'quotidien' : 'hebdomadaire'}</p></div><button onClick={() => void toggleAlert(alert)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" title={Number(alert.enabled) ? 'Désactiver' : 'Activer'}>{Number(alert.enabled) ? <Bell size={14} className="text-primary" /> : <BellOff size={14} />}</button><button onClick={() => void removeAlert(alert.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Supprimer"><Trash2 size={14} /></button></div>)}</div>
      {alerts.length === 0 && <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">Aucune alerte. Créez votre première règle de veille.</p>}
    </section>
  );
}
