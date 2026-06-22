/**
 * CitationSupplyChain — Widget showing which platforms AI uses as citation sources.
 * Helps users understand where to strengthen their presence to appear in AI responses.
 */
import { Badge, Button } from '@blinkdotnew/ui';
import { ExternalLink, TrendingUp } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type PresenceStatus = 'present' | 'absent' | 'incomplete';

interface Platform {
  name: string;
  emoji: string;
  aiScore: number;       // % importance for AI citations
  status: PresenceStatus;
  url: string;
}

// ── Data ──────────────────────────────────────────────────────────────────────

const PLATFORMS: Platform[] = [
  { name: 'Google Business Profile', emoji: '🗺️', aiScore: 94, status: 'present',    url: 'https://business.google.com' },
  { name: 'Pages Jaunes',            emoji: '📒', aiScore: 82, status: 'absent',     url: 'https://www.pagesjaunes.fr' },
  { name: 'TripAdvisor',             emoji: '🦉', aiScore: 78, status: 'incomplete', url: 'https://www.tripadvisor.fr' },
  { name: 'Yelp',                    emoji: '⭐', aiScore: 71, status: 'absent',     url: 'https://www.yelp.fr' },
  { name: 'Facebook Business',       emoji: '📘', aiScore: 67, status: 'present',    url: 'https://www.facebook.com/business' },
  { name: 'LinkedIn',                emoji: '💼', aiScore: 58, status: 'absent',     url: 'https://www.linkedin.com' },
  { name: 'Trustpilot',              emoji: '🌟', aiScore: 51, status: 'absent',     url: 'https://fr.trustpilot.com' },
  { name: 'Foursquare',              emoji: '📍', aiScore: 43, status: 'absent',     url: 'https://foursquare.com' },
];

const GLOBAL_CITATION_SCORE = 28;

// ── Status badge config ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PresenceStatus, { label: string; className: string }> = {
  present:    { label: '✅ Présent',    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  incomplete: { label: '⚠️ Incomplet',  className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  absent:     { label: '🔴 Absent',     className: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function ScoreBar({ value }: { value: number }) {
  const color = value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-amber-500' : 'bg-red-500/70';
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1.5 rounded-full bg-muted/60 overflow-hidden min-w-[60px]">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[11px] font-mono font-bold text-muted-foreground w-8 shrink-0 text-right">{value}%</span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function CitationSupplyChain() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Teal accent top stripe */}
      <div className="h-0.5 w-full bg-gradient-to-r from-primary to-teal-400" />

      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border/60">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
              🔗 Citation Supply Chain — Sources IA
            </h3>
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed max-w-lg">
              Ces plateformes sont les plus citées par ChatGPT et Perplexity pour votre secteur.
              Renforcez votre présence sur chacune pour augmenter votre score de visibilité IA.
            </p>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full text-[10px] shrink-0 gap-1">
            <TrendingUp size={10} /> Sources vérifiées
          </Badge>
        </div>

        {/* Global citation score */}
        <div className="mt-4 p-3.5 rounded-xl bg-muted/30 border border-border/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-foreground">Score de citation IA global</span>
            <span className="text-lg font-extrabold text-primary">{GLOBAL_CITATION_SCORE}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-1000"
              style={{ width: `${GLOBAL_CITATION_SCORE}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            Seulement {GLOBAL_CITATION_SCORE}% de couverture — 72% des plateformes clés manquantes
          </p>
        </div>
      </div>

      {/* Platform list */}
      <div className="divide-y divide-border/40">
        {PLATFORMS.map((platform, index) => {
          const statusCfg = STATUS_CONFIG[platform.status];
          return (
            <div
              key={platform.name}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/20 transition-colors"
            >
              {/* Rank */}
              <span className="text-[10px] font-mono text-muted-foreground/50 w-4 shrink-0 text-right">
                {index + 1}
              </span>

              {/* Emoji + name */}
              <div className="flex items-center gap-2.5 w-40 shrink-0 min-w-0">
                <span className="text-base leading-none shrink-0">{platform.emoji}</span>
                <span className="text-xs font-semibold text-foreground truncate">{platform.name}</span>
              </div>

              {/* AI importance bar */}
              <div className="flex-1 min-w-0 hidden sm:block">
                <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wide mb-1">Importance IA</p>
                <ScoreBar value={platform.aiScore} />
              </div>

              {/* Status badge */}
              <div className="shrink-0">
                <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusCfg.className}`}>
                  {statusCfg.label}
                </span>
              </div>

              {/* Action link */}
              <a
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/80 transition-colors"
              >
                Renforcer <ExternalLink size={10} />
              </a>
            </div>
          );
        })}
      </div>

      {/* Footer CTA */}
      <div className="px-5 py-4 border-t border-border/60 bg-muted/10">
        <Button size="sm" className="gap-2 w-full sm:w-auto text-xs">
          🚀 Optimiser toutes mes citations en 1 clic
        </Button>
        <p className="text-[10px] text-muted-foreground mt-2">
          L'IA génèrera les fiches manquantes et complétera les profils incomplets automatiquement.
        </p>
      </div>
    </div>
  );
}
