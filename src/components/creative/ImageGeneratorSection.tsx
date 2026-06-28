import { useState } from 'react';
import { Button, toast } from '@blinkdotnew/ui';
import { Sparkles, Wand2, Image as ImageIcon, Download, RotateCcw, Copy, Check } from 'lucide-react';
import { blink } from '../../blink/client';
import { Format, GeneratedImage, FORMAT_LABELS, FORMAT_SIZES, markCreativeGenerated } from './utils';

// ── AI Image Generator Section ────────────────────────────────────────────────

export function ImageGeneratorSection({ userId }: { userId?: string }) {
  const [prompt, setPrompt]       = useState('');
  const [format, setFormat]       = useState<Format>('1:1');
  const [loading, setLoading]     = useState(false);
  const [generated, setGenerated] = useState<GeneratedImage | null>(null);
  const [copied, setCopied]       = useState(false);

  const PROMPT_SUGGESTIONS = [
    'Un café parisien chaleureux avec des croissants fumants sur le comptoir, lumière dorée du matin',
    'Un restaurant gastronomique avec une assiette de cuisine raffinée, fond sombre élégant',
    'Une boutique moderne avec des vêtements colorés, ambiance tendance et lumineuse',
    'Une salle de sport high-tech avec équipements modernes, atmosphère motivante',
    'Un salon de coiffure luxueux, miroirs dorés, ambiance sophistiquée',
  ];

  async function handleGenerate() {
    if (!prompt.trim()) {
      toast.error('Décrivez le visuel à générer');
      return;
    }
    setLoading(true);
    try {
      const size = FORMAT_SIZES[format] as '1024x1024' | '1024x1536' | '1536x1024';
      const result = await blink.ai.generateImage({
        prompt: `${prompt}. Style photoréaliste professionnel, haute qualité, éclairage studio.`,
        model:  'fal-ai/nano-banana-pro',
        size,
      });
      const url = (result as any)?.data?.[0]?.url ?? (result as any)?.[0]?.url ?? result;
      setGenerated({ url: url as string, prompt, format });
      if (userId) markCreativeGenerated(userId);
      toast.success('🎨 Visuel généré avec succès !');
    } catch (err: any) {
      // If session expired, redirect to login instead of showing a cryptic error
      if (err?.status === 401 || err?.message?.includes('401') || err?.message?.toLowerCase().includes('unauthorized')) {
        toast.error('Session expirée — reconnexion requise');
        blink.auth.login();
        return;
      }
      toast.error('Erreur de génération : ' + (err?.message ?? 'Réessayez'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left — controls */}
      <div className="space-y-5">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Wand2 size={16} className="text-primary" /> Générer une image par IA
          </h2>

          {/* Prompt */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
              Décrivez votre visuel
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={4}
              placeholder="Ex: Un café chaleureux avec des croissants, lumière dorée du matin, style photoréaliste…"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Suggestions */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2">
              Inspirations rapides
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PROMPT_SUGGESTIONS.slice(0, 3).map((s, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(s)}
                  className="text-[11px] bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground px-2.5 py-1 rounded-lg border border-border hover:border-primary/20 transition-all"
                >
                  {s.split(',')[0].slice(0, 32)}…
                </button>
              ))}
            </div>
          </div>

          {/* Format selector */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">
              Format de l'image
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(FORMAT_LABELS) as [Format, string][]).map(([f, label]) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-all ${
                    format === f
                      ? 'border-primary bg-primary/8 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  <span className="text-lg">{label.split(' ')[0]}</span>
                  <span className="leading-tight text-center">{label.slice(2)}</span>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full gap-2 h-12 text-base"
          >
            {loading ? (
              <><span className="animate-spin">⟳</span> Génération en cours…</>
            ) : (
              <><Sparkles size={16} /> Générer le visuel</>
            )}
          </Button>
          <p className="text-[10px] text-muted-foreground/70 text-center mt-1 leading-relaxed">
            ✍️ En validant ce contenu IA, vous en acceptez l'entière responsabilité éditoriale.
          </p>
        </div>
      </div>

      {/* Right — preview */}
      <div className="rounded-2xl border border-border bg-card p-5 flex flex-col items-center justify-center min-h-[400px]">
        {!generated ? (
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
              <ImageIcon size={28} className="text-muted-foreground/30" />
            </div>
            <p className="text-sm text-muted-foreground">
              Votre visuel IA apparaîtra ici
            </p>
          </div>
        ) : (
          <div className="w-full space-y-4">
            <div className={`overflow-hidden rounded-xl border border-border mx-auto ${
              generated.format === '9:16' ? 'max-w-[220px]' :
              generated.format === '4:3'  ? 'max-w-full' :
                                            'max-w-[320px]'
            }`}>
              <img
                src={generated.url}
                alt={generated.prompt}
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              <a
                href={generated.url}
                download="kompilot-image.png"
                className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                <Download size={13} /> Télécharger
              </a>
              <button
                onClick={() => { setGenerated(null); setPrompt(''); }}
                className="flex items-center gap-1.5 text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-lg font-medium hover:bg-muted/80 transition-colors"
              >
                <RotateCcw size={13} /> Réinitialiser
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generated.url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-1.5 text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-lg font-medium hover:bg-muted/80 transition-colors"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copié !' : 'Copier URL'}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center leading-relaxed px-4">
              Format : {FORMAT_LABELS[generated.format]} · {FORMAT_SIZES[generated.format]}px
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
