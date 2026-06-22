/**
 * FunnelTopBar — Search bar, platform selector, analyze button, profitable-ads toggle.
 * Extracted from TunnelsPage to keep it under 300 LOC.
 */
import { cn } from '@blinkdotnew/ui';
import { Search, Filter, Loader2, GitFork, ChevronDown, ToggleLeft, ToggleRight, Clock } from 'lucide-react';

type Platform = 'meta' | 'google' | 'linkedin';

const PLATFORMS: Array<{ value: Platform; label: string; emoji: string }> = [
  { value: 'meta',     label: 'Meta Ads',     emoji: '📘' },
  { value: 'google',   label: 'Google Ads',   emoji: '🔍' },
  { value: 'linkedin', label: 'LinkedIn Ads', emoji: '💼' },
];

interface FunnelTopBarProps {
  query: string;
  platform: Platform;
  isAnalyzing: boolean;
  hasFunnel: boolean;
  profitableAdsOnly: boolean;
  profitableAdsCount: number;
  totalAdsCount: number;
  showPlatformDropdown: boolean;
  recentSearches: string[];
  onQueryChange: (v: string) => void;
  onPlatformChange: (v: Platform) => void;
  onAnalyze: () => void;
  onToggleProfitable: () => void;
  onTogglePlatformDropdown: (v: boolean) => void;
  onRecentSearch: (s: string) => void;
}

export function FunnelTopBar({
  query, platform, isAnalyzing, hasFunnel, profitableAdsOnly,
  profitableAdsCount, totalAdsCount, showPlatformDropdown, recentSearches,
  onQueryChange, onPlatformChange, onAnalyze, onToggleProfitable,
  onTogglePlatformDropdown, onRecentSearch,
}: FunnelTopBarProps) {
  const activePlatform = PLATFORMS.find(p => p.value === platform)!;

  return (
    <div className="shrink-0 border-b border-border bg-card px-5 py-3.5">
      <div className="flex items-center gap-3 flex-wrap">

        {/* Page title */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <GitFork size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground leading-tight">Tunnels</h1>
            <p className="text-[10px] text-muted-foreground leading-tight">Cartographie concurrentielle</p>
          </div>
        </div>

        <div className="w-px h-7 bg-border shrink-0 hidden sm:block" />

        {/* Search + platform + CTA */}
        <div className="flex-1 min-w-[240px] flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={e => onQueryChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onAnalyze()}
              placeholder="Analyser un créateur ou une URL… (ex: Alex Hormozi)"
              className="w-full pl-9 pr-4 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-colors placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Platform dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => onTogglePlatformDropdown(!showPlatformDropdown)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <span>{activePlatform.emoji}</span>
              <span className="hidden sm:inline">{activePlatform.label}</span>
              <ChevronDown size={13} className="text-muted-foreground" />
            </button>
            {showPlatformDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => onTogglePlatformDropdown(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-card border border-border rounded-xl shadow-lg overflow-hidden min-w-[140px]">
                  {PLATFORMS.map(p => (
                    <button
                      key={p.value}
                      onClick={() => { onPlatformChange(p.value); onTogglePlatformDropdown(false); }}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left',
                        platform === p.value ? 'text-primary font-semibold bg-primary/5' : 'text-foreground'
                      )}
                    >
                      <span>{p.emoji}</span> {p.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Analyze CTA */}
          <button
            onClick={onAnalyze}
            disabled={!query.trim() || isAnalyzing}
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isAnalyzing
              ? <><Loader2 size={14} className="animate-spin" /> Analyse…</>
              : <><Filter size={14} /> Analyser</>}
          </button>
        </div>

        {/* Profitable ads toggle */}
        {hasFunnel && (
          <button
            onClick={onToggleProfitable}
            className={cn(
              'shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all',
              profitableAdsOnly
                ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400'
                : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
            title="Afficher uniquement les publicités actives depuis 21+ jours"
          >
            {profitableAdsOnly ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            <span className="hidden sm:inline text-[12px]">
              Pubs rentables {profitableAdsOnly && totalAdsCount > 0 && (
                <span className="font-bold text-green-600">({profitableAdsCount}/{totalAdsCount})</span>
              )}
            </span>
            <span className="sm:hidden text-[11px]">21j+</span>
          </button>
        )}
      </div>

      {/* Recent searches */}
      {recentSearches.length > 0 && !hasFunnel && (
        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
            <Clock size={9} /> Récents :
          </span>
          {recentSearches.slice(0, 4).map(s => (
            <button
              key={s}
              onClick={() => onRecentSearch(s)}
              className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors border border-border/60"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
