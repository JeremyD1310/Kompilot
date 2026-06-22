import { useState, useCallback } from 'react';
import { Share2, Link2, Copy, Check, ExternalLink, MessageCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from '@blinkdotnew/ui';

// ── Types ──────────────────────────────────────────────────────────────────────

interface SocialShareBarProps {
  metaTitle: string;
  metaDescription: string;
  metaKeywords?: string;
  articleText: string;
  shopName: string;
}

// ── Caption builders ──────────────────────────────────────────────────────────

function buildLinkedInCaption(title: string, description: string, url: string): string {
  const body = description.length > 200 ? description.slice(0, 197) + '…' : description;
  const cta = url ? `\n\n🔗 Lire l'article : ${url}` : '';
  return `${title}\n\n${body}${cta}\n\n#SEOLocal #Commerce #PrésenceWeb`;
}

function buildFacebookCaption(title: string, description: string, url: string): string {
  const link = url ? `\n👉 ${url}` : '';
  return `📖 ${title}\n\n${description}${link}`;
}

function buildWhatsAppCaption(title: string, description: string, url: string): string {
  const short = description.length > 160 ? description.slice(0, 157) + '…' : description;
  const link = url ? `\n\n🔗 ${url}` : '';
  return `*${title}*\n\n${short}${link}`;
}

// ── Platform config ───────────────────────────────────────────────────────────

interface Platform {
  id: string;
  label: string;
  color: string;
  hoverColor: string;
  borderColor: string;
  icon: React.ReactNode;
  buildShareUrl: (caption: string, url: string) => string | null;
  buildCaption: (title: string, desc: string, kw: string, url: string) => string;
}

const PLATFORMS: Platform[] = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    color: 'text-[#0A66C2]',
    hoverColor: 'hover:bg-[#0A66C2]/5',
    borderColor: 'border-[#0A66C2]/30 hover:border-[#0A66C2]',
    icon: (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    buildShareUrl: (caption, url) =>
      url ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(caption)}` : null,
    buildCaption: (t, d, _k, url) => buildLinkedInCaption(t, d, url),
  },
  {
    id: 'facebook',
    label: 'Facebook',
    color: 'text-[#1877F2]',
    hoverColor: 'hover:bg-[#1877F2]/5',
    borderColor: 'border-[#1877F2]/30 hover:border-[#1877F2]',
    icon: (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    buildShareUrl: (_caption, url) =>
      url ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` : null,
    buildCaption: (t, d, _k, url) => buildFacebookCaption(t, d, url),
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    color: 'text-[#25D366]',
    hoverColor: 'hover:bg-[#25D366]/5',
    borderColor: 'border-[#25D366]/30 hover:border-[#25D366]',
    icon: <MessageCircle size={14} />,
    buildShareUrl: (caption, _url) =>
      `https://wa.me/?text=${encodeURIComponent(caption)}`,
    buildCaption: (t, d, _k, url) => buildWhatsAppCaption(t, d, url),
  },
];

// ── Copy button (local) ───────────────────────────────────────────────────────

function InlineCopy({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handle = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copié ✓`);
    setTimeout(() => setCopied(false), 2000);
  }, [text, label]);
  return (
    <button
      onClick={handle}
      className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors shrink-0"
    >
      {copied ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
      {copied ? 'Copié !' : 'Copier'}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SocialShareBar({ metaTitle, metaDescription, metaKeywords = '', articleText, shopName }: SocialShareBarProps) {
  const [articleUrl, setArticleUrl] = useState('');
  const [activeCaption, setActiveCaption] = useState<string | null>(null);
  const [activePlatformId, setActivePlatformId] = useState<string | null>(null);

  const handlePlatformClick = (platform: Platform) => {
    const caption = platform.buildCaption(metaTitle, metaDescription, metaKeywords, articleUrl);
    const shareUrl = platform.buildShareUrl(caption, articleUrl);

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
    }

    // Always show caption preview
    setActiveCaption(caption);
    setActivePlatformId(platform.id);
  };

  // Full plain-text export for blog/CMS paste
  const fullExport = [
    metaTitle,
    '',
    metaDescription,
    '',
    articleText,
    articleUrl ? `\nSource : ${articleUrl}` : '',
  ].join('\n').trim();

  const activePlatform = PLATFORMS.find(p => p.id === activePlatformId);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/20 border-b border-border">
        <Share2 size={13} className="text-primary shrink-0" />
        <p className="text-[11px] font-bold text-foreground uppercase tracking-wide">Partager l'article</p>
        <span className="ml-auto text-[10px] text-muted-foreground font-medium">
          Diffusez sur vos réseaux en 1 clic
        </span>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* URL input */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Link2 size={10} className="text-primary shrink-0" />
            URL de l'article publié <span className="text-muted-foreground font-normal normal-case">(optionnel — active les liens de partage natifs)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={articleUrl}
              onChange={e => setArticleUrl(e.target.value)}
              placeholder="https://votresite.fr/blog/votre-article-seo"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 placeholder:text-muted-foreground/50 transition-all"
            />
            {articleUrl && (
              <a
                href={articleUrl.startsWith('http') ? articleUrl : `https://${articleUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-2 text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
              >
                <ExternalLink size={11} />
              </a>
            )}
          </div>
          {!articleUrl && (
            <p className="text-[10px] text-muted-foreground">
              Sans URL, un clic sur un réseau copie la légende prête à coller. Collez votre URL pour ouvrir directement la fenêtre de partage native.
            </p>
          )}
        </div>

        {/* Platform buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PLATFORMS.map(platform => (
            <button
              key={platform.id}
              onClick={() => handlePlatformClick(platform)}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[12px] font-semibold transition-all cursor-pointer',
                platform.color,
                platform.hoverColor,
                platform.borderColor,
                activePlatformId === platform.id && 'ring-2 ring-primary/20 shadow-sm'
              )}
            >
              {platform.icon}
              {platform.label}
            </button>
          ))}
        </div>

        {/* Caption preview */}
        {activeCaption && activePlatform && (
          <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
              <div className="flex items-center gap-1.5">
                <span className={cn('shrink-0', activePlatform.color)}>{activePlatform.icon}</span>
                <p className="text-[11px] font-bold text-foreground">
                  Légende {activePlatform.label}
                </p>
                <span className="text-[10px] text-muted-foreground">— prête à coller</span>
              </div>
              <InlineCopy text={activeCaption} label={`Légende ${activePlatform.label}`} />
            </div>
            <pre className="px-3 py-3 text-[11px] text-foreground/80 leading-relaxed whitespace-pre-wrap font-sans break-words">
              {activeCaption}
            </pre>
            {!articleUrl && (
              <div className="px-3 py-2 border-t border-border bg-amber-50/60">
                <p className="text-[10px] text-amber-700 font-medium">
                  💡 Ajoutez l'URL de l'article ci-dessus pour ouvrir directement le partage {activePlatform.label}.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Full export row */}
        <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/10 px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-foreground">Export texte complet</p>
            <p className="text-[10px] text-muted-foreground truncate">
              Titre + description + article — prêt à coller dans votre CMS
            </p>
          </div>
          <InlineCopy text={fullExport} label="Article complet" />
        </div>
      </div>
    </div>
  );
}
