/**
 * FloatingTypographyToolbar — Interactive text formatting toolbar for the Creative Factory.
 *
 * Features:
 * - Bold / Italic / Underline toggles with keyboard shortcuts (Ctrl+B/I/U)
 * - Font Family selector: Modern Sans | Classic Serif | Elegant Script | Bold Display
 * - "Reset to brand style" button for agency users
 * - Floating position above the textarea, visible whenever the textarea is focused
 * - Live preview updates instantly on each change
 */

import React, { useEffect, useRef } from 'react';
import { Bold, Italic, Underline, Type, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  FONT_OPTIONS,
  DEFAULT_TEXT_STYLE,
  type FontFamilyId,
  type TextStyle,
} from '../../lib/typographyStyles';

interface Props {
  style:         TextStyle;
  onChange:      (next: TextStyle) => void;
  brandDefault?: TextStyle;
  /** Whether to show the "Reset to brand style" button (agency feature) */
  showReset?:    boolean;
  visible?:      boolean;
}

// ── Individual toggle button ──────────────────────────────────────────────────

function ToolbarButton({
  active, onClick, title, children, className,
}: {
  active?: boolean;
  onClick: () => void;
  title:   string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        'w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all select-none',
        'hover:bg-muted active:scale-95',
        active
          ? 'bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/30'
          : 'text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      {children}
    </button>
  );
}

// ── Font family picker ────────────────────────────────────────────────────────

function FontPicker({
  value, onChange,
}: {
  value: FontFamilyId;
  onChange: (id: FontFamilyId) => void;
}) {
  const current = FONT_OPTIONS.find(f => f.id === value) ?? FONT_OPTIONS[0];

  return (
    <div className="relative group">
      <button
        type="button"
        className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 hover:bg-muted/40 transition-all h-8"
        title="Famille de polices"
      >
        <Type size={12} className="text-primary shrink-0" />
        <span className="max-w-[92px] truncate">{current.label}</span>
        <span className="text-[10px] text-muted-foreground">▾</span>
      </button>

      {/* Dropdown */}
      <div className="absolute left-0 top-full mt-1 z-50 w-52 rounded-xl border border-border bg-popover shadow-lg overflow-hidden opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-all duration-150">
        {FONT_OPTIONS.map(font => (
          <button
            key={font.id}
            type="button"
            onClick={() => onChange(font.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/60 transition-colors',
              font.id === value && 'bg-primary/5 text-primary',
            )}
          >
            <span className="text-base shrink-0">{font.emoji}</span>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-semibold truncate"
                style={{ fontFamily: font.cssFamily }}
              >
                {font.label}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {font.preview}
              </p>
            </div>
            {font.id === value && (
              <span className="text-primary text-xs font-bold shrink-0">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main toolbar ──────────────────────────────────────────────────────────────

export function FloatingTypographyToolbar({
  style,
  onChange,
  brandDefault,
  showReset = false,
  visible = true,
}: Props) {
  const toolbarRef = useRef<HTMLDivElement>(null);

  const toggle = (key: 'bold' | 'italic' | 'underline') =>
    onChange({ ...style, [key]: !style[key] });

  const setFont = (id: FontFamilyId) => onChange({ ...style, fontFamily: id });

  const resetToBrand = () =>
    onChange(brandDefault ?? DEFAULT_TEXT_STYLE);

  const isModified =
    style.fontFamily !== (brandDefault?.fontFamily ?? DEFAULT_TEXT_STYLE.fontFamily) ||
    style.bold       !== (brandDefault?.bold       ?? false) ||
    style.italic     !== (brandDefault?.italic     ?? false) ||
    style.underline  !== (brandDefault?.underline  ?? false);

  // Keyboard shortcuts: Ctrl+B/I/U when toolbar or textarea is active
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!visible) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === 'b') { e.preventDefault(); toggle('bold'); }
      if (e.key === 'i') { e.preventDefault(); toggle('italic'); }
      if (e.key === 'u') { e.preventDefault(); toggle('underline'); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, style]);

  if (!visible) return null;

  return (
    <div
      ref={toolbarRef}
      className={cn(
        'flex items-center gap-1.5 rounded-xl border border-border bg-background/95 backdrop-blur-sm px-2.5 py-1.5 shadow-md',
        'animate-in fade-in slide-in-from-top-1 duration-150',
      )}
      role="toolbar"
      aria-label="Mise en forme du texte"
    >
      {/* Font family selector */}
      <FontPicker value={style.fontFamily} onChange={setFont} />

      <div className="w-px h-5 bg-border shrink-0 mx-0.5" />

      {/* B / I / U */}
      <ToolbarButton
        active={style.bold}
        onClick={() => toggle('bold')}
        title="Gras (Ctrl+B)"
        className="font-black text-sm"
      >
        <Bold size={14} strokeWidth={2.5} />
      </ToolbarButton>

      <ToolbarButton
        active={style.italic}
        onClick={() => toggle('italic')}
        title="Italique (Ctrl+I)"
      >
        <Italic size={14} strokeWidth={2} />
      </ToolbarButton>

      <ToolbarButton
        active={style.underline}
        onClick={() => toggle('underline')}
        title="Souligné (Ctrl+U)"
      >
        <Underline size={14} strokeWidth={2} />
      </ToolbarButton>

      {/* Reset to brand style (agency only) */}
      {showReset && isModified && (
        <>
          <div className="w-px h-5 bg-border shrink-0 mx-0.5" />
          <button
            type="button"
            onClick={resetToBrand}
            title="Réinitialiser au style de la marque"
            className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 px-2.5 py-1 text-[11px] font-semibold transition-all h-8"
          >
            <RotateCcw size={11} />
            <span className="hidden sm:inline">Style marque</span>
          </button>
        </>
      )}
    </div>
  );
}
