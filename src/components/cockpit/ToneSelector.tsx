import { cn } from '../../lib/utils';

export type CaptionTone = 'chaleureux' | 'direct' | 'pro' | 'fun';

interface ToneOption {
  id: CaptionTone;
  label: string;
  emoji: string;
}

const CAPTION_TONES: ToneOption[] = [
  { id: 'chaleureux', label: 'Chaleureux', emoji: '😊' },
  { id: 'direct', label: 'Direct / Promo', emoji: '⚡' },
  { id: 'pro', label: 'Pro', emoji: '💼' },
  { id: 'fun', label: 'Fun', emoji: '🎭' },
];

interface ToneSelectorProps {
  value: CaptionTone;
  onChange: (v: CaptionTone) => void;
  disabled?: boolean;
}

export function ToneSelector({ value, onChange, disabled }: ToneSelectorProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[11px] text-muted-foreground font-medium shrink-0">Style du message :</span>
      {CAPTION_TONES.map(t => (
        <button
          key={t.id}
          onClick={() => !disabled && onChange(t.id)}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all select-none',
            t.id === value
              ? 'border-primary bg-primary text-primary-foreground shadow-sm'
              : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-primary/5',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {t.emoji} {t.label}
        </button>
      ))}
    </div>
  );
}
