import { useState } from 'react';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Textarea } from '@blinkdotnew/ui';
import { Plus, Trash2 } from 'lucide-react';

type Slide = { title: string; body: string };

export function CarouselDraftPanel({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (open: boolean) => void; onCreate: (title: string, slides: Slide[]) => Promise<void> }) {
  const [title, setTitle] = useState('');
  const [slides, setSlides] = useState<Slide[]>([{ title: '', body: '' }, { title: '', body: '' }]);
  const [saving, setSaving] = useState(false);
  const update = (index: number, field: keyof Slide, value: string) => setSlides(items => items.map((slide, i) => i === index ? { ...slide, [field]: value } : slide));
  const submit = async () => {
    if (!title.trim() || slides.some(slide => !slide.title.trim() && !slide.body.trim())) return;
    setSaving(true);
    try { await onCreate(title.trim(), slides); setTitle(''); setSlides([{ title: '', body: '' }, { title: '', body: '' }]); onOpenChange(false); } finally { setSaving(false); }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
    <DialogHeader><DialogTitle>Créer un carrousel</DialogTitle><DialogDescription>Composez 2 à 3 slides texte pour votre prochaine publication.</DialogDescription></DialogHeader>
    <div className="space-y-4"><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre du contenu" />
      {slides.map((slide, index) => <div key={index} className="rounded-2xl border border-border bg-muted/30 p-4"><div className="mb-3 flex items-center justify-between"><p className="text-sm font-bold">Slide {index + 1}</p>{slides.length > 2 && <Button variant="ghost" size="icon" aria-label="Supprimer la slide" onClick={() => setSlides(items => items.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></Button>}</div><div className="grid gap-3 sm:grid-cols-2"><Input value={slide.title} onChange={e => update(index, 'title', e.target.value)} placeholder="Accroche" /><Textarea value={slide.body} onChange={e => update(index, 'body', e.target.value)} placeholder="Texte de la slide" rows={3} /></div></div>)}
      {slides.length < 3 && <Button type="button" variant="outline" className="w-full" onClick={() => setSlides(items => [...items, { title: '', body: '' }])}><Plus className="mr-2 h-4 w-4" />Ajouter une slide</Button>}
    </div><DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button><Button disabled={saving || !title.trim()} onClick={submit}>{saving ? 'Création…' : 'Créer le brouillon'}</Button></DialogFooter>
  </DialogContent></Dialog>;
}
