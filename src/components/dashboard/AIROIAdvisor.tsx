/**
 * AIROIAdvisor
 *
 * Two-panel component:
 * - Left: Rotating static action cards (quick wins) — day-of-week rotation
 * - Right: AI-streamed financial micro-advice based on current date + context
 *
 * The streaming advice panel generates a concise, actionable tip on-demand.
 */

import { useState, useRef } from 'react';
import { Link } from '@tanstack/react-router';
import { TrendingDown, Star, Calendar, DollarSign, Sparkles, RefreshCw, TrendingUp } from 'lucide-react';
import { blink } from '../../blink/client';
import { useEstablishment } from '../../context/EstablishmentContext';

// ── Static action cards ────────────────────────────────────────────────────────

interface ActionCard {
  id: string;
  emoji: string;
  title: string;
  description: string;
  cta: string;
  ctaHref: string;
  variant: 'warning' | 'success' | 'primary' | 'info';
}

const VARIANT_STYLES: Record<ActionCard['variant'], { border: string; bg: string; ctaClass: string }> = {
  warning: {
    border: 'border-l-amber-400',
    bg: 'bg-amber-50/60 dark:bg-amber-950/10',
    ctaClass: 'text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/20',
  },
  success: {
    border: 'border-l-emerald-400',
    bg: 'bg-emerald-50/60 dark:bg-emerald-950/10',
    ctaClass: 'text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/20',
  },
  primary: {
    border: 'border-l-primary',
    bg: 'bg-primary/5',
    ctaClass: 'text-primary border-primary/30 hover:bg-primary/10',
  },
  info: {
    border: 'border-l-blue-400',
    bg: 'bg-blue-50/60 dark:bg-blue-950/10',
    ctaClass: 'text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/20',
  },
};

const ACTION_CARDS: ActionCard[] = [
  {
    id: 'itinerary',
    emoji: '📍',
    title: "Demandes d'itinéraires en baisse de 12%",
    description: "Lancez une offre Flash WhatsApp 'Heures Creuses' pour réveiller votre zone de chalandise et générer du trafic ce week-end.",
    cta: "Créer l'offre flash →",
    ctaHref: '/cockpit',
    variant: 'warning',
  },
  {
    id: 'reviews',
    emoji: '⭐',
    title: '3 avis 5 étoiles sans réponse',
    description: "Répondre sous 24h augmente votre note Google de +0.3 point en moyenne. Chaque réponse est indexée par ChatGPT et Google.",
    cta: 'Répondre aux avis →',
    ctaHref: '/inbox',
    variant: 'success',
  },
  {
    id: 'post-gap',
    emoji: '📅',
    title: 'Aucune publication depuis 4 jours',
    description: "Vos futurs clients cherchent sur ChatGPT et Google Maps. Un post aujourd'hui peut générer +80 visites supplémentaires cette semaine.",
    cta: 'Créer un post maintenant →',
    ctaHref: '/calendar',
    variant: 'primary',
  },
  {
    id: 'roi',
    emoji: '💰',
    title: 'ROI estimé ce mois : 840 €',
    description: "Basé sur 112 clics de réservation × 15% de conversion × 50€ de panier moyen. Augmentez la fréquence de publication pour doubler.",
    cta: 'Voir les stats détaillées →',
    ctaHref: '/performance',
    variant: 'info',
  },
];

// ── Markdown renderer (minimal) ────────────────────────────────────────────────

function renderLines(text: string) {
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return null;
    if (line.startsWith('## ')) return (
      <p key={i} className="text-xs font-extrabold text-foreground mt-3 mb-1 first:mt-0">
        {line.replace('## ', '')}
      </p>
    );
    if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s\*\*(.*?)\*\*\s*:?\s*(.*)/);
      if (match) return (
        <div key={i} className="flex items-start gap-2 mb-1">
          <span className="w-4 h-4 rounded-full bg-primary/15 text-primary text-[9px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
            {match[1]}
          </span>
          <p className="text-[11px] text-foreground leading-relaxed">
            {match[2] && <strong className="font-bold">{match[2]} </strong>}
            {match[3]}
          </p>
        </div>
      );
      return <p key={i} className="text-[11px] text-foreground/85 leading-relaxed mb-1">{line}</p>;
    }
    if (line.startsWith('- ') || line.startsWith('• ')) {
      const content = line.replace(/^[-•]\s/, '');
      return (
        <div key={i} className="flex items-start gap-1.5 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0 mt-1.5" />
          <p
            className="text-[11px] text-foreground/85 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
          />
        </div>
      );
    }
    return (
      <p
        key={i}
        className="text-[11px] text-foreground/85 leading-relaxed mb-1"
        dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
      />
    );
  });
}

// ── AI Streaming Panel ─────────────────────────────────────────────────────────

function AIFinancialTip() {
  const { activeEstablishment } = useEstablishment();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const now = new Date();
  const month = now.toLocaleDateString('fr-FR', { month: 'long' });
  const dayOfWeek = now.toLocaleDateString('fr-FR', { weekday: 'long' });

  const generate = async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setText('');
    setDone(false);
    setLoading(true);

    const prompt = `Tu es un conseiller financier et marketing expert pour les TPE/PME françaises. 
Établissement : "${activeEstablishment.name}" (secteur : ${activeEstablishment.activity}).
Nous sommes ${dayOfWeek}, en ${month}.

Génère UN conseil financier/ROI ultra-concis et actionnable (max 120 mots) pour maximiser le chiffre d'affaires cette semaine. 
Format attendu :
## 💰 [Titre du conseil en 5 mots max]
[2-3 phrases d'analyse avec données chiffrées]
1. **[Action 1]** : [explication courte]
2. **[Action 2]** : [explication courte]
💡 [Un insight chiffré sur le ROI potentiel]

Sois direct, quantifié et axé résultats business concrets.`;

    try {
      await blink.ai.streamText(
        {
          messages: [{ role: 'user', content: prompt }],
          model: 'gpt-4.1-mini',
          maxTokens: 280,
          signal: abortRef.current.signal,
        },
        (chunk) => setText((prev) => prev + chunk),
      );
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      if (err?.message?.includes('401') || err?.name === 'BlinkAuthError') {
        blink.auth.login(window.location.href);
        return;
      }
      setText('Une erreur est survenue. Cliquez sur "Actualiser" pour réessayer.');
    } finally {
      setLoading(false);
      setDone(true);
    }
  };

  const hasContent = text.length > 0;

  return (
    <div className="flex flex-col gap-3 p-4 border-l border-border bg-gradient-to-br from-primary/5 to-violet-500/5 min-h-[140px]">
      {/* Panel header */}
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shrink-0">
            <TrendingUp size={12} className="text-white" />
          </div>
          <p className="text-xs font-extrabold text-foreground">Conseil ROI du jour</p>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className={`flex items-center gap-1 text-[10px] font-bold rounded-lg px-2.5 py-1 transition-all ${
            hasContent
              ? 'text-muted-foreground border border-border hover:bg-muted hover:text-foreground'
              : 'text-white bg-gradient-to-r from-primary to-violet-500 hover:opacity-90 shadow-sm'
          } disabled:opacity-50`}
        >
          {loading
            ? <><RefreshCw size={10} className="animate-spin" /> Génération…</>
            : hasContent
            ? <><RefreshCw size={10} /> Actualiser</>
            : <><Sparkles size={10} /> Générer</>
          }
        </button>
      </div>

      {/* Content */}
      {!hasContent && !loading && (
        <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center py-2">
          <Sparkles size={18} className="text-primary/30" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Obtenez un conseil ROI personnalisé pour cette semaine
          </p>
          <button
            onClick={generate}
            className="text-[11px] font-bold text-white bg-gradient-to-r from-primary to-violet-500 rounded-lg px-3 py-1.5 hover:opacity-90 shadow-sm"
          >
            <Sparkles size={11} className="inline mr-1" />
            Générer le conseil
          </button>
        </div>
      )}

      {loading && text.length === 0 && (
        <div className="space-y-2 animate-pulse">
          {[80, 60, 90, 50].map((w, i) => (
            <div key={i} className="h-2 bg-muted rounded-full" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}

      {hasContent && (
        <div className="flex-1 text-xs space-y-0.5">
          {renderLines(text)}
          {loading && <span className="inline-block w-1 h-3 bg-primary animate-pulse rounded-sm align-middle ml-0.5" />}
        </div>
      )}

      {done && hasContent && (
        <Link
          to="/performance"
          className="self-start text-[10px] font-bold text-primary/80 hover:text-primary transition-colors"
        >
          Voir toutes les stats →
        </Link>
      )}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export function AIROIAdvisor() {
  const offset = new Date().getDay() % 2;
  const visibleCards = [ACTION_CARDS[offset], ACTION_CARDS[(offset + 1) % ACTION_CARDS.length]];

  return (
    <div className="rounded-2xl border border-border overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-primary/10 via-teal-500/5 to-transparent border-b border-border">
        <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <span className="text-base">💡</span>
        </div>
        <div>
          <p className="text-sm font-extrabold text-foreground leading-tight">L'avis de votre Copilote IA</p>
          <p className="text-[11px] text-muted-foreground">Actions prioritaires + conseil ROI personnalisé</p>
        </div>
      </div>

      {/* Three-panel layout: 2 action cards + 1 AI panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border bg-card">
        {/* Static action cards */}
        {visibleCards.map((card) => {
          const styles = VARIANT_STYLES[card.variant];
          return (
            <div
              key={card.id}
              className={`flex flex-col gap-2.5 p-4 border-l-4 ${styles.border} ${styles.bg}`}
            >
              <div className="flex items-start gap-2">
                <span className="text-xl shrink-0 leading-none mt-0.5">{card.emoji}</span>
                <p className="text-sm font-semibold text-foreground leading-snug">{card.title}</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">{card.description}</p>
              <Link
                to={card.ctaHref as any}
                className={`self-start text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-colors ${styles.ctaClass}`}
              >
                {card.cta}
              </Link>
            </div>
          );
        })}

        {/* AI financial tip panel */}
        <AIFinancialTip />
      </div>
    </div>
  );
}
