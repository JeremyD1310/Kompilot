import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CalendarDays, Check, FileText, Plus, Trash2, X } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea, toast } from '@blinkdotnew/ui';
import { blink } from '../../blink/client';
import { useAuth } from '../../hooks/useAuth';

interface CustomActivityReportsRow {
  id: string; userId: string; name: string; description: string; dateRange: string;
  startDate: string | null; endDate: string | null; metricsJson: string; channelsJson: string;
  includeActivity: number; schedule: string; createdAt: string; updatedAt: string;
}

const METRICS = [
  { id: 'posts', label: 'Publications' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'reach', label: 'Portée' },
  { id: 'activity', label: 'Activité équipe' },
];

const CHANNELS = ['linkedin', 'instagram', 'facebook', 'google_business', 'tiktok'];

function parseList(value: string) {
  try { return JSON.parse(value) as string[]; } catch { return []; }
}

export function CustomActivityReportBuilder({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [reports, setReports] = useState<CustomActivityReportsRow[]>([]);
  const [name, setName] = useState('Rapport activité mensuel');
  const [description, setDescription] = useState('');
  const [dateRange, setDateRange] = useState('last_30_days');
  const [metrics, setMetrics] = useState(['posts', 'engagement', 'reach']);
  const [channels, setChannels] = useState<string[]>([]);
  const [includeActivity, setIncludeActivity] = useState(true);
  const [saving, setSaving] = useState(false);

  const table = useMemo(() => blink.db.table<CustomActivityReportsRow>('custom_activity_reports'), []);

  const loadReports = async () => {
    if (!user?.id) return;
    const rows = await table.list({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' }, limit: 20 });
    setReports(rows);
  };

  useEffect(() => { void loadReports(); }, [user?.id]);

  const toggle = (value: string, values: string[], setter: (next: string[]) => void) => {
    setter(values.includes(value) ? values.filter(item => item !== value) : [...values, value]);
  };

  const save = async () => {
    if (!user?.id || !name.trim()) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      await table.create({
        userId: user.id,
        name: name.trim(),
        description: description.trim(),
        dateRange,
        startDate: null,
        endDate: null,
        metricsJson: JSON.stringify(metrics),
        channelsJson: JSON.stringify(channels),
        includeActivity: includeActivity ? 1 : 0,
        schedule: 'manual',
        createdAt: now,
        updatedAt: now,
      });
      await loadReports();
      toast.success('Rapport personnalisé créé');
      setName('');
      setDescription('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible de créer le rapport');
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    try {
      await table.delete(id);
      await loadReports();
      toast.success('Rapport supprimé');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible de supprimer le rapport');
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-slate-950/50 p-4 sm:p-8" role="dialog" aria-modal="true" aria-label="Rapports personnalisés">
      <Card className="my-4 w-full max-w-4xl shadow-2xl">
        <CardHeader className="flex flex-row items-start justify-between gap-4 border-b">
          <div>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Rapports d’activité personnalisés</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Choisissez les indicateurs et canaux à suivre, puis retrouvez vos rapports ici.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer"><X className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent className="grid gap-6 p-5 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="report-name">Nom du rapport</Label><Input id="report-name" value={name} onChange={event => setName(event.target.value)} placeholder="Ex. Bilan client — septembre" /></div>
            <div className="space-y-1.5"><Label htmlFor="report-description">Description (optionnel)</Label><Textarea id="report-description" value={description} onChange={event => setDescription(event.target.value)} placeholder="Le contexte ou l’objectif de ce rapport…" className="min-h-20 resize-none" /></div>
            <div className="space-y-2"><Label className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Période</Label><select value={dateRange} onChange={event => setDateRange(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="last_7_days">7 derniers jours</option><option value="last_30_days">30 derniers jours</option><option value="last_90_days">90 derniers jours</option><option value="this_month">Ce mois-ci</option></select></div>
            <fieldset className="space-y-2"><legend className="text-sm font-medium">Indicateurs</legend><div className="grid grid-cols-2 gap-2">{METRICS.map(metric => <button type="button" key={metric.id} onClick={() => toggle(metric.id, metrics, setMetrics)} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${metrics.includes(metric.id) ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}>{metric.label}{metrics.includes(metric.id) && <Check className="h-4 w-4" />}</button>)}</div></fieldset>
            <fieldset className="space-y-2"><legend className="text-sm font-medium">Canaux (tous si aucun n’est sélectionné)</legend><div className="flex flex-wrap gap-2">{CHANNELS.map(channel => <button type="button" key={channel} onClick={() => toggle(channel, channels, setChannels)} className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${channels.includes(channel) ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'}`}>{channel.replace('_', ' ')}</button>)}</div></fieldset>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeActivity} onChange={event => setIncludeActivity(event.target.checked)} className="h-4 w-4 accent-primary" /> Inclure l’activité de l’équipe</label>
            <Button onClick={save} disabled={saving || !name.trim()} className="w-full gap-2"><Plus className="h-4 w-4" /> {saving ? 'Création…' : 'Créer le rapport'}</Button>
          </div>
          <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4"><div><p className="text-sm font-semibold">Mes rapports</p><p className="text-xs text-muted-foreground">Vos configurations sont sauvegardées par compte.</p></div>{reports.length === 0 ? <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground"><FileText className="mx-auto mb-2 h-5 w-5" />Aucun rapport personnalisé</div> : reports.map(report => <div key={report.id} className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{report.name}</p><p className="mt-1 text-xs text-muted-foreground">{report.dateRange === 'last_7_days' ? '7 derniers jours' : report.dateRange === 'last_90_days' ? '90 derniers jours' : '30 derniers jours'} · {parseList(report.metricsJson).length} indicateurs</p></div><Button variant="ghost" size="icon" onClick={() => void remove(report.id)} aria-label={`Supprimer ${report.name}`}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>)}</div>
        </CardContent>
      </Card>
    </div>
  );
}
