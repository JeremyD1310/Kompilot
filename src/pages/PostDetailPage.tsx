import { useMemo, useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, CalendarDays, Check, Clock, ExternalLink, Eye, Pencil, Send, Trash2 } from 'lucide-react';
import { Button, Page, PageBody, PageHeader, PageTitle, toast } from '@blinkdotnew/ui';
import { useScheduledPosts, getScheduledPosts, type PostStatus, type ScheduledPostStore } from '../lib/scheduledPostsStore';

const labels: Record<PostStatus, string> = { Brouillon: 'Brouillon', Planifié: 'Planifié', Approuvé: 'Approuvé' };

export default function PostDetailPage() {
  const { id } = useParams({ from: '/posts/$id' });
  const navigate = useNavigate();
  const { posts, update, updateStatus, remove } = useScheduledPosts();
  const initialPost = getScheduledPosts().find(candidate => candidate.id === id) ?? null;
  const [post, setPost] = useState<ScheduledPostStore | null>(initialPost);
  const [editing, setEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [text, setText] = useState(initialPost?.text ?? '');
  const [date, setDate] = useState(initialPost?.date ?? '');
  const [time, setTime] = useState(initialPost?.time ?? '09:00');
  const currentPost = posts.find(candidate => candidate.id === id) ?? post;
  const when = useMemo(() => currentPost?.date ? new Date(`${currentPost.date}T${currentPost.time || '09:00'}`) : null, [currentPost]);

  if (!currentPost) {
    return <Page><PageBody><Button variant="ghost" onClick={() => navigate({ to: '/calendar' })}><ArrowLeft size={16} /> Retour au calendrier</Button><div className="mt-12 text-center text-muted-foreground">Publication introuvable.</div></PageBody></Page>;
  }

  const save = () => {
    const updated = update(currentPost.id, { text, date, time });
    if (updated) setPost(updated);
    setEditing(false);
    toast.success('Publication mise à jour');
  };

  const removePost = () => {
    remove(currentPost.id);
    toast.success('Publication supprimée');
    navigate({ to: '/calendar' });
  };

  const publish = () => {
    updateStatus(currentPost.id, 'Approuvé');
    setPost({ ...currentPost, status: 'Approuvé' });
    toast.success('Publication prête à être publiée', { description: 'La demande a été enregistrée.' });
  };

  return (
    <Page className="page-enter">
      <PageHeader>
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/calendar' })} className="mb-2 gap-2"><ArrowLeft size={15} /> Calendrier</Button>
          <PageTitle>Détail de la publication</PageTitle>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}><Eye size={15} /> Aperçu</Button>
          <Button variant="outline" onClick={() => setEditing(!editing)}><Pencil size={15} /> Modifier</Button>
          <Button onClick={publish}><Send size={15} /> Publier maintenant</Button>
        </div>
      </PageHeader>
      <PageBody>
        <div className="mx-auto max-w-3xl space-y-5">
          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{labels[currentPost.status]}</span>
              <span className="text-sm text-muted-foreground">ID {currentPost.id}</span>
            </div>
            {editing ? <textarea value={text} onChange={event => setText(event.target.value)} className="min-h-48 w-full rounded-xl border border-border bg-background p-4 text-base outline-none focus:ring-2 focus:ring-primary" /> : <p className="whitespace-pre-wrap text-lg leading-relaxed text-foreground">{currentPost.text}</p>}
            {editing && <div className="mt-4 flex flex-wrap items-end gap-3"><label className="text-sm text-muted-foreground">Date<input type="date" value={date} onChange={event => setDate(event.target.value)} className="mt-1 block rounded-md border border-border bg-background p-2 text-foreground" /></label><label className="text-sm text-muted-foreground">Heure<input type="time" value={time} onChange={event => setTime(event.target.value)} className="mt-1 block rounded-md border border-border bg-background p-2 text-foreground" /></label><Button onClick={save}><Check size={15} /> Enregistrer</Button></div>}
          </section>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4"><CalendarDays size={18} className="text-primary" /><p className="mt-2 text-xs text-muted-foreground">Date</p><p className="font-semibold text-foreground">{when && !isNaN(when.getTime()) ? when.toLocaleDateString('fr-FR', { dateStyle: 'long' }) : 'Non planifiée'}</p></div>
            <div className="rounded-xl border border-border bg-card p-4"><Clock size={18} className="text-primary" /><p className="mt-2 text-xs text-muted-foreground">Heure</p><p className="font-semibold text-foreground">{currentPost.time || '—'}</p></div>
            <div className="rounded-xl border border-border bg-card p-4"><ExternalLink size={18} className="text-primary" /><p className="mt-2 text-xs text-muted-foreground">Canaux</p><p className="font-semibold text-foreground">{currentPost.channels.join(' · ') || 'Aucun'}</p></div>
          </div>
          <div className="flex justify-end"><Button variant="outline" className="text-destructive hover:text-destructive" onClick={removePost}><Trash2 size={15} /> Supprimer</Button></div>
        </div>
      </PageBody>
      {showPreview && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-label="Aperçu de la publication">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-background p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-primary">Aperçu avant publication</p><h2 className="mt-1 text-lg font-bold">{currentPost.channels.join(' · ') || 'Réseaux sélectionnés'}</h2></div><Button variant="ghost" size="icon" onClick={() => setShowPreview(false)} aria-label="Fermer">×</Button></div>
            <div className="rounded-xl border border-border bg-card p-4"><p className="whitespace-pre-wrap text-sm leading-relaxed">{currentPost.text}</p>{currentPost.imageUrl && <img src={currentPost.imageUrl} alt="Média de la publication" className="mt-4 max-h-64 w-full rounded-lg object-cover" />}</div>
            <div className="mt-4 flex justify-end"><Button onClick={() => setShowPreview(false)}>Retour à l’édition</Button></div>
          </div>
        </div>
      )}
    </Page>

  );
}
