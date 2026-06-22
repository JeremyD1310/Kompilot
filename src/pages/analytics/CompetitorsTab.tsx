/**
 * CompetitorsTab — full competitor analysis module.
 * Add competitors by name + platforms → animated scan → rich comparison dashboard.
 */
import { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, Minus, Trash2, Users } from 'lucide-react';
import { Button, toast } from '@blinkdotnew/ui';
import { cn } from '../../lib/utils';
import {
  type Competitor, type PlatformId,
  PLATFORM_CONFIG, INITIAL_COMPETITORS, totalFollowers, avatarGradient,
} from './competitors/types';
import { AddCompetitorModal } from './competitors/AddCompetitorModal';
import { ComparisonPanel } from './competitors/ComparisonPanel';

import { CompetitorRadarWidget } from '../../components/analytics/CompetitorRadarWidget';

const STORAGE_KEY = 'kompilot_competitors_v2';

// ── Competitor card ───────────────────────────────────────────────────────────

function CompetitorCard({ competitor, isSelected, onSelect, onRemove }: {
  competitor: Competitor;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const gradient = avatarGradient(competitor.name);
  const initials  = competitor.name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase();
  const total     = totalFollowers(competitor);

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 space-y-3 cursor-pointer transition-all duration-200',
        isSelected
          ? 'border-primary ring-2 ring-primary/20 shadow-md bg-primary/[0.02]'
          : 'border-border hover:border-primary/30 hover:shadow-sm'
      )}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-xs font-extrabold shrink-0 shadow-sm', gradient)}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-foreground leading-tight truncate">{competitor.name}</p>
            {competitor.trend === 'up'     && <TrendingUp   size={14} className="text-emerald-500 shrink-0 mt-0.5" />}
            {competitor.trend === 'down'   && <TrendingDown size={14} className="text-red-500 shrink-0 mt-0.5" />}
            {competitor.trend === 'stable' && <Minus        size={14} className="text-muted-foreground shrink-0 mt-0.5" />}
          </div>
          {competitor.handle && <p className="text-[11px] text-muted-foreground mt-0.5">{competitor.handle}</p>}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {competitor.platforms.map((p: PlatformId) => (
              <span key={p} className={cn('text-[9px] font-bold rounded-full px-1.5 py-0.5 border',
                PLATFORM_CONFIG[p].textClass, PLATFORM_CONFIG[p].bgClass, PLATFORM_CONFIG[p].borderClass
              )}>
                {PLATFORM_CONFIG[p].emoji} {PLATFORM_CONFIG[p].label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border pt-3">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase font-medium">Abonnés</p>
          <p className="text-sm font-bold">{total.toLocaleString('fr-FR')}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase font-medium">Engagement</p>
          <p className="text-sm font-bold">{competitor.metrics.engagement}%</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase font-medium">Posts / sem.</p>
          <p className="text-sm font-bold">{competitor.metrics.postsPerWeek}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase font-medium">Dernier post</p>
          <p className="text-sm font-bold">
            {competitor.metrics.lastPostDays === 0 ? "Aujourd'hui" : `${competitor.metrics.lastPostDays}j`}
          </p>
        </div>
      </div>

      {/* Google score if available */}
      {competitor.metrics.reviewScore > 0 && (
        <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-100 px-3 py-1.5">
          <span className="text-sm">⭐</span>
          <span className="text-xs font-bold text-amber-800">{competitor.metrics.reviewScore}/5</span>
          <span className="text-[10px] text-amber-600">({competitor.metrics.reviewCount} avis)</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-0.5">
        <button
          onClick={e => { e.stopPropagation(); onSelect(); }}
          className={cn(
            'flex-1 text-xs font-semibold rounded-lg py-2 transition-all',
            isSelected
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground hover:bg-primary/10 hover:text-primary'
          )}
        >
          {isSelected ? '✓ Comparaison active' : 'Comparer →'}
        </button>
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className="w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────────

export function CompetitorsTab() {
  const [competitors, setCompetitors] = useState<Competitor[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as Competitor[];
    } catch { /* ignore */ }
    return INITIAL_COMPETITORS;
  });

  const [selectedId, setSelectedId] = useState<string>(INITIAL_COMPETITORS[0].id);
  const [addOpen, setAddOpen]        = useState(false);

  // Persist to localStorage whenever competitors change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(competitors)); } catch { /* ignore */ }
  }, [competitors]);

  const handleAdd = (c: Competitor) => {
    setCompetitors(prev => [...prev, c]);
    setSelectedId(c.id);
    setAddOpen(false);
    toast.success(`${c.name} ajouté à votre veille concurrentielle 🎯`);
  };

  const handleRemove = (id: string) => {
    setCompetitors(prev => {
      const next = prev.filter(c => c.id !== id);
      if (selectedId === id) setSelectedId(next[0]?.id ?? '');
      return next;
    });
    toast.success('Concurrent supprimé de votre veille');
  };

  const selected = competitors.find(c => c.id === selectedId) ?? null;

  return (
    <div className="space-y-6 page-enter">

      {/* ── G.E.O. Competitor Radar — IA Intelligence Layer ── */}
      <CompetitorRadarWidget />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-foreground">Veille Concurrentielle — Réseaux Sociaux</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Comparez vos métriques sociales et identifiez vos leviers de croissance prioritaires.
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)} className="shrink-0">
          <Plus size={14} className="mr-1.5" /> Ajouter un concurrent
        </Button>
      </div>

      {/* Competitor grid */}
      {competitors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {competitors.map(c => (
            <CompetitorCard
              key={c.id}
              competitor={c}
              isSelected={c.id === selectedId}
              onSelect={() => setSelectedId(c.id)}
              onRemove={() => handleRemove(c.id)}
            />
          ))}
          {/* Add placeholder card */}
          <button
            onClick={() => setAddOpen(true)}
            className="rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-card flex flex-col items-center justify-center gap-2 py-10 transition-all hover:bg-primary/5 group min-h-[200px]"
          >
            <div className="w-10 h-10 rounded-xl bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
              <Plus size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground group-hover:text-foreground">Ajouter un concurrent</p>
            <p className="text-[11px] text-muted-foreground/70">Instagram · TikTok · LinkedIn…</p>
          </button>
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center gap-4 py-20 text-center rounded-xl border-2 border-dashed border-border">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <Users size={28} className="text-muted-foreground" />
          </div>
          <div>
            <p className="font-bold text-foreground">Aucun concurrent suivi</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Ajoutez vos concurrents locaux pour comparer leurs performances et identifier vos leviers de croissance.
            </p>
          </div>
          <Button onClick={() => setAddOpen(true)}>
            <Plus size={14} className="mr-1.5" /> Ajouter mon premier concurrent
          </Button>
        </div>
      )}

      {/* Comparison panel */}
      {selected && <ComparisonPanel competitor={selected} />}

      {/* Add competitor modal */}
      <AddCompetitorModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAdd} />
    </div>
  );
}
