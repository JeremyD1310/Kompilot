/**
 * EmbedWidgetGenerator
 *
 * Generates an ultra-lightweight responsive iFrame embed code for the
 * "Lead Magnet — Scan GEO Gratuit Public" widget.
 *
 * Features:
 * – Responsive iframe (aspect-ratio + max-width CSS)
 * – Auto light/dark theme detection via prefers-color-scheme
 * – "Powered by Kompilot 🚀" watermark with affiliate tracking tag
 * – One-click copy with syntax highlighting
 * – Live preview miniature
 */
import { useState, useMemo } from 'react';
import { Copy, Check, Code2, Eye, EyeOff, Palette, Globe, Zap } from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import { useEstablishment } from '../../context/EstablishmentContext';
import { useAuth } from '../../hooks/useAuth';

// ── Affiliate slug generator ──────────────────────────────────────────────────
function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 32);
}

// ── Build the embed code ─────────────────────────────────────────────────────
function buildEmbedCode(params: {
  widgetUrl: string;
  estName: string;
  affSlug: string;
  theme: 'auto' | 'light' | 'dark';
  width: string;
  showWatermark: boolean;
  city: string;
}): string {
  const { widgetUrl, estName, affSlug, theme, width, showWatermark, city } = params;

  const src = `${widgetUrl}?city=${encodeURIComponent(city)}&utm_source=embed&utm_medium=widget&utm_campaign=geo-scan&ref=${affSlug}&theme=${theme}`;
  const landingUrl = `https://kompilot.co?ref=${affSlug}&utm_source=widget-watermark&utm_medium=embed`;

  return `<!-- Kompilot — Widget Scan GEO Local (v2) -->
<div id="nc-geo-widget" style="width:100%;max-width:${width};margin:0 auto;font-family:system-ui,sans-serif;">
  <iframe
    src="${src}"
    title="Scan de visibilité locale — ${estName}"
    loading="lazy"
    width="100%"
    style="border:none;border-radius:16px;aspect-ratio:3/2;min-height:300px;display:block;"
    allow="clipboard-write"
    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
  ></iframe>${showWatermark ? `
  <!-- Watermark — do not remove -->
  <p style="text-align:center;margin-top:8px;font-size:11px;color:${theme === 'dark' ? '#64748b' : '#94a3b8'};">
    <a href="${landingUrl}" target="_blank" rel="noopener sponsored"
       style="color:inherit;text-decoration:none;opacity:0.7;">
      Propulsé par Kompilot 🚀
    </a>
  </p>` : ''}
</div>
<style>
  /* Responsive + theme-aware */
  @media (prefers-color-scheme: dark) {
    #nc-geo-widget iframe { background:#0f172a; }
  }
  @media (prefers-color-scheme: light) {
    #nc-geo-widget iframe { background:#f8fafc; }
  }
  @media (max-width: 480px) {
    #nc-geo-widget iframe { aspect-ratio: 1/1.2; min-height:260px; }
  }
</style>`;
}

// ── Code block with line numbers ──────────────────────────────────────────────
function CodeBlock({ code }: { code: string }) {
  const lines = code.split('\n');
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950 overflow-hidden text-xs font-mono">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/70" />
          <span className="w-3 h-3 rounded-full bg-amber-500/70" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
        </div>
        <span className="text-slate-500 text-[10px]">HTML</span>
      </div>
      <div className="overflow-x-auto p-4 max-h-72 overflow-y-auto">
        {lines.map((line, i) => (
          <div key={i} className="flex gap-3 leading-5">
            <span className="select-none text-slate-700 w-6 text-right shrink-0">{i + 1}</span>
            <span className={
              line.trim().startsWith('<!--')  ? 'text-slate-500' :
              line.includes('href=')          ? 'text-blue-400' :
              line.includes('style=')         ? 'text-amber-300' :
              line.trim().startsWith('<')     ? 'text-emerald-400' :
              'text-slate-300'
            }>
              {line || '\u00a0'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function EmbedWidgetGenerator() {
  const { activeEstablishment } = useEstablishment();
  const { user } = useAuth();

  const [theme, setTheme]           = useState<'auto' | 'light' | 'dark'>('auto');
  const [width, setWidth]           = useState('600px');
  const [showWatermark, setShowWatermark] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied]         = useState(false);

  const estName  = activeEstablishment?.name || 'Mon Établissement';
  const city     = (activeEstablishment?.address || '').split(',').pop()?.trim() || 'votre ville';
  const widgetUrl = `${window.location.origin}/widget/geo-scan`;

  // Affiliate slug = based on establishment name + user id prefix
  const affSlug = useMemo(() => {
    const base = toSlug(estName);
    const uid  = user?.id?.substring(0, 6) || 'anon';
    return `${base}-${uid}`;
  }, [estName, user?.id]);

  const code = useMemo(() => buildEmbedCode({
    widgetUrl, estName, affSlug, theme, width, showWatermark, city,
  }), [widgetUrl, estName, affSlug, theme, width, showWatermark, city]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    toast.success('Code embed copié ! Collez-le sur votre site ou celui de votre client.');
  };

  const landingWithAff = `https://kompilot.co?ref=${affSlug}&utm_source=widget-watermark`;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/20">
        <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
          <Code2 size={18} className="text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground">Widget Embed Viral — Lead Magnet</h3>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Iframe responsive · Thème auto · Filigrane affilié · Tag <code className="bg-muted px-1 rounded text-[10px]">ref={affSlug}</code>
          </p>
        </div>
        <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
          <Zap size={9} /> Lead Magnet
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Config controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Theme */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <Palette size={12} /> Thème
            </label>
            <div className="flex rounded-xl overflow-hidden border border-border">
              {(['auto', 'light', 'dark'] as const).map(t => (
                <button key={t} onClick={() => setTheme(t)}
                  className={`flex-1 py-1.5 text-xs font-semibold capitalize transition-colors ${
                    theme === t ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {t === 'auto' ? '🌗 Auto' : t === 'light' ? '☀️ Clair' : '🌙 Sombre'}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Auto = suit le thème du navigateur du visiteur
            </p>
          </div>

          {/* Width */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <Globe size={12} /> Largeur max
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {['400px', '600px', '800px', '100%'].map(w => (
                <button key={w} onClick={() => setWidth(w)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    width === w ? 'bg-primary/10 border-primary/40 text-primary' : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Watermark toggle */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Filigrane affilié
            </label>
            <button
              onClick={() => setShowWatermark(v => !v)}
              className={`flex items-center gap-2.5 w-full rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                showWatermark
                  ? 'border-emerald-300/60 bg-emerald-50 text-emerald-700'
                  : 'border-border bg-background text-muted-foreground'
              }`}
            >
              <div className={`w-8 h-4.5 rounded-full flex items-center px-0.5 transition-colors ${
                showWatermark ? 'bg-emerald-500 justify-end' : 'bg-muted justify-start'
              }`}>
                <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm" />
              </div>
              {showWatermark ? 'Activé' : 'Désactivé'}
            </button>
            {showWatermark && (
              <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
                Lien affilié : <code className="bg-muted px-1 rounded">ref={affSlug}</code> — vous touchez une commission sur chaque inscription
              </p>
            )}
          </div>
        </div>

        {/* Affiliate link preview */}
        {showWatermark && (
          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <Zap size={14} className="text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">Lien d'affiliation automatique</p>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">{landingWithAff}</p>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(landingWithAff); toast.success('Lien affilié copié !'); }}
              className="shrink-0 text-[10px] font-bold text-primary hover:opacity-80 transition-opacity"
            >
              Copier
            </button>
          </div>
        )}

        {/* Code block */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground">Code d'intégration</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreview(v => !v)}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPreview ? <EyeOff size={12} /> : <Eye size={12} />}
                {showPreview ? 'Masquer aperçu' : 'Aperçu'}
              </button>
            </div>
          </div>
          <CodeBlock code={code} />
        </div>

        {/* Mini preview */}
        {showPreview && (
          <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
            <div className="px-3 py-2 bg-muted/40 border-b border-border flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <span className="text-[10px] text-muted-foreground">Aperçu du widget embarqué</span>
            </div>
            <div className="p-4">
              <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 aspect-[3/2] flex flex-col items-center justify-center gap-3 text-center p-6">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Globe size={24} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground leading-tight">
                  Votre visibilité locale vous rapporte-t-elle assez ?
                </p>
                <p className="text-xs text-muted-foreground mt-1">Vérifiez en 60 secondes — {city}</p>
              </div>
              {/* Sector grid preview */}
              <div className="grid grid-cols-3 gap-1 w-full">
                {['🍽️ Resto','💇 Beauté','🛍️ Commerce','🔨 Artisan','🌿 Santé','🏢 Autre'].map(s => (
                  <div key={s} className="rounded-lg border border-primary/20 bg-primary/5 py-1 text-center text-[9px] font-semibold text-primary/70 leading-tight px-1">{s}</div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-36 rounded-lg bg-primary/80 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-white">🔍 Scanner gratuitement</span>
                </div>
              </div>
              {showWatermark && (
                <p className="text-[10px] text-muted-foreground/60">Propulsé par Kompilot 🚀</p>
              )}
              </div>
            </div>
          </div>
        )}

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${
            copied
              ? 'bg-emerald-600 text-white'
              : 'bg-primary text-primary-foreground hover:opacity-90'
          }`}
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? 'Code copié ✅' : 'Copier le code d\'intégration'}
        </button>

        {/* Usage tips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { emoji: '🌐', title: 'Site web client', desc: 'Collez dans le footer ou une landing page dédiée à la visibilité locale' },
            { emoji: '📧', title: 'Email / Newsletter', desc: 'Utilisez le lien direct dans vos emails pour tracker les conversions' },
            { emoji: '📱', title: 'Réseaux sociaux', desc: 'Partagez le lien affilié en bio pour capter des leads qualifiés' },
          ].map(tip => (
            <div key={tip.title} className="rounded-xl border border-border bg-muted/20 px-3 py-3 space-y-1">
              <p className="text-sm">{tip.emoji}</p>
              <p className="text-xs font-bold text-foreground">{tip.title}</p>
              <p className="text-[10px] text-muted-foreground leading-snug">{tip.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
