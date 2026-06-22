import { useRef, useCallback, useState } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../../lib/utils';
import { useBrandSettings } from '../../context/BrandSettingsContext';
import { Loader2 } from 'lucide-react';

interface SortableThumbProps {
  id: string;
  src: string;
  onRemove: () => void;
  onBlurFace: () => void;
  branded: boolean;
}

function SortableThumb({ id, src, onRemove, onBlurFace, branded }: SortableThumbProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative group w-20 h-20 rounded-xl overflow-hidden border-2 border-border shrink-0 cursor-grab active:cursor-grabbing"
    >
      <img src={src} alt="" className="w-full h-full object-cover" />

      {/* Brand badge */}
      {branded && (
        <span className="absolute top-0.5 left-0.5 text-[8px] bg-black/60 text-white/90 rounded px-1 py-0.5 font-bold leading-none">
          🎨
        </span>
      )}

      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title="Supprimer"
      >
        ×
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onBlurFace(); }}
        className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10"
        title="Flouter les visages"
      >
        👤
      </button>
    </div>
  );
}

interface MultiPhotoUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  onBlurFace: (index: number) => void;
}

export function MultiPhotoUpload({ images, onChange, onBlurFace }: MultiPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { process: processBrand, stored } = useBrandSettings();
  const [processing, setProcessing] = useState(false);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const remaining = 10 - images.length;
    const toProcess = Array.from(files).slice(0, remaining);

    setProcessing(true);
    try {
      const results: string[] = await Promise.all(
        toProcess.map(file => new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = async e => {
            const dataUrl = e.target?.result as string;
            if (!dataUrl) { resolve(''); return; }
            // Apply brand banner if enabled
            const branded = await processBrand(dataUrl);
            resolve(branded);
          };
          reader.readAsDataURL(file);
        }))
      );
      onChange([...images, ...results.filter(Boolean)]);
    } finally {
      setProcessing(false);
    }
  }, [images, onChange, processBrand]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = images.indexOf(active.id as string);
      const newIndex = images.indexOf(over.id as string);
      onChange(arrayMove(images, oldIndex, newIndex));
    }
  };

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-2 flex-wrap">
              {images.map((src, i) => (
                <SortableThumb
                  key={src}
                  id={src}
                  src={src}
                  branded={stored.enabled}
                  onRemove={() => onChange(images.filter((_, idx) => idx !== i))}
                  onBlurFace={() => onBlurFace(i)}
                />
              ))}
              {images.length < 10 && (
                <button
                  onClick={() => inputRef.current?.click()}
                  disabled={processing}
                  className={cn(
                    'w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-2xl text-muted-foreground hover:border-primary hover:text-primary transition-colors shrink-0',
                    processing && 'opacity-50 cursor-wait'
                  )}
                >
                  {processing ? <Loader2 size={18} className="animate-spin" /> : '+'}
                </button>
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {images.length === 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => !processing && inputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 px-4 py-6 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center',
            processing && 'opacity-60 cursor-wait'
          )}
        >
          {processing ? (
            <>
              <Loader2 size={24} className="animate-spin text-primary" />
              <p className="text-xs font-semibold text-primary">Traitement du bandeau de marque…</p>
            </>
          ) : (
            <>
              <span className="text-2xl">📸</span>
              <p className="text-xs font-semibold text-muted-foreground">
                Glissez vos photos ici ou cliquez pour importer
              </p>
              <p className="text-[10px] text-muted-foreground/70">
                Jusqu'à 10 photos pour créer un carrousel 📸
              </p>
              {stored.enabled && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5 mt-1">
                  🎨 Bandeau de marque actif
                </span>
              )}
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />

      {images.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {images.length === 1
              ? '1 photo sélectionnée — ajoutez-en plusieurs pour créer un carrousel.'
              : `${images.length} photos — faites glisser pour réorganiser. La première sera la photo de couverture.`}
          </p>
          {stored.enabled && (
            <span className="shrink-0 inline-flex items-center gap-1 text-[9px] font-bold text-primary bg-primary/8 border border-primary/15 rounded-full px-2 py-0.5">
              🎨 Identité appliquée
            </span>
          )}
        </div>
      )}
    </div>
  );
}
