import { useMemo, useRef, useState } from 'react';
import { Badge, Button, Card, CardContent, toast } from '@blinkdotnew/ui';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Crop,
  FileImage,
  Image as ImageIcon,
  Loader2,
  Send,
  Sparkles,
  Trash2,
  UploadCloud,
  Video,
  Wand2,
  X,
} from 'lucide-react';
import { blink } from '../../blink/client';
import { useAuth } from '../../hooks/useAuth';
import { ResponsiveImage } from '../shared/ResponsiveImage';

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/quicktime'];
const MAX_FILE_SIZE = 50 * 1024 * 1024;
type Ratio = '1:1' | '9:16' | '16:9';
type MediaStatus = 'uploading' | 'ready' | 'error';
type MediaKind = 'image' | 'video';

interface MediaItem {
  id: string;
  name: string;
  kind: MediaKind;
  previewUrl: string;
  url?: string;
  status: MediaStatus;
  progress: number;
  error?: string;
}

const ratioClasses: Record<Ratio, string> = {
  '1:1': 'aspect-square',
  '9:16': 'aspect-[9/16]',
  '16:9': 'aspect-video',
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Une erreur inattendue est survenue.';
}

function StatusBadge({ status }: { status: MediaStatus }) {
  if (status === 'uploading') return <Badge variant="secondary" className="gap-1"><Loader2 size={11} className="animate-spin" /> En cours</Badge>;
  if (status === 'error') return <Badge variant="destructive" className="gap-1"><AlertCircle size={11} /> Erreur</Badge>;
  return <Badge className="gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><CheckCircle2 size={11} /> Prêt</Badge>;
}

export function CreativeMediaWorkspace() {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [ratio, setRatio] = useState<Ratio>('1:1');
  const [aiBusy, setAiBusy] = useState<'variation' | 'copy' | null>(null);
  const [aiCopy, setAiCopy] = useState('');

  const selected = useMemo(() => media.find(item => item.id === selectedId) ?? null, [media, selectedId]);

  const updateMedia = (id: string, patch: Partial<MediaItem>) => {
    setMedia(current => current.map(item => item.id === id ? { ...item, ...patch } : item));
  };

  const uploadFile = async (file: File) => {
    const id = crypto.randomUUID();
    const kind: MediaKind = file.type.startsWith('video/') ? 'video' : 'image';
    const previewUrl = URL.createObjectURL(file);
    const item: MediaItem = { id, name: file.name, kind, previewUrl, status: 'uploading', progress: 0 };
    setMedia(current => [...current, item]);
    setSelectedId(current => current ?? id);

    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const path = `creative-media/${user?.id || 'guest'}/${Date.now()}-${id}.${extension}`;
      const result = await blink.storage.upload(file, path, { onProgress: progress => updateMedia(id, { progress }) });
      updateMedia(id, { url: result.publicUrl, previewUrl: result.publicUrl, status: 'ready', progress: 100 });
      toast.success('Média ajouté', { description: `${file.name} est prêt à être travaillé.` });
    } catch (error) {
      updateMedia(id, { status: 'error', error: errorMessage(error) });
      toast.error('Échec de l’upload', { description: errorMessage(error) });
    }
  };

  const handleFiles = (files: File[]) => {
    files.forEach(file => {
      if (!ACCEPTED.includes(file.type)) {
        toast.error('Format non pris en charge', { description: 'Utilisez PNG, JPG, WebP, MP4 ou MOV.' });
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error('Fichier trop volumineux', { description: 'La taille maximale est de 50 Mo.' });
        return;
      }
      void uploadFile(file);
    });
  };

  const requireImageUrl = () => {
    if (!selected || selected.status !== 'ready' || !selected.url) {
      toast.error('Sélectionnez un média prêt');
      return null;
    }
    if (!user) {
      blink.auth.login(window.location.href);
      return null;
    }
    return selected.url;
  };

  const createVariation = async () => {
    const sourceUrl = requireImageUrl();
    if (!sourceUrl || selected?.kind !== 'image') {
      if (selected?.kind === 'video') toast.error('La variation IA est disponible pour les images.');
      return;
    }
    setAiBusy('variation');
    try {
      const result = await blink.ai.modifyImage({
        images: [sourceUrl],
        prompt: `Create a polished marketing variation of this image for a French B2B brand. Keep the subject recognizable, improve composition and lighting, preserve a clean premium aesthetic, and do not add readable text or logos. Use a ${ratio} composition.`,
      });
      const url = result.data?.[0]?.url;
      if (!url) throw new Error('L’IA n’a pas renvoyé de variation.');
      const variation: MediaItem = { id: crypto.randomUUID(), name: `${selected.name} · variation IA`, kind: 'image', previewUrl: url, url, status: 'ready', progress: 100 };
      setMedia(current => [...current, variation]);
      setSelectedId(variation.id);
      toast.success('Variation IA prête');
    } catch (error) {
      toast.error('Impossible de créer la variation', { description: errorMessage(error) });
    } finally {
      setAiBusy(null);
    }
  };

  const generateCopy = async () => {
    const sourceUrl = requireImageUrl();
    if (!sourceUrl || selected?.kind !== 'image') return;
    setAiBusy('copy');
    try {
      const result = await blink.ai.generateText({
        model: 'openai/gpt-4.1-mini',
        maxTokens: 320,
        messages: [
          { role: 'system', content: 'Tu es le spécialiste contenu et SEO de Kompilot. Rédige en français, de façon concise et professionnelle. Retourne exactement deux sections : ALT: une description accessible de 120 caractères maximum ; LÉGENDE: un texte social de 2 phrases maximum, sans hashtags.' },
          { role: 'user', content: [{ type: 'text', text: 'Analyse ce visuel et propose son alt text SEO puis une légende de publication.' }, { type: 'image', image: sourceUrl }] },
        ],
      });
      setAiCopy(result.text || '');
      toast.success('Texte SEO et légende générés');
    } catch (error) {
      toast.error('Impossible de générer le texte', { description: errorMessage(error) });
    } finally {
      setAiBusy(null);
    }
  };

  const removeSelected = () => {
    if (!selected) return;
    if (selected.previewUrl.startsWith('blob:')) URL.revokeObjectURL(selected.previewUrl);
    setMedia(current => current.filter(item => item.id !== selected.id));
    setSelectedId(media.find(item => item.id !== selected.id)?.id ?? null);
    setAiCopy('');
  };

  const sendToPlanner = () => {
    if (!selected?.url || selected.status !== 'ready') {
      toast.error('Le média doit être prêt avant publication.');
      return;
    }
    const handoff = { text: aiCopy.replace(/^ALT:.*\n?/i, '').replace(/^LÉGENDE:\s*/i, '').trim() || `Nouveau contenu — ${selected.name}`, imageUrl: selected.kind === 'image' ? selected.url : undefined, videoUrl: selected.kind === 'video' ? selected.url : undefined, platform: 'LinkedIn' };
    try { sessionStorage.setItem('kompilot_creative_handoff', JSON.stringify(handoff)); } catch { /* private mode */ }
    window.location.assign('/social?tab=scheduler');
  };

  return (
    <div className="space-y-5">
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2"><Sparkles size={18} className="text-primary" /><h2 className="text-base font-bold text-foreground">Creative IA</h2><Badge variant="outline">Upload & traitement</Badge></div>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Centralisez vos images et vidéos, préparez chaque format, puis envoyez le média final vers votre planificateur multicanal.</p>
            </div>
            <Button onClick={() => inputRef.current?.click()} className="gap-2"><UploadCloud size={16} /> Sélectionner des fichiers</Button>
          </div>
          <input ref={inputRef} type="file" multiple accept={ACCEPTED.join(',')} className="hidden" onChange={event => handleFiles(Array.from(event.target.files ?? []))} />
          <button type="button" onClick={() => inputRef.current?.click()} onDragOver={event => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={event => { event.preventDefault(); setIsDragging(false); handleFiles(Array.from(event.dataTransfer.files)); }} className={`mt-5 flex min-h-32 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-border bg-muted/20 hover:border-primary/50 hover:bg-primary/[0.04]'}`}>
            <UploadCloud size={26} className="mb-2 text-primary" /><span className="text-sm font-semibold text-foreground">Glissez-déposez vos médias ici</span><span className="mt-1 text-xs text-muted-foreground">PNG, JPG, WebP, MP4 ou MOV · 50 Mo maximum par fichier</span>
          </button>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="border-border/60 shadow-sm"><CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between"><div><h3 className="text-sm font-bold text-foreground">Bibliothèque médias</h3><p className="text-xs text-muted-foreground">{media.length} fichier{media.length > 1 ? 's' : ''} dans cette session</p></div><div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock3 size={13} /> Cloud sécurisé</div></div>
          {media.length === 0 ? <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground"><FileImage size={28} className="mx-auto mb-2 opacity-40" />Votre galerie apparaîtra ici après le premier upload.</div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {media.map(item => <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`group relative overflow-hidden rounded-xl border text-left transition-all ${selectedId === item.id ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/40'}`}>
              <div className="aspect-square bg-muted">{item.kind === 'image' ? <ResponsiveImage src={item.previewUrl} alt={item.name} width={320} height={320} sizes="(max-width: 768px) 50vw, 220px" className="h-full w-full object-cover" /> : <video src={item.previewUrl} muted className="h-full w-full object-cover" />}</div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent p-2 pt-7"><p className="truncate text-[11px] font-medium text-white">{item.name}</p><div className="mt-1"><StatusBadge status={item.status} /></div></div>
              {item.status === 'uploading' && <div className="absolute inset-x-0 top-0 h-1 bg-primary/20"><div className="h-full bg-primary transition-all" style={{ width: `${item.progress}%` }} /></div>}
              {item.status === 'error' && <div className="absolute right-2 top-2 rounded-full bg-destructive p-1 text-destructive-foreground"><AlertCircle size={13} /></div>}
            </button>)}
          </div>}
        </CardContent></Card>

        <Card className="border-border/60 shadow-sm"><CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between"><div><h3 className="text-sm font-bold text-foreground">Édition rapide</h3><p className="text-xs text-muted-foreground">{selected ? selected.name : 'Sélectionnez un média'}</p></div>{selected && <button type="button" onClick={removeSelected} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Supprimer le média"><Trash2 size={15} /></button>}</div>
          {!selected ? <div className="rounded-xl bg-muted/30 py-16 text-center text-sm text-muted-foreground"><ImageIcon size={26} className="mx-auto mb-2 opacity-40" />Choisissez une vignette pour commencer.</div> : <div className="space-y-4">
            <div className={`relative overflow-hidden rounded-xl border border-border bg-muted ${ratioClasses[ratio]}`}>{selected.kind === 'image' ? <ResponsiveImage src={selected.previewUrl} alt={selected.name} width={720} height={720} sizes="360px" className="h-full w-full object-cover" /> : <video src={selected.previewUrl} controls className="h-full w-full object-cover" />}</div>
            <div><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground"><Crop size={14} className="text-primary" /> Format natif</div><div className="grid grid-cols-3 gap-1.5">{(['1:1', '9:16', '16:9'] as Ratio[]).map(item => <button type="button" key={item} onClick={() => setRatio(item)} className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${ratio === item ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>{item}</button>)}</div></div>
            <div className="grid gap-2"><Button variant="outline" onClick={createVariation} disabled={aiBusy !== null || selected.status !== 'ready' || selected.kind !== 'image'} className="justify-start gap-2">{aiBusy === 'variation' ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />} Générer une variation IA</Button><Button variant="outline" onClick={generateCopy} disabled={aiBusy !== null || selected.status !== 'ready' || selected.kind !== 'image'} className="justify-start gap-2">{aiBusy === 'copy' ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Optimiser SEO & légende</Button></div>
            {aiCopy && <div><label htmlFor="creative-copy" className="mb-1.5 block text-xs font-semibold text-foreground">Résultat IA éditable</label><textarea id="creative-copy" value={aiCopy} onChange={event => setAiCopy(event.target.value)} rows={5} className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /><button type="button" onClick={() => navigator.clipboard.writeText(aiCopy).then(() => toast.success('Texte copié'))} className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-primary"><Copy size={12} /> Copier le texte</button></div>}
            <Button onClick={sendToPlanner} disabled={selected.status !== 'ready'} className="w-full gap-2"><Send size={15} /> Envoyer au planificateur</Button>
            <p className="text-[11px] leading-relaxed text-muted-foreground">Le fichier final sera transmis au planificateur avec son URL publique. Vous pourrez choisir LinkedIn, Meta ou TikTok avant publication.</p>
          </div>}
        </CardContent></Card>
      </div>
    </div>
  );
}
