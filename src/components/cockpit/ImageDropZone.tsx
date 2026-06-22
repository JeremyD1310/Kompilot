import { useState, useRef, useCallback } from 'react';
import { ImagePlus } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ImageDropZoneProps {
  onImage: (url: string) => void;
}

export function ImageDropZone({ onImage }: ImageDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const process = (file: File) => {
    if (file.type.startsWith('image/')) {
      onImage(URL.createObjectURL(file));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) process(f);
  }, []);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 cursor-pointer transition-all select-none',
        isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-muted/30'
      )}
    >
      <ImagePlus size={20} className="text-muted-foreground" />
      <div className="text-center">
        <p className="text-xs font-medium text-muted-foreground">Glissez votre image ici</p>
        <p className="text-[10px] text-muted-foreground/60">ou cliquez · JPG, PNG, WEBP</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) process(f);
        }}
      />
    </div>
  );
}
