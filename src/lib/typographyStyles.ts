/**
 * typographyStyles — shared font/style types for the Creative Factory typography toolbar.
 * Used by: FloatingTypographyToolbar, PhoneMockup, CockpitPage, BrandSettingsContext.
 */

// ── Font library ──────────────────────────────────────────────────────────────

export type FontFamilyId =
  | 'modern-sans'
  | 'classic-serif'
  | 'elegant-script'
  | 'bold-display';

export interface FontOption {
  id:        FontFamilyId;
  label:     string;
  preview:   string; // Google Fonts family name for @import
  cssFamily: string; // CSS font-family value
  emoji:     string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id:        'modern-sans',
    label:     'Modern Sans',
    preview:   'Inter',
    cssFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    emoji:     '🔵',
  },
  {
    id:        'classic-serif',
    label:     'Classic Serif',
    preview:   'Playfair Display',
    cssFamily: "'Playfair Display', Georgia, 'Times New Roman', serif",
    emoji:     '📖',
  },
  {
    id:        'elegant-script',
    label:     'Elegant Script',
    preview:   'Dancing Script',
    cssFamily: "'Dancing Script', 'Brush Script MT', cursive",
    emoji:     '✍️',
  },
  {
    id:        'bold-display',
    label:     'Bold Display',
    preview:   'Bebas Neue',
    cssFamily: "'Bebas Neue', 'Impact', 'Arial Black', sans-serif",
    emoji:     '⚡',
  },
];

// ── Text style state ──────────────────────────────────────────────────────────

export interface TextStyle {
  fontFamily:     FontFamilyId;
  bold:           boolean;
  italic:         boolean;
  underline:      boolean;
}

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily:  'modern-sans',
  bold:        false,
  italic:      false,
  underline:   false,
};

// ── Convert TextStyle → CSS style object ──────────────────────────────────────

export interface CSSStyleObject {
  fontFamily:     string;
  fontWeight:     string;
  fontStyle:      string;
  textDecoration: string;
}

export function textStyleToCSS(style: TextStyle): CSSStyleObject {
  const font = FONT_OPTIONS.find(f => f.id === style.fontFamily) ?? FONT_OPTIONS[0];
  return {
    fontFamily:     font.cssFamily,
    fontWeight:     style.bold      ? 'bold'       : 'normal',
    fontStyle:      style.italic    ? 'italic'     : 'normal',
    textDecoration: style.underline ? 'underline'  : 'none',
  };
}

// ── Prompt metadata (injected into AI prompt for image-gen context) ────────────

export function textStyleToPromptHint(style: TextStyle): string {
  const font  = FONT_OPTIONS.find(f => f.id === style.fontFamily) ?? FONT_OPTIONS[0];
  const parts: string[] = [`Police: ${font.label}`];
  if (style.bold)      parts.push('Gras');
  if (style.italic)    parts.push('Italique');
  if (style.underline) parts.push('Souligné');
  return `[Style typographique: ${parts.join(', ')}]`;
}

