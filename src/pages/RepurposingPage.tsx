import { useEffect, useState } from 'react';
import { Button, Page, PageBody, PageDescription, PageHeader, PageTitle, toast } from '@blinkdotnew/ui';
import { BookOpen, Check, Clipboard, FileText, Link2, Loader2, RefreshCw, Sparkles, Video } from 'lucide-react';
import { backendFetch, authHeaders, readBackendError } from '../lib/backend';

type Channel = 'linkedin' | 'newsletter' | 'carousel' | 'short_video';
type RepurposeContext = { sourceText: string; sourceLabel?: string; sourceType?: string; recommendationId?: string; recommendationTitle?: string; recommendationDetail?: string; pillarId?: string; pillarLabel?: string; score?: number; brandName?: string; keywords?: string[]; visibilityScore?: number | null };
type Output = { channel: string; title: string; content: string; cta: string; hashtags: string[]; formatHint: string };
const CHANNELS: Array<{ id: Channel; label: string; description: string; icon: typeof FileText }> = [{ id: 'linkedin', label: 'LinkedIn', description: 'Post d’expertise', icon: Link2 }, { id: 'newsletter', label: 'Newsletter', description: 'Email relationnel', icon: BookOpen }, { id: 'carousel', label: 'Carrousel', description: '6 slides structurées', icon: FileText }, { id: 'short_video', label: 'Vidéo courte', description: 'Script 30 secondes', icon: Video }];
const defaultSource = `Les recommandations marketing qui fonctionnent ne sont pas celles qui ajoutent le plus de tâches. Elles transforment une observation en action : choisir un angle clair, publier avec régularité, puis mesurer les leads et le chiffre d’affaires réellement générés. Une bonne stratégie réutilise chaque idée dans le format natif de son canal.`;

export default function RepurposingPage() {
  const [repurposeContext, setRepurposeContext] = useState<RepurposeContext | null>(() => {
    try {
      const raw = sessionStorage.getItem('kompilot_repurpose_source');
      const parsed = raw ? JSON.parse(raw) as RepurposeContext : null;
      return parsed && typeof parsed.sourceText === 'string' ? parsed : null;
    } catch { return null; }
  });
  const [source, setSource] = useState(() => {
    try {
      const raw = sessionStorage.getItem('kompilot_repurpose_source');
      try { const parsed = raw ? JSON.parse(raw) as RepurposeContext : null; if (parsed?.sourceText) return parsed.sourceText; } catch { /* legacy plain text */ }
      return raw || defaultSource;
    } catch { return defaultSource; }
  });
  const [sourceUrl, setSourceUrl] = useState('');
  const [tone, setTone] = useState('expert');
  const [selected, setSelected] = useState<Channel[]>(['linkedin', 'newsletter', 'carousel', 'short_video']);
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [loading, setLoading] = useState(false);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [jobs, setJobs] = useState<Array<{ id: string; sourceLabel: string; createdAt: string; status?: string }>>([]);
  const [latestJobId, setLatestJobId] = useState<string | null>(null);
  const [editableOutputs, setEditableOutputs] = useState<Record<string, string>>({});
  const [approving, setApproving] = useState(false);
  useEffect(() => {
    try {
      sessionStorage.setItem('kompilot_repurpose_source', JSON.stringify({ ...(repurposeContext || {}), sourceText: source, sourceLabel: repurposeContext?.sourceLabel || 'Recommandation Kompilot' }));
    } catch { /* storage unavailable */ }
  }, [source, repurposeContext]);
  const toggle = (channel: Channel) => setSelected(current => current.includes(channel) ? current.filter(item => item !== channel) : [...current, channel]);
  const loadJobs = async () => { try { const response = await backendFetch('/api/content-repurposing/jobs', { headers: await authHeaders() }); if (response.ok) { const result = await response.json() as { jobs: Array<{ id: string; sourceLabel: string; createdAt: string; status?: string }> }; setJobs(result.jobs); } } catch { /* optional history */ } };
  // History is loaded after a generation or by an explicit user action, not on
  // first paint. This keeps the focused workspace free of background 401s.
  const importSource = async () => {
    if (!sourceUrl.trim()) { toast.error('Ajoutez une URL à importer'); return; }
    setSourceLoading(true);
    try {
      const response = await backendFetch('/api/content-repurposing/source', { method: 'POST', headers: await authHeaders(true), body: JSON.stringify({ sourceUrl: sourceUrl.trim() }) });
      if (!response.ok) throw await readBackendError(response, 'Import impossible');
      const result = await response.json() as { sourceText: string };
      setSource(result.sourceText);
      toast.success('Source importée. Vérifiez le texte puis lancez le pack complet.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Import impossible'); } finally { setSourceLoading(false); }
  };
  const generate = async () => {
    if (selected.length === 0) { toast.error('Sélectionnez au moins un canal'); return; }
    setLoading(true);
    try {
      const response = await backendFetch('/api/content-repurposing/generate', { method: 'POST', headers: await authHeaders(true), body: JSON.stringify({ sourceText: source, sourceUrl, sourceLabel: repurposeContext?.sourceLabel || sourceUrl || 'Recommandation Kompilot', sourceType: repurposeContext?.sourceType || (sourceUrl ? 'url' : 'text'), recommendationId: repurposeContext?.recommendationId, recommendationTitle: repurposeContext?.recommendationTitle, recommendationDetail: repurposeContext?.recommendationDetail, pillarId: repurposeContext?.pillarId, tone, channels: selected }) });
      if (!response.ok) throw await readBackendError(response, 'Génération impossible');
      const result = await response.json() as { jobId: string; outputs: Output[]; usedFallback: boolean };
      setLatestJobId(result.jobId);
      setOutputs(result.outputs);
      setEditableOutputs(Object.fromEntries(result.outputs.map(output => [output.channel, output.content])));
      await loadJobs();
      toast.success(result.usedFallback ? 'Pack créé avec le modèle de secours' : 'Pack multi-canal généré');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Génération impossible'); } finally { setLoading(false); }
  };
  const requestApproval = async () => {
    const jobId = latestJobId || jobs[0]?.id;
    if (!jobId) { toast.error('Générez d’abord un pack de contenus.'); return; }
    setApproving(true);
    try {
      const response = await backendFetch(`/api/content-repurposing/${jobId}/approval`, { method: 'POST', headers: await authHeaders(true), body: JSON.stringify({ message: 'Pack prêt à relire avant programmation.', outputs: outputs.map(output => ({ ...output, content: editableOutputs[output.channel] ?? output.content })) }) });
      if (!response.ok) throw await readBackendError(response, 'Envoi pour validation impossible');
      const result = await response.json() as { slackSent: boolean };
      toast.success(result.slackSent ? 'Envoyé pour validation dans Slack' : 'Demande ajoutée au centre de notifications');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Envoi pour validation impossible'); } finally { setApproving(false); }
  };
  const copy = (value: string) => { void navigator.clipboard.writeText(value); toast.success('Contenu copié'); };
  return <Page className="page-enter"><PageHeader><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Sparkles size={20} /></div><div><PageTitle>Repurposing IA</PageTitle><PageDescription>Transformez une recommandation en pack de contenus natifs, prêt à publier sur chaque canal.</PageDescription></div></div></PageHeader><PageBody><div className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]"><section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm"><div><label htmlFor="source" className="mb-2 block text-sm font-bold text-foreground">Votre source</label><textarea id="source" value={source} onChange={event => setSource(event.target.value)} rows={10} className="w-full resize-y rounded-xl border border-border bg-background p-3 text-sm leading-relaxed text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="Collez une recommandation, un article ou un brief…" /></div><div><label htmlFor="source-url" className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted-foreground">URL d’origine (optionnelle)</label><div className="flex gap-2"><input id="source-url" value={sourceUrl} onChange={event => setSourceUrl(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" placeholder="https://votre-site.fr/article" /><Button type="button" variant="outline" size="sm" onClick={importSource} disabled={sourceLoading} className="shrink-0 gap-1.5">{sourceLoading ? <Loader2 size={13} className="animate-spin" /> : <Link2 size={13} />} Importer</Button></div></div><div><p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Ton éditorial</p><div className="flex flex-wrap gap-2">{['expert', 'pédagogique', 'direct', 'premium'].map(option => <button key={option} onClick={() => setTone(option)} className={`rounded-lg border px-3 py-2 text-xs font-semibold capitalize transition ${tone === option ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>{option}</button>)}</div></div><div><p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Canaux à produire</p><div className="grid gap-2 sm:grid-cols-2">{CHANNELS.map(channel => { const Icon = channel.icon; const active = selected.includes(channel.id); return <button key={channel.id} onClick={() => toggle(channel.id)} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{active ? <Check size={15} /> : <Icon size={15} />}</span><span><span className="block text-xs font-bold text-foreground">{channel.label}</span><span className="block text-[11px] text-muted-foreground">{channel.description}</span></span></button>; })}</div></div><Button onClick={generate} disabled={loading} className="h-11 w-full gap-2 font-bold">{loading ? <><Loader2 size={16} className="animate-spin" /> Génération en cours…</> : <><Sparkles size={16} /> Générer le pack multi-canal</>}</Button><p className="text-center text-[11px] text-muted-foreground">Les contenus sont sauvegardés dans votre historique de repurposing.</p></section><section className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-bold text-foreground">Sorties générées</h2><p className="text-xs text-muted-foreground">Chaque sortie est adaptée au code de son canal.</p></div><div className="flex items-center gap-3">{outputs.length > 0 && <button onClick={() => void requestApproval()} disabled={approving} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50">{approving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Envoyer en validation</button>}{outputs.length > 0 && <button onClick={generate} className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"><RefreshCw size={13} /> Régénérer</button>}</div></div>{outputs.length ? outputs.map(output => <article key={output.channel} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"><div className="flex items-center justify-between gap-3 border-b border-border bg-muted/20 px-4 py-3"><div><p className="text-sm font-bold text-foreground">{CHANNELS.find(channel => channel.id === output.channel)?.label || output.channel}</p><p className="text-[11px] text-muted-foreground">{output.formatHint}</p></div><button onClick={() => copy(`${output.content}\n\n${output.cta}\n${output.hashtags.join(' ')}`)} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"><Clipboard size={13} /> Copier</button></div><div className="space-y-3 p-4"><h3 className="text-sm font-bold text-foreground">{output.title}</h3><textarea aria-label={`Modifier le contenu ${output.channel}`} value={editableOutputs[output.channel] ?? output.content} onChange={event => setEditableOutputs(current => ({ ...current, [output.channel]: event.target.value }))} rows={6} className="w-full resize-y rounded-xl border border-border bg-background p-3 text-sm leading-relaxed text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" /><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold text-primary">CTA · {output.cta}</span>{output.hashtags.map(tag => <span key={tag} className="rounded-full bg-primary/8 px-2 py-0.5 text-[11px] text-primary">{tag}</span>)}</div></div></article>) : <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-16 text-center"><Sparkles className="mx-auto mb-3 text-primary" size={26} /><p className="text-sm font-bold text-foreground">Votre pack apparaîtra ici</p><p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">Partez d’une recommandation issue du cockpit IA, ajustez le ton, puis générez quatre formats sans repartir d’une page blanche.</p></div>}<div className="rounded-2xl border border-border bg-card p-4"><div className="flex items-center gap-2 text-sm font-bold text-foreground"><RefreshCw size={15} className="text-primary" /> Historique récent</div>{jobs.length ? <div className="mt-3 space-y-2">{jobs.slice(0, 4).map(job => <div key={job.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 px-3 py-2"><span className="truncate text-xs text-foreground">{job.sourceLabel}</span><span className="flex shrink-0 items-center gap-2 text-[10px] text-muted-foreground">{job.status === 'approved' && <span className="font-semibold text-emerald-600">Approuvé</span>}{new Date(job.createdAt).toLocaleDateString('fr-FR')}</span></div>)}</div> : <p className="mt-2 text-xs text-muted-foreground">Aucune génération sauvegardée.</p>}</div></section></div></PageBody></Page>;
}
