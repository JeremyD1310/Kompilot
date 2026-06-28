/**
 * GapOpportunityCard — Premium dark card for each SEO gap opportunity.
 * Shows topic, keywords, difficulty, volume, competitor position, and CTA.
 */
import { motion } from 'framer-motion';
import { Target, Search, BarChart3, Globe, Sparkles, ArrowRight, Zap, Database } from 'lucide-react';
import { Button } from '@blinkdotnew/ui';
import type { GapOpportunity } from '../../hooks/useSeoGapAnalysis';

interface GapOpportunityCardProps {
  opportunity: GapOpportunity;
  index: number;
  onGenerate: (topic: string, keywords: string[]) => void;
  dataSource?: 'dataforseo' | 'serp_api' | 'ai_estimated';
}

const DATA_SOURCE_BADGES: Record<string, { label: string; bg: string; text: string; border: string; icon: typeof Database }> = {
  dataforseo: { label: 'Données réelles', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: Database },
  serp_api: { label: 'Données SERP', bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20', icon: Search },
  ai_estimated: { label: 'Estimation IA', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: Sparkles },
};

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  low: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', bar: 'bg-emerald-500' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', bar: 'bg-amber-500' },
  high: { bg: 'bg-rose-500/10', text: 'text-rose-400', bar: 'bg-rose-500' },
};

function getDifficultyLevel(d: number) {
  if (d < 30) return 'low';
  if (d < 45) return 'medium';
  return 'high';
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  blog_post: 'Article de blog',
  faq: 'FAQ',
  guide: 'Guide complet',
  comparison: 'Comparatif',
};

export function GapOpportunityCard({ opportunity, index, onGenerate, dataSource }: GapOpportunityCardProps) {
  const diffLevel = getDifficultyLevel(opportunity.difficulty);
  const colors = DIFFICULTY_COLORS[diffLevel];
  const sourceBadge = dataSource ? DATA_SOURCE_BADGES[dataSource] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-2xl border border-border bg-card overflow-hidden group hover:border-primary/30 transition-all duration-300"
    >
      {/* Accent bar */}
      <div
        className="absolute top-0 left-0 w-1 h-full rounded-l-2xl"
        style={{
          background: `linear-gradient(to bottom, ${
            opportunity.opportunityScore >= 70 ? '#10b981' :
            opportunity.opportunityScore >= 50 ? '#f59e0b' : '#ef4444'
          }, transparent)`,
        }}
      />

      <div className="p-5 pl-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                Opportunité #{index + 1}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                Difficulté {opportunity.difficulty}/100
              </span>
            </div>
            <h3 className="text-base font-bold text-foreground leading-tight">
              {opportunity.topic}
            </h3>
          </div>
          <div className="shrink-0 flex flex-col items-center gap-1 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl px-3 py-2 border border-primary/20">
            <span className="text-xl font-black text-primary leading-none">
              {opportunity.opportunityScore}
            </span>
            <span className="text-[9px] font-bold text-primary/70 uppercase">Score</span>
          </div>
        </div>

        {/* Data source badge */}
        {sourceBadge && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.12 + 0.15 }}
          >
            {(() => {
              const Icon = sourceBadge.icon;
              return (
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${sourceBadge.bg} ${sourceBadge.text} ${sourceBadge.border}`}>
                  <Icon size={11} />
                  {sourceBadge.label}
                </span>
              );
            })()}
          </motion.div>
        )}

        {/* Suggested angle */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          {opportunity.suggestedAngle}
        </p>

        {/* Keywords */}
        <div className="flex flex-wrap gap-1.5">
          {opportunity.keywords.map((kw, i) => (
            <span
              key={i}
              className="text-[10px] font-semibold bg-muted/60 text-foreground/80 rounded-full px-2.5 py-1 border border-border"
            >
              {kw}
            </span>
          ))}
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
            <Search size={13} className="text-muted-foreground/60" />
            <div>
              <p className="text-[10px] text-muted-foreground/60 uppercase">Recherches/mois</p>
              <p className="text-sm font-bold text-foreground">{opportunity.searchVolume.toLocaleString('fr-FR')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
            <BarChart3 size={13} className="text-muted-foreground/60" />
            <div>
              <p className="text-[10px] text-muted-foreground/60 uppercase">Difficulté</p>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-foreground">{opportunity.difficulty}</p>
                <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${colors.bar}`}
                    style={{ width: `${opportunity.difficulty}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
            <Globe size={13} className="text-muted-foreground/60" />
            <div>
              <p className="text-[10px] text-muted-foreground/60 uppercase">Position concurrent</p>
              <p className="text-sm font-bold text-foreground">#{opportunity.competitorPosition}</p>
            </div>
          </div>
        </div>

        {/* Content type + domain */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
          <span className="bg-muted/40 rounded-full px-2 py-0.5">
            {CONTENT_TYPE_LABELS[opportunity.contentType] ?? opportunity.contentType}
          </span>
          {opportunity.competitorDomain && (
            <span className="bg-muted/40 rounded-full px-2 py-0.5">
              {opportunity.competitorDomain}
            </span>
          )}
        </div>

        {/* CTA */}
        <Button
          onClick={() => onGenerate(opportunity.topic, opportunity.keywords)}
          className="w-full h-10 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-bold text-xs gap-2 shadow-lg shadow-primary/20"
        >
          <Sparkles size={14} />
          Générer dans le Studio Créatif
          <ArrowRight size={14} />
        </Button>
      </div>
    </motion.div>
  );
}
