import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ObsidianThemeCtx {
  obsidianEnabled: boolean;
  toggleObsidian: () => void;
}

const Ctx = createContext<ObsidianThemeCtx>({ obsidianEnabled: false, toggleObsidian: () => {} });

export function ObsidianThemeProvider({ children }: { children: ReactNode }) {
  const [obsidianEnabled, setObsidian] = useState(() => {
    try { return localStorage.getItem('nc_theme_obsidian') === '1'; } catch { return false; }
  });

  useEffect(() => {
    if (obsidianEnabled) {
      document.documentElement.classList.add('theme-obsidian');
    } else {
      document.documentElement.classList.remove('theme-obsidian');
    }
    try { localStorage.setItem('nc_theme_obsidian', obsidianEnabled ? '1' : '0'); } catch {}
  }, [obsidianEnabled]);

  return (
    <Ctx.Provider value={{ obsidianEnabled, toggleObsidian: () => setObsidian(p => !p) }}>
      {children}
    </Ctx.Provider>
  );
}

export const useObsidianTheme = () => useContext(Ctx);
