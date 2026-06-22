import { Sun, Moon } from 'lucide-react';
import { useDarkMode } from '../../context/DarkModeContext';

export function DarkModeToggle() {
  const { isDark, toggleDarkMode } = useDarkMode();

  return (
    <button
      onClick={toggleDarkMode}
      className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all duration-150 cursor-pointer group hover:bg-muted/60 text-muted-foreground hover:text-foreground"
      title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors bg-muted/80 group-hover:bg-muted text-muted-foreground group-hover:text-foreground">
        {isDark ? <Sun size={14} /> : <Moon size={14} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold leading-tight truncate">
          {isDark ? 'Mode clair' : 'Mode sombre'}
        </p>
      </div>
      {/* Toggle pill */}
      <div className={`relative w-9 h-5 rounded-full transition-all duration-200 shrink-0 ${isDark ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${isDark ? 'left-[18px]' : 'left-0.5'}`} />
      </div>
    </button>
  );
}
