import { useEffect, useRef, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { Badge, Button, Card, CardContent, Input, Tabs, TabsContent, TabsList, TabsTrigger } from '@blinkdotnew/ui';
import { CalendarDays, CheckCircle2, FileImage, FolderOpen, ImagePlus, MessageSquare, Palette, Plus, BarChart3, UploadCloud, XCircle, Send } from 'lucide-react';
import { CarouselDraftPanel } from './CarouselDraftPanel';
import { useAgency, useAgencyResource } from '../../hooks/useAgency';
import type { Workspace } from '../../lib/agency/api';
import { ResponsiveImage } from '../shared/ResponsiveImage';

const tabs = [
  ['assets', 'Assets', FolderOpen], ['brand-kits', 'Brand Kit', Palette], ['content', 'Content', FileImage],
  ['approvals', 'Approvals', CheckCircle2], ['calendar', 'Calendar', CalendarDays], ['reports', 'Reports', BarChart3],
] as const;
const statusStyles: Record<string, string> = { draft: 'bg-muted text-muted-foreground', in_review: 'bg-amber-500/15 text-amber-700', approved: 'bg-emerald-500/15 text-emerald-700', scheduled: 'bg-blue-500/15 text-blue-700', published: 'bg-violet-500/15 text-violet-700' };

export function AgencyContentHub() {
  const [workspace, setWorkspace] = useState<Workspace>();
  const [newName, setNewName] = useState('');
  const [active, setActive] = useState('content');
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [comment, setComment] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const agency = useAgency(workspace?.id);
  const contentQuery = useAgencyResource(workspace?.id, 'content');
  const assetsQuery = useAgencyResource(workspace?.id, 'assets');
  const approvalsQuery = useAgencyResource(workspace?.id, 'approvals');
  const calendarQuery = useAgencyResource(workspace?.id, 'calendar');
  const commentsQuery = useAgencyResource(workspace?.id, 'comments');
  const content = contentQuery.data?.content ?? [];
  const assets = assetsQuery.data?.assets ?? [];
  const approvals = approvalsQuery.data?.approvals ?? [];
  const calendar = calendarQuery.data?.calendar ?? [];
  const comments = commentsQuery.data?.comments ?? [];
  const current = agency.workspaces.find(w => w.id === workspace?.id) || workspace;

  useEffect(() => {
    if (workspace || agency.workspaces.length === 0) return;
    const storedId = window.localStorage.getItem('kompilot_agency_workspace');
    const initial = agency.workspaces.find(item => item.id === storedId) ?? agency.workspaces[0];
    setWorkspace(initial);
  }, [agency.workspaces, workspace]);

  const selectWorkspace = (id: string) => {
    const next = agency.workspaces.find(item => item.id === id);
    setWorkspace(next);
    if (next) window.localStorage.setItem('kompilot_agency_workspace', next.id);
  };
  const createCarousel = async (title: string, slides: { title: string; body: string }[]) => {
    const item = await agency.create.mutateAsync({ resource: 'content', data: { title, contentType: 'carousel', status: 'draft' } });
    await agency.create.mutateAsync({ resource: 'versions', data: { contentItemId: String(item.id), versionNumber: 1, body: JSON.stringify({ slides }), metadata: JSON.stringify({ format: 'carousel' }) } });
  };
  const addComment = async (contentItemId: string) => {
    if (!comment.trim()) return;
    await agency.create.mutateAsync({ resource: 'comments', data: { contentItemId, body: comment.trim() } });
    setComment('');
  };
  return <>
    <div className="min-h-full bg-[#f7f8fa] px-4 py-6 text-foreground sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Agency workspace</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Content hub</h1><p className="mt-2 max-w-xl text-sm text-muted-foreground">Organisez vos campagnes, assets et validations dans un espace partagé.</p></div>
          <div className="flex items-center gap-2"><select aria-label="Sélectionner un workspace" value={current?.id || ''} onChange={e => selectWorkspace(e.target.value)} className="h-10 rounded-xl border border-border bg-card px-3 text-sm font-semibold shadow-sm"><option value="">Choisir un workspace</option>{agency.workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select><div className="flex gap-1"><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nouveau workspace" className="w-36 bg-card" /><Button size="icon" aria-label="Créer workspace" disabled={!newName.trim()} onClick={() => { agency.createWorkspace.mutate(newName); setNewName(''); }}><Plus className="h-4 w-4" /></Button></div></div>
        </header>
        {!current ? <Card className="border-dashed bg-card"><CardContent className="flex flex-col items-center justify-center py-20 text-center"><div className="mb-4 rounded-2xl bg-primary/10 p-4 text-primary"><FolderOpen /></div><h2 className="text-lg font-bold">Votre espace de travail vous attend</h2><p className="mt-2 max-w-sm text-sm text-muted-foreground">Créez ou sélectionnez un workspace pour commencer à produire.</p></CardContent></Card> : <Tabs value={active} onValueChange={setActive} className="space-y-5">
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl bg-card p-1 shadow-sm"><span className="mr-2 hidden shrink-0 px-3 py-2 text-sm font-bold sm:inline">{current.name}</span>{tabs.map(([value, label, Icon]) => <TabsTrigger key={value} value={value} className="shrink-0 gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm"><Icon className="h-4 w-4" />{label}</TabsTrigger>)}</TabsList>
          <TabsContent value="content"><Section title="Content board" action={<div className="flex gap-2"><Button variant="outline" onClick={() => setCarouselOpen(true)}><Plus className="mr-2 h-4 w-4" />Carrousel</Button><Button onClick={() => agency.create.mutate({ resource: 'content', data: { title: 'Nouveau brouillon', contentType: 'post' } })}><Plus className="mr-2 h-4 w-4" />Créer un brouillon</Button></div>}><div className="grid gap-4 md:grid-cols-3">{['draft', 'in_review', 'approved'].map(status => <Card key={status} className="min-h-48 bg-card"><CardContent className="p-4"><div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-bold">{status === 'in_review' ? 'En validation' : status === 'draft' ? 'Brouillons' : 'Approuvés'}</h3><Badge className={statusStyles[status]}>{content.filter(x => x.status === status).length}</Badge></div>{content.filter(x => x.status === status).map(item => <div key={item.id} className="mb-2 rounded-xl border border-border p-3"><p className="text-sm font-semibold">{item.title || 'Sans titre'}</p><p className="mt-1 text-xs text-muted-foreground">{item.contentType || 'Social'} · version courante</p><div className="mt-2 flex flex-wrap gap-3"><Button variant="ghost" size="sm" className="h-7 px-0 text-xs" onClick={() => status === 'draft' ? (item.currentVersionId ? agency.create.mutate({ resource: 'approvals', data: { contentItemId: item.id, versionId: item.currentVersionId, status: 'pending' } }) : undefined) : agency.setStatus.mutate({ id: item.id, status: 'approved' })}>{status === 'draft' ? 'Demander validation →' : 'Faire avancer →'}</Button><Button variant="ghost" size="sm" className="h-7 px-0 text-xs" onClick={() => agency.create.mutate({ resource: 'versions', data: { contentItemId: item.id, versionNumber: 1, body: '' } })}>Nouvelle version</Button></div><div className="mt-3 flex gap-2"><Input value={comment} onChange={e => setComment(e.target.value)} placeholder="Ajouter un commentaire" className="h-8 text-xs" /><Button size="icon" className="h-8 w-8" aria-label="Publier le commentaire" onClick={() => addComment(item.id)}><Send className="h-3 w-3" /></Button></div>{comments.filter(c => c.contentItemId === item.id).slice(-2).map(c => <p key={c.id} className="mt-2 text-xs text-muted-foreground"><MessageSquare className="mr-1 inline h-3 w-3" />{c.body}</p>)}</div>)}</CardContent></Card>)}</div></Section></TabsContent>
          <TabsContent value="assets"><Section title="Assets & DAM" action={<><input ref={fileRef} type="file" className="hidden" onChange={e => e.target.files?.[0] && agency.upload.mutate(e.target.files[0])} /><Button onClick={() => fileRef.current?.click()}><UploadCloud className="mr-2 h-4 w-4" />Importer</Button></>}><div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">{assets.map(asset => { const url = String(asset.fileUrl || ''); return <Card key={String(asset.id)} className="overflow-hidden bg-card"><div className="flex aspect-square items-center justify-center bg-muted">{url && String(asset.fileType || '').startsWith('image/') ? <ResponsiveImage src={url} alt={String(asset.name || 'Asset')} width={400} height={400} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 400px" className="h-full w-full object-cover" /> : <ImagePlus className="text-muted-foreground" />}</div><CardContent className="p-3"><p className="truncate text-xs font-semibold">{String(asset.name || 'Asset')}</p></CardContent></Card>; })}</div></Section></TabsContent>
          <TabsContent value="brand-kits"><Section title="Brand Kit" action={<Button onClick={() => agency.create.mutate({ resource: 'brand-kits', data: { name: 'Kit principal', primaryColor: '#0D9488', secondaryColor: '#F1F5F9', headingFont: 'DM Sans', bodyFont: 'DM Sans' } })}><Plus className="mr-2 h-4 w-4" />Ajouter un kit</Button>}><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Card className="bg-card"><CardContent className="p-5"><div className="mb-4 flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-primary" /><div><p className="font-bold">Kit principal</p><p className="text-xs text-muted-foreground">Couleurs, typographies et règles client</p></div></div><div className="flex gap-2"><span className="h-8 flex-1 rounded-lg bg-[#0D9488]" /><span className="h-8 flex-1 rounded-lg bg-[#F1F5F9]" /><span className="h-8 flex-1 rounded-lg bg-[#14B8A6]" /></div><p className="mt-3 text-xs text-muted-foreground">DM Sans · DM Sans</p></CardContent></Card></div></Section></TabsContent>
          <TabsContent value="approvals"><Section title="Approvals & commentaires"><div className="space-y-3">{approvals.map(item => <Card key={item.id} className="bg-card"><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">Contenu {item.contentItemId.slice(0, 8)}</p><p className="mt-1 text-xs text-muted-foreground"><MessageSquare className="mr-1 inline h-3 w-3" />{item.feedback || 'Aucun commentaire'}</p></div><div className="flex items-center gap-2"><Badge>{item.status || 'pending'}</Badge>{item.status === 'pending' && <><Button size="sm" onClick={() => agency.setApprovalStatus.mutate({ id: item.id, status: 'approved' })}><CheckCircle2 className="mr-1 h-3 w-3" />Approuver</Button><Button size="sm" variant="outline" onClick={() => agency.setApprovalStatus.mutate({ id: item.id, status: 'changes_requested', feedback: 'Modifications demandées' })}><XCircle className="mr-1 h-3 w-3" />Demander changements</Button><Button size="sm" variant="ghost" onClick={() => agency.setApprovalStatus.mutate({ id: item.id, status: 'rejected', feedback: 'Contenu rejeté' })}>Rejeter</Button></>}</div></CardContent></Card>)}</div></Section></TabsContent>
          <TabsContent value="calendar"><Section title="Calendrier éditorial"><div className="grid gap-3 md:grid-cols-2">{calendar.length ? calendar.map(event => <Card key={event.id} className="bg-card"><CardContent className="p-4"><div className="flex items-start gap-3"><CalendarDays className="mt-1 h-4 w-4 text-primary" /><div><p className="font-semibold">{event.title}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(event.startsAt).toLocaleString('fr-FR')} · {event.channel}</p><Badge className="mt-2">{event.status}</Badge></div></div></CardContent></Card>) : <Card className="border-dashed bg-card"><CardContent className="py-12 text-center text-sm text-muted-foreground">Aucun événement planifié.</CardContent></Card>}</div></Section></TabsContent>
          <TabsContent value="reports"><Section title="Rapports"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[['Contenus', agency.summary.data?.content?.total || 0], ['Assets', agency.summary.data?.assets || 0], ['En attente', agency.summary.data?.approvals?.pending || 0], ['Événements', agency.summary.data?.calendarEvents || 0]].map(([label, value]) => <Card key={label as string} className="bg-card"><CardContent className="p-5"><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></CardContent></Card>)}</div></Section></TabsContent>
        </Tabs>}
      </div>
    </div>
    <CarouselDraftPanel open={carouselOpen} onOpenChange={setCarouselOpen} onCreate={createCarousel} />
  </>;
}
function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) { return <section><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2>{action}</div>{children}</section>; }
function Placeholder({ icon: Icon, title, text, action, onClick }: { icon: ComponentType<{ className?: string }>; title: string; text: string; action: string; onClick: () => void }) { return <Card className="border-dashed bg-card"><CardContent className="flex flex-col items-center justify-center py-20 text-center"><Icon className="mb-4 h-10 w-10 text-primary" /><h2 className="text-xl font-bold">{title}</h2><p className="mt-2 max-w-sm text-sm text-muted-foreground">{text}</p><Button className="mt-6" onClick={onClick}>{action}</Button></CardContent></Card>; }