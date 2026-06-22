/**
 * AITrustBadgeWidget
 * Section "Badge de Confiance IA" dans l'onglet Intégrations.
 * Permet au pro de copier un mini-script pour afficher un badge
 * "Top Commerce recommandé par ChatGPT" sur son site internet personnel.
 */
import { useState } from 'react';
import { Copy, CheckCircle, Sparkles, ExternalLink, Code2, Palette, Eye, ChevronDown, ChevronUp } from 'lucide-react';

// ── Badge preview ─────────────────────────────────────────────────────────────
type BadgeStyle = 'dark' | 'light' | 'gradient' | 'minimal';
type BadgeSize = 'sm' | 'md' | 'lg';

const STYLE_CONFIG: Record<BadgeStyle, { label: string; bg: string; text: string; border: string; accentBg: string }> = {
  dark: {
    label: 'Sombre', bg: '#0F172A', text: '#F8FAFC', border: '#334155',
    accentBg: 'rgba(99,89,248,.25)',
  },
  light: {
    label: 'Clair', bg: '#FFFFFF', text: '#0F172A', border: '#E2E8F0',
    accentBg: 'rgba(99,89,248,.08)',
  },
  gradient: {
    label: 'Dégradé', bg: 'linear-gradient(135deg, #6359F8, #8B5CF6)', text: '#FFFFFF', border: 'transparent',
    accentBg: 'rgba(255,255,255,.15)',
  },
  minimal: {
    label: 'Minimal', bg: '#F8FAFC', text: '#6359F8', border: '#C7D2FE',
    accentBg: 'rgba(99,89,248,.06)',
  },
};

const SIZE_CONFIG: Record<BadgeSize, { label: string; padding: string; fontSize: string; iconSize: number; gap: number }> = {
  sm: { label: 'Petit', padding: '6px 12px', fontSize: '.72rem', iconSize: 14, gap: 6 },
  md: { label: 'Moyen', padding: '10px 18px', fontSize: '.85rem', iconSize: 18, gap: 9 },
  lg: { label: 'Grand', padding: '14px 24px', fontSize: '1rem', iconSize: 22, gap: 12 },
};

function BadgePreview({ style, size, businessName }: { style: BadgeStyle; size: BadgeSize; businessName: string }) {
  const s = STYLE_CONFIG[style];
  const z = SIZE_CONFIG[size];
  const isGradient = style === 'gradient';

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: z.gap,
      background: isGradient ? undefined : s.bg,
      backgroundImage: isGradient ? s.bg : undefined,
      border: `1.5px solid ${s.border}`,
      borderRadius: 14, padding: z.padding,
      boxShadow: '0 4px 20px rgba(0,0,0,.12)',
      cursor: 'default',
    }}>
      {/* AI star icon */}
      <div style={{
        width: z.iconSize + 8, height: z.iconSize + 8,
        borderRadius: '50%', background: s.accentBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Sparkles size={z.iconSize} style={{ color: isGradient ? '#FCD34D' : '#6359F8' }} />
      </div>
      <div>
        <p style={{ fontSize: z.fontSize, fontWeight: 800, color: s.text, lineHeight: 1.1, margin: 0 }}>
          🏆 Recommandé par ChatGPT
        </p>
        <p style={{ fontSize: `calc(${z.fontSize} - 0.1rem)`, color: isGradient ? 'rgba(255,255,255,.75)' : 'hsl(var(--muted-foreground))', margin: '2px 0 0', lineHeight: 1 }}>
          {businessName || 'Votre Commerce'} · Certifié Kompilot IA
        </p>
      </div>
      {/* External link icon */}
      <ExternalLink size={z.iconSize - 4} style={{ color: isGradient ? 'rgba(255,255,255,.6)' : 'hsl(var(--muted-foreground))', marginLeft: 4, flexShrink: 0 }} />
    </div>
  );
}

function generateScript(style: BadgeStyle, size: BadgeSize, businessName: string): string {
  const s = STYLE_CONFIG[style];
  const z = SIZE_CONFIG[size];
  const isGradient = style === 'gradient';
  const escapedName = (businessName || 'Votre Commerce').replace(/'/g, "\\'");

  return `<!-- Badge IA Kompilot — ${escapedName} -->
<div id="kompilot-badge" style="display:inline-flex;align-items:center;gap:${z.gap}px;background:${isGradient ? 'linear-gradient(135deg,#6359F8,#8B5CF6)' : s.bg};border:1.5px solid ${s.border};border-radius:14px;padding:${z.padding};box-shadow:0 4px 20px rgba(0,0,0,.12);cursor:pointer;text-decoration:none;" onclick="window.open('https://g.page/r/business-review-link','_blank')">
  <div style="width:${z.iconSize + 8}px;height:${z.iconSize + 8}px;border-radius:50%;background:${s.accentBg};display:flex;align-items:center;justify-content:center;">
    <svg width="${z.iconSize}" height="${z.iconSize}" viewBox="0 0 24 24" fill="none" stroke="${isGradient ? '#FCD34D' : '#6359F8'}" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
  </div>
  <div>
    <p style="font-size:${z.fontSize};font-weight:800;color:${s.text};margin:0;line-height:1.1;">🏆 Recommandé par ChatGPT</p>
    <p style="font-size:calc(${z.fontSize} - 1px);color:${isGradient ? 'rgba(255,255,255,.75)' : '#64748B'};margin:2px 0 0;">${escapedName} · Certifié Kompilot IA</p>
  </div>
</div>`;
}

// ── Main component ────────────────────────────────────────────────────────────
interface AITrustBadgeWidgetProps {
  businessName?: string;
}

export function AITrustBadgeWidget({ businessName: initialName = '' }: AITrustBadgeWidgetProps) {
  const [businessName, setBusinessName] = useState(initialName);
  const [badgeStyle, setBadgeStyle] = useState<BadgeStyle>('dark');
  const [badgeSize, setBadgeSize] = useState<BadgeSize>('md');
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const script = generateScript(badgeStyle, badgeSize, businessName);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{
      background: 'hsl(var(--card))',
      border: '1.5px solid hsl(var(--border))',
      borderRadius: 18, overflow: 'hidden',
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 20px', cursor: 'pointer',
          background: 'linear-gradient(135deg, rgba(99,89,248,.08) 0%, rgba(99,89,248,.02) 100%)',
          borderBottom: expanded ? '1px solid hsl(var(--border))' : 'none',
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'rgba(99,89,248,.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Sparkles size={20} style={{ color: '#6359F8' }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 800, fontSize: '.95rem', color: 'hsl(var(--foreground))', marginBottom: 2 }}>
            Badge de Confiance IA
          </p>
          <p style={{ fontSize: '.73rem', color: 'hsl(var(--muted-foreground))' }}>
            Affichez "🏆 Recommandé par ChatGPT" sur votre site — 1 seul copier/coller
          </p>
        </div>
        <span style={{
          background: 'rgba(99,89,248,.12)', color: '#6359F8',
          border: '1px solid rgba(99,89,248,.25)',
          borderRadius: 20, padding: '3px 10px', fontSize: '.7rem', fontWeight: 700,
        }}>
          NOUVEAU ✨
        </span>
        {expanded ? <ChevronUp size={16} style={{ color: 'hsl(var(--muted-foreground))' }} /> : <ChevronDown size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />}
      </div>

      {expanded && (
        <div style={{ padding: '20px' }}>
          {/* Why section */}
          <div style={{
            background: 'rgba(99,89,248,.05)', border: '1px solid rgba(99,89,248,.15)',
            borderRadius: 12, padding: '12px 16px', marginBottom: 20,
          }}>
            <p style={{ fontSize: '.8rem', color: 'hsl(var(--foreground))', lineHeight: 1.55, margin: 0 }}>
              <strong style={{ color: '#6359F8' }}>Pourquoi ce badge ?</strong> 73% des consommateurs font davantage confiance aux commerces mentionnés par des outils IA comme ChatGPT. Ce badge renforce votre crédibilité locale et améliore votre taux de conversion.
            </p>
          </div>

          {/* Business name input */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.04em' }}>
              Nom de votre commerce
            </label>
            <input
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="Ex : Le Petit Bistro"
              style={{
                width: '100%', padding: '9px 12px',
                background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))',
                borderRadius: 9, fontSize: '.88rem', color: 'hsl(var(--foreground))',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Style selector */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Palette size={13} style={{ color: 'hsl(var(--muted-foreground))' }} />
              <span style={{ fontSize: '.72rem', fontWeight: 700, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '.04em' }}>Style</span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(Object.keys(STYLE_CONFIG) as BadgeStyle[]).map(s => (
                <button
                  key={s}
                  onClick={() => setBadgeStyle(s)}
                  style={{
                    padding: '6px 14px',
                    background: badgeStyle === s ? '#6359F8' : 'hsl(var(--muted))',
                    border: `1.5px solid ${badgeStyle === s ? '#6359F8' : 'hsl(var(--border))'}`,
                    color: badgeStyle === s ? '#fff' : 'hsl(var(--foreground))',
                    borderRadius: 20, fontSize: '.78rem', fontWeight: 600,
                    cursor: 'pointer', transition: 'all .15s',
                  }}
                >
                  {STYLE_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Size selector */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Eye size={13} style={{ color: 'hsl(var(--muted-foreground))' }} />
              <span style={{ fontSize: '.72rem', fontWeight: 700, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '.04em' }}>Taille</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(Object.keys(SIZE_CONFIG) as BadgeSize[]).map(s => (
                <button
                  key={s}
                  onClick={() => setBadgeSize(s)}
                  style={{
                    flex: 1, padding: '7px 0',
                    background: badgeSize === s ? '#6359F8' : 'hsl(var(--muted))',
                    border: `1.5px solid ${badgeSize === s ? '#6359F8' : 'hsl(var(--border))'}`,
                    color: badgeSize === s ? '#fff' : 'hsl(var(--foreground))',
                    borderRadius: 10, fontSize: '.78rem', fontWeight: 600,
                    cursor: 'pointer', transition: 'all .15s',
                  }}
                >
                  {SIZE_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Live preview */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Eye size={13} style={{ color: 'hsl(var(--muted-foreground))' }} />
              <span style={{ fontSize: '.72rem', fontWeight: 700, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '.04em' }}>Aperçu en direct</span>
            </div>
            <div style={{
              background: 'hsl(var(--muted))', borderRadius: 14, padding: '24px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80,
            }}>
              <BadgePreview style={badgeStyle} size={badgeSize} businessName={businessName} />
            </div>
          </div>

          {/* Code panel toggle */}
          <button
            onClick={() => setShowCode(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, width: '100%',
              background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))',
              color: 'hsl(var(--foreground))', borderRadius: 10, padding: '10px 14px',
              fontWeight: 600, fontSize: '.83rem', cursor: 'pointer', marginBottom: showCode ? 10 : 16,
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Code2 size={15} />
              Afficher le code HTML
            </div>
            {showCode ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showCode && (
            <div style={{
              background: '#0F172A', borderRadius: 12, padding: '14px 16px',
              marginBottom: 16, position: 'relative', overflowX: 'auto',
            }}>
              <pre style={{
                margin: 0, fontSize: '.72rem', color: '#94A3B8',
                fontFamily: 'monospace', lineHeight: 1.6,
                whiteSpace: 'pre-wrap', wordBreak: 'break-all',
              }}>{script}</pre>
            </div>
          )}

          {/* Copy button */}
          <button
            onClick={handleCopy}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: copied ? '#16A34A' : '#6359F8',
              color: '#fff', border: 'none', borderRadius: 14,
              padding: '13px 20px', fontWeight: 800, fontSize: '.92rem',
              cursor: 'pointer', width: '100%',
              transition: 'background .2s',
              boxShadow: copied ? '0 4px 16px rgba(22,163,74,.3)' : '0 4px 16px rgba(99,89,248,.3)',
            }}
          >
            {copied
              ? <><CheckCircle size={18} /> Script copié — collez-le sur votre site !</>
              : <><Copy size={18} /> 📋 Copier le script (1 clic)</>
            }
          </button>

          {/* Install instructions */}
          <div style={{
            marginTop: 14, background: 'hsl(var(--muted))', borderRadius: 12, padding: '12px 16px',
          }}>
            <p style={{ fontSize: '.72rem', fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: 6 }}>
              Comment l'installer sur votre site ?
            </p>
            <ol style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                'Copiez le script ci-dessus',
                'Ouvrez l\'éditeur HTML de votre site (WordPress, Wix, Squarespace…)',
                'Collez le code là où vous souhaitez afficher le badge',
                'Sauvegardez — le badge apparaît instantanément',
              ].map((step, i) => (
                <li key={i} style={{ fontSize: '.76rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.45 }}>
                  <strong style={{ color: '#6359F8' }}>Étape {i + 1} :</strong> {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
