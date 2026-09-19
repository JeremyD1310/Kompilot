/**
 * DarkModeContext — Gère dark mode + thème Élite Obsidian & Gold.
 *
 * Modes :
 *   'light'    — Interface claire (défaut)
 *   'dark'     — Mode sombre standard (fond Navy #0F172A)
 *   'obsidian' — Thème Élite Obsidian & Gold (fond noir profond + accents or)
 *                Optimisé pour écrans OLED et usage terrain.
 */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'obsidian';

const STORAGE_KEY = 'kompilot_theme_mode';

interface DarkModeContextType {
  isDark: boolean;
  isObsidian: boolean;
  themeMode: ThemeMode;
  toggleDarkMode: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const DarkModeContext = createContext<DarkModeContextType>({
  isDark: false,
  isObsidian: false,
  themeMode: 'light',
  toggleDarkMode: () => {},
  setThemeMode: () => {},
});

// Apply theme classes to <html>
function applyTheme(mode: ThemeMode) {
  const el = document.documentElement;
  el.classList.remove('dark', 'obsidian', 'theme-obsidian');
  if (mode === 'dark')     el.classList.add('dark');
  if (mode === 'obsidian') { el.classList.add('dark', 'obsidian', 'theme-obsidian'); }
}

export function DarkModeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (stored && ['light', 'dark', 'obsidian'].includes(stored)) return stored;
      // Legacy 'dark' / 'light' key migration
      const legacy = localStorage.getItem('kompilot_dark_mode');
      if (legacy === 'dark') return 'dark';
      // Legacy ObsidianThemeContext migration. This key can be removed after
      // users have had one release cycle to migrate to kompilot_theme_mode.
      if (localStorage.getItem('nc_theme_obsidian') === '1') return 'obsidian';
    } catch {}
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const isDark      = themeMode !== 'light';
  const isObsidian  = themeMode === 'obsidian';

  // Toggle between light ↔ dark (not obsidian)
  const toggleDarkMode = () =>
    setThemeModeState(prev => prev === 'light' ? 'dark' : 'light');

  const setThemeMode = (mode: ThemeMode) => setThemeModeState(mode);

  // Persist + apply on change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, themeMode); } catch {}
    try { localStorage.removeItem('nc_theme_obsidian'); } catch {}
    applyTheme(themeMode);
  }, [themeMode]);

  return (
    <DarkModeContext.Provider value={{ isDark, isObsidian, themeMode, toggleDarkMode, setThemeMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export const useDarkMode = () => useContext(DarkModeContext);
