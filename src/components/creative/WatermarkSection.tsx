import { useState, useRef } from 'react';
import { Button, toast } from '@blinkdotnew/ui';
import { Upload, Check, Layers, Image as ImageIcon } from 'lucide-react';
import { blink } from '../../blink/client';

// ── Smart Watermark Section ───────────────────────────────────────────────────

export function WatermarkSection({ userId }: { userId?: string }) {
  const [logoUrl,     setLogoUrl]     = useState(() => localStorage.getItem(`brand_logo_url_${userId}`) ?? '');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [imageUrl,    setImageUrl]    = useState('');
  const [position,   setPosition]    = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');
  const [opacity,    setOpacity]     = useState(80);
  const [uploading,  setUploading]   = useState(false);
  const [saved,      setSaved]       = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const POSITIONS = [
    { id: 'top-left',     label: '↖ Haut gauche' },
    { id: 'top-right',    label: '↗ Haut droite' },
    { id: 'bottom-left',  label: '↙ Bas gauche' },
    { id: 'bottom-right', label: '↘ Bas droite' },
  ] as const;

  async function handleLogoUpload(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Format non supporté — utilisez PNG, JPG ou WebP');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() ?? 'png';
      const path = `logos/${userId ?? 'user'}/brand-logo.${ext}`;
      const uploadResult = await blink.storage.upload(file, path, { upsert: true });
      const url = typeof uploadResult === 'string' ? uploadResult : (uploadResult as any).publicUrl ?? (uploadResult as any).url;
      setLogoUrl(url);
      setLogoPreview(url);
      if (userId) localStorage.setItem(`brand_logo_url_${userId}`, url);
      toast.success('✅ Logo téléversé et enregistré');
    } catch (err: any) {
      toast.error('Erreur upload : ' + (err?.message ?? 'Réessayez'));
    } finally {
      setUploading(false);
    }
  }

  function handleSaveSettings() {
    if (userId) {
      localStorage.setItem(`brand_logo_url_${userId}`, logoUrl);
      localStorage.setItem(`watermark_position_${userId}`, position);
      localStorage.setItem(`watermark_opacity_${userId}`, String(opacity));
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast.success('Paramètres de branding sauvegardés');
  }

  const hasLogo = !!(logoUrl || logoPreview);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Logo config */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Layers size={16} className="text-primary" /> Smart Watermark — Branding automatique
        </h2>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Téléversez votre logo PNG transparent. Il sera automatiquement incrusté sur vos visuels générés avant publication ou export.
        </p>

        {/* Logo upload */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">Logo de votre marque</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }}
          />
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/3 transition-all"
          >
            {hasLogo ? (
              <div className="space-y-2">
                <img
                  src={logoPreview ?? logoUrl}
                  alt="Logo"
                  className="h-16 object-contain mx-auto rounded-lg"
                />
                <p className="text-xs text-primary font-medium">Logo enregistré ✓ — Cliquer pour changer</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload size={24} className="text-muted-foreground/40 mx-auto" />
                <p className="text-sm font-medium text-muted-foreground">
                  {uploading ? 'Téléversement…' : 'Cliquer pour téléverser votre logo'}
                </p>
                <p className="text-[11px] text-muted-foreground/50">PNG transparent recommandé · max 5MB</p>
              </div>
            )}
          </div>
        </div>

        {/* Position */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">Position du logo</label>
          <div className="grid grid-cols-2 gap-2">
            {POSITIONS.map(p => (
              <button
                key={p.id}
                onClick={() => setPosition(p.id)}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  position === p.id
                    ? 'border-primary bg-primary/8 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/30'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Opacity */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-2 flex items-center justify-between">
            <span>Opacité du filigrane</span>
            <span className="text-primary font-bold">{opacity}%</span>
          </label>
          <input
            type="range"
            min={20}
            max={100}
            value={opacity}
            onChange={e => setOpacity(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground/50 mt-1">
            <span>Subtil (20%)</span>
            <span>Visible (100%)</span>
          </div>
        </div>

        <Button onClick={handleSaveSettings} className="w-full gap-2">
          {saved ? <><Check size={15} /> Sauvegardé !</> : 'Sauvegarder les paramètres de branding'}
        </Button>
      </div>

      {/* Preview */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-bold text-foreground">Prévisualisation du watermark</h3>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">URL d'une image de test</label>
          <input
            type="url"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="https://exemple.com/image.jpg"
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {imageUrl ? (
          <div className="relative rounded-xl overflow-hidden border border-border bg-muted/20">
            <img src={imageUrl} alt="Prévisualisation" className="w-full h-auto max-h-72 object-cover" />
            {hasLogo && (
              <div
                className={`absolute ${
                  position === 'top-left'     ? 'top-3 left-3'   :
                  position === 'top-right'    ? 'top-3 right-3'  :
                  position === 'bottom-left'  ? 'bottom-3 left-3':
                                               'bottom-3 right-3'
                } p-2 rounded-lg bg-background/80 backdrop-blur-sm`}
                style={{ opacity: opacity / 100 }}
              >
                <img src={logoPreview ?? logoUrl} alt="Logo" className="h-8 object-contain" />
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-border h-48 flex items-center justify-center text-center">
            <div className="space-y-2">
              <ImageIcon size={28} className="text-muted-foreground/20 mx-auto" />
              <p className="text-xs text-muted-foreground">Entrez une URL d'image pour prévisualiser</p>
            </div>
          </div>
        )}

        <div className="bg-muted/40 rounded-xl p-4 space-y-1.5">
          <p className="text-xs font-semibold text-foreground">ℹ️ Comment ça fonctionne</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Une fois votre logo enregistré, Kompilot l'incrustera automatiquement à chaque génération d'image IA. Vos paramètres (position + opacité) sont mémorisés pour toutes vos futures créations.
          </p>
        </div>
      </div>
    </div>
  );
}
