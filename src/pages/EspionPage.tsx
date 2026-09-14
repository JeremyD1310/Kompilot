import { useEffect, useMemo, useRef, useState } from 'react';
import { Page, PageBody, PageDescription, PageHeader, PageTitle, Button, Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge, toast } from '@blinkdotnew/ui';
import { blink } from '../blink/client';
import { AlertTriangle, BarChart3, Download, Eye, FileAudio, FolderPlus, Heart, Loader2, Megaphone, MessageCircle, RefreshCw, Save, Send, ShieldCheck, Share2, Target, Trash2 } from 'lucide-react';
import { useAddEspionComment, useCreateEspionFolder, useCreateEspionScan, useDeleteEspionComment, useDeleteEspionSwipe, useEspionAnalyses, useEspionComments, useEspionFolders, useEspionScans, useEspionShares, useEspionSwipes, useProcessEspionScan, useResumeEspionScan, useSaveEspionSwipe, useShareEspionAnalysis, useSharedEspionAnalyses, useUpdateEspionSwipe, downloadEspionAnalysisCsv } from '../hooks/useEspion';
import type { EspionAnalysis, EspionAnalysisPayload, EspionScan, EspionSwipe } from '../lib/espionTypes';

const axisLabels = ['Bénéfices', 'Preuves', 'Problème ciblé', 'USP', 'Pricing / Offre', 'Fonctionnement produit', 'Arguments', 'La marque'];

function statusLabel(status?: string) {
  if (status === 'active_ads') return 'Publicités actives détectées';
  if (status === 'no_active_ads') return 'Aucune pub active confirmée';
  return 'Scan inconclusif — à reprendre';
}

function InsightList({ title, values }: { title: string; values?: string[] }) {
  if (!values?.length) return null;
  return <div><p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{title}</p><ul className="mt-2 space-y-1">{values.slice(0, 5).map((value, index) => <li key={`${title}-${index}`} className="text-xs leading-relaxed text-foreground/80">{value}</li>)}</ul></div>;
}

function AnalysisCard({ item, onExport, onSave }: { item: EspionAnalysis; onExport: () => void; onSave: () => void }) {
  const data = item.analysis as EspionAnalysisPayload;
  const [comment, setComment] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const { data: commentsData } = useEspionComments(item.id);
  const { data: sharesData } = useEspionShares(item.id);
  const addComment = useAddEspionComment(item.id);
  const deleteComment = useDeleteEspionComment(item.id);
  const shareAnalysis = useShareEspionAnalysis(item.id);
  const comments = commentsData?.comments ?? [];
  const submitComment = async () => { if (!comment.trim()) return; try { await addComment.mutateAsync({ body: comment.trim() }); setComment(''); toast.success('Commentaire ajouté à la discussion'); } catch (error) { toast.error(error instanceof Error ? error.message : 'Commentaire impossible'); } };
  const removeComment = async (commentId: string) => { try { await deleteComment.mutateAsync(commentId); toast.success('Commentaire supprimé'); } catch (error) { toast.error(error instanceof Error ? error.message : 'Suppression impossible'); } };
  const submitShare = async () => { if (!shareEmail.trim()) return; try { await shareAnalysis.mutateAsync({ email: shareEmail.trim() }); setShareEmail(''); toast.success('Pépite partagée avec le membre de l’équipe'); } catch (error) { toast.error(error instanceof Error ? error.message : 'Partage impossible'); } };
  const axes = data.axes ?? [];
  return (
    <article id={`espion-analysis-${item.id}`} className="scroll-mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="outline">{item.platform}</Badge>
            <Badge variant="secondary">{data.creativeType || item.creativeType}</Badge>
            <span className="text-[11px] text-muted-foreground">{statusLabel(data.adActivityStatus)}</span>
          </div>
          <h2 className="text-lg font-bold text-foreground truncate">{item.advertiserName || 'Annonceur non renseigné'}</h2>
          <p className="text-sm text-muted-foreground line-clamp-2">{item.description || 'Description non détectée'}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Risque de faux positif : {data.falsePositiveRisk || 'élevé'}{data.falsePositiveReason ? ` · ${data.falsePositiveReason}` : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-primary/10 px-3 py-2 text-center"><div className="text-xl font-black text-primary">{item.overallScore}</div><div className="text-[9px] uppercase text-primary/70">Score</div></div>
          <Button variant="outline" size="icon" onClick={onExport} title="Exporter CSV"><Download size={15} /></Button>
        </div>
      </header>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {axisLabels.map(label => {
          const axis = axes.find(value => value.label === label);
          return <div key={label} className="rounded-xl bg-muted/40 p-3"><div className="flex justify-between gap-2 text-[10px] font-bold uppercase text-muted-foreground"><span>{label}</span><span className="text-primary">{axis?.score ?? 0}</span></div><div className="mt-2 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${axis?.score ?? 0}%` }} /></div><p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-foreground/75">{axis?.summary || 'Non détecté'}</p></div>;
        })}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-border p-3"><p className="text-[10px] uppercase text-muted-foreground">Hook / framework</p><p className="mt-1 text-sm font-semibold text-foreground">{data.threeSecondHook || data.hook || 'Non détecté'}</p><p className="mt-1 text-xs text-muted-foreground">{data.copyFramework || 'Framework non détecté'}</p></div>
        <div className="rounded-xl border border-border p-3"><p className="text-[10px] uppercase text-muted-foreground">Offre / funnel</p><p className="mt-1 text-sm font-semibold text-foreground">{data.offer || 'Offre non détectée'}</p><p className="mt-1 text-xs text-muted-foreground">{data.checkoutType || 'Checkout non détecté'} · {data.upsell || 'Upsell non détecté'}</p></div>
        <div className="rounded-xl border border-border p-3"><p className="text-[10px] uppercase text-muted-foreground">Signal media buyer</p><p className="mt-1 text-sm font-semibold text-foreground">{data.scalingSignal || 'Scaling non détecté'}</p><p className="mt-1 text-xs text-muted-foreground">{data.evergreen ? 'Evergreen probable' : data.saturationSignal || 'Saturation non détectée'}</p></div>
      </div>
      <div className="grid gap-4 border-t border-border pt-4 md:grid-cols-3"><InsightList title="Points forts" values={data.strengths} /><InsightList title="Risques" values={data.risks} /><InsightList title="Recommandations" values={data.recommendations} /></div>
      {data.transcript && <details className="rounded-xl border border-border p-3"><summary className="cursor-pointer text-xs font-semibold text-foreground">Afficher le script / la transcription</summary><p className="mt-3 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">{data.transcript}</p></details>}
      {data.assets?.length ? <div className="flex flex-wrap gap-2">{data.assets.map((asset, index) => <a key={`${asset.url}-${index}`} href={asset.url} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/5">{asset.label}</a>)}</div> : null}
      <div className="grid gap-4 border-t border-border pt-4 lg:grid-cols-2"><div><div className="mb-2 flex items-center gap-2 text-xs font-bold text-foreground"><MessageCircle size={14} className="text-primary" /> Discussion équipe <span className="text-muted-foreground">({comments.length})</span></div><div className="max-h-32 space-y-2 overflow-y-auto">{comments.map(value => <div key={value.id} className="rounded-lg bg-muted/50 px-3 py-2 text-xs"><div className="flex items-center justify-between gap-2"><span className="font-semibold text-foreground">{value.authorEmail}</span><Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => void removeComment(value.id)} disabled={deleteComment.isPending} title="Supprimer le commentaire"><Trash2 size={12} /></Button></div><p className="mt-1 text-muted-foreground">{value.body}</p></div>)}{comments.length === 0 && <p className="text-xs text-muted-foreground">Aucun commentaire. Ajoutez le premier angle à challenger.</p>}</div><div className="mt-2 flex gap-2"><Input value={comment} onChange={event => setComment(event.target.value)} placeholder="Annoter cette pépite…" onKeyDown={event => { if (event.key === 'Enter') void submitComment(); }} /><Button size="icon" onClick={submitComment} disabled={addComment.isPending} title="Ajouter"><Send size={14} /></Button></div></div><div><div className="mb-2 flex items-center gap-2 text-xs font-bold text-foreground"><Share2 size={14} className="text-primary" /> Partager avec l’équipe</div><div className="flex gap-2"><Input value={shareEmail} onChange={event => setShareEmail(event.target.value)} placeholder="email@equipe.fr" /><Button variant="outline" size="icon" onClick={submitShare} disabled={shareAnalysis.isPending} title="Partager"><Share2 size={14} /></Button></div><p className="mt-2 text-[11px] text-muted-foreground">{sharesData?.shares?.length ?? 0} membre(s) autorisé(s) à commenter.</p></div></div>
      <div className="flex flex-wrap gap-2 border-t border-border pt-4"><Button variant="outline" size="sm" onClick={onSave}><Save size={14} /> Ajouter au Swipe File</Button><span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><ShieldCheck size={13} /> Confiance source : {data.sourceConfidence ?? 0}%</span></div>
    </article>
  );
}

export default function EspionPage() {
  const [form, setForm] = useState({ advertiserName: '', targetUrl: '', adName: '', adText: '', platform: 'meta' });
  const [transcribing, setTranscribing] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const { data: analysesData, isLoading: analysesLoading } = useEspionAnalyses();
  const { data: sharedData } = useSharedEspionAnalyses();
  const { data: scansData } = useEspionScans();
  const { data: foldersData } = useEspionFolders();
  const { data: swipesData } = useEspionSwipes();
  const createFolder = useCreateEspionFolder();
  const updateSwipe = useUpdateEspionSwipe();
  const deleteSwipe = useDeleteEspionSwipe();
  const createScan = useCreateEspionScan();
  const processScan = useProcessEspionScan();
  const resumeScan = useResumeEspionScan();
  const saveSwipe = useSaveEspionSwipe();
  const analyses = [...(analysesData?.analyses ?? []), ...(sharedData?.analyses ?? [])].filter((item, index, list) => list.findIndex(candidate => candidate.id === item.id) === index);
  const firstScanAnalysis = analyses[analyses.length - 1] ?? null;
  const activeScans = useMemo(() => (scansData?.scans ?? []).filter(scan => ['queued', 'running', 'retryable_failed', 'partial'].includes(scan.status)), [scansData]);
  const autoResumed = useRef(new Set<string>());

  const runScan = async () => {
    if (!form.advertiserName.trim() && !form.targetUrl.trim()) { toast.error('Renseignez un annonceur ou une URL à analyser'); return; }
    try {
      const created = await createScan.mutateAsync(form);
      await processScan.mutateAsync(created.scanId);
      toast.success('Rapport Espion généré');
      setForm({ advertiserName: '', targetUrl: '', adName: '', adText: '', platform: 'meta' });
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Le scan n’a pas pu aboutir'); }
  };
  const exportAnalysis = async (id: string) => { try { await downloadEspionAnalysisCsv(id); toast.success('Export CSV téléchargé'); } catch (error) { toast.error(error instanceof Error ? error.message : 'Export impossible'); } };
  const saveAnalysis = async (item: EspionAnalysis) => { try { await saveSwipe.mutateAsync({ analysisId: item.id, folderId: selectedFolderId || undefined, title: `${item.advertiserName} — ${item.adName || 'créa'}`, tags: [item.platform, item.creativeType] }); toast.success(selectedFolderId ? 'Pépite classée dans le Swipe File' : 'Ajouté au Swipe File'); } catch (error) { toast.error(error instanceof Error ? error.message : 'Impossible de sauvegarder'); } };
  const toggleFavorite = async (swipe: EspionSwipe) => { try { await updateSwipe.mutateAsync({ id: swipe.id, isFavorite: !swipe.isFavorite }); } catch (error) { toast.error(error instanceof Error ? error.message : 'Impossible de modifier le favori'); } };
  const removeSwipe = async (swipe: EspionSwipe) => { try { await deleteSwipe.mutateAsync(swipe.id); toast.success('Pépite retirée du Swipe File'); } catch (error) { toast.error(error instanceof Error ? error.message : 'Suppression impossible'); } };
  const resumePendingScan = async (scan: EspionScan) => { try { await resumeScan.mutateAsync(scan); toast.success('Scan repris et rapport actualisé'); } catch (error) { toast.error(error instanceof Error ? error.message : 'Impossible de reprendre le scan'); } };
  const transcribeAd = async (file: File) => { if (file.size > 25 * 1024 * 1024) { toast.error('Le fichier doit peser moins de 25 Mo.'); return; } if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) { toast.error('Format audio ou vidéo requis.'); return; } setTranscribing(true); try { const { text } = await blink.ai.transcribeAudio({ audio: await file.arrayBuffer(), language: 'fr' }); setForm(current => ({ ...current, adText: [current.adText, text].filter(Boolean).join('\n\n') })); toast.success('Transcription ajoutée au rapport'); } catch (error) { toast.error(error instanceof Error ? error.message : 'Transcription impossible'); } finally { setTranscribing(false); } };
  const createSwipeFolder = async () => { if (!newFolderName.trim()) return; try { const folder = await createFolder.mutateAsync({ name: newFolderName.trim() }); setSelectedFolderId(folder.id); setNewFolderName(''); toast.success('Dossier Swipe File créé'); } catch (error) { toast.error(error instanceof Error ? error.message : 'Création du dossier impossible'); } };
  useEffect(() => {
    const candidate = activeScans.find(scan => ['queued', 'retryable_failed', 'partial'].includes(scan.status));
    if (!candidate || autoResumed.current.has(candidate.id) || resumeScan.isPending) return;
    autoResumed.current.add(candidate.id);
    void resumePendingScan(candidate);
  }, [activeScans, resumeScan.isPending]);

  return <Page className="page-enter"><PageHeader><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Eye size={21} /></div><div><PageTitle>L’Espion publicitaire</PageTitle><PageDescription>8 axes marketing, formats créatifs, funnels, scaling et veille sans faux positif.</PageDescription></div></div></PageHeader><PageBody><div className="space-y-6">
    <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5"><div className="mb-4 flex items-center gap-2"><Target size={17} className="text-primary" /><h2 className="text-sm font-bold text-foreground">Lancer un rapport d’espionnage</h2></div><div className="grid gap-3 md:grid-cols-2"><Input placeholder="Annonceur / marque" value={form.advertiserName} onChange={event => setForm({ ...form, advertiserName: event.target.value })} /><Input placeholder="URL de la publicité ou landing page" value={form.targetUrl} onChange={event => setForm({ ...form, targetUrl: event.target.value })} /><Input placeholder="Nom de la créa" value={form.adName} onChange={event => setForm({ ...form, adName: event.target.value })} /><Select value={form.platform} onValueChange={platform => setForm({ ...form, platform })}><SelectTrigger><SelectValue placeholder="Plateforme" /></SelectTrigger><SelectContent><SelectItem value="meta">Meta Ads</SelectItem><SelectItem value="tiktok">TikTok</SelectItem><SelectItem value="linkedin">LinkedIn</SelectItem><SelectItem value="google">Google</SelectItem></SelectContent></Select></div><Textarea className="mt-3" placeholder="Collez le texte, la description ou la transcription disponible pour améliorer la confiance du rapport" value={form.adText} onChange={event => setForm({ ...form, adText: event.target.value })} /><div className="mt-3 flex flex-wrap items-center gap-2"><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/40"><FileAudio size={14} className="text-primary" />{transcribing ? 'Transcription…' : 'Transcrire une vidéo/audio'}<input type="file" accept="audio/*,video/*" className="hidden" disabled={transcribing} onChange={event => { const file = event.target.files?.[0]; if (file) void transcribeAd(file); event.currentTarget.value = ''; }} /></label><span className="text-[11px] text-muted-foreground">Whisper · français · texte ajouté automatiquement</span></div><div className="mt-3 flex flex-wrap items-center gap-2"><select value={selectedFolderId} onChange={event => setSelectedFolderId(event.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-xs text-foreground"><option value="">Swipe File personnel — non classé</option>{(foldersData?.folders ?? []).map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select><Input className="max-w-[220px]" placeholder="Nouveau dossier" value={newFolderName} onChange={event => setNewFolderName(event.target.value)} /><Button type="button" variant="outline" size="sm" onClick={createSwipeFolder} disabled={createFolder.isPending || !newFolderName.trim()}><FolderPlus size={14} /> Créer</Button></div><Button className="mt-3 gap-2" onClick={runScan} disabled={createScan.isPending || processScan.isPending || transcribing}>{createScan.isPending || processScan.isPending ? <Loader2 size={15} className="animate-spin" /> : <Megaphone size={15} />} {createScan.isPending || processScan.isPending ? 'Analyse en cours…' : 'Générer le rapport complet'}</Button></section>
    {activeScans.length > 0 && <section className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4"><div className="flex items-center gap-2 text-sm font-semibold text-foreground"><RefreshCw size={15} className="text-amber-600" /> {activeScans.length} scan(s) à reprendre</div><div className="mt-3 space-y-2">{activeScans.map(scan => <div key={scan.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-background/70 p-3 text-xs"><div><span className="font-semibold">{scan.advertiserName || scan.targetUrl || 'Scan sans nom'}</span><span className="ml-2 text-muted-foreground">{scan.status} · {scan.progress}% · tentative {scan.attemptCount}/{scan.maxAttempts}</span></div><Button size="sm" variant="outline" onClick={() => resumePendingScan(scan)} disabled={resumeScan.isPending}>Reprendre</Button></div>)}</div></section>}
    {firstScanAnalysis && <section className="rounded-2xl border border-primary/25 bg-primary/5 p-5"><div className="mb-3 flex items-center justify-between gap-3"><div><div className="flex items-center gap-2"><Target size={15} className="text-primary" /><h2 className="text-base font-bold text-foreground">Résultat du premier scan</h2><Badge variant="secondary">{firstScanAnalysis.advertiserName || 'Concurrent'}</Badge></div><p className="mt-1 text-xs text-muted-foreground">Votre premier rapport Espion reste accessible ici pour reprendre rapidement l’analyse.</p></div><Button size="sm" variant="outline" onClick={() => document.getElementById(`espion-analysis-${firstScanAnalysis.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Voir le rapport</Button></div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-background/70 p-3"><p className="text-[10px] uppercase text-muted-foreground">Score global</p><p className="mt-1 text-2xl font-black text-primary">{firstScanAnalysis.overallScore}/100</p></div><div className="rounded-xl bg-background/70 p-3"><p className="text-[10px] uppercase text-muted-foreground">Créatif</p><p className="mt-1 text-sm font-bold text-foreground">{firstScanAnalysis.creativeType || 'Non détecté'}</p></div><div className="rounded-xl bg-background/70 p-3"><p className="text-[10px] uppercase text-muted-foreground">Signal</p><p className="mt-1 text-sm font-bold text-foreground">{statusLabel(firstScanAnalysis.analysis.adActivityStatus)}</p></div></div></section>}
    <div className="flex items-center justify-between"><div><h2 className="text-base font-bold text-foreground">Rapports récents</h2><p className="text-xs text-muted-foreground">Chaque rapport sépare absence de publicité et scan non concluant.</p></div><div className="flex items-center gap-2 text-xs text-muted-foreground"><BarChart3 size={14} /> {analyses.length} rapport(s)</div></div>
    {analysesLoading ? <div className="h-48 animate-pulse rounded-2xl bg-muted" /> : analyses.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-10 text-center"><AlertTriangle size={24} className="mx-auto mb-2 text-muted-foreground" /><p className="text-sm font-semibold text-foreground">Aucun rapport publicitaire</p><p className="mt-1 text-xs text-muted-foreground">Lancez un scan pour obtenir la grille complète et le brief media buyer.</p></div> : <div className="space-y-4">{analyses.map(item => <AnalysisCard key={item.id} item={item} onExport={() => exportAnalysis(item.id)} onSave={() => saveAnalysis(item)} />)}</div>}
    <section className="rounded-2xl border border-border bg-card p-5"><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-base font-bold text-foreground">Swipe File personnel</h2><p className="text-xs text-muted-foreground">Vos pépites sauvegardées, classées par dossier et prêtes à partager.</p></div><Badge variant="secondary">{swipesData?.swipes?.length ?? 0} pépite(s)</Badge></div>{(swipesData?.swipes?.length ?? 0) === 0 ? <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">Ajoutez une pépite à votre bibliothèque pour commencer votre collection.</div> : <div className="grid gap-2 md:grid-cols-2">{(swipesData?.swipes ?? []).map(swipe => <div key={swipe.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground">{swipe.title}</p><div className="mt-1 flex flex-wrap gap-1">{swipe.tags.map(tag => <span key={tag} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{tag}</span>)}</div></div><div className="flex shrink-0 items-center gap-1"><Button type="button" variant="ghost" size="icon" onClick={() => void toggleFavorite(swipe)} title={swipe.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}><Heart size={15} className={swipe.isFavorite ? 'fill-primary text-primary' : 'text-muted-foreground'} /></Button><Button type="button" variant="ghost" size="icon" onClick={() => void removeSwipe(swipe)} disabled={deleteSwipe.isPending} title="Retirer"><Trash2 size={15} className="text-muted-foreground hover:text-destructive" /></Button></div></div>)}</div>}</section>
  </div></PageBody></Page>;
}
