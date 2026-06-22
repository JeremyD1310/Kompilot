/**
 * BrandPaletteSection — configure brand colors, handles and visual identity options.
 * Shows in Settings → Identité Visuelle.
 */
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { useBrandSettings, BRAND_PALETTES } from '../../context/BrandSettingsContext';
import { Palette, Star, Layers, Eye } from 'lucide-react';
import { BrandImagePreviewModal } from '../cockpit/BrandImagePreviewModal';

// ── Live preview (CSS-based approximation) ─────────────────────────────────────

function BrandPreview() {
  const { resolved } = useBrandSettings();
  const { primaryColor, secondaryColor, businessName, instagramHandle, phone, showGoogleBadge, showCarouselStripe } = resolved;
  const sub = [instagramHandle, phone].filter(Boolean).join('  ·  ') || '@moncommerce';

  return (
    <div className="relative rounded-xl overflow-hidden aspect-square bg-gradient-to-br from-slate-500 to-slate-700 shadow-inner w-full max-w-[220px]">
      {/* Simulated photo grain */}
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.5\'/%3E%3C/svg%3E")' }} />

      {/* Top stripe */}
      {showCarouselStripe && (
        <div className="absolute top-0 left-0 right-0 h-[5px]" style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }} />
      )}

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-[55%]" style={{ background: `linear-gradient(to top, ${primaryColor}F8, ${primaryColor}A0 50%, transparent)` }} />

      {/* Business name */}
      <div className="absolute left-2.5 right-12 bottom-[28px]">
        <p className="text-[11px] font-extrabold truncate leading-tight" style={{ color: secondaryColor, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
          {businessName}
        </p>
        <p className="text-[8.5px] text-white/80 truncate mt-0.5">{sub}</p>
      </div>

      {/* Google badge */}
      {showGoogleBadge && (
        <div className="absolute bottom-2 right-2 flex items-center gap-0.5 bg-white/20 border border-white/30 rounded-md px-1.5 py-0.5 backdrop-blur-sm">
          <span className="text-[8px] font-bold text-white">⭐ Avis Google</span>
        </div>
      )}

      {/* Bottom stripe */}
      {showCarouselStripe && (
        <div className="absolute bottom-0 left-0 right-0 h-[5px]" style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }} />
      )}

      {/* Overlay label */}
      <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-sm rounded-md px-1.5 py-0.5">
        <span className="text-[9px] font-bold text-white/80 uppercase tracking-wide">Prévisualisation</span>
      </div>
    </div>
  );
}

// ── Toggle ─────────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn('relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors cursor-pointer focus-visible:outline-none', checked ? 'bg-primary' : 'bg-muted-foreground/30')}
    >
      <span className={cn('pointer-events-none block h-4 w-4 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-4' : 'translate-x-0')} />
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function BrandPaletteSection() {
  const { stored, update } = useBrandSettings();
  const [previewOpen, setPreviewOpen] = useState(false);
  const { enabled, primaryColor, secondaryColor, instagramHandle, phone, showGoogleBadge, showCarouselStripe } = stored;

  const applyPalette = (primary: string, secondary: string) => update({ primaryColor: primary, secondaryColor: secondary });

  return (
    <div className="space-y-5">
      {/* ── Master toggle ── */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Palette size={15} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Bandeau de marque automatique</p>
            <p className="text-[11px] text-muted-foreground">Appliqué sur chaque photo publiée via Kompilot</p>
          </div>
        </div>
        <Toggle checked={enabled} onChange={v => update({ enabled: v })} />
      </div>

      {!enabled && (
        <p className="text-xs text-muted-foreground text-center py-2">Activez le bandeau pour configurer votre identité visuelle.</p>
      )}

      {enabled && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Left: settings ── */}
          <div className="space-y-5">
            {/* Palette presets */}
            <div>
              <p className="text-xs font-bold text-foreground mb-2 uppercase tracking-wide">Palette prédéfinie</p>
              <div className="grid grid-cols-4 gap-2">
                {BRAND_PALETTES.map(p => {
                  const isActive = primaryColor === p.primary && secondaryColor === p.secondary;
                  return (
                    <button
                      key={p.id}
                      onClick={() => applyPalette(p.primary, p.secondary)}
                      title={p.label}
                      className={cn('flex flex-col items-center gap-1.5 rounded-xl p-2 border-2 transition-all hover:scale-105', isActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40')}
                    >
                      <div className="flex gap-0.5">
                        <span className="w-5 h-5 rounded-l-full border border-white/20 shadow-sm" style={{ background: p.primary }} />
                        <span className="w-5 h-5 rounded-r-full border border-white/20 shadow-sm" style={{ background: p.secondary }} />
                      </div>
                      <span className="text-[9px] font-medium text-muted-foreground leading-tight text-center">{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom colors */}
            <div>
              <p className="text-xs font-bold text-foreground mb-2 uppercase tracking-wide">Couleurs personnalisées</p>
              <div className="flex gap-3">
                <label className="flex flex-col gap-1 flex-1">
                  <span className="text-[10px] text-muted-foreground">Principale</span>
                  <div className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5 bg-background">
                    <input type="color" value={primaryColor} onChange={e => update({ primaryColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0" />
                    <span className="text-xs font-mono text-muted-foreground">{primaryColor}</span>
                  </div>
                </label>
                <label className="flex flex-col gap-1 flex-1">
                  <span className="text-[10px] text-muted-foreground">Accent</span>
                  <div className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5 bg-background">
                    <input type="color" value={secondaryColor} onChange={e => update({ secondaryColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0" />
                    <span className="text-xs font-mono text-muted-foreground">{secondaryColor}</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Business info */}
            <div>
              <p className="text-xs font-bold text-foreground mb-2 uppercase tracking-wide">Infos du commerce</p>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="📸 @moncommerce"
                  value={instagramHandle}
                  onChange={e => update({ instagramHandle: e.target.value })}
                  className="w-full text-xs rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <input
                  type="tel"
                  placeholder="📞 06 12 34 56 78"
                  value={phone}
                  onChange={e => update({ phone: e.target.value })}
                  className="w-full text-xs rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-foreground uppercase tracking-wide">Options</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star size={13} className="text-amber-500" />
                  <span className="text-xs text-foreground">Macaron "Avis Google ⭐"</span>
                </div>
                <Toggle checked={showGoogleBadge} onChange={v => update({ showGoogleBadge: v })} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers size={13} className="text-primary" />
                  <span className="text-xs text-foreground">Bande colorée carrousel</span>
                </div>
                <Toggle checked={showCarouselStripe} onChange={v => update({ showCarouselStripe: v })} />
              </div>
            </div>
          </div>

          {/* ── Right: live preview ── */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-xs font-bold text-foreground uppercase tracking-wide self-start">Aperçu en direct</p>
            <BrandPreview />
            <p className="text-[10px] text-muted-foreground text-center leading-relaxed max-w-[200px]">
              Ce bandeau est appliqué automatiquement sur chaque photo lors de la publication.
            </p>
            <button
              onClick={() => setPreviewOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/8 hover:bg-primary/15 text-primary px-4 py-2.5 text-xs font-bold transition-all w-full justify-center"
            >
              <Eye size={13} />
              Tester sur une vraie photo
            </button>
          </div>
        </div>
      )}

      <BrandImagePreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}
