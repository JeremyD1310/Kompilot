/**
 * PillarScoreGrid — Visual overview of the 5 AI advisory pillars
 * with scores, status badges, and key signals at a glance.
 */
import { useState } from 'react';
import { BarChart3, Brain, Globe, MapPin, Share2, TrendingUp, CircleAlert, CircleCheck, Lightbulb, ChevronRight } from 'lucide-react';
import type { AdvisoryPillar, AdvisoryPillarId } from '../../lib/advisoryTypes';

const PILLAR_ICONS: Record<AdvisoryPillarId, React.ReactNode> = {
  social: <Share2 size={18} />,
  seo:    <Globe size={18} />,
  geo:    <MapPin size={18} />,
  sea:    <TrendingUp size={18} />,
  gea:    <Brain size={18} />,
};

const STATUS_CONFIG = {
  critical:    { label: 'Critique',    bg: 'bg-red-50 border-red-200',     text: 'text-red-700',     scoreColor: 'text-red-600',    bar: 'bg-red-500',    icon: <CircleAlert size={13} className="text-red-600" /> },
  attention:   { label: 'À surveiller', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700',  scoreColor: 'text-amber-700',  bar: 'bg-amber-500',  icon: <CircleAlert size={13} className="text-amber-600" /> },
  opportunity: { label: 'Opportunité', bg: 'bg-blue-50 border-blue-200',   text: 'text-blue-700',   scoreColor: 'text-blue-700',   bar: 'bg-blue-500',   icon: <Lightbulb size={13} className="text-blue-600" /> },
  healthy:     { label: 'Sain',        bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', scoreColor: 'text-emerald-700', bar: 'bg-emerald-500', icon: <CircleCheck size={13} className="text-emerald-600" /> },
};

interface PillarScoreGridProps {
  pillars: AdvisoryPillar[];
  openPillar: AdvisoryPillarId;
  onSelectPillar: (id: AdvisoryPillarId) => void;
}

export function PillarScoreGrid({ pillars, openPillar, onSelectPillar }: PillarScoreGridProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 size={15} className="text-primary" />
        <h3 className="text-sm font-bold text-foreground">Vue d'ensemble — 5 piliers IA</h3>
        <span className="ml-auto text-[11px] text-muted-foreground">Score / 100</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {pillars.map(pillar => {
          const cfg = STATUS_CONFIG[pillar.status];
          const isOpen = openPillar === pillar.id;
          return (
            <button
              key={pillar.id}
              type="button"
              onClick={() => onSelectPillar(pillar.id)}
              className={`text-left rounded-2xl border p-4 transition-all duration-150 hover:shadow-md group ${
                isOpen
                  ? 'border-primary/50 bg-primary/5 shadow-md ring-2 ring-primary/20'
                  : `${cfg.bg} hover:border-primary/30`
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  isOpen ? 'bg-primary text-primary-foreground' : 'bg-white/80 text-muted-foreground group-hover:text-primary'
                }`}>
                  {PILLAR_ICONS[pillar.id as AdvisoryPillarId]}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {cfg.icon}
                  <ChevronRight
                    size={14}
                    className={`text-muted-foreground/50 transition-transform ${isOpen ? 'rotate-90' : 'group-hover:translate-x-0.5'}`}
                  />
                </div>
              </div>

              {/* Label + Score */}
              <p className="text-xs font-bold text-foreground mb-1 leading-snug">{pillar.label}</p>
              <p className={`text-2xl font-black tabular-nums leading-none mb-2 ${cfg.scoreColor}`}>
                {pillar.score}
              </p>

              {/* Progress bar */}
              <div className="h-1.5 w-full rounded-full bg-white/60 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${cfg.bar}`}
                  style={{ width: `${pillar.score}%` }}
                />
              </div>

              {/* Status badge */}
              <div className="mt-2.5">
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${cfg.text}`}>
                  {cfg.label}
                </span>
              </div>

              {/* First signal preview */}
              {pillar.signals.length > 0 && (
                <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
                  {pillar.signals[0]}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
