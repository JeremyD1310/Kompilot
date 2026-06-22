/**
 * BrandOverlayQuickBar — compact brand identity status bar for the Cockpit.
 * Shows current palette, quick toggle, and opens the BrandImagePreviewModal.
 */
import { useState } from 'react';
import { Palette, Eye, ExternalLink, ToggleLeft, ToggleRight } from 'lucide-react';
import { useBrandSettings, BRAND_PALETTES } from '../../context/BrandSettingsContext';
import { BrandImagePreviewModal } from './BrandImagePreviewModal';
import { cn } from '../../lib/utils';

export function BrandOverlayQuickBar() {
  const { stored, update, resolved } = useBrandSettings();
  const [previewOpen, setPreviewOpen] = useState(false);

  const activePalette = BRAND_PALETTES.find(
    p => p.primary === stored.primaryColor && p.secondary === stored.secondaryColor
  );

  return (
    <>
      <div className={cn(
        'flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition-all',
        stored.enabled
          ? 'bg-primary/5 border-primary/20'
          : 'bg-muted/30 border-border'
      )}>
        {/* Left: brand info */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Color swatch */}
          <div className="flex shrink-0">
            <span
              className="w-5 h-5 rounded-l-full border border-white/20 shadow-sm"
              style={{ background: stored.primaryColor }}
            />
            <span
              className="w-5 h-5 rounded-r-full border border-white/20 shadow-sm"
              style={{ background: stored.secondaryColor }}
            />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground truncate leading-tight flex items-center gap-1">
              <Palette size={10} className="text-primary shrink-0" />
              {activePalette ? activePalette.label : 'Identité personnalisée'}
            </p>
            <p className="text-[10px] text-muted-foreground truncate leading-tight">
              {stored.enabled
                ? `Bandeau actif · ${resolved.businessName}`
                : 'Bandeau désactivé'}
            </p>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Test button */}
          <button
            onClick={() => setPreviewOpen(true)}
            className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground bg-background border border-border hover:border-primary/40 rounded-lg px-2 py-1.5 transition-all"
            title="Tester sur une photo"
          >
            <Eye size={11} /> Tester
          </button>

          {/* Settings link */}
          <a
            href="/settings"
            className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground bg-background border border-border hover:border-primary/40 rounded-lg px-2 py-1.5 transition-all"
            title="Configurer l'identité visuelle"
          >
            <ExternalLink size={10} />
          </a>

          {/* Toggle */}
          <button
            onClick={() => update({ enabled: !stored.enabled })}
            className="flex items-center gap-1 text-[10px] font-semibold transition-colors"
            title={stored.enabled ? 'Désactiver le bandeau' : 'Activer le bandeau'}
          >
            {stored.enabled
              ? <ToggleRight size={22} className="text-primary" />
              : <ToggleLeft size={22} className="text-muted-foreground/50" />
            }
          </button>
        </div>
      </div>

      <BrandImagePreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} />
    </>
  );
}
