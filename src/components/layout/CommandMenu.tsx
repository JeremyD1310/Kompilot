import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, X } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CommandAction {
  id: string;
  icon: string;
  label: string;
  shortcut: string;
  category: string;
  action: () => void;
}

// ── Internal event bus (avoids prop drilling) ─────────────────────────────────

const CMD_OPEN_EVENT = 'commandmenu:open';
const CMD_CLOSE_EVENT = 'commandmenu:close';
const CMD_TOGGLE_EVENT = 'commandmenu:toggle';

// ── Hook ──────────────────────────────────────────────────────────────────────

function useCommandMenuState() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(v => !v), []);

  // Listen to global keyboard shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggle]);

  // Listen to custom events from the trigger button
  useEffect(() => {
    window.addEventListener(CMD_OPEN_EVENT, open);
    window.addEventListener(CMD_CLOSE_EVENT, close);
    window.addEventListener(CMD_TOGGLE_EVENT, toggle);
    return () => {
      window.removeEventListener(CMD_OPEN_EVENT, open);
      window.removeEventListener(CMD_CLOSE_EVENT, close);
      window.removeEventListener(CMD_TOGGLE_EVENT, toggle);
    };
  }, [open, close, toggle]);

  return { isOpen, open, close, toggle };
}

// ── Main component ────────────────────────────────────────────────────────────

export function CommandMenu() {
  const navigate = useNavigate();
  const { isOpen, close } = useCommandMenuState();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Actions are created inside the component so navigate() is in scope
  const ACTIONS: CommandAction[] = [
    {
      id: 'new-post',
      icon: '📝',
      label: 'Rédiger un post',
      shortcut: 'P',
      category: 'Contenu',
      action: () => navigate({ to: '/cockpit' }),
    },
    {
      id: 'calendar',
      icon: '📅',
      label: 'Ouvrir le calendrier',
      shortcut: 'C',
      category: 'Contenu',
      action: () => navigate({ to: '/calendar' }),
    },
    {
      id: 'inbox',
      icon: '💬',
      label: 'Boîte de réception',
      shortcut: 'I',
      category: 'Messagerie',
      action: () => navigate({ to: '/inbox' }),
    },
    {
      id: 'no-show',
      icon: '🛡️',
      label: 'Ajuster le No-Show',
      shortcut: 'N',
      category: 'Business',
      action: () => navigate({ to: '/settings' }),
    },
    {
      id: 'vacation',
      icon: '🏖️',
      label: 'Activer le Mode Vacances',
      shortcut: 'V',
      category: 'Business',
      action: () =>
        window.dispatchEvent(new CustomEvent('kompilot:open-vacation')),
    },
    {
      id: 'geo',
      icon: '🌍',
      label: 'Analyse G.E.O.',
      shortcut: 'G',
      category: 'Visibilité',
      action: () => navigate({ to: '/geo-authority' }),
    },
    {
      id: 'reviews',
      icon: '⭐',
      label: 'Gérer mes avis Google',
      shortcut: 'A',
      category: 'Visibilité',
      action: () => navigate({ to: '/reviews' }),
    },
    {
      id: 'dashboard',
      icon: '🏠',
      label: 'Tableau de bord',
      shortcut: 'D',
      category: 'Navigation',
      action: () => navigate({ to: '/dashboard' }),
    },
    {
      id: 'team',
      icon: '👥',
      label: 'Espace Équipe',
      shortcut: 'T',
      category: 'Collaboration',
      action: () => navigate({ to: '/team' }),
    },
    {
      id: 'team-chat',
      icon: '💬',
      label: 'Chat équipe',
      shortcut: '',
      category: 'Collaboration',
      action: () => navigate({ to: '/team' }),
    },
    {
      id: 'agents-cowork',
      icon: '🤖',
      label: 'Agents IA — Claude Cowork',
      shortcut: '',
      category: 'Collaboration',
      action: () => navigate({ to: '/agence/cowork' }),
    },
    {
      id: 'agents-sprint',
      icon: '⚡',
      label: 'Lancer un sprint Content Factory',
      shortcut: '',
      category: 'Collaboration',
      action: () => navigate({ to: '/agence/cowork' }),
    },
  ];

  // ── Filter by query ───────────────────────────────────────────────────────
  const filtered = query.trim()
    ? ACTIONS.filter(
        a =>
          a.label.toLowerCase().includes(query.toLowerCase()) ||
          a.category.toLowerCase().includes(query.toLowerCase()),
      )
    : ACTIONS;

  // Group by category while preserving insertion order
  const grouped = filtered.reduce<Record<string, CommandAction[]>>(
    (acc, action) => {
      if (!acc[action.category]) acc[action.category] = [];
      acc[action.category].push(action);
      return acc;
    },
    {},
  );

  const flatActions = Object.values(grouped).flat();

  // Reset active index when filter changes
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Focus input + reset state when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Keyboard navigation inside the modal
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        close();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(i => Math.min(i + 1, flatActions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const action = flatActions[activeIndex];
        if (action) {
          action.action();
          close();
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, flatActions, activeIndex, close]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`,
    );
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const runAction = (action: CommandAction) => {
    action.action();
    close();
  };

  return (
    <>
      {/* ── Floating trigger button ─────────────────────────────────────────── */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent(CMD_TOGGLE_EVENT))}
        aria-label="Ouvrir le menu de commande (⌘K)"
        className="fixed bottom-20 right-5 z-40 group"
      >
        {/* Circle */}
        <span
          className="relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200"
          style={{
            background: 'rgba(15,23,42,0.92)',
            border: '1px solid rgba(13,148,136,0.4)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          <Command
            size={18}
            style={{ color: 'rgba(94,234,212,0.85)' }}
            className="group-hover:scale-110 transition-transform duration-150"
          />
          {/* Glow */}
          <span
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{ boxShadow: '0 0 16px 6px rgba(13,148,136,0.28)' }}
          />
        </span>

        {/* Tooltip */}
        <span
          className="absolute right-14 bottom-1/2 translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap text-xs font-medium px-2 py-1 rounded-md"
          style={{
            background: 'rgba(15,23,42,0.97)',
            border: '1px solid rgba(255,255,255,0.10)',
            color: 'rgba(148,163,184,1)',
          }}
        >
          ⌘K
        </span>
      </button>

      {/* ── Modal ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="cmd-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[1000]"
              style={{
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
              }}
              onClick={close}
              aria-hidden="true"
            />

            {/* Panel */}
            <motion.div
              key="cmd-panel"
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
              className="fixed left-1/2 top-[18%] z-[1001] w-full max-w-[520px] px-4"
              style={{ transform: 'translateX(-50%)' }}
              role="dialog"
              aria-modal="true"
              aria-label="Menu de commande"
            >
              <div
                className="flex flex-col overflow-hidden"
                style={{
                  background: '#0F172A',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.10)',
                  boxShadow:
                    '0 32px 64px -16px rgba(0,0,0,0.7), 0 0 0 1px rgba(13,148,136,0.2)',
                }}
              >
                {/* ── Search bar ───────────────────────────────────────── */}
                <div
                  className="flex items-center gap-3 px-4"
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                    minHeight: '52px',
                  }}
                >
                  <Search
                    size={16}
                    style={{ color: 'rgba(100,116,139,1)', flexShrink: 0 }}
                  />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Rechercher une action..."
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{
                      color: 'rgba(226,232,240,1)',
                      caretColor: 'rgba(45,212,191,1)',
                    }}
                    spellCheck={false}
                    autoComplete="off"
                    aria-label="Rechercher une action"
                  />
                  {query && (
                    <button
                      onClick={() => {
                        setQuery('');
                        inputRef.current?.focus();
                      }}
                      className="flex items-center justify-center w-5 h-5 rounded transition-colors"
                      style={{ color: 'rgba(100,116,139,1)' }}
                      aria-label="Effacer la recherche"
                      tabIndex={-1}
                    >
                      <X size={13} />
                    </button>
                  )}
                  <kbd
                    className="hidden sm:flex items-center text-[10px] px-1.5 py-0.5 rounded-md font-mono"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      color: 'rgba(100,116,139,1)',
                    }}
                  >
                    ESC
                  </kbd>
                </div>

                {/* ── Results list ─────────────────────────────────────── */}
                <div
                  ref={listRef}
                  className="overflow-y-auto py-2"
                  style={{ maxHeight: '380px' }}
                  role="listbox"
                >
                  {flatActions.length === 0 ? (
                    <div
                      className="flex flex-col items-center justify-center py-10 gap-2 select-none"
                      style={{ color: 'rgba(100,116,139,1)' }}
                    >
                      <Search size={20} style={{ opacity: 0.35 }} />
                      <span className="text-sm">
                        Aucun résultat pour «&nbsp;{query}&nbsp;»
                      </span>
                    </div>
                  ) : (
                    Object.entries(grouped).map(([category, actions]) => (
                      <div key={category}>
                        {/* Category header */}
                        <div
                          className="px-4 pt-3 pb-1 select-none"
                          style={{
                            fontSize: '10px',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: 'rgba(100,116,139,1)',
                          }}
                        >
                          {category}
                        </div>

                        {/* Action rows */}
                        {actions.map(action => {
                          const idx = flatActions.indexOf(action);
                          const active = idx === activeIndex;

                          return (
                            <button
                              key={action.id}
                              data-index={idx}
                              onClick={() => runAction(action)}
                              onMouseEnter={() => setActiveIndex(idx)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-75"
                              style={{
                                background: active
                                  ? 'rgba(13,148,136,0.15)'
                                  : 'transparent',
                                color: active
                                  ? 'rgba(45,212,191,1)'
                                  : 'rgba(203,213,225,1)',
                                borderLeft: `3px solid ${active ? 'rgba(13,148,136,1)' : 'transparent'}`,
                              }}
                              role="option"
                              aria-selected={active}
                            >
                              {/* Emoji icon */}
                              <span
                                className="flex items-center justify-center shrink-0 select-none"
                                style={{
                                  width: '20px',
                                  fontSize: '16px',
                                  lineHeight: 1,
                                }}
                              >
                                {action.icon}
                              </span>

                              {/* Label */}
                              <span className="flex-1 text-sm font-medium leading-none">
                                {action.label}
                              </span>

                              {/* Shortcut kbd */}
                              <kbd
                                className="flex items-center text-[11px] px-1.5 py-0.5 rounded font-mono shrink-0 transition-all duration-75"
                                style={{
                                  background: active
                                    ? 'rgba(13,148,136,0.25)'
                                    : 'rgba(255,255,255,0.08)',
                                  border: `1px solid ${active ? 'rgba(13,148,136,0.4)' : 'rgba(255,255,255,0.08)'}`,
                                  color: active
                                    ? 'rgba(45,212,191,0.9)'
                                    : 'rgba(100,116,139,1)',
                                }}
                              >
                                {action.shortcut}
                              </kbd>
                            </button>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>

                {/* ── Footer hints ─────────────────────────────────────── */}
                <div
                  className="flex items-center justify-between gap-2 px-4 py-2 select-none"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center gap-3">
                    {(
                      [
                        { key: '↑↓', label: 'Naviguer' },
                        { key: '↵', label: 'Sélectionner' },
                      ] as const
                    ).map(({ key, label }) => (
                      <span
                        key={key}
                        className="flex items-center gap-1.5 text-[11px]"
                        style={{ color: 'rgba(71,85,105,1)' }}
                      >
                        <kbd
                          className="px-1 py-0.5 rounded text-[10px] font-mono"
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'rgba(100,116,139,1)',
                          }}
                        >
                          {key}
                        </kbd>
                        {label}
                      </span>
                    ))}
                  </div>
                  <span
                    className="flex items-center gap-1 text-[11px]"
                    style={{ color: 'rgba(71,85,105,1)' }}
                  >
                    <Command size={10} />
                    Kompilot
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
