/**
 * TermTooltip — Badge logo d'aide pour les termes complexes (AIO, SEO, GEO, GEA, SEA…).
 * Affiche un tooltip riche au hover + un panel détaillé au clic.
 *
 * Usage :
 *   <TermTooltip term="AIO" />
 *   <TermBadge term="GEA">Score GEA</TermBadge>
 */
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Lightbulb, BookOpen } from 'lucide-react';
import { cn } from '@blinkdotnew/ui';
import { getTerm, CATEGORY_LABELS, CATEGORY_COLORS, type TermDefinition } from './termGlossary';

// ── TermPanel (modal) ────────────────────────────────────────────────────────
function TermPanel({ def, onClose }: { def: TermDefinition; onClose: () => void }) {
  const catColor = CATEGORY_COLORS[def.category];
  const catLabel = CATEGORY_LABELS[def.category];

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-border/50 flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl font-black text-foreground tracking-tight">{def.term}</span>
              <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', catColor)}>
                {catLabel}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">{def.fullName}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-full hover:bg-accent/50 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Definition */}
          <p className="text-sm text-foreground/80 leading-relaxed">{def.definition}</p>

          {/* Example */}
          {def.example && (
            <div className="bg-accent/30 rounded-lg p-3 border border-primary/5">
              <p className="text-xs text-muted-foreground italic leading-relaxed">{def.example}</p>
            </div>
          )}

          {/* Pro Tip */}
          {def.proTip && (
            <div className="flex gap-2.5 bg-primary/5 border border-primary/15 rounded-lg p-3">
              <Lightbulb className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-primary/90 leading-relaxed font-medium">{def.proTip}</p>
            </div>
          )}

          {/* Related terms */}
          {def.relatedTerms && def.relatedTerms.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Voir aussi :</span>
              {def.relatedTerms.map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-bold px-2 py-0.5 rounded border border-primary/20 text-primary/70 bg-primary/5"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            J'ai compris
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── TermTooltip ──────────────────────────────────────────────────────────────
interface TermTooltipProps {
  /** Clé du terme (ex : "AIO", "SEO", "GEA") */
  term: string;
  /** Taille du badge : 'sm' | 'md' (défaut 'sm') */
  size?: 'sm' | 'md';
  className?: string;
}

export function TermTooltip({ term, size = 'sm', className }: TermTooltipProps) {
  const [open, setOpen] = useState(false);
  const def = getTerm(term);

  if (!def) return null;

  const catColor = CATEGORY_COLORS[def.category];

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        title={`${def.term} — ${def.fullName}`}
        className={cn(
          'inline-flex items-center justify-center rounded-full border font-bold leading-none cursor-pointer',
          'transition-all duration-150 hover:scale-110 active:scale-95',
          size === 'sm'
            ? 'w-[18px] h-[18px] text-[9px]'
            : 'w-[22px] h-[22px] text-[10px]',
          catColor,
          className
        )}
        aria-label={`Aide : ${def.term}`}
      >
        ?
      </button>
      {open && <TermPanel def={def} onClose={() => setOpen(false)} />}
    </>
  );
}

// ── TermBadge ────────────────────────────────────────────────────────────────
interface TermBadgeProps {
  /** Clé du terme (ex : "AIO", "SEO", "GEA") */
  term: string;
  children: React.ReactNode;
  /** Afficher le badge ? au nom (défaut : true) */
  showIcon?: boolean;
  className?: string;
}

/**
 * TermBadge — Entoure un texte avec le terme et ajoute un badge cliquable.
 * Ex : <TermBadge term="GEA">Score GEA</TermBadge>
 */
export function TermBadge({ term, children, showIcon = true, className }: TermBadgeProps) {
  const [open, setOpen] = useState(false);
  const def = getTerm(term);

  if (!def) return <span className={className}>{children}</span>;

  const catColor = CATEGORY_COLORS[def.category];

  return (
    <>
      <span
        className={cn('inline-flex items-center gap-1 cursor-pointer group', className)}
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        title={`${def.term} — ${def.fullName}`}
      >
        <span className="group-hover:underline decoration-dotted underline-offset-2 decoration-primary/40">
          {children}
        </span>
        {showIcon && (
          <span
            className={cn(
              'inline-flex items-center justify-center rounded-full border font-bold leading-none text-[9px] w-[16px] h-[16px]',
              'opacity-60 group-hover:opacity-100 transition-opacity duration-150',
              catColor
            )}
          >
            ?
          </span>
        )}
      </span>
      {open && <TermPanel def={def} onClose={() => setOpen(false)} />}
    </>
  );
}
