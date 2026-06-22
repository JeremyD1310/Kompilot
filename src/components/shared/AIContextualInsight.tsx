/**
 * AIContextualInsight — Reusable AI insight card component.
 * Used across all dashboard tabs for consistent AI recommendation UX.
 * Design: emerald or violet glowing border, spark icon, one-click action.
 */
import { useState } from 'react';
import { Sparkles, Lightbulb, TrendingUp, X, ChevronDown, ChevronUp, Zap, Loader2 } from 'lucide-react';

export type AIInsightVariant = 'emerald' | 'violet' | 'amber' | 'rose';

export interface AIInsightAction {
  label: string;
  onClick: () => void;
  loading?: boolean;
}

interface AIContextualInsightProps {
  title: string;
  insight: string;
  detail?: string;
  variant?: AIInsightVariant;
  icon?: 'sparkles' | 'lightbulb' | 'trending' | 'zap';
  action?: AIInsightAction;
  secondaryAction?: AIInsightAction;
  dismissible?: boolean;
  badge?: string;
  isLoading?: boolean;
  className?: string;
}

const VARIANT_STYLES: Record<AIInsightVariant, {
  border: string; bg: string; glow: string;
  titleColor: string; badgeBg: string; badgeColor: string;
  actionBg: string; actionHover: string;
}> = {
  emerald: {
    border: 'rgba(16,185,129,.35)',
    bg: 'linear-gradient(135deg, rgba(16,185,129,.06) 0%, rgba(13,148,136,.04) 100%)',
    glow: '0 0 0 1px rgba(16,185,129,.2), 0 4px 24px rgba(16,185,129,.10)',
    titleColor: '#10B981',
    badgeBg: 'rgba(16,185,129,.12)',
    badgeColor: '#10B981',
    actionBg: 'rgba(16,185,129,.15)',
    actionHover: 'rgba(16,185,129,.25)',
  },
  violet: {
    border: 'rgba(139,92,246,.35)',
    bg: 'linear-gradient(135deg, rgba(139,92,246,.06) 0%, rgba(99,89,248,.04) 100%)',
    glow: '0 0 0 1px rgba(139,92,246,.2), 0 4px 24px rgba(139,92,246,.10)',
    titleColor: '#8B5CF6',
    badgeBg: 'rgba(139,92,246,.12)',
    badgeColor: '#A78BFA',
    actionBg: 'rgba(139,92,246,.15)',
    actionHover: 'rgba(139,92,246,.25)',
  },
  amber: {
    border: 'rgba(245,158,11,.35)',
    bg: 'linear-gradient(135deg, rgba(245,158,11,.06) 0%, rgba(234,88,12,.04) 100%)',
    glow: '0 0 0 1px rgba(245,158,11,.2), 0 4px 24px rgba(245,158,11,.10)',
    titleColor: '#F59E0B',
    badgeBg: 'rgba(245,158,11,.12)',
    badgeColor: '#FBBF24',
    actionBg: 'rgba(245,158,11,.15)',
    actionHover: 'rgba(245,158,11,.25)',
  },
  rose: {
    border: 'rgba(244,63,94,.35)',
    bg: 'linear-gradient(135deg, rgba(244,63,94,.06) 0%, rgba(239,68,68,.04) 100%)',
    glow: '0 0 0 1px rgba(244,63,94,.2), 0 4px 24px rgba(244,63,94,.10)',
    titleColor: '#F43F5E',
    badgeBg: 'rgba(244,63,94,.12)',
    badgeColor: '#FB7185',
    actionBg: 'rgba(244,63,94,.15)',
    actionHover: 'rgba(244,63,94,.25)',
  },
};

const IconMap = {
  sparkles: Sparkles,
  lightbulb: Lightbulb,
  trending: TrendingUp,
  zap: Zap,
};

export function AIContextualInsight({
  title, insight, detail, variant = 'emerald',
  icon = 'sparkles', action, secondaryAction,
  dismissible = true, badge, isLoading = false,
}: AIContextualInsightProps) {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const styles = VARIANT_STYLES[variant];
  const Icon = IconMap[icon];

  if (dismissed) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        boxShadow: styles.glow,
      }}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          {/* Icon */}
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: styles.badgeBg, border: `1px solid ${styles.border}` }}
          >
            {isLoading
              ? <Loader2 size={15} style={{ color: styles.titleColor }} className="animate-spin" />
              : <Icon size={15} style={{ color: styles.titleColor }} />
            }
          </div>

          {/* Title + badge */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold" style={{ color: styles.titleColor }}>
                {title}
              </span>
              {badge && (
                <span
                  className="text-[10px] font-black rounded-full px-2 py-0.5 uppercase tracking-wider"
                  style={{ background: styles.badgeBg, color: styles.badgeColor, border: `1px solid ${styles.border}` }}
                >
                  {badge}
                </span>
              )}
            </div>
          </div>

          {/* Dismiss */}
          {dismissible && (
            <button
              onClick={() => setDismissed(true)}
              className="w-5 h-5 rounded-full flex items-center justify-center opacity-40 hover:opacity-80 transition-opacity shrink-0"
              style={{ color: styles.titleColor }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Insight text */}
        {isLoading ? (
          <div className="space-y-3 pl-11 mb-3">
            <div className="nc-skeleton h-4 w-2/3 rounded-lg" />
            <div className="nc-skeleton h-3 w-full rounded-lg" />
            <div className="nc-skeleton h-3 w-4/5 rounded-lg" />
            <div className="nc-skeleton h-10 rounded-xl mt-2" />
          </div>
        ) : (
          <p className="text-sm text-foreground/80 leading-relaxed mb-3 pl-11">
            {insight}
          </p>
        )}

        {/* Detail (expandable) */}
        {detail && !isLoading && (
          <div className="pl-11 mb-3">
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 text-xs font-semibold opacity-60 hover:opacity-90 transition-opacity"
              style={{ color: styles.titleColor }}
            >
              {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              {expanded ? 'Masquer les détails' : 'Voir les détails'}
            </button>
            {expanded && (
              <p className="text-xs text-muted-foreground leading-relaxed mt-2 p-3 rounded-xl bg-black/10">
                {detail}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        {(action || secondaryAction) && !isLoading && (
          <div className="pl-11 flex items-center gap-2 flex-wrap">
            {action && (
              <button
                onClick={action.onClick}
                disabled={action.loading}
                className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 disabled:opacity-60"
                style={{
                  background: styles.actionBg,
                  color: styles.titleColor,
                  border: `1px solid ${styles.border}`,
                }}
              >
                {action.loading
                  ? <Loader2 size={11} className="animate-spin" />
                  : <Zap size={11} />
                }
                {action.loading ? 'En cours…' : action.label}
              </button>
            )}
            {secondaryAction && (
              <button
                onClick={secondaryAction.onClick}
                disabled={secondaryAction.loading}
                className="text-xs font-medium opacity-60 hover:opacity-90 transition-opacity"
                style={{ color: styles.titleColor }}
              >
                {secondaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
