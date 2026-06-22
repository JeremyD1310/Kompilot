import { useState, useCallback } from 'react';
import { Button } from '@blinkdotnew/ui';
import { Copy, Check, Download, Globe, RefreshCw, Tag, Code2, AlertCircle, CheckCircle2, Lightbulb } from 'lucide-react';
import { cn } from '../../lib/utils';
import { SocialShareBar } from './SocialShareBar';

// ── Helpers ───────────────────────────────────────────────────────────────────

function CopyButton({ text, label = 'Copier' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [text]);
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all shrink-0"
    >
      {copied ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
      {copied ? 'Copié !' : label}
    </button>
  );
}

/** Converts basic Markdown (# H1, ## H2, **bold**) to HTML-like JSX */
function ArticleRenderer({ markdown }: { markdown: string }) {
  const lines = markdown.split('\n');
  return (
    <div className="space-y-3 text-sm text-foreground leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith('# ')) {
          return (
            <h1 key={i} className="text-xl font-extrabold text-foreground leading-snug mt-2">
              {line.replace(/^# /, '')}
            </h1>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={i} className="text-base font-bold text-foreground border-l-2 border-violet-500 pl-3 mt-4">
              {line.replace(/^## /, '')}
            </h2>
          );
        }
        if (line.trim() === '') return null;
        // Bold inline
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="text-sm text-foreground/85 leading-relaxed">
            {parts.map((p, j) =>
              p.startsWith('**') && p.endsWith('**')
                ? <strong key={j} className="font-semibold text-foreground">{p.slice(2, -2)}</strong>
                : p
            )}
          </p>
        );
      })}
    </div>
  );
}

// ── SERP Preview ──────────────────────────────────────────────────────────────

function SerpPreview({ title, description, geoZone }: { title: string; description: string; geoZone: string }) {
  const displayTitle = title.length > 60 ? title.slice(0, 57) + '…' : title;
  const displayDesc  = description.length > 160 ? description.slice(0, 157) + '…' : description;
  const urlSlug = geoZone
    ? geoZone.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    : 'votre-ville';

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Label bar */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border-b border-slate-100">
        <div className="w-3 h-3 rounded-full bg-slate-300 shrink-0" />
        <div className="w-3 h-3 rounded-full bg-slate-300 shrink-0" />
        <div className="w-3 h-3 rounded-full bg-slate-300 shrink-0" />
        <div className="mx-2 flex-1 flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-2.5 py-0.5">
          <Globe size={9} className="text-slate-400 shrink-0" />
          <span className="text-[10px] text-slate-500 truncate">google.fr › search?q={geoZone || 'votre-ville'}</span>
        </div>
        <span className="text-[9px] font-bold text-violet-500 bg-violet-50 border border-violet-200 rounded-full px-1.5 py-0.5 shrink-0">Aperçu SERP</span>
      </div>
      {/* Snippet */}
      <div className="px-4 py-3 space-y-0.5">
        <p className="text-[11px] text-emerald-700 font-medium truncate leading-snug">
          votresite.fr &rsaquo; blog &rsaquo; {urlSlug}
        </p>
        <p className="text-[15px] font-normal text-blue-700 leading-snug cursor-default hover:underline line-clamp-1">
          {displayTitle || 'Titre de la page'}
        </p>
        <p className="text-[12px] text-slate-600 leading-relaxed line-clamp-2 mt-0.5">
          {displayDesc || <span className="italic text-slate-400">Description non disponible.</span>}
        </p>
      </div>
    </div>
  );
}

// ── Description quality hints ─────────────────────────────────────────────────

const CTA_WORDS = ['découvrez', 'contactez', 'réservez', 'visitez', 'appelez', 'profitez', 'bénéficiez', 'essayez', 'commandez', 'venez', 'trouvez', 'obtenez'];

function DescriptionQualityHints({ description, keyword }: { description: string; keyword: string }) {
  const len = description.length;

  const lenStatus: 'ok' | 'warn' | 'error' =
    len >= 120 && len <= 160 ? 'ok' : len >= 50 ? 'warn' : 'error';

  const lenLabel =
    len < 50       ? 'Trop courte — développez (min 50 car.)' :
    len < 120      ? `Un peu courte — idéal 120-160 (${len})` :
    len <= 160     ? `Longueur optimale — ${len}/160` :
                     `Trop longue — sera tronquée (${len}/160)`;

  const hasCta = CTA_WORDS.some(w => description.toLowerCase().includes(w));
  const hasKeyword = keyword
    ? description.toLowerCase().includes(keyword.toLowerCase().split(/\s+/)[0])
    : true;

  // Bar: 0→160 chars, clamp at 100%, turns red if > 160
  const barPct   = Math.min(100, Math.round((len / 160) * 100));
  const barColor =
    lenStatus === 'ok'    ? 'bg-emerald-500' :
    lenStatus === 'warn'  ? 'bg-amber-400'   : 'bg-red-400';

  type ChipStatus = 'ok' | 'warn' | 'tip';
  const chips: { label: string; status: ChipStatus }[] = [
    { label: lenLabel, status: lenStatus === 'ok' ? 'ok' : lenStatus === 'warn' ? 'warn' : 'warn' },
    hasCta
      ? { label: 'Appel à l\'action ✓', status: 'ok' }
      : { label: 'Ajoutez un verbe d\'action (Découvrez, Réservez…)', status: 'tip' },
    ...(keyword && !hasKeyword
      ? [{ label: 'Mot-clé absent — intégrez-le', status: 'tip' as ChipStatus }]
      : keyword && hasKeyword
      ? [{ label: 'Mot-clé présent ✓', status: 'ok' as ChipStatus }]
      : []
    ),
  ];

  const chipStyles: Record<ChipStatus, string> = {
    ok:   'bg-emerald-50 border-emerald-200 text-emerald-700',
    warn: 'bg-amber-50  border-amber-200  text-amber-700',
    tip:  'bg-violet-50 border-violet-200 text-violet-700',
  };
  const chipIcons: Record<ChipStatus, React.ReactNode> = {
    ok:   <CheckCircle2 size={9} className="shrink-0" />,
    warn: <AlertCircle  size={9} className="shrink-0" />,
    tip:  <Lightbulb    size={9} className="shrink-0" />,
  };

  return (
    <div className="space-y-2 pt-1.5">
      {/* Progress bar */}
      <div className="space-y-0.5">
        <div className="relative h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', barColor)}
            style={{ width: `${barPct}%` }}
          />
          {/* Optimal zone markers */}
          <div className="absolute top-0 bottom-0 left-[75%] w-px bg-emerald-400/50" title="120 car." />
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground/60 font-medium px-0.5">
          <span>0</span>
          <span className="text-emerald-600">120 optimal</span>
          <span className="text-red-400">160 max</span>
        </div>
      </div>
      {/* Chips */}
      <div className="flex flex-wrap gap-1.5">
        {chips.map((chip, i) => (
          <span
            key={i}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-snug',
              chipStyles[chip.status]
            )}
          >
            {chipIcons[chip.status]}
            {chip.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface SEOMeta {
  title: string;
  description: string;
  keywords?: string;
}

interface SEOArticlePreviewProps {
  article: string;
  meta: SEOMeta | null;
  schema?: string;
  rawBuffer: string;
  isGenerating: boolean;
  keyword: string;
  geoZone: string;
  onRegenerate: () => void;
}

export function SEOArticlePreview({
  article,
  meta,
  schema,
  rawBuffer,
  isGenerating,
  keyword,
  geoZone,
  onRegenerate,
}: SEOArticlePreviewProps) {
  const hasContent = article.length > 0 || rawBuffer.length > 0;
  const displayArticle = article || rawBuffer;

  const handleDownloadMarkdown = () => {
    const lines: string[] = [];
    if (meta) {
      lines.push('<!-- META SEO -->');
      lines.push(`Meta Title: ${meta.title}`);
      lines.push(`Meta Description: ${meta.description}`);
      if (meta.keywords) lines.push(`Meta Keywords: ${meta.keywords}`);
    }
    if (schema) {
      lines.push('\n<!-- SCHEMA MARKUP JSON-LD -->');
      lines.push(`<script type="application/ld+json">\n${schema}\n</script>`);
    }
    if (lines.length) lines.push('\n---\n');
    lines.push(article);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `article-seo-local${keyword ? `-${keyword.replace(/\s+/g, '-').toLowerCase()}` : ''}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!hasContent && !isGenerating) {
    return (
      <div className="rounded-2xl border border-violet-200 bg-violet-50/40 flex flex-col items-center justify-center gap-4 py-16 px-6 text-center min-h-[400px]">
        <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center text-3xl">🌐</div>
        <div className="space-y-1.5">
          <p className="text-sm font-bold text-foreground">Générateur d'Article SEO Local</p>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
            Renseignez votre mot-clé et votre zone géographique, puis cliquez sur{' '}
            <strong>"Générer"</strong> pour obtenir un article de blog 300–500 mots avec balises Meta Title, Description, Keywords et Schema Markup LocalBusiness.
          </p>
        </div>
        {keyword && geoZone ? (
          <div className="flex items-center gap-2 rounded-xl bg-violet-100 border border-violet-200 px-4 py-2">
            <span className="text-xs font-bold text-violet-700">
              🎯 {keyword} · 📍 {geoZone}
            </span>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            ← Remplissez les champs SEO à gauche pour commencer
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
            <Globe size={14} className="text-violet-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Article SEO Local</p>
            {(keyword || geoZone) && (
              <p className="text-[10px] text-muted-foreground">
                {keyword && <span className="text-violet-600 font-medium">"{keyword}"</span>}
                {keyword && geoZone && ' · '}
                {geoZone && <span>📍 {geoZone}</span>}
              </p>
            )}
          </div>
        </div>
        {!isGenerating && article && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all shrink-0"
            >
              <Download size={11} /> Exporter .txt
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              className="gap-1 text-xs h-8 text-violet-700 border-violet-300 hover:bg-violet-50"
            >
              <RefreshCw size={12} /> Régénérer
            </Button>
          </div>
        )}
      </div>

      {/* Generating indicator */}
      {isGenerating && (
        <div className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-1.5 h-4 rounded-full bg-violet-500 animate-pulse"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <p className="text-xs font-semibold text-violet-700">
            Rédaction de votre article SEO en cours… ✍️
          </p>
        </div>
      )}

      {/* ── Meta tags section ──────────────────────────────────────────────── */}
      {meta && (
        <div className="rounded-xl border border-violet-200 bg-violet-50/60 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-violet-100/60 border-b border-violet-200">
            <Globe size={13} className="text-violet-600 shrink-0" />
            <p className="text-[11px] font-bold text-violet-800 uppercase tracking-wide">Balises Meta SEO</p>
            <span className="ml-auto text-[10px] text-violet-600 font-medium">Prêtes à coller 📋</span>
          </div>
          <div className="px-4 py-3 space-y-3">

            {/* Meta Title */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-violet-700 uppercase tracking-wide">Meta Title</p>
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    'text-[10px] font-semibold',
                    meta.title.length <= 60 ? 'text-emerald-600' : 'text-amber-600'
                  )}>
                    {meta.title.length}/60 car.
                  </span>
                  <CopyButton text={meta.title} />
                </div>
              </div>
              <div className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs font-medium text-foreground">
                {meta.title}
              </div>
              {meta.title.length > 60 && (
                <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                  <AlertCircle size={9} className="shrink-0" />
                  Trop long — Google tronquera après 60 caractères
                </p>
              )}
            </div>

            {/* ── SERP Preview ── */}
            <SerpPreview
              title={meta.title}
              description={meta.description}
              geoZone={geoZone}
            />

            {/* Meta Description */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-violet-700 uppercase tracking-wide">Meta Description</p>
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    'text-[10px] font-semibold',
                    meta.description.length <= 160 ? 'text-emerald-600' : 'text-amber-600'
                  )}>
                    {meta.description.length}/160 car.
                  </span>
                  <CopyButton text={meta.description} />
                </div>
              </div>
              <div className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs text-muted-foreground leading-relaxed">
                {meta.description}
              </div>
              {/* Quality hints */}
              <DescriptionQualityHints
                description={meta.description}
                keyword={keyword}
              />
            </div>

            {/* Meta Keywords */}
            {meta.keywords && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Tag size={10} className="text-violet-600 shrink-0" />
                    <p className="text-[10px] font-bold text-violet-700 uppercase tracking-wide">Meta Keywords</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {meta.keywords.split(',').map(k => k.trim()).filter(Boolean).length} mots-clés
                    </span>
                    <CopyButton
                      text={`<meta name="keywords" content="${meta.keywords}" />`}
                      label="Copier balise"
                    />
                  </div>
                </div>
                <div className="rounded-lg border border-violet-200 bg-white px-3 py-2 flex flex-wrap gap-1">
                  {meta.keywords.split(',').map((kw, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center bg-violet-100 text-violet-700 rounded-full px-2 py-0.5 text-[10px] font-medium"
                    >
                      {kw.trim()}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-violet-500 leading-relaxed">
                  ℹ️ Les meta keywords ont un impact limité sur Google, mais restent utiles pour Bing, certains annuaires locaux et outils SEO internes.
                </p>
              </div>
            )}

            {/* Copy all meta HTML tags */}
            <CopyButton
              text={[
                `<meta name="title" content="${meta.title}" />`,
                `<meta name="description" content="${meta.description}" />`,
                meta.keywords ? `<meta name="keywords" content="${meta.keywords}" />` : '',
              ].filter(Boolean).join('\n')}
              label="Copier toutes les balises HTML"
            />
          </div>
        </div>
      )}

      {/* ── Schema Markup JSON-LD ──────────────────────────────────────────── */}
      {schema && (
        <div className="rounded-xl border border-orange-200 bg-orange-50/40 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-orange-100/60 border-b border-orange-200">
            <Code2 size={13} className="text-orange-600 shrink-0" />
            <p className="text-[11px] font-bold text-orange-800 uppercase tracking-wide">Schema Markup JSON-LD</p>
            <span className="inline-flex items-center gap-1 ml-1 text-[10px] font-bold bg-orange-200/60 text-orange-700 border border-orange-300 rounded-full px-1.5 py-0.5">
              LocalBusiness
            </span>
            <div className="ml-auto">
              <CopyButton
                text={`<script type="application/ld+json">\n${schema}\n</script>`}
                label='Copier <script>'
              />
            </div>
          </div>
          <div className="px-4 py-3 space-y-2.5">
            <pre className="rounded-lg border border-orange-200/60 bg-slate-900 px-4 py-3 text-[10px] font-mono text-emerald-300 leading-relaxed overflow-x-auto max-h-64 whitespace-pre-wrap">
              {schema}
            </pre>
            <div className="rounded-lg bg-orange-100/60 border border-orange-200 px-3 py-2.5 space-y-1.5">
              <p className="text-[10px] font-bold text-orange-800">📍 Comment intégrer ce Schema Markup ?</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { cms: 'WordPress', tip: 'Extension Schema Pro, WPSchema ou coller dans l\'en-tête via Yoast → Search Appearance.' },
                  { cms: 'Wix', tip: 'SEO → Markup Schema → Custom Schema. Wix gère aussi le LocalBusiness auto via le profil établissement.' },
                  { cms: 'HTML direct', tip: 'Coller le bloc <script> avant </head>. Remplacez PHONE_PLACEHOLDER par votre numéro de téléphone.' },
                ].map(g => (
                  <div key={g.cms} className="flex items-start gap-1.5">
                    <span className="text-[10px] font-bold text-orange-700 shrink-0">{g.cms} ·</span>
                    <p className="text-[10px] text-orange-700 leading-relaxed">{g.tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Article preview ────────────────────────────────────────────────── */}
      {displayArticle && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border">
            <p className="text-[11px] font-bold text-foreground uppercase tracking-wide">Article de Blog</p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">
                ~{Math.round(displayArticle.replace(/#+ /g, '').split(/\s+/).filter(Boolean).length)} mots
              </span>
              {article && <CopyButton text={article} label="Copier l'article" />}
            </div>
          </div>
          <div className="px-5 py-4 max-h-[600px] overflow-y-auto">
            {isGenerating && !article ? (
              <p className="text-sm text-muted-foreground/60 italic whitespace-pre-wrap">{rawBuffer}</p>
            ) : (
              <ArticleRenderer markdown={displayArticle} />
            )}
          </div>
        </div>
      )}

      {/* ── Social sharing ─────────────────────────────────────────────────── */}
      {meta && article && !isGenerating && (
        <SocialShareBar
          metaTitle={meta.title}
          metaDescription={meta.description}
          metaKeywords={meta.keywords}
          articleText={article}
          shopName={keyword}
        />
      )}

      {/* ── Injection guide ────────────────────────────────────────────────── */}
      {meta && article && !isGenerating && (
        <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 space-y-2">
          <p className="text-[11px] font-bold text-foreground">📋 Comment utiliser ces balises ?</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { platform: 'WordPress', icon: '🔵', where: 'Yoast SEO ou RankMath → Snippet Editor pour les balises meta. Schema Pro pour le JSON-LD.' },
              { platform: 'Wix', icon: '⬜', where: 'Pages → Paramètres → SEO → Balises Meta. Wix SEO → Schema Markup pour le JSON-LD.' },
              { platform: 'Shopify', icon: '🟢', where: 'Pages → Modifier → Référencement web en bas. Coller le JSON-LD dans theme.liquid avant </head>.' },
            ].map(g => (
              <div key={g.platform} className="flex items-start gap-2">
                <span className="text-sm shrink-0">{g.icon}</span>
                <div>
                  <p className="text-[10px] font-bold text-foreground">{g.platform}</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{g.where}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
