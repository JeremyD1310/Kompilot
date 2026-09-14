/**
 * EmailTemplateEditorPage — Éditeur de templates email
 * Deux modes : liste de templates + éditeur visuel (drag-to-add blocks)
 * Style : Mailchimp / Brevo — split layout palette | canvas | settings
 */
import { useState, useCallback, useMemo } from 'react';
import { ResponsiveImage } from '../components/shared/ResponsiveImage';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Page, PageHeader, PageTitle, PageDescription, PageBody,
  Button, Input, Badge, toast,
} from '@blinkdotnew/ui';
import {
  ArrowLeft, Plus, Copy, Trash2, Save, Eye, EyeOff,
  Type, Heading1, ImageIcon, MousePointerClick, Minus,
  MoveVertical, Columns, Share2, FileText,
  ChevronUp, ChevronDown, X, Smartphone, Monitor,
  Mail, Calendar, Tag, LayoutGrid,
  Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon, AlignLeft, AlignCenter, AlignRight,
  Code, Download,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

type BlockType =
  | 'text' | 'title' | 'image' | 'button' | 'separator'
  | 'spacer' | 'columns' | 'social' | 'footer';

interface Block {
  id: string;
  type: BlockType;
  data: Record<string, unknown>;
}

interface Template {
  id: string;
  name: string;
  subject: string;
  preheader: string;
  category: string;
  blocks: Block[];
  lastUsed: string;
}

type ViewMode = 'list' | 'editor';

// ── Helpers ────────────────────────────────────────────────────────────────────

let blockCounter = 0;
const uid = () => `blk_${Date.now()}_${++blockCounter}`;
const tplUid = () => `tpl_${Date.now()}_${++blockCounter}`;

const CATEGORIES = ['Tous', 'Newsletter', 'Promotion', 'Bienvenue', 'Événement'] as const;

const BLOCK_PALETTE: { type: BlockType; label: string; icon: typeof Type }[] = [
  { type: 'text',      label: 'Texte',            icon: Type },
  { type: 'title',     label: 'Titre',            icon: Heading1 },
  { type: 'image',     label: 'Image',            icon: ImageIcon },
  { type: 'button',    label: 'Bouton CTA',       icon: MousePointerClick },
  { type: 'separator', label: 'Séparateur',       icon: Minus },
  { type: 'spacer',    label: 'Espaceur',         icon: MoveVertical },
  { type: 'columns',   label: 'Colonnes',         icon: Columns },
  { type: 'social',    label: 'Réseaux sociaux',  icon: Share2 },
  { type: 'footer',    label: 'Footer',           icon: FileText },
];

function defaultBlockData(type: BlockType): Record<string, unknown> {
  switch (type) {
    case 'text':      return { html: '<p>Votre contenu ici…</p>', fontSize: 'md', align: 'left', color: '#374151' };
    case 'title':     return { html: 'Titre de section', level: 'h2', align: 'left', color: '#111827' };
    case 'image':     return { url: '', alt: 'Image', width: '100' };
    case 'button':    return { text: 'Cliquez ici', url: '#', bgColor: '#0D9488', textColor: '#ffffff', borderRadius: 'rounded' };
    case 'separator': return { color: '#E5E7EB', thickness: '1' };
    case 'spacer':    return { height: '40' };
    case 'columns':   return { leftHtml: '<p>Colonne gauche</p>', rightHtml: '<p>Colonne droite</p>' };
    case 'social':    return { facebook: '#', instagram: '#', linkedin: '#', x: '#' };
    case 'footer':    return { text: 'Vous recevez cet email car vous êtes inscrit à notre newsletter.', address: '123 Rue de Paris, 75001 Paris', unsubscribeText: 'Se désinscrire' };
    default:          return {};
  }
}

// ── Mock templates ─────────────────────────────────────────────────────────────

function makeMockTemplates(): Template[] {
  return [
    {
      id: tplUid(), name: 'Newsletter mensuelle', subject: '📰 Votre résumé du mois',
      preheader: 'Découvrez les nouveautés de ce mois-ci', category: 'Newsletter', lastUsed: '12 juin 2025',
      blocks: [
        { id: uid(), type: 'image', data: { url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=200&fit=crop', alt: 'Header newsletter', width: '100' } },
        { id: uid(), type: 'title', data: { html: 'Résumé du mois de juin', level: 'h1', align: 'center', color: '#111827' } },
        { id: uid(), type: 'text', data: { html: '<p>Cher(e) client(e),<br/><br/>Voici un résumé de tout ce qui s\'est passé ce mois-ci chez nous. Nous avons préparé de belles surprises pour vous !</p>', fontSize: 'md', align: 'left', color: '#374151' } },
        { id: uid(), type: 'columns', data: { leftHtml: '<p><strong>🎯 Objectifs atteints</strong><br/>Nous avons dépassé nos objectifs ce trimestre.</p>', rightHtml: '<p><strong>🚀 Nouveautés</strong><br/>Découvrez nos nouveaux services.</p>' } },
        { id: uid(), type: 'button', data: { text: 'Lire la suite', url: '#', bgColor: '#0D9488', textColor: '#ffffff', borderRadius: 'rounded' } },
        { id: uid(), type: 'social', data: { facebook: '#', instagram: '#', linkedin: '#', x: '#' } },
        { id: uid(), type: 'footer', data: { text: 'Vous recevez cet email car vous êtes inscrit à notre newsletter mensuelle.', address: '123 Rue de Paris, 75001 Paris', unsubscribeText: 'Se désinscrire' } },
      ],
    },
    {
      id: tplUid(), name: 'Offre spéciale été', subject: '☀️ Offre exclusive -30% cet été !',
      preheader: 'Profitez de -30% sur toute notre gamme estivale', category: 'Promotion', lastUsed: '8 juin 2025',
      blocks: [
        { id: uid(), type: 'title', data: { html: '☀️ Offre Spéciale Été', level: 'h1', align: 'center', color: '#0D9488' } },
        { id: uid(), type: 'image', data: { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=250&fit=crop', alt: 'Promotion été', width: '100' } },
        { id: uid(), type: 'text', data: { html: '<p>Profitez de <strong>-30%</strong> sur l\'ensemble de notre catalogue grâce au code promo <strong>ETE30</strong>. Offre valable jusqu\'au 31 août.</p>', fontSize: 'lg', align: 'center', color: '#374151' } },
        { id: uid(), type: 'button', data: { text: '🛒 J\'en profite maintenant', url: '#', bgColor: '#F97316', textColor: '#ffffff', borderRadius: 'pill' } },
        { id: uid(), type: 'separator', data: { color: '#E5E7EB', thickness: '1' } },
        { id: uid(), type: 'social', data: { facebook: '#', instagram: '#', linkedin: '#', x: '#' } },
        { id: uid(), type: 'footer', data: { text: 'Offre valable du 1er juin au 31 août 2025. Non cumulable.', address: '123 Rue de Paris, 75001 Paris', unsubscribeText: 'Se désinscrire' } },
      ],
    },
    {
      id: tplUid(), name: 'Bienvenue nouveau client', subject: '👋 Bienvenue chez Kompilot !',
      preheader: 'Nous sommes ravis de vous accueillir', category: 'Bienvenue', lastUsed: '5 juin 2025',
      blocks: [
        { id: uid(), type: 'title', data: { html: 'Bienvenue {{prénom}} ! 👋', level: 'h1', align: 'center', color: '#111827' } },
        { id: uid(), type: 'text', data: { html: '<p>Nous sommes <strong>ravis</strong> de vous accueillir dans la communauté Kompilot. Votre compte a été créé avec succès et vous pouvez dès maintenant profiter de toutes nos fonctionnalités.</p><p>N\'hésitez pas à nous contacter si vous avez la moindre question.</p>', fontSize: 'md', align: 'left', color: '#374151' } },
        { id: uid(), type: 'button', data: { text: '🚀 Accéder à mon espace', url: '#', bgColor: '#0D9488', textColor: '#ffffff', borderRadius: 'rounded' } },
        { id: uid(), type: 'footer', data: { text: 'Cet email a été envoyé automatiquement. Pas besoin d\'y répondre.', address: 'Kompilot — 123 Rue de Paris, 75001 Paris', unsubscribeText: 'Gérer mes préférences' } },
      ],
    },
  ];
}

// ── Inline Format Toolbar ────────────────────────────────────────────────────

function InlineFormatToolbar({ blockType, onFormat }: { blockType: BlockType; onFormat: (cmd: string, val?: string) => void }) {
  if (blockType !== 'text' && blockType !== 'title') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-0.5 p-1 bg-card border border-border rounded-lg shadow-md mb-2"
    >
      {blockType === 'text' && (
        <>
          <button onClick={() => onFormat('bold')} className="p-1.5 rounded hover:bg-muted transition-colors" title="Gras">
            <Bold size={13} />
          </button>
          <button onClick={() => onFormat('italic')} className="p-1.5 rounded hover:bg-muted transition-colors" title="Italique">
            <Italic size={13} />
          </button>
          <button onClick={() => onFormat('underline')} className="p-1.5 rounded hover:bg-muted transition-colors" title="Souligné">
            <UnderlineIcon size={13} />
          </button>
          <div className="w-px h-4 bg-border mx-0.5" />
        </>
      )}
      <button onClick={() => onFormat('justifyLeft')} className="p-1.5 rounded hover:bg-muted transition-colors" title="Aligner à gauche">
        <AlignLeft size={13} />
      </button>
      <button onClick={() => onFormat('justifyCenter')} className="p-1.5 rounded hover:bg-muted transition-colors" title="Centrer">
        <AlignCenter size={13} />
      </button>
      <button onClick={() => onFormat('justifyRight')} className="p-1.5 rounded hover:bg-muted transition-colors" title="Aligner à droite">
        <AlignRight size={13} />
      </button>
      <div className="w-px h-4 bg-border mx-0.5" />
      <button
        onClick={() => {
          const url = prompt('URL du lien :');
          if (url) onFormat('createLink', url);
        }}
        className="p-1.5 rounded hover:bg-muted transition-colors"
        title="Insérer un lien"
      >
        <LinkIcon size={13} />
      </button>
    </motion.div>
  );
}

// ── HTML Export ──────────────────────────────────────────────────────────────

function getEmailImageUrl(url: string, format: 'avif' | 'webp') {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'images.unsplash.com') {
      parsed.searchParams.set('fm', format);
      return parsed.toString();
    }
  } catch {
    // Keep user-provided URLs unchanged when they are not absolute URLs.
  }
  return url;
}

function generateEmailHTML(template: Template): string {
  const blockToHTML = (block: Block): string => {
    const d = block.data;
    switch (block.type) {
      case 'text':
        return `<tr><td style="padding:16px;font-size:${d.fontSize === 'sm' ? '13px' : d.fontSize === 'lg' ? '18px' : '15px'};text-align:${d.align || 'left'};color:${d.color || '#374151'};font-family:Arial,sans-serif;line-height:1.6;">${d.html || ''}</td></tr>`;
      case 'title': {
        const sizes: Record<string, string> = { h1: '28px', h2: '22px', h3: '18px' };
        const level = (d.level as string) || 'h2';
        return `<tr><td style="padding:16px;text-align:${d.align || 'left'};"><${level} style="font-size:${sizes[level]};font-weight:700;color:${d.color || '#111827'};margin:0;font-family:Arial,sans-serif;">${d.html || ''}</${level}></td></tr>`;
      }
      case 'image':
        return d.url ? `<tr><td style="padding:16px;text-align:center;"><picture><source type="image/avif" srcset="${getEmailImageUrl(d.url as string, 'avif')}" /><source type="image/webp" srcset="${getEmailImageUrl(d.url as string, 'webp')}" /><img src="${getEmailImageUrl(d.url as string, 'webp')}" alt="${d.alt || 'Image illustrative'}" width="600" height="300" style="width:${d.width || '100'}%;height:auto;aspect-ratio:2/1;border-radius:6px;display:block;margin:0 auto;" loading="lazy" decoding="async" /></picture></td></tr>` : '';
      case 'button': {
        const radius = d.borderRadius === 'pill' ? '9999px' : d.borderRadius === 'square' ? '0px' : '8px';
        return `<tr><td style="padding:16px;text-align:center;"><a href="${d.url || '#'}" style="display:inline-block;padding:12px 32px;background-color:${d.bgColor || '#0D9488'};color:${d.textColor || '#ffffff'};border-radius:${radius};font-family:Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;" target="_blank">${d.text || 'Cliquez ici'}</a></td></tr>`;
      }
      case 'separator':
        return `<tr><td style="padding:16px;"><hr style="border:none;border-top:${d.thickness || '1'}px solid ${d.color || '#E5E7EB'};margin:0;" /></td></tr>`;
      case 'spacer':
        return `<tr><td style="height:${d.height || '40'}px;"></td></tr>`;
      case 'columns':
        return `<tr><td style="padding:16px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td width="50%" style="vertical-align:top;padding-right:8px;font-family:Arial,sans-serif;font-size:14px;color:#374151;">${d.leftHtml || ''}</td><td width="50%" style="vertical-align:top;padding-left:8px;font-family:Arial,sans-serif;font-size:14px;color:#374151;">${d.rightHtml || ''}</td></tr></table></td></tr>`;
      case 'social': {
        const icons = ['Facebook', 'Instagram', 'LinkedIn', 'X'].filter(n => d[n.toLowerCase()] && d[n.toLowerCase()] !== '#');
        if (!icons.length) return '';
        return `<tr><td style="padding:16px;text-align:center;">${icons.map(n => `<a href="${d[n.toLowerCase()]}" style="display:inline-block;width:32px;height:32px;line-height:32px;text-align:center;background:#E5E7EB;border-radius:50%;margin:0 4px;font-size:12px;font-weight:bold;color:#374151;text-decoration:none;font-family:Arial,sans-serif;" target="_blank">${n[0]}</a>`).join('')}</td></tr>`;
      }
      case 'footer':
        return `<tr><td style="padding:16px;text-align:center;font-family:Arial,sans-serif;"><p style="font-size:11px;color:#9CA3AF;margin:4px 0;">${d.text || ''}</p><a href="#unsubscribe" style="font-size:11px;color:#0D9488;text-decoration:underline;">${d.unsubscribeText || 'Se désinscrire'}</a><p style="font-size:11px;color:#9CA3AF;margin:4px 0;">${d.address || ''}</p></td></tr>`;
      default:
        return '';
    }
  };

  const rows = template.blocks.map(blockToHTML).filter(Boolean).join('\n');

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${template.subject || template.name}</title></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;">
<tr><td align="center" style="padding:24px 0;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
${rows}
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

/** Renders a single email block inside the canvas */
function BlockRenderer({ block, isSelected, onSelect, onContentChange }: {
  block: Block; isSelected: boolean; onSelect: () => void;
  onContentChange?: (html: string) => void;
}) {
  const d = block.data;
  const borderClass = isSelected ? 'ring-2 ring-primary ring-offset-1' : 'hover:ring-1 hover:ring-primary/30';

  const wrapper = (children: React.ReactNode, extra?: string) => (
    <div
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      className={`relative group cursor-pointer rounded-md transition-all ${borderClass} ${extra ?? ''}`}
    >
      {children}
    </div>
  );

  switch (block.type) {
    case 'text':
      return wrapper(
        <div
          className="p-4 outline-none"
          style={{ fontSize: d.fontSize === 'sm' ? '13px' : d.fontSize === 'lg' ? '18px' : '15px', textAlign: d.align as string, color: d.color as string }}
          contentEditable={isSelected}
          suppressContentEditableWarning
          dangerouslySetInnerHTML={{ __html: d.html as string }}
          onBlur={(e) => onContentChange?.(e.currentTarget.innerHTML)}
        />,
      );
    case 'title': {
      const Tag = (d.level as string) === 'h1' ? 'h1' : (d.level as string) === 'h3' ? 'h3' : 'h2';
      const sizes: Record<string, string> = { h1: '28px', h2: '22px', h3: '18px' };
      return wrapper(
        <div className="p-4 outline-none" style={{ textAlign: d.align as string }}>
          <Tag
            style={{ fontSize: sizes[d.level as string] ?? '22px', fontWeight: 700, color: d.color as string, margin: 0 }}
            contentEditable={isSelected}
            suppressContentEditableWarning
            onBlur={(e) => onContentChange?.(e.currentTarget.textContent ?? '')}
          >
            {d.html as string}
          </Tag>
        </div>,
      );
    }
    case 'image':
      return wrapper(
        <div className="p-4">
          {d.url ? (
            <ResponsiveImage
              src={d.url as string}
              alt={(d.alt as string) || 'Image du template'}
              width={600}
              height={300}
              sizes="(max-width: 768px) 100vw, 600px"
              className="mx-auto rounded-md"
              style={{ width: `${d.width}%` }}
            />
          ) : (
            <div className="bg-muted rounded-lg h-40 flex items-center justify-center text-muted-foreground text-sm">
              <ImageIcon size={24} className="mr-2 opacity-40" /> Image — ajoutez une URL
            </div>
          )}
        </div>,
      );
    case 'button': {
      const radius = d.borderRadius === 'pill' ? '9999px' : d.borderRadius === 'square' ? '0px' : '8px';
      return wrapper(
        <div className="p-4 text-center">
          <span
            className="inline-block px-6 py-3 font-semibold text-sm"
            style={{ backgroundColor: d.bgColor as string, color: d.textColor as string, borderRadius: radius }}
          >
            {d.text as string}
          </span>
        </div>,
      );
    }
    case 'separator':
      return wrapper(
        <div className="px-4 py-2">
          <hr style={{ borderColor: d.color as string, borderWidth: `${d.thickness}px` }} />
        </div>,
      );
    case 'spacer':
      return wrapper(
        <div style={{ height: `${d.height}px` }} className="flex items-center justify-center">
          <span className="text-[10px] text-muted-foreground/40 tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity">
            Espaceur {d.height}px
          </span>
        </div>,
      );
    case 'columns':
      return wrapper(
        <div className="grid grid-cols-2 gap-4 p-4">
          <div className="text-sm text-foreground" dangerouslySetInnerHTML={{ __html: d.leftHtml as string }} />
          <div className="text-sm text-foreground" dangerouslySetInnerHTML={{ __html: d.rightHtml as string }} />
        </div>,
      );
    case 'social':
      return wrapper(
        <div className="flex items-center justify-center gap-4 py-4">
          {['Facebook', 'Instagram', 'LinkedIn', 'X'].map((n) => (
            <span key={n} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
              {n[0]}
            </span>
          ))}
        </div>,
      );
    case 'footer':
      return wrapper(
        <div className="p-4 text-center text-[11px] text-muted-foreground space-y-1">
          <p>{d.text as string}</p>
          <p className="underline cursor-pointer">{d.unsubscribeText as string}</p>
          <p>{d.address as string}</p>
        </div>,
      );
    default:
      return null;
  }
}

/** Renders a scaled-down mini preview of template blocks for the list cards */
function TemplatePreview({ blocks }: { blocks: Block[] }) {
  return (
    <div className="w-full h-[200px] overflow-hidden rounded-md bg-background border border-border relative">
      <div className="origin-top-left" style={{ transform: 'scale(0.38)', width: '263%', pointerEvents: 'none' }}>
        {blocks.map((b) => (
          <div key={b.id} className="pointer-events-none">
            <BlockRenderer block={b} isSelected={false} onSelect={() => { }} />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
    </div>
  );
}

/** Phone-shaped preview frame */
function PhonePreview({ blocks }: { blocks: Block[] }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[320px] h-[640px] rounded-[36px] border-[6px] border-foreground/20 bg-background overflow-hidden shadow-xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-foreground/10 rounded-b-2xl z-10" />
        <div className="h-full overflow-y-auto pt-8 pb-4 px-1">
          {blocks.map((b) => (
            <div key={b.id} className="pointer-events-none">
              <BlockRenderer block={b} isSelected={false} onSelect={() => { }} />
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground font-medium">Aperçu mobile</p>
    </div>
  );
}

/** Properties panel for the selected block */
function PropertiesPanel({ block, onChange }: { block: Block; onChange: (data: Record<string, unknown>) => void }) {
  const d = block.data;
  const set = (key: string, val: unknown) => onChange({ ...d, [key]: val });

  const field = (label: string, children: React.ReactNode) => (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );

  switch (block.type) {
    case 'text':
      return (
        <div className="space-y-4">
          {field('Taille', (
            <div className="flex gap-1">
              {(['sm', 'md', 'lg'] as const).map((s) => (
                <button key={s} onClick={() => set('fontSize', s)}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${d.fontSize === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-foreground hover:bg-muted'}`}>
                  {s === 'sm' ? 'Petit' : s === 'md' ? 'Moyen' : 'Grand'}
                </button>
              ))}
            </div>
          ))}
          {field('Alignement', (
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map((a) => (
                <button key={a} onClick={() => set('align', a)}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${d.align === a ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-foreground hover:bg-muted'}`}>
                  {a === 'left' ? 'Gauche' : a === 'center' ? 'Centre' : 'Droite'}
                </button>
              ))}
            </div>
          ))}
          {field('Couleur du texte', (
            <Input type="color" value={d.color as string} onChange={(e) => set('color', e.target.value)} className="h-9 w-full cursor-pointer" />
          ))}
        </div>
      );
    case 'title':
      return (
        <div className="space-y-4">
          {field('Niveau', (
            <div className="flex gap-1">
              {(['h1', 'h2', 'h3'] as const).map((l) => (
                <button key={l} onClick={() => set('level', l)}
                  className={`px-3 py-1.5 text-xs rounded-md border font-bold transition-colors ${d.level === l ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-foreground hover:bg-muted'}`}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          ))}
          {field('Alignement', (
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map((a) => (
                <button key={a} onClick={() => set('align', a)}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${d.align === a ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-foreground hover:bg-muted'}`}>
                  {a === 'left' ? 'Gauche' : a === 'center' ? 'Centre' : 'Droite'}
                </button>
              ))}
            </div>
          ))}
          {field('Couleur', (
            <Input type="color" value={d.color as string} onChange={(e) => set('color', e.target.value)} className="h-9 w-full cursor-pointer" />
          ))}
        </div>
      );
    case 'image':
      return (
        <div className="space-y-4">
          {field('URL de l\'image', <Input value={d.url as string} onChange={(e) => set('url', e.target.value)} placeholder="https://…" />)}
          {field('Texte alternatif', <Input value={d.alt as string} onChange={(e) => set('alt', e.target.value)} placeholder="Description" />)}
          {field(`Largeur : ${d.width}%`, (
            <input type="range" min={20} max={100} value={Number(d.width)} onChange={(e) => set('width', e.target.value)} className="w-full accent-primary" />
          ))}
        </div>
      );
    case 'button':
      return (
        <div className="space-y-4">
          {field('Texte du bouton', <Input value={d.text as string} onChange={(e) => set('text', e.target.value)} />)}
          {field('Lien URL', <Input value={d.url as string} onChange={(e) => set('url', e.target.value)} placeholder="https://…" />)}
          {field('Couleur de fond', (
            <div className="flex gap-2">
              {[{ label: 'Teal', value: '#0D9488' }, { label: 'Bleu', value: '#2563EB' }, { label: 'Orange', value: '#F97316' }].map((c) => (
                <button key={c.value} onClick={() => set('bgColor', c.value)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${d.bgColor === c.value ? 'border-foreground scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c.value }} title={c.label} />
              ))}
              <Input type="color" value={d.bgColor as string} onChange={(e) => set('bgColor', e.target.value)} className="h-8 w-8 p-0 cursor-pointer border-0" />
            </div>
          ))}
          {field('Forme', (
            <div className="flex gap-1">
              {([['rounded', 'Arrondi'], ['square', 'Carré'], ['pill', 'Pilule']] as const).map(([val, lbl]) => (
                <button key={val} onClick={() => set('borderRadius', val)}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${d.borderRadius === val ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-foreground hover:bg-muted'}`}>
                  {lbl}
                </button>
              ))}
            </div>
          ))}
        </div>
      );
    case 'separator':
      return (
        <div className="space-y-4">
          {field('Couleur', <Input type="color" value={d.color as string} onChange={(e) => set('color', e.target.value)} className="h-9 w-full cursor-pointer" />)}
          {field(`Épaisseur : ${d.thickness}px`, (
            <input type="range" min={1} max={5} value={Number(d.thickness)} onChange={(e) => set('thickness', e.target.value)} className="w-full accent-primary" />
          ))}
        </div>
      );
    case 'spacer':
      return (
        <div className="space-y-4">
          {field(`Hauteur : ${d.height}px`, (
            <div>
              <input type="range" min={10} max={100} step={10} value={Number(d.height)} onChange={(e) => set('height', e.target.value)} className="w-full accent-primary" />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                {[20, 40, 60].map((h) => (
                  <button key={h} onClick={() => set('height', String(h))}
                    className={`px-2 py-0.5 rounded border text-[10px] ${Number(d.height) === h ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}>
                    {h}px
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    default:
      return <p className="text-xs text-muted-foreground italic">Aucune propriété disponible pour ce bloc.</p>;
  }
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function EmailTemplateEditorPage() {
  // ── State ──
  const [view, setView] = useState<ViewMode>('list');
  const [templates, setTemplates] = useState<Template[]>(makeMockTemplates);
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Tous');
  const [mobilePalette, setMobilePalette] = useState(false);
  const [showHTML, setShowHTML] = useState(false);

  // ── Format command handler ──
  const handleFormat = useCallback((cmd: string, val?: string) => {
    // Use document.execCommand for contentEditable elements
    document.execCommand(cmd, false, val ?? '');
  }, []);

  // ── Export HTML handler ──
  const exportHTML = useCallback(() => {
    if (!activeTemplate) return;
    const html = generateEmailHTML({ ...activeTemplate, blocks });
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTemplate.name.replace(/[^a-z0-9]/gi, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('HTML exporté avec succès');
  }, [activeTemplate, blocks]);

  const filteredTemplates = useMemo(
    () => activeCategory === 'Tous' ? templates : templates.filter((t) => t.category === activeCategory),
    [templates, activeCategory],
  );

  const selectedBlock = selectedBlockIndex !== null ? blocks[selectedBlockIndex] : null;

  // ── Actions ──
  const openEditor = useCallback((tpl?: Template) => {
    if (tpl) {
      setActiveTemplate(tpl);
      setBlocks(tpl.blocks.map((b) => ({ ...b, id: uid() })));
    } else {
      const newTpl: Template = { id: tplUid(), name: 'Nouveau template', subject: '', preheader: '', category: 'Newsletter', blocks: [], lastUsed: '—' };
      setActiveTemplate(newTpl);
      setBlocks([]);
    }
    setSelectedBlockIndex(null);
    setPreviewMode(false);
    setView('editor');
  }, []);

  const backToList = useCallback(() => {
    setView('list');
    setActiveTemplate(null);
    setSelectedBlockIndex(null);
  }, []);

  const addBlock = useCallback((type: BlockType) => {
    setBlocks((prev) => [...prev, { id: uid(), type, data: defaultBlockData(type) }]);
    setMobilePalette(false);
  }, []);

  const removeBlock = useCallback((idx: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== idx));
    if (selectedBlockIndex === idx) setSelectedBlockIndex(null);
    else if (selectedBlockIndex !== null && selectedBlockIndex > idx) setSelectedBlockIndex(selectedBlockIndex - 1);
  }, [selectedBlockIndex]);

  const moveBlock = useCallback((idx: number, dir: -1 | 1) => {
    setBlocks((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
    if (selectedBlockIndex === idx) setSelectedBlockIndex(idx + dir);
  }, [selectedBlockIndex]);

  const updateBlockData = useCallback((idx: number, data: Record<string, unknown>) => {
    setBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, data } : b)));
  }, []);

  const duplicateTemplate = useCallback((tpl: Template) => {
    const dup: Template = { ...tpl, id: tplUid(), name: `${tpl.name} (copie)`, lastUsed: '—', blocks: tpl.blocks.map((b) => ({ ...b, id: uid() })) };
    setTemplates((prev) => [...prev, dup]);
    toast.success('Template dupliqué');
  }, []);

  const deleteTemplate = useCallback((tplId: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== tplId));
    toast.success('Template supprimé');
  }, []);

  const saveTemplate = useCallback(() => {
    if (!activeTemplate) return;
    const updated: Template = {
      ...activeTemplate,
      blocks,
      lastUsed: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    };
    setTemplates((prev) => {
      const idx = prev.findIndex((t) => t.id === updated.id);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = updated; return copy; }
      return [...prev, updated];
    });
    setActiveTemplate(updated);
    toast.success('Template sauvegardé avec succès');
  }, [activeTemplate, blocks]);

  // ── Render ──
  return (
    <Page>
      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <motion.div key="list" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
            {/* Header */}
            <PageHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Mail size={20} className="text-primary" />
                  </div>
                  <div>
                    <PageTitle>Templates Email</PageTitle>
                    <PageDescription>Créez et gérez vos modèles d'emails</PageDescription>
                  </div>
                </div>
                <Button onClick={() => openEditor()} className="gap-2 shrink-0">
                  <Plus size={16} /> Nouveau template
                </Button>
              </div>
            </PageHeader>

            <PageBody>
              {/* Category tabs */}
              <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      activeCategory === cat
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Template grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredTemplates.map((tpl, i) => (
                  <motion.div
                    key={tpl.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.3 }}
                    className="group rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                  >
                    <div className="p-3">
                      <TemplatePreview blocks={tpl.blocks} />
                    </div>
                    <div className="p-4 pt-0 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-foreground text-sm leading-tight">{tpl.name}</h3>
                        <Badge variant="secondary" className="shrink-0 text-[10px]">{tpl.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1 truncate">{tpl.subject}</p>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-4">
                        <Calendar size={11} /> {tpl.lastUsed}
                      </div>
                      <div className="flex gap-2 mt-auto">
                        <Button size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => openEditor(tpl)}>
                          <LayoutGrid size={13} /> Modifier
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => duplicateTemplate(tpl)}>
                          <Copy size={13} />
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs text-destructive hover:text-destructive" onClick={() => deleteTemplate(tpl.id)}>
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Empty state */}
                {filteredTemplates.length === 0 && (
                  <div className="col-span-full py-20 text-center">
                    <Mail size={40} className="mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground text-sm font-medium">Aucun template dans cette catégorie</p>
                    <p className="text-muted-foreground/60 text-xs mt-1">Créez un nouveau template pour commencer</p>
                  </div>
                )}
              </div>
            </PageBody>
          </motion.div>
        ) : (
          /* ════════════════════════════════════════════════════════════════════
             EDITOR VIEW
             ════════════════════════════════════════════════════════════════════ */
          <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col h-[calc(100dvh-4rem)]">

            {/* Editor top bar */}
            <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card">
              <div className="flex items-center gap-3 min-w-0">
                <Button variant="ghost" size="icon" onClick={backToList} className="shrink-0">
                  <ArrowLeft size={18} />
                </Button>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-foreground truncate">{activeTemplate?.name || 'Nouveau template'}</h2>
                  <p className="text-[11px] text-muted-foreground truncate">{activeTemplate?.subject || 'Sans objet'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowHTML(!showHTML)}
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    showHTML ? 'bg-violet-500 text-white border-violet-500' : 'border-border text-foreground hover:bg-muted'
                  }`}
                  title="Voir le HTML"
                >
                  <Code size={13} /> HTML
                </button>
                <button
                  onClick={exportHTML}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-border text-foreground hover:bg-muted transition-colors"
                  title="Exporter en HTML"
                >
                  <Download size={13} /> Exporter
                </button>
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    previewMode ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-foreground hover:bg-muted'
                  }`}
                >
                  {previewMode ? <Monitor size={13} /> : <Smartphone size={13} />}
                  {previewMode ? 'Éditeur' : 'Aperçu'}
                </button>
                <Button size="sm" onClick={saveTemplate} className="gap-1.5 text-xs">
                  <Save size={13} /> Sauvegarder
                </Button>
              </div>
            </div>

            {/* Editor body: 3-column split */}
            <div className="flex-1 flex min-h-0 overflow-hidden">

              {/* ── LEFT PANEL: Palette + Properties ── */}
              <aside className={`${mobilePalette ? 'fixed inset-0 z-50 bg-background' : 'hidden'} md:relative md:block md:w-64 lg:w-72 shrink-0 border-r border-border bg-card overflow-y-auto`}>
                {/* Mobile close */}
                <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border">
                  <span className="text-sm font-semibold text-foreground">Blocs</span>
                  <button onClick={() => setMobilePalette(false)} className="p-1"><X size={18} /></button>
                </div>

                {/* Block palette */}
                <div className="p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">Ajouter un bloc</p>
                  <div className="space-y-1">
                    {BLOCK_PALETTE.map((bp) => (
                      <button
                        key={bp.type}
                        onClick={() => addBlock(bp.type)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted transition-colors text-left group"
                      >
                        <span className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                          <bp.icon size={15} className="text-primary" />
                        </span>
                        {bp.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-border mx-3" />

                {/* Properties */}
                <div className="p-3">
                  {selectedBlock ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                          Propriétés — {BLOCK_PALETTE.find((b) => b.type === selectedBlock.type)?.label}
                        </p>
                        <button onClick={() => setSelectedBlockIndex(null)} className="p-0.5 hover:bg-muted rounded">
                          <X size={14} className="text-muted-foreground" />
                        </button>
                      </div>
                      <PropertiesPanel block={selectedBlock} onChange={(data) => { if (selectedBlockIndex !== null) updateBlockData(selectedBlockIndex, data); }} />
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground/60 italic px-1 mt-2">
                      Sélectionnez un bloc dans le canvas pour modifier ses propriétés.
                    </p>
                  )}
                </div>
              </aside>

              {/* ── CENTER: Email Canvas ── */}
              <main className="flex-1 min-w-0 overflow-y-auto bg-muted/40" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--border)) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
                {/* Mobile palette toggle */}
                <div className="md:hidden sticky top-0 z-10 p-2 bg-muted/80 backdrop-blur-sm">
                  <button
                    onClick={() => setMobilePalette(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-card border border-border text-sm font-medium text-foreground"
                  >
                    <Plus size={15} /> Ajouter un bloc
                  </button>
                </div>

                <div className="flex justify-center py-6 px-4">
                  <AnimatePresence mode="wait">
                    {previewMode ? (
                      <motion.div key="phone" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
                        <PhonePreview blocks={blocks} />
                      </motion.div>
                    ) : (
                      <motion.div key="canvas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-[600px]">
                        {/* Subject line header */}
                        <div className="bg-card rounded-t-xl border border-b-0 border-border px-5 py-3 flex items-center gap-2">
                          <Mail size={14} className="text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground">Objet :</span>
                          <span className="text-xs font-medium text-foreground truncate">{activeTemplate?.subject || '(sans objet)'}</span>
                        </div>

                        {/* Canvas body */}
                        <div
                          className="bg-background border border-border rounded-b-xl shadow-sm min-h-[400px] cursor-default"
                          onClick={() => setSelectedBlockIndex(null)}
                        >
                          {blocks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                                <Mail size={28} className="text-muted-foreground/40" />
                              </div>
                              <p className="text-sm font-medium text-muted-foreground">Cliquez sur un bloc à gauche pour commencer</p>
                              <p className="text-xs text-muted-foreground/50 mt-1">Ou sélectionnez un template existant</p>
                            </div>
                          ) : showHTML ? (
                            <div className="p-4">
                              <pre className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-all font-mono">
                                {generateEmailHTML({ ...activeTemplate!, blocks })}
                              </pre>
                            </div>
                          ) : (
                            <div>
                              {/* Format toolbar for selected text/title block */}
                              {selectedBlock && (selectedBlock.type === 'text' || selectedBlock.type === 'title') && (
                                <div className="sticky top-0 z-10 px-4 pt-3 bg-muted/60 backdrop-blur-sm">
                                  <InlineFormatToolbar blockType={selectedBlock.type} onFormat={handleFormat} />
                                </div>
                              )}
                              {blocks.map((block, idx) => (
                                <div key={block.id} className="relative group">
                                  <BlockRenderer
                                    block={block}
                                    isSelected={selectedBlockIndex === idx}
                                    onSelect={() => setSelectedBlockIndex(idx)}
                                    onContentChange={(html) => updateBlockData(idx, { ...block.data, html })}
                                  />
                                  {/* Block toolbar on hover */}
                                  <div className={`absolute -right-10 top-1 flex-col gap-0.5 ${selectedBlockIndex === idx ? 'flex' : 'hidden group-hover:flex'}`}>
                                    <button onClick={(e) => { e.stopPropagation(); moveBlock(idx, -1); }} disabled={idx === 0}
                                      className="p-1 rounded bg-card border border-border shadow-sm hover:bg-muted disabled:opacity-30 transition-colors">
                                      <ChevronUp size={12} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); moveBlock(idx, 1); }} disabled={idx === blocks.length - 1}
                                      className="p-1 rounded bg-card border border-border shadow-sm hover:bg-muted disabled:opacity-30 transition-colors">
                                      <ChevronDown size={12} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); removeBlock(idx); }}
                                      className="p-1 rounded bg-card border border-border shadow-sm hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors">
                                      <X size={12} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </main>

              {/* ── RIGHT PANEL: Settings ── */}
              <aside className="hidden lg:block w-72 shrink-0 border-l border-border bg-card overflow-y-auto">
                <div className="p-4 space-y-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Paramètres du template</p>
                  </div>

                  {activeTemplate && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nom du template</label>
                        <Input
                          value={activeTemplate.name}
                          onChange={(e) => setActiveTemplate({ ...activeTemplate, name: e.target.value })}
                          placeholder="Ex : Newsletter mensuelle"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Objet de l'email</label>
                        <Input
                          value={activeTemplate.subject}
                          onChange={(e) => setActiveTemplate({ ...activeTemplate, subject: e.target.value })}
                          placeholder="Ex : 📰 Votre résumé du mois"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Texte de prévisualisation</label>
                        <Input
                          value={activeTemplate.preheader}
                          onChange={(e) => setActiveTemplate({ ...activeTemplate, preheader: e.target.value })}
                          placeholder="Texte affiché après l'objet…"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Catégorie</label>
                        <div className="flex flex-wrap gap-1.5">
                          {(['Newsletter', 'Promotion', 'Bienvenue', 'Événement'] as const).map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setActiveTemplate({ ...activeTemplate, category: cat })}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                activeTemplate.category === cat
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="border-t border-border pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Informations</p>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Tag size={12} className="shrink-0" />
                        <span>{blocks.length} bloc{blocks.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={12} className="shrink-0" />
                        <span>Dernière utilisation : {activeTemplate?.lastUsed || '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <Button onClick={saveTemplate} className="w-full gap-2">
                      <Save size={15} /> Sauvegarder
                    </Button>
                  </div>
                </div>
              </aside>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Page>
  );
}
