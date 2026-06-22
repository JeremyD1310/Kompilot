/**
 * FunnelNode — A single step in the visual funnel map.
 * Supports 5 types: ad_source, opt_in, vsl, checkout, email_sequence
 * New: ad longevity filter on ad_source nodes.
 */
import { cn } from '@blinkdotnew/ui';
import {
  MousePointerClick,
  Globe,
  Play,
  ShoppingCart,
  Mail,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  Clock,
  Filter,
} from 'lucide-react';
import type { AdCreative } from './funnelMockData';

export type FunnelNodeType = 'ad_source' | 'opt_in' | 'vsl' | 'checkout' | 'email_sequence';

export interface FunnelNodeData {
  id: string;
  funnel_id: string;
  type: FunnelNodeType;
  title: string;
  url?: string;
  metadata: {
    thumbnails?: string[];
    conversionRate?: number;
    price?: number;
    tier?: 'high_ticket' | 'low_ticket' | 'mid_ticket';
    emailCount?: number;
    platform?: string;
    adsCount?: number;
    spend?: number;
  };
  position_order: number;
}

const NODE_CONFIG: Record<FunnelNodeType, {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}> = {
  ad_source: {
    icon: MousePointerClick,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    borderColor: 'border-orange-200 dark:border-orange-800/60',
    label: 'Sources de Trafic',
  },
  opt_in: {
    icon: Globe,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 dark:bg-teal-950/20',
    borderColor: 'border-teal-200 dark:border-teal-800/60',
    label: 'Opt-in / Landing Page',
  },
  vsl: {
    icon: Play,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    borderColor: 'border-purple-200 dark:border-purple-800/60',
    label: 'VSL — Vidéo de Vente',
  },
  checkout: {
    icon: ShoppingCart,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-200 dark:border-green-800/60',
    label: 'Checkout / Offre',
  },
  email_sequence: {
    icon: Mail,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800/60',
    label: 'Séquence Email',
  },
};

const TIER_BADGE: Record<string, { label: string; className: string }> = {
  high_ticket: { label: 'High-Ticket', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  mid_ticket: { label: 'Mid-Ticket', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  low_ticket: { label: 'Low-Ticket', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
};

interface FunnelNodeProps {
  node: FunnelNodeData;
  isSelected?: boolean;
  onClick?: () => void;
  isEmailSide?: boolean;
  /** Ad creatives for ad_source nodes */
  ads?: AdCreative[];
  /** When true, only show ads with daysActive >= 21 */
  profitableAdsOnly?: boolean;
}

export function FunnelNode({ node, isSelected, onClick, isEmailSide = false, ads = [], profitableAdsOnly = false }: FunnelNodeProps) {
  const config = NODE_CONFIG[node.type];
  const Icon = config.icon;

  // Filter ads by longevity if needed
  const filteredAds = profitableAdsOnly ? ads.filter(a => a.daysActive >= 21) : ads;
  const displayAds = filteredAds.slice(0, 3);
  const hiddenCount = filteredAds.length - displayAds.length;
  const totalFiltered = ads.length - filteredAds.length;

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-2xl border-2 bg-card transition-all duration-200 cursor-pointer group',
        isEmailSide ? 'w-[200px]' : 'w-[220px]',
        config.borderColor,
        isSelected
          ? 'shadow-lg shadow-primary/20 border-primary scale-[1.02]'
          : 'hover:shadow-md hover:scale-[1.01]',
      )}
    >
      {/* Header */}
      <div className={cn('flex items-center gap-2.5 px-4 pt-3 pb-2 rounded-t-2xl', config.bgColor)}>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', config.bgColor, 'border', config.borderColor)}>
          <Icon size={16} className={config.color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-[10px] font-bold uppercase tracking-wider', config.color)}>{config.label}</p>
          <p className="text-xs font-semibold text-foreground truncate">{node.title}</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">

        {/* ── Ad Source: thumbnails grid + longevity filter ── */}
        {node.type === 'ad_source' && (
          <div>
            {/* Longevity filter badge */}
            {profitableAdsOnly && (
              <div className="flex items-center gap-1.5 mb-2 px-2 py-1 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40">
                <Filter size={10} className="text-green-600 shrink-0" />
                <span className="text-[10px] font-bold text-green-700 dark:text-green-400">
                  Pub 21+ jours seulement
                </span>
                {totalFiltered > 0 && (
                  <span className="ml-auto text-[9px] text-muted-foreground">{totalFiltered} masquées</span>
                )}
              </div>
            )}

            {/* Ad list preview */}
            {displayAds.length > 0 ? (
              <div className="space-y-1.5 mb-2">
                {displayAds.map((ad) => (
                  <div key={ad.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-muted/40 border border-border/40">
                    <div className="w-7 h-7 rounded-md bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 flex items-center justify-center shrink-0">
                      <MousePointerClick size={10} className="text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-medium text-foreground leading-tight line-clamp-1">{ad.hook}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock size={8} className={cn('shrink-0', ad.daysActive >= 21 ? 'text-green-500' : 'text-amber-500')} />
                        <span className={cn('text-[8px] font-bold', ad.daysActive >= 21 ? 'text-green-600' : 'text-amber-600')}>
                          {ad.daysActive}j
                        </span>
                        <span className="text-[8px] text-muted-foreground capitalize ml-0.5">· {ad.format}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {hiddenCount > 0 && (
                  <p className="text-[9px] text-muted-foreground text-center">+{hiddenCount} autres…</p>
                )}
              </div>
            ) : (
              // Fallback: thumbnail grid if no ad creatives
              <div className="grid grid-cols-3 gap-1 mb-2">
                {(node.metadata.thumbnails ?? ['', '', '']).slice(0, 3).map((src, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 flex items-center justify-center overflow-hidden"
                  >
                    {src ? (
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <MousePointerClick size={12} className="text-orange-400" />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{profitableAdsOnly ? filteredAds.length : (node.metadata.adsCount ?? 0)} annonces {profitableAdsOnly ? 'prouvées' : 'actives'}</span>
              {node.metadata.spend !== undefined && (
                <span className="font-semibold text-orange-600">~{node.metadata.spend.toLocaleString('fr')}€/mois</span>
              )}
            </div>
          </div>
        )}

        {/* ── Opt-in: URL + conversion ── */}
        {node.type === 'opt_in' && (
          <div className="space-y-1.5">
            {node.url && (
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Globe size={10} className="shrink-0" />
                <span className="truncate font-mono">{node.url.replace('https://', '').replace('http://', '')}</span>
              </div>
            )}
            {node.metadata.conversionRate !== undefined && (
              <div className="flex items-center gap-2">
                <TrendingUp size={11} className="text-teal-500 shrink-0" />
                <span className="text-[11px] font-semibold text-foreground">
                  Conv. estimée : <span className="text-teal-600">{node.metadata.conversionRate}%</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── VSL: video placeholder ── */}
        {node.type === 'vsl' && (
          <div className="relative rounded-xl bg-slate-900 aspect-video flex items-center justify-center overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Play size={18} className="text-white fill-white ml-0.5" />
            </div>
            <div className="absolute bottom-1.5 right-2 text-[9px] text-white/70 font-mono">VSL</div>
          </div>
        )}

        {/* ── Checkout: price + tier ── */}
        {node.type === 'checkout' && (
          <div className="space-y-1.5">
            {node.metadata.price !== undefined && (
              <div className="text-lg font-black text-foreground">
                {node.metadata.price.toLocaleString('fr')}€
              </div>
            )}
            {node.metadata.tier && TIER_BADGE[node.metadata.tier] && (
              <span className={cn('inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full', TIER_BADGE[node.metadata.tier].className)}>
                {TIER_BADGE[node.metadata.tier].label}
              </span>
            )}
            {node.url && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <ShoppingCart size={10} />
                <span className="truncate font-mono">{node.url.replace('https://', '').replace('http://', '')}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Email sequence: stack icon + count ── */}
        {node.type === 'email_sequence' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative w-8">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    style={{ top: `${i * 3}px`, left: `${i * 2}px` }}
                    className="absolute w-8 h-6 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30"
                  />
                ))}
              </div>
              <div className="ml-8">
                <p className="text-sm font-bold text-foreground">
                  {node.metadata.emailCount ?? '?'} emails
                </p>
                <p className="text-[10px] text-muted-foreground">séquence automatique</p>
              </div>
            </div>
            <button
              onClick={e => e.stopPropagation()}
              className="w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold text-blue-600 border border-blue-200 dark:border-blue-800 rounded-lg py-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
            >
              <Mail size={11} /> Voir les swipes email
            </button>
          </div>
        )}
      </div>

      {/* URL link */}
      {node.url && node.type !== 'ad_source' && node.type !== 'email_sequence' && (
        <div className="px-4 pb-3">
          <a
            href={node.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className={cn('flex items-center gap-1 text-[10px] font-medium hover:underline', config.color)}
          >
            <ExternalLink size={10} /> Voir la page
          </a>
        </div>
      )}

      {/* Right arrow connector */}
      {!isEmailSide && (
        <div className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 text-primary">
          <ChevronRight size={16} className="text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}