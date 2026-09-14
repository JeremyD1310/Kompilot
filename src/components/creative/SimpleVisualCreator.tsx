import { useMemo, useState } from 'react';
import { Image as ImageIcon, Download, Palette, RefreshCw, Send, Sparkles } from 'lucide-react';
import { Button, toast } from '@blinkdotnew/ui';
import { blink } from '@/blink/client';
import { ResponsiveImage } from '../shared/ResponsiveImage';

export type VisualFormat = 'square' | 'story' | 'landscape';

interface SimpleVisualCreatorProps {
  businessName?: string;
  onUseVisual?: (url: string) => void;
}

const FORMAT_OPTIONS: Array<{ id: VisualFormat; label: string; size: '1024x1024' | '1024x1536' | '1536x1024'; ratio: string }> = [
  { id: 'square', label: 'Carré · 1:1', size: '1024x1024', ratio: 'aspect-square' },
  { id: 'story', label: 'Story · 9:16', size: '1024x1536', ratio: 'aspect-[2/3]' },
  { id: 'landscape', label: 'Paysage · 16:9', size: '1536x1024', ratio: 'aspect-video' },
];

const STYLE_OPTIONS = ['Photo commerciale', 'Illustration éditoriale', 'Minimal premium', 'Ambiance locale'];

export function SimpleVisualCreator({ businessName, onUseVisual }: SimpleVisualCreatorProps) {
  const [brief, setBrief] = useState('');
  const [headline, setHeadline] = useState('');
  const [format, setFormat] = useState<VisualFormat>('square');
  const [style, setStyle] = useState(STYLE_OPTIONS[0]);
  const [accent, setAccent] = useState('#0D9488');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedFormat = useMemo(
    () => FORMAT_OPTIONS.find(option => option.id === format) ?? FORMAT_OPTIONS[0],
    [format],
  );

  const generate = async () => {
    if (!brief.trim()) {
      toast.error('Décrivez le visuel à créer.');
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = [
        `Create a polished social media visual for ${businessName || 'a French local business'}.`,
        `Creative brief: ${brief.trim()}.`,
        `Art direction: ${style}, accent color ${accent}, clean composition, strong focal point, commercial quality.`,
        'Leave calm negative space for an editable headline overlay. Do not render any words, letters, logos, watermarks or fake text in the image.',
        format === 'story' ? 'Vertical 9:16 composition.' : format === 'landscape' ? 'Wide 16:9 composition.' : 'Square 1:1 composition.',
      ].join(' ');

      const result = await blink.ai.generateImage({ prompt, size: selectedFormat.size });
      const url = result.data?.[0]?.url;
      if (!url) throw new Error('L’IA n’a pas renvoyé de visuel.');
      setImageUrl(url);
      toast.success('Visuel prêt', { description: 'Vous pouvez le télécharger ou l’envoyer au calendrier.' });
    } catch (error) {
      toast.error('Impossible de générer le visuel', {
        description: error instanceof Error ? error.message : 'Réessayez dans un instant.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const useInCalendar = () => {
    if (!imageUrl) return;
    if (onUseVisual) {
      onUseVisual(imageUrl);
      return;
    }
    navigator.clipboard.writeText(imageUrl).then(
      () => toast.success('URL du visuel copiée', { description: 'Collez-la dans votre publication ou votre calendrier.' }),
      () => toast.error('Copie impossible', { description: 'Ouvrez le visuel dans un nouvel onglet pour le récupérer.' }),
    );
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-primary/[0.06] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ImageIcon size={21} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">Créateur visuel simple</h2>
                <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">IA</span>
              </div>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
                Décrivez votre idée, choisissez un format et obtenez un visuel prêt pour vos réseaux. Le texte reste modifiable avant publication.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <Palette size={13} className="text-primary" />
            Branding léger
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <div>
            <label htmlFor="visual-brief" className="mb-1.5 block text-xs font-semibold text-foreground">Idée du visuel</label>
            <textarea
              id="visual-brief"
              value={brief}
              onChange={event => setBrief(event.target.value)}
              placeholder="Ex. Une table de brunch en terrasse au soleil, avec des produits frais et une atmosphère conviviale…"
              rows={4}
              className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div>
            <label htmlFor="visual-headline" className="mb-1.5 block text-xs font-semibold text-foreground">Accroche à afficher (optionnel)</label>
            <input
              id="visual-headline"
              value={headline}
              onChange={event => setHeadline(event.target.value)}
              placeholder="Ex. Le brunch du dimanche est servi !"
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">L’accroche est ajoutée dans l’aperçu, sans être gravée dans l’image IA.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="mb-1.5 block text-xs font-semibold text-foreground">Format</span>
              <div className="grid grid-cols-3 gap-1.5">
                {FORMAT_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setFormat(option.id)}
                    className={`rounded-lg border px-2 py-2 text-[11px] font-semibold transition-colors ${format === option.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground hover:border-primary/40'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="visual-style" className="mb-1.5 block text-xs font-semibold text-foreground">Direction artistique</label>
              <select
                id="visual-style"
                value={style}
                onChange={event => setStyle(event.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-xs text-foreground outline-none focus:border-primary"
              >
                {STYLE_OPTIONS.map(option => <option key={option}>{option}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
            <label htmlFor="visual-accent" className="text-xs font-semibold text-foreground">Couleur d’accent</label>
            <input id="visual-accent" type="color" value={accent} onChange={event => setAccent(event.target.value)} className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0" />
            <span className="font-mono text-[11px] text-muted-foreground">{accent.toUpperCase()}</span>
          </div>

          <Button onClick={generate} disabled={isGenerating} className="w-full gap-2 sm:w-auto">
            {isGenerating ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {isGenerating ? 'Création en cours…' : imageUrl ? 'Régénérer le visuel' : 'Créer mon visuel'}
          </Button>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Aperçu</p>
          <div className={`relative overflow-hidden rounded-2xl border border-border bg-muted ${selectedFormat.ratio}`}>
            {imageUrl ? (
              <ResponsiveImage
                src={imageUrl}
                alt="Visuel généré pour votre publication"
                width={selectedFormat.id === 'story' ? 1024 : selectedFormat.id === 'landscape' ? 1536 : 1024}
                height={selectedFormat.id === 'story' ? 1536 : 1024}
                sizes="(max-width: 768px) 100vw, 320px"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-muted-foreground">
                <ImageIcon size={26} className="text-primary/50" />
                <p className="text-xs">Votre création apparaîtra ici</p>
              </div>
            )}
            {imageUrl && headline && (
              <div className="absolute inset-x-3 bottom-3 rounded-lg px-3 py-2 text-center text-sm font-extrabold text-primary-foreground shadow-lg" style={{ backgroundColor: accent }}>
                {headline}
              </div>
            )}
          </div>
          {imageUrl && (
            <div className="grid grid-cols-2 gap-2">
              <a href={imageUrl} download="kompilot-visuel.png" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted">
                <Download size={13} /> Télécharger
              </a>
              <Button variant="outline" onClick={useInCalendar} className="h-auto gap-1.5 px-3 py-2 text-xs">
                <Send size={13} /> Calendrier
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
