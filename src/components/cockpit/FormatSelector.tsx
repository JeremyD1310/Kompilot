import { cn } from '../../lib/utils';

export type PublicationFormat = 'post' | 'reel' | 'story' | 'seo-local';

interface FormatOption {
  id: PublicationFormat;
  label: string;
  emoji: string;
  hint: string;
}

const FORMATS: FormatOption[] = [
  {
    id: 'post',
    label: 'Post Classique',
    emoji: '🖼️',
    hint: 'Idéal pour le feed, les photos ou les annonces permanentes',
  },
  {
    id: 'reel',
    label: 'Reel / Vidéo',
    emoji: '🎬',
    hint: 'Boostez votre visibilité locale avec un geste ou un plat en mouvement',
  },
  {
    id: 'story',
    label: 'Story Éphémère',
    emoji: '⚡',
    hint: 'Urgences du jour, places de dernière minute, coulisses',
  },
  {
    id: 'seo-local',
    label: 'Article SEO Local',
    emoji: '🌐',
    hint: 'Générez un article de blog 300–500 mots optimisé Google avec balises Meta prêtes à coller sur WordPress, Wix, etc.',
  },
];

interface FormatSelectorProps {
  value: PublicationFormat;
  onChange: (v: PublicationFormat) => void;
}

export function FormatSelector({ value, onChange }: FormatSelectorProps) {
  const active = FORMATS.find(f => f.id === value);
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
        Format de publication
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {FORMATS.map(f => {
          const isActive = f.id === value;
          const isSeo = f.id === 'seo-local';
          return (
            <button
              key={f.id}
              onClick={() => onChange(f.id)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-2.5 text-center transition-all select-none cursor-pointer relative',
                isActive
                  ? isSeo
                    ? 'border-violet-500 bg-violet-500/10 shadow-[0_0_12px_rgba(139,92,246,0.25)]'
                    : 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                  : 'border-border bg-background hover:border-primary/40 hover:bg-primary/5'
              )}
            >
              {isSeo && !isActive && (
                <span className="absolute -top-1.5 -right-1.5 rounded-full bg-violet-500 text-white text-[8px] font-extrabold px-1.5 py-0.5 uppercase tracking-wide">
                  NEW
                </span>
              )}
              <span className="text-lg">{f.emoji}</span>
              <span className={cn(
                'text-[10px] font-bold leading-tight text-center',
                isActive
                  ? isSeo ? 'text-violet-700' : 'text-emerald-700'
                  : 'text-foreground'
              )}>
                {f.label}
              </span>
            </button>
          );
        })}
      </div>
      {active && (
        <p className="text-[10px] text-muted-foreground leading-relaxed italic px-1">
          💡 {active.hint}
        </p>
      )}
    </div>
  );
}
