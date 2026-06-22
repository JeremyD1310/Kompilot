/**
 * AioPromptCopier — Génère un prompt optimisé pour ChatGPT/Claude
 * à partir des données de synchronisation AIO (mots-clés).
 *
 * Usage : <AioPromptCopier keywords={auditResults} brandName="Kompilot" />
 */
import { useState } from 'react';
import { Copy, Check, Sparkles, FileText } from 'lucide-react';

export interface AioKeyword {
  term: string;
  volume?: number;
  difficulty?: number;
  isCited?: boolean;
  status?: 'VISIBLE' | 'INVISIBLE_DROP';
}

interface AioPromptCopierProps {
  keywords: AioKeyword[];
  brandName?: string;
  /** Affiche la preview du prompt en dessous si true */
  showPreview?: boolean;
}

function buildPrompt(keywords: AioKeyword[], brandName: string): string {
  const keywordList = keywords
    .map(k => {
      const parts = [`- ${k.term}`];
      if (k.volume !== undefined) parts.push(`Volume: ${k.volume}`);
      if (k.difficulty !== undefined) parts.push(`Difficulté: ${k.difficulty}/100`);
      if (k.status) parts.push(k.status === 'VISIBLE' ? '✅ Visible dans les réponses IA' : '🔴 Absent des réponses IA');
      return parts.join(' | ');
    })
    .join('\n');

  const topKeyword = keywords[0]?.term ?? 'votre mot-clé principal';
  const invisibleCount = keywords.filter(k => k.status === 'INVISIBLE_DROP').length;

  return `Tu es un expert SEO/AIO (AI Search Optimisation) et Copywriter B2B.

Voici les données de synchronisation AIO de la marque "${brandName}", extraites via la plateforme Kompilot :

MOTS-CLÉS STRATÉGIQUES ANALYSÉS :
${keywordList}

CONTEXTE :
- ${invisibleCount} mot(s)-clé(s) sur ${keywords.length} ne sont PAS cités dans les réponses des IA (ChatGPT, Perplexity, Claude).
- La marque "${brandName}" cherche à améliorer sa visibilité dans l'IA Search (AIO).

MISSION :
1. Rédige un plan de contenu complet pour cibler en priorité : "${topKeyword}"
   - Titre H1 optimisé pour l'IA Search
   - Structure H2/H3 avec l'intention de recherche B2B
   - 3 sous-angles qui augmentent la probabilité d'être cité dans les LLMs
   - Une FAQ de 5 questions-réponses denses (format idéal pour les extraits IA)

2. Pour les ${invisibleCount} mots-clés invisibles, propose 1 action concrète par mot-clé pour améliorer la présence de "${brandName}" dans les réponses IA.

Adopte un ton business/B2B professionnel. Réponds directement en français.`;
}

export function AioPromptCopier({ keywords, brandName = 'votre marque', showPreview = false }: AioPromptCopierProps) {
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const prompt = buildPrompt(keywords, brandName);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback textarea method
      const ta = document.createElement('textarea');
      ta.value = prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (keywords.length === 0) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(99,102,241,.08), rgba(139,92,246,.06))',
      border: '1px solid rgba(99,102,241,.25)',
      borderRadius: 14,
      padding: '16px 18px',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        {/* Left */}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
            <Sparkles size={14} color="#A5B4FC" style={{ flexShrink: 0 }} />
            <h4 style={{ color: '#E0E7FF', fontSize: '.85rem', fontWeight: 700, margin: 0 }}>
              Prêt pour ChatGPT & Claude
            </h4>
          </div>
          <p style={{ color: '#64748B', fontSize: '.75rem', margin: 0, lineHeight: 1.4 }}>
            Copie un prompt optimisé contenant tes {keywords.length} mots-clés AIO synchronisés.
          </p>
        </div>

        {/* Right — buttons */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {showPreview && (
            <button
              type="button"
              onClick={() => setPreviewOpen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '8px 12px', borderRadius: 9, cursor: 'pointer',
                border: '1px solid rgba(255,255,255,.1)',
                background: 'rgba(255,255,255,.05)',
                color: '#64748B', fontSize: '.75rem', fontWeight: 600,
                transition: 'all .2s',
              }}
            >
              <FileText size={13} />
              {previewOpen ? 'Masquer' : 'Aperçu'}
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 16px', borderRadius: 9, cursor: 'pointer',
              border: `1px solid ${copied ? 'rgba(52,211,153,.5)' : 'rgba(99,102,241,.4)'}`,
              background: copied
                ? 'rgba(16,185,129,.15)'
                : 'linear-gradient(135deg, rgba(99,102,241,.25), rgba(139,92,246,.2))',
              color: copied ? '#34D399' : '#A5B4FC',
              fontSize: '.8rem', fontWeight: 700,
              transition: 'all .2s',
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Prompt copié !' : 'Copier le prompt IA'}
          </button>
        </div>
      </div>

      {/* Preview collapsible */}
      {(showPreview && previewOpen) && (
        <div style={{ marginTop: 14 }}>
          <pre style={{
            background: 'rgba(0,0,0,.35)', borderRadius: 9,
            padding: '12px 14px', margin: 0,
            color: '#94A3B8', fontSize: '.7rem', lineHeight: 1.65,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            maxHeight: 240, overflowY: 'auto',
            border: '1px solid rgba(255,255,255,.06)',
          }}>
            {prompt}
          </pre>
        </div>
      )}
    </div>
  );
}

export default AioPromptCopier;
