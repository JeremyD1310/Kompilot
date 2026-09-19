/**
 * GlobalSearch — Topbar search bar that searches across all entities.
 *
 * Queries /api/search on the backend and shows results in a dropdown.
 * Keyboard: ↑↓ to navigate, Enter to open, Esc to close.
 * Global shortcut: "/" to focus search bar (always, even from other inputs).
 * Filter: toggleable category badges (Tab + Space), keyboard-navigable.
 * Highlight: configurable color presets for query term highlighting.
 * Persistence: save/load filter + highlight preferences to user account via backend.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, X, Loader2, Check, Palette, Bookmark, BookmarkCheck, Trash2 } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { blink } from '../../blink/client';

type ResultType = 'establishment' | 'post' | 'contact' | 'message' | 'campaign' | 'scheduled_post';

interface SearchResult {
  id: string;
  type: ResultType;
  title: string;
  subtitle: string;
  url: string;
  icon: string;
}

interface SavedPreference {
  id: string;
  name: string;
  activeCategories: string;
  highlightStyle: string;
  createdAt: string;
}

const ALL_CATEGORIES: ResultType[] = [
  'establishment',
  'scheduled_post',
  'post',
  'contact',
  'message',
  'campaign',
];

const TYPE_LABELS: Record<ResultType, string> = {
  establishment: 'Établissement',
  scheduled_post: 'Publication planifiée',
  post: 'Publication',
  contact: 'Client',
  message: 'Message',
  campaign: 'Campagne',
};

const TYPE_COLORS: Record<string, string> = {
  establishment: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  scheduled_post: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  post: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  contact: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  message: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  campaign: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

// ── Highlight style presets ──────────────────────────────────────────────────

interface HighlightStyle {
  id: string;
  label: string;
  bg: string;
  text: string;
  textDark: string;
}

const HIGHLIGHT_PRESETS: HighlightStyle[] = [
  { id: 'amber',  label: 'Ambre',   bg: 'bg-amber-400/25',  text: 'text-amber-700',  textDark: 'dark:text-amber-300' },
  { id: 'teal',   label: 'Teal',    bg: 'bg-teal-400/25',   text: 'text-teal-700',   textDark: 'dark:text-teal-300' },
  { id: 'violet', label: 'Violet',  bg: 'bg-violet-400/25', text: 'text-violet-700', textDark: 'dark:text-violet-300' },
  { id: 'rose',   label: 'Rose',    bg: 'bg-rose-400/25',   text: 'text-rose-700',   textDark: 'dark:text-rose-300' },
  { id: 'lime',   label: 'Lime',    bg: 'bg-lime-400/25',   text: 'text-lime-700',   textDark: 'dark:text-lime-300' },
];

const DEFAULT_HIGHLIGHT = HIGHLIGHT_PRESETS[0];

function findStyle(id: string): HighlightStyle {
  return HIGHLIGHT_PRESETS.find(s => s.id === id) || DEFAULT_HIGHLIGHT;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function HighlightedText({ text, query, style }: { text: string; query: string; style: HighlightStyle }) {
  if (!query || query.length < 2) return <>{text}</>;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className={`rounded-[3px] px-px font-bold ${style.bg} ${style.text} ${style.textDark}`}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

// ── Component ───────────────────────────────────────────────────────────────

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [allResults, setAllResults] = useState<SearchResult[]>([]);
  const [activeCategories, setActiveCategories] = useState<Set<ResultType>>(
    () => new Set(ALL_CATEGORIES),
  );
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [highlightStyle, setHighlightStyle] = useState<HighlightStyle>(DEFAULT_HIGHLIGHT);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [filterFocusIndex, setFilterFocusIndex] = useState(-1);

  // ── Saved preferences ─────────────────────────────────────────────────────

  const [savedPrefs, setSavedPrefs] = useState<SavedPreference[]>([]);
  const [showPrefsMenu, setShowPrefsMenu] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const prefsLoadedRef = useRef(false);

  // Load saved preferences from backend on first render
  useEffect(() => {
    if (prefsLoadedRef.current) return;
    prefsLoadedRef.current = true;

    const loadPrefs = async () => {
      try {
        const res = await blink.functions.invoke<{ preferences: SavedPreference[] }>(
          'api/search-preferences',
          { method: 'GET' },
        );
        const data = (res as any)?.data ?? res;
        const prefs = data?.preferences ?? [];
        setSavedPrefs(prefs);

        // Auto-load the most recently updated preference
        if (prefs.length > 0) {
          const latest = prefs[0];
          try {
            const cats = JSON.parse(latest.activeCategories) as ResultType[];
            if (Array.isArray(cats) && cats.length > 0) {
              setActiveCategories(new Set(cats));
            }
          } catch { /* ignore parse errors */ }
          const style = findStyle(latest.highlightStyle);
          setHighlightStyle(style);
        }
      } catch {
        // Not authenticated yet — will retry when user signs in
        setSavedPrefs([]);
      }
    };

    // Delay slightly to let auth settle
    const t = setTimeout(loadPrefs, 1500);
    return () => clearTimeout(t);
  }, []);

  // ── Save current preferences ──────────────────────────────────────────────

  const saveCurrentPreferences = useCallback(async () => {
    const name = saveName.trim() || 'Filtres rapides';
    const cats = Array.from(activeCategories);
    try {
      const res = await blink.functions.invoke<{ preference: SavedPreference }>(
        'api/search-preferences',
        {
          method: 'POST',
          body: {
            name,
            active_categories: cats,
            highlight_style: highlightStyle.id,
          },
        },
      );
      const data = (res as any)?.data ?? res;
      const pref = data?.preference;
      if (pref) {
        setSavedPrefs(prev => [pref, ...prev].slice(0, 20));
        setShowSaveInput(false);
        setSaveName('');
      }
    } catch {
      // silently fail — user can retry
    }
  }, [activeCategories, highlightStyle, saveName]);

  // ── Load a saved preference ───────────────────────────────────────────────

  const loadPreference = useCallback((pref: SavedPreference) => {
    try {
      const cats = JSON.parse(pref.activeCategories) as ResultType[];
      if (Array.isArray(cats) && cats.length > 0) {
        setActiveCategories(new Set(cats));
      }
    } catch { /* ignore */ }
    setHighlightStyle(findStyle(pref.highlightStyle));
    setShowPrefsMenu(false);
    setActiveIndex(0);
  }, []);

  // ── Delete a saved preference ─────────────────────────────────────────────

  const deletePreference = useCallback(async (prefId: string) => {
    try {
      await blink.functions.invoke(`api/search-preferences/${prefId}`, {
        method: 'DELETE',
      });
      setSavedPrefs(prev => prev.filter(p => p.id !== prefId));
    } catch {
      // silently fail
    }
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const filterRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const navigate = useNavigate();

  // ── Search ────────────────────────────────────────────────────────────────

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setAllResults([]);
      setIsOpen(false);
      return;
    }

    setIsDebouncing(false);
    setIsLoading(true);
    try {
      const query = new URLSearchParams({ q, limit: '5' });
      const res = await blink.functions.invoke<{ results: SearchResult[] }>(`api/search?${query}`, {
        method: 'GET',
      });
      const data = (res as any)?.data ?? res;
      setAllResults(data.results || []);
      setActiveIndex(0);
      setIsOpen(true);
    } catch {
      setAllResults([]);
      setIsOpen(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Debounced input ───────────────────────────────────────────────────────

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setQuery(v);
      clearTimeout(debounceRef.current);
      setFilterFocusIndex(-1);

      if (v.length >= 2) {
        setIsDebouncing(true);
        setAllResults([]);
      } else {
        setIsDebouncing(false);
        setAllResults([]);
        setIsOpen(false);
      }

      debounceRef.current = setTimeout(() => doSearch(v), 250);
    },
    [doSearch],
  );

  // ── Close ─────────────────────────────────────────────────────────────────

  const close = useCallback(() => {
    setIsOpen(false);
    setShowHighlightPicker(false);
    setShowPrefsMenu(false);
    setShowSaveInput(false);
    setQuery('');
    setAllResults([]);
    setActiveIndex(0);
    setFilterFocusIndex(-1);
    setIsDebouncing(false);
    setIsLoading(false);
    inputRef.current?.blur();
  }, []);

  // ── Filtered results ─────────────────────────────────────────────────────

  const filteredResults = useMemo(
    () => allResults.filter(r => activeCategories.has(r.type)),
    [allResults, activeCategories],
  );

  const hasResults = allResults.length > 0;

  useEffect(() => {
    if (activeIndex >= filteredResults.length) {
      setActiveIndex(Math.max(0, filteredResults.length - 1));
    }
  }, [filteredResults.length, activeIndex]);

  // ── Category toggle ──────────────────────────────────────────────────────

  const toggleCategory = useCallback((t: ResultType) => {
    setActiveCategories(prev => {
      const next = new Set(prev);
      if (next.has(t)) {
        if (next.size <= 1) return prev;
        next.delete(t);
      } else {
        next.add(t);
      }
      return next;
    });
    setActiveIndex(0);
    setFilterFocusIndex(-1);
  }, []);

  // ── Keyboard: filter pills navigation ─────────────────────────────────────

  const handleFilterKeyDown = useCallback(
    (e: React.KeyboardEvent, idx: number) => {
      switch (e.key) {
        case 'Tab': {
          e.preventDefault();
          const dir = e.shiftKey ? -1 : 1;
          const next =
            dir > 0
              ? idx + 1 >= ALL_CATEGORIES.length ? -1 : idx + 1
              : idx - 1 < -1 ? ALL_CATEGORIES.length - 1 : idx - 1;
          setFilterFocusIndex(next);
          if (next >= 0 && next < ALL_CATEGORIES.length) {
            filterRefs.current[next]?.focus();
          } else {
            inputRef.current?.focus();
          }
          break;
        }
        case ' ': {
          e.preventDefault();
          toggleCategory(ALL_CATEGORIES[idx]);
          break;
        }
        case 'ArrowRight':
        case 'ArrowDown': {
          e.preventDefault();
          const next = (idx + 1) % ALL_CATEGORIES.length;
          setFilterFocusIndex(next);
          filterRefs.current[next]?.focus();
          break;
        }
        case 'ArrowLeft':
        case 'ArrowUp': {
          e.preventDefault();
          const next = (idx - 1 + ALL_CATEGORIES.length) % ALL_CATEGORIES.length;
          setFilterFocusIndex(next);
          filterRefs.current[next]?.focus();
          break;
        }
      }
    },
    [toggleCategory],
  );

  // ── Keyboard navigation (results list) ────────────────────────────────────

  const safeLength = filteredResults.length;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'Escape') close();
        return;
      }

      if (safeLength === 0) {
        if (e.key === 'Escape') close();
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex(i => (i + 1) % safeLength);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex(i => (i - 1 + safeLength) % safeLength);
          break;
        case 'Enter': {
          e.preventDefault();
          const r = filteredResults[activeIndex];
          if (r) {
            close();
            navigate({ to: r.url as any });
          }
          break;
        }
        case 'Escape':
          close();
          break;
      }
    },
    [isOpen, safeLength, filteredResults, activeIndex, close, navigate],
  );

  // ── Global "/" shortcut ───────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Click outside to close ────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [close]);

  // ── Cleanup debounce ─────────────────────────────────────────────────────

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} className="relative w-full max-w-[480px]">
      {/* Search input */}
      <div className="flex items-center rounded-xl border border-border/60 bg-muted/40 hover:bg-muted/70 focus-within:bg-background focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
        <Search size={15} className="ml-3 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => {
            if (allResults.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Rechercher un client, un message, une campagne…"
          className="flex-1 bg-transparent border-0 outline-none text-xs text-foreground placeholder:text-muted-foreground/60 py-2 px-2"
        />

        {isLoading && (
          <div className="mr-3 flex items-center">
            <Loader2 size={14} className="text-primary animate-spin" />
          </div>
        )}

        {isDebouncing && !isLoading && (
          <div className="mr-3 flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground/70 font-medium">buffering</span>
            <span className="flex gap-0.5">
              <span className="w-1 h-1 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          </div>
        )}

        {!isLoading && !isDebouncing && query && (
          <button
            onClick={close}
            className="mr-2 p-1 rounded-md hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={13} />
          </button>
        )}

        {!isDebouncing && !isLoading && !query && (
          <kbd className="mr-2.5 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-muted border border-border text-[10px] font-mono text-muted-foreground">
            /
          </kbd>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-2xl shadow-xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-150">
          {/* ── Toolbar: category filter pills + highlight picker + save/load ── */}
          {hasResults && (
            <div className="px-3 py-2 border-b border-border flex items-center gap-2 flex-wrap">
              {/* Category pills */}
              <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                {ALL_CATEGORIES.map((t, i) => {
                  const catActive = activeCategories.has(t);
                  const colorClass = TYPE_COLORS[t] || '';
                  return (
                    <button
                      key={t}
                      ref={el => { filterRefs.current[i] = el; }}
                      role="checkbox"
                      aria-checked={catActive}
                      tabIndex={filterFocusIndex === i ? 0 : -1}
                      onClick={() => toggleCategory(t)}
                      onKeyDown={e => handleFilterKeyDown(e, i)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold border transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                        catActive
                          ? `${colorClass}`
                          : 'bg-muted/50 text-muted-foreground/50 border-border/40 line-through'
                      }`}
                    >
                      {catActive && <Check size={9} className="shrink-0" />}
                      {TYPE_LABELS[t]}
                    </button>
                  );
                })}
              </div>

              {/* Highlight style picker */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowHighlightPicker(v => !v)}
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Style de surbrillance"
                >
                  <Palette size={13} />
                </button>
                {showHighlightPicker && (
                  <div className="absolute right-0 top-full mt-1 bg-background border border-border rounded-xl shadow-lg p-1.5 z-[110] flex gap-1">
                    {HIGHLIGHT_PRESETS.map(s => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setHighlightStyle(s);
                          setShowHighlightPicker(false);
                        }}
                        title={s.label}
                        className={`w-5 h-5 rounded-full border-2 transition-all ${
                          highlightStyle.id === s.id ? 'border-primary scale-110' : 'border-transparent hover:scale-105'
                        } ${s.bg} ${s.text}`}
                      >
                        <span className="block w-full h-full rounded-full" style={{ background: 'currentColor', opacity: 0.5 }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Save current filters */}
              <div className="relative shrink-0">
                <button
                  onClick={() => { setShowSaveInput(v => !v); setShowPrefsMenu(false); }}
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Enregistrer les filtres"
                >
                  <Bookmark size={13} />
                </button>
                {showSaveInput && (
                  <div className="absolute right-0 top-full mt-1 bg-background border border-border rounded-xl shadow-lg p-2 z-[110] flex items-center gap-1.5 min-w-[200px]">
                    <input
                      type="text"
                      value={saveName}
                      onChange={e => setSaveName(e.target.value)}
                      placeholder="Nom du filtre…"
                      className="flex-1 text-[11px] bg-muted/50 border border-border rounded-md px-2 py-1 outline-none focus:border-primary/50"
                      onKeyDown={e => { if (e.key === 'Enter') saveCurrentPreferences(); }}
                      autoFocus
                    />
                    <button
                      onClick={saveCurrentPreferences}
                      className="shrink-0 p-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <BookmarkCheck size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Load saved filters */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowPrefsMenu(v => !v)}
                  className={`p-1.5 rounded-md transition-colors ${
                    savedPrefs.length > 0
                      ? 'text-primary hover:bg-primary/10'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                  title="Filtres enregistrés"
                  disabled={savedPrefs.length === 0}
                >
                  <BookmarkCheck size={13} />
                </button>
                {showPrefsMenu && savedPrefs.length > 0 && (
                  <div className="absolute right-0 top-full mt-1 bg-background border border-border rounded-xl shadow-lg p-1.5 z-[110] min-w-[220px] max-h-[200px] overflow-y-auto">
                    {savedPrefs.map(pref => (
                      <div
                        key={pref.id}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-muted/70 transition-colors group cursor-pointer"
                        onClick={() => loadPreference(pref)}
                      >
                        <BookmarkCheck size={12} className="text-primary shrink-0" />
                        <span className="flex-1 text-[11px] font-medium text-foreground truncate">
                          {pref.name}
                        </span>
                        <button
                          onClick={e => { e.stopPropagation(); deletePreference(pref.id); }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                          title="Supprimer"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Empty states ── */}
          {!hasResults && !isLoading && (
            <div className="px-4 py-10 text-center">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                <Search size={18} className="text-muted-foreground/60" />
              </div>
              <p className="text-xs font-semibold text-foreground mb-1">Aucun résultat trouvé</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Aucun élément ne correspond à <strong className="text-foreground font-semibold">«&nbsp;{query}&nbsp;»</strong>.
                <br />
                Essayez un autre terme ou vérifiez les filtres de catégorie.
              </p>
            </div>
          )}

          {/* ── Results list ── */}
          {hasResults && filteredResults.length > 0 && (
            <div className="p-1.5 max-h-[320px] overflow-y-auto">
              {filteredResults.map((r, i) => {
                const typeLabel = TYPE_LABELS[r.type] || 'Publication';
                const colorClass = TYPE_COLORS[r.type] || 'bg-muted text-muted-foreground border-border';
                const isActive = i === activeIndex;
                return (
                  <button
                    key={`${r.type}-${r.id}`}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => {
                      close();
                      navigate({ to: r.url as any });
                    }}
                    className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                      isActive ? 'bg-primary/8 border border-primary/15' : 'hover:bg-muted border border-transparent'
                    }`}
                  >
                    <span className="text-base shrink-0 mt-0.5">{r.icon || '🔍'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        <HighlightedText text={r.title} query={query} style={highlightStyle} />
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        <HighlightedText text={r.subtitle} query={query} style={highlightStyle} />
                      </p>
                    </div>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md border shrink-0 mt-0.5 ${colorClass}`}>
                      {typeLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Empty after filter ── */}
          {hasResults && filteredResults.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-[11px] text-muted-foreground mb-2">
                Aucun résultat dans les catégories sélectionnées.
              </p>
              <button
                onClick={() => setActiveCategories(new Set(ALL_CATEGORIES))}
                className="text-primary font-semibold text-[11px] hover:underline"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}

          {/* Footer with keyboard hints */}
          <div className="px-3 py-2 border-t border-border flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-muted text-[9px]">↑↓</span>
              Naviguer
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-muted text-[9px]">↵</span>
              Ouvrir
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-muted text-[9px]">Esc</span>
              Fermer
            </span>
            <span className="flex items-center gap-1 ml-auto">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-muted text-[9px]">␣</span>
              Filtrer
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
