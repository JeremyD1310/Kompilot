/**
 * AISwipesModal — Generates AI-rewritten ad hooks via the backend.
 *
 * Calls POST /api/funnels/generate-swipes which uses:
 *  - gpt-4.1 (stronger model)
 *  - Elite copywriter system prompt with JSON schema output
 *  - Returns: { analysis, variations: [{ title, hook, body, cta }] }
 *
 * Falls back to blink.ai.generateText() if the backend call fails.
 */
import { useState } from 'react';
import { cn } from '@blinkdotnew/ui';
import {
  X, Sparkles, Copy, Check, RefreshCw, Zap, ChevronRight,
  MessageSquare, TrendingUp, Target, Flame, BookOpen,
} from 'lucide-react';
import { blink } from '../../blink/client';
import { apiFetch } from '../../config/api';
import type { FunnelData } from './types';
import type { AdCreative } from './funnelMockData';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SwipeVariation {
  title: string;
  hook: string;
  body: string;
  cta: string;
}

interface GenerateSwipesResponse {
  analysis: string;
  variations: SwipeVariation[];
}

interface GeneratedSwipe {
  id: string;
  title: string;
  hook: string;
  body: string;
  cta: string;
  angle: string;
  copied?: 'hook' | 'full';
}

// ── Constants ─────────────────────────────────────────────────────────────────

const HOOK_ANGLES = [
  { key: 'curiosity',    label: 'Curiosité',      icon: '🎣' },
  { key: 'pain',        label: 'Douleur',         icon: '🎯' },
  { key: 'social_proof', label: 'Preuve sociale', icon: '🏆' },
  { key: 'result',      label: 'Résultat',        icon: '🚀' },
];

const FORMAT_LABEL: Record<string, string> = {
  video: '📹 Vidéo', image: '🖼️ Image', carousel: '🎠 Carousel',
};

// ── Fallback prompt (used when backend is unreachable) ───────────────────────
function buildFallbackPrompt(funnel: FunnelData, sourceAds: AdCreative[], angle: string): string {
  const adHooks = sourceAds.length > 0
    ? sourceAds.map(a => `- "${a.hook}" (${a.daysActive}j, ${a.format})`).join('\n')
    : '(aucune publicité source)';

  const ANGLE_LABELS: Record<string, string> = {
    curiosity: 'Curiosité — susciter une question irrésistible',
    pain: 'Douleur — toucher le problème profond',
    social_proof: 'Preuve sociale — résultats réels',
    result: 'Résultat — montrer la transformation finale',
  };

  return `Tu es un copywriter expert. Analyse ces hooks concurrents de ${funnel.creator_name} et génère 3 hooks NOUVEAUX en français, numérotés 1), 2), 3).

Hooks source:
${adHooks}

Angle: ${ANGLE_LABELS[angle] ?? ANGLE_LABELS.result}
Plateforme: ${funnel.platform}

Réponds UNIQUEMENT avec les 3 hooks numérotés.`;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface AISwipesModalProps {
  funnel: FunnelData;
  sourceAds?: AdCreative[];
  onClose: () => void;
}

export function AISwipesModal({ funnel, sourceAds = [], onClose }: AISwipesModalProps) {
  const [selectedAngle, setSelectedAngle] = useState('result');
  const [businessDescription, setBusinessDescription] = useState('');
  const [analysis, setAnalysis]   = useState('');
  const [swipes, setSwipes]       = useState<GeneratedSwipe[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [copied, setCopied]       = useState<string | null>(null);

  // ── Generate via backend (primary) with SDK fallback ──────────────────────
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    // NOTE: we intentionally do NOT clear swipes/analysis here so the user
    // can keep reading the previous results while the new generation runs.

    // Build the competitor ad text from source ads
    const competitorAdText = sourceAds.length > 0
      ? sourceAds.slice(0, 5).map(a => `"${a.hook}" (${a.daysActive}j actif, ${a.format})`).join('\n')
      : `Tunnel de ${funnel.creator_name} sur ${funnel.domain_url}`;

    const userBusinessDescription = businessDescription.trim() ||
      `Business similaire à ${funnel.creator_name} — même marché, offre différente`;

    try {
      // 1. Try backend endpoint (gpt-4.1 + elite system prompt)
      const token = await blink.auth.getValidToken().catch(() => null);

      if (token) {
        try {
          const res = await apiFetch<GenerateSwipesResponse>(
            '/api/funnels/generate-swipes',
            {
              method: 'POST',
              token,
              timeoutMs: 20_000,   // AI generation can take up to 15-20 s
              body: JSON.stringify({ competitorAdText, userBusinessDescription }),
            },
          );

          setAnalysis(res.analysis ?? '');
          setSwipes(
            (res.variations ?? []).slice(0, 3).map((v, i) => ({
              id: `swipe-${Date.now()}-${i}`,
              title: v.title,
              hook: v.hook,
              body: v.body,
              cta: v.cta,
              angle: selectedAngle,
            }))
          );
          // Mark checklist: generated first AI swipe
          try {
            const uid = localStorage.getItem('blink_user_id') ?? '';
            if (uid) localStorage.setItem(`checklist_generated_swipe_${uid}`, '1');
          } catch { /* noop */ }
          return; // success — skip fallback
        } catch {
          // Backend unavailable → fallback below
        }
      }

      // 2. Fallback: blink.ai.generateText (simpler prompt, gpt-4.1-mini)
      const { text } = await blink.ai.generateText({
        prompt: buildFallbackPrompt(funnel, sourceAds, selectedAngle),
        model: 'gpt-4.1-mini',
        maxTokens: 400,
      });

      const lines = text
        .split('\n')
        .map(l => l.trim())
        .filter(l => /^[123][.)]\s/.test(l) || l.length > 25);

      setSwipes(
        lines.slice(0, 3).map((line, i) => ({
          id: `swipe-${Date.now()}-${i}`,
          title: `Variation ${i + 1}`,
          hook: line.replace(/^[123][.)]\s*/, '').trim(),
          body: '',
          cta: '',
          angle: selectedAngle,
        }))
      );
    } catch {
      setError('Erreur lors de la génération. Vérifiez votre connexion et réessayez.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (swipe: GeneratedSwipe, field: 'hook' | 'full') => {
    const text = field === 'hook'
      ? swipe.hook
      : [swipe.hook, swipe.body, swipe.cta ? `👉 ${swipe.cta}` : ''].filter(Boolean).join('\n\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(`${swipe.id}-${field}`);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const profitableAdsCount = sourceAds.filter(a => a.daysActive >= 21).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles size={17} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">AI Swipes Generator</h2>
              <p className="text-[11px] text-muted-foreground">
                Hooks inspirés de {funnel.creator_name}
                {profitableAdsCount > 0 && (
                  <span className="ml-1 text-green-600 font-semibold">· {profitableAdsCount} pubs 21j+ analysées</span>
                )}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">

          {/* Source ads preview */}
          {sourceAds.length > 0 && (
            <div className="px-6 pt-4 pb-2">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                📌 Hooks source ({profitableAdsCount} rentables / {sourceAds.length})
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {sourceAds.slice(0, 5).map(ad => (
                  <div
                    key={ad.id}
                    className={cn(
                      'shrink-0 max-w-[180px] rounded-xl border px-2.5 py-2',
                      ad.daysActive >= 21
                        ? 'border-green-200 dark:border-green-800/60 bg-green-50 dark:bg-green-950/20'
                        : 'border-border bg-muted/40 opacity-60'
                    )}
                  >
                    <p className="text-[9px] line-clamp-2 font-medium text-foreground leading-tight">{ad.hook}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Flame size={8} className={ad.daysActive >= 21 ? 'text-green-500' : 'text-muted-foreground'} />
                      <span className={cn('text-[8px] font-bold', ad.daysActive >= 21 ? 'text-green-600' : 'text-muted-foreground')}>
                        {ad.daysActive}j · {FORMAT_LABEL[ad.format] ?? ad.format}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Your business description (optional) */}
          <div className="px-6 pt-3 pb-2">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Votre offre / business (optionnel)
            </label>
            <textarea
              value={businessDescription}
              onChange={e => setBusinessDescription(e.target.value)}
              placeholder="Ex: coaching en ligne pour entrepreneurs B2B, offre à 2 000€…"
              rows={2}
              className="w-full text-xs bg-muted/40 border border-border rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-colors placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Angle selector */}
          <div className="px-6 pt-1 pb-3">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Angle créatif</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {HOOK_ANGLES.map(angle => (
                <button
                  key={angle.key}
                  onClick={() => setSelectedAngle(angle.key)}
                  className={cn(
                    'flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border text-center transition-all',
                    selectedAngle === angle.key
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
                  )}
                >
                  <span className="text-lg leading-none">{angle.icon}</span>
                  <span className={cn('text-[11px] font-semibold', selectedAngle === angle.key ? 'text-primary' : 'text-foreground')}>
                    {angle.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <div className="px-6 pb-4">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {isGenerating
                ? <><RefreshCw size={15} className="animate-spin" /> Génération en cours…</>
                : <><Zap size={15} /> {swipes.length > 0 ? 'Régénérer' : 'Générer mes AI Swipes'} <ChevronRight size={14} /></>}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mx-6 mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/60 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Analysis insight */}
          {analysis && (
            <div className="mx-6 mb-4 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={12} className="text-primary" />
                <p className="text-[11px] font-bold text-primary uppercase tracking-wider">Analyse de l'angle concurrent</p>
              </div>
              <p className="text-xs text-foreground leading-relaxed">{analysis}</p>
            </div>
          )}

          {/* Generated swipes */}
          {swipes.length > 0 && (
            <div className="px-6 pb-6 space-y-3">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Target size={11} /> {swipes.length} variations générées — angle {HOOK_ANGLES.find(a => a.key === selectedAngle)?.label}
              </p>
              {swipes.map((swipe, i) => (
                <div key={swipe.id} className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-black text-primary shrink-0">{i + 1}</span>
                      <p className="text-[11px] font-bold text-muted-foreground">{swipe.title}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleCopy(swipe, 'hook')}
                        className={cn('w-7 h-7 rounded-lg flex items-center justify-center transition-all text-[10px]', copied === `${swipe.id}-hook` ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'text-muted-foreground hover:bg-muted')}
                        title="Copier le hook"
                      >
                        {copied === `${swipe.id}-hook` ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                      {swipe.body && (
                        <button
                          onClick={() => handleCopy(swipe, 'full')}
                          className={cn('w-7 h-7 rounded-lg flex items-center justify-center transition-all', copied === `${swipe.id}-full` ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'text-muted-foreground hover:bg-muted')}
                          title="Copier tout (hook + corps + CTA)"
                        >
                          {copied === `${swipe.id}-full` ? <Check size={12} /> : <BookOpen size={12} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Hook */}
                  <p className="text-sm font-bold text-foreground leading-snug">{swipe.hook}</p>

                  {/* Body */}
                  {swipe.body && (
                    <p className="text-xs text-muted-foreground leading-relaxed mt-2 whitespace-pre-line">{swipe.body}</p>
                  )}

                  {/* CTA */}
                  {swipe.cta && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-bold">
                      👉 {swipe.cta}
                    </div>
                  )}
                </div>
              ))}

              <p className="text-[10px] text-muted-foreground text-center pt-1">
                <MessageSquare size={9} className="inline mr-1" />
                Contenu généré par IA — adaptez-le à votre marché.
              </p>
            </div>
          )}

          {/* Empty state */}
          {!isGenerating && swipes.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center px-8">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles size={20} className="text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">Prêt à générer vos swipes</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                L'IA va analyser les hooks de {funnel.creator_name} et créer 3 variations avec hook, corps et CTA pour votre business.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
