import { useCallback, useEffect, useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea, toast } from '@blinkdotnew/ui';
import { Copy, Loader2, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { blink } from '../../blink/client';
import { useAuth } from '../../hooks/useAuth';

interface AgencySectorTemplatesRow {
  id: string; userId: string; name: string; sector: string; platform: string;
  hook: string; body: string; cta: string; createdAt?: string;
}

const PLATFORMS = [
  ['linkedin', 'LinkedIn'],
  ['instagram', 'Instagram'],
  ['facebook', 'Facebook'],
  ['tiktok', 'TikTok'],
  ['google_business', 'Google Business'],
] as const;

const emptyForm = { name: '', sector: '', platform: 'instagram', hook: '', body: '', cta: '' };
type TemplateForm = typeof emptyForm;
const templatesTable = blink.db.table<AgencySectorTemplatesRow>('agency_sector_templates');

export function SocialTemplateLibrary({ onUseTemplate }: { onUseTemplate?: (text: string, platform: string) => void }) {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const [templates, setTemplates] = useState<AgencySectorTemplatesRow[]>([]);
  const [form, setForm] = useState<TemplateForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const rows = await templatesTable.list({ where: { userId: id }, orderBy: { createdAt: 'desc' }, limit: 100 });
      setTemplates(rows);
    } catch (error) {
      toast.error('Impossible de charger vos modèles', { description: error instanceof Error ? error.message : 'Réessayez dans un instant.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    void load(userId);
  }, [load, userId]);

  const reset = () => { setForm(emptyForm); setEditingId(null); };
  const update = (key: keyof TemplateForm, value: string) => setForm(current => ({ ...current, [key]: value }));

  const save = async () => {
    if (!userId || !form.name.trim() || !form.body.trim()) {
      toast.error('Ajoutez un nom et le contenu du modèle.');
      return;
    }
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), sector: form.sector.trim() || 'général', platform: form.platform, hook: form.hook.trim(), body: form.body.trim(), cta: form.cta.trim() };
      if (editingId) await templatesTable.update(editingId, payload);
      else await templatesTable.create({ id: crypto.randomUUID(), userId, ...payload });
      await load(userId);
      reset();
      toast.success(editingId ? 'Modèle mis à jour' : 'Modèle enregistré');
    } catch (error) {
      toast.error('Enregistrement impossible', { description: error instanceof Error ? error.message : 'Réessayez dans un instant.' });
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Supprimer ce modèle de publication ?')) return;
    try {
      await templatesTable.delete(id);
      setTemplates(current => current.filter(template => template.id !== id));
      if (editingId === id) reset();
      toast.success('Modèle supprimé');
    } catch (error) {
      toast.error('Suppression impossible', { description: error instanceof Error ? error.message : 'Réessayez dans un instant.' });
    }
  };

  const edit = (template: AgencySectorTemplatesRow) => {
    setForm({
      name: template.name,
      sector: template.sector,
      platform: template.platform,
      hook: template.hook,
      body: template.body,
      cta: template.cta,
    });
    setEditingId(template.id);
  };

  const applyTemplate = (template: AgencySectorTemplatesRow) => {
    const text = [template.hook, template.body, template.cta].filter(Boolean).join('\n\n');
    onUseTemplate?.(text, template.platform);
    toast.success('Modèle chargé dans le planificateur');
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,360px)_1fr]">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Plus className="h-4 w-4 text-primary" /> {editingId ? 'Modifier le modèle' : 'Nouveau modèle'}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Nom du modèle" value={form.name} onChange={event => update('name', event.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Secteur (ex. restauration)" value={form.sector} onChange={event => update('sector', event.target.value)} />
            <Select value={form.platform} onValueChange={value => update('platform', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PLATFORMS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
          </div>
          <Input placeholder="Accroche (optionnel)" value={form.hook} onChange={event => update('hook', event.target.value)} />
          <Textarea placeholder="Corps du modèle… Utilisez vos variables ou vos repères." value={form.body} onChange={event => update('body', event.target.value)} className="min-h-28 resize-none" />
          <Input placeholder="Appel à l'action (optionnel)" value={form.cta} onChange={event => update('cta', event.target.value)} />
          <div className="flex gap-2"><Button onClick={() => void save()} disabled={saving} className="flex-1 gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{editingId ? 'Mettre à jour' : 'Enregistrer'}</Button>{editingId && <Button variant="outline" onClick={reset}>Annuler</Button>}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center justify-between text-base"><span>Mes modèles de publication</span><span className="text-xs font-normal text-muted-foreground">{templates.length} enregistré{templates.length > 1 ? 's' : ''}</span></CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Chargement…</div> : templates.length === 0 ? <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Créez votre premier modèle réutilisable pour garder une communication cohérente sur vos réseaux.</div> : <div className="grid gap-3 sm:grid-cols-2">{templates.map(template => <div key={template.id} className="rounded-xl border border-border bg-background p-4"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-bold text-foreground">{template.name}</p><p className="mt-1 text-[11px] text-primary">{template.sector} · {PLATFORMS.find(([value]) => value === template.platform)?.[1] ?? template.platform}</p></div><div className="flex shrink-0 gap-1"><Button size="icon" variant="ghost" aria-label="Modifier le modèle" onClick={() => edit(template)}><Pencil className="h-3.5 w-3.5" /></Button><Button size="icon" variant="ghost" aria-label="Supprimer le modèle" onClick={() => void remove(template.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></div></div><p className="mt-3 line-clamp-4 whitespace-pre-wrap text-xs leading-5 text-muted-foreground">{[template.hook, template.body, template.cta].filter(Boolean).join('\n\n')}</p><div className="mt-3 flex gap-2"><Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => applyTemplate(template)}><Copy className="h-3.5 w-3.5" /> Utiliser</Button></div></div>)}</div>}
        </CardContent>
      </Card>
    </div>
  );
}

export default SocialTemplateLibrary;
