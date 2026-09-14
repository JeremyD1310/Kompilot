import { ExternalLink, Play, X } from 'lucide-react';

interface VideoPreviewDialogProps {
  open: boolean;
  title: string;
  src?: string;
  onClose: () => void;
}

export function VideoPreviewDialog({ open, title, src, onClose }: VideoPreviewDialogProps) {
  if (!open || !src) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-preview-title"
        className="w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
      >
        <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          <div className="flex min-w-0 items-center gap-2">
            <Play size={16} className="shrink-0 text-primary" />
            <h2 id="video-preview-title" className="truncate text-sm font-semibold text-foreground">{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer l’aperçu" className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground">
            <X size={18} />
          </button>
        </header>
        <div className="bg-slate-950 p-3 sm:p-5">
          <video src={src} controls autoPlay playsInline className="max-h-[70vh] w-full rounded-xl bg-slate-950 object-contain" />
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4">
          <p className="text-xs text-muted-foreground">Prévisualisation privée de votre vidéo générée par IA.</p>
          <a href={src} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
            Ouvrir dans un nouvel onglet <ExternalLink size={13} />
          </a>
        </footer>
      </section>
    </div>
  );
}
