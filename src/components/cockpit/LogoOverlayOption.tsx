import { cn } from '../../lib/utils';

export type LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface LogoOverlayOptionProps {
  enabled: boolean;
  onToggle: () => void;
  position: LogoPosition;
  onPositionChange: (p: LogoPosition) => void;
}

const POSITIONS: { id: LogoPosition; label: string; icon: string }[] = [
  { id: 'top-left', label: 'Haut gauche', icon: '↖' },
  { id: 'top-right', label: 'Haut droite', icon: '↗' },
  { id: 'bottom-left', label: 'Bas gauche', icon: '↙' },
  { id: 'bottom-right', label: 'Bas droite', icon: '↘' },
];

export function LogoOverlayOption({ enabled, onToggle, position, onPositionChange }: LogoOverlayOptionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-foreground">Incruster mon logo / filigrane ✨</span>
        <button
          onClick={onToggle}
          className={cn(
            'relative w-9 h-5 rounded-full transition-all duration-200 shrink-0',
            enabled ? 'bg-primary' : 'bg-muted-foreground/30'
          )}
        >
          <span className={cn(
            'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200',
            enabled ? 'left-[18px]' : 'left-0.5'
          )} />
        </button>
      </div>
      {enabled && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-muted-foreground">Position :</span>
          {POSITIONS.map(p => (
            <button
              key={p.id}
              onClick={() => onPositionChange(p.id)}
              title={p.label}
              className={cn(
                'w-7 h-7 rounded-md border text-sm font-bold transition-all',
                p.id === position
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              )}
            >
              {p.icon}
            </button>
          ))}
          <span className="text-[10px] text-muted-foreground">
            (défaut : bas droite)
          </span>
        </div>
      )}
    </div>
  );
}
