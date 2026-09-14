import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@blinkdotnew/ui'
import { CalendarClock, Pause, Play, Pencil, Trash2, Plus, Loader2, AlertCircle, Eye } from 'lucide-react'
import { toast } from '@blinkdotnew/ui'
import { apiFetch } from '../../hooks/useSocialPublish'

type Platform = 'linkedin' | 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'google_business'
type Frequency = 'daily' | 'weekly' | 'twice_weekly' | 'monthly'
type CampaignStatus = 'active' | 'paused' | 'completed'
interface Campaign {
  id: string
  name: string
  textTemplate: string
  channels: string
  platformVariants: string
  recurrence: Frequency
  startsAt: string
  endsAt?: string
  status: CampaignStatus
  occurrenceCount?: number
  nextRunAt?: string
}

const platforms: { id: Platform; label: string }[] = [
  { id: 'linkedin', label: 'LinkedIn' }, { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' }, { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' }, { id: 'google_business', label: 'Google Business' },
]
const empty = { name: '', textTemplate: '', recurrence: 'weekly' as Frequency, startsAt: '', endsAt: '', channels: [] as Platform[] };
const LOCAL_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;
const dateTimeLocalValue = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}
const frequencyLabels: Record<Frequency, string> = { daily: 'Tous les jours', weekly: 'Chaque semaine', twice_weekly: 'Deux fois par semaine', monthly: 'Chaque mois' }

function parseJson<T>(value: string | undefined, fallback: T): T {
  try { return value ? JSON.parse(value) as T : fallback } catch { return fallback }
}
function formatDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function RecurringCampaignsPanel() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const data = await apiFetch<{ campaigns?: Campaign[] }>('/api/publish/campaigns')
      setCampaigns((data.campaigns ?? []).map(campaign => ({
        ...campaign,
        channels: typeof campaign.channels === 'string' ? campaign.channels : JSON.stringify(campaign.channels ?? []),
        textTemplate: campaign.textTemplate ?? '',
        recurrence: campaign.recurrence ?? 'weekly',
        status: campaign.status ?? 'active',
      })))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de charger les campagnes')
    } finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  const selectedLabels = useMemo(() => form.channels.map(id => platforms.find(item => item.id === id)?.label ?? id), [form.channels])
  const togglePlatform = (platform: Platform) => setForm(current => ({ ...current, channels: current.channels.includes(platform) ? current.channels.filter(item => item !== platform) : [...current.channels, platform] }))
  const reset = () => { setForm(empty); setEditing(null) }

  const save = async () => {
    if (!form.name.trim() || !form.textTemplate.trim() || !form.startsAt || !form.channels.length) {
      toast.error('Complétez le nom, le texte, la date et au moins une plateforme.'); return
    }
    if (form.endsAt && new Date(`${form.endsAt}T23:59:59`).getTime() < new Date(form.startsAt).getTime()) { toast.error('La date de fin doit être après la date de début.'); return }
    if (new Date(form.startsAt).getTime() < Date.now() - 60_000) { toast.error('Choisissez une date de début à venir.'); return }
    setSaving(true)
    try {
      const payload = { name: form.name.trim(), textTemplate: form.textTemplate.trim(), recurrence: form.recurrence, startsAt: new Date(form.startsAt).toISOString(), endsAt: form.endsAt ? new Date(`${form.endsAt}T23:59:59`).toISOString() : undefined, channels: form.channels, timezone: LOCAL_TIMEZONE }
      const path = editing ? `/api/publish/campaigns/${editing}` : '/api/publish/campaigns'
      await apiFetch(path, { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(payload) })
      toast.success(editing ? 'Campagne mise à jour' : 'Campagne récurrente programmée')
      reset(); await load()
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Enregistrement impossible') } finally { setSaving(false) }
  }

  const updateStatus = async (campaign: Campaign) => {
    const status = campaign.status === 'active' ? 'paused' : 'active'
    try { await apiFetch(`/api/publish/campaigns/${campaign.id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); toast.success(status === 'active' ? 'Campagne reprise' : 'Campagne mise en pause'); await load() }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Statut impossible à mettre à jour') }
  }
  const remove = async (id: string) => {
    if (!window.confirm('Supprimer cette campagne récurrente ?')) return
    try { await apiFetch(`/api/publish/campaigns/${id}`, { method: 'DELETE' }); toast.success('Campagne supprimée'); await load() }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Suppression impossible') }
  }
  const edit = (campaign: Campaign) => {
    const channels = parseJson<Platform[]>(campaign.channels, [])
    const startsAt = dateTimeLocalValue(campaign.startsAt)
    setEditing(campaign.id); setForm({ name: campaign.name, textTemplate: campaign.textTemplate, recurrence: campaign.recurrence, startsAt, endsAt: campaign.endsAt?.slice(0, 10) ?? '', channels })
  }

  return <div className="space-y-5">
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5 text-primary" /> {editing ? 'Modifier la campagne' : 'Campagnes récurrentes'}</CardTitle><p className="text-sm text-muted-foreground">Une cadence éditoriale crée des occurrences dans votre calendrier. Vérifiez l’aperçu avant de programmer.</p></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Nom de la campagne" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} />
          <Select value={form.recurrence} onValueChange={value => setForm({ ...form, recurrence: value as Frequency })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(frequencyLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
          <Input type="datetime-local" value={form.startsAt} onChange={event => setForm({ ...form, startsAt: event.target.value })} />
          <Input type="date" value={form.endsAt} onChange={event => setForm({ ...form, endsAt: event.target.value })} />
          <p className="text-[11px] text-muted-foreground md:col-span-2">Fuseau horaire utilisé : {LOCAL_TIMEZONE}</p>
        </div>
        <textarea className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" placeholder="Texte de la publication récurrente…" value={form.textTemplate} onChange={event => setForm({ ...form, textTemplate: event.target.value })} />
        <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Réseaux cibles {selectedLabels.length > 0 && `· ${selectedLabels.join(', ')}`}</p><div className="flex flex-wrap gap-2">{platforms.map(platform => <Button key={platform.id} type="button" size="sm" variant={form.channels.includes(platform.id) ? 'default' : 'outline'} onClick={() => togglePlatform(platform.id)}>{platform.label}</Button>)}</div></div>
        {form.textTemplate && form.channels.length > 0 && <div className="rounded-xl border border-primary/20 bg-primary/5 p-4"><p className="mb-3 flex items-center gap-2 text-sm font-semibold"><Eye className="h-4 w-4 text-primary" /> Aperçu avant programmation</p><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{form.channels.map(channel => <div key={channel} className="rounded-lg border border-border bg-background p-3"><p className="mb-2 text-xs font-semibold text-primary">{platforms.find(item => item.id === channel)?.label}</p><p className="whitespace-pre-wrap text-sm text-foreground">{form.textTemplate}</p></div>)}</div></div>}
        <div className="flex flex-wrap justify-end gap-2"><Button variant="ghost" onClick={reset}>{editing ? 'Annuler' : 'Réinitialiser'}</Button><Button onClick={() => void save()} disabled={saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{editing ? 'Mettre à jour' : 'Programmer la campagne'}</Button></div>
      </CardContent>
    </Card>
    {loading && <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Chargement des campagnes…</div>}
    {error && <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"><AlertCircle className="h-4 w-4" />{error}<Button size="sm" variant="outline" onClick={() => void load()}>Réessayer</Button></div>}
    {!loading && !error && campaigns.length === 0 && <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Aucune campagne récurrente. Votre prochaine série de publications commence ici.</div>}
    <div className="grid gap-3">{campaigns.map(campaign => { const channels = parseJson<Platform[]>(campaign.channels, []); const startsAt = campaign.startsAt ? new Date(campaign.startsAt) : undefined; const endsAt = campaign.endsAt ? new Date(campaign.endsAt) : undefined; const nextRunAt = campaign.nextRunAt ? new Date(campaign.nextRunAt) : undefined; return <Card key={campaign.id}><CardContent className="flex flex-wrap items-center justify-between gap-4 p-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-foreground">{campaign.name}</p><Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>{campaign.status === 'active' ? 'Active' : campaign.status === 'paused' ? 'En pause' : 'Terminée'}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{frequencyLabels[campaign.recurrence]} · dès le {formatDate(startsAt?.toISOString())} · {channels.map(channel => platforms.find(item => item.id === channel)?.label ?? channel).join(', ')}</p><p className="mt-1 text-xs text-muted-foreground">{campaign.occurrenceCount ?? 0} occurrence(s) · prochaine: {formatDate(nextRunAt?.toISOString())}</p><p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{campaign.textTemplate}</p></div><div className="flex shrink-0 gap-1"><Button size="icon" variant="ghost" aria-label="Modifier" onClick={() => edit(campaign)}><Pencil className="h-4 w-4" /></Button>{campaign.status !== 'completed' && <Button size="icon" variant="ghost" aria-label={campaign.status === 'active' ? 'Mettre en pause' : 'Reprendre'} onClick={() => void updateStatus(campaign)}>{campaign.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</Button>}<Button size="icon" variant="ghost" aria-label="Supprimer" onClick={() => void remove(campaign.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></CardContent></Card> })}</div>
  </div>
}
export default RecurringCampaignsPanel
