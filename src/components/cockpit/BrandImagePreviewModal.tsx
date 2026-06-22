/**
 * BrandImagePreviewModal — lets merchants test the brand overlay on a real image.
 * Shows side-by-side before/after preview, download processed image button.
 */
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ImagePlus, Loader2, ArrowLeftRight, Palette, ToggleLeft, ToggleRight } from 'lucide-react';
import { useBrandSettings } from '../../context/BrandSettingsContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function BrandImagePreviewModal({ open, onClose }: Props) {
  const { process, stored, update, resolved } = useBrandSettings();
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [view, setView] = useState<'side' | 'before' | 'after'>('side');

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async e => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;
      setOriginalUrl(dataUrl);
      setProcessedUrl(null);
      setIsProcessing(true);
      try {
        const result = await process(dataUrl);
        setProcessedUrl(result);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  }, [process]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleDownload = () => {
    if (!processedUrl) return;
    const a = document.createElement('a');
    a.href = processedUrl;
    a.download = `${resolved.businessName.replace(/\s+/g, '-')}-branded.jpg`;
    a.click();
  };

  const reset = () => {
    setOriginalUrl(null);
    setProcessedUrl(null);
    setView('side');
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Palette size={15} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Aperçu du Bandeau de Marque</p>
                  <p className="text-[11px] text-muted-foreground">Testez le résultat sur une vraie photo</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Brand enabled toggle */}
                <button
                  onClick={() => update({ enabled: !stored.enabled })}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  {stored.enabled
                    ? <ToggleRight size={18} className="text-primary" />
                    : <ToggleLeft size={18} />
                  }
                  {stored.enabled ? 'Bandeau activé' : 'Bandeau désactivé'}
                </button>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 min-h-0">
              {/* Upload zone (when no image yet) */}
              {!originalUrl && (
                <div
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                  onClick={() => document.getElementById('brand-preview-input')?.click()}
                  className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border bg-muted/20 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all py-16 px-8 text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <ImagePlus size={24} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Glissez une photo pour tester</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Ou cliquez pour importer · JPG, PNG, WEBP
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 mt-2">
                      Le bandeau "{resolved.businessName}" sera appliqué instantanément
                    </p>
                  </div>

                  {/* Brand settings summary */}
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold rounded-full px-2.5 py-1 border"
                      style={{ background: resolved.primaryColor + '18', borderColor: resolved.primaryColor + '40', color: resolved.primaryColor }}>
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: resolved.primaryColor }} />
                      Couleur principale
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold rounded-full px-2.5 py-1 border"
                      style={{ background: resolved.secondaryColor + '18', borderColor: resolved.secondaryColor + '40', color: resolved.secondaryColor }}>
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: resolved.secondaryColor }} />
                      Couleur accent
                    </span>
                    {resolved.showGoogleBadge && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700">
                        ⭐ Avis Google
                      </span>
                    )}
                    {resolved.showCarouselStripe && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2.5 py-1 bg-violet-50 border border-violet-200 text-violet-700">
                        ▬ Bande carrousel
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Processing spinner */}
              {isProcessing && (
                <div className="flex flex-col items-center justify-center gap-3 py-12">
                  <Loader2 size={32} className="animate-spin text-primary" />
                  <p className="text-sm font-semibold text-foreground">Application du bandeau de marque…</p>
                  <p className="text-[11px] text-muted-foreground">Canvas IA en cours · zéro dépendance externe</p>
                </div>
              )}

              {/* Preview (after processing) */}
              {originalUrl && processedUrl && !isProcessing && (
                <div className="space-y-4">
                  {/* View mode tabs */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1 bg-muted rounded-xl p-1">
                      {(['side', 'before', 'after'] as const).map(v => (
                        <button
                          key={v}
                          onClick={() => setView(v)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            view === v ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {v === 'side' && <ArrowLeftRight size={11} />}
                          {v === 'before' ? '📷 Avant' : v === 'after' ? '🎨 Après' : '↔ Côte à côte'}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={reset}
                        className="text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-muted"
                      >
                        Changer de photo
                      </button>
                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-1.5 text-[11px] font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-3 py-1.5 rounded-xl shadow-sm"
                      >
                        <Download size={12} /> Télécharger
                      </button>
                    </div>
                  </div>

                  {/* Image display */}
                  {view === 'side' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">Original</p>
                        <div className="rounded-xl overflow-hidden aspect-square bg-muted">
                          <img src={originalUrl} alt="Original" className="w-full h-full object-cover" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-wider text-center">🎨 Avec bandeau</p>
                        <div className="rounded-xl overflow-hidden aspect-square bg-muted ring-2 ring-primary/30">
                          <img src={processedUrl} alt="Avec bandeau" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-center uppercase tracking-wider text-muted-foreground">
                        {view === 'before' ? '📷 Photo originale' : '🎨 Avec bandeau de marque'}
                      </p>
                      <div className="rounded-xl overflow-hidden max-h-[420px] bg-muted flex items-center justify-center">
                        <img
                          src={view === 'before' ? originalUrl : processedUrl}
                          alt={view === 'before' ? 'Original' : 'Avec bandeau'}
                          className="max-h-[420px] w-auto max-w-full object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {/* Applied brand info */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50">
                    <span className="text-[10px] text-muted-foreground">Éléments appliqués :</span>
                    <span className="text-[10px] font-bold text-foreground bg-muted rounded-full px-2 py-0.5">
                      {resolved.businessName}
                    </span>
                    {resolved.instagramHandle && (
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                        {resolved.instagramHandle}
                      </span>
                    )}
                    {resolved.phone && (
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                        {resolved.phone}
                      </span>
                    )}
                    {resolved.showGoogleBadge && (
                      <span className="text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-700 rounded-full px-2 py-0.5">
                        ⭐ Macaron Avis Google
                      </span>
                    )}
                    <a href="/settings" className="ml-auto text-[10px] font-semibold text-primary hover:underline">
                      Modifier l'identité →
                    </a>
                  </div>
                </div>
              )}
            </div>

            <input
              id="brand-preview-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
